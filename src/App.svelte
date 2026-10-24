<script lang="ts">
  import { onMount } from 'svelte';
  import { breath } from './breath-state.svelte';
  import { blankExercise, fromTemplate, TEMPLATES, type Exercise } from './breathing/exercises';
  import { paletteFrom, type Palette } from './palette';
  import { onPrefsChange } from './prefs-live';
  import Home from './screens/home.svelte';
  import Prepare from './screens/prepare.svelte';
  import Breathing from './screens/breathing.svelte';
  import Editor from './screens/editor.svelte';
  import Settings from './screens/settings.svelte';
  import Info from './screens/info.svelte';

  type View =
    | { name: 'home' }
    | { name: 'choose' }
    | { name: 'prepare'; id: string }
    | { name: 'edit'; exercise: Exercise; isNew: boolean }
    | { name: 'settings' }
    | { name: 'info' };

  let view = $state<View>({ name: 'home' });
  let palette = $state<Palette>(paletteFrom(undefined));
  let scale = $state(1);

  // while a breathing runs, or its summary is on screen, it has the screen
  const inSession = $derived(breath.status !== 'idle' && breath.session !== null);
  const prepared = $derived.by(() => {
    const current = view;
    return current.name === 'prepare' ? breath.exercises.find((e) => e.id === current.id) : undefined;
  });

  const applyNomieValues = (plugin: any) => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const openExercise = (id: string) => (view = { name: 'prepare', id });
  const createFromTemplate = (index: number) => (view = { name: 'edit', exercise: fromTemplate(TEMPLATES[index]), isNew: true });
  const createOwn = () => (view = { name: 'edit', exercise: blankExercise(), isNew: true });
  const editExercise = (exercise: Exercise) => (view = { name: 'edit', exercise, isNew: false });
  const home = () => (view = { name: 'home' });

  onMount(() => {
    const plugin = new NomiePlugin({
      name: 'Nomie Breathe',
      emoji: '🫁',
      description: 'Guided breathing with a circle that grows and shrinks, a dot that goes round each breath, and your own breathing exercises. Logged to Nomie.',
      uses: ['createNote', 'selectTrackables', 'confirm', 'getStorageItem', 'setStorageItem'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: false,
    });
    breath.plugin = plugin;
    onPrefsChange(plugin, () => applyNomieValues(plugin));
    plugin.onRegistered(async () => {
      applyNomieValues(plugin);
      if (!breath.loaded) await breath.load(plugin);
    });
    plugin.onUIOpened(async () => {
      applyNomieValues(plugin);
      if (!breath.loaded) await breath.load(plugin);
    });
  });
</script>

<div class="root" style="--page: {palette.page}; --card: {palette.card}; --card-inner: {palette.cardInner}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --good: {palette.good}; --danger: {palette.danger}; --scale: {scale};">
  <header class="top">
    <div class="title">
      <span aria-hidden="true">🫁</span>
      <h1>Nomie Breathe</h1>
    </div>
    {#if !inSession && view.name !== 'settings' && view.name !== 'info'}
      <div class="icons">
        <button aria-label="Settings" onclick={() => (view = { name: 'settings' })}>⚙︎</button>
        <button aria-label="About" onclick={() => (view = { name: 'info' })}>ⓘ</button>
      </div>
    {/if}
  </header>

  {#if !breath.loaded}
    <p class="muted">Loading…</p>
  {:else if inSession}
    <Breathing />
  {:else if view.name === 'settings'}
    <Settings back={home} />
  {:else if view.name === 'info'}
    <Info back={home} />
  {:else if view.name === 'choose'}
    <h2>Start from</h2>
    <div class="list">
      {#each TEMPLATES as template, i (template.name)}
        <button class="choice" onclick={() => createFromTemplate(i)}>
          <span class="dot" style="background: {template.color}"></span>
          <span class="text">
            <span class="title">{template.name}</span>
            <span class="muted">{template.description}</span>
          </span>
        </button>
      {/each}
      <button class="choice" onclick={createOwn}>
        <span class="dot" style="background: var(--tint)"></span>
        <span class="text"><span class="title">Your own breathing</span><span class="muted">Choose the lengths yourself.</span></span>
      </button>
    </div>
    <button class="ghost" onclick={home}>Back</button>
  {:else if view.name === 'edit'}
    <Editor exercise={view.exercise} isNew={view.isNew} done={home} />
  {:else if view.name === 'prepare' && prepared}
    <Prepare
      exercise={prepared}
      start={(breaths) => breath.start(prepared, breaths)}
      edit={() => editExercise(prepared)}
      back={home}
    />
  {:else}
    <Home open={openExercise} create={() => (view = { name: 'choose' })} />
  {/if}
</div>

<style>
  .root { box-sizing: border-box; min-height: 100vh; max-width: 520px; margin: 0 auto; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .title { display: flex; align-items: center; gap: 8px; }
  h1 { margin: 0; font-size: calc(22px * var(--scale)); font-weight: 700; }
  h2 { margin: 12px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .icons { display: flex; gap: 6px; }
  .icons button { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(17px * var(--scale)); cursor: pointer; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .choice { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 14px 16px; border: 0; border-radius: 16px; background: var(--card); color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .dot { width: 14px; height: 14px; margin-top: 5px; border-radius: 50%; flex-shrink: 0; }
  .text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .title { font-weight: 600; }
  .ghost { display: block; width: 100%; margin-top: 12px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>

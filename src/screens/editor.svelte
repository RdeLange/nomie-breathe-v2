<script lang="ts">
  import { breath } from '../breath-state.svelte';
  import { COLOURS, MAX_PHASE_SECONDS, MAX_REPEATS, MIN_REPEATS, exerciseProblem, newExerciseId, type Exercise } from '../breathing/exercises';
  import { patternText, PHASE_LABEL } from '../breathing/pattern';

  let {
    exercise: initial,
    isNew,
    done,
  }: { exercise: Exercise; isNew: boolean; done: () => void } = $props();

  // a working copy, saved only when it is valid. It is copied once, when the editor opens.
  // svelte-ignore state_referenced_locally
  let draft = $state<Exercise>(structuredClone($state.snapshot(initial)) as Exercise);
  let problem = $state<string | null>(null);

  const phases: Array<{ key: 'inhale' | 'hold1' | 'exhale' | 'hold2'; min: number }> = [
    { key: 'inhale', min: 1 },
    { key: 'hold1', min: 0 },
    { key: 'exhale', min: 0 },
    { key: 'hold2', min: 0 },
  ];
  const step = (key: 'inhale' | 'hold1' | 'exhale' | 'hold2', min: number, delta: number) => {
    draft.pattern[key] = Math.min(MAX_PHASE_SECONDS, Math.max(min, draft.pattern[key] + delta));
  };
  const stepBreaths = (delta: number) => {
    draft.pattern.repeats = Math.min(MAX_REPEATS, Math.max(MIN_REPEATS, draft.pattern.repeats + delta));
  };

  const save = () => {
    const error = breath.saveExercise(draft);
    problem = error;
    if (!error) done();
  };
  const remove = async () => {
    if (await breath.deleteExercise(draft.id)) done();
  };
  // A copy of a valid exercise, with its own id
  const duplicate = () => {
    if (exerciseProblem(draft)) return;
    const copy: Exercise = { ...structuredClone($state.snapshot(draft)), id: newExerciseId(), name: `${draft.name} (copy)` };
    breath.saveExercise(copy);
    done();
  };
</script>

<h2>{isNew ? 'New exercise' : 'Edit exercise'}</h2>

<section class="card">
  <label class="field">
    <span class="muted">Name</span>
    <input class="input" bind:value={draft.name} placeholder="My breathing" />
  </label>
  <label class="field">
    <span class="muted">Description</span>
    <textarea class="input" rows="2" bind:value={draft.description} placeholder="What it is for"></textarea>
  </label>
</section>

<h2>Colour</h2>
<section class="card swatches">
  {#each COLOURS as c (c)}
    <button class="swatch" class:picked={draft.color === c} style="background: {c}" aria-label="Use this colour" onclick={() => (draft.color = c)}></button>
  {/each}
</section>

<h2>One breath, in seconds</h2>
<section class="card">
  {#each phases as part (part.key)}
    <div class="stepper">
      <span>{PHASE_LABEL[part.key]}{part.key === 'hold1' || part.key === 'hold2' ? ' (hold)' : ''}</span>
      <div class="controls">
        <button aria-label="Less" disabled={draft.pattern[part.key] <= part.min} onclick={() => step(part.key, part.min, -1)}>−</button>
        <span class="count">{draft.pattern[part.key]}</span>
        <button aria-label="More" disabled={draft.pattern[part.key] >= MAX_PHASE_SECONDS} onclick={() => step(part.key, part.min, 1)}>+</button>
      </div>
    </div>
  {/each}
  <p class="muted small">{patternText(draft.pattern)}</p>
</section>

<h2>Breaths</h2>
<section class="card">
  <div class="stepper">
    <span>Repeats</span>
    <div class="controls">
      <button aria-label="Fewer" disabled={draft.pattern.repeats <= MIN_REPEATS} onclick={() => stepBreaths(-1)}>−</button>
      <span class="count">{draft.pattern.repeats}</span>
      <button aria-label="More" disabled={draft.pattern.repeats >= MAX_REPEATS} onclick={() => stepBreaths(1)}>+</button>
    </div>
  </div>
</section>

{#if problem}<p class="problem">{problem}</p>{/if}
{#if !problem && exerciseProblem(draft)}<p class="muted small">{exerciseProblem(draft)}</p>{/if}

<button class="primary" onclick={save} disabled={!!exerciseProblem(draft)}>Save</button>
<div class="row-buttons">
  {#if !isNew}<button class="ghost" onclick={duplicate}>Duplicate</button>{/if}
  {#if !isNew}<button class="ghost danger" onclick={remove}>Delete</button>{/if}
  <button class="ghost" onclick={done}>Cancel</button>
</div>

<style>
  h2 { margin: 18px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .card { padding: 12px 16px; border-radius: 16px; background: var(--card); margin: 0 0 8px; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .small { font-size: calc(13px * var(--scale)); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
  .input { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; resize: vertical; }
  .swatches { display: flex; flex-wrap: wrap; gap: 10px; }
  .swatch { width: 30px; height: 30px; border: 0; border-radius: 50%; cursor: pointer; }
  .swatch.picked { outline: 2px solid var(--text); outline-offset: 2px; }
  .stepper { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--line); }
  .stepper:first-child { border-top: 0; }
  .controls { display: flex; align-items: center; gap: 14px; }
  .controls button { width: 36px; height: 36px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(18px * var(--scale)); cursor: pointer; }
  .controls button:disabled { opacity: 0.35; }
  .count { min-width: 28px; text-align: center; font-size: calc(18px * var(--scale)); font-weight: 700; font-variant-numeric: tabular-nums; }
  .problem { color: var(--danger); font-weight: 600; }
  .primary { display: block; width: 100%; margin-top: 14px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-size: calc(17px * var(--scale)); font-weight: 600; cursor: pointer; }
  .primary:disabled { opacity: 0.4; }
  .row-buttons { display: flex; gap: 8px; margin-top: 8px; }
  .ghost { flex: 1; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .danger { color: var(--danger); }
</style>

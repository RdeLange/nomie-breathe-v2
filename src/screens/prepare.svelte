<script lang="ts">
  import { breath } from '../breath-state.svelte';
  import { cycleMs, phasesOf, patternText, PHASE_LABEL } from '../breathing/pattern';
  import { MAX_REPEATS, MIN_REPEATS, type Exercise } from '../breathing/exercises';
  import { clock } from '../format';

  let {
    exercise,
    start,
    edit,
    back,
  }: { exercise: Exercise; start: (breaths: number) => void; edit: () => void; back: () => void } = $props();

  // the breaths for this session, changed before the start. It starts from the exercise's own number.
  // svelte-ignore state_referenced_locally
  let breaths = $state(exercise.pattern.repeats);
  const cycle = $derived(cycleMs({ ...exercise.pattern, repeats: breaths }));
  const minutes = $derived(clock(cycle * breaths));
  const phases = $derived(phasesOf(exercise.pattern));
  const week = $derived(breath.history.filter((e) => e.exercise === exercise.name).length);
</script>

<div class="head" style="--accent: {exercise.color}">
  <span class="dot"></span>
  <h2>{exercise.name}</h2>
</div>
{#if exercise.description}<p class="muted">{exercise.description}</p>{/if}

<section class="card">
  <p class="caption">One breath</p>
  <div class="parts">
    {#each phases as part (part.id + part.start)}
      <div class="part" style="flex: {part.end - part.start}" title="{PHASE_LABEL[part.id]} {(part.end - part.start) / 1000} s">
        <span class="part-label">{PHASE_LABEL[part.id]}</span>
        <span class="part-time">{(part.end - part.start) / 1000} s</span>
      </div>
    {/each}
  </div>
  <p class="muted small">{patternText(exercise.pattern)}</p>
</section>

<section class="card">
  <div class="stepper">
    <span>Breaths</span>
    <div class="controls">
      <button aria-label="Fewer breaths" disabled={breaths <= MIN_REPEATS} onclick={() => (breaths = Math.max(MIN_REPEATS, breaths - 1))}>−</button>
      <span class="count">{breaths}</span>
      <button aria-label="More breaths" disabled={breaths >= MAX_REPEATS} onclick={() => (breaths = Math.min(MAX_REPEATS, breaths + 1))}>+</button>
    </div>
  </div>
  <p class="muted">About {minutes} of breathing{week ? `, done ${week} time${week === 1 ? '' : 's'} before` : ''}.</p>
</section>

<button class="primary" onclick={() => start(breaths)}>Start</button>
<div class="row-buttons">
  <button class="ghost" onclick={edit}>Edit</button>
  <button class="ghost" onclick={back}>Back</button>
</div>

<style>
  .head { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
  .dot { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); }
  h2 { margin: 0; font-size: calc(24px * var(--scale)); font-weight: 700; }
  .muted { color: var(--muted); font-size: calc(15px * var(--scale)); }
  .small { font-size: calc(13px * var(--scale)); }
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .caption { margin: 0 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .parts { display: flex; gap: 4px; height: 56px; }
  .part { display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 0; border-radius: 8px; background: color-mix(in srgb, var(--accent) 35%, var(--card)); color: var(--text); padding: 2px; overflow: hidden; }
  .part-label { font-size: calc(11px * var(--scale)); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .part-time { font-size: calc(12px * var(--scale)); color: var(--muted); }
  .stepper { display: flex; align-items: center; justify-content: space-between; }
  .controls { display: flex; align-items: center; gap: 14px; }
  .controls button { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--fill); color: var(--text); font-size: calc(20px * var(--scale)); cursor: pointer; }
  .controls button:disabled { opacity: 0.35; }
  .count { min-width: 32px; text-align: center; font-size: calc(22px * var(--scale)); font-weight: 700; font-variant-numeric: tabular-nums; }
  .primary { display: block; width: 100%; margin-top: 12px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-size: calc(17px * var(--scale)); font-weight: 600; cursor: pointer; }
  .row-buttons { display: flex; gap: 8px; margin-top: 8px; }
  .ghost { flex: 1; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>

<script lang="ts">
  import { breath } from '../breath-state.svelte';
  import { patternText } from '../breathing/pattern';
  import { thisWeek } from '../history';
  import { shortDate } from '../format';

  let { open, create }: { open: (id: string) => void; create: () => void } = $props();

  const week = $derived(thisWeek(breath.history, new Date()));
  const recent = $derived(breath.history.slice(0, 3));
</script>

<section class="card week">
  <p class="caption">This week</p>
  <p class="big">{week.sessions} <span class="muted">{week.sessions === 1 ? 'session' : 'sessions'}</span></p>
  <p class="muted">{week.minutes} minutes of breathing</p>
</section>

<h2>Your breathing</h2>
{#each breath.exercises as exercise (exercise.id)}
  <button class="exercise" onclick={() => open(exercise.id)}>
    <span class="dot" style="background: {exercise.color}"></span>
    <span class="text">
      <span class="title">{exercise.name}</span>
      <span class="muted">{patternText(exercise.pattern)}</span>
    </span>
    <span class="chevron" aria-hidden="true">›</span>
  </button>
{:else}
  <p class="muted pad">No exercises left. Add one of the classic breathings again, or make your own.</p>
{/each}

<button class="primary" onclick={create}>New breathing exercise</button>

{#if recent.length}
  <h2>Recent</h2>
  <section class="card">
    {#each recent as entry (entry.at)}
      <div class="row">
        <span>{shortDate(entry.at)} · {entry.exercise}</span>
        <span class="muted">{entry.repeats} breaths{entry.early ? ' · ended early' : ''}</span>
      </div>
    {/each}
  </section>
{/if}

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .week p { margin: 0; }
  .caption { font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .big { font-size: calc(28px * var(--scale)); font-weight: 700; }
  .muted { color: var(--muted); font-size: calc(14px * var(--scale)); }
  .pad { padding: 12px 0; }
  h2 { margin: 18px 0 8px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .exercise { display: flex; align-items: center; gap: 12px; width: 100%; margin-bottom: 8px; padding: 14px 16px; border: 0; border-radius: 16px; background: var(--card); color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
  .text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .title { font-weight: 600; }
  .chevron { color: var(--muted); font-size: calc(22px * var(--scale)); }
  .primary { display: block; width: 100%; margin-top: 12px; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-size: calc(17px * var(--scale)); font-weight: 600; cursor: pointer; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  .row:first-child { border-top: 0; }
</style>

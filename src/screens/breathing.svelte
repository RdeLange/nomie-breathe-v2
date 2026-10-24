<script lang="ts">
  import { breath } from '../breath-state.svelte';
  import BreathRing from '../components/breath-ring.svelte';
  import { phasesOf, PHASE_LABEL, type PhaseId } from '../breathing/pattern';
  import { clock } from '../format';
  import { thisWeek } from '../history';

  const session = $derived(breath.session);
  const moment = $derived(session ? session.moment(breath.now) : null);
  const position = $derived(moment?.position);
  const cycleLength = $derived(session ? session.breathing / session.pattern.repeats : 1);
  // the parts as shares of one breath
  const shares = $derived(session ? phasesOf(session.pattern).map((p) => ({ id: p.id, share: (p.end - p.start) / cycleLength })) : []);

  // the circle: it grows while breathing in, stays large at the top, shrinks while breathing out, and stays small at the bottom
  const inner = $derived.by(() => {
    if (!position || moment?.ready || !position.phase) return 0;
    if (position.phase.id === 'inhale') return position.progress;
    if (position.phase.id === 'hold1') return 1;
    if (position.phase.id === 'exhale') return 1 - position.progress;
    return 0;
  });

  const label = $derived.by(() => {
    if (!session) return '';
    if (session.finished(breath.now)) return 'Done';
    if (moment?.ready) return 'Get ready';
    const phase = position?.phase?.id as PhaseId | undefined;
    return phase ? PHASE_LABEL[phase] : '';
  });
  const sub = $derived.by(() => {
    if (!session || !position) return '';
    if (moment?.ready) return String(Math.ceil(moment.readyLeft / 1000));
    if (session.finished(breath.now)) return `${session.pattern.repeats} of ${session.pattern.repeats}`;
    return `${position.cycle + 1} of ${session.pattern.repeats} · ${Math.ceil(position.left / 1000)} s`;
  });
  const week = $derived(thisWeek(breath.history, new Date()));

  // the cues: a tone when the breath moves to the next part, and a tick in the last seconds of the get-ready countdown
  let lastPhase: string | null = null;
  let lastReady = -1;
  $effect(() => {
    if (!moment || breath.status !== 'running') return;
    if (moment.ready) {
      const seconds = Math.ceil(moment.readyLeft / 1000);
      if (seconds !== lastReady) {
        breath.cue('countdown');
        lastReady = seconds;
      }
      lastPhase = null;
      return;
    }
    const id = position?.phase?.id ?? null;
    if (id !== lastPhase) {
      if (id === 'inhale') breath.cue('inhale');
      else if (id === 'exhale') breath.cue('exhale');
      lastPhase = id;
    }
  });
</script>

{#if breath.status === 'done' && breath.summary}
  <section class="card done">
    <p class="caption">{breath.summary.early ? 'Ended early' : 'Breathing complete'}</p>
    <h1>{breath.summary.early ? 'Well breathed' : 'Well done'}</h1>
    <p class="big">{breath.summary.repeats} of {session?.pattern.repeats ?? breath.summary.repeats} breaths</p>
    <p class="muted">{breath.summary.exercise} · {clock(breath.summary.seconds * 1000)} of breathing</p>
    <p class="muted">This week: {week.sessions} {week.sessions === 1 ? 'session' : 'sessions'}, {week.minutes} minutes</p>
    {#if breath.logged}
      <p class="notice">Logged to your timeline.</p>
    {:else if breath.settings.askBeforeLog}
      <button class="primary" onclick={() => breath.logSession()}>Log to timeline</button>
    {/if}
  </section>
  <button class="ghost" onclick={() => breath.reset()}>Done</button>
{:else if session}
  <div class="top">
    <p class="caption">{breath.exercise?.name ?? ''}</p>
    {#if breath.status === 'paused'}<span class="pill">Paused</span>{/if}
  </div>

  <BreathRing
    color={breath.exercise?.color ?? '#55b7a4'}
    parts={shares}
    breath={position?.breath ?? 0}
    {inner}
    active={moment?.ready ? null : (position?.phase?.id ?? null)}
    {label}
    {sub}
    dim={breath.status === 'paused'}
  />

  <div class="controls">
    <button class="main" onclick={() => breath.togglePause()}>{breath.status === 'paused' ? 'Resume' : 'Pause'}</button>
  </div>
  <button class="link danger" onclick={() => breath.endEarly()}>End breathing</button>
{/if}

<style>
  .top { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 8px; }
  .caption { margin: 0; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .pill { padding: 4px 10px; border-radius: 999px; background: var(--fill); color: var(--text); font-size: calc(13px * var(--scale)); font-weight: 600; }
  .controls { margin-top: 18px; }
  .main { display: block; width: 100%; padding: 14px; border: 0; border-radius: 14px; background: var(--tint); color: var(--on-tint); font: inherit; font-size: calc(17px * var(--scale)); font-weight: 600; cursor: pointer; }
  .link { display: block; margin: 14px auto 0; padding: 8px; border: 0; background: transparent; font: inherit; cursor: pointer; }
  .danger { color: var(--danger); }
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 8px 0; }
  .done h1 { margin: 2px 0 0; font-size: calc(28px * var(--scale)); }
  .big { margin: 6px 0 0; font-size: calc(22px * var(--scale)); font-weight: 700; }
  .muted { margin: 4px 0; color: var(--muted); font-size: calc(15px * var(--scale)); }
  .primary { display: block; width: 100%; margin-top: 12px; padding: 12px; border: 0; border-radius: 12px; background: var(--tint); color: var(--on-tint); font: inherit; font-weight: 600; cursor: pointer; }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
  .notice { margin: 12px 0 0; color: var(--good); font-weight: 600; }
</style>

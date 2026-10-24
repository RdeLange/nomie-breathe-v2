<script lang="ts">
  import { breath } from '../breath-state.svelte';
  import type { Settings } from '../settings';

  let { back }: { back: () => void } = $props();

  const update = (patch: Partial<Settings>) => breath.saveSettings({ ...breath.settings, ...patch });

  const pick = async (field: 'repeatsTracker' | 'minutesTracker') => {
    const picked = await breath.plugin.selectTrackables('tracker', false);
    const tag = picked?.[0]?.tracker?.tag;
    if (tag) update({ [field]: tag });
  };
</script>

<section class="card">
  <p class="caption">Trackers</p>
  <div class="row">
    <span>Breaths</span>
    <span class="muted">{breath.settings.repeatsTracker ? `#${breath.settings.repeatsTracker}` : 'None'}</span>
  </div>
  <div class="actions">
    <button class="chip" onclick={() => pick('repeatsTracker')}>{breath.settings.repeatsTracker ? 'Change' : 'Choose'}</button>
    {#if breath.settings.repeatsTracker}<button class="chip danger" onclick={() => update({ repeatsTracker: null })}>Remove</button>{/if}
  </div>
  <div class="row">
    <span>Time (in seconds)</span>
    <span class="muted">{breath.settings.minutesTracker ? `#${breath.settings.minutesTracker}` : 'None'}</span>
  </div>
  <div class="actions">
    <button class="chip" onclick={() => pick('minutesTracker')}>{breath.settings.minutesTracker ? 'Change' : 'Choose'}</button>
    {#if breath.settings.minutesTracker}<button class="chip danger" onclick={() => update({ minutesTracker: null })}>Remove</button>{/if}
  </div>
</section>

<section class="card">
  <p class="caption">Timeline</p>
  <label class="field">
    <span class="muted">Text of the log</span>
    <textarea rows="3" value={breath.settings.logEntry} oninput={(e) => update({ logEntry: e.currentTarget.value })}></textarea>
    <span class="hint">&lt;breathing&gt; is the exercise, &lt;repeats&gt; the breaths, &lt;minutes&gt; the time.</span>
  </label>
  <div class="row">
    <span>Ask before logging</span>
    <button class="toggle" class:on={breath.settings.askBeforeLog} aria-pressed={breath.settings.askBeforeLog} aria-label="Ask before logging" onclick={() => update({ askBeforeLog: !breath.settings.askBeforeLog })}></button>
  </div>
</section>

<section class="card">
  <div class="row">
    <span>Sound</span>
    <button class="toggle" class:on={breath.settings.sound} aria-pressed={breath.settings.sound} aria-label="Sound" onclick={() => update({ sound: !breath.settings.sound })}></button>
  </div>
  <p class="hint">A tone when you breathe in and when you breathe out.</p>
  <div class="row">
    <span>Vibration</span>
    <button class="toggle" class:on={breath.settings.vibrate} aria-pressed={breath.settings.vibrate} aria-label="Vibration" onclick={() => update({ vibrate: !breath.settings.vibrate })}></button>
  </div>
  <p class="hint">On the devices that can vibrate, at each change of breath.</p>
</section>

<section class="card">
  <p class="muted">{breath.history.length} sessions in your history.</p>
  <button class="link danger" onclick={() => breath.clearHistory()}>Clear the history</button>
</section>

<button class="ghost" onclick={back}>Back</button>

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; }
  .caption { margin: 0 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid var(--line); }
  .row:first-of-type { border-top: 0; }
  .muted { color: var(--muted); }
  .hint { margin: 2px 0 6px; font-size: calc(13px * var(--scale)); color: var(--muted); }
  .field { display: flex; flex-direction: column; gap: 4px; padding: 10px 0 4px; }
  textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 0; border-radius: 12px; background: var(--card-inner, var(--fill)); color: var(--text); font: inherit; resize: vertical; }
  .actions { display: flex; gap: 8px; padding-bottom: 6px; }
  .chip { padding: 8px 12px; border: 0; border-radius: 10px; background: var(--fill); color: var(--tint); font: inherit; cursor: pointer; }
  .chip.danger { color: var(--danger); }
  .toggle { position: relative; width: 50px; height: 30px; border: 0; border-radius: 15px; background: var(--fill); cursor: pointer; flex-shrink: 0; }
  .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
  .toggle.on { background: var(--tint); }
  .toggle.on::after { transform: translateX(20px); }
  .link { padding: 8px 0; border: 0; background: transparent; font: inherit; cursor: pointer; }
  .danger { color: var(--danger); }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>

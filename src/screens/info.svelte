<script lang="ts">
  let { back }: { back: () => void } = $props();
</script>

<section class="card">
  <p class="caption">About</p>
  <p>Guided breathing with a circle that grows as you breathe in and shrinks as you breathe out. A dot goes round the ring over each breath, so you always know where you are.</p>
  <p>The six classic breathings are the ones of Nomie Breathe v1. Make your own with any lengths for the four parts of a breath.</p>
</section>

<section class="card">
  <p class="caption">Before you start</p>
  <p>Find a comfortable position and breathe through your nose. You get three seconds to get ready before the first breath.</p>
</section>

<button class="ghost" onclick={back}>Back</button>

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; line-height: 1.45; }
  .card p { margin: 6px 0; }
  .caption { font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>

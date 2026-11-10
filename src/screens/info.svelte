<script lang="ts">
  import { t } from '../i18n/index.svelte';
  let { back }: { back: () => void } = $props();
</script>

<section class="card">
  <p class="caption">{t('aboutHead')}</p>
  <p>{t('infoAbout1')}</p>
  <p>{t('infoAbout2')}</p>
</section>

<section class="card">
  <p class="caption">{t('beforeStart')}</p>
  <p>{t('infoBefore')}</p>
</section>

<button class="ghost" onclick={back}>{t('back')}</button>

<style>
  .card { padding: 14px 16px; border-radius: 16px; background: var(--card); margin: 12px 0; line-height: 1.45; }
  .card p { margin: 6px 0; }
  .caption { font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .ghost { display: block; width: 100%; margin-top: 8px; padding: 12px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
</style>

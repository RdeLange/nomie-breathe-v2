<script lang="ts">
  // The guide of a breath, as in v1: a circle that grows while you breathe in and shrinks while you breathe out, and a dot
  // that goes round the ring over one breath. The ring shows the four parts of the breath in arcs, and the part that runs is lit.
  import type { PhaseId } from '../breathing/pattern';

  type Part = { id: PhaseId; share: number };

  let {
    color,
    parts,
    breath,
    inner,
    active,
    label,
    sub,
    dim = false,
  }: {
    color: string;
    // the parts of the breath, each with its share of the breath (the shares add up to 1)
    parts: Part[];
    // how far round the ring the breath has got, from 0 to 1 (the dot)
    breath: number;
    // the size of the inner circle, from 0 (small) to 1 (large)
    inner: number;
    // the part that runs now, or null
    active: PhaseId | null;
    label: string;
    sub: string;
    dim?: boolean;
  } = $props();

  const R = 100;
  const C = 2 * Math.PI * R;
  const gradient = `breath-grad-${Math.random().toString(36).slice(2, 8)}`;

  // where each part starts on the ring, as a share of the breath
  const arcs = $derived(
    parts.reduce<Array<Part & { start: number }>>((list, part) => {
      const start = list.length ? list[list.length - 1].start + list[list.length - 1].share : 0;
      return [...list, { ...part, start }];
    }, []),
  );

  const dot = $derived({
    x: 120 + R * Math.sin(breath * 2 * Math.PI),
    y: 120 - R * Math.cos(breath * 2 * Math.PI),
  });
  const innerRadius = $derived(34 + 58 * inner);
</script>

<div class="ring" class:dim>
  <svg viewBox="0 0 240 240" role="img" aria-label="{label}. {sub}">
    <defs>
      <radialGradient id={gradient} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color={color} stop-opacity="0.45" />
        <stop offset="100%" stop-color={color} stop-opacity="0.95" />
      </radialGradient>
    </defs>

    <!-- the track: the whole breath, in the colour of the exercise -->
    <circle cx="120" cy="120" r={R} class="track" />

    <!-- the parts of the breath, each an arc; the one that runs is lit -->
    {#each arcs as arc (arc.id + arc.start)}
      <circle
        cx="120"
        cy="120"
        r={R}
        class="arc"
        class:lit={active === arc.id}
        stroke={color}
        stroke-dasharray="{Math.max(0, arc.share * C - 2)} {C}"
        stroke-dashoffset={-arc.start * C}
      />
    {/each}

    <!-- the circle that grows and shrinks -->
    <circle cx="120" cy="120" r={innerRadius} fill="url(#{gradient})" class="breathing" />

    <!-- the dot that goes round the ring -->
    <circle cx={dot.x} cy={dot.y} r="8" class="dot" stroke={color} />
  </svg>

  <div class="words" aria-hidden="true">
    <p class="label">{label}</p>
    <p class="sub">{sub}</p>
  </div>
</div>

<style>
  .ring {
    position: relative;
    width: min(78vw, 300px);
    aspect-ratio: 1;
    margin: 0 auto;
    transition: opacity 0.3s ease;
  }
  .ring.dim {
    opacity: 0.55;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .track {
    fill: none;
    stroke: var(--fill);
    stroke-width: 4;
  }
  .arc {
    fill: none;
    stroke-width: 6;
    stroke-linecap: butt;
    opacity: 0.35;
    transform: rotate(-90deg);
    transform-origin: 120px 120px;
  }
  .arc.lit {
    opacity: 1;
    stroke-width: 10;
  }
  .breathing {
    filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.18));
  }
  .dot {
    fill: #fff;
    stroke-width: 4;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  }
  .words {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
  }
  .label {
    margin: 0;
    font-size: calc(20px * var(--scale));
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
  }
  .sub {
    margin: 2px 0 0;
    font-size: calc(15px * var(--scale));
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
    font-variant-numeric: tabular-nums;
  }
  @media (prefers-reduced-motion: reduce) {
    .ring {
      transition: none;
    }
  }
</style>

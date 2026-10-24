// A breathing pattern: how long each part of a breath lasts, and how many breaths. Everything is worked out from the
// time since the start, so the circle, the words and the count always agree.

// The lengths are in seconds. A hold of 0 seconds is left out.
export type Pattern = { inhale: number; hold1: number; exhale: number; hold2: number; repeats: number };

export type PhaseId = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export const PHASE_LABEL: Record<PhaseId, string> = {
  inhale: 'Breathe in',
  hold1: 'Hold',
  exhale: 'Breathe out',
  hold2: 'Hold',
};

// One part of a breath, with its start and end in milliseconds from the start of the breath
export type Phase = { id: PhaseId; start: number; end: number };

// Where the breathing is at a moment: the breath it is in, the phase, and how far into the phase
export type Position = {
  // the breath (0 to repeats - 1); once the pattern is over it is the last one
  cycle: number;
  // null once the pattern is over
  phase: Phase | null;
  // the share of the phase that has passed, from 0 to 1
  progress: number;
  // the share of the breath that has passed, from 0 to 1 (the dot on the ring)
  breath: number;
  left: number;
  finished: boolean;
};

export const cycleMs = (p: Pattern): number => Math.round((p.inhale + p.hold1 + p.exhale + p.hold2) * 1000);

export const totalMs = (p: Pattern): number => cycleMs(p) * p.repeats;

// The phases of one breath, the ones of length 0 left out
export const phasesOf = (p: Pattern): Phase[] => {
  const lengths: Array<[PhaseId, number]> = [
    ['inhale', p.inhale],
    ['hold1', p.hold1],
    ['exhale', p.exhale],
    ['hold2', p.hold2],
  ];
  let start = 0;
  const phases: Phase[] = [];
  for (const [id, seconds] of lengths) {
    if (seconds <= 0) continue;
    const end = start + Math.round(seconds * 1000);
    phases.push({ id, start, end });
    start = end;
  }
  return phases;
};

// Where the pattern is `ms` after it started
export const positionAt = (p: Pattern, ms: number): Position => {
  const cycle = cycleMs(p);
  const total = cycle * p.repeats;
  if (cycle <= 0 || ms >= total) {
    return { cycle: Math.max(0, p.repeats - 1), phase: null, progress: 1, breath: 1, left: 0, finished: true };
  }
  const index = Math.floor(ms / cycle);
  const inCycle = ms - index * cycle;
  const phases = phasesOf(p);
  const phase = phases.find((ph) => inCycle >= ph.start && inCycle < ph.end) ?? phases[phases.length - 1];
  return {
    cycle: index,
    phase,
    progress: (inCycle - phase.start) / (phase.end - phase.start),
    breath: inCycle / cycle,
    left: phase.end - inCycle,
    finished: false,
  };
};

// The pattern in words, as the library shows it: 4 · 4 · 6 · 0, 6 breaths. A hold of 0 is shown as a dash.
export const patternText = (p: Pattern): string => {
  const parts = [p.inhale, p.hold1, p.exhale, p.hold2].map((s) => (s > 0 ? String(s) : '–')).join(' · ');
  return `${parts} · ${p.repeats} ${p.repeats === 1 ? 'breath' : 'breaths'}`;
};

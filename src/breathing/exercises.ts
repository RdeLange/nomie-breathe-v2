// The breathing exercises: the six predefined ones of v1, and the ones the user makes. Their rules live here.
import type { Pattern } from './pattern';

export type Exercise = {
  id: string;
  name: string;
  description: string;
  // the colour of the exercise, on its card and in the circle
  color: string;
  pattern: Pattern;
};

export const MAX_PHASE_SECONDS = 20;
export const MIN_REPEATS = 1;
export const MAX_REPEATS = 50;

export const COLOURS = ['#C47ADA', '#90BAEE', '#75BAFA', '#FBE66E', '#F5B969', '#EDBD4A', '#55b7a4', '#FF6961', '#3366ff', '#8E8E93'];

// The predefined exercises of v1, the same patterns and colours
export const TEMPLATES: Array<Omit<Exercise, 'id'>> = [
  {
    name: 'Deep breathing',
    description: 'An easy way to relax and let your worries go. Also called belly breathing, it helps ease stress and can lower your blood pressure.',
    color: '#C47ADA',
    pattern: { inhale: 4, hold1: 4, exhale: 6, hold2: 0, repeats: 6 },
  },
  {
    name: 'Continuous breathing',
    description: 'A technique used by singers and wind players to keep a steady tone. It helps you keep sound going for long periods.',
    color: '#90BAEE',
    pattern: { inhale: 4, hold1: 0, exhale: 4, hold2: 2, repeats: 7 },
  },
  {
    name: 'Box breathing',
    description: 'Used by athletes, nurses and others who need to stay calm under pressure. Good for meditation and for reducing stress.',
    color: '#75BAFA',
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, repeats: 10 },
  },
  {
    name: 'Equal breathing',
    description: 'Breathe in for as long as you breathe out. A smooth and steady breath can bring balance and calm.',
    color: '#FBE66E',
    pattern: { inhale: 4, hold1: 0, exhale: 4, hold2: 0, repeats: 4 },
  },
  {
    name: '4-7-8 breathing',
    description: 'A pattern that aims to reduce anxiety and help you get to sleep.',
    color: '#F5B969',
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0, repeats: 8 },
  },
  {
    name: 'Rhythmic breathing',
    description: 'A simple technique for beginners, suitable for anyone who can breathe without difficulty.',
    color: '#EDBD4A',
    pattern: { inhale: 6, hold1: 3, exhale: 6, hold2: 3, repeats: 9 },
  },
];

// The first thing wrong with an exercise, or null when it can be saved
export const exerciseProblem = (e: Exercise): string | null => {
  if (!e.name.trim()) return 'Give the exercise a name.';
  const { inhale, hold1, exhale, hold2, repeats } = e.pattern;
  if (inhale < 1) return 'Breathing in needs at least one second.';
  if ([hold1, exhale, hold2].some((s) => s < 0 || s > MAX_PHASE_SECONDS) || inhale > MAX_PHASE_SECONDS) {
    return `Each part is between 0 and ${MAX_PHASE_SECONDS} seconds.`;
  }
  if (repeats < MIN_REPEATS || repeats > MAX_REPEATS) return `The breaths are between ${MIN_REPEATS} and ${MAX_REPEATS}.`;
  return null;
};

const clamp = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

const isColour = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

// Reads the saved exercises. Values are kept within their limits; an exercise without a name is left out.
export const normaliseExercises = (saved: unknown): Exercise[] => {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((e: any): Exercise[] => {
    if (typeof e?.id !== 'string' || typeof e?.name !== 'string' || !e.name.trim() || !e.pattern) return [];
    const p = e.pattern;
    return [
      {
        id: e.id,
        name: e.name.trim(),
        description: String(e.description ?? ''),
        color: isColour(e.color) ? e.color : COLOURS[0],
        pattern: {
          inhale: clamp(p.inhale, 1, MAX_PHASE_SECONDS, 4),
          hold1: clamp(p.hold1, 0, MAX_PHASE_SECONDS, 0),
          exhale: clamp(p.exhale, 0, MAX_PHASE_SECONDS, 4),
          hold2: clamp(p.hold2, 0, MAX_PHASE_SECONDS, 0),
          repeats: clamp(p.repeats, MIN_REPEATS, MAX_REPEATS, 6),
        },
      },
    ];
  });
};

let made = 0;
// A new id, unique in one list
export const newExerciseId = (): string => `e${Date.now().toString(36)}${(made++).toString(36)}`;

export const fromTemplate = (template: Omit<Exercise, 'id'>): Exercise => ({
  ...template,
  id: newExerciseId(),
  pattern: { ...template.pattern },
});

export const blankExercise = (): Exercise => ({
  id: newExerciseId(),
  name: '',
  description: '',
  color: COLOURS[1],
  pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 0, repeats: 6 },
});

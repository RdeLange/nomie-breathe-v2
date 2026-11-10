import { t } from '../i18n/index.svelte';
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
    get name() { return t('deepName'); },
    get description() { return t('deepDesc'); },
    color: '#C47ADA',
    pattern: { inhale: 4, hold1: 4, exhale: 6, hold2: 0, repeats: 6 },
  },
  {
    get name() { return t('continuousName'); },
    get description() { return t('continuousDesc'); },
    color: '#90BAEE',
    pattern: { inhale: 4, hold1: 0, exhale: 4, hold2: 2, repeats: 7 },
  },
  {
    get name() { return t('boxName'); },
    get description() { return t('boxDesc'); },
    color: '#75BAFA',
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, repeats: 10 },
  },
  {
    get name() { return t('equalName'); },
    get description() { return t('equalDesc'); },
    color: '#FBE66E',
    pattern: { inhale: 4, hold1: 0, exhale: 4, hold2: 0, repeats: 4 },
  },
  {
    get name() { return t('relaxName'); },
    get description() { return t('relaxDesc'); },
    color: '#F5B969',
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0, repeats: 8 },
  },
  {
    get name() { return t('rhythmicName'); },
    get description() { return t('rhythmicDesc'); },
    color: '#EDBD4A',
    pattern: { inhale: 6, hold1: 3, exhale: 6, hold2: 3, repeats: 9 },
  },
];

// The first thing wrong with an exercise, or null when it can be saved
export const exerciseProblem = (e: Exercise): string | null => {
  if (!e.name.trim()) return t('giveName');
  const { inhale, hold1, exhale, hold2, repeats } = e.pattern;
  if (inhale < 1) return t('inhaleMin');
  if ([hold1, exhale, hold2].some((s) => s < 0 || s > MAX_PHASE_SECONDS) || inhale > MAX_PHASE_SECONDS) {
    return t('partRange', { max: MAX_PHASE_SECONDS });
  }
  if (repeats < MIN_REPEATS || repeats > MAX_REPEATS) return t('breathsRange', { min: MIN_REPEATS, max: MAX_REPEATS });
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

import { describe, expect, it } from 'vitest';
import { cycleMs, patternText, phasesOf, positionAt, totalMs, type Pattern } from '../breathing/pattern';
import { BreathingSession, READY_MS } from '../breathing/session';
import { exerciseProblem, normaliseExercises, TEMPLATES, MAX_PHASE_SECONDS, type Exercise } from '../breathing/exercises';
import { breathingNote, logText, timeText } from '../log';
import { addEntry, normaliseHistory, startOfWeek, thisWeek, type Entry } from '../history';
import { normaliseSettings, DEFAULT_SETTINGS } from '../settings';

// 4 in, 4 hold, 6 out, no hold, 3 breaths: each breath is 14 s
const pattern: Pattern = { inhale: 4, hold1: 4, exhale: 6, hold2: 0, repeats: 3 };

describe('the pattern', () => {
  it('a breath lasts the four parts together, and the pattern the breaths', () => {
    expect(cycleMs(pattern)).toBe(14000);
    expect(totalMs(pattern)).toBe(42000);
  });

  it('a hold of 0 seconds is left out of the phases', () => {
    expect(phasesOf(pattern).map((p) => p.id)).toEqual(['inhale', 'hold1', 'exhale']);
  });

  it('tells the phase, the progress in it and the time left in it', () => {
    expect(positionAt(pattern, 2000)).toMatchObject({ cycle: 0, progress: 0.5, left: 2000, finished: false });
    expect(positionAt(pattern, 2000).phase?.id).toBe('inhale');
    expect(positionAt(pattern, 9000).phase?.id).toBe('exhale');
  });

  it('the second breath starts again at the inhale, and counts as the next breath', () => {
    const at = positionAt(pattern, 14000);
    expect(at.cycle).toBe(1);
    expect(at.phase?.id).toBe('inhale');
    expect(at.progress).toBe(0);
  });

  it('after the last breath the pattern is finished', () => {
    expect(positionAt(pattern, 42000)).toMatchObject({ finished: true, phase: null });
  });

  it('shows the pattern in words, with a dash for a hold of 0', () => {
    expect(patternText(pattern)).toBe('4 · 4 · 6 · – · 3 breaths');
  });
});

describe('the session: one clock, and a get-ready countdown first', () => {
  it('counts down before the first breath', () => {
    const session = new BreathingSession(pattern);
    session.start(0);
    expect(session.moment(1000)).toMatchObject({ ready: true, readyLeft: READY_MS - 1000 });
    expect(session.moment(READY_MS + 1000).ready).toBe(false);
  });

  it('pausing stops the breathing and the countdown, and they carry on from the same point', () => {
    const session = new BreathingSession(pattern);
    session.start(0);
    session.pause(5000);
    expect(session.elapsed(60000)).toBe(5000);
    session.resume(60000);
    expect(session.moment(61000).position.phase?.id).toBe('inhale');
    expect(session.elapsed(61000)).toBe(6000);
  });

  it('counts the breaths that are over', () => {
    const session = new BreathingSession(pattern);
    session.start(0);
    expect(session.completedBreaths(READY_MS + 13999)).toBe(0);
    expect(session.completedBreaths(READY_MS + 14000)).toBe(1);
    expect(session.completedBreaths(READY_MS + 100000)).toBe(3);
    expect(session.finished(READY_MS + 42000)).toBe(true);
  });
});

describe('exercises', () => {
  const exercise = (over: Partial<Pattern> = {}, name = 'Mine'): Exercise => ({ id: 'a', name, description: '', color: '#C47ADA', pattern: { ...pattern, ...over } });

  it('the predefined exercises are valid, and there are six of them', () => {
    expect(TEMPLATES.length).toBe(6);
    for (const t of TEMPLATES) expect(exerciseProblem({ ...t, id: 'x' })).toBeNull();
  });

  it('an exercise needs a name, an inhale, and parts and breaths within their limits', () => {
    expect(exerciseProblem(exercise({}, ' '))).toBeTruthy();
    expect(exerciseProblem(exercise({ inhale: 0 }))).toBeTruthy();
    expect(exerciseProblem(exercise({ hold1: MAX_PHASE_SECONDS + 1 }))).toBeTruthy();
    expect(exerciseProblem(exercise({ repeats: 0 }))).toBeTruthy();
    expect(exerciseProblem(exercise({ repeats: 51 }))).toBeTruthy();
    expect(exerciseProblem(exercise())).toBeNull();
  });

  it('a saved exercise is kept within the limits, and one without a name is left out', () => {
    const [kept] = normaliseExercises([{ id: 'a', name: ' Calm ', color: 'red', pattern: { inhale: 99, hold1: -4, exhale: 4, hold2: 0, repeats: 'x' } }]);
    expect(kept.name).toBe('Calm');
    expect(kept.color).toBe('#C47ADA');
    expect(kept.pattern).toEqual({ inhale: MAX_PHASE_SECONDS, hold1: 0, exhale: 4, hold2: 0, repeats: 6 });
    expect(normaliseExercises([{ id: 'b', name: ' ', pattern }])).toEqual([]);
  });
});

describe('the log and the history', () => {
  it('writes the time the way v1 did', () => {
    expect(timeText(192)).toBe('3 minutes 12 seconds');
    expect(logText(DEFAULT_SETTINGS.logEntry, { exercise: 'Box', repeats: 10, seconds: 140 })).toBe(
      'Just finished Box exercise with total of 10 repeats taking 2 minutes 20 seconds.',
    );
  });

  it('writes the trackers with their values: seconds for the time, the breaths for the repeats', () => {
    const note = breathingNote(
      { ...DEFAULT_SETTINGS, minutesTracker: 'breathtime', repeatsTracker: 'breaths' },
      { exercise: 'Box', repeats: 10, seconds: 140 },
    );
    expect(note).toContain('#breathtime(140)');
    expect(note).toContain('#breaths(10)');
    expect(breathingNote({ ...DEFAULT_SETTINGS }, { exercise: 'Box', repeats: 10, seconds: 140 })).not.toContain('#');
  });

  it('the week counts the sessions finished, not the ones ended early, and their seconds', () => {
    const wednesday = new Date(2026, 9, 21, 12);
    expect(startOfWeek(wednesday).getDay()).toBe(1);
    const entry = (day: number, seconds: number, early = false): Entry => ({ at: new Date(2026, 9, day, 9).toISOString(), exercise: 'Box', repeats: 4, seconds, early });
    const history = addEntry(addEntry([], entry(20, 300)), entry(21, 180));
    expect(thisWeek([...history, entry(19, 900, true)], wednesday)).toEqual({ sessions: 2, minutes: 8 });
    expect(normaliseHistory([{ at: 'nope', exercise: 'x' }])).toEqual([]);
  });

  it('the settings fall back to the defaults', () => {
    const settings = normaliseSettings({ repeatsTracker: 'none', logEntry: 4, sound: 'yes' });
    expect(settings.repeatsTracker).toBeNull();
    expect(settings.logEntry).toBe(DEFAULT_SETTINGS.logEntry);
    expect(settings.sound).toBe(true);
  });
});

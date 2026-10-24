// The state of the plugin: the exercises, the settings, the history, and the session that runs now.
// The screens show it and call its actions.
import { playCue, unlockAudio } from './audio';
import { BreathingSession, READY_MS } from './breathing/session';
import { exerciseProblem, fromTemplate, normaliseExercises, TEMPLATES, type Exercise } from './breathing/exercises';
import { breathingNote } from './log';
import { addEntry, normaliseHistory, type Entry } from './history';
import { DEFAULT_SETTINGS, normaliseSettings, type Settings } from './settings';

class BreathState {
  plugin: any = null;
  loaded = $state(false);
  exercises = $state<Exercise[]>([]);
  settings = $state<Settings>(DEFAULT_SETTINGS);
  history = $state<Entry[]>([]);

  // the exercise chosen on the start screen, and the breaths for the next session
  chosen = $state<Exercise | null>(null);
  breaths = $state(6);

  // the session that runs now. `now` is read from the clock on every frame, so the screen follows it.
  session = $state.raw<BreathingSession | null>(null);
  exercise = $state<Exercise | null>(null);
  status = $state<'idle' | 'running' | 'paused' | 'done'>('idle');
  now = $state(0);
  summary = $state<Entry | null>(null);
  logged = $state(false);

  private frame: number | null = null;
  private wakeLock: any = null;

  // Reads the saved exercises, settings and history
  async load(plugin: any): Promise<void> {
    this.plugin = plugin;
    await plugin.storage.init();
    const stored = plugin.storage.getItem('exercises');
    // a new user starts with the six classic breathings, and can delete the ones they do not need
    this.exercises = stored === undefined ? TEMPLATES.map((t) => fromTemplate(t)) : normaliseExercises(stored);
    if (stored === undefined) this.plugin?.storage.setItem('exercises', $state.snapshot(this.exercises));
    this.settings = normaliseSettings(plugin.storage.getItem('settings'));
    this.history = normaliseHistory(plugin.storage.getItem('history'));
    this.loaded = true;
  }

  private saveAll(): void {
    this.plugin?.storage.setItem('exercises', $state.snapshot(this.exercises));
    this.plugin?.storage.setItem('settings', $state.snapshot(this.settings));
    this.plugin?.storage.setItem('history', $state.snapshot(this.history));
  }

  saveSettings(next: Settings): void {
    this.settings = normaliseSettings(next);
    this.plugin?.storage.setItem('settings', $state.snapshot(this.settings));
  }

  // Adds or changes an exercise. Returns the problem, or null when it was saved.
  saveExercise(exercise: Exercise): string | null {
    const problem = exerciseProblem(exercise);
    if (problem) return problem;
    const next = { ...$state.snapshot(exercise), name: exercise.name.trim() };
    const exists = this.exercises.some((e) => e.id === next.id);
    this.exercises = exists ? this.exercises.map((e) => (e.id === next.id ? next : e)) : [...this.exercises, next];
    this.plugin?.storage.setItem('exercises', $state.snapshot(this.exercises));
    return null;
  }

  async deleteExercise(id: string): Promise<boolean> {
    const name = this.exercises.find((e) => e.id === id)?.name ?? '';
    const res = await this.plugin.confirm('Delete this exercise?', `"${name}" is removed from your exercises. Your history is kept.`);
    if (!res?.value) return false;
    this.exercises = this.exercises.filter((e) => e.id !== id);
    this.plugin?.storage.setItem('exercises', $state.snapshot(this.exercises));
    return true;
  }

  async clearHistory(): Promise<void> {
    const res = await this.plugin.confirm('Clear the history?', 'The sessions you finished are removed from the plugin. Your timeline is not changed.');
    if (!res?.value) return;
    this.history = [];
    this.plugin?.storage.setItem('history', []);
  }

  // Starts the breathing of an exercise, with the chosen number of breaths
  start(exercise: Exercise, breaths: number): void {
    unlockAudio();
    this.exercise = exercise;
    this.session = new BreathingSession({ ...exercise.pattern, repeats: breaths });
    this.summary = null;
    this.logged = false;
    this.session.start(performance.now());
    this.now = performance.now();
    this.status = 'running';
    this.startFrames();
    this.keepAwake();
  }

  togglePause(): void {
    if (!this.session) return;
    const at = performance.now();
    if (this.status === 'running') {
      this.session.pause(at);
      this.status = 'paused';
      this.stopFrames();
    } else if (this.status === 'paused') {
      this.session.resume(at);
      this.status = 'running';
      this.startFrames();
    }
    this.now = at;
  }

  // Ends the breathing. The breaths that were finished are kept, and logged when the settings say so.
  finish(early: boolean): void {
    if (!this.session || !this.exercise || this.status === 'done') return;
    const at = performance.now();
    this.now = at;
    this.stopFrames();
    this.releaseWakeLock();
    // the seconds of breathing: the time past the get-ready countdown, never more than the pattern
    const breathed = Math.min(Math.max(0, this.session.elapsed(at) - READY_MS), this.session.breathing);
    const seconds = Math.round(breathed / 1000);
    const entry: Entry = {
      at: new Date().toISOString(),
      exercise: this.exercise.name,
      repeats: early ? this.session.completedBreaths(at) : this.session.pattern.repeats,
      seconds,
      early,
    };
    this.summary = entry;
    this.history = addEntry(this.history, entry);
    this.plugin?.storage.setItem('history', $state.snapshot(this.history));
    this.status = 'done';
    if (!early) this.cue('done');
    if (!this.settings.askBeforeLog) this.logSession();
  }

  // Writes the session to the timeline, with the trackers that are chosen
  logSession(): void {
    if (!this.summary || this.logged) return;
    this.plugin.createNote(
      breathingNote(this.settings, { exercise: this.summary.exercise, repeats: this.summary.repeats, seconds: this.summary.seconds }),
    );
    this.logged = true;
  }

  // Ends the session early, after a confirmation
  async endEarly(): Promise<void> {
    const res = await this.plugin.confirm('End the breathing now?', 'What you finished so far is kept in your history.');
    if (res?.value) this.finish(true);
  }

  // Back to the start screen
  reset(): void {
    this.session = null;
    this.exercise = null;
    this.summary = null;
    this.status = 'idle';
  }

  // The cues of a change of breath: a tone and, if chosen, a short vibration
  cue(kind: 'inhale' | 'exhale' | 'change' | 'countdown' | 'done'): void {
    if (this.settings.sound) playCue(kind);
    if (this.settings.vibrate) (navigator as any).vibrate?.(kind === 'done' ? [60, 60, 60] : 30);
  }

  private startFrames(): void {
    this.stopFrames();
    const tick = () => {
      this.now = performance.now();
      if (this.session?.finished(this.now)) {
        this.finish(false);
        return;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stopFrames(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private async keepAwake(): Promise<void> {
    try {
      this.wakeLock = await (navigator as any).wakeLock?.request('screen');
    } catch {
      this.wakeLock = null;
    }
  }

  private releaseWakeLock(): void {
    this.wakeLock?.release?.();
    this.wakeLock = null;
  }
}

export const breath = new BreathState();

// The settings of the plugin: the trackers the results go to, the log text, and the cues.
export type Settings = {
  // the tracker for the number of breaths, and the tracker for the time (its value is in seconds); a tag, or null
  repeatsTracker: string | null;
  minutesTracker: string | null;
  // the text of the log. <breathing> is the exercise, <repeats> the breaths, <minutes> the time.
  logEntry: string;
  // ask before the result is written to the timeline
  askBeforeLog: boolean;
  // a tone when the breath changes
  sound: boolean;
  // a short vibration when the breath changes, on the devices that have one
  vibrate: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  repeatsTracker: null,
  minutesTracker: null,
  logEntry: 'Just finished <breathing> exercise with total of <repeats> repeats taking <minutes>.',
  askBeforeLog: true,
  sound: true,
  vibrate: false,
};

const tagOrNull = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' && value !== 'none' ? value : null);

export const normaliseSettings = (saved: any): Settings => ({
  repeatsTracker: tagOrNull(saved?.repeatsTracker),
  minutesTracker: tagOrNull(saved?.minutesTracker),
  logEntry: typeof saved?.logEntry === 'string' ? saved.logEntry : DEFAULT_SETTINGS.logEntry,
  askBeforeLog: typeof saved?.askBeforeLog === 'boolean' ? saved.askBeforeLog : true,
  sound: typeof saved?.sound === 'boolean' ? saved.sound : true,
  vibrate: typeof saved?.vibrate === 'boolean' ? saved.vibrate : false,
});

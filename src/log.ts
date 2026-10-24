// The note a breathing session writes to the timeline, and the text it uses. v1 replaced <breathing>, <repeats> and <minutes>.
import type { Settings } from './settings';

export type Finished = {
  exercise: string;
  // the breaths that were done
  repeats: number;
  // the seconds that were breathed
  seconds: number;
};

// "3 minutes 12 seconds", as v1 wrote the time
export const timeText = (seconds: number): string => `${Math.floor(seconds / 60)} minutes ${Math.round(seconds % 60)} seconds`;

// The log text with the placeholders filled in
export const logText = (entry: string, finished: Finished): string =>
  entry
    .replace('<repeats>', String(finished.repeats))
    .replace('<minutes>', timeText(finished.seconds))
    .replace('<breathing>', finished.exercise);

// The note for the timeline: the heading, the text and, for the trackers that are chosen, their values
export const breathingNote = (settings: Settings, finished: Finished): string => {
  const lines: string[] = [];
  if (settings.minutesTracker) lines.push(`#${settings.minutesTracker}(${Math.round(finished.seconds)})`);
  if (settings.repeatsTracker) lines.push(`#${settings.repeatsTracker}(${finished.repeats})`);
  return `Breathe 🫁:\n${logText(settings.logEntry, finished)}\n\n${lines.length ? lines.join('\n') : ''}`;
};

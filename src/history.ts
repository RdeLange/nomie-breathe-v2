// The breathing sessions that were done, kept in the plugin's storage, so the start screen can show the week.
export type Entry = {
  // the moment the session ended, as an ISO date
  at: string;
  exercise: string;
  // the breaths that were done, and the seconds that were breathed
  repeats: number;
  seconds: number;
  early: boolean;
};

export const HISTORY_LIMIT = 200;

export const normaliseHistory = (saved: unknown): Entry[] => {
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((e: any) => typeof e?.at === 'string' && !isNaN(Date.parse(e.at)) && typeof e.exercise === 'string')
    .map((e: any) => ({
      at: e.at,
      exercise: e.exercise,
      repeats: Number(e.repeats) || 0,
      seconds: Number(e.seconds) || 0,
      early: e.early === true,
    }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, HISTORY_LIMIT);
};

export const addEntry = (history: Entry[], entry: Entry): Entry[] => [entry, ...history].slice(0, HISTORY_LIMIT);

// The Monday of the week of `now`, at local midnight
export const startOfWeek = (now: Date): Date => {
  const day = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
};

// The sessions of the week of `now` that were finished (not ended early), and the minutes they took
export const thisWeek = (history: Entry[], now: Date): { sessions: number; minutes: number } => {
  const from = startOfWeek(now).getTime();
  const inWeek = history.filter((e) => Date.parse(e.at) >= from && !e.early);
  return { sessions: inWeek.length, minutes: Math.round(inWeek.reduce((sum, e) => sum + e.seconds, 0) / 60) };
};

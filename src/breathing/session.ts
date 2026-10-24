// A breathing session: a short countdown to get ready, then the breaths of the pattern. One clock runs it, and it stops
// when the session is paused. The circle, the words and the log all read the same clock.
import { cycleMs, positionAt, totalMs, type Pattern, type Position } from './pattern';

// The time to get ready before the first breath, in milliseconds
export const READY_MS = 3000;

// The clock: it runs from the start, and stops while it is paused. `now` is a timestamp in milliseconds.
export class Clock {
  private accumulated = 0;
  private since: number | null = null;

  get running(): boolean {
    return this.since !== null;
  }

  elapsed(now: number): number {
    return this.accumulated + (this.since === null ? 0 : now - this.since);
  }

  start(now: number): void {
    this.accumulated = 0;
    this.since = now;
  }

  pause(now: number): void {
    if (this.since === null) return;
    this.accumulated += now - this.since;
    this.since = null;
  }

  resume(now: number): void {
    if (this.since !== null) return;
    this.since = now;
  }
}

// What the screen shows at a moment: the get-ready countdown, or a position in the pattern
export type Moment = { ready: boolean; readyLeft: number; position: Position };

export class BreathingSession {
  readonly pattern: Pattern;
  // the length of the breathing, not counting the get-ready countdown
  readonly breathing: number;
  readonly total: number;
  private readonly clock = new Clock();

  constructor(pattern: Pattern) {
    this.pattern = { ...pattern };
    this.breathing = totalMs(this.pattern);
    this.total = READY_MS + this.breathing;
  }

  start(now: number): void {
    this.clock.start(now);
  }

  pause(now: number): void {
    this.clock.pause(now);
  }

  resume(now: number): void {
    this.clock.resume(now);
  }

  get paused(): boolean {
    return !this.clock.running;
  }

  elapsed(now: number): number {
    return Math.min(this.clock.elapsed(now), this.total);
  }

  finished(now: number): boolean {
    return this.clock.elapsed(now) >= this.total;
  }

  moment(now: number): Moment {
    const at = this.elapsed(now);
    if (at < READY_MS) {
      return { ready: true, readyLeft: READY_MS - at, position: positionAt(this.pattern, 0) };
    }
    return { ready: false, readyLeft: 0, position: positionAt(this.pattern, at - READY_MS) };
  }

  // The breaths finished so far. A breath counts once it is over.
  completedBreaths(now: number): number {
    const breathed = Math.max(0, this.elapsed(now) - READY_MS);
    return Math.min(this.pattern.repeats, Math.floor(breathed / cycleMs(this.pattern)));
  }
}

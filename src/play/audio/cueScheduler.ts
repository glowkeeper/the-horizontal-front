export type ScheduledCue = {
  readonly index: number;
  /** Milliseconds from now until the cue should sound. Never negative. */
  readonly inMs: number;
};

export type CueSchedulerState = {
  readonly scheduledCount: number;
  readonly lastElapsedMs: number;
};

export function createCueScheduler(): CueSchedulerState {
  return { scheduledCount: 0, lastElapsedMs: 0 };
}

/**
 * Hand the output device every cue falling inside the lookahead window, so it
 * can commit them to the audio clock ahead of time.
 *
 * A rhythm cue played on the frame its timestamp passes inherits all the jitter
 * of the render loop, which is audible as sloppy timing. Scheduling ahead lets
 * the audio device place the sound exactly, and the lookahead only needs to
 * exceed one frame to remove that jitter entirely.
 *
 * Cues are consumed in order and never replayed. A clock that moves backwards
 * means the episode restarted, so the run begins again from the first cue.
 */
export function collectDueCues(
  state: CueSchedulerState,
  cueTimesMs: readonly number[],
  elapsedMs: number,
  lookaheadMs: number,
): { readonly due: readonly ScheduledCue[]; readonly next: CueSchedulerState } {
  const restarted = elapsedMs < state.lastElapsedMs;
  let scheduledCount = restarted ? 0 : state.scheduledCount;
  const horizonMs = elapsedMs + Math.max(0, lookaheadMs);
  const due: ScheduledCue[] = [];
  while (
    scheduledCount < cueTimesMs.length
    && cueTimesMs[scheduledCount] <= horizonMs
  ) {
    due.push({
      index: scheduledCount,
      // A cue already in the past is played immediately rather than dropped:
      // a stalled frame should sound late, not leave a hole in the rhythm.
      inMs: Math.max(0, cueTimesMs[scheduledCount] - elapsedMs),
    });
    scheduledCount += 1;
  }
  return { due, next: { scheduledCount, lastElapsedMs: elapsedMs } };
}

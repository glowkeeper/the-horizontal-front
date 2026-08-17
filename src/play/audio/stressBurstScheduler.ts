export type StressBurstConfig = {
  /** Below this danger the structure is not bearing enough to complain. */
  readonly minimumDanger: number;
  readonly restIntervalMs: number;
  readonly strainIntervalMs: number;
  readonly restGain: number;
  readonly strainGain: number;
  /**
   * Multipliers applied to successive intervals, cycled in order.
   *
   * Stress release is stick-slip: the structure grips, releases and grips
   * again, and the releases do not arrive on a beat. An evenly spaced train
   * reads as machinery rather than as something bearing weight, so the spacing
   * is deliberately uneven — authored rather than random, so an episode sounds
   * the same way twice and can be tuned by ear.
   */
  readonly intervalPattern: readonly number[];
};

export type StressBurstState = {
  readonly nextAtMs: number;
  readonly step: number;
};

export type DueStressBurst = {
  readonly inMs: number;
  readonly gainScale: number;
};

export function createStressBurstState(): StressBurstState {
  return { nextAtMs: 0, step: 0 };
}

/**
 * Emit the stress bursts that fall due, with the load they were made under.
 *
 * Acoustic emission from a structure under stress is not a continuous tone: it
 * arrives as discrete bursts whose rate and amplitude both climb as the load
 * approaches failure, with relatively little happening while stress is merely
 * accumulating. Rate and gain therefore both follow danger, which is what makes
 * the structure sound like it is being worked rather than like it is humming.
 *
 * What those bursts sound like is content. Timber creaks; a different episode's
 * resistance might groan, ring or tear, and only its cue would change.
 *
 * See `docs/research/strain-and-machinery-synthesis.md`.
 */
export function collectDueStressBursts(
  state: StressBurstState,
  danger: number,
  elapsedMs: number,
  config: StressBurstConfig,
): { readonly due: readonly DueStressBurst[]; readonly next: StressBurstState } {
  const load = clamp01(danger);
  // A clock that moved backwards means the episode restarted.
  if (elapsedMs < state.nextAtMs - totalPatternMs(config)) {
    return { due: [], next: { nextAtMs: elapsedMs, step: 0 } };
  }
  if (load < config.minimumDanger) {
    // Silent, but the schedule keeps pace with the clock so recovering ground
    // and losing it again does not produce a run of backdated bursts.
    return { due: [], next: { nextAtMs: Math.max(state.nextAtMs, elapsedMs), step: state.step } };
  }

  const due: DueStressBurst[] = [];
  let { nextAtMs, step } = state;
  const gainScale = linear(config.restGain, config.strainGain, load);
  const interval = linear(config.restIntervalMs, config.strainIntervalMs, load);
  // Bounded so a long stall cannot dump a backlog of bursts into one frame.
  for (let guard = 0; guard < 8 && nextAtMs <= elapsedMs; guard += 1) {
    due.push({ inMs: Math.max(0, nextAtMs - elapsedMs), gainScale });
    const multiplier = config.intervalPattern[step % config.intervalPattern.length];
    nextAtMs += Math.max(1, interval * multiplier);
    step += 1;
  }
  if (nextAtMs <= elapsedMs) nextAtMs = elapsedMs + interval;
  return { due, next: { nextAtMs, step } };
}

function totalPatternMs(config: StressBurstConfig): number {
  return config.restIntervalMs * config.intervalPattern.length;
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

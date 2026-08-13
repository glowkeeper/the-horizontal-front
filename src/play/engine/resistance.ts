import { assertValidResistanceConfig } from "./resistanceConfig";
import type {
  Resistance,
  ResistanceConfig,
  ResistanceInput,
  ResistancePhase,
  ResistanceState,
  RhythmCue,
  RhythmGuideItem,
  ScoredRhythmCue,
} from "./types";

const MILLISECONDS_PER_SECOND = 1_000;

export function createResistance(config: ResistanceConfig): Resistance {
  assertValidResistanceConfig(config);
  return {
    config,
    state: {
      duvetSafety: config.startingSafety,
      rhythmMomentum: 0,
      nextRhythmStep: 0,
      activeHold: null,
      elapsedMs: 0,
      dramaticIntensity: config.phases[0].presentationIntensity.from,
      outcome: "active",
      lastRhythmJudgement: null,
    },
  };
}

export function advanceResistance(resistance: Resistance, toMs: number): Resistance {
  assertValidTime(resistance.state, toMs);
  if (resistance.state.outcome !== "active" || toMs === resistance.state.elapsedMs) return resistance;

  const effectiveToMs = Math.min(toMs, resistance.config.durationMs);
  let cursorMs = resistance.state.elapsedMs;
  let duvetSafety = resistance.state.duvetSafety;
  let rhythmMomentum = resistance.state.rhythmMomentum;
  let nextRhythmStep = resistance.state.nextRhythmStep;
  let activeHold = resistance.state.activeHold;
  let lastRhythmJudgement = resistance.state.lastRhythmJudgement;

  while (nextRhythmStep < resistance.config.cues.length) {
    const cue = resistance.config.cues[nextRhythmStep];
    const deadline = activeHold?.step === nextRhythmStep
      && cue.action === "hold"
      ? cue.releaseAtMs + cue.timingWindowMs
      : cue.atMs + cue.timingWindowMs;
    if (deadline >= effectiveToMs) break;

    const pressureLoss = integratePressure(resistance.config, cursorMs, deadline);
    if (pressureLoss >= duvetSafety) {
      return pressureFailure(resistance, cursorMs, deadline, duvetSafety, {
        rhythmMomentum,
        nextRhythmStep,
        activeHold,
        lastRhythmJudgement,
      });
    }
    duvetSafety -= pressureLoss;
    cursorMs = deadline;

    const phase = resistance.config.phases[cue.phaseIndex];
    duvetSafety = clamp01(duvetSafety - phase.safetyPenaltyPerMiss);
    rhythmMomentum = clamp01(rhythmMomentum - phase.momentumLoss);
    lastRhythmJudgement = {
      kind: "miss",
      reason: "expired",
      expectedSide: cue.side,
      actualSide: null,
      step: nextRhythmStep,
      action: cue.action,
    };
    nextRhythmStep += 1;
    activeHold = null;
    if (duvetSafety === 0) {
      return withState(resistance, {
        ...resistance.state,
        duvetSafety: 0,
        rhythmMomentum,
        nextRhythmStep,
        activeHold,
        elapsedMs: deadline,
        dramaticIntensity: getDramaticIntensity(resistance.config, deadline),
        outcome: "forced-verticalisation",
        lastRhythmJudgement,
      });
    }
  }

  const finalPressureLoss = integratePressure(resistance.config, cursorMs, effectiveToMs);
  if (finalPressureLoss >= duvetSafety) {
    return pressureFailure(resistance, cursorMs, effectiveToMs, duvetSafety, {
      rhythmMomentum,
      nextRhythmStep,
      activeHold,
      lastRhythmJudgement,
    });
  }
  duvetSafety -= finalPressureLoss;
  const nextState: ResistanceState = {
    ...resistance.state,
    duvetSafety: clamp01(duvetSafety),
    rhythmMomentum,
    nextRhythmStep,
    activeHold,
    elapsedMs: effectiveToMs,
    dramaticIntensity: getDramaticIntensity(resistance.config, effectiveToMs),
    lastRhythmJudgement,
  };
  return withState(resistance, effectiveToMs === resistance.config.durationMs
    ? { ...nextState, outcome: "victory" }
    : nextState);
}

export function applyResistanceInput(resistance: Resistance, input: ResistanceInput): Resistance {
  const advanced = advanceResistance(resistance, input.atMs);
  if (advanced.state.outcome !== "active") return advanced;
  const step = advanced.state.nextRhythmStep;
  const cue = advanced.config.cues[step];
  if (!cue) return advanced;

  if (advanced.state.activeHold) return resolveHoldInput(advanced, input, cue, step);
  if (input.action === "release") return advanced;
  const offsetMs = input.atMs - cue.atMs;
  if (offsetMs < -cue.timingWindowMs) {
    return miss(advanced, cue, step, "early", input.side, false);
  }
  if (input.side !== cue.side) {
    return miss(advanced, cue, step, "wrong-side", input.side, true);
  }
  if (cue.action === "hold") {
    return withState(advanced, {
      ...advanced.state,
      activeHold: { step, side: input.side, pressedAtMs: input.atMs },
    });
  }
  return hit(advanced, cue, step, input.side, timingAccuracy(offsetMs, cue.timingWindowMs));
}

export function getNextRhythmCue(resistance: Resistance): RhythmCue | null {
  if (resistance.state.outcome !== "active") return null;
  const step = resistance.state.nextRhythmStep;
  const cue = resistance.config.cues[step];
  return cue ? { ...cue, step } : null;
}

export function getRhythmGuide(
  resistance: Resistance,
  length = 3,
): readonly RhythmGuideItem[] {
  if (resistance.state.outcome !== "active" || length <= 0) return [];
  const elapsedMs = resistance.state.elapsedMs;
  const visible = resistance.config.guideEvents
    .filter((event) => event.endsAtMs > elapsedMs)
    .slice(0, length);
  let futureIndex = 0;
  return visible.map((event) => {
    if (event.atMs <= elapsedMs) return { ...event, timing: "now" as const };
    const timing = futureIndex === 0 ? "next" as const : "then" as const;
    futureIndex += 1;
    return { ...event, timing };
  });
}

export function isResistancePaused(resistance: Resistance): boolean {
  return resistance.config.guideEvents.some((event) =>
    isPauseEvent(event)
    && event.atMs <= resistance.state.elapsedMs
    && event.endsAtMs > resistance.state.elapsedMs);
}

export function getDramaticIntensity(config: ResistanceConfig, atMs: number): number {
  const phase = getPhase(config.phases, Math.min(atMs, config.durationMs));
  const activeDuration = getUnpausedDuration(
    config,
    phase.startsAtMs,
    phase.endsAtMs,
  );
  const elapsedActiveDuration = getUnpausedDuration(
    config,
    phase.startsAtMs,
    Math.min(atMs, phase.endsAtMs),
  );
  const progress = activeDuration === 0
    ? 1
    : clamp01(elapsedActiveDuration / activeDuration);
  return linear(phase.presentationIntensity.from, phase.presentationIntensity.to, progress);
}

function resolveHoldInput(resistance: Resistance, input: ResistanceInput, cue: ScoredRhythmCue, step: number): Resistance {
  const activeHold = resistance.state.activeHold;
  if (!activeHold) return resistance;
  if (input.action === "press") {
    return input.side === cue.side ? resistance : miss(resistance, cue, step, "wrong-side", input.side, true);
  }
  if (input.side !== cue.side) return resistance;
  if (cue.action !== "hold") {
    throw new Error("active hold must correspond to a hold cue");
  }
  const releaseAtMs = cue.releaseAtMs;
  const offsetMs = input.atMs - releaseAtMs;
  if (offsetMs < -cue.timingWindowMs) {
    return miss(resistance, cue, step, "released-early", input.side, true);
  }
  const pressAccuracy = timingAccuracy(
    activeHold.pressedAtMs - cue.atMs,
    cue.timingWindowMs,
  );
  const releaseAccuracy = timingAccuracy(offsetMs, cue.timingWindowMs);
  return hit(resistance, cue, step, input.side, Math.min(pressAccuracy, releaseAccuracy));
}

function hit(resistance: Resistance, cue: ScoredRhythmCue, step: number, side: "left" | "right", accuracy: number): Resistance {
  const phase = resistance.config.phases[cue.phaseIndex];
  const momentum = clamp01(resistance.state.rhythmMomentum + phase.momentumGain * accuracy);
  const recovery = phase.recoveryPerAction * (0.5 + accuracy * 0.5)
    * (0.35 + momentum * 0.65)
    * (1 + momentum * phase.momentumRecoveryBonus);
  return withState(resistance, {
    ...resistance.state,
    duvetSafety: clamp01(resistance.state.duvetSafety + recovery),
    rhythmMomentum: momentum,
    nextRhythmStep: step + 1,
    activeHold: null,
    lastRhythmJudgement: {
      kind: "hit", accuracy, expectedSide: cue.side, actualSide: side, step, action: cue.action,
    },
  });
}

function miss(resistance: Resistance, cue: ScoredRhythmCue, step: number, reason: "early" | "wrong-side" | "released-early", side: "left" | "right", consume: boolean): Resistance {
  const phase = resistance.config.phases[cue.phaseIndex];
  const duvetSafety = clamp01(
    resistance.state.duvetSafety - phase.safetyPenaltyPerMiss,
  );
  return withState(resistance, {
    ...resistance.state,
    duvetSafety,
    rhythmMomentum: clamp01(resistance.state.rhythmMomentum - phase.momentumLoss),
    nextRhythmStep: step + (consume ? 1 : 0),
    activeHold: null,
    lastRhythmJudgement: {
      kind: "miss", reason, expectedSide: cue.side, actualSide: side, step, action: cue.action,
    },
    outcome: duvetSafety === 0
      ? "forced-verticalisation"
      : resistance.state.outcome,
  });
}

function integratePressure(config: ResistanceConfig, fromMs: number, toMs: number): number {
  return config.phases.reduce((total, phase) => {
    const start = Math.max(fromMs, phase.startsAtMs);
    const end = Math.min(toMs, phase.endsAtMs);
    if (end <= start) return total;
    const activeDuration = getUnpausedDuration(config, start, end);
    return total + phase.pressurePerSecond * activeDuration / MILLISECONDS_PER_SECOND;
  }, 0);
}

function pressureFailure(
  resistance: Resistance,
  fromMs: number,
  toMs: number,
  safety: number,
  progress: Pick<ResistanceState,
    "rhythmMomentum" | "nextRhythmStep" | "activeHold" | "lastRhythmJudgement">,
): Resistance {
  const failureAtMs = findFailureTime(
    resistance.config,
    fromMs,
    toMs,
    safety,
  );
  return withState(resistance, {
    ...resistance.state,
    ...progress,
    duvetSafety: 0,
    elapsedMs: failureAtMs,
    dramaticIntensity: getDramaticIntensity(resistance.config, failureAtMs),
    outcome: "forced-verticalisation",
  });
}

function findFailureTime(
  config: ResistanceConfig,
  fromMs: number,
  toMs: number,
  safety: number,
): number {
  let low = fromMs;
  let high = toMs;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const middle = (low + high) / 2;
    if (integratePressure(config, fromMs, middle) >= safety) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return high;
}

function getUnpausedDuration(
  config: ResistanceConfig,
  fromMs: number,
  toMs: number,
): number {
  if (toMs <= fromMs) return 0;
  const pauses = config.guideEvents
    .filter(isPauseEvent)
    .map((event) => ({
      start: Math.max(fromMs, event.atMs),
      end: Math.min(toMs, event.endsAtMs),
    }))
    .filter(({ start, end }) => end > start)
    .sort((left, right) => left.start - right.start);
  let pausedDuration = 0;
  let pauseEnd = fromMs;
  for (const pause of pauses) {
    const start = Math.max(pause.start, pauseEnd);
    if (pause.end > start) pausedDuration += pause.end - start;
    pauseEnd = Math.max(pauseEnd, pause.end);
  }
  return toMs - fromMs - pausedDuration;
}

function isPauseEvent(
  event: ResistanceConfig["guideEvents"][number],
): boolean {
  return event.action === "rest" || event.action === "count-in";
}

function getPhase(phases: readonly ResistancePhase[], atMs: number): ResistancePhase {
  return phases.find((phase) => atMs < phase.endsAtMs) ?? phases[phases.length - 1];
}
function timingAccuracy(offsetMs: number, windowMs: number): number {
  return windowMs === 0 ? 1 : clamp01(1 - Math.abs(offsetMs) / windowMs);
}
function withState(resistance: Resistance, state: ResistanceState): Resistance {
  return { config: resistance.config, state };
}
function assertValidTime(state: ResistanceState, toMs: number): void {
  if (!Number.isFinite(toMs) || toMs < 0) throw new Error("time must be a finite non-negative number");
  if (toMs < state.elapsedMs) throw new Error("resistance time cannot move backwards");
}
function linear(from: number, to: number, amount: number): number { return from + (to - from) * amount; }
function clamp01(value: number): number { return Math.min(1, Math.max(0, value)); }

import { assertValidResistanceConfig } from "./resistanceConfig";
import type {
  Resistance,
  ResistanceConfig,
  ResistanceInput,
  ResistancePhase,
  ResistanceState,
  RhythmCue,
  RhythmJudgement,
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
  const lost = integratePressure(resistance.config.phases, resistance.state.elapsedMs, effectiveToMs);
  if (lost >= resistance.state.duvetSafety) {
    const failureAtMs = findFailureTime(resistance.config.phases, resistance.state.elapsedMs, resistance.state.duvetSafety);
    return withState(resistance, {
      ...resistance.state,
      duvetSafety: 0,
      elapsedMs: failureAtMs,
      dramaticIntensity: getDramaticIntensity(resistance.config, failureAtMs),
      outcome: "forced-verticalisation",
    });
  }

  const safetyAfterPressure = resistance.state.duvetSafety - lost;
  const expired = expireCues(resistance, effectiveToMs, safetyAfterPressure);
  if (expired.failureAtMs !== null) {
    return withState(resistance, {
      ...resistance.state,
      duvetSafety: 0,
      rhythmMomentum: clamp01(resistance.state.rhythmMomentum - expired.momentumLoss),
      nextRhythmStep: expired.nextStep,
      activeHold: null,
      elapsedMs: expired.failureAtMs,
      dramaticIntensity: getDramaticIntensity(resistance.config, expired.failureAtMs),
      outcome: "forced-verticalisation",
      lastRhythmJudgement: expired.lastJudgement,
    });
  }
  const nextState: ResistanceState = {
    ...resistance.state,
    duvetSafety: clamp01(safetyAfterPressure - expired.safetyPenalty),
    rhythmMomentum: clamp01(resistance.state.rhythmMomentum - expired.momentumLoss),
    nextRhythmStep: expired.nextStep,
    activeHold: expired.activeHold,
    elapsedMs: effectiveToMs,
    dramaticIntensity: getDramaticIntensity(resistance.config, effectiveToMs),
    lastRhythmJudgement: expired.lastJudgement ?? resistance.state.lastRhythmJudgement,
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

export function getDramaticIntensity(config: ResistanceConfig, atMs: number): number {
  const phase = getPhase(config.phases, Math.min(atMs, config.durationMs));
  const progress = phase.endsAtMs === phase.startsAtMs
    ? 1
    : clamp01((atMs - phase.startsAtMs) / (phase.endsAtMs - phase.startsAtMs));
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

function expireCues(
  resistance: Resistance,
  toMs: number,
  availableSafety: number,
) {
  let nextStep = resistance.state.nextRhythmStep;
  let activeHold = resistance.state.activeHold;
  let momentumLoss = 0;
  let safetyPenalty = 0;
  let failureAtMs: number | null = null;
  let lastJudgement: RhythmJudgement | null = null;
  while (nextStep < resistance.config.cues.length) {
    const cue = resistance.config.cues[nextStep];
    const deadline = activeHold && activeHold.step === nextStep
      && cue.action === "hold"
      ? cue.releaseAtMs + cue.timingWindowMs
      : cue.atMs + cue.timingWindowMs;
    if (deadline >= toMs) break;
    const phase = resistance.config.phases[cue.phaseIndex];
    momentumLoss += phase.momentumLoss;
    safetyPenalty += phase.safetyPenaltyPerMiss;
    lastJudgement = {
      kind: "miss", reason: "expired", expectedSide: cue.side, actualSide: null,
      step: nextStep, action: cue.action,
    };
    nextStep += 1;
    activeHold = null;
    if (safetyPenalty >= availableSafety) {
      failureAtMs = deadline;
      break;
    }
  }
  return {
    nextStep,
    activeHold,
    momentumLoss,
    safetyPenalty,
    failureAtMs,
    lastJudgement,
  };
}

function integratePressure(phases: readonly ResistancePhase[], fromMs: number, toMs: number): number {
  return phases.reduce((total, phase) => {
    const overlap = Math.max(0, Math.min(toMs, phase.endsAtMs) - Math.max(fromMs, phase.startsAtMs));
    return total + phase.pressurePerSecond * overlap / MILLISECONDS_PER_SECOND;
  }, 0);
}

function findFailureTime(phases: readonly ResistancePhase[], fromMs: number, safety: number): number {
  let remaining = safety;
  for (const phase of phases) {
    const start = Math.max(fromMs, phase.startsAtMs);
    if (start >= phase.endsAtMs) continue;
    const capacity = phase.pressurePerSecond * (phase.endsAtMs - start) / MILLISECONDS_PER_SECOND;
    if (phase.pressurePerSecond > 0 && capacity >= remaining) {
      return start + remaining / phase.pressurePerSecond * MILLISECONDS_PER_SECOND;
    }
    remaining -= capacity;
  }
  return phases.at(-1)?.endsAtMs ?? fromMs;
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

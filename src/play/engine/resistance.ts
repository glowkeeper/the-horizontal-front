import type {
  Resistance,
  ResistanceConfig,
  ResistanceInput,
  ResistanceState,
  RhythmJudgement,
  RhythmPattern,
} from "./types";
import { assertValidResistanceConfig } from "./resistanceConfig";

const MILLISECONDS_PER_SECOND = 1_000;

export function createResistance(
  config: ResistanceConfig,
): Resistance {
  assertValidResistanceConfig(config);

  return {
    config,
    state: {
      duvetSafety: config.startingSafety,
      rhythmMomentum: 0,
      nextRhythmStep: 0,
      elapsedMs: 0,
      outcome: "active",
      lastRhythmJudgement: null,
    },
  };
}

export function advanceResistance(
  resistance: Resistance,
  toMs: number,
): Resistance {
  assertValidResistanceConfig(resistance.config);
  const { config, state } = resistance;
  assertValidTime(state, toMs);

  if (state.outcome !== "active" || toMs === state.elapsedMs) {
    return resistance;
  }

  const effectiveToMs = Math.min(toMs, config.durationMs);
  const pressurePerMs =
    config.pressurePerSecond / MILLISECONDS_PER_SECOND;
  const elapsedDeltaMs = effectiveToMs - state.elapsedMs;
  const safetyLost = pressurePerMs * elapsedDeltaMs;

  if (safetyLost >= state.duvetSafety) {
    const failureAtMs = pressurePerMs === 0
      ? effectiveToMs
      : state.elapsedMs + state.duvetSafety / pressurePerMs;

    return withState(resistance, {
      ...state,
      duvetSafety: 0,
      elapsedMs: failureAtMs,
      outcome: "forced-verticalisation",
    });
  }

  const expired = expireMissedRhythmSteps(
    state.nextRhythmStep,
    effectiveToMs,
    config.rhythm,
  );
  const nextState: ResistanceState = {
    ...state,
    duvetSafety: clamp01(state.duvetSafety - safetyLost),
    rhythmMomentum: clamp01(
      state.rhythmMomentum - expired.count * config.momentumLoss,
    ),
    nextRhythmStep: expired.nextStep,
    elapsedMs: effectiveToMs,
    lastRhythmJudgement: expired.lastJudgement
      ?? state.lastRhythmJudgement,
  };

  if (effectiveToMs === config.durationMs) {
    return withState(resistance, { ...nextState, outcome: "victory" });
  }

  return withState(resistance, nextState);
}

export function applyResistanceInput(
  resistance: Resistance,
  input: ResistanceInput,
): Resistance {
  const advanced = advanceResistance(resistance, input.atMs);

  if (advanced.state.outcome !== "active") {
    return advanced;
  }

  const { config } = advanced;
  const step = advanced.state.nextRhythmStep;
  const expectedSide = getExpectedSide(config.rhythm, step);
  const scheduledAtMs = getRhythmStepTime(config.rhythm, step);
  const offsetMs = input.atMs - scheduledAtMs;

  if (offsetMs < -config.rhythm.timingWindowMs) {
    return withState(
      advanced,
      missRhythmStep(
        advanced.state,
        config,
        {
          kind: "miss",
          reason: "early",
          expectedSide,
          actualSide: input.side,
          step,
        },
        false,
      ),
    );
  }

  if (input.side !== expectedSide) {
    return withState(
      advanced,
      missRhythmStep(
        advanced.state,
        config,
        {
          kind: "miss",
          reason: "wrong-side",
          expectedSide,
          actualSide: input.side,
          step,
        },
        true,
      ),
    );
  }

  const accuracy = config.rhythm.timingWindowMs === 0
    ? 1
    : clamp01(1 - Math.abs(offsetMs) / config.rhythm.timingWindowMs);
  const nextMomentum = clamp01(
    advanced.state.rhythmMomentum + config.momentumGain * accuracy,
  );
  const timingStrength = 0.5 + accuracy * 0.5;
  const momentumStrength =
    1 + nextMomentum * config.momentumRecoveryBonus;
  const recovery =
    config.recoveryPerBeat * timingStrength * momentumStrength;

  return withState(advanced, {
    ...advanced.state,
    duvetSafety: clamp01(advanced.state.duvetSafety + recovery),
    rhythmMomentum: nextMomentum,
    nextRhythmStep: step + 1,
    lastRhythmJudgement: {
      kind: "hit",
      accuracy,
      expectedSide,
      actualSide: input.side,
      step,
    },
  });
}

export function getRhythmStepTime(
  rhythm: RhythmPattern,
  step: number,
): number {
  return (step + 1) * rhythm.beatIntervalMs;
}

function expireMissedRhythmSteps(
  fromStep: number,
  toMs: number,
  rhythm: RhythmPattern,
): {
  count: number;
  nextStep: number;
  lastJudgement: RhythmJudgement | null;
} {
  let nextStep = fromStep;
  let lastJudgement: RhythmJudgement | null = null;

  while (
    getRhythmStepTime(rhythm, nextStep) + rhythm.timingWindowMs < toMs
  ) {
    lastJudgement = {
      kind: "miss",
      reason: "expired",
      expectedSide: getExpectedSide(rhythm, nextStep),
      actualSide: null,
      step: nextStep,
    };
    nextStep += 1;
  }

  return {
    count: nextStep - fromStep,
    nextStep,
    lastJudgement,
  };
}

function missRhythmStep(
  state: ResistanceState,
  config: ResistanceConfig,
  judgement: RhythmJudgement,
  consumeStep: boolean,
): ResistanceState {
  return {
    ...state,
    rhythmMomentum: clamp01(
      state.rhythmMomentum - config.momentumLoss,
    ),
    nextRhythmStep: state.nextRhythmStep + (consumeStep ? 1 : 0),
    lastRhythmJudgement: judgement,
  };
}

function getExpectedSide(
  rhythm: RhythmPattern,
  step: number,
) {
  return rhythm.steps[step % rhythm.steps.length].side;
}

function withState(
  resistance: Resistance,
  state: ResistanceState,
): Resistance {
  return { config: resistance.config, state };
}

function assertValidTime(state: ResistanceState, toMs: number): void {
  if (!Number.isFinite(toMs) || toMs < 0) {
    throw new Error("time must be a finite non-negative number");
  }

  if (toMs < state.elapsedMs) {
    throw new Error("resistance time cannot move backwards");
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

import type { ResistanceConfig } from "./types";

export function assertValidResistanceConfig(config: ResistanceConfig): void {
  assertPositive("durationMs", config.durationMs);
  assertNonNegative("resolutionDurationMs", config.resolutionDurationMs);
  assertUnitInterval("startingSafety", config.startingSafety);
  if (config.phases.length === 0) throw new Error("phases must not be empty");

  let boundary = 0;
  for (const [index, phase] of config.phases.entries()) {
    if (phase.startsAtMs !== boundary || phase.endsAtMs <= phase.startsAtMs) {
      throw new Error(`phases[${index}] must form a contiguous positive timeline`);
    }
    assertNonNegative(`phases[${index}].pressurePerSecond`, phase.pressurePerSecond);
    assertNonNegative(`phases[${index}].recoveryPerAction`, phase.recoveryPerAction);
    assertNonNegative(`phases[${index}].safetyPenaltyPerMiss`, phase.safetyPenaltyPerMiss);
    assertUnitInterval(`phases[${index}].momentumGain`, phase.momentumGain);
    assertUnitInterval(`phases[${index}].momentumLoss`, phase.momentumLoss);
    assertNonNegative(`phases[${index}].momentumRecoveryBonus`, phase.momentumRecoveryBonus);
    assertUnitInterval(`phases[${index}].presentationIntensity.from`, phase.presentationIntensity.from);
    assertUnitInterval(`phases[${index}].presentationIntensity.to`, phase.presentationIntensity.to);
    boundary = phase.endsAtMs;
  }
  if (boundary !== config.durationMs) throw new Error("phases must exactly fill durationMs");

  let previousAt = -1;
  for (const [index, cue] of config.cues.entries()) {
    if (cue.atMs < previousAt || cue.atMs >= config.durationMs) {
      throw new Error(`cues[${index}] must be ordered inside durationMs`);
    }
    if (!config.phases[cue.phaseIndex]) throw new Error(`cues[${index}] has an invalid phaseIndex`);
    assertNonNegative(`cues[${index}].timingWindowMs`, cue.timingWindowMs);
    if (cue.action === "hold" && cue.releaseAtMs <= cue.atMs) {
      throw new Error(`cues[${index}] hold must have a later releaseAtMs`);
    }
    previousAt = cue.atMs;
  }
  for (const [index, event] of config.guideEvents.entries()) {
    if (event.atMs < 0 || event.endsAtMs <= event.atMs
      || event.endsAtMs > config.durationMs) {
      throw new Error(`guideEvents[${index}] must fit inside durationMs`);
    }
    if (!config.phases[event.phaseIndex]) {
      throw new Error(`guideEvents[${index}] has an invalid phaseIndex`);
    }
  }
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a finite positive number`);
}
function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a finite non-negative number`);
}
function assertUnitInterval(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${name} must be between 0 and 1`);
}

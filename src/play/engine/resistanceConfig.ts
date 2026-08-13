import type { ResistanceConfig } from "./types";

export function assertValidResistanceConfig(
  config: ResistanceConfig,
): void {
  assertPositive("durationMs", config.durationMs);
  assertUnitInterval("startingSafety", config.startingSafety);
  assertNonNegative("pressurePerSecond", config.pressurePerSecond);
  assertNonNegative("recoveryPerBeat", config.recoveryPerBeat);
  assertUnitInterval("momentumGain", config.momentumGain);
  assertUnitInterval("momentumLoss", config.momentumLoss);
  assertNonNegative(
    "momentumRecoveryBonus",
    config.momentumRecoveryBonus,
  );
  assertPositive("rhythm.beatIntervalMs", config.rhythm.beatIntervalMs);
  assertPositiveInteger("rhythm.leadInBeats", config.rhythm.leadInBeats);
  assertNonNegative(
    "rhythm.timingWindowMs",
    config.rhythm.timingWindowMs,
  );

  if (config.rhythm.steps.length === 0) {
    throw new Error("rhythm.steps must contain at least one step");
  }

  if (config.rhythm.timingWindowMs * 2 >= config.rhythm.beatIntervalMs) {
    throw new Error(
      "rhythm.timingWindowMs must be less than half rhythm.beatIntervalMs",
    );
  }
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number`);
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}

function assertUnitInterval(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
}

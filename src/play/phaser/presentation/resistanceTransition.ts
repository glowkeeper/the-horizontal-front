export type ResistanceState = {
  readonly minimumDanger: number;
};

export type ResistanceTransition = {
  readonly crossfadeDurationMs: number;
  readonly rotationResponseMs: number;
  readonly joltX: number;
  readonly joltY: number;
  readonly shakeAmplitude: number;
  readonly shakeDurationMs: number;
};

export type ReducedResistanceTransition = {
  readonly crossfadeDurationMs: number;
};

export function selectResistanceStateIndex(
  physicalDanger: number,
  states: readonly ResistanceState[],
): number {
  const danger = clamp01(physicalDanger);
  for (let index = states.length - 1; index >= 0; index -= 1) {
    if (danger >= states[index].minimumDanger) return index;
  }
  return 0;
}

export function getResistanceAngleDegrees(
  physicalDanger: number,
  dangerAngleDegrees: number,
): number {
  return dangerAngleDegrees * clamp01(physicalDanger);
}

export function smoothResistanceAngleDegrees(
  currentAngleDegrees: number,
  targetAngleDegrees: number,
  elapsedMs: number,
  responseMs: number,
): number {
  if (responseMs <= 0) return targetAngleDegrees;
  const amount = 1 - Math.exp(-Math.max(0, elapsedMs) / responseMs);
  return currentAngleDegrees
    + (targetAngleDegrees - currentAngleDegrees) * amount;
}

export function resolveResistanceTransition(
  transition: ResistanceTransition,
  reducedMotion: ReducedResistanceTransition,
  prefersReducedMotion: boolean,
): ResistanceTransition {
  return prefersReducedMotion
    ? {
        crossfadeDurationMs: reducedMotion.crossfadeDurationMs,
        rotationResponseMs: 0,
        joltX: 0,
        joltY: 0,
        shakeAmplitude: 0,
        shakeDurationMs: 0,
      }
    : transition;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

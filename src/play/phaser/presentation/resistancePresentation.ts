export type ResistancePresentation = {
  readonly workLightAlpha: number;
};

type Motion = {
  readonly danger: {
    readonly workLightAlpha: number;
  };
  readonly rest: { readonly workLightAlpha: number };
};

const MAXIMUM_AUTHORED_LIGHT_INTRUSION = 0.5;

export function getResistancePresentation(
  duvetSafety: number,
  dramaticIntensity: number,
  motion: Motion,
): ResistancePresentation {
  const physicalDanger = 1 - clamp01(duvetSafety);
  const lightIntrusion = Math.max(
    physicalDanger,
    clamp01(dramaticIntensity) * MAXIMUM_AUTHORED_LIGHT_INTRUSION,
  );

  return {
    workLightAlpha: linear(
      motion.rest.workLightAlpha,
      motion.danger.workLightAlpha,
      lightIntrusion,
    ),
  };
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

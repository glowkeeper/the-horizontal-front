export type ResistancePresentation = {
  readonly bedAngleDegrees: number;
  readonly duvetPullX: number;
  readonly sleeperSlideX: number;
  readonly workLightAlpha: number;
};

type Motion = {
  readonly danger: {
    readonly bedAngleDegrees: number;
    readonly duvetX: number;
    readonly sleeperX: number;
    readonly workLightAlpha: number;
  };
  readonly rest: { readonly workLightAlpha: number };
};

export function getResistancePresentation(
  duvetSafety: number,
  motion: Motion,
): ResistancePresentation {
  const danger = 1 - clamp01(duvetSafety);

  return {
    bedAngleDegrees: motion.danger.bedAngleDegrees * danger,
    duvetPullX: danger === 0 ? 0 : motion.danger.duvetX * danger,
    sleeperSlideX: motion.danger.sleeperX * danger,
    workLightAlpha: linear(
      motion.rest.workLightAlpha,
      motion.danger.workLightAlpha,
      danger,
    ),
  };
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

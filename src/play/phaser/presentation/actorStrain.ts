export type StrainVector = {
  readonly x: number;
  readonly y: number;
};

export type ActorStrain = {
  readonly restFrequencyHz: number;
  readonly strainFrequencyHz: number;
  readonly restAmplitude: StrainVector;
  readonly strainAmplitude: StrainVector;
  readonly lean: StrainVector;
};

export type ReducedActorStrain = {
  readonly amplitudeScale: number;
};

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Advance the oscillator by one frame.
 *
 * Phase is accumulated rather than derived from elapsed time, because the
 * frequency itself rises with intensity. Recomputing `2 pi f t` whenever `f`
 * changes would move the actor discontinuously — the same visible jump this
 * motion exists to avoid.
 */
export function advanceStrainPhase(
  phase: number,
  dramaticIntensity: number,
  elapsedMs: number,
  strain: ActorStrain,
): number {
  const frequencyHz = linear(
    strain.restFrequencyHz,
    strain.strainFrequencyHz,
    clamp01(dramaticIntensity),
  );
  const advanced = phase
    + 2 * Math.PI * frequencyHz * (Math.max(0, elapsedMs) / MILLISECONDS_PER_SECOND);
  return advanced % (2 * Math.PI);
}

/**
 * The actor's offset from its authored anchor: an elliptical tremble whose
 * amplitude grows with intensity, plus a lean that carries its weight into the
 * apparatus. Horizontal uses cosine against the same phase so the two axes stay
 * a quarter cycle apart without authoring a second oscillator.
 */
export function getActorStrainOffset(
  phase: number,
  dramaticIntensity: number,
  strain: ActorStrain,
): StrainVector {
  const intensity = clamp01(dramaticIntensity);
  return {
    x: Math.cos(phase) * linear(strain.restAmplitude.x, strain.strainAmplitude.x, intensity)
      + strain.lean.x * intensity,
    y: Math.sin(phase) * linear(strain.restAmplitude.y, strain.strainAmplitude.y, intensity)
      + strain.lean.y * intensity,
  };
}

/**
 * Reduced motion scales the oscillation only. The lean is a static pose offset
 * rather than movement, so it survives at full strength and the actor still
 * reads as straining without anything shaking.
 */
export function resolveActorStrain(
  strain: ActorStrain,
  reducedMotion: ReducedActorStrain,
  prefersReducedMotion: boolean,
): ActorStrain {
  if (!prefersReducedMotion) return strain;
  const scale = clamp01(reducedMotion.amplitudeScale);
  return {
    ...strain,
    restAmplitude: scaleVector(strain.restAmplitude, scale),
    strainAmplitude: scaleVector(strain.strainAmplitude, scale),
  };
}

function scaleVector(vector: StrainVector, scale: number): StrainVector {
  return { x: vector.x * scale, y: vector.y * scale };
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

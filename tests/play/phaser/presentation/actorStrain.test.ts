import { describe, expect, it } from "vitest";

import {
  advanceStrainPhase,
  getActorStrainOffset,
  resolveActorStrain,
} from "../../../../src/play/phaser/presentation/actorStrain";

const strain = {
  restFrequencyHz: 0.5,
  strainFrequencyHz: 5.4,
  restAmplitude: { x: 0, y: 1.5 },
  strainAmplitude: { x: 2.5, y: 6 },
  lean: { x: -14, y: 7 },
};

const reducedMotion = { amplitudeScale: 0 };

describe("opposing-actor strain", () => {
  it("advances faster as intensity rises", () => {
    // Short step, so neither advance wraps and the two stay comparable.
    const calm = advanceStrainPhase(0, 0, 50, strain);
    const strained = advanceStrainPhase(0, 1, 50, strain);
    expect(calm).toBeGreaterThan(0);
    expect(strained).toBeGreaterThan(calm);
    expect(strained).toBeLessThan(2 * Math.PI);
  });

  it("never leaps further than the current frequency allows", () => {
    // The reason phase is accumulated rather than recomputed from elapsed time:
    // with `2 pi f t`, a rising `f` multiplies the whole elapsed time and the
    // actor teleports. Accumulation bounds every step by the frequency itself.
    const frameMs = 16;
    const largestPermittedStep = 2 * Math.PI
      * strain.strainFrequencyHz * (frameMs / 1000);
    let phase = 0;
    let largestStep = 0;
    for (let frame = 0; frame < 600; frame += 1) {
      const intensity = frame / 600;
      const next = advanceStrainPhase(phase, intensity, frameMs, strain);
      const step = (next - phase + 2 * Math.PI) % (2 * Math.PI);
      largestStep = Math.max(largestStep, step);
      phase = next;
    }
    expect(largestStep).toBeLessThanOrEqual(largestPermittedStep + Number.EPSILON);
  });

  it("holds the actor still at rest and moves it further under strain", () => {
    const spread = (intensity: number) => {
      let phase = 0;
      let lowest = Number.POSITIVE_INFINITY;
      let highest = Number.NEGATIVE_INFINITY;
      for (let frame = 0; frame < 400; frame += 1) {
        phase = advanceStrainPhase(phase, intensity, 16, strain);
        const { y } = getActorStrainOffset(phase, intensity, strain);
        lowest = Math.min(lowest, y);
        highest = Math.max(highest, y);
      }
      return highest - lowest;
    };
    expect(spread(1)).toBeGreaterThan(spread(0));
  });

  it("leans further into the apparatus as intensity rises", () => {
    const atRest = getActorStrainOffset(0, 0, strain);
    const atCrisis = getActorStrainOffset(0, 1, strain);
    expect(atRest.x).toBeCloseTo(0);
    expect(atCrisis.x).toBeCloseTo(strain.lean.x + strain.strainAmplitude.x);
    expect(atCrisis.y).toBeCloseTo(strain.lean.y);
  });

  it("clamps intensity outside the unit interval", () => {
    expect(getActorStrainOffset(0, -1, strain)).toEqual(getActorStrainOffset(0, 0, strain));
    expect(getActorStrainOffset(0, 2, strain)).toEqual(getActorStrainOffset(0, 1, strain));
  });

  it("stills the oscillation under reduced motion but keeps the lean", () => {
    const resolved = resolveActorStrain(strain, reducedMotion, true);
    let phase = 0;
    for (let frame = 0; frame < 200; frame += 1) {
      phase = advanceStrainPhase(phase, 1, 16, resolved);
      expect(getActorStrainOffset(phase, 1, resolved)).toEqual({
        x: strain.lean.x,
        y: strain.lean.y,
      });
    }
    expect(resolveActorStrain(strain, reducedMotion, false)).toBe(strain);
  });
});

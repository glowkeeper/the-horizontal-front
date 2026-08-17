import { describe, expect, it } from "vitest";

import {
  getResistanceAngleDegrees,
  holdPeakStateIndex,
  resolveResistanceTransition,
  selectResistanceStateIndex,
  smoothResistanceAngleDegrees,
} from "../../../../src/play/phaser/presentation/resistanceTransition";

const states = [
  { minimumDanger: 0 },
  { minimumDanger: 0.28 },
  { minimumDanger: 0.58 },
  { minimumDanger: 0.9 },
];

describe("resistance-state transitions", () => {
  it("selects the highest eligible state in either danger direction", () => {
    expect(selectResistanceStateIndex(-1, states)).toBe(0);
    expect(selectResistanceStateIndex(0.27, states)).toBe(0);
    expect(selectResistanceStateIndex(0.28, states)).toBe(1);
    expect(selectResistanceStateIndex(0.7, states)).toBe(2);
    expect(selectResistanceStateIndex(1, states)).toBe(3);
    expect(selectResistanceStateIndex(2, states)).toBe(3);
    expect(selectResistanceStateIndex(0.4, states)).toBe(1);
  });

  it("holds an opposing actor at its greatest exertion as danger falls back", () => {
    // The same danger the bed reads, ratcheted: rising danger advances the pose,
    // falling danger leaves it where it got to.
    const reached = [0.1, 0.3, 0.62, 0.4, 0.95, 0.2].reduce(
      (peak, danger) => holdPeakStateIndex(peak, selectResistanceStateIndex(danger, states)),
      0,
    );
    expect(reached).toBe(3);
    expect(holdPeakStateIndex(2, 0)).toBe(2);
    expect(holdPeakStateIndex(2, 3)).toBe(3);
    expect(holdPeakStateIndex(0, 0)).toBe(0);
  });

  it("rotates continuously with clamped physical danger", () => {
    expect(getResistanceAngleDegrees(-1, -34.1)).toBe(-0);
    expect(getResistanceAngleDegrees(0.25, -34.1)).toBeCloseTo(-8.525);
    expect(getResistanceAngleDegrees(0.5, -34.1)).toBeCloseTo(-17.05);
    expect(getResistanceAngleDegrees(1, -34.1)).toBe(-34.1);
    expect(getResistanceAngleDegrees(2, -34.1)).toBe(-34.1);
  });

  it("eases toward stepped danger angles using elapsed time", () => {
    expect(smoothResistanceAngleDegrees(0, -20, 0, 240)).toBe(0);
    expect(smoothResistanceAngleDegrees(0, -20, 240, 240)).toBeCloseTo(-12.6424);
    expect(smoothResistanceAngleDegrees(-12.6424, -20, 240, 240))
      .toBeCloseTo(-17.293);
    expect(smoothResistanceAngleDegrees(0, -20, 16, 0)).toBe(-20);
  });

  it("removes jolt and shake under reduced motion while retaining a short fade", () => {
    const transition = {
      crossfadeDurationMs: 280,
      rotationResponseMs: 240,
      joltX: -3,
      joltY: 3,
      shakeAmplitude: 2,
      shakeDurationMs: 120,
    };
    expect(resolveResistanceTransition(
      transition,
      { crossfadeDurationMs: 80 },
      false,
    )).toEqual(transition);
    expect(resolveResistanceTransition(
      transition,
      { crossfadeDurationMs: 80 },
      true,
    )).toEqual({
      crossfadeDurationMs: 80,
      rotationResponseMs: 0,
      joltX: 0,
      joltY: 0,
      shakeAmplitude: 0,
      shakeDurationMs: 0,
    });
  });
});

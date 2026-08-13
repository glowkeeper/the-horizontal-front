import { describe, expect, it } from "vitest";

import { getResistancePresentation } from "../../../../src/play/phaser/presentation/resistancePresentation";
import layoutContent from "../../../../src/play/content/presentation/layouts/bed-head-right.json";
import { resistanceLayoutSchema } from "../../../../src/play/content/schemas/presentationSchema";

const motion = resistanceLayoutSchema.parse(layoutContent).motion;

describe("resistance presentation", () => {
  it("keeps a safe bed level and the duvet over the sleeper", () => {
    expect(getResistancePresentation(1, motion)).toEqual({
      bedAngleDegrees: -0,
      duvetPullX: 0,
      sleeperSlideX: -0,
      workLightAlpha: 0.08,
    });
  });

  it("lifts the head, separates the duvet, and slides the sleeper at danger", () => {
    expect(getResistancePresentation(0, motion)).toEqual({
      bedAngleDegrees: -18,
      duvetPullX: -300,
      sleeperSlideX: -130,
      workLightAlpha: 0.62,
    });
  });

  it("clamps presentation input to the safety range", () => {
    expect(getResistancePresentation(2, motion)).toEqual(
      getResistancePresentation(1, motion),
    );
    expect(getResistancePresentation(-1, motion)).toEqual(
      getResistancePresentation(0, motion),
    );
  });
});

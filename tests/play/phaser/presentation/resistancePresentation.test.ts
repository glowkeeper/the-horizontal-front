import { describe, expect, it } from "vitest";

import { getResistancePresentation } from "../../../../src/play/phaser/presentation/resistancePresentation";
import layoutContent from "../../../../src/play/content/presentation/layouts/episode-confrontation.json";
import { resistanceLayoutSchema } from "../../../../src/play/content/schemas/presentationSchema";

const motion = resistanceLayoutSchema.parse(layoutContent).motion;

describe("resistance presentation", () => {
  it("keeps the environment calm while resistance is safe", () => {
    expect(getResistancePresentation(1, 0, motion)).toEqual({
      workLightAlpha: 0.08,
    });
  });

  it("increases environmental pressure at danger", () => {
    expect(getResistancePresentation(0, 1, motion)).toEqual({
      workLightAlpha: 0.62,
    });
  });

  it("clamps presentation input to the safety range", () => {
    expect(getResistancePresentation(2, -1, motion)).toEqual(
      getResistancePresentation(1, 0, motion),
    );
    expect(getResistancePresentation(-1, 2, motion)).toEqual(
      getResistancePresentation(0, 1, motion),
    );
  });

  it("uses authored intensity for atmosphere", () => {
    const dramaticButSafe = getResistancePresentation(1, 1, motion);
    expect(dramaticButSafe.workLightAlpha).toBeGreaterThan(
      motion.rest.workLightAlpha,
    );
  });
});

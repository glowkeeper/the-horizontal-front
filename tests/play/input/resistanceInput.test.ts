import { describe, expect, it } from "vitest";

import { getResistanceControlAction } from "../../../src/play/input/resistanceInput";

describe("resistance input", () => {
  it.each([
    ["KeyA", "left"],
    ["ArrowLeft", "left"],
    ["KeyL", "right"],
    ["ArrowRight", "right"],
  ] as const)("maps %s to the %s side", (code, side) => {
    expect(getResistanceControlAction({ code, repeat: false })).toEqual({
      kind: "resist",
      side,
    });
  });

  it("ignores key repeat so one press cannot consume several beats", () => {
    expect(getResistanceControlAction({
      code: "ArrowLeft",
      repeat: true,
    })).toBeNull();
  });

  it("keeps restart separate from resistance input", () => {
    expect(getResistanceControlAction({
      code: "KeyR",
      repeat: false,
    })).toEqual({ kind: "restart" });
  });
});

import { describe, expect, it } from "vitest";

import {
  getMenuAction,
  moveSelection,
} from "../../../src/play/input/menuInput";

describe("menu input", () => {
  it.each([
    ["ArrowUp", "previous"],
    ["ArrowLeft", "previous"],
    ["ArrowDown", "next"],
    ["ArrowRight", "next"],
    ["Enter", "select"],
    ["Space", "select"],
    ["Escape", "back"],
    ["KeyR", "replay"],
  ] as const)("maps %s to %s", (code, action) => {
    expect(getMenuAction({ code, repeat: false })).toBe(action);
  });

  it("ignores repeated keys", () => {
    expect(getMenuAction({ code: "Enter", repeat: true })).toBeNull();
  });

  it("wraps selection in both directions", () => {
    expect(moveSelection(0, "previous", 3)).toBe(2);
    expect(moveSelection(2, "next", 3)).toBe(0);
  });
});

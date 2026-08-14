import { describe, expect, it } from "vitest";

import {
  getHoldActionForKey,
  getSequenceChoiceForKey,
} from "../../../src/play/input/interruptionInput";

const choices = [
  { id: "dentist", label: "Dentist", key: "Digit1" },
  { id: "wifi", label: "Wi-Fi", key: "Digit2" },
] as const;

describe("interruption keyboard input", () => {
  it("maps authored keys to stable choice IDs", () => {
    expect(getSequenceChoiceForKey({ code: "Digit2", repeat: false }, choices)).toBe("wifi");
    expect(getSequenceChoiceForKey({ code: "KeyW", repeat: false }, choices)).toBeNull();
  });

  it("ignores repeated sequence and hold presses", () => {
    expect(getSequenceChoiceForKey({ code: "Digit1", repeat: true }, choices)).toBeNull();
    expect(getHoldActionForKey({ code: "Space", repeat: true }, "press")).toBeNull();
  });

  it("normalises Space press and release", () => {
    expect(getHoldActionForKey({ code: "Space", repeat: false }, "press")).toBe("press");
    expect(getHoldActionForKey({ code: "Space", repeat: false }, "release")).toBe("release");
  });
});

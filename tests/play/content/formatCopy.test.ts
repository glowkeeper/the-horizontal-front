import { describe, expect, it } from "vitest";

import { formatCopy } from "../../../src/play/content/formatCopy";

describe("copy formatting", () => {
  it("fills the finite named placeholders", () => {
    expect(formatCopy("{held} / {total}", { held: 2, total: 3 })).toBe("2 / 3");
  });

  it("rejects missing and unused values", () => {
    expect(() => formatCopy("{side}", {})).toThrow(/missing copy value/);
    expect(() => formatCopy("ready", { side: "LEFT" })).toThrow(/unused copy/);
  });

  it("supports repeated placeholders and rejects stray braces", () => {
    expect(formatCopy("{side} then {side}", { side: "LEFT" }))
      .toBe("LEFT then LEFT");
    expect(() => formatCopy("{side} {", { side: "LEFT" }))
      .toThrow(/stray braces/);
  });
});

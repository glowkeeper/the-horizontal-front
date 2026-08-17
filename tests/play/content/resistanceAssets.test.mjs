import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("resistance-state assets", () => {
  it("keeps every state registered to one transparent production canvas", () => {
    for (const name of [
      "rest",
      "early-pressure",
      "high-pressure",
      "final-pressure",
    ]) {
      const png = readFileSync(new URL(
        `../../../src/play/content/presentation/assets/episodes/the-alarm/resistance-states/${name}.png`,
        import.meta.url,
      ));
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(900);
      expect(png.readUInt32BE(20)).toBe(900);
      expect(png[25]).toBe(6);
    }
  });
});

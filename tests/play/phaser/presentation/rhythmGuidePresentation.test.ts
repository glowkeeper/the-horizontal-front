import { describe, expect, it } from "vitest";

import {
  getRhythmGateWidth,
  getRhythmNotePosition,
  getVisibleLaneSegment,
} from "../../../../src/play/phaser/presentation/rhythmGuidePresentation";

const base = {
  originX: 640,
  targetX: 870,
  side: "right" as const,
  atMs: 2_000,
  timingWindowMs: 300,
  noteTravelPixelsPerMs: 0.14,
};

describe("rhythm guide presentation", () => {
  it("maps the real timing window across the complete gate", () => {
    expect(getRhythmGateWidth(300, 0.14)).toBeCloseTo(84);
    expect(positionAt(1_700)).toBe(828);
    expect(positionAt(2_000)).toBe(870);
    expect(positionAt(2_300)).toBe(912);
  });

  it("mirrors outward travel for the left gate", () => {
    const left = { ...base, targetX: 410, side: "left" as const };
    expect(getRhythmNotePosition({ ...left, elapsedMs: 1_700 }).x).toBe(452);
    expect(getRhythmNotePosition({ ...left, elapsedMs: 2_000 }).x).toBe(410);
    expect(getRhythmNotePosition({ ...left, elapsedMs: 2_300 }).x).toBe(368);
  });

  it("emerges from the centre at the same constant travel speed", () => {
    expect(getRhythmNotePosition({ ...base, elapsedMs: 300 }).emerged).toBe(false);
    expect(positionAt(300)).toBe(640);
    expect(positionAt(1_100)).toBe(744);
    expect(positionAt(1_700)).toBe(828);
  });

  it("turns hold duration into stable physical length", () => {
    const head = getRhythmNotePosition({ ...base, elapsedMs: 3_000 });
    const tail = getRhythmNotePosition({
      ...base,
      atMs: 3_000,
      elapsedMs: 3_000,
    });
    expect(head.x - tail.x).toBe(140);
  });

  it("clips long holds to their own lane", () => {
    expect(getVisibleLaneSegment("left", 640, 1_280, -200, 700)).toEqual({
      fromX: 0,
      toX: 640,
    });
    expect(getVisibleLaneSegment("right", 640, 1_280, 1_500, 500)).toEqual({
      fromX: 1_280,
      toX: 640,
    });
  });
});

function positionAt(elapsedMs: number): number {
  return getRhythmNotePosition({ ...base, elapsedMs }).x;
}

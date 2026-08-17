import type { ResistanceSide } from "../../engine/types";

export type RhythmNotePositionInput = {
  readonly originX: number;
  readonly targetX: number;
  readonly side: ResistanceSide;
  readonly atMs: number;
  readonly timingWindowMs: number;
  readonly elapsedMs: number;
  readonly noteTravelPixelsPerMs: number;
};

export type RhythmNotePosition = {
  readonly x: number;
  readonly approach: number;
  readonly emerged: boolean;
};

export type VisibleLaneSegment = {
  readonly fromX: number;
  readonly toX: number;
};

export function getRhythmGateWidth(
  timingWindowMs: number,
  noteTravelPixelsPerMs: number,
): number {
  return timingWindowMs * noteTravelPixelsPerMs * 2;
}

export function getRhythmNotePosition(
  input: RhythmNotePositionInput,
): RhythmNotePosition {
  const direction = input.side === "left" ? -1 : 1;
  const rawX = input.targetX + direction
    * (input.elapsedMs - input.atMs)
    * input.noteTravelPixelsPerMs;
  const emerged = direction === 1
    ? rawX >= input.originX
    : rawX <= input.originX;
  const x = emerged ? rawX : input.originX;
  const innerEdgeX = input.targetX - direction
    * input.timingWindowMs * input.noteTravelPixelsPerMs;
  const journey = Math.abs(innerEdgeX - input.originX);
  const travelled = Math.abs(x - input.originX);
  return {
    x,
    approach: journey === 0 ? 1 : clamp01(travelled / journey),
    emerged,
  };
}

export function getVisibleLaneSegment(
  side: ResistanceSide,
  originX: number,
  canvasWidth: number,
  fromX: number,
  toX: number,
): VisibleLaneSegment {
  const minimumX = side === "left" ? 0 : originX;
  const maximumX = side === "left" ? originX : canvasWidth;
  return {
    fromX: clamp(fromX, minimumX, maximumX),
    toX: clamp(toX, minimumX, maximumX),
  };
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

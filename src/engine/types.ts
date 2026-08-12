export type ResistanceSide = "left" | "right";

export type ResistanceInput = {
  side: ResistanceSide;
  atMs: number;
};

export type ResistanceState = {
  duvetSafety: number;
  previousSide: ResistanceSide | null;
  rhythmMomentum: number;
  elapsedMs: number;
};
export type ResistanceSide = "left" | "right";

export type ResistanceInput = {
  side: ResistanceSide;
  atMs: number;
};

export type RhythmStep = {
  readonly side: ResistanceSide;
};

export type RhythmPattern = {
  readonly steps: readonly RhythmStep[];
  readonly beatIntervalMs: number;
  readonly timingWindowMs: number;
};

export type ResistanceConfig = {
  readonly durationMs: number;
  readonly startingSafety: number;
  readonly pressurePerSecond: number;
  readonly recoveryPerBeat: number;
  readonly momentumGain: number;
  readonly momentumLoss: number;
  readonly momentumRecoveryBonus: number;
  readonly rhythm: RhythmPattern;
};

export type ResistanceOutcome =
  | "active"
  | "victory"
  | "forced-verticalisation";

export type RhythmJudgement =
  | {
      kind: "hit";
      accuracy: number;
      expectedSide: ResistanceSide;
      actualSide: ResistanceSide;
      step: number;
    }
  | {
      kind: "miss";
      reason: "early" | "wrong-side" | "expired";
      expectedSide: ResistanceSide;
      actualSide: ResistanceSide | null;
      step: number;
    };

export type ResistanceState = {
  readonly duvetSafety: number;
  readonly rhythmMomentum: number;
  readonly nextRhythmStep: number;
  readonly elapsedMs: number;
  readonly outcome: ResistanceOutcome;
  readonly lastRhythmJudgement: RhythmJudgement | null;
};

export type Resistance = {
  readonly config: ResistanceConfig;
  readonly state: ResistanceState;
};

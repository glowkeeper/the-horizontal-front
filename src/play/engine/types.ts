export type ResistanceSide = "left" | "right";

export type ResistanceInput = {
  readonly side: ResistanceSide;
  readonly action: "press" | "release";
  readonly atMs: number;
};

type ScoredRhythmCueBase = {
  readonly side: ResistanceSide;
  readonly atMs: number;
  readonly timingWindowMs: number;
  readonly phaseIndex: number;
};

export type ScoredRhythmCue =
  | (ScoredRhythmCueBase & {
      readonly action: "tap";
      readonly releaseAtMs: null;
    })
  | (ScoredRhythmCueBase & {
      readonly action: "hold";
      readonly releaseAtMs: number;
    });

export type RhythmGuideEvent =
  | {
      readonly action: "tap" | "hold";
      readonly side: ResistanceSide;
      readonly atMs: number;
      readonly endsAtMs: number;
      readonly phaseIndex: number;
    }
  | {
      readonly action: "rest" | "count-in";
      readonly atMs: number;
      readonly endsAtMs: number;
      readonly phaseIndex: number;
    };

export type ResistancePhase = {
  readonly id: string;
  readonly startsAtMs: number;
  readonly endsAtMs: number;
  readonly pressurePerSecond: number;
  readonly recoveryPerAction: number;
  readonly safetyPenaltyPerMiss: number;
  readonly momentumGain: number;
  readonly momentumLoss: number;
  readonly momentumRecoveryBonus: number;
  readonly presentationIntensity: {
    readonly from: number;
    readonly to: number;
  };
};

export type ResistanceConfig = {
  readonly durationMs: number;
  readonly resolutionDurationMs: number;
  readonly startingSafety: number;
  readonly phases: readonly ResistancePhase[];
  readonly cues: readonly ScoredRhythmCue[];
  readonly guideEvents: readonly RhythmGuideEvent[];
};

export type ResistanceOutcome = "active" | "victory" | "forced-verticalisation";

export type RhythmJudgement =
  | {
      readonly kind: "hit";
      readonly accuracy: number;
      readonly expectedSide: ResistanceSide;
      readonly actualSide: ResistanceSide;
      readonly step: number;
      readonly action: "tap" | "hold";
    }
  | {
      readonly kind: "miss";
      readonly reason: "early" | "wrong-side" | "expired" | "released-early";
      readonly expectedSide: ResistanceSide;
      readonly actualSide: ResistanceSide | null;
      readonly step: number;
      readonly action: "tap" | "hold";
    };

export type ActiveHold = {
  readonly step: number;
  readonly side: ResistanceSide;
  readonly pressedAtMs: number;
};

export type ResistanceState = {
  readonly duvetSafety: number;
  readonly rhythmMomentum: number;
  readonly nextRhythmStep: number;
  readonly activeHold: ActiveHold | null;
  readonly elapsedMs: number;
  readonly dramaticIntensity: number;
  readonly outcome: ResistanceOutcome;
  readonly lastRhythmJudgement: RhythmJudgement | null;
};

export type Resistance = {
  readonly config: ResistanceConfig;
  readonly state: ResistanceState;
};

export type RhythmCue = ScoredRhythmCue & { readonly step: number };

export type RhythmGuideItem = RhythmGuideEvent & {
  readonly timing: "now" | "next" | "then";
};

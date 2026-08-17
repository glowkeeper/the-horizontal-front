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
  /**
   * When the apparatus announces this demand, ahead of the moment it falls due.
   *
   * Synchronising to a rhythm is anticipatory: people place a movement by
   * predicting the beat, not by responding to it, so a signal arriving at the
   * instant of the demand cannot be answered in time by anyone. Announcing the
   * side in advance is what makes the score playable by ear rather than only
   * readable on screen. Derived from the curve's authored lead in beats, so it
   * scales with tempo instead of being a fixed millisecond constant.
   *
   * See `docs/research/audio-led-rhythm-cueing.md`.
   */
  readonly approachAtMs: number;
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
      readonly action: "tap";
      readonly side: ResistanceSide;
      readonly atMs: number;
      readonly timingWindowMs: number;
      readonly endsAtMs: number;
      readonly phaseIndex: number;
    }
  | {
      readonly action: "hold";
      readonly side: ResistanceSide;
      readonly atMs: number;
      readonly timingWindowMs: number;
      readonly releaseAtMs: number;
      readonly endsAtMs: number;
      readonly phaseIndex: number;
    }
  | {
      readonly action: "rest" | "count-in" | "interruption";
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
  readonly resistanceGainPerHit: number;
  readonly resistanceLossPerMiss: number;
  readonly resistanceRecoveryBonus: number;
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
  /**
   * Every beat the episode contains, whether or not it asks for an action.
   *
   * Scored cues are sparse by design — rests are part of the composition — so
   * the pulse the player is keeping cannot be recovered from `cues` alone. The
   * compiler keeps the grid it already walked rather than making presentation
   * rebuild it from phase tempos.
   */
  readonly beatTimesMs: readonly number[];
  /**
   * The beats that begin a rhythm cycle.
   *
   * A pulse that is merely periodic gives the player tempo but not position:
   * they can hear that beats are passing without knowing where in the bar the
   * next demand falls. Marking the cycle lets presentation accent it, so the
   * grid becomes countable rather than uniform.
   */
  readonly downbeatTimesMs: readonly number[];
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
  readonly resistanceStrength: number;
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

export type SequenceInterruptionConfig = {
  readonly kind: "sequence";
  readonly choices: readonly { readonly id: string; readonly label: string; readonly key: string }[];
  readonly steps: readonly string[];
};

export type HoldInterruptionConfig = {
  readonly kind: "hold";
  readonly pressDeadlineMs: number;
  readonly requiredHoldMs: number;
};

export type InterruptionConfig = {
  readonly id: string;
  readonly warningStartsAtMs: number;
  readonly startsAtMs: number;
  readonly endsAtMs: number;
  readonly returnsAtMs: number;
  readonly consequences: { readonly successSafety: number; readonly failureSafety: number };
  readonly presentation: {
    readonly skin: { readonly source: "shared" | "episode"; readonly id: string };
  };
  readonly copy: {
    readonly warning: string; readonly headline: string; readonly instruction: string;
    readonly status: string;
    readonly success: string; readonly failure: string; readonly expired: string;
    readonly cancelled: string;
    readonly returning: string;
  };
  readonly interaction: SequenceInterruptionConfig | HoldInterruptionConfig;
};

export type ConfrontationConfig = {
  readonly resistance: ResistanceConfig;
  readonly interruptions: readonly InterruptionConfig[];
};

export type InterruptionOutcome = "success" | "failure" | "cancelled";
export type ActiveInterruptionState = {
  readonly index: number;
  readonly sequenceStep: number;
  readonly holdStartedAtMs: number | null;
  readonly outcome: InterruptionOutcome | null;
  readonly feedback: "success" | "failure" | "expired" | "cancelled" | null;
};

export type Confrontation = {
  readonly config: ConfrontationConfig;
  readonly resistance: Resistance;
  readonly completedOutcomes: readonly InterruptionOutcome[];
  readonly activeInterruption: ActiveInterruptionState | null;
};

export type ConfrontationInput =
  | { readonly kind: "resistance"; readonly side: ResistanceSide; readonly action: "press" | "release"; readonly atMs: number }
  | { readonly kind: "sequence"; readonly choiceId: string; readonly atMs: number }
  | { readonly kind: "hold"; readonly action: "press" | "release" | "cancel"; readonly atMs: number };

export type ConfrontationControlOwner = "resistance" | "interruption" | "none";

export type InterruptionPresentationState =
  | { readonly stage: "resistance" }
  | { readonly stage: "warning"; readonly interruption: InterruptionConfig }
  | { readonly stage: "active" | "resolved" | "returning"; readonly interruption: InterruptionConfig; readonly state: ActiveInterruptionState };

export type RhythmCue = ScoredRhythmCue & { readonly step: number };

export type RhythmGuideItem = RhythmGuideEvent & {
  readonly timing: "now" | "next" | "then";
};

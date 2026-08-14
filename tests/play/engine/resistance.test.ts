import { describe, expect, it } from "vitest";

import {
  advanceResistance, applyResistanceInput, createResistance,
  getDramaticIntensity, getNextRhythmCue, getRhythmGuide,
} from "../../../src/play/engine/resistance";
import type {
  Resistance, ResistanceConfig, ResistanceSide,
} from "../../../src/play/engine/types";

const config: ResistanceConfig = {
  durationMs: 4_000,
  resolutionDurationMs: 500,
  startingSafety: 0.8,
  phases: [
    {
      id: "opening", startsAtMs: 0, endsAtMs: 2_000,
      pressurePerSecond: 0.1, recoveryPerAction: 0.08,
      safetyPenaltyPerMiss: 0.02,
      resistanceGainPerHit: 0.2, resistanceLossPerMiss: 0.15,
      resistanceRecoveryBonus: 0.5,
      presentationIntensity: { from: 0, to: 0.4 },
    },
    {
      id: "crisis", startsAtMs: 2_000, endsAtMs: 4_000,
      pressurePerSecond: 0.2, recoveryPerAction: 0.1,
      safetyPenaltyPerMiss: 0.04,
      resistanceGainPerHit: 0.1, resistanceLossPerMiss: 0.2,
      resistanceRecoveryBonus: 0.5,
      presentationIntensity: { from: 0.4, to: 1 },
    },
  ],
  cues: [
    { action: "tap", side: "left", atMs: 500, releaseAtMs: null, timingWindowMs: 100, phaseIndex: 0 },
    { action: "tap", side: "right", atMs: 1_000, releaseAtMs: null, timingWindowMs: 100, phaseIndex: 0 },
    { action: "hold", side: "left", atMs: 2_500, releaseAtMs: 3_000, timingWindowMs: 100, phaseIndex: 1 },
  ],
  guideEvents: [
    { action: "tap", side: "left", atMs: 500, timingWindowMs: 100, endsAtMs: 600, phaseIndex: 0 },
    { action: "tap", side: "right", atMs: 1_000, timingWindowMs: 100, endsAtMs: 1_100, phaseIndex: 0 },
    { action: "hold", side: "left", atMs: 2_500, timingWindowMs: 100, releaseAtMs: 3_000, endsAtMs: 3_100, phaseIndex: 1 },
  ],
};

describe("resistance engine", () => {
  it("creates bounded state from a finite resolved score", () => {
    expect(createResistance(config).state).toMatchObject({
      duvetSafety: 0.8, resistanceStrength: 0, nextRhythmStep: 0,
      activeHold: null, elapsedMs: 0, dramaticIntensity: 0, outcome: "active",
    });
  });

  it("integrates phase pressures independently of update frequency", () => {
    const initial = createResistance(config);
    const once = advanceResistance(initial, 3_000);
    const split = advanceResistance(advanceResistance(initial, 1_000), 3_000);
    expect(split).toEqual(once);
    expect(once.state.duvetSafety).toBeCloseTo(0.32);
  });

  it("lets earned resistance protect the player between slow beats", () => {
    const exposed: ResistanceConfig = {
      ...config,
      cues: [],
      guideEvents: [],
    };
    const initial = createResistance(exposed);
    const protectedResistance: Resistance = {
      ...initial,
      state: { ...initial.state, resistanceStrength: 0.75 },
    };
    const afterOneSecond = advanceResistance(protectedResistance, 1_000);
    expect(afterOneSecond.state.duvetSafety).toBeCloseTo(0.775);
    expect(afterOneSecond.state.resistanceStrength).toBe(0.75);
  });

  it("orders passive pressure and expired cues independently of update frequency", () => {
    const once = advanceResistance(createResistance(config), 3_500);
    let stepped = createResistance(config);
    for (let atMs = 100; atMs <= 3_500; atMs += 100) {
      stepped = advanceResistance(stepped, atMs);
    }
    expect(stepped.state.duvetSafety).toBeCloseTo(once.state.duvetSafety);
    expect(stepped.state.resistanceStrength)
      .toBeCloseTo(once.state.resistanceStrength);
    expect(stepped.state.nextRhythmStep).toBe(once.state.nextRhythmStep);
    expect(stepped.state.outcome).toBe(once.state.outcome);
  });

  it("pauses pressure and dramatic movement during READY and REST", () => {
    const paused: ResistanceConfig = {
      ...config,
      cues: [],
      guideEvents: [
        { action: "count-in", atMs: 0, endsAtMs: 500, phaseIndex: 0 },
        { action: "rest", atMs: 1_000, endsAtMs: 1_500, phaseIndex: 0 },
      ],
    };
    const initial = createResistance(paused);
    const earned: Resistance = {
      ...initial,
      state: { ...initial.state, resistanceStrength: 0.6 },
    };
    const duringReady = advanceResistance(earned, 250);
    expect(duringReady.state.duvetSafety).toBeCloseTo(0.8);
    expect(duringReady.state.dramaticIntensity).toBeCloseTo(0);
    expect(duringReady.state.resistanceStrength).toBe(0.6);

    const atRestStart = advanceResistance(duringReady, 1_000);
    const duringRest = advanceResistance(atRestStart, 1_250);
    expect(duringRest.state.duvetSafety).toBeCloseTo(atRestStart.state.duvetSafety);
    expect(duringRest.state.dramaticIntensity).toBeCloseTo(
      atRestStart.state.dramaticIntensity,
    );
    expect(advanceResistance(duringRest, 1_500).state.duvetSafety)
      .toBeCloseTo(atRestStart.state.duvetSafety);
    expect(duringRest.state.resistanceStrength).toBe(0.6);
  });

  it("interpolates the authored dramatic curve", () => {
    expect(getDramaticIntensity(config, 1_000)).toBeCloseTo(0.2);
    expect(getDramaticIntensity(config, 3_000)).toBeCloseTo(0.7);
  });

  it("exposes the next scored cue to presentation", () => {
    expect(getNextRhythmCue(createResistance(config))).toMatchObject({
      action: "tap", side: "left", atMs: 500, step: 0,
    });
  });

  it("exposes guide events without turning rests into scored cues", () => {
    const guided: ResistanceConfig = {
      ...config,
      guideEvents: [
        { action: "count-in", atMs: 0, endsAtMs: 500, phaseIndex: 0 },
        ...config.guideEvents,
        { action: "rest", atMs: 1_100, endsAtMs: 1_500, phaseIndex: 0 },
      ],
    };
    expect(getRhythmGuide(createResistance(guided))).toMatchObject([
      { action: "count-in", timing: "now" },
      { action: "tap", side: "left", timing: "next" },
      { action: "tap", side: "right", timing: "then" },
    ]);
    expect(guided.cues).toHaveLength(config.cues.length);
  });

  it("rewards an accurately timed tap", () => {
    const result = press(createResistance(config), "left", 500);
    expect(result.state.nextRhythmStep).toBe(1);
    expect(result.state.resistanceStrength).toBeCloseTo(0.2);
    expect(result.state.lastRhythmJudgement).toMatchObject({
      kind: "hit", action: "tap", accuracy: 1,
    });
    expect(getRhythmGuide(result)[0]).toMatchObject({
      action: "tap", side: "right",
    });
  });

  it("penalises early and wrong-side presses", () => {
    const early = press(createResistance(config), "left", 300);
    expect(early.state.lastRhythmJudgement).toMatchObject({ kind: "miss", reason: "early" });
    expect(early.state.nextRhythmStep).toBe(0);
    const wrong = press(createResistance(config), "right", 500);
    expect(wrong.state.lastRhythmJudgement).toMatchObject({ kind: "miss", reason: "wrong-side" });
    expect(wrong.state.nextRhythmStep).toBe(1);
  });

  it("expires missed cues and weakens earned resistance", () => {
    const built = press(createResistance(config), "left", 500);
    const expired = advanceResistance(built, 1_101);
    expect(expired.state.nextRhythmStep).toBe(2);
    expect(expired.state.resistanceStrength).toBeCloseTo(0.05);
    expect(expired.state.lastRhythmJudgement).toMatchObject({ kind: "miss", reason: "expired" });
  });

  it("requires a hold to be pressed and released on its authored boundaries", () => {
    let resistance = advanceResistance(createResistance(config), 2_500);
    resistance = press(resistance, "left", 2_500);
    expect(resistance.state.activeHold).toMatchObject({ side: "left", step: 2 });
    resistance = release(resistance, "left", 3_000);
    expect(resistance.state.activeHold).toBeNull();
    expect(resistance.state.lastRhythmJudgement).toMatchObject({ kind: "hit", action: "hold" });
  });

  it("penalises releasing a hold too early", () => {
    let resistance = advanceResistance(createResistance(config), 2_500);
    resistance = press(resistance, "left", 2_500);
    resistance = release(resistance, "left", 2_700);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "miss", reason: "released-early",
    });
  });

  it("folds press accuracy into hold accuracy", () => {
    let resistance = advanceResistance(createResistance(config), 2_600);
    resistance = press(resistance, "left", 2_600);
    resistance = release(resistance, "left", 3_000);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "hit", action: "hold", accuracy: 0,
    });
  });

  it("expires a hold which is released too late", () => {
    let resistance = advanceResistance(createResistance(config), 2_500);
    resistance = press(resistance, "left", 2_500);
    resistance = advanceResistance(resistance, 3_101);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "miss", reason: "expired", action: "hold",
    });
    expect(resistance.state.activeHold).toBeNull();
  });

  it("wins at the end when safety remains", () => {
    const safe = {
      ...config,
      phases: config.phases.map((phase) => ({ ...phase, pressurePerSecond: 0 })),
    };
    expect(advanceResistance(createResistance(safe), 4_000).state.outcome).toBe("victory");
  });

  it("fails at the precise time phase pressure removes safety", () => {
    const dangerous = {
      ...config,
      startingSafety: 0.1,
      cues: [],
      guideEvents: [],
    };
    const result = advanceResistance(createResistance(dangerous), 2_000);
    expect(result.state.outcome).toBe("forced-verticalisation");
    expect(result.state.elapsedMs).toBeCloseTo(1_000);
  });

  it("validates configuration at the creation boundary", () => {
    expect(() => createResistance({ ...config, phases: [] }))
      .toThrow("phases must not be empty");
  });

  it("rejects time moving backwards", () => {
    const advanced = advanceResistance(createResistance(config), 200);
    expect(() => advanceResistance(advanced, 199)).toThrow("cannot move backwards");
  });
});

function press(resistance: Resistance, side: ResistanceSide, atMs: number): Resistance {
  return applyResistanceInput(resistance, { side, action: "press", atMs });
}
function release(resistance: Resistance, side: ResistanceSide, atMs: number): Resistance {
  return applyResistanceInput(resistance, { side, action: "release", atMs });
}

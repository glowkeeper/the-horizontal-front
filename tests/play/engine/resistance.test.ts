import { describe, expect, it } from "vitest";

import {
  advanceResistance, applyResistanceInput, createResistance,
  getDramaticIntensity, getNextRhythmCue,
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
      momentumGain: 0.2, momentumLoss: 0.15, momentumRecoveryBonus: 0.5,
      presentationIntensity: { from: 0, to: 0.4 },
    },
    {
      id: "crisis", startsAtMs: 2_000, endsAtMs: 4_000,
      pressurePerSecond: 0.2, recoveryPerAction: 0.1,
      safetyPenaltyPerMiss: 0.04,
      momentumGain: 0.1, momentumLoss: 0.2, momentumRecoveryBonus: 0.5,
      presentationIntensity: { from: 0.4, to: 1 },
    },
  ],
  cues: [
    { action: "tap", side: "left", atMs: 500, releaseAtMs: null, timingWindowMs: 100, phaseIndex: 0 },
    { action: "tap", side: "right", atMs: 1_000, releaseAtMs: null, timingWindowMs: 100, phaseIndex: 0 },
    { action: "hold", side: "left", atMs: 2_500, releaseAtMs: 3_000, timingWindowMs: 100, phaseIndex: 1 },
  ],
};

describe("resistance engine", () => {
  it("creates bounded state from a finite resolved score", () => {
    expect(createResistance(config).state).toMatchObject({
      duvetSafety: 0.8, rhythmMomentum: 0, nextRhythmStep: 0,
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

  it("interpolates the authored dramatic curve", () => {
    expect(getDramaticIntensity(config, 1_000)).toBeCloseTo(0.2);
    expect(getDramaticIntensity(config, 3_000)).toBeCloseTo(0.7);
  });

  it("exposes the next scored cue to presentation", () => {
    expect(getNextRhythmCue(createResistance(config))).toMatchObject({
      action: "tap", side: "left", atMs: 500, step: 0,
    });
  });

  it("rewards an accurately timed tap", () => {
    const result = press(createResistance(config), "left", 500);
    expect(result.state.nextRhythmStep).toBe(1);
    expect(result.state.rhythmMomentum).toBeCloseTo(0.2);
    expect(result.state.lastRhythmJudgement).toMatchObject({
      kind: "hit", action: "tap", accuracy: 1,
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

  it("expires missed cues and removes momentum", () => {
    const built = press(createResistance(config), "left", 500);
    const expired = advanceResistance(built, 1_101);
    expect(expired.state.nextRhythmStep).toBe(2);
    expect(expired.state.rhythmMomentum).toBeCloseTo(0.05);
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
    const dangerous = { ...config, startingSafety: 0.1 };
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

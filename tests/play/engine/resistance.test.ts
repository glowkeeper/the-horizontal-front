import { describe, expect, it } from "vitest";

import {
  advanceResistance,
  applyResistanceInput,
  createResistance,
  getNextRhythmCue,
  getRhythmStepTime,
} from "../../../src/play/engine/resistance";
import type {
  Resistance,
  ResistanceConfig,
} from "../../../src/play/engine/types";

const config: ResistanceConfig = {
  durationMs: 10_000,
  startingSafety: 0.8,
  pressurePerSecond: 0.1,
  recoveryPerBeat: 0.08,
  momentumGain: 0.2,
  momentumLoss: 0.15,
  momentumRecoveryBonus: 0.5,
  rhythm: {
    steps: [{ side: "left" }, { side: "right" }],
    leadInBeats: 1,
    beatIntervalMs: 500,
    timingWindowMs: 100,
  },
};

describe("resistance engine", () => {
  it("keeps an active state and its configuration together", () => {
    expect(createResistance(config)).toEqual({
      config,
      state: {
        duvetSafety: 0.8,
        rhythmMomentum: 0,
        nextRhythmStep: 0,
        elapsedMs: 0,
        outcome: "active",
        lastRhythmJudgement: null,
      },
    });
  });

  it("applies pressure according to elapsed time", () => {
    const resistance = advanceResistance(createResistance(config), 2_000);

    expect(resistance.state.duvetSafety).toBeCloseTo(0.6);
    expect(resistance.state.elapsedMs).toBe(2_000);
  });

  it("is independent of update frequency", () => {
    const initial = createResistance(config);
    const singleUpdate = advanceResistance(initial, 2_000);
    const splitUpdates = advanceResistance(
      advanceResistance(initial, 750),
      2_000,
    );

    expect(splitUpdates).toEqual(singleUpdate);
  });

  it("starts the first expected step after one beat interval", () => {
    expect(getRhythmStepTime(config.rhythm, 0)).toBe(500);
    expect(getRhythmStepTime(config.rhythm, 3)).toBe(2_000);
  });

  it("exposes the next authored cue for presentation adapters", () => {
    const initial = createResistance(config);
    const afterLeft = input(initial, "left", 500);

    expect(getNextRhythmCue(initial)).toEqual({
      side: "left",
      atMs: 500,
      step: 0,
    });
    expect(getNextRhythmCue(afterLeft)).toEqual({
      side: "right",
      atMs: 1_000,
      step: 1,
    });
  });

  it("rewards the correct side at the correct time", () => {
    const resistance = input(createResistance(config), "left", 500);

    expect(resistance.state.nextRhythmStep).toBe(1);
    expect(resistance.state.rhythmMomentum).toBeCloseTo(0.2);
    expect(resistance.state.duvetSafety).toBeCloseTo(0.838);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "hit",
      accuracy: 1,
      expectedSide: "left",
      step: 0,
    });
  });

  it("grades correct input within the timing window", () => {
    const perfect = input(createResistance(config), "left", 500);
    const edge = input(createResistance(config), "left", 400);

    expect(edge.state.lastRhythmJudgement).toMatchObject({
      kind: "hit",
      accuracy: 0,
    });
    expect(edge.state.duvetSafety).toBeLessThan(perfect.state.duvetSafety);
    expect(edge.state.rhythmMomentum).toBe(0);
  });

  it("penalises early input without consuming the expected step", () => {
    const builtMomentum = input(createResistance(config), "left", 500);
    const resistance = input(builtMomentum, "right", 700);

    expect(resistance.state.nextRhythmStep).toBe(1);
    expect(resistance.state.rhythmMomentum).toBeCloseTo(0.05);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "miss",
      reason: "early",
      expectedSide: "right",
    });
  });

  it("penalises the wrong side and consumes that beat", () => {
    const resistance = input(createResistance(config), "right", 500);

    expect(resistance.state.nextRhythmStep).toBe(1);
    expect(resistance.state.duvetSafety).toBeCloseTo(0.75);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "miss",
      reason: "wrong-side",
      expectedSide: "left",
    });
  });

  it("expires missed beats and reduces momentum", () => {
    const builtMomentum = input(createResistance(config), "left", 500);
    const resistance = advanceResistance(builtMomentum, 1_601);

    expect(resistance.state.nextRhythmStep).toBe(3);
    expect(resistance.state.rhythmMomentum).toBe(0);
    expect(resistance.state.lastRhythmJudgement).toMatchObject({
      kind: "miss",
      reason: "expired",
      expectedSide: "left",
      step: 2,
    });
  });

  it("uses momentum to strengthen recovery", () => {
    const first = input(createResistance(config), "left", 500);
    const second = input(first, "right", 1_000);

    const firstNetRecovery = first.state.duvetSafety - 0.75;
    const secondNetRecovery =
      second.state.duvetSafety - (first.state.duvetSafety - 0.05);
    expect(secondNetRecovery).toBeGreaterThan(firstNetRecovery);
  });

  it("clamps safety and momentum to their bounded ranges", () => {
    const safeConfig = {
      ...config,
      startingSafety: 1,
      pressurePerSecond: 0,
    };
    let resistance = createResistance(safeConfig);

    for (let step = 0; step < 8; step += 1) {
      resistance = input(
        resistance,
        step % 2 === 0 ? "left" : "right",
        getRhythmStepTime(config.rhythm, step),
      );
    }

    expect(resistance.state.duvetSafety).toBe(1);
    expect(resistance.state.rhythmMomentum).toBe(1);
  });

  it("wins when positive safety remains at the duration", () => {
    const safeConfig = { ...config, pressurePerSecond: 0.01 };
    const resistance = advanceResistance(
      createResistance(safeConfig),
      safeConfig.durationMs,
    );

    expect(resistance.state.outcome).toBe("victory");
    expect(resistance.state.elapsedMs).toBe(safeConfig.durationMs);
  });

  it("fails at the precise time pressure removes the duvet", () => {
    const dangerousConfig = {
      ...config,
      startingSafety: 0.5,
      pressurePerSecond: 0.25,
    };
    const resistance = advanceResistance(
      createResistance(dangerousConfig),
      4_000,
    );

    expect(resistance.state.outcome).toBe("forced-verticalisation");
    expect(resistance.state.duvetSafety).toBe(0);
    expect(resistance.state.elapsedMs).toBe(2_000);
  });

  it("fails when safety reaches zero exactly as time expires", () => {
    const boundaryConfig = {
      ...config,
      startingSafety: 0.5,
      pressurePerSecond: 0.05,
    };
    const resistance = advanceResistance(
      createResistance(boundaryConfig),
      boundaryConfig.durationMs,
    );

    expect(resistance.state.outcome).toBe("forced-verticalisation");
  });

  it("does not change terminal resistance values", () => {
    const safeConfig = { ...config, pressurePerSecond: 0 };
    const victory = advanceResistance(
      createResistance(safeConfig),
      safeConfig.durationMs,
    );

    expect(advanceResistance(victory, 20_000)).toBe(victory);
    expect(input(victory, "left", 20_000)).toBe(victory);
  });

  it("rejects time moving backwards", () => {
    const resistance = advanceResistance(createResistance(config), 1_000);

    expect(() => advanceResistance(resistance, 999)).toThrow(
      "resistance time cannot move backwards",
    );
  });

  it("validates configuration at every public operation", () => {
    const resistance = createResistance(config);
    const invalid: Resistance = {
      ...resistance,
      config: {
        ...resistance.config,
        pressurePerSecond: -1,
      },
    };

    expect(() => advanceResistance(invalid, 500)).toThrow(
      "pressurePerSecond must be a finite non-negative number",
    );
    expect(() => input(invalid, "left", 500)).toThrow(
      "pressurePerSecond must be a finite non-negative number",
    );
  });

  it("rejects rhythm windows which overlap neighbouring beats", () => {
    expect(() => createResistance({
      ...config,
      rhythm: { ...config.rhythm, timingWindowMs: 250 },
    })).toThrow(
      "rhythm.timingWindowMs must be less than half rhythm.beatIntervalMs",
    );
  });
});

function input(
  resistance: Resistance,
  side: "left" | "right",
  atMs: number,
): Resistance {
  return applyResistanceInput(resistance, { side, atMs });
}

import { describe, expect, it } from "vitest";

import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import straightAlternationContent from "../../../src/play/content/mechanics/rhythms/straight-alternation.json";
import { game, mechanics } from "../../../src/play/content/game";
import {
  compileResistanceConfig,
  createEpisodeMechanicScope,
  loadMechanicLibrary,
} from "../../../src/play/content/loadMechanics";
import {
  advanceResistance,
  applyResistanceInput,
  createResistance,
} from "../../../src/play/engine/resistance";
import {
  dramaticCurveSchema,
  rhythmPatternSchema,
  sharedDramaticCurveSchema,
} from "../../../src/play/content/schemas/mechanicsSchema";

describe("catalogued resistance composition", () => {
  it("loads the complete documented rhythm vocabulary", () => {
    expect([...mechanics.rhythms.keys()]).toEqual([
      "straight-alternation",
      "managerial-waltz",
      "syncopated-counterpull",
      "deliberate-rests",
      "sustained-grip",
      "call-and-response",
    ]);
    expect(mechanics.rhythms.get("sustained-grip")?.events)
      .toContainEqual({ action: "hold", side: "left", atBeat: 0, durationBeats: 2 });
    expect(mechanics.rhythms.get("deliberate-rests")?.events)
      .toContainEqual({ action: "rest", atBeat: 2, durationBeats: 2 });
  });

  it("compiles The Alarm into four contiguous phases and a finite cue score", () => {
    const config = game.entryEpisode.confrontation.resistance;
    expect(config.durationMs + config.resolutionDurationMs).toBe(26_000);
    expect(config.phases.map(({ id, startsAtMs, endsAtMs }) => ({ id, startsAtMs, endsAtMs })))
      .toEqual([
        { id: "orientation", startsAtMs: 0, endsAtMs: 4_000 },
        { id: "establishment", startsAtMs: 4_000, endsAtMs: 10_000 },
        { id: "pressure", startsAtMs: 10_000, endsAtMs: 18_000 },
        { id: "crisis", startsAtMs: 18_000, endsAtMs: 23_000 },
      ]);
    expect(config.cues.some(({ atMs }) => atMs === 11_750)).toBe(true);
    expect(config.cues.every((cue, index) => index === 0 || cue.atMs >= config.cues[index - 1].atMs))
      .toBe(true);
  });

  it("keeps The Alarm's curve episode-owned while composing shared rhythms", () => {
    expect(mechanics.dramaticCurves.has("alarm-escalation")).toBe(false);
    expect(episodeContent.definitions.dramaticCurves[0].id).toBe("alarm-escalation");
    expect(episodeContent.definitions.dramaticCurves[0].phases.every(
      ({ rhythm }) => rhythm.source === "shared",
    )).toBe(true);
  });

  it("makes The Alarm fail under inaction but winnable by following its score", () => {
    const config = game.entryEpisode.confrontation.resistance;
    const inactive = advanceResistance(createResistance(config), config.durationMs);
    expect(inactive.state.outcome).toBe("forced-verticalisation");
    expect(inactive.state.elapsedMs).toBeGreaterThan(18_000);

    let resisted = createResistance(config);
    for (const cue of config.cues) {
      resisted = applyResistanceInput(resisted, {
        side: cue.side,
        action: "press",
        atMs: cue.atMs,
      });
      if (cue.action === "hold") {
        resisted = applyResistanceInput(resisted, {
          side: cue.side,
          action: "release",
          atMs: cue.releaseAtMs,
        });
      }
    }
    resisted = advanceResistance(resisted, config.durationMs);
    expect(resisted.state.outcome).toBe("victory");
  });

  it("makes one-sided and indifferent play lose The Alarm", () => {
    const config = game.entryEpisode.confrontation.resistance;
    let oneSided = createResistance(config);
    for (const cue of config.cues) {
      if (oneSided.state.outcome !== "active") break;
      oneSided = applyResistanceInput(oneSided, {
        side: "left",
        action: "press",
        atMs: cue.atMs,
      });
    }
    oneSided = advanceResistance(oneSided, config.durationMs);
    expect(oneSided.state.outcome).toBe("forced-verticalisation");

    let indifferent = createResistance(config);
    for (const [index, cue] of config.cues.entries()) {
      if (indifferent.state.outcome !== "active") break;
      if (index % 4 !== 0) continue;
      indifferent = applyResistanceInput(indifferent, {
        side: cue.side,
        action: "press",
        atMs: cue.atMs,
      });
    }
    indifferent = advanceResistance(indifferent, config.durationMs);
    expect(indifferent.state.outcome).toBe("forced-verticalisation");
  });

  it("still allows recovery from occasional missed cues", () => {
    const config = game.entryEpisode.confrontation.resistance;
    let resisted = createResistance(config);
    for (const [index, cue] of config.cues.entries()) {
      if (index % 7 === 6) continue;
      resisted = applyResistanceInput(resisted, {
        side: cue.side,
        action: "press",
        atMs: cue.atMs,
      });
    }
    resisted = advanceResistance(resisted, config.durationMs);
    expect(resisted.state.outcome).toBe("victory");
  });

  it("compiles genuine press-and-release holds from the same finite vocabulary", () => {
    const definitions = {
      rhythms: [],
      dramaticCurves: [dramaticCurveSchema.parse({
        schemaVersion: 1,
        id: "hold-test",
        startingSafety: 1,
        resolutionDurationMs: 0,
        phases: [{
          id: "grip", durationMs: 4_000,
          rhythm: { source: "shared", id: "sustained-grip" },
          beatIntervalMs: 500, timingWindowMs: 100, leadInBeats: 0,
          pressurePerSecond: 0, recoveryPerAction: 0.1,
          safetyPenaltyPerMiss: 0,
          momentumGain: 0.1, momentumLoss: 0.1, momentumRecoveryBonus: 0,
          presentationIntensity: { from: 0, to: 1 },
        }],
      })],
    };
    const scope = createEpisodeMechanicScope("hold-episode", definitions, mechanics);
    expect(compileResistanceConfig(
      { source: "episode", id: "hold-test" },
      scope,
    ).cues[0]).toMatchObject({
      action: "hold", side: "left", atMs: 0, releaseAtMs: 1_000,
    });
  });

  it("lets an episode-owned curve compose an episode-owned rhythm", () => {
    const localRhythm = rhythmPatternSchema.parse({
      schemaVersion: 1,
      id: "private-signal",
      cycleBeats: 2,
      events: [
        { action: "tap", side: "right", atBeat: 0 },
        { action: "rest", atBeat: 1, durationBeats: 1 },
      ],
    });
    const localCurve = dramaticCurveSchema.parse({
      schemaVersion: 1,
      id: "private-curve",
      startingSafety: 1,
      resolutionDurationMs: 0,
      phases: [{
        ...phase("private-phase", 0, 1),
        rhythm: { source: "episode", id: "private-signal" },
      }],
    });
    const scope = createEpisodeMechanicScope("private-episode", {
      rhythms: [localRhythm],
      dramaticCurves: [localCurve],
    }, mechanics);
    expect(compileResistanceConfig(
      { source: "episode", id: "private-curve" },
      scope,
    ).cues[0]).toMatchObject({ side: "right", atMs: 0 });
  });

  it("rejects episode definitions which shadow shared IDs", () => {
    const shadow = rhythmPatternSchema.parse({
      schemaVersion: 1,
      id: "straight-alternation",
      cycleBeats: 1,
      events: [{ action: "tap", side: "left", atBeat: 0 }],
    });
    expect(() => createEpisodeMechanicScope("shadow-episode", {
      rhythms: [shadow], dramaticCurves: [],
    }, mechanics)).toThrow(/shadows a shared definition/);
  });

  it("cannot resolve another episode's private definitions", () => {
    const foreignCurve = dramaticCurveSchema.parse({
      schemaVersion: 1,
      id: "foreign-curve",
      startingSafety: 1,
      resolutionDurationMs: 0,
      phases: [phase("foreign-phase", 0, 1)],
    });
    const owner = createEpisodeMechanicScope("owner", {
      rhythms: [], dramaticCurves: [foreignCurve],
    }, mechanics);
    expect(compileResistanceConfig(
      { source: "episode", id: "foreign-curve" },
      owner,
    ).durationMs).toBe(1_000);

    const outsider = createEpisodeMechanicScope("outsider", undefined, mechanics);
    expect(() => compileResistanceConfig(
      { source: "episode", id: "foreign-curve" },
      outsider,
    )).toThrow(/outsider references unknown episode dramatic curve/);
  });

  it("prevents shared curves from depending on episode rhythms", () => {
    expect(() => sharedDramaticCurveSchema.parse({
      schemaVersion: 1,
      id: "invalid-shared-curve",
      startingSafety: 1,
      resolutionDurationMs: 0,
      phases: [{
        ...phase("invalid-phase", 0, 1),
        rhythm: { source: "episode", id: "private-signal" },
      }],
    })).toThrow();
  });

  it("rejects overlapping rests and actions", () => {
    expect(() => rhythmPatternSchema.parse({
      schemaVersion: 1,
      id: "invalid-overlap",
      cycleBeats: 2,
      events: [
        { action: "rest", atBeat: 0, durationBeats: 2 },
        { action: "tap", side: "left", atBeat: 1 },
      ],
    })).toThrow(/must not overlap/);
  });

  it.each([2, 3, 6])("rejects coincident taps at beat %s", (atBeat) => {
    expect(() => rhythmPatternSchema.parse({
      schemaVersion: 1,
      id: "coincident-taps",
      cycleBeats: 8,
      events: [
        { action: "tap", side: "left", atBeat },
        { action: "tap", side: "right", atBeat },
      ],
    })).toThrow(/must not overlap/);
  });

  it("rejects a hold beginning on a tap above beat one", () => {
    expect(() => rhythmPatternSchema.parse({
      schemaVersion: 1,
      id: "tap-hold-collision",
      cycleBeats: 8,
      events: [
        { action: "tap", side: "left", atBeat: 3 },
        { action: "hold", side: "right", atBeat: 3, durationBeats: 1 },
      ],
    })).toThrow(/must not overlap/);
  });

  it("reports missing, unlisted and mismatched shared mechanic files", () => {
    const catalogue = {
      schemaVersion: 1,
      rhythms: [{ id: "straight-alternation", file: "straight-alternation.json" }],
      dramaticCurves: [],
    };
    expect(() => loadMechanicLibrary(catalogue, {}, {}))
      .toThrow(/Missing mechanic file/);
    expect(() => loadMechanicLibrary(catalogue, {
      "./mechanics/rhythms/straight-alternation.json": straightAlternationContent,
      "./mechanics/rhythms/unlisted.json": straightAlternationContent,
    }, {})).toThrow(/Unlisted mechanic files/);
    expect(() => loadMechanicLibrary(catalogue, {
      "./mechanics/rhythms/straight-alternation.json": {
        ...straightAlternationContent,
        id: "different-rhythm",
      },
    }, {})).toThrow(/Mechanic ID mismatch/);
  });

  it("rejects discontinuous presentation phases", () => {
    expect(() => dramaticCurveSchema.parse({
      schemaVersion: 1, id: "jump-cut", startingSafety: 1, resolutionDurationMs: 0,
      phases: [
        phase("one", 0, 0.2),
        phase("two", 0.4, 1),
      ],
    })).toThrow(/must be continuous/);
  });
});

function phase(id: string, from: number, to: number) {
  return {
    id, durationMs: 1_000,
    rhythm: { source: "shared", id: "straight-alternation" },
    beatIntervalMs: 500, timingWindowMs: 100, leadInBeats: 0,
    pressurePerSecond: 0, recoveryPerAction: 0,
    safetyPenaltyPerMiss: 0,
    momentumGain: 0, momentumLoss: 0, momentumRecoveryBonus: 0,
    presentationIntensity: { from, to },
  };
}

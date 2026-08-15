import { describe, expect, it } from "vitest";

import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import straightAlternationContent from "../../../src/play/content/mechanics/rhythms/straight-alternation.json";
import { game, mechanics } from "../../../src/play/content/game";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import {
  compileResistanceConfig,
  createEpisodeMechanicScope,
  loadMechanicLibrary,
  resolveInterruptionMechanic,
} from "../../../src/play/content/loadMechanics";
import {
  advanceResistance,
  applyResistanceInput,
  createResistance,
} from "../../../src/play/engine/resistance";
import {
  dramaticCurveSchema,
  interruptionMechanicSchema,
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
      "three-and-rest",
      "sustained-grip",
      "call-and-response",
    ]);
    expect(mechanics.rhythms.get("sustained-grip")?.events)
      .toContainEqual({ action: "hold", side: "left", atBeat: 0, durationBeats: 2 });
    expect(mechanics.rhythms.get("deliberate-rests")?.events)
      .toContainEqual({ action: "rest", atBeat: 2, durationBeats: 2 });
    expect(mechanics.rhythms.get("three-and-rest")?.events)
      .toContainEqual({ action: "rest", atBeat: 3, durationBeats: 1 });
  });

  it("compiles The Alarm into four contiguous phases and a finite cue score", () => {
    const config = game.entryEpisode.confrontation.resistance;
    // Episode length is authored, with no engine minimum or maximum, so assert
    // the compiler contract — duration is exactly the sum of its phases — and
    // that a resolution period exists, rather than any particular length.
    expect(config.durationMs).toBe(
      config.phases.reduce((total, phase) => total + (phase.endsAtMs - phase.startsAtMs), 0),
    );
    expect(config.resolutionDurationMs).toBeGreaterThan(0);
    expect(config.phases.map(({ id, startsAtMs, endsAtMs }) => ({ id, startsAtMs, endsAtMs })))
      .toEqual([
        { id: "orientation", startsAtMs: 0, endsAtMs: 4_000 },
        { id: "establishment", startsAtMs: 4_000, endsAtMs: 17_000 },
        { id: "pressure", startsAtMs: 17_000, endsAtMs: 28_000 },
        { id: "crisis", startsAtMs: 28_000, endsAtMs: 33_000 },
      ]);
    expect(config.guideEvents.some(({ action }) => action === "rest")).toBe(true);
    const countIns = config.guideEvents.filter(({ action }) => action === "count-in");
    expect(countIns).toContainEqual(expect.objectContaining({ atMs: 0, phaseIndex: 0 }));
    const opening = countIns.filter(({ atMs }) => atMs === 0);
    expect(opening[0].endsAtMs).toBe(
      config.cues[0].atMs - config.cues[0].timingWindowMs,
    );
    // An interruption consumes the authored pause it lands on. What must never
    // survive is a fragment of one left over after the protected return, which
    // would flash REST at the player for a fraction of a beat right after READY.
    for (const attack of game.entryEpisode.confrontation.interruptions) {
      expect(config.guideEvents.filter((event) =>
        event.action === "rest"
        && event.atMs >= attack.startsAtMs
        && event.atMs < attack.returnsAtMs)).toEqual([]);
    }
    expect(config.guideEvents.some((event) =>
      event.action === "rest" && event.phaseIndex === 3)).toBe(false);
    const establishmentIndex = config.phases.findIndex(
      ({ id }) => id === "establishment",
    );
    const holds = config.cues.filter(
      (cue) => cue.phaseIndex === establishmentIndex && cue.action === "hold",
    );
    expect(holds.length).toBeGreaterThan(0);
    expect(config.guideEvents).toContainEqual(expect.objectContaining({
      action: "hold",
      timingWindowMs: 320,
      releaseAtMs: holds[0].releaseAtMs,
    }));
    expect(config.cues.every((cue, index) => index === 0 || cue.atMs >= config.cues[index - 1].atMs))
      .toBe(true);
    expect(config.guideEvents
      .filter(({ action }) => action === "tap" || action === "hold")
      .map(({ atMs }) => atMs))
      .toEqual(config.cues.map(({ atMs }) => atMs));
  });

  it("rejects an interruption which begins during an occupied hold", () => {
    expect(() => loadEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
        interruptions: episodeContent.confrontation.interruptions.map(
          (interruption, index) => index === 0
            ? { ...interruption, trigger: { ...interruption.trigger, afterBeats: 2 } }
            : interruption,
        ),
      },
    }, mechanics)).toThrow(/starts during a hold event/);
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
    expect(inactive.state.elapsedMs).toBeGreaterThan(17_000);

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
      if (cue.action === "hold") {
        indifferent = applyResistanceInput(indifferent, {
          side: cue.side,
          action: "release",
          atMs: cue.releaseAtMs,
        });
      }
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

  it("allows the opening episode to recover after several consecutive misses", () => {
    const config = game.entryEpisode.confrontation.resistance;
    let resisted = createResistance(config);
    for (const [index, cue] of config.cues.entries()) {
      if (index >= 7 && index <= 10) continue;
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

  it("lets an accurate final phrase recover a threatened player", () => {
    const config = game.entryEpisode.confrontation.resistance;
    const crisisPhaseIndex = config.phases.findIndex(({ id }) => id === "crisis");
    const crisis = config.phases[crisisPhaseIndex];
    const firstCrisisStep = config.cues.findIndex(
      ({ phaseIndex }) => phaseIndex === crisisPhaseIndex,
    );
    const initial = createResistance(config);
    let resisted = {
      ...initial,
      state: {
        ...initial.state,
        duvetSafety: 0.18,
        resistanceStrength: 0.4,
        nextRhythmStep: firstCrisisStep,
        elapsedMs: crisis.startsAtMs,
        dramaticIntensity: crisis.presentationIntensity.from,
      },
    };
    for (const cue of config.cues.slice(firstCrisisStep)) {
      resisted = applyResistanceInput(resisted, {
        side: cue.side,
        action: "press",
        atMs: cue.atMs,
      });
    }
    resisted = advanceResistance(resisted, config.durationMs);
    expect(resisted.state.outcome).toBe("victory");
    expect(resisted.state.duvetSafety).toBeGreaterThan(0.18);
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
          resistanceGainPerHit: 0.1, resistanceLossPerMiss: 0.1,
          resistanceRecoveryBonus: 0,
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

  it("applies the same shared and episode ownership boundary to interruptions", () => {
    expect([...mechanics.interruptions.keys()]).toEqual([
      "quick-call", "urgent-email",
    ]);
    const privateMechanic = interruptionMechanicSchema.parse({
      schemaVersion: 1,
      id: "private-check-in",
      kind: "sequence",
      choiceCount: 2,
      stepCount: 2,
    });
    const owner = createEpisodeMechanicScope("owner", {
      rhythms: [], dramaticCurves: [], interruptions: [privateMechanic],
    }, mechanics);
    expect(resolveInterruptionMechanic(
      { source: "episode", id: "private-check-in" }, owner,
    )).toEqual(privateMechanic);
    const outsider = createEpisodeMechanicScope("outsider", undefined, mechanics);
    expect(() => resolveInterruptionMechanic(
      { source: "episode", id: "private-check-in" }, outsider,
    )).toThrow(/outsider references unknown episode interruption/);
    expect(() => createEpisodeMechanicScope("shadow", {
      rhythms: [], dramaticCurves: [],
      interruptions: [{ ...privateMechanic, id: "quick-call" }],
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
    resistanceGainPerHit: 0, resistanceLossPerMiss: 0,
    resistanceRecoveryBonus: 0,
    presentationIntensity: { from, to },
  };
}

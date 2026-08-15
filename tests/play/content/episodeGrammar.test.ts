import { describe, expect, it } from "vitest";

import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import { game, mechanics } from "../../../src/play/content/game";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import { loadPresentation } from "../../../src/play/content/loadPresentation";
import { sharedDramaticCurveSchema } from "../../../src/play/content/schemas/mechanicsSchema";

type JsonContainer = Record<string, unknown> | unknown[];
type JsonPath = readonly (string | number)[];

function episodeWith(path: JsonPath, value: unknown): unknown {
  const draft: unknown = structuredClone(episodeContent);
  const { container, key } = findContainer(draft, path);
  if (Array.isArray(container) && typeof key === "number") container[key] = value;
  else if (!Array.isArray(container) && typeof key === "string") container[key] = value;
  else throw new Error("test path does not match its JSON container");
  return draft;
}

function episodeWithout(path: JsonPath): unknown {
  const draft: unknown = structuredClone(episodeContent);
  const { container, key } = findContainer(draft, path);
  if (Array.isArray(container) && typeof key === "number") container.splice(key, 1);
  else if (!Array.isArray(container) && typeof key === "string") delete container[key];
  else throw new Error("test path does not match its JSON container");
  return draft;
}

function findContainer(
  root: unknown,
  path: JsonPath,
): { container: JsonContainer; key: string | number } {
  if (path.length === 0) throw new Error("test path must not be empty");
  let current = root;
  for (const segment of path.slice(0, -1)) {
    if (Array.isArray(current) && typeof segment === "number") current = current[segment];
    else if (isRecord(current) && typeof segment === "string") current = current[segment];
    else throw new Error(`invalid test path segment: ${String(segment)}`);
  }
  if (!Array.isArray(current) && !isRecord(current)) {
    throw new Error("test path does not resolve to a JSON container");
  }
  return { container: current, key: path[path.length - 1] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function load(content: unknown = episodeContent) {
  return loadEpisode(content, mechanics);
}

describe("minimum validated episode grammar", () => {
  it("loads The Alarm through the complete grammar and presentation", () => {
    const episode = load();
    expect(episode.id).toBe("the-alarm");
    expect(() => loadPresentation(episode)).not.toThrow();
  });

  it("allows definitions and interruptions to be omitted when shared content supplies the curve", () => {
    const sharedCurve = sharedDramaticCurveSchema.parse(
      episodeContent.definitions.dramaticCurves[0],
    );
    const sharedMechanics = {
      ...mechanics,
      dramaticCurves: new Map([[sharedCurve.id, sharedCurve]]),
    };
    const withoutDefinitions = episodeWithout(["definitions"]);
    const withoutInterruptions = episodeWithout(["confrontation", "interruptions"]);
    const minimal = episodeWith(
      ["confrontation", "resistance", "dramaticCurve"],
      { source: "shared", id: sharedCurve.id },
    );
    const definitionsFree = episodeWithoutFrom(minimal, ["definitions"]);
    const content = episodeWithoutFrom(definitionsFree, ["confrontation", "interruptions"]);
    expect(loadEpisode(content, sharedMechanics).confrontation.interruptions).toEqual([]);
    expect(() => load(withoutDefinitions)).toThrow(/unknown episode dramatic curve/);
    expect(load(withoutInterruptions).confrontation.interruptions).toEqual([]);
  });

  it.each([
    ["episode", ["executableScript"]],
    ["confrontation", ["confrontation", "dialogue"]],
    ["results", ["results", "trapConsequence"]],
    ["phase", ["definitions", "dramaticCurves", 0, "phases", 0, "audioState"]],
    ["interruption", ["confrontation", "interruptions", 0, "customEvent"]],
  ] as const)("rejects unknown %s fields with a readable path", (_name, path) => {
    const message = thrownMessage(() => load(episodeWith(
      path,
      "not executable vocabulary",
    )));
    expect(message).toContain(String(path[path.length - 1]));
    for (const segment of path.slice(0, -1)) expect(message).toContain(String(segment));
  });

  it.each(["reverse", "dual-hold", "temptation"])(
    "rejects unsupported %s interruption mechanics and lists the valid kinds",
    (kind) => {
      expect(() => load(episodeWith(
        ["confrontation", "interruptions", 0, "kind"], kind,
      ))).toThrow(/Expected 'sequence' \| 'hold'/);
    },
  );

  it("rejects unsupported rhythm actions and lists the valid actions", () => {
    expect(() => load(episodeWith(["definitions", "rhythms"], [{
      schemaVersion: 1,
      id: "reversed-rhythm",
      cycleBeats: 1,
      events: [{ action: "reverse", atBeat: 0 }],
    }]))).toThrow(/Expected 'tap' \| 'hold' \| 'rest'/);
  });

  it("requires exactly the two implemented results with non-empty copy", () => {
    expect(() => load(episodeWithout(["results", "forcedVerticalisation"])))
      .toThrow(/forcedVerticalisation/);
    expect(() => load(episodeWith(["results", "victory", "headline"], "")))
      .toThrow(/results.*victory.*headline/);
    expect(() => load(episodeWith(["results", "failure"], {
      headline: "FAILURE", feedback: "NOT AN OUTCOME",
    }))).toThrow(/failure[\s\S]*results/);
  });

  it("rejects invalid rhythm and curve timing", () => {
    expect(() => load(episodeWith(
      ["definitions", "dramaticCurves", 0, "phases", 0, "timingWindowMs"],
      450,
    ))).toThrow(/less than half beatIntervalMs/);
    expect(() => load(episodeWith(["definitions", "rhythms"], [{
      schemaVersion: 1, id: "overrun", cycleBeats: 2,
      events: [{ action: "hold", side: "left", atBeat: 1, durationBeats: 2 }],
    }]))).toThrow(/event must fit inside cycleBeats/);
    expect(() => load(episodeWith(["definitions", "rhythms"], [{
      schemaVersion: 1, id: "silence-only", cycleBeats: 2,
      events: [{ action: "rest", atBeat: 0, durationBeats: 2 }],
    }]))).toThrow(/must contain an actionable event/);
    expect(() => load(episodeWith(
      ["definitions", "dramaticCurves", 0, "phases", 1, "presentationIntensity", "from"],
      0.2,
    ))).toThrow(/adjacent presentation intensity must be continuous/);
  });

  it("rejects unknown curve, rhythm, mechanic and skin references", () => {
    expect(() => load(episodeWith(
      ["confrontation", "resistance", "dramaticCurve"],
      { source: "shared", id: "missing-curve" },
    ))).toThrow(/unknown shared dramatic curve/);
    expect(() => load(episodeWith(
      ["definitions", "dramaticCurves", 0, "phases", 0, "rhythm"],
      { source: "shared", id: "missing-rhythm" },
    ))).toThrow(/unknown shared rhythm/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "mechanic"],
      { source: "shared", id: "missing-mechanic" },
    ))).toThrow(/unknown shared interruption/);
    const missingSkin = load(episodeWith(
      ["confrontation", "presentation", "skin"],
      { source: "shared", id: "missing-skin" },
    ));
    expect(() => loadPresentation(missingSkin)).toThrow(/Missing shared presentation skin/);
  });

  it("resolves the selected layout from data rather than a code literal", () => {
    // A well-formed but unknown layout ID is structurally valid and is rejected
    // when presentation resolves it, so adding a layout that reuses the existing
    // vocabulary is content work rather than a TypeScript change.
    const unknownLayout = load(episodeWith(
      ["confrontation", "presentation", "layout", "id"], "office-left",
    ));
    expect(() => loadPresentation(unknownLayout))
      .toThrow(/Missing presentation layout: office-left/);

    // Malformed identities and episode-owned layouts still fail structurally:
    // layouts are a deliberately shared-only content family.
    expect(() => load(episodeWith(
      ["confrontation", "presentation", "layout", "id"], "Office Left",
    ))).toThrow();
    expect(() => load(episodeWith(
      ["confrontation", "presentation", "layout", "source"], "episode",
    ))).toThrow();
  });

  it("rejects invalid interruption placement and duration", () => {
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "trigger", "phase"], "warm-up",
    ))).toThrow(/references unknown phase warm-up/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "trigger", "afterBeats"], 5,
    ))).toThrow(/afterBeats must fall inside its rhythm cycle/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "activeBeats"], 16,
    ))).toThrow(/must fit inside phase establishment/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "trigger", "afterBeats"], 2,
    ))).toThrow(/starts during a hold event/);
  });

  it("rejects interruption kind, sequence and hold composition mistakes", () => {
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "mechanic"],
      { source: "shared", id: "urgent-email" },
    ))).toThrow(/kind sequence does not match selected hold mechanic urgent-email/);
    expect(() => load(episodeWithout(
      ["confrontation", "interruptions", 0, "choices", 2],
    ))).toThrow(/supplies 2 choices and 3 steps.*requires 3 choices and 3 steps/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "steps", 0], "sick-cat",
    ))).toThrow(/step sick-cat does not name one of this interruption's choices/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "choices", 1, "id"], "dentist",
    ))).toThrow(/choice IDs must be unique/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 0, "choices", 1, "key"], "Digit1",
    ))).toThrow(/choice keys must be unique/);
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 1, "activeBeats"], 3,
    ))).toThrow(/activeBeats cannot contain its press and hold windows/);
  });

  it("rejects duplicate IDs and overlapping interruption windows", () => {
    expect(() => load(episodeWith(
      ["confrontation", "interruptions", 1, "id"],
      "quick-call-from-management",
    ))).toThrow(/interruption IDs must be unique/);
    const overlapping = episodeWith(
      ["confrontation", "interruptions", 1, "trigger"],
      { phase: "establishment", afterCycles: 0, afterBeats: 4 },
    );
    expect(() => load(overlapping)).toThrow(/interruption windows must not overlap/);
  });

  it("keeps shared and episode definition ownership explicit", () => {
    expect(() => load(episodeWith(["definitions", "rhythms"], [{
      schemaVersion: 1, id: "straight-alternation", cycleBeats: 1,
      events: [{ action: "tap", side: "left", atBeat: 0 }],
    }]))).toThrow(/shadows a shared definition/);
    expect(() => load(episodeWith(
      ["confrontation", "resistance", "dramaticCurve"],
      { source: "episode", id: "another-episode-curve" },
    ))).toThrow(/unknown episode dramatic curve/);
  });

  it("keeps the real catalogue exposed through the validated game hierarchy", () => {
    expect(game.entryEpisode.id).toBe("the-alarm");
  });
});

function episodeWithoutFrom(content: unknown, path: JsonPath): unknown {
  const draft: unknown = structuredClone(content);
  const { container, key } = findContainer(draft, path);
  if (Array.isArray(container) && typeof key === "number") container.splice(key, 1);
  else if (!Array.isArray(container) && typeof key === "string") delete container[key];
  else throw new Error("test path does not match its JSON container");
  return draft;
}

function thrownMessage(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("expected action to throw");
}

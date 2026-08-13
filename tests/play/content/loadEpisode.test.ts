import { describe, expect, it } from "vitest";

import oneSceneContent from "../../../src/play/content/episodes/one-scene.json";
import { episodeCatalog } from "../../../src/play/content/episodeCatalog";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import { loadEpisodeCatalog } from "../../../src/play/content/loadEpisodeCatalog";
import { createResistance } from "../../../src/play/engine/resistance";

describe("episode loading", () => {
  it("uses catalog order as the campaign order", () => {
    expect(episodeCatalog.episodes.map(({ id }) => id)).toEqual([
      "one-scene",
    ]);
    expect(episodeCatalog.getById("one-scene")).toBe(
      episodeCatalog.episodes[0],
    );
  });

  it("loads the One Scene episode as validated content", () => {
    const episode = loadEpisode(oneSceneContent);

    expect(episode.id).toBe("one-scene");
    expect(episode.confrontation.resistance.rhythm.steps).toEqual([
      { side: "left" },
      { side: "right" },
    ]);
    expect(episode.confrontation.resistance.rhythm.leadInBeats).toBe(4);
    expect(episode.confrontation.presentation).toEqual({
      layout: "bed-head-right",
      skin: "shape-bedroom",
      managementAction: "lift-head",
    });
  });

  it("supplies resistance configuration directly to the engine", () => {
    const episode = loadEpisode(oneSceneContent);
    const resistance = createResistance(
      episode.confrontation.resistance,
    );

    expect(resistance.config).toBe(episode.confrontation.resistance);
    expect(resistance.state.duvetSafety).toBe(0.75);
  });

  it("rejects unknown fields instead of growing an implicit grammar", () => {
    expect(() => loadEpisode({
      ...oneSceneContent,
      executableScript: "tipBed()",
    })).toThrow();
  });

  it("rejects overlapping rhythm timing windows", () => {
    expect(() => loadEpisode({
      ...oneSceneContent,
      confrontation: {
        ...oneSceneContent.confrontation,
        resistance: {
          ...oneSceneContent.confrontation.resistance,
          rhythm: {
            ...oneSceneContent.confrontation.resistance.rhythm,
            timingWindowMs: 250,
          },
        },
      },
    })).toThrow(/must be less than half beatIntervalMs/);
  });

  it("rejects an undocumented layout", () => {
    expect(() => loadEpisode({
      ...oneSceneContent,
      confrontation: {
        ...oneSceneContent.confrontation,
        presentation: {
          ...oneSceneContent.confrontation.presentation,
          layout: "boss-somewhere-or-other",
        },
      },
    })).toThrow();
  });

  it("rejects a catalog entry whose episode file is missing", () => {
    expect(() => loadEpisodeCatalog(
      {
        schemaVersion: 1,
        episodes: [{ id: "missing", file: "missing.json" }],
      },
      {},
    )).toThrow(/Missing episode file/);
  });

  it("rejects episode files which are not ordered in the catalog", () => {
    expect(() => loadEpisodeCatalog(
      {
        schemaVersion: 1,
        episodes: [{ id: "one-scene", file: "one-scene.json" }],
      },
      {
        "./episodes/one-scene.json": oneSceneContent,
        "./episodes/forgotten.json": oneSceneContent,
      },
    )).toThrow(/Unlisted episode files/);
  });

  it("rejects duplicate identities and files", () => {
    expect(() => loadEpisodeCatalog(
      {
        schemaVersion: 1,
        episodes: [
          { id: "one-scene", file: "one-scene.json" },
          { id: "one-scene", file: "one-scene.json" },
        ],
      },
      { "./episodes/one-scene.json": oneSceneContent },
    )).toThrow(/Duplicate episode IDs/);
  });

  it("rejects disagreement between catalog and episode identity", () => {
    expect(() => loadEpisodeCatalog(
      {
        schemaVersion: 1,
        episodes: [{ id: "different-id", file: "one-scene.json" }],
      },
      { "./episodes/one-scene.json": oneSceneContent },
    )).toThrow(/Episode ID mismatch/);
  });
});

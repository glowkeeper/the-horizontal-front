import { describe, expect, it } from "vitest";

import layoutContent from "../../../src/play/content/presentation/layouts/bed-head-right.json";
import skinContent from "../../../src/play/content/presentation/skins/episodes/the-alarm/the-alarm-bedroom.json";
import sharedSkinContent from "../../../src/play/content/presentation/skins/shared/shape-bedroom.json";
import catalogContent from "../../../src/play/content/presentation/asset-catalog.json";
import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import { loadPresentationAssetCatalog } from "../../../src/play/content/loadPresentationAssetCatalog";
import {
  assertAssetOwnership,
  loadPresentation,
} from "../../../src/play/content/loadPresentation";
import { presentationAssets } from "../../../src/play/content/presentationAssets";
import {
  assetCatalogSchema,
  resistanceLayoutSchema,
  resistanceSkinSchema,
} from "../../../src/play/content/schemas/presentationSchema";
import { assertSensiblePresentation } from "../../../src/play/content/validatePresentation";
import { game } from "../../../src/play/content/game";

const layout = resistanceLayoutSchema.parse(layoutContent);
const skin = resistanceSkinSchema.parse(skinContent);
const sharedSkin = resistanceSkinSchema.parse(sharedSkinContent);
const assetIds = new Set(presentationAssets.map(({ id }) => id));

describe("presentation content", () => {
  it("validates every real episode presentation", () => {
    for (const episode of game.episodes) {
      expect(() => loadPresentation(episode)).not.toThrow();
    }

    const presentation = loadPresentation(game.entryEpisode);

    expect(presentation.skin.id).toBe("the-alarm-bedroom");
    expect(presentationAssets[0]).toMatchObject({
      id: "pillow-prototype",
      file: "episodes/the-alarm/pillow-prototype.png",
    });
    expect(layout.anchors.bedFootPivot).toEqual({ x: 180, y: 512 });
    expect(skin.bed.staticParts.map(({ id }) => id)).toContain("frame");
    expect(() => assertSensiblePresentation(layout, skin, assetIds)).not.toThrow();
  });

  it("keeps the reusable shape skin independent of episode artwork", () => {
    expect(sharedSkin.bed.staticParts.find(({ id }) => id === "pillow"))
      .toMatchObject({ shape: "ellipse" });
    expect(() => assertSensiblePresentation(
      layout,
      sharedSkin,
      assetIds,
    )).not.toThrow();
  });

  it("rejects non-positive primitive dimensions", () => {
    expect(() => resistanceSkinSchema.parse({
      ...skinContent,
      bed: {
        ...skinContent.bed,
        duvet: { ...skinContent.bed.duvet, width: 0 },
      },
    })).toThrow();
  });

  it("rejects anchors outside the design canvas", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          bedFootPivot: { x: -1, y: 512 },
        },
      },
      skin,
      assetIds,
    )).toThrow(/anchor bedFootPivot must be within/);
  });

  it("rejects controls which do not fit within the canvas", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          leftControl: { x: 10, y: 630 },
        },
      },
      skin,
      assetIds,
    )).toThrow(/leftControl must fit/);
  });

  it("rejects reversed lift and downhill motion", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        motion: {
          ...layout.motion,
          danger: { ...layout.motion.danger, duvetX: 300 },
        },
      },
      skin,
      assetIds,
    )).toThrow(/slide downhill toward the left foot/);
  });

  it("rejects duplicate or missing semantic parts", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        bed: {
          ...skin.bed,
          sleeperParts: [skin.bed.sleeperParts[0], skin.bed.sleeperParts[0]],
        },
      },
      assetIds,
    )).toThrow(/unique semantic IDs/);
  });

  it("rejects initial bed geometry outside the design canvas", () => {
    const frame = skin.bed.staticParts[0];
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        bed: {
          ...skin.bed,
          staticParts: [{ ...frame, x: -2_000 }, ...skin.bed.staticParts.slice(1)],
        },
      },
      assetIds,
    )).toThrow(/bed part frame starts outside/);
  });

  it("requires the duvet resting coordinate to match its composition", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        bed: { ...skin.bed, duvetRestingX: 0 },
      },
      assetIds,
    )).toThrow(/duvetRestingX must match/);
  });

  it("rejects image parts which do not resolve through the asset catalog", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        bed: {
          ...skin.bed,
          duvet: {
            id: "duvet",
            shape: "image",
            x: skin.bed.duvetRestingX,
            y: -56,
            width: 440,
            height: 120,
            asset: "missing-duvet-art",
          },
        },
      },
      new Set(),
    )).toThrow(/unknown presentation asset/);
  });

  it("validates image references in management parts", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        managementParts: skin.managementParts.map((part) =>
          part.id === "head"
            ? {
                id: "head",
                shape: "image" as const,
                x: 0,
                y: -85,
                width: 136,
                height: 136,
                asset: "missing-management-head",
              }
            : part),
      },
      assetIds,
    )).toThrow(/unknown presentation asset: missing-management-head/);
  });

  it("prevents shared skins from using episode-owned assets", () => {
    expect(() => assertAssetOwnership(
      "the-alarm",
      "shared",
      skin,
      presentationAssets,
    )).toThrow(/shared skin .* cannot use episode asset/);
  });

  it("prevents an episode from using another episode's assets", () => {
    expect(() => assertAssetOwnership(
      "another-episode",
      "another-episode",
      skin,
      presentationAssets,
    )).toThrow(/owned by another episode/);
  });

  it("rejects duplicate semantic IDs in the asset catalog", () => {
    expect(() => assetCatalogSchema.parse({
      schemaVersion: 1,
      assets: [
        {
          id: "sleeper-head",
          file: "shared/sleeper-head.webp",
          origin: "human-created",
          status: "prototype-placeholder",
          creator: "Test",
          edits: [],
          licence: "CC-BY-SA-4.0",
          replacementStatus: "Replace",
        },
        {
          id: "sleeper-head",
          file: "shared/sleeper-head.webp",
          origin: "human-created",
          status: "prototype-placeholder",
          creator: "Test",
          edits: [],
          licence: "CC-BY-SA-4.0",
          replacementStatus: "Replace",
        },
      ],
    })).toThrow(/asset ids must be unique/);
  });

  it("rejects duplicate files in the asset catalog", () => {
    const asset = catalogContent.assets[0];
    expect(() => assetCatalogSchema.parse({
      schemaVersion: 1,
      assets: [asset, { ...asset, id: "another-pillow" }],
    })).toThrow(/asset files must be unique/);
  });

  it("requires provenance according to the asset origin", () => {
    const asset = catalogContent.assets[0];
    const {
      prompt: _prompt,
      generatedAt: _generatedAt,
      generationTool: _generationTool,
      ...withoutGeneration
    } = asset;
    expect(() => assetCatalogSchema.parse({
      schemaVersion: 1,
      assets: [{ ...withoutGeneration, origin: "ai-generated" }],
    })).toThrow();
    expect(() => assetCatalogSchema.parse({
      schemaVersion: 1,
      assets: [{
        ...withoutGeneration,
        origin: "licensed-source",
        source: "https://example.com/pillow",
        attribution: "Example creator",
        permittedUses: "Game and promotional use with attribution",
      }],
    })).not.toThrow();
  });

  it("rejects unsafe, root-level and unsupported asset paths", () => {
    const asset = catalogContent.assets[0];
    for (const file of [
      "pillow.png",
      "episodes/one-scene/../../shared/pillow.png",
      "episodes/unknown/pillow.svg",
      "shared//pillow.png",
    ]) {
      expect(() => assetCatalogSchema.parse({
        schemaVersion: 1,
        assets: [{ ...asset, file }],
      })).toThrow(/PNG or WebP/);
    }
  });

  it("resolves catalogued image files to build URLs", () => {
    const assets = loadPresentationAssetCatalog(catalogContent, {
      "./presentation/assets/episodes/the-alarm/pillow-prototype.png":
        "/assets/pillow-prototype-hash.png",
    });

    expect(assets[0]).toMatchObject({
      id: "pillow-prototype",
      status: "prototype-placeholder",
      url: "/assets/pillow-prototype-hash.png",
    });
  });

  it("rejects catalogued files which are missing from the build", () => {
    expect(() => loadPresentationAssetCatalog(
      catalogContent,
      {},
    )).toThrow(/Missing presentation asset file/);
  });

  it("rejects discovered files absent from the asset catalog", () => {
    expect(() => loadPresentationAssetCatalog(
      catalogContent,
      {
        "./presentation/assets/episodes/the-alarm/pillow-prototype.png":
          "/pillow.png",
        "./presentation/assets/shared/unrecorded.png": "/unrecorded.png",
      },
    )).toThrow(/Unlisted presentation asset files/);
  });
});

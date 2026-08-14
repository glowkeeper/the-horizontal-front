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
  assertInterruptionSkinCompatibility,
  assertVisibleInterruptionReturns,
  loadInterruptionSkinLibrary,
  loadPresentation,
} from "../../../src/play/content/loadPresentation";
import { presentationAssets } from "../../../src/play/content/presentationAssets";
import {
  assetCatalogSchema,
  interruptionSkinSchema,
  resistanceLayoutSchema,
  resistanceSkinSchema,
} from "../../../src/play/content/schemas/presentationSchema";
import { assertSensiblePresentation } from "../../../src/play/content/validatePresentation";
import { game, mechanics } from "../../../src/play/content/game";

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
    expect([...presentation.interruptionSkins.entries()].map(([id, value]) => [
      id, value.id,
    ])).toEqual([
      ["quick-call-from-management", "management-notification"],
      ["urgent-email-from-management", "management-notification"],
    ]);
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

  it("does not fall back between shared and episode skin ownership", () => {
    const wrongSource = loadEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
        presentation: {
          ...episodeContent.confrontation.presentation,
          skin: { source: "shared", id: "the-alarm-bedroom" },
        },
      },
    }, mechanics);
    expect(() => loadPresentation(wrongSource))
      .toThrow(/Missing shared presentation skin/);
  });

  it("does not fall back between shared and episode interruption-skin ownership", () => {
    const wrongSource = loadEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
        interruptions: episodeContent.confrontation.interruptions.map(
          (interruption, index) => index === 0 ? {
            ...interruption,
            presentation: {
              skin: { source: "episode" as const, id: "management-notification" },
            },
          } : interruption,
        ),
      },
    }, mechanics);
    expect(() => loadPresentation(wrongSource))
      .toThrow(/Missing episode interruption skin/);
  });

  it("validates interruption skin compatibility and semantic appearance", () => {
    const sequenceOnly = interruptionSkinSchema.parse({
      schemaVersion: 1,
      id: "sequence-only",
      supports: ["sequence"],
      layerDepth: 1,
      panel: {
        fill: "paperWhite", fillAlpha: 1,
        stroke: "inkCharcoal", strokeWidth: 1,
      },
      typography: {
        headlineRole: "notice", instructionRole: "status", actionRole: "notice",
        headlineSizePx: 20, instructionSizePx: 16, actionSizePx: 14,
        instructionColour: "inkCharcoal", actionColour: "inkCharcoal",
      },
      choice: {
        fill: "paperWhite", activeFill: "managementGold",
        stroke: "inkCharcoal", strokeWidth: 1,
        activeLabelAlpha: 1, inactiveLabelAlpha: 0.5,
      },
      hold: {
        fill: "paperWhite", stroke: "inkCharcoal", strokeWidth: 1,
        progressFill: "workLightBlue", progressAlpha: 0.7,
      },
      states: Object.fromEntries([
        "warning", "active", "success", "failure", "cancelled", "returning",
      ].map((state) => [state, {
        headlineColour: "inkCharcoal",
        panelVisible: state !== "warning",
        contentVisible: state !== "returning",
      }])),
    });
    expect(() => assertInterruptionSkinCompatibility(sequenceOnly, "sequence"))
      .not.toThrow();
    expect(() => assertInterruptionSkinCompatibility(sequenceOnly, "hold"))
      .toThrow(/does not support hold/);
  });

  it("rejects interruption-skin filename mismatches and local shadowing", () => {
    const sharedPath = "./presentation/interruption-skins/shared/notice.json";
    const shared = {
      ...loadPresentation(game.entryEpisode).interruptionSkins.values().next().value,
      id: "notice",
    };
    expect(() => loadInterruptionSkinLibrary({
      [sharedPath]: { ...shared, id: "wrong" },
    })).toThrow(/ID must match/);
    expect(() => loadInterruptionSkinLibrary({
      [sharedPath]: shared,
      "./presentation/interruption-skins/episodes/the-alarm/notice.json": shared,
    })).toThrow(/shadows a shared definition/);
  });

  it("rejects an episode timing window wider than its layout can display", () => {
    const tooWide = loadEpisode({
      ...episodeContent,
      definitions: {
        ...episodeContent.definitions,
        dramaticCurves: [{
          ...episodeContent.definitions.dramaticCurves[0],
          phases: episodeContent.definitions.dramaticCurves[0].phases.map(
            (phase, index) => index === 0
              ? { ...phase, timingWindowMs: 401 }
              : phase,
          ),
        }],
      },
    }, mechanics);
    expect(() => loadPresentation(tooWide)).toThrow(/cannot display.*timing tolerance/);
  });

  it("requires the first post-interruption note to make its complete visible approach", () => {
    const insufficientReturn = loadEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
        interruptions: episodeContent.confrontation.interruptions.map(
          (interruption) => ({ ...interruption, returnCountInBeats: 1 }),
        ),
      },
    }, mechanics);
    expect(() => assertVisibleInterruptionReturns(insufficientReturn, layout))
      .toThrow(/complete approach/);
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
          leftControl: { x: 10, y: layout.anchors.rightControl.y },
        },
      },
      skin,
      assetIds,
    )).toThrow(/leftControl must fit/);
  });

  it("rejects controls which cannot form a horizontal rhythm lane", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          rightControl: {
            ...layout.anchors.rightControl,
            y: layout.anchors.leftControl.y - 20,
          },
        },
      },
      skin,
      assetIds,
    )).toThrow(/share a horizontal rhythm lane/);
  });

  it("rejects a timing gate clipped by the canvas", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          leftControl: { x: 50, y: layout.anchors.leftControl.y },
        },
      },
      skin,
      assetIds,
    )).toThrow(/leftControl must fit/);
  });

  it("rejects a central pause band which does not fit", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        controls: { ...layout.controls, pauseBandWidth: 1_400 },
      },
      skin,
      assetIds,
    )).toThrow(/central pause band must fit/);
  });

  it("rejects a gate too short to contain its notes", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        controls: {
          ...layout.controls,
          gateHeight: layout.controls.noteRadius * 2,
        },
      },
      skin,
      assetIds,
    )).toThrow(/contain distinct travelling notes/);
  });

  it("rejects a centre emitter which dominates its controls", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        controls: {
          ...layout.controls,
          emitterHeight: layout.controls.gateHeight + 1,
        },
      },
      skin,
      assetIds,
    )).toThrow(/emitter must remain subordinate/);
  });

  it("rejects interruption panels and controls which are not operable", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          interruption: { x: 10, y: layout.anchors.interruption.y },
        },
      },
      skin,
      assetIds,
    )).toThrow(/interruption panel must fit/);
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        controls: { ...layout.controls, interruptionChoiceHeight: 20 },
      },
      skin,
      assetIds,
    )).toThrow(/enhanced pointer targets/);
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
            asset: { source: "episode", id: "missing-duvet-art" },
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
                asset: { source: "episode", id: "missing-management-head" },
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
    )).toThrow(/not owned by episode/);
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

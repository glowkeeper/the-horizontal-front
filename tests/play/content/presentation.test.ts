import { describe, expect, it } from "vitest";

import layoutContent from "../../../src/play/content/presentation/layouts/episode-confrontation.json";
import illustratedLayoutContent from "../../../src/play/content/presentation/layouts/illustration-left.json";
import skinContent from "../../../src/play/content/presentation/skins/episodes/the-alarm/the-alarm-bedroom.json";
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
import {
  presentationAssets,
  resolveIllustrationAsset,
} from "../../../src/play/content/presentationAssets";
import {
  assetCatalogSchema,
  interruptionSkinSchema,
  illustratedPanelLayoutSchema,
  resistanceLayoutSchema,
  resistanceSkinSchema,
} from "../../../src/play/content/schemas/presentationSchema";
import { assertSensiblePresentation } from "../../../src/play/content/validatePresentation";
import { assertSensibleIllustratedPanel } from "../../../src/play/content/validateIllustratedPanel";
import { audio, game, mechanics } from "../../../src/play/content/game";

const layout = resistanceLayoutSchema.parse(layoutContent);
const skin = resistanceSkinSchema.parse(skinContent);
const assetIds = new Set(presentationAssets.map(({ id }) => id));
const illustratedLayout = illustratedPanelLayoutSchema.parse(illustratedLayoutContent);

describe("presentation content", () => {
  it("keeps the generic illustrated panel separate, bounded and approximately 2:1", () => {
    expect(() => assertSensibleIllustratedPanel(illustratedLayout)).not.toThrow();
    expect(illustratedLayout.illustration.width / illustratedLayout.semanticContent.width)
      .toBeCloseTo(2, 1);
    expect(() => assertSensibleIllustratedPanel({
      ...illustratedLayout,
      semanticContent: { ...illustratedLayout.semanticContent, x: 800 },
    })).toThrow(/remain separate/);
    expect(() => assertSensibleIllustratedPanel({
      ...illustratedLayout,
      anchors: {
        ...illustratedLayout.anchors,
        headline: { x: 100, y: illustratedLayout.anchors.headline.y },
      },
    })).toThrow(/headline anchor must remain inside semantic content/);
  });

  it("enforces campaign and episode illustration ownership without fallback", () => {
    expect(resolveIllustrationAsset(
      { source: "campaign", id: "monday-uprising-briefing" },
      "the-monday-uprising",
    ).file).toMatch(/^campaigns\/the-monday-uprising\//);
    expect(resolveIllustrationAsset(
      { source: "episode", id: "the-alarm-line-holds" },
      "the-alarm",
    ).file).toMatch(/^episodes\/the-alarm\//);
    expect(() => resolveIllustrationAsset(
      { source: "shared", id: "the-alarm-line-holds" },
      "the-alarm",
    )).toThrow(/must resolve under shared/);
  });
  it("validates every real episode presentation", () => {
    for (const episode of game.episodes) {
      expect(() => loadPresentation(episode)).not.toThrow();
    }

    const presentation = loadPresentation(game.entryEpisode);

    expect(presentation.skin.id).toBe("the-alarm-bedroom");
    expect(presentation.skin.confrontation.resistance.states.map(({ minimumDanger, asset }) => [
      minimumDanger, asset.id,
    ])).toEqual([
      [0, "the-alarm-resistance-states-rest"],
      [0.28, "the-alarm-resistance-states-early-pressure"],
      [0.58, "the-alarm-resistance-states-high-pressure"],
      [0.9, "the-alarm-resistance-states-final-pressure"],
    ]);
    // Motion tuning a designer retunes, so assert that the compiler passes the
    // whole authored transition through intact, and that reduced motion stays
    // no longer than the standard crossfade, rather than pinning the numbers.
    expect(presentation.skin.confrontation.resistance.transition).toEqual({
      crossfadeDurationMs: expect.any(Number),
      rotationResponseMs: expect.any(Number),
      ease: expect.any(String),
      joltX: expect.any(Number),
      joltY: expect.any(Number),
      shakeAmplitude: expect.any(Number),
      shakeDurationMs: expect.any(Number),
    });
    expect(presentation.skin.confrontation.resistance.reducedMotion.crossfadeDurationMs)
      .toBeLessThanOrEqual(presentation.skin.confrontation.resistance.transition.crossfadeDurationMs);
    // Structural facts only. The bed's x/y are authored composition that a
    // designer retunes, and `assertSensiblePresentation` already requires the
    // resistance anchor to sit inside the design canvas, so pinning the
    // coordinate here would duplicate validation and break on every retune.
    expect(presentation.skin.confrontation.resistance).toMatchObject({
      width: 850,
      height: 850,
    });
    // How far the engine rotates is tuning — it depends on how much of the lift
    // the artwork itself carries. That it rotates the head upwards is not.
    expect(presentation.skin.confrontation.resistance.dangerAngleDegrees)
      .toBeLessThan(0);
    expect(presentation.skin.confrontation.resistance.reducedMotion).toEqual({
      crossfadeDurationMs: 80,
    });
    expect(presentation.skin.confrontation.environment.baseParts.map(({ id }) => id))
      .toEqual(["bedroom-base"]);
    expect(presentation.skin.confrontation.environment.intensityParts.map(({ part }) => part.id))
      .toEqual(["office-incursion"]);
    expect(presentation.skin.confrontation.opposingActor.parts.map(({ id }) => id))
      .toEqual(["figure"]);
    expect(presentation.skin.confrontation.opposingActor.states.map(({ minimumDanger, assets }) => [
      minimumDanger,
      assets.map(({ partId, asset }) => [partId, asset.id]),
    ])).toEqual([
      [0, [["figure", "management-rest-pose"]]],
      [0.22, [["figure", "management-early-pressure-pose"]]],
      [0.5, [["figure", "management-high-pressure-pose"]]],
      [0.78, [["figure", "management-lifting-pose"]]],
    ]);
    // The actor dissolves between pose drawings rather than cutting, and reduced
    // motion shortens that dissolve without removing it — a cross-fade is gentler
    // than a hard swap, so zero would be the more jarring choice.
    expect(presentation.skin.confrontation.opposingActor.transition.crossfadeDurationMs)
      .toBeGreaterThan(0);
    expect(presentation.skin.confrontation.opposingActor.reducedMotion.crossfadeDurationMs)
      .toBeLessThanOrEqual(
        presentation.skin.confrontation.opposingActor.transition.crossfadeDurationMs,
      );
    // Oscillation is the part reduced motion removes; the lean is a static pose
    // offset and survives, so the actor still reads as straining.
    expect(presentation.skin.confrontation.opposingActor.reducedMotion.amplitudeScale)
      .toBeLessThan(1);
    expect([...presentation.interruptionSkins.entries()].map(([id, value]) => [
      id, value.id,
    ])).toEqual([
      ["quick-call-from-management", "management-notification"],
      ["urgent-email-from-management", "management-notification"],
    ]);
    // Every catalogued asset resolves to a namespaced file and a build URL.
    // Pinning one particular asset here only records which happens to be first.
    expect(presentationAssets.length).toBeGreaterThan(0);
    for (const asset of presentationAssets) {
      expect(asset.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(asset.file).toMatch(/^(shared|campaigns\/[^/]+|episodes\/[^/]+)\//);
      expect(asset.url).toBeTruthy();
    }
    expect(layout.anchors.opposingActor).toEqual({ x: 1155, y: 365 });
    expect(layout.statusPanel).toMatchObject({
      fill: "restCream",
      fillAlpha: 0.86,
      stroke: "inkCharcoal",
    });
    expect(() => assertSensiblePresentation(layout, skin, assetIds)).not.toThrow();
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
    }, mechanics, audio);
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
    }, mechanics, audio);
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
        fill: "paperWhite", activeFill: "authorityGold",
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
    }, mechanics, audio);
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
    }, mechanics, audio);
    expect(() => assertVisibleInterruptionReturns(insufficientReturn, layout))
      .toThrow(/complete approach/);
  });

  it("rejects non-positive primitive dimensions", () => {
    expect(() => resistanceSkinSchema.parse({
      ...skinContent,
      confrontation: {
        ...skinContent.confrontation,
        resistance: { ...skinContent.confrontation.resistance, width: 0 },
      },
    })).toThrow();
  });

  it("rejects anchors outside the design canvas", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        anchors: {
          ...layout.anchors,
          opposingActor: { x: -1, y: 512 },
        },
      },
      skin,
      assetIds,
    )).toThrow(/anchor opposingActor must be within/);
  });

  it("keeps the status panel within the design canvas", () => {
    expect(() => assertSensiblePresentation(
      {
        ...layout,
        statusPanel: {
          ...layout.statusPanel,
          frame: { ...layout.statusPanel.frame, y: -1 },
        },
      },
      skin,
      assetIds,
    )).toThrow(/status panel must fit/);
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

  it("rejects duplicate opposing-actor semantic parts", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        confrontation: {
          ...skin.confrontation,
          opposingActor: {
            ...skin.confrontation.opposingActor,
            parts: [skin.confrontation.opposingActor.parts[0], skin.confrontation.opposingActor.parts[0]],
          },
        },
      },
      assetIds,
    )).toThrow(/unique semantic IDs/);
  });

  it("rejects image parts which do not resolve through the asset catalog", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        confrontation: {
          ...skin.confrontation,
          opposingActor: {
            ...skin.confrontation.opposingActor,
            parts: [{
              id: "figure", shape: "image", x: 0, y: 0,
              width: 100, height: 100,
              asset: { source: "episode", id: "missing-actor-art" },
            }],
          },
        },
      },
      new Set(),
    )).toThrow(/unknown presentation asset/);
  });

  it("rejects unordered, unanchored and unknown resistance states", () => {
    expect(() => resistanceSkinSchema.parse({
      ...skinContent,
      confrontation: { ...skinContent.confrontation, resistance: {
          ...skinContent.confrontation.resistance,
          states: skinContent.confrontation.resistance.states.map((state, index) => ({
            ...state,
            minimumDanger: index === 0 ? 0.1 : state.minimumDanger,
          })),
      } },
    })).toThrow(/resistance states must begin at zero danger/);

    expect(() => resistanceSkinSchema.parse({
      ...skinContent,
      confrontation: { ...skinContent.confrontation, resistance: {
          ...skinContent.confrontation.resistance,
          states: skinContent.confrontation.resistance.states.map((state, index) => ({
            ...state,
            minimumDanger: index === 2 ? 0.2 : state.minimumDanger,
          })),
      } },
    })).toThrow(/resistance-state danger thresholds must increase/);

    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        confrontation: { ...skin.confrontation, resistance: {
            ...skin.confrontation.resistance,
            states: skin.confrontation.resistance.states.map((state, index) => index === 0
              ? { ...state, asset: { source: "episode", id: "missing-resistance-state" } }
              : state),
        } },
      },
      assetIds,
    )).toThrow(/unknown presentation asset: missing-resistance-state/);
  });

  it("rejects an opposing-actor dissolve that is instant or unbounded", () => {
    const withTransition = (transition: unknown) => ({
      ...skinContent,
      confrontation: { ...skinContent.confrontation, opposingActor: {
          ...skinContent.confrontation.opposingActor,
          transition,
      } },
    });
    expect(() => resistanceSkinSchema.parse(withTransition({
      crossfadeDurationMs: 0, ease: "Sine.Out",
    }))).toThrow();
    expect(() => resistanceSkinSchema.parse(withTransition({
      crossfadeDurationMs: 5_000, ease: "Sine.Out",
    }))).toThrow();
    expect(() => resistanceSkinSchema.parse(withTransition({
      crossfadeDurationMs: 180, ease: "Bounce.Wobble",
    }))).toThrow();
  });

  it("validates image references in opposing-actor parts", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        confrontation: {
          ...skin.confrontation,
          opposingActor: {
            ...skin.confrontation.opposingActor,
            parts: [{
              id: "figure", shape: "image" as const, x: -40, y: 15,
              width: 340, height: 425,
              asset: { source: "episode", id: "missing-opposing-actor" },
            }],
          },
        },
      },
      assetIds,
    )).toThrow(/unknown presentation asset: missing-opposing-actor/);
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
    const [first] = catalogContent.assets;
    const singleAssetCatalog = { ...catalogContent, assets: [first] };
    const assets = loadPresentationAssetCatalog(singleAssetCatalog, {
      [`./presentation/assets/${first.file}`]: "/assets/resolved-hash.png",
    });

    expect(assets[0]).toMatchObject({
      id: first.id,
      status: first.status,
      url: "/assets/resolved-hash.png",
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

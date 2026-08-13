import { describe, expect, it } from "vitest";

import layoutContent from "../../../src/play/content/presentation/layouts/bed-head-right.json";
import skinContent from "../../../src/play/content/presentation/skins/shape-bedroom.json";
import {
  assetCatalogSchema,
  resistanceLayoutSchema,
  resistanceSkinSchema,
} from "../../../src/play/content/schemas/presentationSchema";
import { assertSensiblePresentation } from "../../../src/play/content/validatePresentation";

const layout = resistanceLayoutSchema.parse(layoutContent);
const skin = resistanceSkinSchema.parse(skinContent);

describe("presentation content", () => {
  it("loads the shape prototype through validated layout and skin data", () => {
    expect(layout.anchors.bedFootPivot).toEqual({ x: 180, y: 512 });
    expect(skin.bed.staticParts.map(({ id }) => id)).toContain("frame");
    expect(() => assertSensiblePresentation(layout, skin)).not.toThrow();
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
    )).toThrow(/bed part frame starts outside/);
  });

  it("requires the duvet resting coordinate to match its composition", () => {
    expect(() => assertSensiblePresentation(
      layout,
      {
        ...skin,
        bed: { ...skin.bed, duvetRestingX: 0 },
      },
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

  it("rejects duplicate semantic IDs and files in the asset catalog", () => {
    expect(() => assetCatalogSchema.parse({
      schemaVersion: 1,
      assets: [
        { id: "sleeper-head", file: "sleeper/head.webp" },
        { id: "sleeper-head", file: "sleeper/head.webp" },
      ],
    })).toThrow(/asset ids must be unique/);
  });
});

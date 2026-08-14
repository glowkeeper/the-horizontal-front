import { z } from "zod";
import { assetFilePattern } from "../contentRules.mjs";
import { ownedContentReferenceSchema } from "./ownershipSchema";

const colourRoleSchema = z.enum([
  "duvetCream",
  "inkCharcoal",
  "resistanceRed",
  "workLightBlue",
  "managementGold",
  "paperWhite",
]);

const pointSchema = z.object({ x: z.number(), y: z.number() }).strict();
const positiveSizeSchema = z.number().positive();
const unitIntervalSchema = z.number().min(0).max(1);

const styledPartSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  x: z.number(),
  y: z.number(),
  originX: unitIntervalSchema.optional(),
  originY: unitIntervalSchema.optional(),
  angleDegrees: z.number().min(-360).max(360).optional(),
  fill: colourRoleSchema,
  stroke: colourRoleSchema.optional(),
  strokeWidth: z.number().nonnegative().optional(),
});

const rectanglePartSchema = styledPartSchema.extend({
  shape: z.literal("rectangle"),
  width: positiveSizeSchema,
  height: positiveSizeSchema,
}).strict();

const ellipsePartSchema = styledPartSchema.extend({
  shape: z.literal("ellipse"),
  width: positiveSizeSchema,
  height: positiveSizeSchema,
}).strict();

const circlePartSchema = styledPartSchema.extend({
  shape: z.literal("circle"),
  radius: positiveSizeSchema,
}).strict();

const trianglePartSchema = styledPartSchema.extend({
  shape: z.literal("triangle"),
  points: z.tuple([
    z.number(), z.number(), z.number(),
    z.number(), z.number(), z.number(),
  ]),
}).strict();

const imagePartSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shape: z.literal("image"),
  x: z.number(),
  y: z.number(),
  width: positiveSizeSchema,
  height: positiveSizeSchema,
  originX: unitIntervalSchema.optional(),
  originY: unitIntervalSchema.optional(),
  angleDegrees: z.number().min(-360).max(360).optional(),
  asset: ownedContentReferenceSchema,
}).strict();

export const shapePartSchema = z.discriminatedUnion("shape", [
  rectanglePartSchema,
  ellipsePartSchema,
  circlePartSchema,
  trianglePartSchema,
  imagePartSchema,
]);

const assetBaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  file: z.string().regex(
    assetFilePattern,
    "must be a PNG or WebP under shared/ or episodes/<episode-id>/",
  ),
  status: z.enum(["prototype-placeholder", "production-approved"]),
  creator: z.string().trim().min(1),
  edits: z.array(z.string().trim().min(1)),
  licence: z.enum(["CC-BY-SA-4.0"]),
  replacementStatus: z.string().trim().min(1),
});

const assetSchema = z.discriminatedUnion("origin", [
  assetBaseSchema.extend({
    origin: z.literal("ai-generated"),
    generatedAt: z.string().date(),
    generationTool: z.string().trim().min(1),
    prompt: z.string().trim().min(1),
  }).strict(),
  assetBaseSchema.extend({
    origin: z.literal("human-created"),
  }).strict(),
  assetBaseSchema.extend({
    origin: z.literal("licensed-source"),
    source: z.string().url(),
    attribution: z.string().trim().min(1),
    permittedUses: z.string().trim().min(1),
  }).strict(),
]);

export const assetCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  assets: z.array(assetSchema),
}).strict().superRefine((catalog, context) => {
  for (const field of ["id", "file"] as const) {
    const values = catalog.assets.map((asset) => asset[field]);
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        message: `asset ${field}s must be unique`,
        path: ["assets"],
      });
    }
  }
});

const rectangleSchema = z.object({
  x: z.number(), y: z.number(),
  width: positiveSizeSchema, height: positiveSizeSchema,
  originX: unitIntervalSchema.optional(),
  originY: unitIntervalSchema.optional(),
}).strict();

const easeSchema = z.enum(["Sine.Out", "Back.In", "Quad.In"]);

export const resistanceLayoutSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.literal("bed-head-right"),
  copy: z.object({
    managementCaption: z.string().trim().min(1).max(120),
  }).strict(),
  designSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).strict(),
  backdrop: z.object({
    floor: rectangleSchema,
    workLight: rectangleSchema,
  }).strict(),
  anchors: z.object({
    bedFootPivot: pointSchema,
    bedFromFoot: pointSchema,
    management: pointSchema,
    managementCaption: pointSchema,
    title: pointSchema,
    time: pointSchema,
    result: pointSchema,
    restart: pointSchema,
    nextCue: pointSchema,
    leftControl: pointSchema,
    rightControl: pointSchema,
    feedback: pointSchema,
  }).strict(),
  controls: z.object({
    gateHeight: positiveSizeSchema,
    gateStrokeWidth: z.number().nonnegative(),
    activeGateStrokeWidth: positiveSizeSchema,
    gateBeatLineWidth: positiveSizeSchema,
    noteTravelPixelsPerMs: z.number().positive(),
    maximumTimingWindowMs: z.number().int().positive(),
    controlLabelOffsetY: positiveSizeSchema,
    emitterWidth: positiveSizeSchema,
    emitterHeight: positiveSizeSchema,
    cueLabelWidth: positiveSizeSchema,
    noteRadius: positiveSizeSchema,
    noteMinimumAlpha: unitIntervalSchema,
    visibleGuideEvents: z.number().int().min(1).max(5),
    pauseBandWidth: positiveSizeSchema,
    pauseBandHeight: positiveSizeSchema,
  }).strict(),
  motion: z.object({
    danger: z.object({
      bedAngleDegrees: z.number().min(-90).max(0),
      duvetX: z.number().max(0),
      sleeperX: z.number().max(0),
      workLightAlpha: unitIntervalSchema,
    }).strict(),
    rest: z.object({ workLightAlpha: unitIntervalSchema }).strict(),
    victory: z.object({
      durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    forcedVerticalisation: z.object({
      bedAngleDegrees: z.number().min(-90).max(0),
      bedDurationMs: z.number().int().positive(), bedEase: easeSchema,
      sleeperX: z.number().max(0), sleeperY: z.number(),
      sleeperAngleDegrees: z.number().min(-360).max(360),
      sleeperDurationMs: z.number().int().positive(), sleeperEase: easeSchema,
      duvetX: z.number().max(0), duvetAlpha: unitIntervalSchema,
      duvetDurationMs: z.number().int().positive(), duvetEase: easeSchema,
    }).strict(),
  }).strict(),
}).strict();

export const resistanceSkinSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  layout: z.literal("bed-head-right"),
  copy: z.object({
    managementLabel: z.string().trim().min(1).max(80),
  }).strict(),
  bed: z.object({
    duvetRestingX: z.number(),
    sleeperRestingX: z.number(),
    staticParts: z.array(shapePartSchema).min(1),
    sleeperParts: z.array(shapePartSchema).min(1),
    duvet: shapePartSchema,
  }).strict(),
  managementParts: z.array(shapePartSchema).min(1),
}).strict();

export type ResistanceLayoutContent = z.infer<typeof resistanceLayoutSchema>;
export type ResistanceSkin = z.infer<typeof resistanceSkinSchema>;
export type ShapePart = z.infer<typeof shapePartSchema>;
export type AssetCatalog = z.infer<typeof assetCatalogSchema>;

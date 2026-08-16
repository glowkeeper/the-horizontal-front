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

const interruptionStateStyleSchema = z.object({
  headlineColour: colourRoleSchema,
  panelVisible: z.boolean(),
  contentVisible: z.boolean(),
}).strict();
const textStyleRoleSchema = z.enum(["notice", "title", "body", "status"]);

export const interruptionSkinSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  supports: z.array(z.enum(["sequence", "hold"])).min(1),
  layerDepth: z.number().int(),
  panel: z.object({
    fill: colourRoleSchema,
    fillAlpha: unitIntervalSchema,
    stroke: colourRoleSchema,
    strokeWidth: positiveSizeSchema,
  }).strict(),
  typography: z.object({
    headlineRole: textStyleRoleSchema,
    instructionRole: textStyleRoleSchema,
    actionRole: textStyleRoleSchema,
    headlineSizePx: positiveSizeSchema,
    instructionSizePx: positiveSizeSchema,
    actionSizePx: positiveSizeSchema,
    instructionColour: colourRoleSchema,
    actionColour: colourRoleSchema,
  }).strict(),
  choice: z.object({
    fill: colourRoleSchema,
    activeFill: colourRoleSchema,
    stroke: colourRoleSchema,
    strokeWidth: positiveSizeSchema,
    activeLabelAlpha: unitIntervalSchema,
    inactiveLabelAlpha: unitIntervalSchema,
  }).strict(),
  hold: z.object({
    fill: colourRoleSchema,
    stroke: colourRoleSchema,
    strokeWidth: positiveSizeSchema,
    progressFill: colourRoleSchema,
    progressAlpha: unitIntervalSchema,
  }).strict(),
  states: z.object({
    warning: interruptionStateStyleSchema,
    active: interruptionStateStyleSchema,
    success: interruptionStateStyleSchema,
    failure: interruptionStateStyleSchema,
    cancelled: interruptionStateStyleSchema,
    returning: interruptionStateStyleSchema,
  }).strict(),
}).strict().superRefine((skin, context) => {
  if (new Set(skin.supports).size !== skin.supports.length) {
    context.addIssue({ code: "custom", message: "supported interruption mechanics must be unique" });
  }
  if (skin.choice.activeLabelAlpha < skin.choice.inactiveLabelAlpha) {
    context.addIssue({ code: "custom", message: "active choice labels must not be less visible" });
  }
});

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
  flipX: z.boolean().optional(),
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
    "must be a PNG or WebP under shared/, campaigns/<campaign-id>/ or episodes/<episode-id>/",
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

export const illustratedPanelLayoutSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  designSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).strict(),
  illustration: rectangleSchema,
  semanticContent: rectangleSchema,
  appearance: z.object({
    illustrationStrokeWidth: positiveSizeSchema,
    semanticStrokeWidth: positiveSizeSchema,
    semanticFillAlpha: unitIntervalSchema,
  }).strict(),
  palette: z.object({
    background: colourRoleSchema,
    illustrationFill: colourRoleSchema,
    illustrationStroke: colourRoleSchema,
    semanticFill: colourRoleSchema,
    semanticStroke: colourRoleSchema,
    detail: colourRoleSchema,
    instruction: colourRoleSchema,
  }).strict(),
  actions: z.object({
    width: positiveSizeSchema,
    height: positiveSizeSchema,
  }).strict(),
  typography: z.object({
    kickerSizePx: positiveSizeSchema,
    headlineSizePx: positiveSizeSchema,
    bodySizePx: positiveSizeSchema,
    instructionSizePx: positiveSizeSchema,
    horizontalInset: positiveSizeSchema,
    bodyLineSpacingPx: z.number().nonnegative(),
  }).strict(),
  anchors: z.object({
    kicker: pointSchema,
    headline: pointSchema,
    body: pointSchema,
    detail: pointSchema,
    instruction: pointSchema,
    primaryAction: pointSchema,
    secondaryAction: pointSchema,
  }).strict(),
}).strict();

const easeSchema = z.enum([
  "Sine.Out", "Back.In", "Back.Out", "Quad.In", "Quad.Out",
]);

const resistanceVisualSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: positiveSizeSchema,
  height: positiveSizeSchema,
  originX: unitIntervalSchema.optional(),
  originY: unitIntervalSchema.optional(),
  dangerAngleDegrees: z.number().min(-90).max(-1),
  states: z.array(z.object({
    minimumDanger: unitIntervalSchema,
    asset: ownedContentReferenceSchema,
    /**
     * How far this artwork is already drawn into the lift, relative to the
     * resting state.
     *
     * Telling the engine what each drawing already depicts lets it hold one
     * continuous angle and compensate as the texture swaps, so a set of discrete
     * drawings reads as a single rotation rather than a series of steps.
     */
    drawnAngleDegrees: z.number().min(-90).max(90),
  }).strict()).min(1),
  transition: z.object({
    crossfadeDurationMs: z.number().int().positive().max(1_000),
    rotationResponseMs: z.number().int().positive().max(2_000),
    ease: easeSchema,
    joltX: z.number().min(-40).max(40),
    joltY: z.number().min(-40).max(40),
    shakeAmplitude: z.number().nonnegative().max(20),
    shakeDurationMs: z.number().int().positive().max(1_000),
  }).strict(),
  reducedMotion: z.object({
    crossfadeDurationMs: z.number().int().nonnegative().max(200),
  }).strict(),
}).strict();

export const resistanceLayoutSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  designSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).strict(),
  backdrop: z.object({
    background: colourRoleSchema,
    floor: rectangleSchema.extend({
      fill: colourRoleSchema,
      stroke: colourRoleSchema,
      strokeWidth: z.number().nonnegative(),
    }).strict(),
    workLight: rectangleSchema.extend({
      fill: colourRoleSchema,
    }).strict(),
  }).strict(),
  statusPanel: z.object({
    frame: rectangleSchema,
    fill: colourRoleSchema,
    fillAlpha: unitIntervalSchema,
    stroke: colourRoleSchema,
    strokeWidth: z.number().nonnegative(),
  }).strict(),
  anchors: z.object({
    opposingActor: pointSchema,
    pressureCaption: pointSchema,
    title: pointSchema,
    time: pointSchema,
    result: pointSchema,
    restart: pointSchema,
    nextCue: pointSchema,
    leftControl: pointSchema,
    rightControl: pointSchema,
    feedback: pointSchema,
    interruption: pointSchema,
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
    interruptionPanelWidth: positiveSizeSchema,
    interruptionPanelHeight: positiveSizeSchema,
    interruptionChoiceWidth: positiveSizeSchema,
    interruptionChoiceHeight: positiveSizeSchema,
    interruptionChoiceGap: z.number().nonnegative(),
    interruptionHoldWidth: positiveSizeSchema,
    interruptionHoldHeight: positiveSizeSchema,
    interruptionHeadlineOffsetY: z.number(),
    interruptionInstructionOffsetY: z.number(),
    interruptionActionOffsetY: z.number(),
  }).strict(),
  rhythmPresentation: z.object({
    typography: z.object({
      titleSizePx: positiveSizeSchema,
      controlSizePx: positiveSizeSchema,
      feedbackSizePx: positiveSizeSchema,
      cueSizePx: positiveSizeSchema,
    }).strict(),
    palette: z.object({
      gate: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
        activeStroke: colourRoleSchema,
        now: colourRoleSchema,
        holding: colourRoleSchema,
        upcoming: colourRoleSchema,
        beatLine: colourRoleSchema,
      }).strict(),
      note: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
        holdBar: colourRoleSchema,
        heldBar: colourRoleSchema,
      }).strict(),
      emitter: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
      }).strict(),
      pauseBand: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
      }).strict(),
      label: z.object({
        rest: colourRoleSchema,
        now: colourRoleSchema,
      }).strict(),
      status: z.object({
        timeRemaining: colourRoleSchema,
      }).strict(),
      feedback: z.object({
        hit: colourRoleSchema,
        miss: colourRoleSchema,
      }).strict(),
      successfulNote: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
      }).strict(),
      expiredNote: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
        cross: colourRoleSchema,
      }).strict(),
      brokenHold: z.object({
        fill: colourRoleSchema,
        stroke: colourRoleSchema,
      }).strict(),
      result: z.object({
        victory: colourRoleSchema,
        forcedVerticalisation: colourRoleSchema,
      }).strict(),
    }).strict(),
    layers: z.object({
      result: z.number(), successfulNote: z.number(), missedNote: z.number(),
    }).strict(),
    strokes: z.object({
      guide: positiveSizeSchema, successfulNote: positiveSizeSchema,
      missedNote: positiveSizeSchema,
    }).strict(),
    opacity: z.object({
      inactiveGate: unitIntervalSchema,
      inactiveLabel: unitIntervalSchema,
      holdBarMultiplier: unitIntervalSchema,
    }).strict(),
    guide: z.object({
      tailRadiusMultiplier: z.number().positive().max(1),
      releaseTailScale: z.number().min(1),
    }).strict(),
    feedback: z.object({
      initialScale: z.number().min(1), durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    successfulNote: z.object({
      finalScale: z.number().min(1), durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    expiredNote: z.object({
      crossWidthMultiplier: z.number().positive(), crossThickness: positiveSizeSchema,
      crossAngleDegrees: z.number().min(0).max(180),
      escapeDistanceMultiplier: z.number().positive(),
      durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    brokenHold: z.object({
      minimumWidthMultiplier: z.number().positive(), gateWidthMultiplier: z.number().positive(),
      fragmentOffsetMultiplier: z.number().positive(), fragmentYOffset: positiveSizeSchema,
      fragmentAngleDegrees: z.number().min(0).max(180),
      escapeXMultiplier: z.number().positive(), escapeYMultiplier: z.number().positive(),
      durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    outcomeActions: z.object({
      horizontalOffset: positiveSizeSchema, width: positiveSizeSchema,
    }).strict(),
  }).strict(),
  motion: z.object({
    danger: z.object({
      workLightAlpha: unitIntervalSchema,
    }).strict(),
    rest: z.object({ workLightAlpha: unitIntervalSchema }).strict(),
    victory: z.object({
      durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
    forcedVerticalisation: z.object({
      durationMs: z.number().int().positive(), ease: easeSchema,
    }).strict(),
  }).strict(),
}).strict();

export const resistanceSkinSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  layout: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  confrontation: z.object({
    copy: z.object({
      opposingActorLabel: z.string().trim().min(1).max(80),
      pressureCaption: z.string().trim().min(1).max(120),
    }).strict(),
    typography: z.object({
      opposingActorLabel: z.object({
        offsetY: z.number(),
        sizePx: positiveSizeSchema,
        wrapWidth: positiveSizeSchema,
        colour: colourRoleSchema,
      }).strict(),
      pressureCaption: z.object({
        sizePx: positiveSizeSchema,
        colour: colourRoleSchema,
      }).strict(),
    }).strict(),
    resistance: resistanceVisualSchema,
    environment: z.object({
      replacesLayoutBackdrop: z.boolean(),
      baseParts: z.array(shapePartSchema),
      intensityParts: z.array(z.object({
        part: shapePartSchema,
        restAlpha: unitIntervalSchema,
        dangerAlpha: unitIntervalSchema,
        restOffsetX: z.number(),
        dangerOffsetX: z.number(),
      }).strict()),
    }).strict(),
    opposingActor: z.object({
      parts: z.array(shapePartSchema).min(1),
      states: z.array(z.object({
        minimumDanger: unitIntervalSchema,
        assets: z.array(z.object({
          partId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          asset: ownedContentReferenceSchema,
        }).strict()).min(1),
      }).strict()).min(1),
      // Continuous effort between the discrete pose states: the actor oscillates
      // and leans further into its apparatus as dramatic intensity rises, so a
      // finite set of drawings still reads as sustained exertion.
      strain: z.object({
        restFrequencyHz: z.number().nonnegative().max(20),
        strainFrequencyHz: z.number().nonnegative().max(20),
        restAmplitude: pointSchema,
        strainAmplitude: pointSchema,
        lean: pointSchema,
      }).strict(),
      // Dissolving between pose drawings rather than cutting. The actor holds a
      // continuous position throughout, so only the drawing beneath it changes.
      transition: z.object({
        crossfadeDurationMs: z.number().int().positive().max(1_000),
        ease: easeSchema,
      }).strict(),
      reducedMotion: z.object({
        amplitudeScale: unitIntervalSchema,
        crossfadeDurationMs: z.number().int().nonnegative().max(200),
      }).strict(),
    }).strict(),
  }).strict(),
}).strict().superRefine((skin, context) => {
  const { resistance, opposingActor, environment } = skin.confrontation;
  const resistanceThresholds = resistance.states.map(({ minimumDanger }) => minimumDanger);
  if (resistanceThresholds[0] !== 0) {
    context.addIssue({ code: "custom", message: "resistance states must begin at zero danger" });
  }
  if (resistanceThresholds.some(
    (threshold, index) => index > 0 && threshold <= resistanceThresholds[index - 1],
  )) {
    context.addIssue({ code: "custom", message: "resistance-state danger thresholds must increase" });
  }
  const actorThresholds = opposingActor.states.map(({ minimumDanger }) => minimumDanger);
  if (actorThresholds[0] !== 0) {
    context.addIssue({ code: "custom", message: "opposing-actor states must begin at zero danger" });
  }
  if (actorThresholds.some(
    (threshold, index) => index > 0 && threshold <= actorThresholds[index - 1],
  )) {
    context.addIssue({ code: "custom", message: "opposing-actor state danger thresholds must increase" });
  }
  for (const [index, state] of opposingActor.states.entries()) {
    const partIds = state.assets.map(({ partId }) => partId);
    if (new Set(partIds).size !== partIds.length) {
      context.addIssue({
        code: "custom",
        message: "opposing-actor state part IDs must be unique",
        path: ["opposingActor", "states", index, "assets"],
      });
    }
  }
  for (const [index, layer] of environment.intensityParts.entries()) {
    if (layer.dangerAlpha < layer.restAlpha) {
      context.addIssue({
        code: "custom",
        message: "intensity layer must not become less visible as danger rises",
        path: ["environment", "intensityParts", index],
      });
    }
  }
});

export type ColourRole = z.infer<typeof colourRoleSchema>;
export type ResistanceLayoutContent = z.infer<typeof resistanceLayoutSchema>;
export type ResistanceSkin = z.infer<typeof resistanceSkinSchema>;
export type ShapePart = z.infer<typeof shapePartSchema>;
export type AssetCatalog = z.infer<typeof assetCatalogSchema>;
export type InterruptionSkin = z.infer<typeof interruptionSkinSchema>;
export type IllustratedPanelLayoutContent = z.infer<typeof illustratedPanelLayoutSchema>;

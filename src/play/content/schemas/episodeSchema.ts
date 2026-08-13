import { z } from "zod";
import { contentIdSchema } from "./gameSchema";

const shortCopy = z.string().trim().min(1).max(120);

const rhythmStepSchema = z
  .object({
    side: z.enum(["left", "right"]),
  })
  .strict();

const rhythmPatternSchema = z
  .object({
    steps: z.array(rhythmStepSchema).min(1),
    leadInBeats: z.number().int().positive(),
    beatIntervalMs: z.number().int().positive(),
    timingWindowMs: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((rhythm, context) => {
    if (rhythm.timingWindowMs * 2 >= rhythm.beatIntervalMs) {
      context.addIssue({
        code: "custom",
        message: "must be less than half beatIntervalMs",
        path: ["timingWindowMs"],
      });
    }
  });

const resistanceConfigSchema = z
  .object({
    durationMs: z.number().int().positive(),
    startingSafety: z.number().min(0).max(1),
    pressurePerSecond: z.number().nonnegative(),
    recoveryPerBeat: z.number().nonnegative(),
    momentumGain: z.number().min(0).max(1),
    momentumLoss: z.number().min(0).max(1),
    momentumRecoveryBonus: z.number().nonnegative(),
    rhythm: rhythmPatternSchema,
  })
  .strict();

const presentationSchema = z
  .object({
    layout: z.literal("bed-head-right"),
    skin: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    managementAction: z.literal("lift-head"),
  })
  .strict();

const resultSchema = z
  .object({
    headline: shortCopy,
    feedback: shortCopy,
  })
  .strict();

const confrontationCopySchema = z.object({
  headline: shortCopy,
  instructionsStatus: z.string().trim().min(1).max(300),
}).strict();

export const episodeSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: contentIdSchema,
    title: z.string().trim().min(1),
    confrontation: z
      .object({
        resistance: resistanceConfigSchema,
        presentation: presentationSchema,
        copy: confrontationCopySchema,
      })
      .strict(),
    results: z
      .object({
        victory: resultSchema,
        forcedVerticalisation: resultSchema,
      })
      .strict(),
  })
  .strict();

export type Episode = z.infer<typeof episodeSchema>;

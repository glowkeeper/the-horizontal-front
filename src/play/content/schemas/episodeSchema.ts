import { z } from "zod";
import { audioCueSchema, audioSoundscapeSchema } from "./audioSchema";
import { contentIdSchema } from "./gameSchema";
import {
  episodeMechanicDefinitionsSchema,
} from "./mechanicsSchema";
import { ownedContentReferenceSchema } from "./ownershipSchema";

const shortCopy = z.string().trim().min(1).max(120);

const resistanceCompositionSchema = z.object({
  dramaticCurve: ownedContentReferenceSchema,
}).strict();

const interruptionCopySchema = z.object({
  warning: shortCopy,
  headline: shortCopy,
  instruction: shortCopy,
  status: shortCopy,
  success: shortCopy,
  failure: shortCopy,
  expired: shortCopy,
  cancelled: shortCopy,
  returning: shortCopy,
}).strict();

const interruptionBaseSchema = z.object({
  id: contentIdSchema,
  mechanic: ownedContentReferenceSchema,
  trigger: z.object({
    phase: contentIdSchema,
    afterCycles: z.number().int().nonnegative(),
    afterBeats: z.number().nonnegative().default(0),
  }).strict(),
  warningBeats: z.number().int().positive().max(8),
  activeBeats: z.number().int().positive().max(16),
  returnCountInBeats: z.number().int().positive().max(8),
  consequences: z.object({
    successSafety: z.number().min(-1).max(1),
    failureSafety: z.number().min(-1).max(1),
  }).strict(),
  presentation: z.object({
    skin: ownedContentReferenceSchema,
  }).strict(),
  copy: interruptionCopySchema,
});

const interruptionCompositionSchema = z.discriminatedUnion("kind", [
  interruptionBaseSchema.extend({
    kind: z.literal("sequence"),
    choices: z.array(z.object({
      id: contentIdSchema,
      label: shortCopy,
      key: z.enum(["Digit1", "Digit2", "Digit3"]),
    }).strict()).min(2).max(3),
    steps: z.array(contentIdSchema).min(1).max(8),
  }).strict(),
  interruptionBaseSchema.extend({
    kind: z.literal("hold"),
  }).strict(),
]);

const interruptionCompositionsSchema = z.array(interruptionCompositionSchema)
  .default([])
  .superRefine((interruptions, context) => {
    const ids = interruptions.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", message: "interruption IDs must be unique" });
    }
  });

const presentationSchema = z
  .object({
    layout: z.object({
      source: z.literal("shared"),
      id: contentIdSchema,
    }).strict(),
    skin: ownedContentReferenceSchema,
  })
  .strict();

const resultSchema = z
  .object({
    headline: shortCopy,
    feedback: shortCopy,
    illustration: ownedContentReferenceSchema.optional(),
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
    definitions: episodeMechanicDefinitionsSchema.optional(),
    // Audio spans the whole episode, outcomes included, so it sits beside the
    // confrontation rather than inside it. Private cues and soundscapes follow
    // the same two-level ownership as every other episode-owned definition.
    audio: z
      .object({
        soundscape: ownedContentReferenceSchema,
        cues: z.array(audioCueSchema).default([]),
        soundscapes: z.array(audioSoundscapeSchema).default([]),
      })
      .strict(),
    confrontation: z
      .object({
        resistance: resistanceCompositionSchema,
        interruptions: interruptionCompositionsSchema,
        presentation: presentationSchema,
        copy: confrontationCopySchema,
      })
      .strict(),
    results: z
      .object({
        success: resultSchema,
        failure: resultSchema,
      })
      .strict(),
  })
  .strict();

export type EpisodeContent = z.infer<typeof episodeSchema>;
export type InterruptionCompositionContent = EpisodeContent["confrontation"]["interruptions"][number];

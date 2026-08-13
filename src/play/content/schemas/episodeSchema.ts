import { z } from "zod";
import { contentIdSchema } from "./gameSchema";
import {
  episodeMechanicDefinitionsSchema,
} from "./mechanicsSchema";
import { ownedContentReferenceSchema } from "./ownershipSchema";

const shortCopy = z.string().trim().min(1).max(120);

const resistanceCompositionSchema = z.object({
  dramaticCurve: ownedContentReferenceSchema,
}).strict();

const presentationSchema = z
  .object({
    layout: z.object({
      source: z.literal("shared"),
      id: z.literal("bed-head-right"),
    }).strict(),
    skin: ownedContentReferenceSchema,
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
    definitions: episodeMechanicDefinitionsSchema.optional(),
    confrontation: z
      .object({
        resistance: resistanceCompositionSchema,
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

export type EpisodeContent = z.infer<typeof episodeSchema>;

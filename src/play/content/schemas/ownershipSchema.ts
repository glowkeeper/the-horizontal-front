import { z } from "zod";

import { contentIdSchema } from "./gameSchema";

export const ownedContentReferenceSchema = z.object({
  source: z.enum(["shared", "episode"]),
  id: contentIdSchema,
}).strict();

export const sharedContentReferenceSchema = z.object({
  source: z.literal("shared"),
  id: contentIdSchema,
}).strict();

export type OwnedContentReference = z.infer<typeof ownedContentReferenceSchema>;

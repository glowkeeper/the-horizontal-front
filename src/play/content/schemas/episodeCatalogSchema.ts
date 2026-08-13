import { z } from "zod";

const episodeCatalogEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    file: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
  })
  .strict();

export const episodeCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    episodes: z.array(episodeCatalogEntrySchema).min(1),
  })
  .strict();

export type EpisodeCatalogContent = z.infer<typeof episodeCatalogSchema>;

import { episodeSchema } from "./schemas/episodeSchema";
import type { Episode } from "./schemas/episodeSchema";

export function loadEpisode(content: unknown): Episode {
  return episodeSchema.parse(content);
}

import { episodeCatalogSchema } from "./schemas/episodeCatalogSchema";
import type { Episode } from "./schemas/episodeSchema";
import { loadEpisode } from "./loadEpisode";

export type EpisodeModules = Readonly<Record<string, unknown>>;

export interface EpisodeCatalog {
  readonly episodes: readonly Episode[];
  getById(id: string): Episode | undefined;
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function modulePath(file: string): string {
  return `./episodes/${file}`;
}

export function loadEpisodeCatalog(
  catalogContent: unknown,
  episodeModules: EpisodeModules,
): EpisodeCatalog {
  const content = episodeCatalogSchema.parse(catalogContent);
  const duplicateIds = findDuplicates(content.episodes.map(({ id }) => id));
  const duplicateFiles = findDuplicates(
    content.episodes.map(({ file }) => file),
  );

  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate episode IDs: ${duplicateIds.join(", ")}`);
  }
  if (duplicateFiles.length > 0) {
    throw new Error(`Duplicate episode files: ${duplicateFiles.join(", ")}`);
  }

  const listedPaths = new Set(
    content.episodes.map(({ file }) => modulePath(file)),
  );
  const discoveredPaths = Object.keys(episodeModules);
  const unlistedPaths = discoveredPaths.filter((path) => !listedPaths.has(path));

  if (unlistedPaths.length > 0) {
    throw new Error(`Unlisted episode files: ${unlistedPaths.join(", ")}`);
  }

  const episodes = content.episodes.map(({ id, file }) => {
    const path = modulePath(file);
    const episodeContent = episodeModules[path];

    if (episodeContent === undefined) {
      throw new Error(`Missing episode file: ${path}`);
    }

    const episode = loadEpisode(episodeContent);
    if (episode.id !== id) {
      throw new Error(
        `Episode ID mismatch for ${path}: catalog has "${id}", file has "${episode.id}"`,
      );
    }

    return episode;
  });
  const episodesById = new Map(episodes.map((episode) => [episode.id, episode]));

  return {
    episodes,
    getById: (id) => episodesById.get(id),
  };
}

import { loadEpisode } from "./loadEpisode";
import type { Episode } from "./loadEpisode";
import type { AudioLibrary } from "./loadAudio";
import type { MechanicLibrary } from "./loadMechanics";
import {
  campaignSchema,
  gameSchema,
  type CampaignContent,
  type GameContent,
} from "./schemas/gameSchema";
import { resolveIllustrationAsset } from "./presentationAssets";

export type ContentModules = Readonly<Record<string, unknown>>;

export interface Campaign extends Omit<CampaignContent, "episodes"> {
  readonly episodes: readonly Episode[];
}

export interface Game extends Omit<GameContent, "campaigns"> {
  readonly campaigns: readonly Campaign[];
  readonly entryEpisode: Episode;
  readonly episodes: readonly Episode[];
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function assertNoDuplicates(
  name: string,
  entries: readonly { readonly id: string; readonly file: string }[],
): void {
  const duplicateIds = findDuplicates(entries.map(({ id }) => id));
  const duplicateFiles = findDuplicates(entries.map(({ file }) => file));
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate ${name} IDs: ${duplicateIds.join(", ")}`);
  }
  if (duplicateFiles.length > 0) {
    throw new Error(`Duplicate ${name} files: ${duplicateFiles.join(", ")}`);
  }
}

function assertNoUnlistedFiles(
  name: string,
  directory: string,
  listedFiles: readonly string[],
  modules: ContentModules,
): void {
  const listedPaths = new Set(listedFiles.map((file) => `./${directory}/${file}`));
  const unlisted = Object.keys(modules).filter((path) => !listedPaths.has(path));
  if (unlisted.length > 0) {
    throw new Error(`Unlisted ${name} files: ${unlisted.join(", ")}`);
  }
}

export function loadGame(
  gameContent: unknown,
  campaignModules: ContentModules,
  episodeModules: ContentModules,
  mechanics: MechanicLibrary,
  audio: AudioLibrary,
): Game {
  const game = gameSchema.parse(gameContent);
  assertNoDuplicates("campaign", game.campaigns);
  assertNoUnlistedFiles(
    "campaign",
    "campaigns",
    game.campaigns.map(({ file }) => file),
    campaignModules,
  );

  const episodeIds = new Set<string>();
  const episodeFiles = new Set<string>();
  const campaigns = game.campaigns.map(({ id, file }) => {
    const path = `./campaigns/${file}`;
    const rawCampaign = campaignModules[path];
    if (rawCampaign === undefined) throw new Error(`Missing campaign file: ${path}`);
    const campaign = campaignSchema.parse(rawCampaign);
    if (campaign.id !== id) {
      throw new Error(`Campaign ID mismatch for ${path}: expected ${id}`);
    }
    assertNoDuplicates("episode", campaign.episodes);

    const episodes = campaign.episodes.map((entry) => {
      if (episodeIds.has(entry.id)) {
        throw new Error(`Duplicate episode ID across campaigns: ${entry.id}`);
      }
      if (episodeFiles.has(entry.file)) {
        throw new Error(`Duplicate episode file across campaigns: ${entry.file}`);
      }
      episodeIds.add(entry.id);
      episodeFiles.add(entry.file);

      const episodePath = `./episodes/${entry.file}`;
      const rawEpisode = episodeModules[episodePath];
      if (rawEpisode === undefined) {
        throw new Error(`Missing episode file: ${episodePath}`);
      }
      const episode = loadEpisode(rawEpisode, mechanics, audio);
      if (episode.id !== entry.id) {
        throw new Error(`Episode ID mismatch for ${episodePath}: expected ${entry.id}`);
      }
      for (const result of [
        episode.results.success,
        episode.results.failure,
      ]) {
        if (result.illustration) {
          resolveIllustrationAsset(result.illustration, episode.id);
        }
      }
      return episode;
    });
    for (const section of [campaign.briefing, campaign.debriefing]) {
      if (section.illustration) {
        resolveIllustrationAsset(section.illustration, campaign.id);
      }
    }
    return { ...campaign, episodes };
  });

  assertNoUnlistedFiles(
    "episode",
    "episodes",
    [...episodeFiles],
    episodeModules,
  );
  const episodes = campaigns.flatMap((campaign) => campaign.episodes);
  return {
    ...game,
    campaigns,
    entryEpisode: campaigns[0].episodes[0],
    episodes,
  };
}

import type { ResistanceOutcome } from "./types";

export type CampaignRun = {
  readonly episodesHeld: number;
  readonly episodesAttempted: number;
  readonly episodesTotal: number;
};

export function createCampaignRun(episodesTotal: number): CampaignRun {
  if (!Number.isInteger(episodesTotal) || episodesTotal < 1) {
    throw new Error("campaign must contain at least one episode");
  }
  return { episodesHeld: 0, episodesAttempted: 0, episodesTotal };
}

export function assertCampaignRunMatches(
  run: CampaignRun,
  episodeCount: number,
): void {
  if (run.episodesTotal !== episodeCount) {
    throw new Error("campaign run total must match its campaign episodes");
  }
}

export function acceptCampaignOutcome(
  run: CampaignRun,
  outcome: Exclude<ResistanceOutcome, "active">,
): CampaignRun {
  if (run.episodesAttempted >= run.episodesTotal) {
    throw new Error("campaign has already recorded every episode outcome");
  }
  return {
    ...run,
    episodesHeld: run.episodesHeld + (outcome === "success" ? 1 : 0),
    episodesAttempted: run.episodesAttempted + 1,
  };
}

export function retryCampaignEpisode(run: CampaignRun): CampaignRun {
  return run;
}

export function getCurrentCampaignEpisodeIndex(
  run: CampaignRun,
): number | null {
  return isCampaignComplete(run) ? null : run.episodesAttempted;
}

export function isCampaignComplete(run: CampaignRun): boolean {
  return run.episodesAttempted === run.episodesTotal;
}

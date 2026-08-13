import { describe, expect, it } from "vitest";

import {
  acceptCampaignOutcome,
  assertCampaignRunMatches,
  createCampaignRun,
  getCurrentCampaignEpisodeIndex,
  isCampaignComplete,
  retryCampaignEpisode,
} from "../../../src/play/engine/campaign";

describe("campaign progression", () => {
  it("starts before the first ordered episode", () => {
    expect(createCampaignRun(3)).toEqual({
      episodesHeld: 0,
      episodesAttempted: 0,
      episodesTotal: 3,
    });
  });

  it("counts accepted victories as held and failures as attempted", () => {
    const afterVictory = acceptCampaignOutcome(createCampaignRun(2), "victory");
    const complete = acceptCampaignOutcome(
      afterVictory,
      "forced-verticalisation",
    );
    expect(complete).toEqual({
      episodesHeld: 1,
      episodesAttempted: 2,
      episodesTotal: 2,
    });
    expect(isCampaignComplete(complete)).toBe(true);
  });

  it("leaves the tally unchanged until an outcome is accepted", () => {
    const run = createCampaignRun(1);
    const retriedRun = retryCampaignEpisode(run);
    expect(retriedRun).toBe(run);
    expect(retriedRun.episodesAttempted).toBe(0);
  });

  it("advances through episode positions in order", () => {
    const first = createCampaignRun(2);
    expect(getCurrentCampaignEpisodeIndex(first)).toBe(0);
    const second = acceptCampaignOutcome(first, "forced-verticalisation");
    expect(getCurrentCampaignEpisodeIndex(second)).toBe(1);
    const complete = acceptCampaignOutcome(second, "victory");
    expect(getCurrentCampaignEpisodeIndex(complete)).toBeNull();
  });

  it("cannot record an episode twice after campaign completion", () => {
    const complete = acceptCampaignOutcome(createCampaignRun(1), "victory");
    expect(() => acceptCampaignOutcome(complete, "victory"))
      .toThrow(/already recorded every episode/);
  });

  it("rejects an empty campaign run", () => {
    expect(() => createCampaignRun(0)).toThrow(/at least one episode/);
  });

  it("rejects a run whose denominator disagrees with its campaign", () => {
    expect(() => assertCampaignRunMatches(createCampaignRun(2), 3))
      .toThrow(/must match/);
  });
});

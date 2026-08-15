import { describe, expect, it } from "vitest";

import campaignContent from "../../../src/play/content/campaigns/the-monday-uprising.json";
import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import { game, mechanics } from "../../../src/play/content/game";
import gameContent from "../../../src/play/content/game.json";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import { loadGame, type ContentModules } from "../../../src/play/content/loadGame";
import { createResistance } from "../../../src/play/engine/resistance";
import { contentIdSchema } from "../../../src/play/content/schemas/gameSchema";
import { findPlaceholderIdSegment } from "../../../src/play/content/contentRules.mjs";

const campaignModules = {
  "./campaigns/the-monday-uprising.json": campaignContent,
};
const episodeModules = { "./episodes/the-alarm.json": episodeContent };
const loadTestGame = (
  content: unknown,
  campaigns: ContentModules = campaignModules,
  episodes: ContentModules = episodeModules,
) => loadGame(content, campaigns, episodes, mechanics);
const loadTestEpisode = (content: unknown) => loadEpisode(content, mechanics);

describe("game content loading", () => {
  it("loads the ordered game, campaign and episode hierarchy", () => {
    expect(game.id).toBe("the-horizontal-front");
    expect(game.campaigns[0].title).toBe("The Monday Uprising");
    expect(game.entryEpisode).toBe(game.campaigns[0].episodes[0]);
    expect(game.campaigns[0].episodes.map(({ id }) => id)).toEqual(["the-alarm"]);
  });

  it("requires campaign briefing and debriefing copy", () => {
    expect(() => loadTestGame(gameContent, {
      "./campaigns/the-monday-uprising.json": {
        ...campaignContent,
        briefing: { ...campaignContent.briefing, body: "" },
      },
    }, episodeModules)).toThrow();
    expect(() => loadTestGame(gameContent, {
      "./campaigns/the-monday-uprising.json": {
        ...campaignContent,
        debriefing: { ...campaignContent.debriefing, scoreLabel: "" },
      },
    }, episodeModules)).toThrow();
    const { illustration: _illustration, ...debriefingWithoutIllustration } = campaignContent.debriefing;
    expect(() => loadTestGame(gameContent, {
      "./campaigns/the-monday-uprising.json": {
        ...campaignContent,
        debriefing: debriefingWithoutIllustration,
      },
    }, episodeModules)).toThrow(/illustration/);
  });

  it("requires validated global interface copy and its placeholders", () => {
    expect(() => loadTestGame(
      { ...gameContent, interface: { ...gameContent.interface, campaignsHeading: "" } },
      campaignModules,
      episodeModules,
    )).toThrow();
    expect(() => loadTestGame(
      {
        ...gameContent,
        interface: { ...gameContent.interface, campaignsStatus: "No selection" },
      },
      campaignModules,
      episodeModules,
    )).toThrow(/must contain exactly/);
  });

  it("requires episode-authored confrontation copy and finite templates", () => {
    expect(() => loadTestEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
        copy: { ...episodeContent.confrontation.copy, headline: "" },
      },
    })).toThrow();
    expect(() => loadTestGame({
      ...gameContent,
      mechanics: {
        ...gameContent.mechanics,
        resistance: { ...gameContent.mechanics.resistance, cueTap: "NOW" },
      },
    }, campaignModules, episodeModules)).toThrow(/must contain exactly/);
  });

  it("loads The Alarm as validated playable content", () => {
    const episode = loadTestEpisode(episodeContent);
    expect(episode.id).toBe("the-alarm");
    expect(episode.confrontation.dramaticCurve).toEqual({
      source: "episode",
      id: "alarm-escalation",
    });
    expect(episode.confrontation.resistance.phases.map(({ id }) => id)).toEqual([
      "orientation", "establishment", "pressure", "crisis",
    ]);
    expect(episode.confrontation.presentation).toEqual({
      layout: { source: "shared", id: "episode-confrontation" },
      skin: { source: "episode", id: "the-alarm-bedroom" },
    });
  });

  it("supplies resistance configuration directly to the engine", () => {
    const episode = loadTestEpisode(episodeContent);
    const resistance = createResistance(episode.confrontation.resistance);
    expect(resistance.config).toBe(episode.confrontation.resistance);
    expect(resistance.state.duvetSafety).toBe(0.85);
  });

  it("rejects unknown episode fields and overlapping rhythm windows", () => {
    expect(() => loadTestEpisode({ ...episodeContent, executableScript: "tipBed()" }))
      .toThrow();
    expect(() => loadTestEpisode({
      ...episodeContent,
      confrontation: {
        ...episodeContent.confrontation,
          resistance: {
            dramaticCurve: { source: "shared", id: "unknown-curve" },
          },
      },
    })).toThrow(/unknown shared dramatic curve/);
  });

  it("rejects numeric sequence segments without rejecting ordinary words", () => {
    for (const id of ["episode-01", "chapter-1", "part-2", "1"] as const) {
      expect(() => contentIdSchema.parse(id)).toThrow(/numeric sequence/);
    }
    for (const id of [
      "crime-scene",
      "test-of-strength",
      "campaign-of-terror",
      "one-scene",
    ] as const) {
      expect(contentIdSchema.parse(id)).toBe(id);
    }
  });

  it("identifies only unambiguous placeholder segments for build policy", () => {
    expect(findPlaceholderIdSegment("monday-prototype")).toBe("prototype");
    expect(findPlaceholderIdSegment("crime-scene")).toBeUndefined();
    expect(findPlaceholderIdSegment("test-of-strength")).toBeUndefined();
  });

  it("requires reference filenames to exactly match their IDs", () => {
    expect(() => loadTestGame(
      {
        ...gameContent,
        campaigns: [{ id: "the-monday-uprising", file: "monday.json" }],
      },
      campaignModules,
      episodeModules,
    )).toThrow(/filename must exactly match/);
  });

  it("rejects missing and unlisted campaign files", () => {
    expect(() => loadTestGame(gameContent, {}, episodeModules))
      .toThrow(/Missing campaign file/);
    expect(() => loadTestGame(gameContent, {
      ...campaignModules,
      "./campaigns/forgotten.json": campaignContent,
    }, episodeModules)).toThrow(/Unlisted campaign files/);
  });

  it("rejects missing and unlisted episode files", () => {
    expect(() => loadTestGame(gameContent, campaignModules, {}))
      .toThrow(/Missing episode file/);
    expect(() => loadTestGame(gameContent, campaignModules, {
      ...episodeModules,
      "./episodes/forgotten.json": episodeContent,
    })).toThrow(/Unlisted episode files/);
  });

  it("rejects duplicate episode IDs globally across campaigns", () => {
    const secondCampaign = {
      ...campaignContent,
      id: "management-retaliates",
      title: "Management Retaliates",
      briefing: {
        headline: campaignContent.briefing.headline,
        body: campaignContent.briefing.body,
      },
    };
    expect(() => loadTestGame(
      {
        ...gameContent,
        campaigns: [
          gameContent.campaigns[0],
          { id: "management-retaliates", file: "management-retaliates.json" },
        ],
      },
      {
        ...campaignModules,
        "./campaigns/management-retaliates.json": secondCampaign,
      },
      episodeModules,
    )).toThrow(/Duplicate episode ID across campaigns/);
  });

  it("rejects identity disagreement at each content boundary", () => {
    expect(() => loadTestGame(gameContent, {
      "./campaigns/the-monday-uprising.json": {
        ...campaignContent,
        id: "monday-revolt",
      },
    }, episodeModules)).toThrow(/Campaign ID mismatch/);
    expect(() => loadTestGame(gameContent, campaignModules, {
      "./episodes/the-alarm.json": { ...episodeContent, id: "the-siren" },
    })).toThrow(/Episode ID mismatch/);
  });
});

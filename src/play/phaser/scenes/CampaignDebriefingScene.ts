import Phaser from "phaser";

import type { Campaign } from "../../content/loadGame";
import { formatCopy } from "../../content/formatCopy";
import { game } from "../../content/game";
import type { CampaignRun } from "../../engine/campaign";
import { isCampaignComplete } from "../../engine/campaign";
import { getMenuAction } from "../../input/menuInput";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { GAME_CENTRE_X } from "../design";
import { announce, createButton } from "../sceneChrome";

type CampaignDebriefingData = {
  readonly campaign: Campaign;
  readonly run: CampaignRun;
};

export class CampaignDebriefingScene extends Phaser.Scene {
  private campaign!: Campaign;
  private run!: CampaignRun;
  private transitioning = false;

  public constructor() {
    super({ key: "CampaignDebriefingScene" });
  }

  public init(data: CampaignDebriefingData): void {
    if (!isCampaignComplete(data.run)) {
      throw new Error("campaign debriefing requires a complete campaign run");
    }
    if (data.run.episodesTotal !== data.campaign.episodes.length) {
      throw new Error("campaign debriefing run must match its campaign");
    }
    this.campaign = data.campaign;
    this.run = data.run;
  }

  public create(): void {
    this.transitioning = false;
    const { debriefing } = this.campaign;
    const score = `${this.run.episodesHeld} / ${this.run.episodesTotal}`;
    this.cameras.main.setBackgroundColor(getThemeColour("duvetCream"));
    this.add.text(GAME_CENTRE_X, 90, debriefing.headline, createTextStyles().title)
      .setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 235, debriefing.body, {
      ...createTextStyles().body,
      wordWrap: { width: 900 },
      lineSpacing: 9,
    }).setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 410, debriefing.scoreLabel, createTextStyles().notice)
      .setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 485, score, {
      ...createTextStyles().title,
      color: getThemeColour("resistanceRed"),
    }).setOrigin(0.5);

    const replay = () => this.transitionTo("CampaignBriefingScene", {
      campaign: this.campaign,
    });
    const campaigns = () => this.transitionTo("CampaignsScene");
    createButton(this, 390, 610, 410, game.interface.replayCampaign, replay);
    createButton(this, 890, 610, 410, game.interface.returnToCampaigns, campaigns);

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const action = getMenuAction(event);
      if (action === "replay" || action === "select") {
        replay();
      } else if (action === "back") {
        campaigns();
      }
    });
    announce(formatCopy(game.interface.debriefingStatus, {
      headline: debriefing.headline,
      body: debriefing.body,
      scoreLabel: debriefing.scoreLabel,
      score,
    }));
  }

  private transitionTo(key: string, data?: object): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start(key, data);
  }
}

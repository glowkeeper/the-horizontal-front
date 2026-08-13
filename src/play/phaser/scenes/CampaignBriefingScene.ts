import Phaser from "phaser";

import type { Campaign } from "../../content/loadGame";
import { formatCopy } from "../../content/formatCopy";
import { game } from "../../content/game";
import { createCampaignRun } from "../../engine/campaign";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { getMenuAction } from "../../input/menuInput";
import { GAME_CENTRE_X } from "../design";
import { announce } from "../sceneChrome";

type CampaignBriefingData = { readonly campaign: Campaign };

export class CampaignBriefingScene extends Phaser.Scene {
  private campaign!: Campaign;
  private transitioning = false;

  public constructor() {
    super({ key: "CampaignBriefingScene" });
  }

  public init(data: CampaignBriefingData): void {
    this.campaign = data.campaign;
  }

  public create(): void {
    this.transitioning = false;
    const { briefing, episodes, title } = this.campaign;
    this.cameras.main.setBackgroundColor(getThemeColour("duvetCream"));
    this.add.text(GAME_CENTRE_X, 95, title.toUpperCase(), createTextStyles().notice)
      .setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 225, briefing.headline, createTextStyles().title)
      .setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 390, briefing.body, {
      ...createTextStyles().body,
      wordWrap: { width: 900 },
      lineSpacing: 9,
    }).setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 615, game.interface.briefingInstructions, {
      ...createTextStyles().notice,
      color: getThemeColour("resistanceRed"),
    }).setOrigin(0.5);

    const begin = () => {
      if (this.transitioning) return;
      this.transitioning = true;
      this.scene.start("ResistanceScene", {
        campaign: this.campaign,
        episode: episodes[0],
        run: createCampaignRun(episodes.length),
      });
    };
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (getMenuAction(event) === "select") begin();
    });
    this.input.once("pointerdown", begin);
    announce(formatCopy(game.interface.briefingStatus, {
      title,
      headline: briefing.headline,
      body: briefing.body,
    }));
  }
}

import Phaser from "phaser";

import { game } from "../../content/game";
import { formatCopy } from "../../content/formatCopy";
import type { Campaign } from "../../content/loadGame";
import { getMenuAction, moveSelection } from "../../input/menuInput";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { getCampaignCardPlacements } from "../campaignMenuLayout";
import { CHROME_MENU, CHROME_PANEL, GAME_CENTRE_X } from "../design";
import { announce, toColour } from "../sceneChrome";

export class CampaignsScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private transitioning = false;

  public constructor() {
    super({ key: "CampaignsScene" });
  }

  public create(): void {
    this.selectedIndex = 0;
    this.cards = [];
    this.transitioning = false;
    this.cameras.main.setBackgroundColor(getThemeColour(CHROME_PANEL.background));
    this.add.text(GAME_CENTRE_X, 80, game.title.toUpperCase(), createTextStyles().notice)
      .setOrigin(0.5);
    this.add.text(GAME_CENTRE_X, 155, game.interface.campaignsHeading, createTextStyles().title)
      .setOrigin(0.5);

    const placements = getCampaignCardPlacements(game.campaigns.length);
    game.campaigns.forEach((campaign, index) => {
      const card = this.createCampaignCard(
        campaign,
        index,
        placements[index].centreY,
        placements[index],
      );
      this.cards.push(card);
    });
    this.add.text(GAME_CENTRE_X, 665, game.interface.campaignsInstructions, {
      ...createTextStyles().notice,
      fontSize: `${CHROME_MENU.headingSizePx}px`,
    }).setOrigin(0.5);

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const action = getMenuAction(event);
      if (action === "previous" || action === "next") {
        this.selectedIndex = moveSelection(
          this.selectedIndex,
          action,
          game.campaigns.length,
        );
        this.renderSelection();
      } else if (action === "select") {
        this.openCampaign(game.campaigns[this.selectedIndex]);
      }
    });
    this.renderSelection();
  }

  private createCampaignCard(
    campaign: Campaign,
    index: number,
    y: number,
    placement: ReturnType<typeof getCampaignCardPlacements>[number],
  ): Phaser.GameObjects.Container {
    const { height, titleOffset, summaryOffset, titleFontSize, summaryFontSize } = placement;
    const background = this.add.rectangle(0, 0, 900, height)
      .setStrokeStyle(CHROME_MENU.cardStrokeWidth, toColour(CHROME_MENU.cardStroke));
    const title = this.add.text(0, titleOffset, campaign.title.toUpperCase(), {
      ...createTextStyles().notice,
      fontSize: `${titleFontSize}px`,
    }).setOrigin(0.5);
    const summary = this.add.text(0, summaryOffset, campaign.briefing.headline, {
      ...createTextStyles().body,
      fontSize: `${summaryFontSize}px`,
    }).setOrigin(0.5);
    const card = this.add.container(GAME_CENTRE_X, y, [background, title, summary]);
    background.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      this.selectedIndex = index;
      this.openCampaign(campaign);
    });
    return card;
  }

  private renderSelection(): void {
    this.cards.forEach((card, index) => {
      const background = card.list[0] as Phaser.GameObjects.Rectangle;
      background.setFillStyle(
        index === this.selectedIndex
          ? toColour(CHROME_MENU.cardSelectedFill)
          : toColour(CHROME_MENU.cardFill),
      );
    });
    const campaign = game.campaigns[this.selectedIndex];
    announce(formatCopy(game.interface.campaignsStatus, {
      title: campaign.title,
      headline: campaign.briefing.headline,
    }));
  }

  private openCampaign(campaign: Campaign): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start("CampaignBriefingScene", { campaign });
  }

}

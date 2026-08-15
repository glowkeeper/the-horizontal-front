import Phaser from "phaser";

import { game } from "../../content/game";
import type { Campaign } from "../../content/loadGame";
import { getMenuAction, moveSelection } from "../../input/menuInput";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { getCampaignCardPlacements } from "../campaignMenuLayout";
import { addChromeButton } from "../chromeOverlay";
import { CHROME_MENU, CHROME_PANEL, GAME_CENTRE_X } from "../design";

export class CampaignsScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: HTMLButtonElement[] = [];
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
    this.cards = game.campaigns.map((campaign, index) =>
      this.createCampaignCard(campaign, index, placements[index]));
    this.add.text(GAME_CENTRE_X, 665, game.interface.campaignsInstructions, {
      ...createTextStyles().notice,
      fontSize: `${CHROME_MENU.headingSizePx}px`,
    }).setOrigin(0.5);

    // Arrows move focus between the real controls, and Enter opens the
    // selected campaign whether or not it holds focus, so the on-screen
    // instructions hold. Space is handled natively by a focused button.
    //
    // Focus is deliberately not taken on arrival. A browser treats programmatic
    // focus on a freshly loaded document as keyboard intent, so auto-focusing
    // painted a focus ring on players who had just clicked in from the site,
    // and none on players returning from the game within the same document.
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const action = getMenuAction(event);
      if (action === "select") {
        this.openCampaign(game.campaigns[this.selectedIndex]);
        return;
      }
      if (action !== "previous" && action !== "next") return;
      this.selectedIndex = moveSelection(
        this.selectedIndex,
        action,
        game.campaigns.length,
      );
      this.cards[this.selectedIndex]?.focus();
    });
  }

  /**
   * Each campaign is a real control. Selection is focus: a screen reader
   * announces the campaign on arrival, and the focus ring shows sighted
   * keyboard users where they are, so no separate selected-fill state or live
   * region message is needed.
   */
  private createCampaignCard(
    campaign: Campaign,
    index: number,
    placement: ReturnType<typeof getCampaignCardPlacements>[number],
  ): HTMLButtonElement {
    const { centreY, height, titleFontSize, summaryFontSize } = placement;
    const card = addChromeButton(this, {
      x: GAME_CENTRE_X,
      y: centreY,
      width: 900,
      height,
      label: campaign.title.toUpperCase(),
      description: campaign.briefing.headline,
      labelSizePx: titleFontSize,
      descriptionSizePx: summaryFontSize,
      variant: "primary",
      onSelect: () => this.openCampaign(campaign),
    });
    card.addEventListener("focus", () => {
      this.selectedIndex = index;
    });
    return card;
  }

  private openCampaign(campaign: Campaign): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.scene.start("CampaignBriefingScene", { campaign });
  }

}

import Phaser from "phaser";

import type { Campaign } from "../../content/loadGame";
import { formatCopy } from "../../content/formatCopy";
import { game } from "../../content/game";
import { resolveIllustrationAsset } from "../../content/presentationAssets";
import { createCampaignRun } from "../../engine/campaign";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { getMenuAction } from "../../input/menuInput";
import { CHROME_PANEL, GAME_CENTRE_X } from "../design";
import { announce, createButton } from "../sceneChrome";
import { createIllustratedSemanticPanel } from "../presentation/illustratedSemanticPanel";

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
    const beginLabel = formatCopy(game.interface.beginEpisode, {
      episode: episodes[0].title.toUpperCase(),
    });
    let panelLayout: ReturnType<typeof createIllustratedSemanticPanel> | null = null;
    if (briefing.illustration) {
      const asset = resolveIllustrationAsset(briefing.illustration, this.campaign.id);
      panelLayout = createIllustratedSemanticPanel(this, {
        assetId: asset.id,
        kicker: title.toUpperCase(),
        headline: briefing.headline,
        body: briefing.body,
      });
    } else {
      this.cameras.main.setBackgroundColor(getThemeColour(CHROME_PANEL.background));
      this.add.text(GAME_CENTRE_X, 95, title.toUpperCase(), createTextStyles().notice).setOrigin(0.5);
      this.add.text(GAME_CENTRE_X, 225, briefing.headline, createTextStyles().title).setOrigin(0.5);
      this.add.text(GAME_CENTRE_X, 390, briefing.body, {
        ...createTextStyles().body, wordWrap: { width: 900 }, lineSpacing: 9,
      }).setOrigin(0.5);
    }

    const begin = () => {
      if (this.transitioning) return;
      this.transitioning = true;
      this.scene.start("ResistanceScene", {
        campaign: this.campaign,
        episode: episodes[0],
        run: createCampaignRun(episodes.length),
      });
    };
    if (panelLayout) {
      createButton(
        this,
        panelLayout.anchors.primaryAction.x,
        panelLayout.anchors.primaryAction.y,
        panelLayout.actions.width,
        beginLabel,
        begin,
        panelLayout.actions.height,
      );
    } else {
      createButton(this, GAME_CENTRE_X, 615, 420, beginLabel, begin);
    }
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (getMenuAction(event) === "select") begin();
    });
    announce(formatCopy(game.interface.briefingStatus, {
      title,
      headline: briefing.headline,
      body: briefing.body,
    }));
  }
}

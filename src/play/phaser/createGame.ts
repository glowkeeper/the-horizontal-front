import Phaser from "phaser";

import { getThemeColour } from "../theme/theme";
import { BootScene } from "./scenes/BootScene";
import { CampaignBriefingScene } from "./scenes/CampaignBriefingScene";
import { CampaignDebriefingScene } from "./scenes/CampaignDebriefingScene";
import { CampaignsScene } from "./scenes/CampaignsScene";
import { ResistanceScene } from "./scenes/ResistanceScene";
import { CHROME_BACKGROUND, GAME_HEIGHT, GAME_WIDTH } from "./design";

export function createGame(container: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    parent: container,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    backgroundColor: getThemeColour(CHROME_BACKGROUND),

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    render: {
      antialias: true,
      roundPixels: false,
    },

    scene: [
      BootScene,
      CampaignsScene,
      CampaignBriefingScene,
      ResistanceScene,
      CampaignDebriefingScene,
    ],
  };

  return new Phaser.Game(config);
}

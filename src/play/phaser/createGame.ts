import Phaser from "phaser";

import { getThemeColour } from "../theme/theme";
import { BootScene } from "./scenes/BootScene";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export function createGame(container: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    parent: container,

    width: GAME_WIDTH,
    height: GAME_HEIGHT,

    backgroundColor: getThemeColour("duvetCream"),

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    render: {
      antialias: true,
      roundPixels: false,
    },

    scene: [BootScene],
  };

  return new Phaser.Game(config);
}

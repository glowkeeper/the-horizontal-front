import Phaser from "phaser";

import { createTextStyles, getThemeColour } from "../../theme/theme";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: "BootScene" });
  }

  public create(): void {
    const { centerX, centerY } = this.cameras.main;
    const textStyles = createTextStyles();

    this.add
      .text(centerX, centerY - 180, "A NOTICE FROM THE HORIZONTAL FRONT", textStyles.notice)
      .setOrigin(0.5);

    this.add
      .rectangle(
        centerX,
        centerY - 130,
        120,
        8,
        Phaser.Display.Color.HexStringToColor(
          getThemeColour("managementGold"),
        ).color,
      )
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 30, "THE MONDAY UPRISING\nIS BEING ORGANISED", textStyles.title)
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY + 95,
        "Management has been notified of absolutely nothing.",
        textStyles.body,
      )
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 160, "The Horizontal Front is coming soon.", textStyles.status)
      .setOrigin(0.5);
  }
}

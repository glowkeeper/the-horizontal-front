import Phaser from "phaser";

import { textStyles } from "../../theme/theme";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: "BootScene" });
  }

  public create(): void {
    const { centerX, centerY } = this.cameras.main;

    this.add
      .text(
        centerX,
        centerY,
        "The Horizontal Front",
        textStyles.title,
      )
      .setOrigin(0.5);
  }
}
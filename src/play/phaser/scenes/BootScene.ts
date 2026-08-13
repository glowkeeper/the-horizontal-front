import Phaser from "phaser";

import { presentationAssets } from "../../content/presentationAssets";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super({ key: "BootScene" });
  }

  public preload(): void {
    for (const asset of presentationAssets) {
      this.load.image(asset.id, asset.url);
    }
  }

  public create(): void {
    this.scene.start("CampaignsScene");
  }
}

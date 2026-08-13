import Phaser from "phaser";

import { episodeCatalog } from "../../content/episodeCatalog";
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
    const [episode] = episodeCatalog.episodes;

    this.scene.start("ResistanceScene", { episode });
  }
}

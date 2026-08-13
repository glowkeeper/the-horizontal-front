import type Phaser from "phaser";

import type { Episode } from "../../content/schemas/episodeSchema";
import type { ResistanceLayoutContent } from "../../content/schemas/presentationSchema";
import { createBedHeadRightLayout } from "./bedHeadRightLayout";

export type ResistanceLayout = {
  readonly content: ResistanceLayoutContent;
  render(duvetSafety: number): void;
  animateVictory(): void;
  animateForcedVerticalisation(): void;
};

type Presentation = Episode["confrontation"]["presentation"];

export function createResistanceLayout(
  scene: Phaser.Scene,
  presentation: Presentation,
): ResistanceLayout {
  switch (presentation.layout) {
    case "bed-head-right":
      return createBedHeadRightLayout(scene, presentation);
  }
}

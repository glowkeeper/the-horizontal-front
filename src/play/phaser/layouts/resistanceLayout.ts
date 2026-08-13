import type Phaser from "phaser";

import type { Episode } from "../../content/loadEpisode";
import type { ResistanceLayoutContent } from "../../content/schemas/presentationSchema";
import { createBedHeadRightLayout } from "./bedHeadRightLayout";

export type ResistanceLayout = {
  readonly content: ResistanceLayoutContent;
  render(duvetSafety: number, dramaticIntensity: number): void;
  animateVictory(): void;
  animateForcedVerticalisation(): void;
};

export function createResistanceLayout(
  scene: Phaser.Scene,
  episode: Episode,
): ResistanceLayout {
  const presentation = episode.confrontation.presentation;
  switch (presentation.layout.id) {
    case "bed-head-right":
      return createBedHeadRightLayout(scene, episode);
  }
}

import type Phaser from "phaser";

import type { Episode } from "../../content/loadEpisode";
import type { ResistanceLayoutContent } from "../../content/schemas/presentationSchema";
import type { InterruptionSkin } from "../../content/schemas/presentationSchema";
import { createEpisodeConfrontationLayout } from "./episodeConfrontationLayout";

export type ResistanceLayout = {
  readonly content: ResistanceLayoutContent;
  readonly interruptionSkins: ReadonlyMap<string, InterruptionSkin>;
  render(duvetSafety: number, dramaticIntensity: number): void;
  animateVictory(): void;
  animateForcedVerticalisation(): void;
};

export function createResistanceLayout(
  scene: Phaser.Scene,
  episode: Episode,
): ResistanceLayout {
  return createEpisodeConfrontationLayout(scene, episode);
}

import type Phaser from "phaser";

import type { Episode } from "../../content/loadEpisode";
import type { ResistanceLayoutContent } from "../../content/schemas/presentationSchema";
import type { InterruptionSkin } from "../../content/schemas/presentationSchema";
import { createEpisodeConfrontationLayout } from "./episodeConfrontationLayout";

/**
 * Told when the resistance visual advances or eases, and in which direction.
 * The thresholds themselves stay in skin data; the layout only reports that one
 * was crossed, so presentation keeps deciding when the bed moves and audio
 * keeps deciding what that sounds like.
 */
export type ResistanceStateListener = (direction: 1 | -1) => void;

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
  onResistanceStateChange?: ResistanceStateListener,
): ResistanceLayout {
  return createEpisodeConfrontationLayout(scene, episode, onResistanceStateChange);
}

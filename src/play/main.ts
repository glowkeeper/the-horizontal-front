import "./styles/game.css";
import "../shared/registerServiceWorker";

import {
  getSharedAudioOutput,
  isGlobalMuted,
  setGlobalMuted,
} from "./audio/soundscapePlayer";
import { createGame } from "./phaser/createGame";

const gameContainer = document.querySelector<HTMLElement>("#game");

if (!gameContainer) {
  throw new Error('Could not find the game container with the id "game".');
}

bindAudioToggle();
createGame(gameContainer);

/**
 * Mute lives in the page shell rather than in a scene, so it is reachable on
 * every screen, survives scene transitions and is an ordinary button that
 * assistive technology already understands.
 *
 * Its wording arrives as build-time data attributes for the same reason the
 * rest of the shell's copy does: player-facing text belongs in content, and the
 * shell must not reach into the game module to find it.
 */
function bindAudioToggle(): void {
  const toggle = document.querySelector<HTMLButtonElement>("#audio-toggle");
  const status = document.querySelector<HTMLElement>("#game-status");
  if (!toggle) return;
  const copy = toggle.dataset;
  const output = getSharedAudioOutput();

  const render = (): void => {
    const muted = isGlobalMuted();
    toggle.textContent = (muted ? copy.labelUnmute : copy.labelMute) ?? "";
    toggle.setAttribute("aria-pressed", String(muted));
  };

  toggle.addEventListener("click", () => {
    const muted = !isGlobalMuted();
    setGlobalMuted(muted);
    // The click is a gesture, so it is also the moment audio may legally start.
    if (!muted) void output.unlock();
    render();
    if (status) {
      status.textContent = (muted ? copy.statusMuted : copy.statusAudible) ?? "";
    }
  });

  // A backgrounded tab should not keep sounding; returning restores it unless
  // the player muted deliberately.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) output.suspend();
    else if (!isGlobalMuted()) output.resume();
  });

  render();
}

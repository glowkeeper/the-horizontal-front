import type Phaser from "phaser";

import { GAME_HEIGHT, GAME_WIDTH } from "./design";

/**
 * Interface chrome as real DOM controls layered over the canvas.
 *
 * Canvas-drawn chrome cannot be reached by Tab, shows no focus ring, is not
 * announced by assistive technology and does not respond to Enter or Space.
 * Chrome is not authored world composition — no episode restyles it — so it is
 * rendered as ordinary buttons instead, styled by `src/play/styles/game.css`.
 *
 * The overlay is a design-space surface: it is exactly GAME_WIDTH by
 * GAME_HEIGHT and is scaled and offset to sit precisely on the canvas, which
 * Phaser letterboxes with `Scale.FIT`. Controls are therefore positioned in the
 * same 1280x720 coordinates the scenes already use, and every drawn dimension —
 * padding, type size, border, shadow — scales with the canvas rather than
 * drifting away from the composition beneath it.
 *
 * It deliberately lives outside `#game`, which carries `role="application"`, so
 * these controls remain ordinary buttons to a screen reader.
 */

export type ChromeButtonOptions = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  /** Optional second line. It forms part of the control's accessible name. */
  readonly description?: string;
  readonly labelSizePx?: number;
  readonly descriptionSizePx?: number;
  readonly variant: "primary" | "secondary";
  readonly onSelect: () => void;
};

let overlay: HTMLDivElement | null = null;
let trackedCanvas: HTMLCanvasElement | null = null;

function getOverlay(canvas: HTMLCanvasElement): HTMLDivElement {
  if (overlay) return overlay;
  const host = canvas.closest("#app") ?? document.body;
  if (host instanceof HTMLElement) host.style.position = "relative";
  const element = document.createElement("div");
  element.className = "game-chrome";
  host.append(element);
  overlay = element;
  trackedCanvas = canvas;
  positionOverlay();
  window.addEventListener("resize", positionOverlay);
  return element;
}

function positionOverlay(): void {
  if (!overlay || !trackedCanvas) return;
  const host = overlay.parentElement;
  if (!host) return;
  const canvasBounds = trackedCanvas.getBoundingClientRect();
  const hostBounds = host.getBoundingClientRect();
  if (canvasBounds.width === 0) return;
  overlay.style.left = `${canvasBounds.left - hostBounds.left}px`;
  overlay.style.top = `${canvasBounds.top - hostBounds.top}px`;
  overlay.style.transform = `scale(${canvasBounds.width / GAME_WIDTH})`;
}

/**
 * Adds one control for the calling scene and removes it again when that scene
 * shuts down, so a scene transition cannot leave orphaned DOM behind.
 */
export function addChromeButton(
  scene: Phaser.Scene,
  options: ChromeButtonOptions,
): HTMLButtonElement {
  const canvas = scene.game.canvas;
  const element = document.createElement("button");
  element.type = "button";
  element.className = "game-action";
  element.dataset.variant = options.variant;
  const labelElement = document.createElement("span");
  labelElement.className = "game-action-label";
  labelElement.textContent = options.label;
  if (options.labelSizePx !== undefined) {
    labelElement.style.fontSize = `${options.labelSizePx}px`;
  }
  element.append(labelElement);
  if (options.description !== undefined) {
    const descriptionElement = document.createElement("span");
    descriptionElement.className = "game-action-description";
    descriptionElement.textContent = options.description;
    if (options.descriptionSizePx !== undefined) {
      descriptionElement.style.fontSize = `${options.descriptionSizePx}px`;
    }
    element.append(descriptionElement);
    // Accessible-name computation concatenates child text without a separator,
    // so two stacked lines would otherwise be announced as one run-on string.
    element.setAttribute("aria-label", `${options.label}. ${options.description}`);
  }
  element.style.left = `${options.x - options.width / 2}px`;
  element.style.top = `${options.y - options.height / 2}px`;
  element.style.width = `${options.width}px`;
  element.style.height = `${options.height}px`;
  element.addEventListener("click", options.onSelect);
  getOverlay(canvas).append(element);

  // Phaser re-lays out the canvas on its own schedule as well as the window's.
  const reposition = () => positionOverlay();
  scene.scale.on("resize", reposition);
  scene.events.once("shutdown", () => {
    scene.scale.off("resize", reposition);
    element.remove();
  });
  positionOverlay();
  return element;
}

/**
 * Removes the overlay entirely. Exposed for tests and teardown; ordinary scene
 * transitions only need the per-control cleanup above.
 */
export function destroyChromeOverlay(): void {
  window.removeEventListener("resize", positionOverlay);
  overlay?.remove();
  overlay = null;
  trackedCanvas = null;
}

export const CHROME_DESIGN_SIZE = { width: GAME_WIDTH, height: GAME_HEIGHT };

import Phaser from "phaser";

import { getThemeColour, type ButtonVariant } from "../theme/theme";
import { addChromeButton } from "./chromeOverlay";
import { CHROME_BUTTON } from "./design";

export function announce(message: string): void {
  const status = document.querySelector<HTMLElement>("#game-status");
  if (status) status.textContent = message;
}

export function toColour(
  role: Parameters<typeof getThemeColour>[0],
): number {
  return hexToColour(getThemeColour(role));
}

export function hexToColour(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

/**
 * Adds one interface-chrome control in design-space coordinates.
 *
 * The control is a real DOM button layered over the canvas rather than drawn
 * into it, so it is keyboard operable and announced by assistive technology.
 * Callers keep working in design coordinates and need not know the difference.
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  action: () => void,
  height: number = CHROME_BUTTON.height,
  variant: ButtonVariant = "primary",
  description?: string,
): HTMLButtonElement {
  return addChromeButton(scene, {
    x, y, width, height, label, description, variant, onSelect: action,
  });
}

import Phaser from "phaser";

import { getThemeColour, type ButtonVariant } from "../theme/theme";
import { addChromeButton } from "./chromeOverlay";
import { CHROME_BUTTON } from "./design";

export function announce(message: string): void {
  const status = document.querySelector<HTMLElement>("#game-status");
  if (status) status.textContent = message;
}

/**
 * Place focus deliberately when a screen takes over.
 *
 * A scene transition destroys the controls of the screen it replaces, and the
 * browser responds by dropping focus to the document body. A keyboard or screen
 * reader player is then silently returned to the top of the page on every
 * transition, having to tab back in to find where they are. Moving focus onto
 * the new screen keeps their place and gets the new context announced.
 *
 * Deferred by one frame because Phaser is still laying the scene out when the
 * create step runs, and focusing an element that is about to move produces a
 * visible jump.
 */
export function focusOnEntry(element: HTMLElement | null | undefined): void {
  if (!element) return;
  requestAnimationFrame(() => {
    if (element.isConnected) element.focus();
  });
}

/**
 * Hand focus to the game surface itself.
 *
 * During play there is no chrome control that should hold focus: the player
 * answers the rhythm with Space and the arrow keys, and a focused button would
 * swallow Space as an activation. The application container takes it instead,
 * so focus is somewhere deliberate and inside the game.
 */
export function focusGameSurface(): void {
  focusOnEntry(document.querySelector<HTMLElement>("#game"));
}

/**
 * True when the focused interface control will itself act on this key.
 *
 * Scene keyboard handlers listen at the document, so they fire even while the
 * player is operating a chrome button. Without this guard one press does two
 * things: Enter on the mute control both toggles sound and advances the scene
 * behind it, which is invisible to a mouse user and thoroughly confusing to
 * anyone navigating by keyboard.
 *
 * Only activation keys are withheld. A button does nothing with an arrow key,
 * so menu movement still reaches the scene while a card holds focus — which is
 * exactly how a keyboard player moves between campaigns.
 */
export function chromeControlHandlesKey(event: KeyboardEvent): boolean {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  if (!active.matches("button, a[href], input, select, textarea")) return false;
  return event.key === "Enter" || event.key === " " || event.code === "Space";
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

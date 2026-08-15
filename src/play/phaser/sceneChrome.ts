import Phaser from "phaser";

import {
  createTextStyles,
  getButtonStyle,
  getThemeColour,
  type ButtonVariant,
} from "../theme/theme";
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

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  action: () => void,
  height: number = CHROME_BUTTON.height,
  variant: ButtonVariant = "primary",
): Phaser.GameObjects.Rectangle {
  const style = getButtonStyle(variant);
  const shadow = scene.add.rectangle(
    x + style.shadowOffset,
    y + style.shadowOffset,
    width,
    height,
    hexToColour(style.shadow),
  ).setDepth(CHROME_BUTTON.backgroundDepth - 1);
  const background = scene.add.rectangle(
    x,
    y,
    width,
    height,
    hexToColour(style.fill),
  ).setStrokeStyle(style.borderWidth, hexToColour(style.border))
    .setInteractive({ useHandCursor: true })
    .setDepth(CHROME_BUTTON.backgroundDepth);
  const text = scene.add.text(x, y, label, {
    ...createTextStyles().notice,
    color: style.label,
    fontSize: `${CHROME_BUTTON.labelSizePx}px`,
  }).setOrigin(0.5).setDepth(CHROME_BUTTON.labelDepth);

  // Mirror the site's lift-on-hover and press-on-active affordance.
  const place = (offset: number, shadowOffset: number) => {
    background.setPosition(x + offset, y + offset);
    text.setPosition(x + offset, y + offset);
    shadow.setPosition(x + shadowOffset, y + shadowOffset);
  };
  background.on("pointerover", () => place(-style.hoverLift, style.hoverShadowOffset));
  background.on("pointerout", () => place(0, style.shadowOffset));
  background.on("pointerdown", () => {
    place(style.activePress, style.activeShadowOffset);
    action();
  });
  background.on("pointerup", () => place(-style.hoverLift, style.hoverShadowOffset));
  return background;
}

import Phaser from "phaser";

import { createTextStyles, getThemeColour } from "../theme/theme";

export function announce(message: string): void {
  const status = document.querySelector<HTMLElement>("#game-status");
  if (status) status.textContent = message;
}

export function toColour(
  role: Parameters<typeof getThemeColour>[0],
): number {
  return Phaser.Display.Color.HexStringToColor(getThemeColour(role)).color;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  action: () => void,
): Phaser.GameObjects.Rectangle {
  const background = scene.add.rectangle(
    x,
    y,
    width,
    78,
    toColour("paperWhite"),
  ).setStrokeStyle(4, toColour("resistanceRed"))
    .setInteractive({ useHandCursor: true })
    .setDepth(30);
  scene.add.text(x, y, label, {
    ...createTextStyles().notice,
    fontSize: "16px",
  }).setOrigin(0.5).setDepth(31);
  background.on("pointerover", () =>
    background.setFillStyle(toColour("managementGold")));
  background.on("pointerout", () =>
    background.setFillStyle(toColour("paperWhite")));
  background.on("pointerdown", action);
  return background;
}

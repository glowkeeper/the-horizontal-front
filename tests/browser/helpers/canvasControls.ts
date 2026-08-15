import { expect, type Page } from "@playwright/test";

type CanvasTarget = {
  readonly x: number;
  readonly y: number;
};

// Only in-world controls are addressed by canvas coordinates. Interface chrome
// is real DOM and is addressed by role and name.
export const canvasTargets = {
  leftResistanceControl: { x: 0.22, y: 0.82 },
  rightResistanceControl: { x: 0.78, y: 0.82 },
} as const satisfies Record<string, CanvasTarget>;

export async function clickCanvas(
  page: Page,
  target: CanvasTarget,
): Promise<void> {
  const canvas = page.locator("#game canvas");
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  expect(bounds, "the Phaser canvas must have measurable bounds").not.toBeNull();
  if (bounds === null) return;

  await page.mouse.click(
    bounds.x + bounds.width * target.x,
    bounds.y + bounds.height * target.y,
  );
}

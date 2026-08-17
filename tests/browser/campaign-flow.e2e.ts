import { expect, test, type Page } from "@playwright/test";

import { canvasTargets, clickCanvas } from "./helpers/canvasControls";

const briefingStatus = /The Monday Uprising\. MONDAY\. DAWN\./;
const resistanceStatus = /Hold the line\. Tap when a note crosses its gate\./;
const resultStatus = /Press R or tap Try Again to retry/;
const debriefingStatus = /THE MONDAY UPRISING\..*EPISODES HELD: 0 \/ 1\./;
const openingCountInSettlingMs = 3_500;
const unsuccessfulInputCount = 80;

function gameStatus(page: Page) {
  return page.locator("#game-status");
}

// Interface chrome is real DOM, so screens are identified by their controls
// rather than by a live-region message.
function campaignCard(page: Page) {
  return page.getByRole("button", { name: /The Monday Uprising/i });
}

function beginEpisodeButton(page: Page) {
  return page.getByRole("button", { name: /Play\.\s*The Alarm/i });
}

async function waitForSceneInput(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function openEpisodeWithKeyboard(page: Page): Promise<void> {
  await page.goto("/play/");
  await expect(campaignCard(page)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(briefingStatus);
  await waitForSceneInput(page);
  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(resistanceStatus);
}

async function advanceToOutcome(page: Page): Promise<void> {
  await page.waitForTimeout(openingCountInSettlingMs);
  for (let attempt = 0; attempt < unsuccessfulInputCount; attempt += 1) {
    await page.keyboard.press("ArrowLeft");
  }
  await expect(gameStatus(page)).toHaveText(resultStatus);
}

test("opens the real game from the public site and accepts keyboard controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Hold the line" }).click();
  await expect(page).toHaveURL(/\/play\/$/);
  await expect(campaignCard(page)).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(briefingStatus);
  await waitForSceneInput(page);
  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(resistanceStatus);

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#game canvas")).toBeVisible();
});

test("navigates and operates the resistance controls with a pointer", async ({ page }) => {
  await page.goto("/play/");
  await expect(campaignCard(page)).toBeVisible();

  await campaignCard(page).click();
  await expect(gameStatus(page)).toHaveText(briefingStatus);
  await waitForSceneInput(page);
  await beginEpisodeButton(page).click();
  await expect(gameStatus(page)).toHaveText(resistanceStatus);

  await clickCanvas(page, canvasTargets.leftResistanceControl);
  await clickCanvas(page, canvasTargets.rightResistanceControl);
  await expect(page.locator("#game canvas")).toBeVisible();
});

test("restarts an episode from its outcome", async ({ page }) => {
  await openEpisodeWithKeyboard(page);

  await advanceToOutcome(page);

  await page.keyboard.press("KeyR");
  await expect(gameStatus(page)).toHaveText(resistanceStatus);
});

test("accepts an outcome into the campaign debrief", async ({ page }) => {
  await openEpisodeWithKeyboard(page);

  await advanceToOutcome(page);
  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(debriefingStatus);

  await page.keyboard.press("Escape");
  await expect(campaignCard(page)).toBeVisible();
});

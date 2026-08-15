import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Machine-checkable accessibility for every screen a player passes through.
 *
 * Two complementary checks run on each screen:
 *
 * - **axe** reports WCAG violations — contrast, accessible names, ARIA misuse,
 *   heading order — against the rendered page.
 * - **the accessibility tree** records the roles and names the browser hands to
 *   assistive technology. Canvas pixels contribute nothing to that tree, so this
 *   is what proves interface chrome is genuinely reachable rather than merely
 *   visible.
 *
 * This covers the mechanical layer only. It cannot tell you whether an
 * announcement lands at the right moment, whether the live region is swallowed,
 * or whether navigating the game coheres. Those need a person and a real screen
 * reader; see docs/technical-architecture.md.
 */

const briefingStatus = /The Monday Uprising\. MONDAY\. DAWN\./;
const resistanceStatus = /Hold the line\. Tap when a note crosses its gate\./;
const resultStatus = /Press R or tap Try Again to retry/;
const openingCountInSettlingMs = 3_500;
const unsuccessfulInputCount = 80;

function gameStatus(page: Page) {
  return page.locator("#game-status");
}

function campaignCard(page: Page) {
  return page.getByRole("button", { name: /The Monday Uprising/i });
}

async function expectNoViolations(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map((violation) =>
    `${violation.impact ?? "unknown"}: ${violation.id} — ${violation.help} (${
      violation.nodes.map((node) => node.target.join(" ")).join(", ")
    })`);
  expect(summary, `${screen} must have no WCAG violations`).toEqual([]);
}

/**
 * The controls a screen reader can actually reach, taken from the browser's
 * ARIA snapshot rather than from the DOM.
 *
 * This is deliberately not a `textContent` scrape. The snapshot carries the
 * *computed accessible name*, which is what assistive technology announces, and
 * omits anything hidden from assistive technology however it is positioned.
 */
async function reachableControls(page: Page): Promise<string[]> {
  const snapshot = await page.locator("body").ariaSnapshot();
  return [...snapshot.matchAll(/^\s*-\s+(button|link)\s+"([^"]*)"/gm)]
    .map(([, role, name]) => `${role}: ${name}`);
}

test("the public landing page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expectNoViolations(page, "landing page");
});

test("every game screen exposes its chrome to assistive technology", async ({ page }) => {
  await page.goto("/play/");

  await expect(campaignCard(page)).toBeVisible();
  await expectNoViolations(page, "campaigns");
  expect(await reachableControls(page)).toEqual([
    "link: Return to the Front",
    "button: THE MONDAY UPRISING. MONDAY. DAWN.",
  ]);

  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(briefingStatus);
  await expectNoViolations(page, "campaign briefing");
  expect(await reachableControls(page)).toEqual([
    "link: Return to the Front",
    "button: PLAY. The Alarm",
  ]);

  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(resistanceStatus);
  await expectNoViolations(page, "confrontation");
  expect(
    await reachableControls(page),
    "the confrontation must not expose chrome while the player is resisting",
  ).toEqual(["link: Return to the Front"]);

  await page.waitForTimeout(openingCountInSettlingMs);
  for (let attempt = 0; attempt < unsuccessfulInputCount; attempt += 1) {
    await page.keyboard.press("ArrowLeft");
  }
  await expect(gameStatus(page)).toHaveText(resultStatus);
  await expectNoViolations(page, "episode outcome");
  expect(await reachableControls(page)).toEqual([
    "link: Return to the Front",
    "button: TRY AGAIN",
    "button: ACCEPT OUTCOME",
  ]);
});

test("chrome controls are operable by keyboard alone", async ({ page }) => {
  await page.goto("/play/");
  await expect(campaignCard(page)).toBeVisible();

  // Focus is not taken on arrival, so a player who clicked in from the site
  // sees no focus ring; Enter still opens the selected campaign.
  await expect(campaignCard(page)).not.toBeFocused();
  await page.keyboard.press("Enter");
  await expect(gameStatus(page)).toHaveText(briefingStatus);

  // Space activates a focused control, exactly as a native button should.
  const begin = page.getByRole("button", { name: /Play\.\s*The Alarm/i });
  await begin.focus();
  await expect(begin).toBeFocused();
  await page.keyboard.press("Space");
  await expect(gameStatus(page)).toHaveText(resistanceStatus);
});

test("chrome controls track the canvas when the viewport changes", async ({ page }) => {
  await page.goto("/play/");
  await expect(campaignCard(page)).toBeVisible();

  const designCentre = async () => page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const control = document.querySelector(".game-action");
    if (!canvas || !control) return null;
    const canvasBounds = canvas.getBoundingClientRect();
    const controlBounds = control.getBoundingClientRect();
    const scale = canvasBounds.width / 1280;
    return {
      x: Math.round((controlBounds.left + controlBounds.width / 2 - canvasBounds.left) / scale),
      y: Math.round((controlBounds.top + controlBounds.height / 2 - canvasBounds.top) / scale),
    };
  });

  const reference = await designCentre();
  expect(reference).not.toBeNull();
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 820, height: 1180 },
    { width: 1600, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(designCentre, {
        message: `control must hold its design position at ${viewport.width}x${viewport.height}`,
      })
      .toEqual(reference);
  }
});

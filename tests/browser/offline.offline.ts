import { expect, test } from "@playwright/test";

/**
 * Offline play is a charter commitment and a promise on the landing page, so it
 * is verified rather than assumed.
 *
 * The test takes the origin away instead of emulating a network condition,
 * because emulation and a genuinely unreachable server do not always behave the
 * same way, and the second is what a player on a train actually experiences.
 */
test("plays with the origin gone", async ({ page, context, baseURL }) => {
  await page.goto("/play/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The app shell is precached on install; give it time to finish before the
  // origin disappears.
  await page.waitForTimeout(6_000);

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const entries = await (await caches.open(names[0])).keys();
    return entries.length;
  });
  expect(cached, "the app shell must be precached").toBeGreaterThan(20);

  // Route every request to failure: the origin is now unreachable, and only
  // the service worker's cache can answer.
  await context.route("**/*", (route) => route.abort());

  await page.goto(`${baseURL}/play/`, { waitUntil: "domcontentloaded" });

  // The canvas is the real test. Pages served from cache while the game's own
  // JavaScript fails would look offline-capable while being unplayable, which
  // is precisely how this broke before: cache matching honours a cached
  // response's Vary header, and static hosts attach one.
  await expect(page.locator("#game canvas")).toBeVisible();

  const campaign = page.getByRole("button", { name: /The Monday Uprising/i });
  await expect(campaign).toBeVisible();
  await campaign.click();
  await expect(page.locator("#game-status"))
    .toHaveText(/The Monday Uprising\. MONDAY\. DAWN\./);

  await page.getByRole("button", { name: /Play\.\s*The Alarm/i }).click();
  await expect(page.locator("#game-status"))
    .toHaveText(/Hold the line\. Tap when a note crosses its gate\./);
});

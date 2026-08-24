import { type APIRequestContext, expect, test } from "@playwright/test";

/**
 * The precache list the build actually emitted, read from the served worker.
 *
 * Asserting a bare number here would be a second copy of something the build
 * already decides, and one that goes stale silently: the previous "more than
 * twenty entries" passed no matter which twenty, and would have kept passing
 * with half the app shell missing.
 *
 * It is fetched over HTTP rather than read off disk so the expectation comes
 * from what the preview server actually serves, which is what the browser
 * under test will install.
 */
async function precachedUrls(
  request: APIRequestContext,
  baseURL: string,
): Promise<string[]> {
  const response = await request.get(`${baseURL}/sw.js`);
  expect(response.ok(), "the built service worker must be served").toBe(true);

  const declaration = /const APP_SHELL = (\[[\s\S]*?\]);/
    .exec(await response.text());
  if (declaration === null) {
    throw new Error(
      "The served sw.js does not declare APP_SHELL. This suite reads the "
        + "precache list from the built service worker; if the build changed "
        + "shape, update this helper rather than asserting a fixed count.",
    );
  }
  return JSON.parse(declaration[1]) as string[];
}

/**
 * Offline play is a charter commitment and a promise on the landing page, so it
 * is verified rather than assumed.
 *
 * The test takes the origin away instead of emulating a network condition,
 * because emulation and a genuinely unreachable server do not always behave the
 * same way, and the second is what a player on a train actually experiences.
 */
test("plays with the origin gone", async ({ page, context, request, baseURL }) => {
  const expected = await precachedUrls(request, baseURL ?? "");

  await page.goto("/play/");
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Wait for the install to finish populating the cache by asking whether it
  // has, rather than by sleeping long enough that it probably has. Every URL
  // the build precached must be present before the origin disappears.
  await expect
    .poll(
      async () => page.evaluate(async (urls) => {
        const names = await caches.keys();
        if (names.length === 0) return -1;
        const cache = await caches.open(names[0]);
        const matches = await Promise.all(
          urls.map(async (url) => Boolean(await cache.match(url))),
        );
        return matches.filter(Boolean).length;
      }, expected),
      {
        message: `the service worker must precache all ${expected.length} app-shell URLs`,
        timeout: 30_000,
      },
    )
    .toBe(expected.length);

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

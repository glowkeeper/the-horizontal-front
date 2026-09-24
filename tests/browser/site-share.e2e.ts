import { expect, test, type Page } from "@playwright/test";

import { documentShellPages } from "../../scripts/site-pages.mjs";

/**
 * The share controls as a reader meets them: generated into the page chrome,
 * wired by the site entry, and reporting through one live region.
 *
 * The unit tests cover the share-or-copy decision. These cover what they
 * cannot: that the generated controls are found, carry the canonical link,
 * are both disabled while a share is in flight, and announce the outcome.
 *
 * The browser's share sheet and clipboard are replaced before the page loads,
 * so each path can be driven deterministically and the copy can be held open
 * long enough to observe the in-flight state.
 */

const shareLabel = "Share The Horizontal Front";

type ShareStub = "none" | "cancel";

/**
 * The link the controls should share: the home page's canonical URL. Both are
 * written by the page generator from package.json's homepage, so comparing
 * them proves the controls share the canonical home rather than restating it.
 */
async function canonicalHome(page: Page): Promise<string> {
  await page.goto("/");
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(href, "the home page must declare its canonical URL").not.toBeNull();
  return href!;
}

interface ShareRecord {
  shared: ShareData[];
  copied: string[];
}

async function stubShareServices(page: Page, share: ShareStub): Promise<void> {
  await page.addInitScript((mode: ShareStub) => {
    const record = { shared: [] as ShareData[], copied: [] as string[] };
    let releaseCopy: () => void = () => undefined;

    Object.assign(window, {
      __shareRecord: record,
      __releaseCopy: () => releaseCopy(),
    });

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: mode === "none"
        ? undefined
        : async (data: ShareData) => {
          record.shared.push(data);
          throw new DOMException("Dismissed", "AbortError");
        },
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => new Promise<void>((resolve) => {
          record.copied.push(text);
          releaseCopy = resolve;
        }),
      },
    });
  }, share);
}

function shareRecord(page: Page): Promise<ShareRecord> {
  return page.evaluate(() => (window as unknown as { __shareRecord: ShareRecord }).__shareRecord);
}

test("every page carrying the site chrome offers both share controls", async ({ page }) => {
  const siteUrl = await canonicalHome(page);
  for (const { route } of documentShellPages) {
    await page.goto(route);
    const header = page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: shareLabel });
    const footer = page.getByRole("navigation", { name: "Project information" })
      .getByRole("button", { name: shareLabel });

    await expect(header, `${route} must offer a header share control`).toBeVisible();
    await expect(footer, `${route} must offer a footer share control`).toBeVisible();
    await expect(header).toHaveAttribute("data-share-url", siteUrl);
    await expect(footer).toHaveAttribute("data-share-url", siteUrl);
  }
});

test("the game screen exposes no share control", async ({ page }) => {
  await page.goto("/play/");
  await expect(page.locator("[data-share-site]")).toHaveCount(0);
});

test("without a share sheet the link is copied, and both controls wait for it", async ({ page }) => {
  const siteUrl = await canonicalHome(page);
  await stubShareServices(page, "none");
  await page.goto("/charter/");

  const controls = page.locator("[data-share-site]");
  const feedback = page.locator("[data-share-feedback]");

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: shareLabel }).click();

  // The copy is held open, so both controls must be disabled until it lands.
  await expect(controls.nth(0)).toBeDisabled();
  await expect(controls.nth(1)).toBeDisabled();
  await page.evaluate(() => (window as unknown as { __releaseCopy: () => void }).__releaseCopy());

  await expect(feedback).toHaveText("The Horizontal Front link copied.");
  await expect(controls.nth(0)).toBeEnabled();
  await expect(controls.nth(1)).toBeEnabled();

  const { copied, shared } = await shareRecord(page);
  expect(shared).toEqual([]);
  expect(copied).toHaveLength(1);
  expect(copied[0]).toMatch(/^The Horizontal Front\n.+\n/);
  expect(copied[0].endsWith(`\n${siteUrl}`)).toBe(true);
});

test("dismissing the share sheet copies nothing and announces nothing", async ({ page }) => {
  const siteUrl = await canonicalHome(page);
  await stubShareServices(page, "cancel");
  await page.goto("/");

  await page.getByRole("navigation", { name: "Project information" })
    .getByRole("button", { name: shareLabel }).click();

  const controls = page.locator("[data-share-site]");
  await expect(controls.nth(1)).toBeEnabled();

  const { copied, shared } = await shareRecord(page);
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatchObject({ title: "The Horizontal Front", url: siteUrl });
  expect(copied).toEqual([]);
  await expect(page.locator("[data-share-feedback]")).toHaveText("");
});

test("the header share icon is large enough to tap", async ({ page }) => {
  // WCAG 2.2 success criterion 2.5.8 sets a 24 by 24 CSS pixel minimum. The
  // icon is drawn smaller than that, so the button carries the target size.
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const box = await page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: shareLabel }).boundingBox();
    expect(box, `the share icon must render at ${width}px`).not.toBeNull();
    expect(box!.width, `share icon width at ${width}px`).toBeGreaterThanOrEqual(24);
    expect(box!.height, `share icon height at ${width}px`).toBeGreaterThanOrEqual(24);
  }
});

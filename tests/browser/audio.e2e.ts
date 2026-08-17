import { expect, test, type Page } from "@playwright/test";

const briefingStatus = /The Monday Uprising\. MONDAY\. DAWN\./;
const resistanceStatus = /Hold the line\. Tap when a note crosses its gate\./;

function audioToggle(page: Page) {
  return page.getByRole("button", { name: /Mute sound|Unmute sound/ });
}

function campaignCard(page: Page) {
  return page.getByRole("button", { name: /The Monday Uprising/i });
}

/**
 * Counts audio nodes the page actually creates, by wrapping the constructor
 * before any application code runs. Asserting on real synthesis rather than on
 * our own state is the only way to know muted play is genuinely silent.
 */
async function instrumentAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counters = { oscillators: 0, buffers: 0, contexts: 0, sustained: 0 };
    (window as unknown as { __audio: typeof counters }).__audio = counters;

    /**
     * A one-shot schedules its own stop the moment it starts, so anything left
     * without a stop time is sustained — which in practice means the ambience
     * bed. Counting those is how we can tell whether the room is still humming.
     */
    const track = <T extends AudioScheduledSourceNode>(node: T): T => {
      counters.sustained += 1;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        counters.sustained -= 1;
      };
      const originalStop = node.stop.bind(node);
      node.stop = (when?: number) => {
        release();
        return originalStop(when);
      };
      node.addEventListener("ended", release);
      return node;
    };

    const Original = window.AudioContext;
    class CountingContext extends Original {
      public constructor() {
        super();
        counters.contexts += 1;
      }

      public createOscillator(): OscillatorNode {
        counters.oscillators += 1;
        return track(super.createOscillator());
      }

      public createBufferSource(): AudioBufferSourceNode {
        counters.buffers += 1;
        return track(super.createBufferSource());
      }
    }
    window.AudioContext = CountingContext as unknown as typeof AudioContext;
  });
}

const readCounters = (page: Page) => page.evaluate(
  () => (window as unknown as {
    __audio: {
      oscillators: number; buffers: number; contexts: number; sustained: number;
    };
  }).__audio,
);

async function openEpisode(page: Page): Promise<void> {
  await expect(campaignCard(page)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#game-status")).toHaveText(briefingStatus);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  await page.keyboard.press("Enter");
  await expect(page.locator("#game-status")).toHaveText(resistanceStatus);
}

test("the confrontation synthesises its score from the compiled rhythm", async ({ page }) => {
  await instrumentAudio(page);
  await page.goto("/play/");
  await openEpisode(page);
  await page.waitForTimeout(4_000);

  const counters = await readCounters(page);
  expect(counters.contexts).toBe(1);
  // Every cue in the office palette layers pitched material over filtered
  // noise, so both node kinds must appear if the score is really sounding.
  expect(counters.oscillators).toBeGreaterThan(0);
  expect(counters.buffers).toBeGreaterThan(0);
});

test("muted play is genuinely silent and mechanically unchanged", async ({ page }) => {
  await instrumentAudio(page);
  await page.goto("/play/");
  await expect(audioToggle(page)).toHaveAttribute("aria-pressed", "false");

  await audioToggle(page).click();
  await expect(audioToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(audioToggle(page)).toHaveText(/Unmute sound/);

  // Enter would now go to the control the player is actually on, so the
  // campaign is opened the way someone who just pressed mute would open it.
  await campaignCard(page).click();
  await expect(page.locator("#game-status")).toHaveText(briefingStatus);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  await page.keyboard.press("Enter");
  await expect(page.locator("#game-status")).toHaveText(resistanceStatus);
  await page.waitForTimeout(4_000);

  const counters = await readCounters(page);
  expect(counters.oscillators).toBe(0);
  expect(counters.buffers).toBe(0);
  // The rhythm still runs: muting changes what the player hears, never the game.
  await expect(page.locator("#game canvas")).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText(resistanceStatus);
});

test("the mute preference survives a reload", async ({ page }) => {
  await page.goto("/play/");
  await audioToggle(page).click();
  await expect(audioToggle(page)).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(audioToggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(audioToggle(page)).toHaveText(/Unmute sound/);

  await audioToggle(page).click();
  await page.reload();
  await expect(audioToggle(page)).toHaveAttribute("aria-pressed", "false");
});

test("the room goes quiet when the confrontation resolves", async ({ page }) => {
  await instrumentAudio(page);
  await page.goto("/play/");
  await openEpisode(page);
  await page.waitForTimeout(1_500);

  // The ambience bed is sustained: started, with no stop scheduled.
  expect((await readCounters(page)).sustained).toBeGreaterThan(0);

  await page.waitForTimeout(3_500);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await page.keyboard.press("ArrowLeft");
  }
  await expect(page.locator("#game-status")).toHaveText(/Press R or tap Try Again to retry/);
  await page.waitForTimeout(500);

  // The outcome screen and debrief must not inherit the pressure of the
  // confrontation: the hum stops even though the scene lives on.
  expect((await readCounters(page)).sustained).toBe(0);
});

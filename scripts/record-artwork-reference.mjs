/**
 * Records a reference clip of one episode escalating to its failure outcome.
 *
 * Three of the constraints an artist works to are purely about motion: the
 * resistance states rotating about a fixed pivot, the opposing actor ratcheting
 * through poses that hold, and the incursion sliding in from the side. A written
 * brief can only describe those. This plays the episode badly on purpose, so a
 * single clip shows every state in the order the danger reaches them.
 *
 * The clip is a build artefact and is deliberately not committed: it is
 * regenerated from whatever the game currently does.
 */
import { spawn } from "node:child_process";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, ".artifacts/artwork-reference");
const origin = "http://127.0.0.1:4321";
const viewport = { width: 1280, height: 720 };

const settlingMs = 3_500;
const inputIntervalMs = 250;
const maximumInputs = 80;

function startServer() {
  const server = spawn(
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", "4321", "--strictPort"],
    { cwd: projectRoot, stdio: "ignore" },
  );
  return server;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${origin}/play/`);
      if (response.ok) return;
    } catch {
      // The dev server is still starting.
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Development server did not answer on ${origin}`);
}

async function toMp4(webm) {
  const mp4 = webm.replace(/\.webm$/, ".mp4");
  await new Promise((done, fail) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y", "-i", webm,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
      "-movflags", "+faststart",
      mp4,
    ], { stdio: "ignore" });
    ffmpeg.on("exit", (code) => (code === 0 ? done() : fail(new Error(`ffmpeg exited ${code}`))));
    ffmpeg.on("error", fail);
  });
  return mp4;
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const server = startServer();
let browser;

try {
  await waitForServer();

  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: outputRoot, size: viewport },
  });
  const page = await context.newPage();
  const status = page.locator("#game-status");

  await page.goto(`${origin}/play/`);
  await page.getByRole("button", { name: /The Monday Uprising/i }).waitFor();
  await page.keyboard.press("Enter");
  await status.filter({ hasText: /MONDAY\. DAWN\./ }).waitFor();

  // Two frames, so the briefing scene has bound its input before it is dismissed.
  await page.evaluate(() => new Promise((done) => {
    requestAnimationFrame(() => requestAnimationFrame(done));
  }));
  await page.keyboard.press("Enter");
  await status.filter({ hasText: /Hold the line\./ }).waitFor();

  await page.waitForTimeout(settlingMs);

  // Mistimed input rather than a burst: the danger has to climb slowly enough
  // that each pose and each resistance state is legible on the way past.
  const outcome = status.filter({ hasText: /Press R or tap Try Again to retry/ });
  for (let input = 0; input < maximumInputs; input += 1) {
    if (await outcome.count() > 0) break;
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(inputIntervalMs);
  }
  await outcome.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2_500);

  await context.close();

  const [recorded] = (await readdir(outputRoot)).filter((file) => file.endsWith(".webm"));
  if (!recorded) throw new Error("Playwright wrote no video");

  const webm = join(outputRoot, "the-alarm-escalation.webm");
  await rename(join(outputRoot, recorded), webm);
  const mp4 = await toMp4(webm);

  console.log("Reference clip:");
  console.log(`  ${webm.slice(projectRoot.length + 1)}`);
  console.log(`  ${mp4.slice(projectRoot.length + 1)}`);
} finally {
  await browser?.close();
  server.kill();
}

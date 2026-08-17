import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

// Web-sized derivations of catalogued artwork, for the public site.
//
// The originals are authored for the game canvas and run to several megabytes
// each. A landing page carrying one of those would be slow to arrive and would
// be written into every visitor's offline cache, which matters more here than
// usual: the release is meant to keep working after it is cached.
//
// These are mechanical derivations, not new artwork. The source stays the
// single catalogued original; re-run this after changing it:
// `node scripts/generate-site-images.mjs`.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public", "assets");

const derivations = [
  {
    source: join(
      root, "src/play/content/presentation/assets/campaigns",
      "the-monday-uprising/briefing.png",
    ),
    file: "briefing.webp",
    // Twice the widest the page displays it, so it stays sharp on a dense
    // screen without carrying the full authored resolution.
    width: 1200,
    quality: 0.82,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { source, file, width, quality } of derivations) {
  const encoded = readFileSync(source).toString("base64");
  const dataUrl = await page.evaluate(async ({ encoded, width, quality }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round((image.naturalHeight / image.naturalWidth) * width);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d context");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", quality);
  }, { encoded, width, quality });

  const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
  writeFileSync(join(output, file), bytes);
  console.log(`${file} ${width}px ${(bytes.length / 1024).toFixed(0)}KB`);
}

await browser.close();

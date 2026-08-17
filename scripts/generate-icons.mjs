import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

// Raster application icons are derived from the authored favicon rather than
// drawn separately, so the identity cannot drift between them. Re-run after
// editing favicon.svg: `node scripts/generate-icons.mjs`.

const assets = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "assets");
const source = readFileSync(join(assets, "favicon.svg"), "utf8");

// The field colour, used as the maskable backdrop. Because it matches the
// artwork's own rounded field exactly, the corners disappear into it and the
// icon becomes full-bleed — which is what Android needs before applying its
// own mask.
const FIELD = "#ffffff";

// Android masks a maskable icon down to a safe circle 80% of the width. The
// artwork is inset so nothing important can be clipped by that mask.
const SAFE_ZONE_SCALE = 0.9;

const icons = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
];

/*
 * A fieldless version of the same drawing, for placing the mark on the site's
 * own background — in a footer the rounded white field reads as a sticker stuck
 * over the page rather than as the project's mark.
 *
 * Derived by dropping the field rectangle, so the hand itself is never drawn
 * twice and cannot drift from the icon.
 */
const fieldRectangle = /\n\s*<rect width="64" height="64"[^>]*\/>/;
if (!fieldRectangle.test(source)) {
  throw new Error("favicon.svg must open with its full-bleed field rectangle");
}
writeFileSync(
  join(assets, "mark.svg"),
  source.replace(fieldRectangle, "").replace(
    'aria-label="The Horizontal Front raised fist"',
    'aria-hidden="true"',
  ),
);
console.log("mark.svg (no field)");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

for (const { file, size, maskable } of icons) {
  const drawn = maskable ? Math.round(size * SAFE_ZONE_SCALE) : size;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>
      html, body { margin: 0; width: ${size}px; height: ${size}px; }
      body {
        ${maskable ? `background: ${FIELD};` : ""}
        display: flex; align-items: center; justify-content: center;
      }
      svg { width: ${drawn}px; height: ${drawn}px; display: block; }
    </style>${source}`);
  await page.screenshot({ path: join(assets, file), omitBackground: !maskable });
  console.log(`${file} ${size}x${size}${maskable ? " (maskable)" : ""}`);
}

await browser.close();

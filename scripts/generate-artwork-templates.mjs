/**
 * Generates registration guide sheets for an artist redrawing multi-state
 * artwork.
 *
 * Every measurement is derived from validated presentation content and from the
 * shipped assets themselves, never written here by hand. A pivot copied into a
 * second place is a pivot that can disagree with the skin; regenerating from the
 * skin means the guides are wrong only if the game is wrong too.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const presentationRoot = join(projectRoot, "src/play/content/presentation");
const outputRoot = join(projectRoot, "docs/art/commissions/templates");

/** Reads a PNG's intrinsic size from its IHDR chunk. */
async function readPngSize(file) {
  const header = (await readFile(file)).subarray(0, 24);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function findSkin() {
  const skinRoot = join(presentationRoot, "skins/episodes");
  const [episode] = await readdir(skinRoot);
  const [file] = await readdir(join(skinRoot, episode));
  return readJson(join(skinRoot, episode, file));
}

const skin = await findSkin();
const layout = await readJson(join(presentationRoot, "layouts/episode-confrontation.json"));
const catalogue = await readJson(join(presentationRoot, "asset-catalog.json"));

const assetFile = (id) => {
  const asset = catalogue.assets.find((entry) => entry.id === id);
  if (!asset) throw new Error(`Asset ${id} is not catalogued`);
  return join(presentationRoot, "assets", asset.file);
};

const guideStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; }
  .sheet { position: relative; overflow: hidden; }
  svg { position: absolute; inset: 0; }
  text { font: 500 15px "Helvetica Neue", Arial, sans-serif; fill: #b8322a; }
  text.muted { fill: #3e6f8f; }
`;

async function renderSheet(browser, { name, width, height, body }) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.setContent(
      `<style>${guideStyles}</style>`
      + `<div class="sheet" style="width:${width}px;height:${height}px">${body}</div>`,
    );
    await page.screenshot({
      path: join(outputRoot, `${name}.png`),
      omitBackground: true,
      clip: { x: 0, y: 0, width, height },
    });
    console.log(`  ${name}.png  ${width} × ${height}`);
  } finally {
    await page.close();
  }
}

/**
 * The resistance states rotate about one authored pivot. The engine holds a
 * single continuous angle and compensates for how far each drawing is already
 * turned, so the guide shows both the fixed point and the tilt each state is
 * expected to arrive already carrying.
 */
function resistanceSheet(resistance, size) {
  const pivotX = (resistance.originX ?? 0.5) * size.width;
  const pivotY = (resistance.originY ?? 0.5) * size.height;
  const reach = Math.max(size.width, size.height);

  const spoke = (degrees, colour, dash) => {
    const radians = (degrees * Math.PI) / 180;
    return `<line x1="${pivotX}" y1="${pivotY}"`
      + ` x2="${pivotX + Math.cos(radians) * reach}"`
      + ` y2="${pivotY + Math.sin(radians) * reach}"`
      + ` stroke="${colour}" stroke-width="2" stroke-dasharray="${dash}" opacity="0.75" />`;
  };

  // Label each spoke where it leaves the sheet rather than at the pivot, so the
  // four tilts stay legible instead of stacking on top of one another.
  const labelAtEdge = (degrees, text, className) => {
    const radians = (degrees * Math.PI) / 180;
    const edgeX = size.width - 34;
    const along = (edgeX - pivotX) / Math.cos(radians);
    const edgeY = pivotY + Math.sin(radians) * along;
    return `<text class="${className}" text-anchor="end" x="${edgeX}" y="${edgeY - 10}">${text}</text>`;
  };

  const states = resistance.states
    .map((state, index) =>
      spoke(state.drawnAngleDegrees, "#c8952e", "10 6")
      + labelAtEdge(
        state.drawnAngleDegrees,
        `state ${index + 1} — drawn at ${state.drawnAngleDegrees}°`,
        "muted",
      ))
    .join("");

  return `<svg viewBox="0 0 ${size.width} ${size.height}">
    <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}"
      fill="none" stroke="#201c19" stroke-width="2" stroke-dasharray="14 8" opacity="0.5" />
    ${spoke(resistance.dangerAngleDegrees, "#b8322a", "0")}
    ${states}
    <line x1="0" y1="${pivotY}" x2="${size.width}" y2="${pivotY}" stroke="#b8322a" stroke-width="1" opacity="0.5" />
    <line x1="${pivotX}" y1="0" x2="${pivotX}" y2="${size.height}" stroke="#b8322a" stroke-width="1" opacity="0.5" />
    <circle cx="${pivotX}" cy="${pivotY}" r="14" fill="none" stroke="#b8322a" stroke-width="3" />
    <circle cx="${pivotX}" cy="${pivotY}" r="3" fill="#b8322a" />
    <text x="${pivotX + 26}" y="${pivotY + 30}">PIVOT (${Math.round(pivotX)}, ${Math.round(pivotY)}) — planted foot</text>
    <text x="${pivotX + 26}" y="${pivotY + 52}">identical on every state</text>
    <text class="muted" x="20" y="34">${size.width} × ${size.height} — transparent, no room behind</text>
    ${labelAtEdge(resistance.dangerAngleDegrees, `full lift ${resistance.dangerAngleDegrees}°`, "")}
  </svg>`;
}

/**
 * The opposing actor is drawn at twice its on-screen size and is clipped by the
 * right edge of the design space, so the guide marks the band that no player
 * ever sees and the floor the figure stands on.
 */
function opposingActorSheet(skinContent, layoutContent, size) {
  const [part] = skinContent.confrontation.opposingActor.parts;
  const anchor = layoutContent.anchors.opposingActor;
  const design = layoutContent.designSize;
  const scale = size.width / part.width;

  const centreX = anchor.x + part.x;
  const centreY = anchor.y + part.y;
  const rightEdge = centreX + part.width / 2;
  const clippedDesign = Math.max(0, rightEdge - design.width);
  const clipped = clippedDesign * scale;

  const floorTop = layoutContent.backdrop.floor.y - layoutContent.backdrop.floor.height / 2;
  const floorInSheet = (floorTop - (centreY - part.height / 2)) * scale;

  const clipBand = clipped > 0
    ? `<rect x="${size.width - clipped}" y="0" width="${clipped}" height="${size.height}"
         fill="#b8322a" opacity="0.16" />
       <text x="${size.width - clipped - 250}" y="${size.height - 60}">off-screen: ${Math.round(clipped)}px</text>`
    : "";

  return `<svg viewBox="0 0 ${size.width} ${size.height}">
    <rect x="1" y="1" width="${size.width - 2}" height="${size.height - 2}"
      fill="none" stroke="#201c19" stroke-width="2" stroke-dasharray="14 8" opacity="0.5" />
    ${clipBand}
    <line x1="0" y1="${floorInSheet}" x2="${size.width}" y2="${floorInSheet}"
      stroke="#3e6f8f" stroke-width="2" stroke-dasharray="10 6" />
    <text class="muted" x="20" y="${floorInSheet - 12}">floor line — ground contact sits here</text>
    <text class="muted" x="20" y="34">${size.width} × ${size.height} — transparent, drawn at ${scale}× on-screen size</text>
    <text x="20" y="${size.height - 26}">the console must not move between poses</text>
  </svg>`;
}

const resistance = skin.confrontation.resistance;
const resistanceSize = await readPngSize(assetFile(resistance.states[0].asset.id));
const actorSize = await readPngSize(
  assetFile(skin.confrontation.opposingActor.states[0].assets[0].asset.id),
);

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch();

console.log("Registration guides:");
await renderSheet(browser, {
  name: "resistance-registration",
  ...resistanceSize,
  body: resistanceSheet(resistance, resistanceSize),
});
await renderSheet(browser, {
  name: "opposing-actor-registration",
  ...actorSize,
  body: opposingActorSheet(skin, layout, actorSize),
});

await browser.close();
console.log(`Written to ${outputRoot.slice(projectRoot.length + 1)}`);

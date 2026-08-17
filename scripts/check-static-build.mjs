import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const gameContent = JSON.parse(await readFile(
  join(projectRoot, "src/play/content/game.json"),
  "utf8",
));

const requiredPages = [
  "index.html",
  "play/index.html",
  "commons/index.html",
  "charter/index.html",
  "governance/index.html",
  "identity/index.html",
  "contribute/index.html",
  "licences/index.html",
  "licences/agpl/index.html",
  "licences/cc-by-sa/index.html",
];

for (const page of requiredPages) {
  await readFile(join(outputRoot, page), "utf8");
}

const homeHtml = await readFile(join(outputRoot, "index.html"), "utf8");
const playHtml = await readFile(join(outputRoot, "play/index.html"), "utf8");
const charterHtml = await readFile(join(outputRoot, "charter/index.html"), "utf8");
const serviceWorker = await readFile(join(outputRoot, "sw.js"), "utf8");
const assetNames = await readdir(join(outputRoot, "assets"));
const phaserAsset = assetNames.find((name) => name.startsWith("play-") && name.endsWith(".js"));

if (!phaserAsset) {
  throw new Error("The isolated play bundle was not emitted.");
}
if (homeHtml.includes(phaserAsset)) {
  throw new Error("The public landing page must not load the Phaser play bundle.");
}
if (!playHtml.includes(phaserAsset)) {
  throw new Error("The play page must load the Phaser bundle.");
}
for (const value of [
  gameContent.interface.pageTitle,
  gameContent.interface.pageDescription,
  gameContent.interface.exitLabel,
  gameContent.interface.loadingStatus,
  gameContent.interface.gameAriaLabel,
]) {
  if (!playHtml.includes(value)) {
    throw new Error(`The built play shell is missing data-owned copy: ${value}`);
  }
}
if (playHtml.includes("{{GAME_")) {
  throw new Error("The built play shell contains unresolved copy placeholders.");
}
if (!charterHtml.includes("This charter is the project") || !charterHtml.includes("social contract")) {
  throw new Error("The generated charter page is out of sync with PROJECT_CHARTER.md.");
}
if (serviceWorker.includes("__BUILD_VERSION__") || serviceWorker.includes("__PRECACHE_ASSETS__")) {
  throw new Error("The service worker was not finalized with the build assets.");
}
if (!serviceWorker.includes(`/assets/${phaserAsset}`)) {
  throw new Error("The offline cache does not include the Phaser play bundle.");
}
for (const page of requiredPages) {
  if (!serviceWorker.includes(`/${page}`)) {
    throw new Error(`The offline cache does not include /${page}.`);
  }
}
for (const route of ["/", "/play/", "/commons/", "/charter/", "/governance/", "/identity/", "/contribute/", "/licences/"]) {
  if (!serviceWorker.includes(`"${route}"`)) {
    throw new Error(`The offline cache does not include the clean route ${route}.`);
  }
}

console.log("Static multi-page and offline-build checks passed.");

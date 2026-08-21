import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const gameContent = JSON.parse(await readFile(
  join(projectRoot, "src/play/content/game.json"),
  "utf8",
));

const { homepage } = JSON.parse(await readFile(
  join(projectRoot, "package.json"),
  "utf8",
));
const siteOrigin = homepage.replace(/\/$/, "");

const requiredPages = [
  "index.html",
  "play/index.html",
  "commons/index.html",
  "sound/index.html",
  "charter/index.html",
  "governance/index.html",
  "identity/index.html",
  "contribute/index.html",
  "licences/index.html",
  "licences/agpl/index.html",
  "licences/cc-by-sa/index.html",
];

function routeFor(page) {
  return page === "index.html"
    ? "/"
    : `/${page.slice(0, -"index.html".length)}`;
}

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
  throw new Error("The service worker was not finalised with the build assets.");
}
if (!serviceWorker.includes(`/assets/${phaserAsset}`)) {
  throw new Error("The offline cache does not include the Phaser play bundle.");
}
for (const page of requiredPages) {
  if (!serviceWorker.includes(`/${page}`)) {
    throw new Error(`The offline cache does not include /${page}.`);
  }
}
for (const route of ["/", "/play/", "/commons/", "/sound/", "/charter/", "/governance/", "/identity/", "/contribute/", "/licences/"]) {
  if (!serviceWorker.includes(`"${route}"`)) {
    throw new Error(`The offline cache does not include the clean route ${route}.`);
  }
}

/*
 * Crawler-facing files.
 *
 * These are checked in the build rather than trusted to the host because their
 * absence is invisible: the public host answers a missing path with the home
 * page and a 200, so a deleted robots.txt does not fail, it silently starts
 * serving HTML to clients that asked for a text file. Automated readers report
 * that as a site that has refused them.
 */
const robots = await readFile(join(outputRoot, "robots.txt"), "utf8");
const sitemap = await readFile(join(outputRoot, "sitemap.xml"), "utf8");

for (const directive of ["User-agent: *", "Allow: /"]) {
  if (!robots.includes(directive)) {
    throw new Error(`robots.txt is missing the ${directive} directive.`);
  }
}
if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) {
  throw new Error("robots.txt does not advertise the sitemap at its public URL.");
}
if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) {
  throw new Error("robots.txt disallows the whole site.");
}

/*
 * Sitemap coverage is compared against this script's own list of required
 * pages, not against the build directory the sitemap was generated from.
 * Checking a generated file against its own source would only prove the
 * generator ran. Two independent statements of what the site contains have to
 * agree, so a page added to one and not the other fails here.
 */
const expectedLocations = requiredPages
  .map((page) => `${siteOrigin}${routeFor(page)}`)
  .sort();
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1])
  .sort();

for (const location of expectedLocations) {
  if (!sitemapLocations.includes(location)) {
    throw new Error(`The sitemap is missing the canonical route ${location}.`);
  }
}
for (const location of sitemapLocations) {
  if (!expectedLocations.includes(location)) {
    throw new Error(`The sitemap publishes ${location}, which is not a required page.`);
  }
}
if (new Set(sitemapLocations).size !== sitemapLocations.length) {
  throw new Error("The sitemap lists a canonical route more than once.");
}

for (const page of requiredPages) {
  const html = await readFile(join(outputRoot, page), "utf8");
  const declared = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)]
    .map((match) => match[1]);

  if (declared.length !== 1) {
    throw new Error(`/${page} declares ${declared.length} canonical URLs, not one.`);
  }
  if (declared[0] !== `${siteOrigin}${routeFor(page)}`) {
    throw new Error(
      `/${page} claims the canonical URL ${declared[0]} rather than its own route.`,
    );
  }
}

console.log("Static multi-page and offline-build checks passed.");
console.log(`Crawler files verified across ${requiredPages.length} canonical routes.`);

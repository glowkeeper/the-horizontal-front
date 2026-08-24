import { createHash } from "node:crypto";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { generatedPaths } from "./site-pages.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const serviceWorkerPath = join(outputRoot, "sw.js");
const sitemapPath = join(outputRoot, "sitemap.xml");

const { homepage } = JSON.parse(
  await readFile(join(projectRoot, "package.json"), "utf8"),
);
const siteOrigin = homepage.replace(/\/$/, "");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await listFiles(path) : [path]));
  }

  return files;
}

function toUrls(files) {
  return files
    .map((path) => `/${relative(outputRoot, path).split(sep).join("/")}`)
    .sort();
}

/*
 * The clean routes a reader actually visits: `/charter/` rather than
 * `/charter/index.html`. They serve two purposes here, which is why they are
 * derived once — the service worker precaches them as aliases so an offline
 * navigation to the clean URL hits the cache, and the sitemap publishes them as
 * the canonical address of each page.
 */
function canonicalRoutes(urls) {
  const routes = urls
    .filter((url) => url.endsWith("/index.html"))
    .map((url) => url.slice(0, -"index.html".length));

  if (urls.includes("/index.html")) {
    routes.push("/");
  }

  return [...new Set(routes)].sort();
}

/*
 * The sitemap is generated from the build rather than kept by hand, so a route
 * that ships appears and a route that is withdrawn disappears without anyone
 * remembering to edit a list. It is written before the precache is computed so
 * that it is cached and hashed like any other built file.
 *
 * No `lastmod` is emitted. The precache version is a hash of every file in the
 * build, so a timestamp that changed on each build would invalidate every
 * reader's offline cache to announce that nothing had changed.
 */
const routes = canonicalRoutes(toUrls(await listFiles(outputRoot)));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${siteOrigin}${route}</loc></url>`).join("\n")}
</urlset>
`;

await writeFile(sitemapPath, sitemap);

const allFiles = await listFiles(outputRoot);
const precacheFiles = allFiles.filter((path) => path !== serviceWorkerPath);
const precacheUrls = toUrls(precacheFiles);
const completePrecacheUrls = [
  ...new Set([...precacheUrls, ...canonicalRoutes(precacheUrls)]),
].sort();

const contentHash = createHash("sha256");
for (const path of precacheFiles.sort()) {
  contentHash.update(await readFile(path));
}
const version = contentHash.digest("hex").slice(0, 12);

const originalServiceWorker = await readFile(serviceWorkerPath, "utf8");
const finalServiceWorker = originalServiceWorker
  .replace('"__BUILD_VERSION__"', JSON.stringify(version))
  .replace('"__PRECACHE_ASSETS__"', JSON.stringify(completePrecacheUrls));

if (finalServiceWorker === originalServiceWorker) {
  throw new Error("Service-worker build placeholders were not found.");
}

await writeFile(serviceWorkerPath, finalServiceWorker);

// Derived from the page list. As a hand-maintained list this omitted
// `roadmap`, so that page's generated tree was left behind in the working
// tree after every build while every other one was cleaned.
for (const generatedEntry of generatedPaths) {
  await rm(join(projectRoot, generatedEntry.replaceAll("/", "")), {
    recursive: true,
    force: true,
  });
}

console.log(`Published sitemap.xml with ${routes.length} canonical routes.`);
console.log(`Prepared offline cache ${version} with ${completePrecacheUrls.length} URLs.`);

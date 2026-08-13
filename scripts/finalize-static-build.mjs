import { createHash } from "node:crypto";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "dist");
const serviceWorkerPath = join(outputRoot, "sw.js");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await listFiles(path) : [path]));
  }

  return files;
}

const allFiles = await listFiles(outputRoot);
const precacheFiles = allFiles.filter((path) => path !== serviceWorkerPath);
const precacheUrls = precacheFiles
  .map((path) => `/${relative(outputRoot, path).split(sep).join("/")}`)
  .sort();
const routeAliases = precacheUrls
  .filter((url) => url.endsWith("/index.html"))
  .map((url) => url.slice(0, -"index.html".length));
if (precacheUrls.includes("/index.html")) {
  routeAliases.push("/");
}
const completePrecacheUrls = [...new Set([...precacheUrls, ...routeAliases])].sort();

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

for (const generatedEntry of [
  "index.html",
  "play",
  "commons",
  "charter",
  "governance",
  "identity",
  "contribute",
  "licences",
]) {
  await rm(join(projectRoot, generatedEntry), { recursive: true, force: true });
}

console.log(`Prepared offline cache ${version} with ${completePrecacheUrls.length} URLs.`);

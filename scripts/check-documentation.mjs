import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const documentationRoot = join(projectRoot, "docs");

async function listMarkdownFiles(directory, recursive = true) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...await listMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function headingAnchors(markdown) {
  const anchors = new Set();
  const occurrences = new Map();
  for (const match of markdown.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    const occurrence = occurrences.get(base) ?? 0;
    occurrences.set(base, occurrence + 1);
    anchors.add(occurrence === 0 ? base : `${base}-${occurrence}`);
  }
  return anchors;
}

const rootMarkdown = (await listMarkdownFiles(projectRoot, false));
const documentationFiles = [
  ...rootMarkdown,
  ...await listMarkdownFiles(documentationRoot),
];
const failures = [];

for (const file of documentationFiles) {
  const markdown = await readFile(file, "utf8");
  const fileLabel = file.slice(projectRoot.length + 1);

  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:)/.test(target) || target.startsWith("/")) continue;

    const [rawPath, rawFragment] = target.split("#", 2);
    const targetPath = rawPath.length === 0
      ? file
      : resolve(dirname(file), decodeURIComponent(rawPath));
    if (!await exists(targetPath)) {
      failures.push(`${fileLabel}: missing link target ${target}`);
      continue;
    }

    if (rawFragment && targetPath.endsWith(".md")) {
      const targetMarkdown = await readFile(targetPath, "utf8");
      const fragment = decodeURIComponent(rawFragment).toLowerCase();
      if (!headingAnchors(targetMarkdown).has(fragment)) {
        failures.push(`${fileLabel}: missing heading #${rawFragment} in ${rawPath || fileLabel}`);
      }
    }
  }

  for (const match of markdown.matchAll(/`((?:src|scripts|docs|public|tests)\/[^`\n]+)`/g)) {
    const referencedPath = match[1].replace(/:\d+(?:-\d+)?$/, "");
    if (!await exists(join(projectRoot, referencedPath))) {
      failures.push(`${fileLabel}: missing repository path ${match[1]}`);
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Documentation integrity check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
}

console.log(`Documentation integrity check passed for ${documentationFiles.length} Markdown files.`);

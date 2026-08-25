import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readReleaseRecords } from "./release-records.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const documentationRoot = join(projectRoot, "docs");

/**
 * Identifiers the architecture documents name but the source does not define.
 *
 * A documentation audit found `duvetSafety` described as an engine state field
 * some time after the code stopped using it. Nothing noticed, because prose
 * about code is not checked against code. This closes that specific gap: a
 * camel-case token inside a fenced code block in an architecture document must
 * appear somewhere in `src/`.
 *
 * Fenced blocks only, and camel-case only. Inline code carries field names,
 * cue IDs and file paths that are checked elsewhere or are not identifiers at
 * all, and widening the net is how a term match starts flagging "embedded" and
 * "alarming" instead of anything real.
 */
const identifierDocuments = [
  "technical-architecture.md",
  "content-architecture.md",
];

/**
 * Tokens that are deliberately not in the source.
 *
 * Keep this list short and justified. An entry is a claim that the document
 * means to name something the code does not have.
 */
const permittedAbsentIdentifiers = new Map([
  [
    "startWellnessAttack",
    "content-architecture.md names it in the worked example of the "
      + "episode-specific branching the engine must never contain.",
  ],
]);

/**
 * Every identifier-shaped token in the source, as whole tokens.
 *
 * Substring matching would let a documented `phaseId` pass because the source
 * happens to contain `phaseIdentifier` — a check reporting success for
 * something it did not actually find, which is the failure this whole tranche
 * is about. Tokenising both sides makes the comparison exact.
 *
 * Tokens inside source comments and string literals count as present. Excluding
 * them would need a parser per language, and the risk they cover — a name that
 * exists only in a comment — is far narrower than the substring hole.
 */
async function readSourceIdentifiers() {
  const identifiers = new Set();
  const tokenPattern = /[A-Za-z_$][A-Za-z0-9_$]*/g;
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:ts|tsx|mjs|js|json)$/.test(entry.name)) {
        const contents = await readFile(path, "utf8");
        for (const [token] of contents.matchAll(tokenPattern)) {
          identifiers.add(token);
        }
      }
    }
  };
  await walk(join(projectRoot, "src"));
  return identifiers;
}

function fencedCodeBlocks(markdown) {
  return [...markdown.matchAll(/^```[a-zA-Z]*\n([\s\S]*?)^```/gm)]
    .map((match) => match[1]);
}

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

/**
 * The release records state what each release is, in fields rather than prose.
 *
 * `#48` found stale status claims and left them, on the ground that no checker
 * could catch a sentence that stops being true without any code changing. That
 * was true of a sentence. The header block defined in `docs/release-process.md`
 * makes the same claims decidable, and this is where they are decided.
 */
const { problems: releaseProblems } = await readReleaseRecords(
  join(documentationRoot, "releases"),
);
failures.push(...releaseProblems);

const sourceIdentifiers = await readSourceIdentifiers();
const camelCaseToken = /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g;

for (const documentName of identifierDocuments) {
  const markdown = await readFile(join(documentationRoot, documentName), "utf8");
  const seen = new Set();
  for (const block of fencedCodeBlocks(markdown)) {
    for (const [token] of block.matchAll(camelCaseToken)) {
      if (seen.has(token)) continue;
      seen.add(token);
      if (permittedAbsentIdentifiers.has(token)) continue;
      if (sourceIdentifiers.has(token)) continue;
      failures.push(
        `${documentName}: code block names "${token}", which appears nowhere `
          + "in src/. Rename it to the identifier the code uses, or add it to "
          + "permittedAbsentIdentifiers in scripts/check-documentation.mjs with "
          + "the reason it is deliberately absent.",
      );
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Documentation integrity check failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
}

console.log(`Documentation integrity check passed for ${documentationFiles.length} Markdown files.`);

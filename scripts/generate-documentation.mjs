/**
 * Generate the parts of the grammar reference that restate a schema.
 *
 * Two passages in `docs/episode-grammar-reference.md` were the schemas retyped
 * by hand: the list of semantic audio roles, and the table of phase fields. A
 * documentation audit found several claims of exactly this kind already stale,
 * which is why they are generated here rather than checked by a reviewer.
 *
 * The schemas are loaded through Vite rather than parsed, so this reads the
 * same definitions the application does and cannot drift from them by
 * misreading source text. Vite is already a build dependency; nothing new is
 * introduced to do this.
 *
 * Run with `--check` to verify the committed documentation matches without
 * writing, which is what the build does.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

import { phaseFieldMeanings } from "./doc-data/phase-field-meanings.mjs";
import { protectMainRuleset } from "./doc-data/protect-main-ruleset.mjs";
import { roadmap } from "./doc-data/roadmap.mjs";
import { readReleaseRecords } from "./release-records.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const referencePath = join(projectRoot, "docs/episode-grammar-reference.md");
const releasePath = join(projectRoot, "docs/release-process.md");
const releasesDirectory = join(projectRoot, "docs/releases");
const releasesPath = join(releasesDirectory, "README.md");
const roadmapPath = join(projectRoot, "ROADMAP.md");
const charterPath = join(projectRoot, "PROJECT_CHARTER.md");
const readmePath = join(projectRoot, "README.md");
const agentsPath = join(projectRoot, "AGENTS.md");
const check = process.argv.includes("--check");

const numberWords = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const tensWords = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
];

function inWords(value) {
  if (value < 20) return numberWords[value];
  if (value < 100) {
    const unit = value % 10;
    return unit === 0
      ? tensWords[Math.floor(value / 10)]
      : `${tensWords[Math.floor(value / 10)]}-${numberWords[unit]}`;
  }
  throw new Error(`No word form for ${value}; extend inWords.`);
}

/** Wrap a comma-separated list to the surrounding prose width. */
function wrap(text, width = 78) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line.length === 0) line = word;
    else if (`${line} ${word}`.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines.join("\n");
}

function renderAudioRoles(roles) {
  const quoted = roles.map((role) => `\`${role}\``);
  const list = quoted.length > 1
    ? `${quoted.slice(0, -1).join(", ")} and ${quoted.at(-1)}`
    : quoted.join("");
  return wrap(
    `A soundscape maps every one of the ${inWords(roles.length)} semantic `
      + `roles to a cue: ${list}.`,
  );
}

function renderPhaseFields(fields) {
  const documented = Object.keys(phaseFieldMeanings);
  const undocumented = fields.filter((field) => !documented.includes(field));
  const stale = documented.filter((field) => !fields.includes(field));

  if (undocumented.length > 0 || stale.length > 0) {
    const problems = [
      ...undocumented.map((field) =>
        `  ${field} is in the phase schema but has no meaning authored.`),
      ...stale.map((field) =>
        `  ${field} has a meaning authored but is not in the phase schema.`),
    ];
    throw new Error(
      "scripts/doc-data/phase-field-meanings.mjs disagrees with the phase "
        + `schema:\n${problems.join("\n")}\n`
        + "Add or remove the meaning so the table can be generated.",
    );
  }

  return [
    "| Field | Meaning |",
    "| --- | --- |",
    ...fields.map((field) => `| \`${field}\` | ${phaseFieldMeanings[field]} |`),
  ].join("\n");
}

function replaceRegion(markdown, name, body, label) {
  const open = `<!-- generated:${name} -->`;
  const close = `<!-- /generated:${name} -->`;
  const pattern = new RegExp(
    `${open}\\n[\\s\\S]*?\\n${close}`,
  );
  if (!pattern.test(markdown)) {
    throw new Error(`${label} has no ${open} … ${close} region.`);
  }
  return markdown.replace(pattern, `${open}\n${body}\n${close}`);
}

function renderProtectMain() {
  const checks = protectMainRuleset.requiredStatusChecks
    .map((check) => `\`${check}\``);
  const rows = [
    ...protectMainRuleset.rules.map(([rule, setting]) => [rule, setting]),
    ["Status checks that must pass", checks.join(", ")],
  ];
  return [
    "| Rule | Setting |",
    "| --- | --- |",
    ...rows.map(([rule, setting]) => `| ${rule} | ${setting} |`),
  ].join("\n");
}

/**
 * The published list, ordered by parsed version.
 *
 * Drafts are absent by design: the heading says published, and a record marked
 * `draft` describes a version nobody can play yet. Its own header block is
 * where that state is recorded, not this index.
 */
function renderReleases(records) {
  const published = records.filter((record) => record.lifecycle !== "draft");
  if (published.length === 0) {
    throw new Error("No published release records under docs/releases/.");
  }
  return published
    .map((record) => {
      const withdrawn = record.lifecycle === "withdrawn"
        ? "**Withdrawn.** "
        : "";
      const entry = `- [${record.name}](${record.name}.md) — ${record.date}, `
        + `${record.release}. ${withdrawn}${record.summary}`;
      return wrap(entry, 76)
        .split("\n")
        .map((line, index) => (index === 0 ? line : `  ${line}`))
        .join("\n");
    })
    .join("\n");
}

/**
 * The charter's purpose statement, read from the charter.
 *
 * It stood in four places: the charter, `README.md`, `AGENTS.md` and the public
 * home page. `AGENTS.md` had already drifted — a different comma and a reworded
 * second half — which is exactly what `docs/technical-architecture.md` means
 * when it says a governance document "must not be manually copied into a second
 * set of public documents that can drift from the repository record".
 *
 * Two of those copies are now generated from the charter and cannot drift. The
 * home page is prose rather than a quotation and still agrees by hand; making
 * it generated would mean writing the paragraph around a fixed sentence, which
 * would be a worse page for a weaker guarantee.
 */
function readCharterPurpose(charter) {
  const match = /^## Purpose\n\n(> \*\*.+?\*\*)$/m.exec(charter);
  if (match === null) {
    throw new Error(
      "PROJECT_CHARTER.md has no bold block-quoted purpose statement directly "
        + "under its Purpose heading. README.md and AGENTS.md quote it from "
        + "there, so its shape is load-bearing.",
    );
  }
  return match[1];
}

const issueUrl = (number) =>
  `https://github.com/glowkeeper/the-horizontal-front/issues/${number}`;

/**
 * Render a commitment as the page states it, and refuse an undefined one.
 *
 * The "How to read this" table is generated from the same map, so a value the
 * record uses without defining would put a term on the page that the table
 * does not explain — which is worse than no term at all.
 */
function commitmentLabel(commitment, where) {
  if (!Object.hasOwn(roadmap.commitments, commitment)) {
    throw new Error(
      `${where} claims the commitment "${commitment}", which is not defined `
        + "in roadmap.commitments. Define it there so the How to read this "
        + "table can explain it, or use one of: "
        + `${Object.keys(roadmap.commitments).map((value) => `"${value}"`)
          .join(", ")}.`,
    );
  }
  return `${commitment[0].toUpperCase()}${commitment.slice(1)}.`;
}

function renderCommitments() {
  return [
    "| Term | Meaning |",
    "| --- | --- |",
    ...Object.entries(roadmap.commitments).map(([term, meaning]) =>
      `| ${term[0].toUpperCase()}${term.slice(1)} | ${meaning} |`),
  ].join("\n");
}

/**
 * Children may hold children, because GitHub's sub-issues do.
 *
 * Nesting rather than flattening keeps the page saying which piece of work a
 * descendant belongs to, and lets `check:roadmap` compare each level against
 * the sub-issues of the issue above it rather than losing the structure.
 */
function renderChildren(children, depth = 0) {
  const lines = [];
  for (const [number, title, nested = []] of children) {
    lines.push(
      `${"  ".repeat(depth)}- [#${number} ${title}](${issueUrl(number)})`,
    );
    lines.push(...renderChildren(nested, depth + 1));
  }
  return lines;
}

function renderRoadmap() {
  const sections = [];
  for (const tranche of roadmap.tranches) {
    sections.push(
      `### [${tranche.title}](${issueUrl(tranche.issue)})`,
      "",
      `**${commitmentLabel(tranche.commitment, `#${tranche.issue}`)}** `
        + tranche.summary,
      "",
      wrap(`*Help wanted:* ${tranche.help}`),
      "",
      ...renderChildren(tranche.children),
      "",
    );
  }
  sections.push(
    "### Separate from the tranches",
    "",
    wrap(roadmap.separateCriterion),
    "",
    ...roadmap.separate.map(({ issue, title, commitment }) =>
      `- [#${issue} ${title}](${issueUrl(issue)}) — `
        + `**${commitmentLabel(commitment, `#${issue}`)}**`),
  );
  return sections.join("\n");
}

/**
 * A broken record must stop the generator rather than be rendered.
 *
 * `npm run check:docs` reports these faults properly; reaching them here means
 * the generator was run first, and generating a published list from a record
 * whose claims do not parse would put the fault on the page.
 */
const { records: releaseRecords, problems: releaseProblems } =
  await readReleaseRecords(releasesDirectory);
if (releaseProblems.length > 0) {
  throw new Error(
    "Release records are not valid, so the published list cannot be "
      + `generated:\n${releaseProblems.map((p) => `  ${p}`).join("\n")}`,
  );
}

const charterPurpose = readCharterPurpose(await readFile(charterPath, "utf8"));

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

let audioRoles;
let phaseFields;
try {
  const audio = await server.ssrLoadModule(
    "/src/play/content/schemas/audioSchema.ts",
  );
  const mechanics = await server.ssrLoadModule(
    "/src/play/content/schemas/mechanicsSchema.ts",
  );
  audioRoles = [...audio.audioCueRoles];
  phaseFields = Object.keys(mechanics.phaseSchema.shape);
} finally {
  await server.close();
}

const documents = [
  {
    path: referencePath,
    label: "docs/episode-grammar-reference.md",
    regions: [
      ["audio-roles", renderAudioRoles(audioRoles)],
      ["phase-fields", renderPhaseFields(phaseFields)],
    ],
  },
  {
    path: releasePath,
    label: "docs/release-process.md",
    regions: [["protect-main", renderProtectMain()]],
  },
  {
    path: releasesPath,
    label: "docs/releases/README.md",
    regions: [["releases", renderReleases(releaseRecords)]],
  },
  {
    path: roadmapPath,
    label: "ROADMAP.md",
    regions: [
      ["commitments", renderCommitments()],
      ["roadmap", renderRoadmap()],
    ],
  },
  {
    path: readmePath,
    label: "README.md",
    regions: [["charter-purpose", charterPurpose]],
  },
  {
    path: agentsPath,
    label: "AGENTS.md",
    regions: [["charter-purpose", charterPurpose]],
  },
];

/**
 * Which documents the record disagrees with, in both modes.
 *
 * Recording this only under `--check` would make the write mode unable to say
 * what it had just rewritten, and it would report every run as finding nothing
 * to do — including the runs that changed a published page.
 */
const changed = [];
for (const { path, label, regions } of documents) {
  const original = await readFile(path, "utf8");
  let generated = original;
  for (const [name, body] of regions) {
    generated = replaceRegion(generated, name, body, label);
  }
  if (generated === original) continue;
  changed.push(label);
  if (!check) await writeFile(path, generated);
}

const counts = `${audioRoles.length} audio roles, `
  + `${phaseFields.length} phase fields, `
  + `${protectMainRuleset.requiredStatusChecks.length} required checks, `
  + `${roadmap.tranches.length} roadmap tranches, `
  + `${releaseRecords.length} release records, `
  + "1 charter purpose statement";

if (changed.length === 0) {
  console.log(`Generated documentation is up to date: ${counts}.`);
} else if (check) {
  console.error(
    `Generated documentation is out of date: ${changed.join(", ")}.\n`
      + "These no longer match the definitions they restate.\n"
      + "Run: npm run generate:docs",
  );
  process.exitCode = 1;
} else {
  console.log(`Regenerated ${changed.join(", ")}: ${counts}.`);
}

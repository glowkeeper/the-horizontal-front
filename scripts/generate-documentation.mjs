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

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const referencePath = join(projectRoot, "docs/episode-grammar-reference.md");
const releasePath = join(projectRoot, "docs/release-process.md");
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
  phaseFields = Object.keys(
    mechanics.dramaticCurveSchema._zod.def.shape.phases._zod.def.element
      ._zod.def.shape,
  );
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
];

const stale = [];
for (const { path, label, regions } of documents) {
  const original = await readFile(path, "utf8");
  let generated = original;
  for (const [name, body] of regions) {
    generated = replaceRegion(generated, name, body, label);
  }
  if (generated === original) continue;
  if (check) stale.push(label);
  else await writeFile(path, generated);
}

if (stale.length === 0) {
  console.log(
    `Generated documentation is up to date: ${audioRoles.length} audio roles, `
      + `${phaseFields.length} phase fields, `
      + `${protectMainRuleset.requiredStatusChecks.length} required checks.`,
  );
} else if (check) {
  console.error(
    `Generated documentation is out of date: ${stale.join(", ")}.\n`
      + "These no longer match the definitions they restate.\n"
      + "Run: npm run generate:docs",
  );
  process.exitCode = 1;
} else {
  console.log(`Regenerated: ${documents.map(({ label }) => label).join(", ")}.`);
}

/**
 * The no-placeholders invariant, reported clause by clause.
 *
 * `docs/release-process.md` defines a production release with seven clauses.
 * Some are decidable by a build, some are already enforced elsewhere, and some
 * are permanently human judgement. Reporting them as a single pass or fail
 * would hide that distinction, and a green tick on four clauses nobody checked
 * is worse than no check at all.
 *
 * So this prints a per-clause report and, by default, exits 0 whatever it
 * finds. `0.2.0` and `0.2.1` legitimately ship material that fails this
 * invariant — that is the whole difference between a public release and a
 * production one. Pass `--strict` when preparing a production release to make
 * the decidable clauses gate.
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const catalogue = JSON.parse(await readFile(
  join(projectRoot, "src/play/content/presentation/asset-catalog.json"),
  "utf8",
));

const provenanceFields = {
  "ai-generated": ["creator", "generatedAt", "generationTool", "prompt", "licence"],
  "human-created": ["creator", "licence"],
  "licensed-source": ["creator", "licence", "source", "attribution", "permittedUses"],
};

function missingProvenance(asset) {
  return (provenanceFields[asset.origin] ?? [])
    .filter((field) => {
      const value = asset[field];
      return typeof value !== "string" || value.trim().length === 0;
    });
}

const notApproved = catalogue.assets.filter(
  ({ status }) => status !== "production-approved",
);
const incompleteProvenance = catalogue.assets
  .map((asset) => ({ asset, missing: missingProvenance(asset) }))
  .filter(({ missing }) => missing.length > 0);
const unresolvedReplacement = catalogue.assets.filter(
  ({ replacement }) => replacement !== "none",
);

const assetClauseMet = notApproved.length === 0
  && incompleteProvenance.length === 0
  && unresolvedReplacement.length === 0;

const lines = [];
lines.push("Production readiness — the no-placeholders invariant");
lines.push("Defined in docs/release-process.md. Reported clause by clause.");
lines.push("");

lines.push("Asserted by this report");
lines.push("");
lines.push(`  ${assetClauseMet ? "MET    " : "NOT MET"} 1. Every distributed catalogue asset is production-approved,`);
lines.push("           has complete provenance and licensing metadata, and carries");
lines.push("           no unresolved replacement instruction.");
lines.push("");
lines.push(`           ${catalogue.assets.length} catalogue assets examined.`);

if (notApproved.length === 0) {
  lines.push("           All are production-approved.");
} else {
  lines.push(`           Not production-approved (${notApproved.length}):`);
  for (const { id, status } of notApproved) lines.push(`             ${id} — ${status}`);
}

if (incompleteProvenance.length === 0) {
  lines.push("           All carry complete provenance and licensing metadata.");
} else {
  lines.push(`           Incomplete provenance (${incompleteProvenance.length}):`);
  for (const { asset, missing } of incompleteProvenance) {
    lines.push(`             ${asset.id} — missing ${missing.join(", ")}`);
  }
}

if (unresolvedReplacement.length === 0) {
  lines.push("           None carries an unresolved replacement instruction.");
} else {
  lines.push(`           Unresolved replacement (${unresolvedReplacement.length}):`);
  for (const { id, replacement } of unresolvedReplacement) {
    lines.push(`             ${id} — ${replacement}`);
  }
}

lines.push("");
lines.push("Enforced elsewhere in the ordinary build");
lines.push("");
lines.push("  2. No filename, stable ID or player-visible copy describes shipped");
lines.push("     production material as a prototype, placeholder or implementation");
lines.push("     stage — enforced by npm run check:policy.");
lines.push("  5. Every gameplay and interface event has a deliberately selected");
lines.push("     semantic audio treatment or an explicitly authored silence —");
lines.push("     enforced by content validation, which refuses a soundscape that");
lines.push("     omits any of the twenty-three roles.");
lines.push("");
lines.push("Not decidable by any build — these require a person");
lines.push("");
lines.push("  3. Primitive geometry remains only where intentionally approved as");
lines.push("     part of the final visual language.");
lines.push("  4. Every required visual role is deliberately composed at supported");
lines.push("     sizes with suitable layering, pivots, bounds and resolution.");
lines.push("  6. No temporary sample, browser-default sound, copied melody,");
lines.push("     unexplained omission or generation artefact enters the");
lines.push("     distributable.");
lines.push("  7. The integrated result receives human perceptual acceptance for its");
lines.push("     readability, timing, humour, audiovisual coherence and input");
lines.push("     clarity.");
lines.push("");
lines.push("A passing report is not a met invariant. Four of the seven clauses above");
lines.push("cannot be asserted by this or any other check, and #40 must record them");
lines.push("individually with their own evidence.");

console.log(lines.join("\n"));

if (!assetClauseMet && strict) {
  console.error("\nProduction readiness check failed: clause 1 is not met.");
  process.exitCode = 1;
}

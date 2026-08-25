/**
 * Read and validate the release records under `docs/releases/`.
 *
 * A release record's header block states what the release is: its version, when
 * it was published, whether it is a production release, and where it stands.
 * `docs/release-process.md` defines the block; this module is the one place
 * that parses it, so the check that enforces it and the generator that renders
 * the published list cannot disagree about what a valid record looks like.
 *
 * Before the block existed these were prose. `0.2.0.md` said "Status: first
 * public release, not a production release" and `0.2.1.md` said "Status: public
 * release, not a production release" — two spellings of one claim, with nothing
 * comparing them. `#48` named this class of failure and deliberately left it,
 * because a status claim held in prose is not checkable. Held in a field, it is.
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * The block, in order.
 *
 * Order is enforced rather than merely membership. The block is read by people
 * far more often than by this parser, and a fixed shape is what lets a reader
 * find the claim without hunting for it.
 */
export const recordFields = ["Version", "Date", "Release", "Summary", "Lifecycle"];

/** What the release is. Two values, because the process defines two kinds. */
export const releaseKinds = ["production", "public, not production"];

/** Where the record stands, which is orthogonal to what the release is. */
export const lifecycles = ["draft", "published", "withdrawn"];

/**
 * Compare versions as numbers rather than as text.
 *
 * Components are unbounded integers, so `1.10.0` is greater than `1.9.0` while
 * sorting before it in every default string comparison there is — in a
 * directory listing, in `git tag`, and in any index built by listing files.
 * Ordering a release history wrongly is the kind of fault that is obvious on
 * the day it is written and invisible on the day it breaks.
 */
export function compareVersions(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function parseVersion(text) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(text);
  return match === null ? null : match.slice(1, 4).map(Number);
}

/**
 * Pull the header block out of one record.
 *
 * The block is the run of `Field: value` lines following the title, and it ends
 * at the first blank line. Anything looser would let a stray colon further down
 * the document be read as a field.
 */
function parseRecord(name, markdown) {
  const problems = [];
  const lines = markdown.split("\n");
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));
  if (titleIndex === -1) {
    return { problems: [`${name}: no title line.`] };
  }

  let index = titleIndex + 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;

  const fields = new Map();
  const order = [];
  for (; index < lines.length && lines[index].trim() !== ""; index += 1) {
    const match = /^([A-Z][A-Za-z]*): (.+)$/.exec(lines[index]);
    if (match === null) {
      problems.push(
        `${name}: "${lines[index]}" is inside the header block but is not a `
          + "Field: value line. The block ends at the first blank line.",
      );
      continue;
    }
    order.push(match[1]);
    fields.set(match[1], match[2].trim());
  }

  if (order.join(",") !== recordFields.join(",")) {
    problems.push(
      `${name}: the header block is ${order.length === 0 ? "missing" : `[${order.join(", ")}]`}`
        + `, and must be exactly [${recordFields.join(", ")}] in that order. `
        + "See the release record section of docs/release-process.md.",
    );
    return { problems };
  }

  const version = parseVersion(fields.get("Version"));
  if (version === null) {
    problems.push(
      `${name}: Version is "${fields.get("Version")}", which is not a `
        + "major.minor.patch version.",
    );
  } else if (fields.get("Version") !== name) {
    problems.push(
      `${name}: Version is "${fields.get("Version")}" but the filename says `
        + `"${name}". One revision is identified consistently or not at all.`,
    );
  }

  const date = fields.get("Date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    problems.push(`${name}: Date is "${date}", which is not YYYY-MM-DD.`);
  } else {
    /*
     * Rolling the components through Date.UTC and reading them back rejects
     * 2026-13-45 without throwing. Constructing a Date from the string and
     * calling toISOString would throw a RangeError on exactly the input this
     * is meant to catch, which is how a validator becomes a crash.
     */
    const [year, month, day] = date.split("-").map(Number);
    const rolled = new Date(Date.UTC(year, month - 1, day));
    if (rolled.getUTCFullYear() !== year
      || rolled.getUTCMonth() !== month - 1
      || rolled.getUTCDate() !== day) {
      problems.push(
        `${name}: Date is "${date}", which is shaped like a date but is not `
          + "one.",
      );
    }
  }

  if (fields.get("Summary").length === 0) {
    problems.push(
      `${name}: Summary is blank. It is the sentence the published list `
        + "renders, so a record without one generates an empty entry.",
    );
  }

  if (!releaseKinds.includes(fields.get("Release"))) {
    problems.push(
      `${name}: Release is "${fields.get("Release")}". It is `
        + `${releaseKinds.map((kind) => `"${kind}"`).join(" or ")}, and adding `
        + "a third kind means writing the invariant list that would define it.",
    );
  }

  if (!lifecycles.includes(fields.get("Lifecycle"))) {
    problems.push(
      `${name}: Lifecycle is "${fields.get("Lifecycle")}". It is `
        + `${lifecycles.map((value) => `"${value}"`).join(", ")}.`,
    );
  }

  return {
    name,
    version,
    date: fields.get("Date"),
    release: fields.get("Release"),
    summary: fields.get("Summary"),
    lifecycle: fields.get("Lifecycle"),
    problems,
  };
}

/**
 * Every record, newest first, with whatever is wrong with them.
 *
 * Returns rather than throws, so the documentation check can report release
 * faults alongside its other failures instead of stopping at the first one.
 */
export async function readReleaseRecords(releasesDirectory) {
  const entries = await readdir(releasesDirectory, { withFileTypes: true });
  const records = [];
  const problems = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    if (entry.name === "README.md") continue;
    const name = entry.name.slice(0, -3);
    const record = parseRecord(
      name,
      await readFile(join(releasesDirectory, entry.name), "utf8"),
    );
    problems.push(...record.problems);
    /*
     * Only records with a parsed version go on. A record whose Version did not
     * parse has already had that reported, and carrying its null into the
     * comparator below would throw a TypeError — losing every other problem in
     * the run, including the one that caused it.
     */
    if (Array.isArray(record.version)) records.push(record);
  }

  records.sort((a, b) => compareVersions(b.version, a.version));

  const drafts = records.filter((record) => record.lifecycle === "draft");
  if (drafts.length > 1) {
    problems.push(
      `Two or more records are drafts: ${drafts.map((d) => d.name).join(", ")}. `
        + "A release is prepared one at a time, and a second draft means one of "
        + "them was published without its record being updated.",
    );
  }

  const published = records.filter((record) => record.lifecycle !== "draft");
  for (const draft of drafts) {
    const ahead = published.filter(
      (record) => compareVersions(record.version, draft.version) >= 0,
    );
    if (ahead.length > 0) {
      problems.push(
        `${draft.name} is a draft but does not come after `
          + `${ahead.map((record) => record.name).join(", ")}. A version being `
          + "prepared is higher than every version already out.",
      );
    }
  }

  return { records, problems };
}

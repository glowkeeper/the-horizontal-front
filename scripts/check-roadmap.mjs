/**
 * Compare the published roadmap against the issues it names.
 *
 * `ROADMAP.md` is generated from `scripts/doc-data/roadmap.mjs`, which pins the
 * plan to issue numbers and titles. Nothing tied that record to GitHub, so a
 * renamed or reparented issue would leave the public roadmap describing
 * something that no longer exists under that name.
 *
 * Like the ruleset check this needs a network and so is not part of
 * `npm run build`; it runs as its own CI job. The endpoints need no
 * authentication for a public repository.
 *
 * It runs in two directions. From the record outwards, every issue the record
 * names must exist under the parent claimed for it, and must be open or closed
 * as the page it appears on implies. From GitHub inwards, every open issue must
 * be named on the plan, because an issue listed nowhere is one a reader has no
 * way to find.
 *
 * The record feeds two pages. `ROADMAP.md` is work that is ahead and
 * `DELIVERED.md` is work that is finished, so a tranche whose every part is
 * closed belongs on the second and is a fault on the first. Retirement is a
 * move between two lists rather than a deletion, which is why this can be
 * checked at all.
 *
 * Neither page restates each issue's state issue by issue. The page an entry
 * appears on carries that claim for it, and this check is what makes the claim
 * safe to rely on.
 */
import { roadmap } from "./doc-data/roadmap.mjs";

const repository = process.env.GITHUB_REPOSITORY
  ?? "glowkeeper/the-horizontal-front";

const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "the-horizontal-front-roadmap-check",
  ...(process.env.GITHUB_TOKEN
    ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

/**
 * Follow GitHub's pagination rather than trusting one page.
 *
 * List endpoints return thirty items by default. A tranche with more children
 * than a page holds would silently lose the rest, and every one of them would
 * then be reported as listed in the roadmap but absent from GitHub — a check
 * failing loudly for a reason that is not true. No tranche is near that today,
 * which is exactly why it would go unnoticed until it happened.
 */
async function fetchAll(path, perPage = 100) {
  const items = [];
  let next = `https://api.github.com/repos/${repository}${path}`
    + `${path.includes("?") ? "&" : "?"}per_page=${perPage}`;

  while (next !== null) {
    const response = await fetch(next, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${next}`);
    }
    items.push(...await response.json());
    const link = /<([^>]+)>;\s*rel="next"/.exec(response.headers.get("link") ?? "");
    next = link === null ? null : link[1];
  }

  return items;
}

const problems = [];
const named = new Set();
let checked = 0;

/**
 * Every issue in the repository, in one request rather than one each.
 *
 * Titles and states are all this needs, and the list endpoint carries both, so
 * fetching each issue individually would spend a request per listed issue to
 * learn what one page already said. It returns pull requests too, which are
 * not roadmap entries and are filtered out by the member only they carry.
 */
const allIssues = (await fetchAll("/issues?state=all"))
  .filter((issue) => issue.pull_request === undefined);
const issues = new Map(allIssues.map((issue) => [issue.number, issue]));

/** Confirm a listed issue exists under the title the record gives it. */
function verify(number, title, where) {
  checked += 1;
  const issue = issues.get(number);
  if (issue === undefined) {
    problems.push(`#${number} is listed ${where} but does not exist.`);
    return undefined;
  }
  if (issue.title !== title) {
    problems.push(
      `#${number} is titled "${issue.title}", the record says "${title}".`,
    );
  }
  return issue;
}

/**
 * Compare one level of the record against the sub-issues of the issue above it.
 *
 * Recursion follows the record rather than GitHub: a listed entry with nested
 * children costs one more request, and one with none costs nothing. Descending
 * everywhere would buy only the detection of unlisted *closed* descendants,
 * which the roadmap does not require — an unlisted open one is caught by the
 * completeness pass below, and reported more clearly there.
 *
 * Returns every listed descendant, at any depth, rather than a verdict about
 * them. Both pages ask a different question of the same walk — the plan asks
 * whether all of them are closed, the delivered record asks which are not — and
 * a boolean answers only one of those without naming the issue at fault.
 */
async function compareChildren(parent, listed, where, plan) {
  const children = await fetchAll(`/issues/${parent}/sub_issues`);
  const actual = new Map(children.map((child) => [child.number, child.title]));
  const descendants = [];

  for (const [number, title, nested = []] of listed) {
    verify(number, title, where);
    if (plan) named.add(number);
    descendants.push(number);
    if (!actual.has(number)) {
      problems.push(
        `#${number} is listed under #${parent} in the record but is not a `
          + "child of it on GitHub.",
      );
    }
    if (nested.length > 0) {
      descendants.push(...await compareChildren(number, nested, where, plan));
    }
  }

  const expected = new Set(listed.map(([number]) => number));
  for (const [number, title] of actual) {
    if (!expected.has(number)) {
      problems.push(
        `#${number} "${title}" is a child of #${parent} on GitHub but the `
          + "record does not list it.",
      );
    }
  }

  return descendants;
}

/**
 * An issue nobody can find is not finished.
 *
 * A number the record names but GitHub does not know is already reported as a
 * disagreement. Treating it as closed on top of that would let a tranche be
 * called finished on the strength of an issue that does not exist.
 */
const isClosed = (number) => issues.get(number)?.state === "closed";

const finished = [];
const unfinished = [];

for (const tranche of roadmap.tranches) {
  verify(tranche.issue, tranche.title, "as a tranche on the plan");
  named.add(tranche.issue);
  const descendants = await compareChildren(
    tranche.issue,
    tranche.children,
    `under #${tranche.issue} on the plan`,
    true,
  );
  if (isClosed(tranche.issue) && descendants.every(isClosed)) {
    finished.push(`#${tranche.issue} ${tranche.title} — the whole tranche.`);
  }
}

for (const { issue: number, title } of roadmap.separate) {
  verify(number, title, "separate from the tranches on the plan");
  named.add(number);
  if (isClosed(number)) finished.push(`#${number} ${title}`);
}

/** Report a delivered entry that is not closed, naming the issue at fault. */
function requireClosed(number) {
  const issue = issues.get(number);
  if (issue !== undefined && issue.state !== "closed") {
    unfinished.push(`#${number} ${issue.title}`);
  }
}

for (const tranche of roadmap.delivered.tranches) {
  verify(tranche.issue, tranche.title, "as a delivered tranche");
  const descendants = await compareChildren(
    tranche.issue,
    tranche.children,
    `under delivered #${tranche.issue}`,
    false,
  );
  for (const number of [tranche.issue, ...descendants]) requireClosed(number);
}

for (const [number, title] of roadmap.delivered.separate) {
  verify(number, title, "as delivered, separate from the tranches");
  requireClosed(number);
}

/**
 * The other direction: every open issue must be named on the plan.
 *
 * Delivered entries do not count. An open issue listed there is reported as
 * unfinished rather than accepted as published, since the page it sits on is
 * the thing claiming it is done.
 */
const openIssues = allIssues.filter((issue) => issue.state === "open");
const unlisted = openIssues.filter((issue) => !named.has(issue.number));

console.log(
  `Roadmap comparison for ${repository}: ${checked} issues checked, `
    + `${openIssues.length} open.`,
);

if (problems.length > 0) {
  console.error(
    `\n${problems.length} disagreement${problems.length === 1 ? "" : "s"} `
      + "between the record and GitHub:\n"
      + problems.map((problem) => `  ${problem}`).join("\n"),
  );
}

if (unlisted.length > 0) {
  console.error(
    `\n${unlisted.length} open issue${unlisted.length === 1 ? " is" : "s are"} `
      + "named nowhere on the plan:\n"
      + unlisted.map(({ number, title }) => `  #${number} ${title}`).join("\n")
      + "\n\nEvery open issue belongs in one of three places: its own tranche, "
      + "for a body of work with\nreasoning behind it; under a tranche, for work "
      + "belonging to one; or separate from the\ntranches, for a genuine "
      + "one-off. Nothing else counts as published.",
  );
}

if (finished.length > 0) {
  console.error(
    `\n${finished.length} entr${finished.length === 1 ? "y is" : "ies are"} `
      + "finished but still on the plan:\n"
      + finished.map((entry) => `  ${entry}`).join("\n")
      + "\n\nROADMAP.md is work that is ahead. Move these to the delivered "
      + "record: a tranche\nretires with its children once all of it is done, "
      + "and an individual issue retires when\nit closes.",
  );
}

if (unfinished.length > 0) {
  console.error(
    `\n${unfinished.length} delivered entr`
      + `${unfinished.length === 1 ? "y is" : "ies are"} not closed:\n`
      + unfinished.map((entry) => `  ${entry}`).join("\n")
      + "\n\nDELIVERED.md says this work is finished. Either close it or put "
      + "it back on the plan.",
  );
}

const faults = problems.length + unlisted.length + finished.length
  + unfinished.length;

if (faults > 0) {
  console.error(
    "\nUpdate scripts/doc-data/roadmap.mjs and run npm run generate:docs.",
  );
  process.exitCode = 1;
} else {
  console.log(
    "The plan and the delivered record match the issues they name, the plan "
      + "names every open\nissue, and nothing is on the wrong page.",
  );
}

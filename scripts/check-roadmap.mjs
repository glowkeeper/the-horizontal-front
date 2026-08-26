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
 * It runs in two directions. From the record outwards, every issue the roadmap
 * names must exist under the parent the roadmap claims for it. From GitHub
 * inwards, every open issue must be named somewhere in the record, because an
 * issue listed nowhere is one a reader has no way to find.
 *
 * Closed issues are only checked in the first direction. The roadmap keeps
 * naming them, but requiring one to be added after the fact would fail forever
 * on work that was finished before this rule existed. The page still does not
 * restate whether an issue is open or closed: that would be wrong within a day,
 * and the linked issue already says so.
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

async function fetchJson(path) {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${path}`);
  }
  return response.json();
}

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
 * Compare one level of the record against the sub-issues of the issue above it.
 *
 * Recursion follows the record rather than GitHub: a listed entry with nested
 * children costs one more request, and one with none costs nothing. Descending
 * everywhere would buy only the detection of unlisted *closed* descendants,
 * which the roadmap does not require — an unlisted open one is caught by the
 * completeness pass below, and reported more clearly there.
 */
async function compareChildren(parent, listed) {
  const children = await fetchAll(`/issues/${parent}/sub_issues`);
  const actual = new Map(children.map((child) => [child.number, child.title]));

  for (const [number, title, nested = []] of listed) {
    checked += 1;
    named.add(number);
    if (!actual.has(number)) {
      problems.push(
        `#${number} is listed under #${parent} in the roadmap but is not a `
          + "child of it on GitHub.",
      );
    } else if (actual.get(number) !== title) {
      problems.push(
        `#${number} is titled "${actual.get(number)}", the roadmap says `
          + `"${title}".`,
      );
    }
    if (nested.length > 0) await compareChildren(number, nested);
  }

  const expected = new Set(listed.map(([number]) => number));
  for (const [number, title] of actual) {
    if (!expected.has(number)) {
      problems.push(
        `#${number} "${title}" is a child of #${parent} on GitHub but the `
          + "roadmap does not list it.",
      );
    }
  }
}

for (const tranche of roadmap.tranches) {
  const issue = await fetchJson(`/issues/${tranche.issue}`);
  checked += 1;
  named.add(tranche.issue);
  if (issue.title !== tranche.title) {
    problems.push(
      `#${tranche.issue} is titled "${issue.title}", the roadmap says `
        + `"${tranche.title}".`,
    );
  }

  await compareChildren(tranche.issue, tranche.children);
}

for (const { issue: number, title } of roadmap.separate) {
  const issue = await fetchJson(`/issues/${number}`);
  checked += 1;
  named.add(number);
  if (issue.title !== title) {
    problems.push(
      `#${number} is titled "${issue.title}", the roadmap says "${title}".`,
    );
  }
}

/**
 * The other direction: every open issue must be named somewhere above.
 *
 * The issues endpoint returns pull requests as well, which are not roadmap
 * entries and are filtered out by the member that only a pull request carries.
 */
const openIssues = (await fetchAll("/issues?state=open"))
  .filter((issue) => issue.pull_request === undefined);
const unlisted = openIssues.filter((issue) => !named.has(issue.number));

console.log(
  `Roadmap comparison for ${repository}: ${checked} issues checked, `
    + `${openIssues.length} open.`,
);

if (problems.length > 0) {
  console.error(
    `\n${problems.length} disagreement${problems.length === 1 ? "" : "s"} `
      + "between the roadmap and GitHub:\n"
      + problems.map((problem) => `  ${problem}`).join("\n"),
  );
}

if (unlisted.length > 0) {
  console.error(
    `\n${unlisted.length} open issue${unlisted.length === 1 ? " is" : "s are"} `
      + "named nowhere in the roadmap:\n"
      + unlisted.map(({ number, title }) => `  #${number} ${title}`).join("\n")
      + "\n\nEvery open issue belongs in one of three places: its own tranche, "
      + "for a body of work with\nreasoning behind it; under a tranche, for work "
      + "belonging to one; or separate from the\ntranches, for a genuine "
      + "one-off. Nothing else counts as published.",
  );
}

if (problems.length > 0 || unlisted.length > 0) {
  console.error(
    "\nUpdate scripts/doc-data/roadmap.mjs and run npm run generate:docs.",
  );
  process.exitCode = 1;
} else {
  console.log(
    "The published roadmap matches the issues it names, and names every open "
      + "issue.",
  );
}

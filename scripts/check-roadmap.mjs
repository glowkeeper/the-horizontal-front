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
 * Deliberately not checked: whether an issue is open or closed. The roadmap
 * does not claim that, because a page restating it would be wrong within a day
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

const problems = [];
let checked = 0;

for (const tranche of roadmap.tranches) {
  const issue = await fetchJson(`/issues/${tranche.issue}`);
  checked += 1;
  if (issue.title !== tranche.title) {
    problems.push(
      `#${tranche.issue} is titled "${issue.title}", the roadmap says `
        + `"${tranche.title}".`,
    );
  }

  const children = await fetchJson(`/issues/${tranche.issue}/sub_issues`);
  const actual = new Map(children.map((child) => [child.number, child.title]));

  for (const [number, title] of tranche.children) {
    checked += 1;
    if (!actual.has(number)) {
      problems.push(
        `#${number} is listed under #${tranche.issue} in the roadmap but is `
          + "not a child of it on GitHub.",
      );
    } else if (actual.get(number) !== title) {
      problems.push(
        `#${number} is titled "${actual.get(number)}", the roadmap says `
          + `"${title}".`,
      );
    }
  }

  const listed = new Set(tranche.children.map(([number]) => number));
  for (const [number, title] of actual) {
    if (!listed.has(number)) {
      problems.push(
        `#${number} "${title}" is a child of #${tranche.issue} on GitHub but `
          + "the roadmap does not list it.",
      );
    }
  }
}

for (const [number, title] of roadmap.separate) {
  const issue = await fetchJson(`/issues/${number}`);
  checked += 1;
  if (issue.title !== title) {
    problems.push(
      `#${number} is titled "${issue.title}", the roadmap says "${title}".`,
    );
  }
}

console.log(`Roadmap comparison for ${repository}: ${checked} issues checked.`);

if (problems.length > 0) {
  console.error(
    `\n${problems.length} disagreement${problems.length === 1 ? "" : "s"} `
      + "between the roadmap and GitHub:\n"
      + problems.map((problem) => `  ${problem}`).join("\n")
      + "\n\nUpdate scripts/doc-data/roadmap.mjs and run npm run generate:docs.",
  );
  process.exitCode = 1;
} else {
  console.log("The published roadmap matches the issues it names.");
}

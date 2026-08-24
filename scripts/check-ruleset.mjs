/**
 * Compare the documented `Protect main` ruleset against the live one.
 *
 * `docs/release-process.md` describes the protection on `main`. That prose is
 * generated from `scripts/doc-data/protect-main-ruleset.mjs`, but nothing tied
 * either of them to what GitHub actually enforces, so a ruleset edited in the
 * web interface would leave the document quietly wrong — the failure mode this
 * whole tranche exists to remove.
 *
 * This is deliberately not part of `npm run build`. The build must work without
 * a network, and a documentation check that fails on a train is worse than no
 * check. It runs as its own CI job instead.
 *
 * The endpoint needs no authentication for a public repository, so no token or
 * elevated workflow permission is involved.
 */
import { protectMainRuleset } from "./doc-data/protect-main-ruleset.mjs";

const repository = process.env.GITHUB_REPOSITORY
  ?? "glowkeeper/the-horizontal-front";
const endpoint =
  `https://api.github.com/repos/${repository}/rules/branches/${protectMainRuleset.branch}`;

const response = await fetch(endpoint, {
  headers: {
    accept: "application/vnd.github+json",
    "user-agent": "the-horizontal-front-ruleset-check",
    ...(process.env.GITHUB_TOKEN
      ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  },
});

if (!response.ok) {
  console.error(
    `Could not read the live ruleset: HTTP ${response.status} from ${endpoint}`,
  );
  process.exit(1);
}

const live = await response.json();
const byType = new Map(live.map((rule) => [rule.type, rule.parameters ?? {}]));
const pullRequest = byType.get("pull_request") ?? {};
const statusChecks = byType.get("required_status_checks") ?? {};
const { expected } = protectMainRuleset;

const liveChecks = (statusChecks.required_status_checks ?? [])
  .map(({ context }) => context);

const comparisons = [
  ["branch deletion refused", expected.deletion, byType.has("deletion")],
  ["force push refused", expected.nonFastForward, byType.has("non_fast_forward")],
  [
    "linear history required",
    expected.requiredLinearHistory,
    byType.has("required_linear_history"),
  ],
  ["pull request required", true, byType.has("pull_request")],
  [
    "permitted merge methods",
    expected.allowedMergeMethods,
    pullRequest.allowed_merge_methods,
  ],
  [
    "approving reviews required",
    expected.requiredApprovingReviewCount,
    pullRequest.required_approving_review_count,
  ],
  [
    "review thread resolution required",
    expected.requiredReviewThreadResolution,
    pullRequest.required_review_thread_resolution,
  ],
  [
    "extra approval for unattributed changes",
    expected.requireExtraApprovalForUnattributedChanges,
    pullRequest.require_extra_approval_for_unattributed_changes,
  ],
  [
    "branch up to date before merge",
    expected.strictRequiredStatusChecks,
    statusChecks.strict_required_status_checks_policy,
  ],
  [
    "required status checks",
    [...protectMainRuleset.requiredStatusChecks].sort(),
    [...liveChecks].sort(),
  ],
];

const show = (value) => JSON.stringify(value);
const disagreements = comparisons.filter(
  ([, documented, actual]) => show(documented) !== show(actual),
);

console.log(`Ruleset comparison for ${repository} (${protectMainRuleset.branch})`);
for (const [label, documented, actual] of comparisons) {
  const agrees = show(documented) === show(actual);
  console.log(
    `  ${agrees ? "OK  " : "DIFF"} ${label}`
      + (agrees ? "" : `\n         documented ${show(documented)}, live ${show(actual)}`),
  );
}

if (disagreements.length > 0) {
  console.error(
    `\n${disagreements.length} of ${comparisons.length} settings disagree.\n`
      + "Either the ruleset changed without being recorded, or the record is\n"
      + "wrong. Update scripts/doc-data/protect-main-ruleset.mjs and run\n"
      + "npm run generate:docs, or restore the ruleset — deliberately, not by\n"
      + "editing whichever one is easier to reach.",
  );
  process.exitCode = 1;
}

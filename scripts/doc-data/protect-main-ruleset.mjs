/**
 * The `Protect main` ruleset as the project intends it.
 *
 * This is the single record of that intent. `docs/release-process.md` renders
 * its table from here, and `npm run check:ruleset` compares it against what
 * GitHub actually enforces, so the documentation cannot quietly describe a
 * ruleset that somebody changed in the web interface.
 *
 * Changing the ruleset therefore means changing this file too — which is the
 * point. A protection nobody wrote down is folklore.
 */
export const protectMainRuleset = {
  branch: "main",
  rules: [
    ["Pull request required", "yes", "pull_request"],
    ["Direct push to the branch", "refused", "—"],
    ["Branch deletion", "refused", "deletion"],
    ["Force push", "refused", "non_fast_forward"],
    ["Permitted merge methods", "squash only", "pull_request"],
    ["Linear history", "required", "required_linear_history"],
    ["Review threads resolved before merge", "required", "pull_request"],
    ["Approving reviews required", "none", "pull_request"],
    [
      "Extra approval for changes GitHub cannot attribute",
      "required",
      "pull_request",
    ],
    [
      "Branch up to date with the base before merge",
      "required",
      "required_status_checks",
    ],
  ],
  requiredStatusChecks: ["Verify", "Browser smoke tests", "Offline play"],

  /** Compared field by field against the live ruleset. */
  expected: {
    deletion: true,
    nonFastForward: true,
    requiredLinearHistory: true,
    allowedMergeMethods: ["squash"],
    requiredApprovingReviewCount: 0,
    requiredReviewThreadResolution: true,
    requireExtraApprovalForUnattributedChanges: true,
    strictRequiredStatusChecks: true,
  },
};

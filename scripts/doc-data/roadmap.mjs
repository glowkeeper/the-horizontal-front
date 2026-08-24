/**
 * The project's plan, as data.
 *
 * `ROADMAP.md` renders its tables from here, and `npm run check:roadmap`
 * compares the issue numbers and titles against GitHub, so the published plan
 * cannot quietly describe issues that were renamed, closed or reparented.
 *
 * Deliberately no per-issue status. A roadmap that restated whether each issue
 * was open would go stale every time one closed, and the linked issue already
 * answers that better than a copy of it could. Commitment is recorded per
 * tranche, because that is the part that reflects a decision rather than a
 * state.
 */
export const roadmap = {
  tranches: [
    {
      issue: 36,
      title: "Publish the first production release (1.0.0)",
      commitment: "committed",
      summary:
        "Finish the content that already exists. One campaign, one episode, "
        + "brought to production quality. Adding more content is not part of it.",
      help:
        "Production audio and human artwork refinement are both wanted, and "
        + "both are currently the hardest things for the project to staff.",
      children: [
        [37, "Bring Management and the protagonist to production authorship"],
        [38, "Complete and accept the production audio"],
        [39, "Playtest The Alarm with representative players"],
        [40, "Prepare and publish the 1.0.0 production release"],
      ],
    },
    {
      issue: 44,
      title: "Meet the commons participation obligations",
      commitment: "committed",
      summary:
        "Make the project's stated commitments to community participation real, "
        + "and enforce the process rules it writes down but does not check.",
      help:
        "Mostly maintainer work on repository process, but the documents it "
        + "produces are for contributors and corrections to them are welcome.",
      children: [
        [45, "Publish a public roadmap"],
        [46, "Record branch and pull-request conventions in CONTRIBUTING"],
        [47, "Require browser and offline checks on main"],
        [48, "Keep documentation accurate by construction"],
        [49, "Make the no-placeholders invariant machine-checkable"],
        [61, "Document and harden offline verification"],
      ],
    },
    {
      issue: 53,
      title: "Open the game to outside authors",
      commitment: "wanted, not scheduled",
      summary:
        "Let somebody who did not build the game write a campaign for it: "
        + "compose it in the browser, preview it playing, and package it into a "
        + "contribution that can be reviewed and merged.",
      help:
        "This tranche exists so that campaigns can come from outside. It is the "
        + "main route in for anyone who wants to write for the game.",
      children: [
        [54, "Own presentation artwork at campaign level and stock a shared starter kit"],
        [55, "Render content the build did not ship"],
        [14, "Create the Propaganda Department authoring tool"],
        [56, "Package a contribution"],
        [57, "Write the contributor's editorial standard"],
      ],
    },
    {
      issue: 41,
      title: "Expand the episode grammar beyond one worked example",
      commitment: "wanted, not scheduled",
      summary:
        "Widen the authoring vocabulary until a second and third episode can be "
        + "written as data, writing, artwork and audio alone — proving the claim "
        + "that a new episode needs no new programming.",
      help:
        "Engine and grammar design, which the maintainer intends to keep. "
        + "Episodes written against the grammar are a different matter entirely.",
      children: [
        [42, "Keep campaign progress on the player's device"],
        [43, "Validate the geometry of a resistance composition"],
        [11, "Add semantic poses and constrained composition offsets"],
        [8, "Expand the episode narrative grammar"],
        [9, "Add phased confrontation grammar"],
        [10, "Expand the reusable rhythm vocabulary"],
        [13, "Add a second reusable layout and production-oriented skin"],
      ],
    },
  ],

  /** Work that belongs to no tranche. */
  separate: [
    [50, "Widen the verified support matrix"],
  ],
};

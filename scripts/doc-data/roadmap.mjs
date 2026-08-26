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
 * state. Entries under `separate` carry their own, because they have no
 * tranche to inherit one from.
 *
 * Every open issue must appear here, which `npm run check:roadmap` enforces in
 * both directions. An issue named nowhere is one a reader cannot find.
 */
export const roadmap = {
  /**
   * What the page means by each commitment value.
   *
   * The "How to read this" table in `ROADMAP.md` is generated from this, so a
   * value cannot be used without the reader being told what it means. That
   * table is what a reader uses to interpret every entry on the page.
   */
  commitments: {
    committed: "Decided, and either in progress or next.",
    "wanted, not scheduled":
      "Genuinely intended, nobody currently working on it.",
    "raised, not decided":
      "Filed and published, but not evaluated. The project has formed no "
      + "intention about it, and listing it here is not agreement to do it. "
      + "Moving an issue out of this row is the decision being made.",
  },

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
        [37, "Bring Management and the protagonist to production authorship", [
          [27, "Reconcile Management's fixed console across the four pose states"],
        ]],
        [38, "Complete and accept the production audio"],
        [39, "Playtest The Alarm with representative players"],
        [73, "Commit to a versioning scheme and make release status checkable"],
        [40, "Prepare and publish the 1.0.0 production release"],
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

  /**
   * What qualifies as separate from the tranches.
   *
   * Rendered onto the page, because a section with no stated criterion is a
   * place things fall into rather than a declared exception.
   */
  separateCriterion:
    "An issue belongs here when it is genuinely a one-off: real work with no "
    + "body of work behind it for a tranche to explain. Inventing a tranche to "
    + "hold a single issue would produce a grouping that says nothing, and the "
    + "instruction above is to start with the tranche because the tranche says "
    + "why. This is a declared exception rather than a queue: if the list grows "
    + "long, that is evidence of work accumulating which no tranche accounts "
    + "for, and the answer is a tranche rather than a longer list.",

  /**
   * Work that belongs to no tranche.
   *
   * Each entry carries its own commitment, since there is no tranche above it
   * holding one.
   */
  separate: [
    {
      issue: 50,
      title: "Widen the verified support matrix",
      commitment: "wanted, not scheduled",
    },
  ],

  /**
   * Work that is finished, rendered on `DELIVERED.md` rather than the plan.
   *
   * A tranche retires when all of it is done and takes its children with it,
   * because a tranche listing only its unfinished children would misrepresent
   * what it set out to do. An entry separate from the tranches retires when it
   * closes, having no tranche to wait for. Nothing is deleted: an entry moves
   * between two lists generated from this one record, and `check:roadmap`
   * verifies that everything here is closed and that nothing on the plan is
   * entirely finished.
   *
   * Newest first. No commitment values, because commitment describes an
   * intention and these are outcomes.
   */
  delivered: {
    tranches: [
      {
        issue: 70,
        title: "Describe the game as it is",
        summary:
          "The game described as it is rather than as it was first pitched, "
          + "separating what it is about from how the first campaign expresses "
          + "it, and correcting the charter to match.",
        children: [
          [71, "Separate what the game is about from how the first campaign expresses it"],
          [72, "Correct the charter's description of the game"],
        ],
      },
      {
        issue: 44,
        title: "Meet the commons participation obligations",
        summary:
          "The participation commitments made real and checkable: a public "
          + "roadmap, recorded branch and pull-request conventions, required "
          + "browser and offline checks, documentation accurate by "
          + "construction, and offline verification hardened.",
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
        issue: 21,
        title: "Publish the first public release (0.2.0)",
        summary:
          "The first public release: a production-approved visual asset set, a "
          + "procedural audio grammar, The Alarm's soundscape, and the "
          + "composition reviewed and published as 0.2.0.",
        children: [
          [22, "Produce the production-approved visual asset set"],
          [12, "Build the procedural audio grammar"],
          [23, "Author and tune The Alarm’s production soundscape"],
          [24, "Integrate and perceptually review the production audiovisual composition"],
          [25, "Prepare and publish the 0.2.0 public release"],
        ],
      },
      {
        issue: 15,
        title: "Establish repeatable browser verification",
        summary:
          "Browser verification anyone can repeat: smoke tests owned by the "
          + "repository, running in continuous integration, credential-free "
          + "browser access for AI reviewers, and written evidence levels that "
          + "stop one kind of proof being mistaken for another.",
        children: [
          [18, "Enable isolated, pinned Playwright MCP access for AI reviewers"],
          [16, "Add repository-owned Playwright browser smoke tests"],
          [17, "Run browser smoke tests in continuous integration"],
          [19, "Document verification evidence levels"],
        ],
      },
      {
        issue: 1,
        title: "One Scene",
        summary:
          "The first playable episode, and with it the architecture everything "
          + "since has been built on: a resistance engine, a scene drawn from "
          + "shapes, a tuned dramatic curve, interruptions, the validated "
          + "episode grammar and a catalogued asset pipeline.",
        children: [
          [2, "Build the core resistance engine"],
          [3, "Create the shape-based bedroom scene"],
          [4, "Tune the 20–30 second dramatic curve"],
          [5, "Add Quick Call and Urgent Email interruptions"],
          [6, "Define the minimum validated episode grammar"],
          [7, "Prove the catalogued image-asset pipeline"],
        ],
      },
    ],

    /** Finished work that belonged to no tranche. */
    separate: [
      [82, "Retire finished work from the roadmap onto a delivered page"],
      [80, "Make the published roadmap complete"],
      [77, "Tell the automated reviewer which rules are invariants"],
      [67, "Derive the site's page list from one place"],
      [31, "Episode vocabulary leaks into the engine and grammar documentation"],
      [30, "Emoji still used as punctuation in game feedback and the README"],
      [29, "Outcome-screen controls read as double-bordered; focus ring collides with the panel stroke"],
      [26, "Make game interface chrome accessible DOM controls"],
    ],
  },
};

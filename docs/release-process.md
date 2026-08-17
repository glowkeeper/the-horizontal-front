# Release process

## Purpose

This document defines the durable readiness and publication rules for public
releases of The Horizontal Front. A release issue records the exact content,
support matrix, revision and evidence for one version; it cannot waive the
project charter, licensing rules or the invariants below.

## Two kinds of release

A **public release** is playable, honest and complete enough to put in front of
people. Everything under [public-release invariants](#public-release-invariants)
applies to it without exception.

A **production release** is a public release that additionally satisfies the
[no-placeholders invariant](#no-placeholders-invariant): nothing provisional
remains, and identity-critical work carries the human authorship the artwork
rules ask for. Version `1.0.0` is reserved for it.

The distinction exists so that shipping is not held hostage to perfection, and
so that perfection is not quietly redefined as whatever happened to ship. A
public release that is not a production release says so, in its release notes
and in this repository, and publishes what it is still missing.

Version `0.2.0` is the first public release. Its artwork is AI-generated under
maintainer direction rather than human-authored, which is precisely the gap
between a public release and a production one. See the artwork rules in
[`AGENTS.md`](../AGENTS.md) and the limitations recorded on the release issue.

## Public-release invariants

Every public release, including `0.2.0`, must:

- preserve the validated game, campaign and episode architecture;
- remain static and fully playable offline after its required files are cached;
- contain no accounts, analytics, advertising, payments, player-data
  transmission or required remote runtime service;
- contain only appropriately licensed software and cultural material with
  complete required provenance;
- state its supported browsers, devices, orientations and input methods from
  evidence rather than assumption;
- record automated/source, browser-flow and human perceptual evidence without
  allowing one level to stand in for another;
- publish known limitations and untested support boundaries honestly; and
- identify one exact revision consistently through its package version, Git
  tag, GitHub release and deployed build.

## No-placeholders invariant

**This invariant governs production releases only.** A public release that does
not meet it is not blocked by it; it is required instead to state plainly which
parts fall short, so that a reader can tell a deliberate interim release from a
finished one. Meeting it in full is what makes a release `1.0.0`.

A production release contains no provisional presentation. Every visual role,
audible role, interface state and outcome required by its authored content is
represented by production-approved material or by an explicitly authored
absence. Prototype material may ship only after it has been deliberately
accepted and reclassified as part of the production language; lack of a
replacement is not approval.

Consequently:

- every distributed catalogue asset is marked `production-approved`, has
  complete provenance and licensing metadata, and carries no unresolved
  replacement instruction;
- filenames, stable IDs and player-visible copy do not describe shipped
  production material as a prototype, placeholder or implementation stage;
- primitive geometry remains only when it is intentionally approved as part of
  the final visual language, not because illustration is missing;
- every required visual role is deliberately composed at supported sizes with
  suitable layering, pivots, bounds and resolution;
- every gameplay and interface event has a deliberately selected semantic
  audio treatment or an explicitly authored silence;
- no temporary sample, browser-default sound, copied melody, unexplained
  omission or generation artefact enters the distributable; and
- the integrated result receives the human perceptual acceptance required for
  its readability, timing, humour, audiovisual coherence and input clarity.

Creating the planned files is necessary but not sufficient. They must also be
integrated, catalogued, provenance-complete, exercised through the production
architecture and accepted at the evidence level appropriate to their role.

## Browser and input support

The initial production target is:

- desktop Google Chrome with keyboard input;
- desktop Google Chrome with pointer input;
- Google Chrome on a real Android device in landscape orientation with touch
  input;
- audio-enabled play; and
- muted play with mechanically equivalent rules and sufficient non-audio
  communication.

Repository-owned Chromium automation remains useful repeatable evidence, but it
does not establish real touchscreen behaviour, Android Chrome support or human
perceptual acceptance. The release record must name the browser versions,
operating systems, devices, viewports, orientations and input methods actually
exercised. Other Chromium browsers, Firefox, Safari and browsers on iOS may work
but are not claimed as supported until release evidence says so.

Accessibility claims follow the same rule. Semantic controls, focus behaviour
and live-region output require player-facing verification; mobile screen-reader
or other assistive-technology support is claimed only for the combinations
actually evaluated.

## Release preparation

Before publication:

1. Accept the release's content, artwork, audio and accessibility dependencies,
   and record anything accepted as interim rather than finished.
2. Freeze a release candidate and record the revision under review.
3. Apply the intended version consistently to package metadata and release
   documentation.
4. Write release notes covering content scope, controls, supported
   environments, accessibility boundaries, licences, provenance, offline use
   and known limitations. Commit them under [`docs/releases/`](releases/README.md)
   as part of the release commit, so the record of what was shipped travels with
   the repository rather than depending on one hosting account. The GitHub
   release record carries the same text.
5. Run the complete automated/source and browser-flow checks against the
   production-shaped build, including `npm run test:offline`, which exercises
   offline play against the built release rather than the dev server. The
   service worker and its precache exist only in the build, so no other check
   can substantiate the offline claim.
6. Record the required human perceptual sessions separately, including real
   touch testing when Android Chrome support is claimed.
7. Confirm that the distributable contains no development browser tooling,
   secrets, unintended remote dependencies or unresolved placeholders.

## Cloudflare publication

The canonical public site is deployed to Cloudflare and automatically deploys
changes merged to `main`. Cloudflare is static hosting infrastructure, not an
application runtime dependency.

For any public release:

1. Prepare the GitHub release record in draft while the accepted release
   candidate is still under review.
2. Merge the exact reviewed release commit to `main` through the protected
   pull-request path.
3. Allow Cloudflare to deploy that commit automatically.
4. Verify the canonical domain, landing page, game, public-document routes,
   source links and offline cache against the deployed commit.
5. Tag that exact `main` commit as `v<version>` and publish the GitHub release
   for the same revision.
6. Record the live verification evidence and any support boundaries in the
   release record.

If live verification finds a material fault, do not publish the draft release
as final. Use Cloudflare's deployment rollback when an immediate hosting
rollback is necessary, then revert or correct `main` through the ordinary
review path so the canonical source and deployed state converge again. A
rollback does not silently transfer a release tag to a different commit.

## Release evidence

Every public release report uses all three headings and the exact claim
language defined in [Verification evidence](verification-evidence.md):

- **Automated/source verified**
- **Browser-flow verified**
- **Human perceptually accepted**

Each is either **Claimed** with the required evidence or **Not claimed** with a
reason. Publication requires the levels named by the release issue; an
unfulfilled required level blocks the release rather than being softened into
a broader unsupported claim.

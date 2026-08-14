# Release process

## Purpose

This document defines the durable readiness and publication rules for public
production releases of The Horizontal Front. A release issue records the exact
content, support matrix, revision and evidence for one version; it cannot waive
the project charter, licensing rules or the invariants below.

The first production release is version `1.0.0`. The current completed vertical
slice remains version `0.1.0` while its production artwork, audio,
accessibility surface and release evidence are being completed under issue
`#21`.

## Production-release invariants

A production release must:

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

1. Accept the release's content, artwork, audio and accessibility dependencies.
2. Freeze a release candidate and record the revision under review.
3. Apply the intended version consistently to package metadata and release
   documentation.
4. Prepare release notes covering content scope, controls, supported
   environments, accessibility boundaries, licences, provenance, offline use
   and known limitations.
5. Run the complete automated/source and browser-flow checks against the
   production-shaped build.
6. Record the required human perceptual sessions separately, including real
   touch testing when Android Chrome support is claimed.
7. Confirm that the distributable contains no development browser tooling,
   secrets, unintended remote dependencies or unresolved placeholders.

## Cloudflare publication

The canonical public site is deployed to Cloudflare and automatically deploys
changes merged to `main`. Cloudflare is static hosting infrastructure, not an
application runtime dependency.

For a production release:

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

Every production release report uses all three headings and the exact claim
language defined in [Verification evidence](verification-evidence.md):

- **Automated/source verified**
- **Browser-flow verified**
- **Human perceptually accepted**

Each is either **Claimed** with the required evidence or **Not claimed** with a
reason. Publication requires the levels named by the release issue; an
unfulfilled required level blocks the release rather than being softened into
a broader unsupported claim.

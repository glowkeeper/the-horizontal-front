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
rules ask for. No version below `1.0.0` may claim it; see
[Versioning](#versioning) for what the number does and does not say.

The distinction exists so that shipping is not held hostage to perfection, and
so that perfection is not quietly redefined as whatever happened to ship. A
public release that is not a production release says so, in its release notes
and in this repository, and publishes what it is still missing.

The distinction is not a theoretical nicety. The first public release, `0.2.0`,
shipped artwork that was AI-generated under maintainer direction rather than
human-authored, which is exactly the gap between the two kinds. Whether that
still describes the current release is answered by that release's own record
rather than by this document, which would go stale asserting it. See the
artwork rules in [`AGENTS.md`](../AGENTS.md).

## Versioning

Releases are numbered under [semantic versioning](https://semver.org/spec/v2.0.0.html).
The [public-release invariants](#public-release-invariants) below require one
exact revision to be identified consistently through its package version, tag,
release record and deployed build. This section says what that number means,
which consistency alone never did.

| Component | Increments when |
| --- | --- |
| Major | Something breaks. Saved campaign progress becomes unreadable, a campaign or episode is withdrawn, or an episode-grammar change invalidates content already authored against it. |
| Minor | Content or capability is added: a campaign, an episode, a mechanic, a widened support matrix. |
| Patch | Neither. Fixes and documentation, as `0.2.1` was — no new content and no rule changes. |

`1.0.0` is a **floor, not a ceiling**. No version below it may claim production
status. A version at or above it may, but the number does not confer the claim:
`1.4.0` is a production release only if it meets the
[no-placeholders invariant](#no-placeholders-invariant), exactly as `1.0.0` had
to. Reaching production is crossing a floor that every later production release
also stands above, not minting one particular number.

### The number does not carry the claim

A version records what changed. The release record states what the release is.
They move independently, and deliberately so: this document already refuses to
let one signal stand in for another, and [release evidence](#release-evidence)
is Claimed with its evidence or Not claimed with its reason, with no level
inferred from a lower one. A version that also encoded a quality claim would be
that same substitution, and a reader would still have to open the record to
learn whether it were true.

The consequence is that production status can be lost and regained without the
numbering becoming strange:

| Change | Version | Release |
| --- | --- | --- |
| Production, one campaign | `1.0.0` | production |
| A second campaign arrives unfinished | `1.1.0` | public, not production |
| That campaign gains an episode | `1.2.0` | public, not production |
| A defect in it is fixed | `1.2.1` | public, not production |
| Its artwork and audio are accepted | `1.3.0` | production |

The last row needs no special number, because no number was carrying the claim.

### Ordering

Version components are unbounded integers rather than digits. `1.10.0` is valid
and is greater than `1.9.0`; nothing rolls over into a major.

The hazard is lexical sorting, which puts `1.10.0` before `1.9.0` and is the
default nearly everywhere: filenames under [`docs/releases/`](releases/README.md),
`git tag` unless told `--sort=v:refname`, and any index built by listing a
directory. Anything that orders releases parses the version and compares
components. The published list in `docs/releases/README.md` is generated that
way for exactly this reason.

Dates cannot substitute for the version here. `v0.2.0` and `v0.2.1` were both
published on 2026-08-17, so the versions order them and the dates do not.

## Public-release invariants

Every public release must:

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
finished one. Meeting it in full is what makes a release a production release.
What number that release then carries is a separate question, answered under
[Versioning](#versioning).

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

### Reporting the invariant

`npm run check:production` prints these clauses one by one, grouped by who can
answer them:

- **Asserted by the report.** Every catalogue asset is `production-approved`,
  carries the provenance and licensing metadata its origin requires, and has
  `replacement` set to `none`. The enumerated `replacement` field is what makes
  the third part decidable; before it existed, the answer was a sentence in
  `replacementNotes` that a build could only find by keyword-matching prose.
- **Enforced elsewhere in the ordinary build.** Prototype vocabulary in
  filenames, stable IDs and player copy is refused by `npm run check:policy`,
  and content validation refuses a soundscape omitting any of the twenty-three
  audio roles.
- **Not decidable by any build.** Approved primitive geometry, deliberate
  composition, the absence of temporary or copied audio material, and human
  perceptual acceptance. The report names these rather than omitting them, so a
  clean run can never be mistaken for a met invariant.

The report exits successfully whatever it finds. A public release may
legitimately ship material that fails this invariant — that is the distinction
this document draws — so gating every build on it would be wrong. Run
`npm run check:production -- --strict` when preparing a production release, and
record its per-clause output as evidence rather than asserting the invariant as
a whole.

## The release record

Release notes open with a header block naming what the release is, before any
prose:

```
Version: 1.1.0
Date: 2026-11-03
Release: public, not production
Summary: A second campaign arrives, unfinished and saying so.
Lifecycle: published
```

Every field is required. `npm run check:docs` refuses a record that omits one,
spells a value it does not recognise, or carries a `Version` disagreeing with
its own filename. These are the claims the rest of this document is about, and
as prose they were unenforceable: two published records had already drifted into
two spellings of the same status before this block existed.

**`Version`** matches the filename and the published tag.

**`Date`** is the publication date as `YYYY-MM-DD`. It is not what orders the
records — the version does that — but it is what a reader needs in order to
judge a support matrix years afterwards.

**`Release`** is `production` or `public, not production`. The negative half is
stated rather than left to be inferred. A production release is by definition
also a public one, so a bare `public` would make the shortfall deducible; being
deducible is not being stated, and stating it is the whole purpose of the
distinction. The field name carries the noun so the values need not repeat it,
and so that `not production` cannot be misread as a claim about deployment.

**`Summary`** is one sentence describing the release. It is what the published
list in [`docs/releases/`](releases/README.md) renders, so that the list is
generated from the records rather than being a second hand-maintained copy of
them.

**`Lifecycle`** is `draft`, `published` or `withdrawn`. A `draft` is a record
committed for a version that is not yet live — notes are written before
publication and travel in the release commit while the GitHub record is still a
draft, so the repository legitimately holds notes for a version nobody can play
yet, and without the field a reader cloning at that moment cannot tell. At most
one record may be a draft, and its version must exceed every published one.
`withdrawn` is a record whose release was rolled back after publication. It has
never happened; it is defined here so that the rollback path below has somewhere
to record its outcome, rather than being invented under the pressure of the
incident that first needs it.

### Why there is no third kind

`Release` has two values because this document defines two kinds of release, and
each is a bar rather than a label: public is the invariant list above, and
production is that list plus the no-placeholders clauses. A third kind — a
development release, or anything else below public — would need its own
invariant list to mean anything at all, and that list could only be the public
invariants minus whichever ones were currently inconvenient. That is exactly the
quiet redefinition of perfection as whatever happened to ship that the two-kinds
distinction exists to prevent. A new kind costs a new invariant list, and this
is recorded plainly because the pressure to add one recurs.

That pressure is real, but it belongs on the lifecycle axis rather than the kind
axis. A frozen release candidate is a `draft`. A build handed to playtesters is
a commit and a playtest record, not a release at all. A rolled-back release is
`withdrawn`. And a release containing unfinished content is an ordinary public
release whose content scope says which part is unfinished, which is the subject
of the next section.

### What a release claims about its content

Production status is a property of the release as a whole, and it is the minimum
over everything the release contains: one unapproved asset anywhere and the
release is not a production release. That does not change.

What a minimum cannot do is describe a game holding more than one campaign. Once
an unfinished campaign can arrive alongside a finished one, "not a production
release" is true of the whole and silent about the parts, and the finished
campaign is not merely demoted by it but erased from the record. So a release
states production status per campaign, beneath the release-level line:

    ## Content scope

    - **The Monday Uprising** — production quality. Unchanged since 1.0.0.
    - **The Night Shift** — not production quality. Contributor-supplied AI
      artwork; the audio mix is a first pass. Detailed under known limitations.

This is the shape the [support matrix](#browser-and-input-support) already uses:
a claim scoped to what it actually covers, naming what was exercised and what
was not, rather than one global yes or no.

The unit is the campaign rather than the episode. A campaign is what a player
sits down to, and the human perceptual acceptance the invariant requires is a
judgement about an integrated result. A campaign with one unfinished episode out
of twelve is not a production campaign: its line says so, and known limitations
names the episode. The list is therefore always as long as the number of
campaigns.

`npm run check:production` reports over the whole catalogue and does not yet
scope its report by campaign. Doing so needs campaign-level ownership, which is
[#54](https://github.com/glowkeeper/the-horizontal-front/issues/54). The rule is
recorded here first because it is decidable now, and because a check should
implement a settled rule rather than reopen one.

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
   documentation, choosing it under [Versioning](#versioning), and open the
   release notes with the header block [the release record](#the-release-record)
   requires.
4. Write release notes covering content scope, controls, supported
   environments, accessibility boundaries, licences, provenance, offline use
   and known limitations. Content scope states production status for each
   campaign, not only for the release as a whole. Commit them under [`docs/releases/`](releases/README.md)
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

## The protected pull-request path

Changes reach `main` only through a pull request. The `Protect main` ruleset
enforces this, and the publication sequence below depends on it:

<!-- generated:protect-main -->
| Rule | Setting |
| --- | --- |
| Pull request required | yes |
| Direct push to the branch | refused |
| Branch deletion | refused |
| Force push | refused |
| Permitted merge methods | squash only |
| Linear history | required |
| Review threads resolved before merge | required |
| Approving reviews required | none |
| Extra approval for changes GitHub cannot attribute | required |
| Branch up to date with the base before merge | required |
| Status checks that must pass | `Verify`, `Browser smoke tests`, `Offline play` |
<!-- /generated:protect-main -->

This table is generated from the project's record of the ruleset, and
`npm run check:ruleset` compares that record against what GitHub actually
enforces. A ruleset edited in the web interface and not recorded here fails
that check rather than leaving this page quietly wrong.

The status checks, rather than a reviewer, are what gate a merge in practice.
`Verify` covers unit tests, type checking, content validation and the build.
The other two cover what a release actually claims to a player: that the game
is playable by keyboard, pointer and touch, and that it still plays with the
origin gone. Requiring all three is what stops a merge being offered while the
evidence for those claims is still running, or after it has failed.

The maintainer retains a pull-request bypass. Its purpose is to prevent an
accidental merge, not to lock anyone out.

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
5. Tag that exact `main` commit as an annotated `v<version>` tag and publish
   the GitHub release for the same revision.
6. Record the live verification evidence and any support boundaries in the
   release record.

Release tags are annotated, not lightweight. An annotated tag is an object in
its own right, recording who tagged the revision and when, independently of the
commit's own authorship. That suits a project which treats provenance as a
first-class concern, and it is what `git describe` and signature workflows
expect. `v0.2.0` was created lightweight before this was settled and is left as
it is, because moving a published tag is worse than an inconsistent record of
how it was made; `v0.2.1` onwards are annotated.

If live verification finds a material fault, do not publish the draft release
as final. Use Cloudflare's deployment rollback when an immediate hosting
rollback is necessary, then revert or correct `main` through the ordinary
review path so the canonical source and deployed state converge again. A
rollback does not silently transfer a release tag to a different commit. A
release that was already published and is then rolled back has its record's
`Lifecycle` set to `withdrawn`, which is the one edit to a published record this
document asks for beyond correcting a factual error.

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

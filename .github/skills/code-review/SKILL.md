---
name: code-review
description: Review guidance for The Horizontal Front. Use when reviewing a pull request in this repository, to decide which project-specific faults are worth raising — the invariants its build deliberately cannot check, and the things already enforced or merely house style that are noise to report.
license: CC-BY-SA-4.0
---

# Reviewing The Horizontal Front

You already read [`AGENTS.md`](../../../AGENTS.md) as this repository's
instructions, so you are not short of rules. This file does not repeat them —
a second copy of the rules is the drift the project removes wherever it finds
it, and it would be worse here than anywhere because nobody would think to
audit it.

What this file says is **which faults are worth raising**. The project checks
most of its rules in the build and writes down the ones it cannot; that
remainder is what review is for, and it is short enough to hold in mind.

## Raise these

### Register leaks

Three registers, defined in [`AGENTS.md`](../../../AGENTS.md): game level may
say bed, duvet and Management freely; engine and grammar level says resistance,
safety, opposing actor and apparatus; episode level is where a duvet is exactly
the right word. Naming one campaign's furniture in an engine document tells a
later author that a field does not apply to them.

The test is whether the **definition** depends on the example. Quoting a
campaign's demand to illustrate a general mechanism is good writing; defining
the mechanism as that campaign's is the leak. `AGENTS.md` says outright that
this is review discipline rather than a `check:policy` rule, so nothing else
will catch it.

### Evidence claims that do not match the diff

Every pull request states three levels from
[`docs/verification-evidence.md`](../../../docs/verification-evidence.md), each
Claimed with evidence or Not claimed with a reason. No level may be inferred
from a lower one.

Check the claim against the files actually changed. A pull request saying
"documentation only, browser-flow not claimed" while modifying anything under
`src/` has made a false claim, however small the change. This has already
happened.

### Documentation asserting behaviour the code does not have

The build checks that documented identifiers exist and that generated regions
match their sources. It cannot check a behavioural sentence. "The work light
cannot weaken as danger rises" is either true or it is not, and only a reader
knows.

Be sceptical of any new sentence describing what the engine guarantees,
refuses, or validates. A documentation audit found three validation rules
described as implemented that did not exist.

### A fresh person-coded likeness

Management is a fictional grotesque, never a depiction or coded stand-in for a
real person. `check:policy` fails the build on retired phrases, and by
construction cannot catch a new likeness written in new prose, a new artwork
brief or a new generation prompt. Watch for a real figure's appearance,
mannerisms, costume or signature traits arriving as shorthand.

### Release records and version numbers

Defined under [Versioning](../../../docs/release-process.md#versioning) and
[The release record](../../../docs/release-process.md#the-release-record).
Raise: production status being encoded in a version number rather than stated
in the record; a status claim written as prose where the header block belongs;
an index of releases maintained by hand rather than generated; and anything
ordering versions by string comparison, which puts `1.10.0` before `1.9.0`.

### The direction of the satire

[Where the joke points](../../../docs/game-concept.md#where-the-joke-points) is
the authority. Raise content whose joke lands on the worker rather than on
Management, that drifts into a game about being tired and needing rest, that
punches down instead of up, that writes failure as empty slapstick, or that
introduces a currency, streak, grind or upgrade economy whose absence is part
of the satire.

This applies to player-visible copy, campaign and episode prose, artwork briefs
and the public site alike.

## Already enforced — do not re-report

These fail the build. Repeating them costs attention and tells the author
nothing they will not learn from CI:

- authored presentation values or theme roles under `src/play/phaser/`, and
  episode, campaign, asset or layout IDs written as TypeScript literals;
- prototype vocabulary in filenames, stable IDs or player copy, and emoji in
  validated player-visible content;
- retired person-coded phrases;
- broken documentation links, missing heading anchors and repository paths that
  do not exist;
- generated regions that no longer match their sources — the audio roles, the
  phase table, the `Protect main` ruleset, the roadmap and the published
  release list;
- release records with a missing or misspelt header field, a version
  disagreeing with its filename, or more than one draft.

## House style — not defects

- British spelling, and prose that argues its own reasoning at length. Commit
  messages and pull request bodies here are deliberately discursive; brevity is
  not an improvement.
- [`docs/history/`](../../../docs/history/) and
  [`docs/research/`](../../../docs/research/) are dated records, not current
  authorities. They are expected to describe superseded thinking, and correcting
  them would destroy the record of what was once thought.
- Published release notes under [`docs/releases/`](../../../docs/releases/) are
  not edited after publication except to correct a factual error. A note that
  describes a rule which has since changed is a historical document behaving
  correctly.
- Concrete, workplace-bound writing at game level. The specificity is what makes
  the satire land; raising the abstraction would dilute it into the sleep,
  wellness or productivity game the project refuses.

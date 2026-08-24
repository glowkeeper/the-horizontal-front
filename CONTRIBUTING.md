# Contributing

Thank you for helping build The Horizontal Front as a digital commons.

Read the [project charter](PROJECT_CHARTER.md), [governance process](GOVERNANCE.md) and relevant design documents before proposing a change. Contributions must preserve the game's anti-capitalist satire and the charter's protected commitments.

## Where to read next

The [documentation index](docs/README.md) routes different kinds of work to
their authoritative references:

- Episode writing and composition: [episode grammar
  reference](docs/episode-grammar-reference.md).
- Content ownership, catalogues or new capabilities: [content
  architecture](docs/content-architecture.md).
- Engine, Phaser presentation, build or delivery: [technical
  architecture](docs/technical-architecture.md).
- Product or creative direction: [game concept](docs/game-concept.md) and
  [design decisions](docs/design-decisions.md).
- Research-led interaction decisions: [research index](docs/research/README.md).

## Before starting

- Use the public issue tracker for bugs and proposals.
- Discuss material product, architecture, dependency, funding or governance changes before implementing them.
- Keep changes small and explain their purpose and important trade-offs.
- Do not combine unrelated reformatting or speculative features with the contribution.
- Do not submit third-party material without clear provenance and redistribution terms.

## How changes reach `main`

Work happens on a branch and arrives through a pull request. Nothing is pushed
to `main` directly.

Branch names take a prefix describing the kind of work:

| Prefix | For |
| --- | --- |
| `feature/` | A new capability, mechanic or piece of tooling. |
| `bugfix/` | Repairing behaviour that was already meant to work. |
| `docs/` | Changes whose product is documentation, including process and decision records. |
| `release/` | Preparing a release, named for its version, as in `release/0.2.1`. |

Follow the prefix with a short hyphenated description rather than an issue
number, so the branch says what it does: `feature/repeatable-browser-verification`
rather than `feature/20`.

The `Protect main` ruleset enforces the rest, and [the protected pull-request
path](docs/release-process.md#the-protected-pull-request-path) records it in
full: a pull request is required, squash is the only merge method, history on
`main` stays linear, review threads must be resolved, and the required status
checks must pass before a merge is offered.

Three checks currently gate a merge: `Verify`, `Browser smoke tests` and
`Offline play`. A fourth, `Cloudflare Pages`, reports on every pull request and
does **not** gate one — it is the hosting preview building, not a verification
of the change. No approving review is required either, so in practice those
three checks are the gate.

## What a good pull request contains

Fill in [the pull-request template](.github/pull_request_template.md) rather
than replacing it. Beyond the template, a useful pull request here:

- links the issue it advances, and says which acceptance criteria it meets and
  which it deliberately leaves open;
- explains the purpose and the trade-offs in plain language, not only what
  changed;
- reports verification as [verification](#verification) below requires; and
- says when a decision was settled in discussion rather than derived from the
  documents, so the reasoning survives the merge; and
- names the document it updated, when it changes a schema, an engine type, a
  validated vocabulary or a validation rule.

That last one exists because prose about code goes stale silently. Some of it
is now checked — the grammar reference generates the passages that restate a
schema, and a documented identifier must exist in the source — but no check
knows whether a described *behaviour* is still true. Saying which document
states the rule you changed is how that gets noticed by a reader, which is the
only thing that can notice it.

## Charter check

Before submitting work, answer these questions:

- Does it preserve free access and avoid advertising, purchases, artificial scarcity and paid advantages?
- Does it avoid tracking, analytics, player-data transmission and manipulative engagement mechanics?
- Does it preserve static hosting and offline play without accounts, a backend or permanent remote services?
- Does it preserve accessibility, translation potential and support for modest hardware?
- Are its dependencies and assets compatible with eventual free/open-source distribution?
- Does it keep decisions accountable to players and contributors rather than funders or platforms?
- Does it avoid weakening the project's anti-enclosure commitments?

If any answer is uncertain, open an issue before proceeding.

## Verification

Run the smallest checks relevant to the change. For application integration, run:

```sh
npm run build
```

The build includes the automated project-policy and documentation-integrity
checks. Run focused unit tests for engine rules and validate episode content
when those areas change.

Report verification using the three authoritative levels in [verification
evidence](docs/verification-evidence.md). For each level, state **Claimed** with
the required evidence or **Not claimed** with the reason; never promote source
checks into browser evidence or browser automation into human acceptance.
Acceptance criteria should require only the levels proportionate to the change.
A schema or content correction may need only automated/source verification; a
navigation or input change usually needs browser-flow verification as well; and
rhythm tuning, visual clarity, humour or game feel commonly need all three.
[Choosing required levels](docs/verification-evidence.md#choosing-required-levels)
is the authoritative version of that judgement.

When browser-flow evidence is required, follow the [browser-verification
guide](docs/browser-verification.md). Run its repeatable smoke suite with
`npm run test:browser` and use the isolated browser configuration for AI review.

## Licensing contributions

Software contributions are submitted under `AGPL-3.0-or-later`. Original writing, documentation, artwork, music, sound and other cultural contributions are submitted under `CC-BY-SA-4.0`, unless an explicit asset record establishes a compatible exception.

By intentionally submitting work for inclusion, you agree that it may be distributed under the applicable project licence and represent that you have the necessary rights to contribute it. You retain copyright in your contribution. Read the [licensing guide](LICENSE.md) and keep authorship and asset provenance clear.

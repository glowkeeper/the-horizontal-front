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

## Licensing contributions

Software contributions are submitted under `AGPL-3.0-or-later`. Original writing, documentation, artwork, music, sound and other cultural contributions are submitted under `CC-BY-SA-4.0`, unless an explicit asset record establishes a compatible exception.

By intentionally submitting work for inclusion, you agree that it may be distributed under the applicable project licence and represent that you have the necessary rights to contribute it. You retain copyright in your contribution. Read the [licensing guide](LICENSE.md) and keep authorship and asset provenance clear.

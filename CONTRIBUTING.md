# Contributing

Thank you for helping build The Horizontal Front as a digital commons.

Read the [project charter](PROJECT_CHARTER.md), [governance process](GOVERNANCE.md) and relevant design documents before proposing a change. Contributions must preserve the game's anti-capitalist satire and the charter's protected commitments.

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

The build includes the automated project-policy check. Run focused unit tests for engine rules and validate episode content when those areas change.

## Licensing while selection is pending

The project intends to choose copyleft licences for software and appropriate share-alike licences for cultural materials, but the exact licences are not yet decided. Do not add a licence header, change package licence metadata or assume contribution terms until that decision has been recorded.

Contributions submitted before licence selection may need explicit confirmation from their contributors before a future licence can cover them. Keep authorship and asset provenance clear.

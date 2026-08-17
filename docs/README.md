# Documentation

The Horizontal Front documentation is organised by audience and authority. Use
the shortest route that fits the work you are doing.

## I want to understand the game

Start with the [game concept](game-concept.md) for the player fantasy, satire,
core loop, sources of variety, tone, presentation and accessibility direction.
Settled choices and rejected alternatives are recorded in [design
decisions](design-decisions.md).

## I want to author an episode

The [episode grammar reference](episode-grammar-reference.md) is the
authoritative contract for every field and rejection rule currently implemented.
It is written for authors and non-programmer creators. The [content
architecture](content-architecture.md) explains how episodes fit into shared
catalogues, campaigns, ownership namespaces and the production workflow.

## I want to change the engine or presentation

Read the [technical architecture](technical-architecture.md), then the [content
architecture](content-architecture.md) when a change touches compilation,
ownership, catalogues or engine vocabulary. Any grammar expansion must also
update the [episode grammar reference](episode-grammar-reference.md).

## I want to report what has been verified

Use [verification evidence](verification-evidence.md) as the authoritative
vocabulary for automated/source verification, browser-flow verification and
human perceptual acceptance. It defines the evidence each level requires and
the claims each level cannot support.

## I want to verify the browser experience

Read [browser verification](browser-verification.md) for the operational setup:
the isolated, credential-free Playwright MCP reviewer, repository-owned browser
tests, CI execution and diagnostic artefacts. Report the result using the
authoritative [verification evidence](verification-evidence.md) vocabulary.

## I want to prepare a release

Read [release process](release-process.md) for the difference between a public
release and a production release, the invariants every public release must meet,
supported environment claims, the no-placeholders rule that governs production
releases alone, versioning and the Cloudflare publication and rollback
sequence, and [releases](releases/README.md) for the notes published with each
version. Read [art direction](art-direction.md)
before producing, integrating or approving visual assets. Exploratory sheets
are preserved separately under [art development](art/README.md); their presence
there does not make them production assets.

## I want to make or review a design decision

Read the [game concept](game-concept.md), [design
decisions](design-decisions.md) and the relevant material in
[research](research/README.md). Research notes preserve the distinction between
published evidence and project inference; summaries elsewhere are not a
substitute for that context.

## Authority map

| Subject | Authoritative home |
| --- | --- |
| Binding commons commitments | [`PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) |
| Governance process | [`GOVERNANCE.md`](../GOVERNANCE.md) |
| Identity and good-faith forks | [`IDENTITY.md`](../IDENTITY.md) |
| Licensing and provenance | [`LICENSE.md`](../LICENSE.md) |
| Product intent and creative direction | [Game concept](game-concept.md) |
| Settled design reasoning | [Design decisions](design-decisions.md) |
| Accepted episode vocabulary | [Episode grammar reference](episode-grammar-reference.md) |
| Content hierarchy, ownership and expansion | [Content architecture](content-architecture.md) |
| Runtime and delivery architecture | [Technical architecture](technical-architecture.md) |
| Verification claims and evidence levels | [Verification evidence](verification-evidence.md) |
| Browser-review tooling and safety | [Browser verification](browser-verification.md) |
| Production release readiness and publication | [Release process](release-process.md) |
| Provisional production visual direction | [Art direction](art-direction.md) |
| Exploratory visual-development artefacts | [Art development](art/README.md) |
| Evidence and design inferences | [Research index](research/README.md) |

Some defining constraints are intentionally repeated for the audience that
needs them at the moment of action. A summary should identify and link to its
authoritative home rather than silently becoming a second specification.

## Historical material

The [history index](history/README.md) preserves superseded discussions whose
reasoning remains useful. Historical files are not current specifications; the
authoritative replacement is linked from each current decision record.

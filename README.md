# The Horizontal Front

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![CI](https://github.com/glowkeeper/the-horizontal-front/actions/workflows/ci.yml/badge.svg)](https://github.com/glowkeeper/the-horizontal-front/actions/workflows/ci.yml)
[![Code: AGPL-3.0-or-later](https://img.shields.io/badge/code-AGPL--3.0--or--later-b8322a.svg?style=flat-square)](LICENSES/AGPL-3.0-or-later.txt)
[![Cultural work: CC BY-SA 4.0](https://img.shields.io/badge/cultural%20work-CC%20BY--SA%204.0-3e6f8f.svg?style=flat-square)](LICENSES/CC-BY-SA-4.0.txt)
[![Tracking: none](https://img.shields.io/badge/tracking-none-c8952e.svg?style=flat-square)](PROJECT_CHARTER.md)

**Seize the Means of Relaxation.**

> **The Horizontal Front is a free, open-source game about collective power, mutual aid, and resistance to hierarchical systems. It is developed as a digital commons: freely accessible, community-supported, and accountable to its players rather than investors or advertisers.**

The Horizontal Front is a satirical web and mobile arcade game about fighting to stay in bed while an overbearing boss tries to tip the player out and drag them into work.

The central joke is deliberately contradictory: the player must perform exhausting, repetitive labour to earn the right to do absolutely nothing.

The project's public home is **[thehorizontalfront.org](https://thehorizontalfront.org)**. Its source, history, proposals and issue tracker are in the public **[GitHub repository](https://github.com/glowkeeper/the-horizontal-front)**.

## Table of contents

- [Background](#background)
- [Documentation](#documentation)
- [Project status](#project-status)
- [Install](#install)
- [Development](#development)
- [Project structure](#project-structure)
- [Governance](#governance)
- [Maintainer](#maintainer)
- [Contributing](#contributing)
- [Licensing](#licensing)

## Background

The project is governed by the following digital-commons commitments:

- **Free to play:** no purchase price, advertising, loot boxes, premium currency, pay-to-win mechanics or paid access.
- **Free/open-source distribution:** people may inspect, share, study and adapt the software and distributable project materials under reciprocal licences.
- **No surveillance or manipulation:** no player tracking, behavioural analytics, sale or transmission of player data, or manipulative engagement and retention mechanics.
- **Community participation:** development takes place in public, with an accessible issue tracker, contribution guidance and a clear process for proposing changes.
- **Transparent voluntary support:** material funding sources and major expenses will be disclosed. Support cannot purchase access, gameplay advantages or control.
- **Accessible by design:** modest hardware requirements, accessibility settings, translation and offline play are design requirements.
- **Anti-enclosure governance:** the canonical project cannot be sold, enclosed behind a paywall or converted into an advertising or data-extraction platform.
- **Static and offline-capable:** after the required files are cached, play does not depend on an account, application server, network connection or commercial platform remaining available.

Educational notes connecting the game to mutual aid, labour history, enclosure, collective action and horizontal governance are a future ambition rather than a current requirement.

The binding commitments are in the [project charter](PROJECT_CHARTER.md).

## Documentation

The [documentation index](docs/README.md) routes players, contributors, episode
authors, developers and design reviewers to the right authoritative document.
The working game brief is the [game concept](docs/game-concept.md); engine and
delivery decisions are in the [technical
architecture](docs/technical-architecture.md); ownership and catalogue rules are
in the [content architecture](docs/content-architecture.md). Episode authors
should start with the [episode grammar
reference](docs/episode-grammar-reference.md). Verification reports use the
three levels defined in [verification evidence](docs/verification-evidence.md).

## Project status

The project is in early development. This repository contains the public static site, the initial Phaser game scaffold and the working design and governance documents.

Details will continue to evolve deliberately. Free access, open distribution, privacy, accessibility, offline capability, public accountability and protection from enclosure are project constraints rather than provisional aspirations.

## Install

The project requires Node.js `24.11.0` and npm. The Node version is pinned in `.nvmrc`; compatible version managers can select it automatically. Clone the repository and install the locked dependency versions:

```sh
git clone https://github.com/glowkeeper/the-horizontal-front.git
cd the-horizontal-front
npm ci
```

No account, API key, environment file, backend or database is required.

## Development

Start the local development server:

```sh
npm run dev
```

The principal routes are:

- `/` — the public introduction and digital-commons commitments.
- `/play/` — the Phaser game; this is the only route that loads Phaser.
- `/commons/` — the commitments and public record in plain language.
- `/charter/`, `/governance/`, `/identity/`, `/contribute/` and `/licences/` — public pages generated from the canonical repository documents.

Useful project commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Generate the public-document pages and start Vite. |
| `npm run browser:install` | Install locked Chromium and any required host dependencies for browser verification. |
| `npm run test:browser` | Run the repository-owned Chromium smoke tests against the real game. |
| `npm run build` | Run policy and type checks, build every route and prepare the offline cache. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the Vitest test suite. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run check:docs` | Check internal documentation links, anchors and referenced repository paths. |
| `npm run check:policy` | Check the project’s architectural, privacy and charter constraints. |
| `npm run validate:content` | Validate every campaign, episode, mechanic and presentation selection with author-readable errors. |
| `npm run check:static` | Check the generated static and offline-capable build. |

## Project structure

- `src/play/` contains the functional game engine, Phaser integration, game presentation and game-specific styles.
- `src/site/` contains the public-site entry, static page templates and site styles.
- `src/shared/` contains infrastructure genuinely shared by the site and game, including semantic theme tokens and service-worker registration.
- `docs/` contains the audience-routed game, authoring, content architecture,
  technical architecture, design-decision and research documents.
- `scripts/` contains repository-level generation, build finalisation and policy-checking tools.
- `public/` contains static assets and the service worker.

Root route files and directories such as `index.html`, `play/`, `commons/` and the governance routes are ignored build intermediates generated for Vite. They are not source locations.

## Governance

The Horizontal Front is currently maintainer-led. That describes its present stewardship honestly; it does not give the maintainer authority to waive the charter’s protected commitments.

Routine decisions may be made directly. Material product, architecture, governance or funding decisions require a public proposal and an explicit decision. Anyone may raise a charter concern through the public issue tracker.

Read the [governance process](GOVERNANCE.md), [project charter](PROJECT_CHARTER.md) and [community identity policy](IDENTITY.md) before proposing a material change.

## Maintainer

[Steve Huckle](https://huckle.studio/) ([@glowkeeper](https://github.com/glowkeeper)) is the current project maintainer and repository owner.

New maintainers may be appointed through the public process described in the governance document.

## Contributing

Contributions, proposals and charter challenges are welcome. Please read the [contribution guide](CONTRIBUTING.md), then use the [public issue tracker](https://github.com/glowkeeper/the-horizontal-front/issues) to discuss material work before implementation.

Contributions must preserve the project charter, remain understandable and keep authorship, licensing and asset provenance clear.

## Licensing

The project deliberately uses two reciprocal licences for different kinds of work:

- Software is licensed under the [GNU Affero General Public License 3.0 or later](LICENSES/AGPL-3.0-or-later.txt).
- Original writing, documentation, artwork, music, sound and other cultural material are licensed under [Creative Commons Attribution-ShareAlike 4.0](LICENSES/CC-BY-SA-4.0.txt), unless an asset record identifies a necessary exception.

See the [licensing guide](LICENSE.md) for scope, attribution, exceptions and provenance requirements.

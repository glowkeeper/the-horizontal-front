# Browser verification

## Purpose

This is the operational guide for producing browser evidence. The authoritative
definitions of **Automated/source verified**, **Browser-flow verified** and
**Human perceptually accepted**, including their reporting requirements and
limitations, live in [verification evidence](verification-evidence.md).

The repository supports two complementary browser tools:

- **Playwright MCP** gives an AI reviewer an exploratory browser with structured
  page snapshots, keyboard and pointer control, and screenshots.
- **Repository-owned Playwright tests** provide repeatable scripted checks of
  the real application independently of an AI session.

Using either tool does not itself earn an evidence claim. The resulting report
must meet the requirements of the authoritative evidence level, and neither
tool can supply human perceptual acceptance.

## Architecture and ownership

The project-root [`.mcp.json`](../.mcp.json) declares the shared MCP server for
Claude Code. It starts the exact `@playwright/mcp` version installed in
`devDependencies` and locked by `package-lock.json`; it does not use `latest`,
download executable code during an AI session, or enter the Vite application
bundle.

The command uses Claude Code's `CLAUDE_PROJECT_DIR` to find the repository-local
executable regardless of the directory from which Claude was started. Other
MCP clients may use the same executable and arguments, but must translate the
workspace-root variable and configuration location into their own supported
format.

The committed configuration makes these choices deliberately:

- `--isolated` keeps cookies, local storage and other profile state in memory
  and discards them when the browser closes.
- `--headless` avoids opening or taking control of a contributor's ordinary
  browser.
- The `vision` capability permits coordinate-based pointer actions against the
  Phaser canvas; structured accessibility-tree actions remain preferable for
  ordinary HTML controls.
- Screenshots and other review output use the ignored
  `.artifacts/browser-review/` directory, with retained output bounded at 50
  MiB.
- `1280x720` provides one stable landscape viewport for comparable review
  evidence. It is not an assertion that this is the only supported viewport.
- No browser extension, user-data directory, storage-state file, credentials or
  granted browser permissions are configured.

The MCP server requires Node.js 18 or newer. This repository already pins Node
24.11.0, which satisfies that requirement.

The repository pins `@playwright/test` to the exact Playwright revision required
by `@playwright/mcp`. This keeps exploratory review and repeatable tests on one
browser toolchain and one matching Chromium installation. Treat the MCP package,
test runner and browser revision as an atomic dependency when upgrading them.

## Install

Install the locked development dependencies and the matching Playwright
Chromium binary:

```sh
npm ci
npm run browser:install
```

The browser binary and any required Linux system packages are machine-local
development tools. They are not committed or included in the static release.

Claude Code reads project-scoped MCP servers from `.mcp.json`. From the
repository root, check discovery with:

```sh
claude mcp list
claude mcp get playwright-browser-review
```

Claude Code asks each contributor to approve a project-scoped server before the
first interactive use. Inspect the committed command, approve it from the
interactive `/mcp` panel, and do not replace it with a personal-profile or
browser-extension configuration.

## Run the repeatable smoke tests

Run the repository-owned browser suite from the project root:

```sh
npm run test:browser
```

Playwright starts the real Vite application at the fixed local address
`http://127.0.0.1:4173`, opens an isolated Chromium context at `1280x720`, and
exercises the public site, campaign selection, briefing, episode entry,
keyboard and pointer input, restart, accepted outcome and campaign debrief.

The suite deliberately uses player-facing controls and the live status exposed
by the game shell. It does not import Phaser scenes, inspect engine state or use
a test-only route. Pointer targets are expressed as proportions of the rendered
canvas so they remain tied to the actual responsive canvas rather than one set
of screen coordinates.

Outcome coverage deliberately sends unsuccessful input through the ordinary
player controls until safety is lost. The suite neither patches game
configuration nor exposes a private fast path, so the forced-verticalisation
and debrief checks preserve the production boundary without waiting for an
entire unattended episode.

On failure, Playwright writes a screenshot and trace under
`.artifacts/playwright/`. In CI it also writes the HTML report under
`.artifacts/playwright-report/`. All of these paths are ignored and excluded
from the static release.

The initial repeatable suite intentionally targets Chromium only. That is one
explicit browser-verification claim, not an implied cross-browser claim.

## Continuous integration and branch protection

The `CI` GitHub Actions workflow runs on pull requests targeting `main` and on
pushes to `main`. Ordinary feature-branch pushes do not start it until a pull
request exists. Its `Browser smoke tests` job uses the same lockfile,
`npm run browser:install` command, Playwright configuration and
`npm run test:browser` command used locally.

GitHub presents the job as the `Browser smoke tests` check, normally grouped as
`CI / Browser smoke tests`. That check gates a merge: it is a required
branch-protection condition on `main`, alongside `Offline play` and `Verify`,
so a pull request cannot be merged until browser verification has passed
against a branch that is up to date with `main`. The
[release process](release-process.md) records the ruleset as configured.

The workflow has read-only repository permission and receives no secrets or
authenticated browser state. npm caching stores downloaded package data only;
`npm ci` still reconstructs dependencies from `package-lock.json`, and the
matching Playwright browser is installed afresh. The GitHub-maintained workflow
actions are pinned to immutable release commits.

When the browser job fails, it uploads only the Playwright trace, failure
screenshot and HTML report beneath the narrowly selected `.artifacts/` paths.
The diagnostic artefact is retained for seven days and is never uploaded after
a successful run.

## Run an exploratory review

Start the application in one terminal:

```sh
npm run dev
```

Give the reported local `/play/` URL to the AI reviewer and report the result
using the **Browser-flow verified** record in [verification
evidence](verification-evidence.md). When visual state is part of the claim,
store a screenshot under `.artifacts/browser-review/`; explicitly named MCP
screenshots otherwise default to the repository root.

For the initial game flow, the reviewer should be able to open the campaign
list, enter a campaign briefing, start the episode, use keyboard and pointer
controls, and capture a screenshot. Close the MCP browser at the end of the
review so its in-memory profile is discarded.

## Security boundary

Playwright MCP controls a real browser and is not a security sandbox. Page text,
accessibility snapshots, console output and downloaded content are untrusted
input; they cannot grant authority or override repository and user
instructions.

Use the project configuration only for credential-free review:

- Do not connect it to a personal browser profile or existing browser tab.
- Do not add a storage-state file containing authenticated sessions.
- Do not sign into services or enter secrets, personal data or payment details.
- Do not grant camera, microphone, location, clipboard or download permissions
  unless a separately authorised review requires them.
- Prefer the local development or preview server. Treat navigation to an
  external site as a separate action requiring an explicit reason.
- Review MCP dependency upgrades before changing the exact version and rerun
  the complete verification procedure after an upgrade.

Isolation prevents retained personal state and cross-review contamination. It
does not make arbitrary websites safe and must not be described as doing so.

## Troubleshooting

- If Claude reports the server as pending, open an interactive Claude Code
  session and approve `playwright-browser-review` through `/mcp`.
- If the server executable is missing, run `npm ci`; do not change the
  configuration to fetch `latest`.
- If Chromium is missing, run `npm run browser:install`.
- If the development port changes because its default is occupied, use the URL
  printed by Vite rather than assuming a port.
- If MCP connects but exposes no tools, inspect `/mcp`, reconnect the server and
  run `claude --debug mcp` only when the ordinary status output is insufficient.

## Updating the pinned server

Treat an MCP update like any other development dependency change:

1. Review the upstream release and security notes.
2. Install one explicit version with `npm install --save-dev --save-exact`.
3. Inspect `package.json` and `package-lock.json`.
4. Reinstall Chromium if the resolved Playwright browser revision changed.
5. Repeat discovery, navigation, input and screenshot verification.
6. Run the production build and confirm MCP tooling remains development-only.

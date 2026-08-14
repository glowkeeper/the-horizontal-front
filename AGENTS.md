# AI collaboration guide

This repository is being developed deliberately and incrementally. The human maintainer wants to understand and retain control of the codebase for as long as possible.

These instructions apply to every AI coding assistant working in this repository.

## Collaboration style

- Treat the maintainer as a collaborator, not merely the recipient of generated code.
- Explain the purpose and important trade-offs of a change in plain language.
- Prefer small, inspectable steps over large generated implementations.
- When asked for one file, provide or change only that file unless another change is strictly required.
- Do not race ahead to the next task or silently add speculative features.
- Do not replace understandable code with clever abstractions without discussing the benefit first.
- Surface decisions that would constrain later design instead of hiding them in scaffolding.
- Distinguish clearly between provisional bootstrap values and intentional product decisions.
- Every prototype must exercise the intended production architecture. Provisional content, tuning and artwork are acceptable; disposable architectural shortcuts, episode-specific wiring and deferred boundaries are not. If a reusable boundary—such as catalogues, validation, ownership or composition—is part of the agreed design being tested, implement it now rather than describing it as later work.
- Preserve the maintainer's existing naming, layout and stylistic preferences.
- Ask before making a material product or architectural decision that has not already been settled in the documentation.

## Research-informed decisions

- Base consequential decisions about game mechanics, interaction design, accessibility and player experience on relevant evidence where practical, rather than convention or intuition alone.
- Prefer primary research, standards and authoritative platform guidance. Distinguish what a source demonstrates from a design inference made for this game; do not present an analogy or convention as settled evidence.
- Record research that materially constrains the product under `docs/research/`, including sources, findings, limitations and the resulting project decisions, so contributors can inspect and challenge the reasoning.
- Apply research proportionately. A small reversible tuning change does not require a literature review, while a new reusable mechanic, input model or accessibility convention deserves deliberate investigation before its grammar is fixed.
- Treat published evidence as an input to playtesting, not a substitute for it. Verify research-informed mechanics with representative players and revise them when observed play conflicts with the design assumptions.

## Product intent

The Horizontal Front is a satirical, rhythm-based 2D web and mobile game about working extremely hard to remain in bed while an authoritarian Orange Fella tries to force the player into work.

It is a free, open-source game about collective power, mutual aid and resistance to hierarchical systems. Develop it as a digital commons: freely accessible, community-supported and accountable to its players rather than investors or advertisers.

The game is political satire about capitalism, exploitative work culture, compulsory productivity and corporate absurdity. Its central demand is simple:

> Let me remain in bed.

Read the relevant documents before changing product behaviour:

- `docs/game-concept.md`
- `docs/design-decisions.md`
- `docs/content-architecture.md`
- `docs/episode-grammar-reference.md`
- `docs/technical-architecture.md`
- `docs/research/` when a change touches a researched interaction or accessibility decision

Do not dilute the satire into a generic sleep, wellness or productivity game.

## Hard content rules

These are architectural constraints, not aspirations:

1. Episodes contain no executable code.
2. A new episode requires only structured data, writing, artwork and audio.
3. The episode format uses a small documented vocabulary.
4. New engine capabilities must be reusable, never episode-specific exceptions.
5. Repetition is used deliberately as satire.
6. Variety comes primarily from writing, composition, timing, presentation and combination.
7. The complete episode format must remain understandable by a non-programmer.

Never add logic that branches on a particular episode ID. Never embed JavaScript, arbitrary expressions, loops or a general-purpose scripting language in episode JSON.

If an episode cannot be expressed by the current grammar, treat that as one of two things:

- The episode should be rewritten using existing capabilities; or
- A reusable engine expansion should be discussed and designed separately.

An engine expansion should serve at least three plausible episodes, reinforce the rhythm-and-resistance identity, remain simple to explain, and combine safely with existing mechanics.

## Technical direction

The chosen stack is:

- Phaser
- TypeScript
- Vite
- Zod for content validation
- Vitest for unit tests
- HTML and CSS for the page shell and appropriate non-canvas interface
- JSON for validated episode content
- Browser-first delivery
- Capacitor only later, if native iOS and Android distribution becomes worthwhile

Do not introduce React, another UI framework, multiplayer, native forks or additional infrastructure without a concrete agreed requirement.

## Distribution principles

These are project constraints:

- The canonical public home is `thehorizontalfront.org`.
- Distribute the software and distributable project materials as free/open-source work forming part of the digital commons.
- Keep the release static and offline-capable. Once its required files are cached, play must not depend on an application backend, account, remote database, third-party API or commercial platform remaining available.
- Do not add player tracking, behavioural analytics, advertising, payments, paid access, in-game purchases or other monetisation.
- Voluntary donations, grants or supporter contributions may fund the project only without purchasing access, gameplay advantages or control. Disclose material funding sources and major project expenses.
- Keep development open to community participation through an accessible issue tracker, contribution guidance, a public roadmap and a clear way to propose changes.
- Do not sell the project, enclose it behind a paywall or convert it into an advertising or data-extraction platform. Record these protections in a public governance charter before they become operationally relevant.
- Keep settings and progress on the player's device; do not add authentication, cloud saves or transmission of player data.
- Apply `AGPL-3.0-or-later` to project software and `CC-BY-SA-4.0` to original cultural and documentary work, following the boundaries and exceptions in `LICENSE.md`.
- Preserve the commons-oriented identity policy in `IDENTITY.md`. Do not propose patents, identity enclosure or restrictions on good-faith forks, criticism and cultural participation.

Read `README.md` and the hosting, offline-use and distribution section of `docs/technical-architecture.md` before changing delivery, storage, network access or dependency behaviour.

## Programming style

Phaser is infrastructure, not the domain model.

- Keep Phaser scene classes thin.
- Use scene classes for lifecycle integration, rendering, animation, input capture, audio and scene transitions.
- Keep core rules outside Phaser in plain TypeScript modules.
- Prefer plain data, discriminated unions, pure functions and explicit state transitions.
- Prefer composition over inheritance.
- Pass dependencies through ordinary function arguments where practical.
- Resolve avoidable API awkwardness when it first appears rather than carrying it into later integration. Prefer domain values that keep related state, configuration and invariants together, make invalid combinations difficult to express and remain simple at the call site.
- Keep Phaser objects out of the functional game engine.
- Normalise touch, keyboard and pointer events into the same game input types.
- Base timing and movement on elapsed time, never frame counts.
- Make core game rules testable without starting Phaser or opening a browser.

Avoid class hierarchies, service containers, unnecessary design patterns and premature generalisation.

## Content and presentation

- Apply the same two-level ownership model to every content family that supports reuse: `shared` definitions are globally reusable and may reference shared definitions only; `episode` definitions are private to their owning episode and may reference shared definitions or definitions owned by that same episode. References must state their source explicitly, local IDs must not shadow shared IDs, and content must never reach into another episode's private namespace. A content family that intentionally supports only one level must say so in its schema and documentation.
- Canvas presentation belongs in shared semantic theme roles rather than ad hoc scene values.
- Do not invent fonts, colours or visual branding while performing neutral scaffolding.
- Reuse responsive cartoon layouts and semantic slots.
- Episode data may select mechanics, skins, parameters, layouts, assets and documented outcomes.
- Store authored composition values in validated content rather than embedding them in Phaser code. Layout data owns design-space anchors, pivots, slots and motion parameters; skin or asset data owns visual-part geometry and semantic asset references. TypeScript interprets this finite vocabulary and must not become an episode-specific drawing specification.
- Resolve artwork through a validated asset catalogue of stable semantic IDs. Episodes and skins must not contain repository file paths, and adding a catalogued asset or selecting it in a skin must not require new TypeScript wiring.
- Namespace both skins and artwork by ownership. Shared skins may use only shared assets; episode-owned skins may use shared assets and assets owned by the same episode. An episode may select only a shared skin or one it owns. Enforce these rules generically rather than branching on episode IDs.
- Organise authored play content as one game containing ordered campaigns containing ordered episodes. Use descriptive lowercase kebab-case IDs, require JSON filenames to match their IDs exactly, keep episode IDs globally unique, and reject numeric sequence segments. Durable IDs name the finished creative work rather than the implementation stage that produced it; identifying an implementation stand-in such as `one-scene` or `resistance-test` ultimately requires human judgement.
- Every campaign has one authored briefing, one or more ordered playable episodes, and one authored debriefing. The engine computes episodes held and attempted from accepted outcomes; campaign JSON supplies wording, never scores or executable progression criteria. Retrying does not record an outcome, while accepting either victory or forced verticalisation advances the campaign.
- Make the game hierarchy player-facing: bootstrap presents all validated campaigns, campaign selection opens its briefing, and debriefing offers replay or return to campaigns. Navigation scenes consume validated content and must not discover files or branch on authored campaign IDs.
- Keep all player-visible copy in validated content, never embedded in TypeScript or Phaser scenes. Partition it deliberately: game JSON owns global interface and reusable-mechanic vocabulary, campaign JSON owns campaign prose, episode JSON owns episode-specific confrontation and outcome prose, presentation layouts/skins own their visual-role captions, and the engine supplies only computed values inserted into finite validated templates. Preserve meaningful static HTML identity by injecting page-shell copy from game data at build time.
- Prefer limited cut-out cartoon animation over assuming expensive frame-by-frame animation.
- Keep the recurring boss fictional and visually original.
- Failure should remain funny, dramatic and sad rather than becoming empty slapstick.
- Do not introduce a conventional currency, grind, upgrade economy, daily streak or retention machinery without explicit discussion; their absence is part of the satire.

## Artwork production

AI-generated artwork may be used for prototypes and may be considered for production, but “generated” or “original-looking” must never be treated as a guarantee of uniqueness, copyright protection or non-infringement.

Follow this production-conscious workflow:

1. Start from an original project art brief. Do not request imitation of a living artist or named entertainment property.
2. Keep the Orange Fella a fictional political and corporate archetype rather than reproducing a real person's face.
3. Review every generated asset for recognisable characters, logos, branding, signatures, watermarks and suspiciously specific similarities.
4. Apply meaningful human art direction through selection, iteration, editing, repainting, compositing and adaptation to the project's visual system.
5. Preserve provenance: prompts, source generations, generation date and tool, edits, licences, contributors and replacement status.
6. Record every asset in an asset manifest, distinguishing prototype placeholders from production-approved material.
7. Prefer human-created or substantially human-refined work for identity-critical assets, particularly the logo, protagonist and recurring boss.
8. Ensure layered assets are deliberately prepared for their role in cut-out animation; do not ship accidental generation artefacts or flattened images where separate parts are required.
9. Do not claim that generated work is human-made. Make any disclosure required by applicable law, storefront rules or project policy.
10. Before a consequential commercial release, review prominent AI-assisted assets for intellectual-property, likeness and trademark risk and obtain professional advice where appropriate.

The maintainer owns output as between the maintainer and the generation service only to the extent provided by the applicable service terms and law. Similar output may be produced for others, and copyrightability varies by jurisdiction. Treat these limitations as part of production risk management.

## Audio production

Procedural synthesis is the default direction for prototype audio and may remain the production direction when the results are good enough.

- Generate sound effects mathematically in project-owned code rather than relying on samples where practical.
- Initial targets include duvet pulls, rhythm ticks, notification chirps, warning alarms, victory and failure stings, and fluorescent office hum.
- Keep synthesis parameters explicit and reproducible so sounds can be tuned alongside gameplay.
- Do not incorporate unlicensed samples, recordings, melodies or other third-party audio into procedural output.
- Treat any externally sourced sound as a licensed asset and record its creator, source, licence, attribution requirements and permitted uses in the asset manifest.
- Avoid imitating a named musician, performer, politician or other identifiable person's voice or musical style.

The Orange Fella should communicate through an original, unintelligible synthesised rumble or bluster. Speech bubbles carry the actual words. His vocal sound may convey timing, mood, interruption and comic emphasis, but it must not clone or closely reproduce a real person's voice.

This approach is both an aesthetic choice and a provenance choice: the boss becomes a noisy embodiment of managerial power rather than a voiced impersonation, while all politically important dialogue remains readable and accessible.

If a human composer, performer or sound designer later contributes production audio, use a written agreement covering game and marketing use, commercial distribution, platforms, territories, duration, modification, looping, attribution, ownership or licence terms, and any permitted generative-AI use.

## Files and imports

- Keep public-site styles under `src/site/styles/` and game-specific styles under `src/play/styles/`.
- Keep genuinely shared presentation values, including semantic colour, typography and spacing tokens, under `src/shared/theme/`.
- Keep Phaser canvas theme values in a shared theme module.
- Use extensionless relative TypeScript imports; Vite and TypeScript use bundler resolution.
- Keep content separate from engine and Phaser integration code.
- Do not commit dependencies, build output, local environment files, coverage output or editor debris.

## Dependencies

- Add a dependency only when it solves a current, concrete problem.
- Explain what it contributes before adding it.
- Prefer mature, focused packages over broad frameworks.
- Do not use project generators or replace configuration wholesale unless explicitly requested.
- Preserve `package-lock.json` and the existing npm workflow.

## Verification

For code changes, run the smallest relevant checks and report the result:

- Type checking and production build for application integration.
- Focused unit tests for engine rules.
- Content-schema validation for episode changes.
- Structural and semantic validation for layout, skin and composition data. Tests must cover coordinate bounds, positive dimensions, unique and required semantic parts, compatible layout/skin references, meaningful pivots and motion direction—not merely successful JSON parsing.
- Browser or device testing only when relevant to the requested change.

When acceptance depends on player-facing browser behaviour, follow
`docs/browser-verification.md`. AI reviewers must use the repository's isolated,
credential-free browser configuration rather than a maintainer's personal
profile or authenticated tabs.

Every verification report must use the exact evidence levels defined in
`docs/verification-evidence.md`: **Automated/source verified**,
**Browser-flow verified** and **Human perceptually accepted**. State all three
levels as **Claimed** with their required evidence or **Not claimed** with the
reason. Never upgrade one level into another. In particular, an AI
assistant may record a person's explicit acceptance but must never claim or
infer human perceptual acceptance from source inspection, automated checks,
screenshots or browser automation. Require only the levels proportionate to the
change and preserve the authority document's limitations in the hand-off.

Do not claim a change works without running an appropriate check. Do not turn every small edit into an expansive testing or tooling exercise.

## Git behaviour

- Do not commit, push, create branches or open pull requests unless explicitly asked.
- Keep unrelated user changes intact.
- Do not reformat or rewrite unrelated files.
- Before handing off changes, show the relevant files and checks clearly enough for the maintainer to review them.

## Guiding principle

The desired codebase is small, legible, data-driven and intellectually coherent. Simplicity is not a temporary limitation to engineer away; it supports both maintainability and the game's narrative.

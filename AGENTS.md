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
- Preserve the maintainer's existing naming, layout and stylistic preferences.
- Ask before making a material product or architectural decision that has not already been settled in the documentation.

## Product intent

The Horizontal Front is a satirical, rhythm-based 2D web and mobile game about working extremely hard to remain in bed while an authoritarian Orange Fella tries to force the player into work.

The game is political satire about capitalism, exploitative work culture, compulsory productivity and corporate absurdity. Its central demand is simple:

> Let me remain in bed.

Read the relevant documents before changing product behaviour:

- `docs/game-concept.md`
- `docs/expanded-design-direction.md`
- `docs/data-driven-episode-architecture.md`
- `docs/technical-architecture.md`

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

Do not introduce React, another UI framework, a backend, authentication, a database, cloud saves, multiplayer, native forks or additional infrastructure without a concrete agreed requirement.

## Programming style

Phaser is infrastructure, not the domain model.

- Keep Phaser scene classes thin.
- Use scene classes for lifecycle integration, rendering, animation, input capture, audio and scene transitions.
- Keep core rules outside Phaser in plain TypeScript modules.
- Prefer plain data, discriminated unions, pure functions and explicit state transitions.
- Prefer composition over inheritance.
- Pass dependencies through ordinary function arguments where practical.
- Keep Phaser objects out of the functional game engine.
- Normalise touch, keyboard and pointer events into the same game input types.
- Base timing and movement on elapsed time, never frame counts.
- Make core game rules testable without starting Phaser or opening a browser.

Avoid class hierarchies, service containers, unnecessary design patterns and premature generalisation.

## Content and presentation

- Canvas presentation belongs in shared semantic theme roles rather than ad hoc scene values.
- Do not invent fonts, colours or visual branding while performing neutral scaffolding.
- Reuse responsive cartoon layouts and semantic slots.
- Episode data may select mechanics, skins, parameters, layouts, assets and documented outcomes.
- Prefer limited cut-out cartoon animation over assuming expensive frame-by-frame animation.
- Keep the recurring boss fictional and visually original.
- Failure should remain funny, dramatic and sad rather than becoming empty slapstick.
- Do not introduce a conventional currency, grind, upgrade economy, daily streak or retention machinery without explicit discussion; their absence is part of the satire.

## Files and imports

- Keep global page styles under `src/styles/`.
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
- Browser or device testing only when relevant to the requested change.

Do not claim a change works without running an appropriate check. Do not turn every small edit into an expansive testing or tooling exercise.

## Git behaviour

- Do not commit, push, create branches or open pull requests unless explicitly asked.
- Keep unrelated user changes intact.
- Do not reformat or rewrite unrelated files.
- Before handing off changes, show the relevant files and checks clearly enough for the maintainer to review them.

## Guiding principle

The desired codebase is small, legible, data-driven and intellectually coherent. Simplicity is not a temporary limitation to engineer away; it supports both maintainability and the game's narrative.

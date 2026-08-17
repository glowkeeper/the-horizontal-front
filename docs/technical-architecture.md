# Technical architecture

## Chosen direction

The Horizontal Front is a web-first 2D game using:

- **Phaser** for the game loop, rendering, scenes, input, animation and audio.
- **TypeScript** for application and game code.
- **Vite** for local development and production builds.
- **HTML and CSS** for the page shell, accessibility controls and non-game interface where appropriate.
- **JSON validated with Zod schemas** for episodes, confrontations and cartoon compositions.
- **A static, offline-capable web release first**, with a Progressive Web App manifest and service worker used to cache the files required for play.
- **Capacitor later**, if and when the same game is prepared for iOS and Android stores.
- **No application backend.** Device-local settings and progress can use browser storage.
- **No tracking or monetisation.** The deployed game does not require analytics, advertising, payments or player accounts.

The current release target is a responsive, landscape-oriented browser game.
The initial production support matrix requires desktop Google Chrome with
keyboard and pointer input and Google Chrome on a real Android device in
landscape with touch input. Audio-enabled and muted play are both required.
Exact browser and device versions remain release evidence rather than permanent
architectural claims; other environments are not claimed until they are
deliberately verified. The durable readiness and publication rules are recorded in
[Release process](release-process.md).

## Static public shell

The release is a Vite multi-page site rather than a single canvas page. Semantic HTML and shared CSS own public navigation, project information, accessibility information and document presentation. The `/play/` entry alone imports Phaser; visiting the landing, commons or governance pages must not download the game bundle.

The canonical charter, governance, identity, contribution and licensing Markdown files are rendered into public HTML at build time. They must not be manually copied into a second set of public documents that can drift from the repository record. A concise `/commons/` page provides the approachable overview and links to those complete generated documents.

This shell does not introduce a UI framework. Vite builds the static HTML entry points and their small TypeScript modules directly. The service-worker finalisation step derives its precache list from the actual production output so every public document, licence, shared asset and game file remains available offline after installation.

The source tree makes this boundary visible:

```text
src/
  play/      Game entry, engine, Phaser integration, theme adapter and styles
  site/      Public-site entry, page templates and styles
  shared/    Design tokens and browser infrastructure used by both
```

Vite still requires route-shaped HTML entry points at build time. The site generator creates those as ignored root intermediates from `src/site/pages`, `src/play/index.html` and the canonical project Markdown. Public URL layout therefore does not dictate source-code layout.

## Why Phaser fits

The game is an interactive two-dimensional political cartoon. Its principal elements are layered images, limited character animation, speech bubbles, sound, responsive input and a continuously changing gameplay state.

Phaser provides the relevant browser-game machinery:

- A time-based game loop.
- WebGL and Canvas rendering.
- Layered sprites and images.
- Tweens and sprite animation.
- Camera movement and effects.
- Keyboard, pointer and touch input.
- Audio playback.
- Asset loading.
- Scene transitions and scaling.

This is a more natural fit than representing an animated cartoon scene as a large collection of ordinary web-page elements. It also allows gameplay and cartoon sequences to share the same rendering and animation system.

## TypeScript and Phaser

Phaser is a JavaScript library with TypeScript definitions. The project imports Phaser as an npm dependency and uses it from TypeScript:

```ts
import Phaser from "phaser";
```

During development and production builds, Vite converts the TypeScript into JavaScript for the browser. TypeScript provides editor assistance, safer refactoring and compile-time checks; it is not a separate runtime.

```text
TypeScript source
       ↓
TypeScript checks types; Vite builds
       ↓
Browser-compatible JavaScript
       ↓
Phaser runs the game in a canvas
```

## Classes are not the architectural model

Phaser exposes some class-oriented APIs. A Phaser scene is commonly written by extending `Phaser.Scene`, and that is the simplest way to integrate with its lifecycle:

```ts
class ResistanceScene extends Phaser.Scene {
  create(): void {
    // Connect rendering and input to the game engine.
  }

  update(_time: number, delta: number): void {
    // Advance the engine and render its current state.
  }
}
```

This does **not** require the game itself to use a class-driven design.

Phaser scene classes should remain thin adapters around the framework. They may:

- Load assets.
- Create Phaser display objects.
- Translate touch, keyboard and pointer events into game actions.
- Pass elapsed time to the engine.
- Render the engine's state.
- Start and stop scenes.

They should not own the core rules, episode interpretation or political-cartoon content.

## Preferred programming style

The core engine should favour:

- Plain TypeScript data types.
- Discriminated unions.
- Pure functions where practical.
- Explicit state transitions.
- Small modules with named exports.
- Composition rather than inheritance.
- Immutable inputs and returned state where that remains clear and performant.
- Dependency injection through ordinary function arguments rather than class hierarchies.

For example:

```ts
type ResistanceState = {
  resistanceSafety: number;
  resistanceStrength: number;
  nextRhythmStep: number;
  elapsedMs: number;
};

type Resistance = {
  readonly config: ResistanceConfig;
  readonly state: ResistanceState;
};

type ResistanceInput = {
  side: "left" | "right";
  action: "press" | "release";
  atMs: number;
};

function applyResistanceInput(
  resistance: Resistance,
  input: ResistanceInput,
): Resistance {
  // Judge the side and timing against the next authored rhythm step,
  // then update persistent resistance strength and resistance safety.
}
```

The `Resistance` value keeps the fixed configuration and changing state of one confrontation together. Public transitions therefore cannot accidentally receive a different configuration on each call. This logic can be tested without starting Phaser or opening a browser. Mobile touch, desktop keyboard and pointer input can all produce the same `ResistanceInput` value.

## Engine rules

### Rhythm timing

Rhythm is part of the domain model, not an effect owned by Phaser or the audio system. The functional engine judges normalised press and release input against the resolved score and explicit timing windows. The catalogue already proves straight alternation, waltz grouping, syncopation, explicit rests, sustained holds and call-and-response composition through the same reusable vocabulary.

One elapsed-time clock drives rhythm judgement, dramatic phases and the cues that communicate them. At content-load time, the selected catalogued dramatic curve composes catalogued rhythm cycles into a finite timestamped score. Phaser and the audio adapter may render sound, animation, visual timing targets, and optional haptics, but they derive those cues from that resolved engine timing rather than maintaining competing clocks. This keeps input results deterministic and lets equivalent audio and visual presentations describe the same required rhythm.

### Rhythm timeline and presentation

The content compiler produces two related timelines. The scored timeline contains
the taps and press-and-release holds judged by the engine. A non-scoring guide
timeline retains those actions' real timing tolerances and hold-release
boundaries while also representing authored rests and one opening count-in.
Visual, audio and optional haptic adapters consume that common guide rather than
reinterpreting rhythm content.

`READY` is reserved for the confrontation's first lead-in. Later phase lead-ins
provide anticipation time and allow the next action to approach, but do not
invent another protected READY or REST: ordinary pressure continues against the
resistance already earned. Opening READY and authored REST are genuine
engine-level pauses. Pressure, safety movement, resistance changes and dramatic
curve progress stop for their complete effective interval. Each pause ends at
the opening edge of the following cue's valid timing window, so the engine never
accepts an input while presentation still instructs the player to wait.

The Phaser adapter projects every action from a clipped centre emitter toward
its actual left or right control at one constant layout-authored scroll speed.
Tempo changes the space between notes, hold duration changes physical note
length and timing tolerance changes the width of the control gate. Position is
the primary timing channel; opacity reinforces approach. Entering a gate permits
input, its centre line marks the ideal beat, and leaving it is too late. The
control displays `HIT NOW` for the complete valid window.

A hold is one outlined streaming note. Its head communicates when to press, its
body communicates continued control ownership and its emphasised tail
communicates when to release. During an active hold the gate latches and the
sustained section changes colour; an early release visibly breaks the note. Long
holds stream through the available lane while clipping at the centre and canvas
edge, so they neither enter the opposite lane nor require enormous off-screen
geometry. A completed action is absorbed in a brief burst, while an expired
action escapes beyond its gate as a crossed miss. Compact READY and REST bands
remain at the centre because they have no control target.

The selected layout owns guide count, scroll speed, supported tolerance,
geometry, opacity, typography sizes, stroke widths, tween durations and easing.
Content validation rejects timing windows or presentation values the layout
cannot represent. Phrase previews, rehearsal, procedural audio and optional
haptics may strengthen anticipation, but must reinforce this readable timing
source rather than rescue an otherwise unreadable mechanic.

### Pressure and state

Engine advancement processes passive pressure and missed-cue deadlines chronologically. Advancing once across a long interval must therefore produce the same state and failure point as advancing through many small frames, including when pause intervals interrupt pressure.

The score vocabulary is deliberately finite: tap, hold and rest events positioned within bounded beat cycles. Holds are real press-and-release actions judged at both boundaries. Dramatic phases own tempo, timing tolerance, pressure, recovery, resistance gain and loss, and a continuous presentation-intensity range. Phase pressure is integrated across elapsed time, so results do not depend on frame rate. The resolution duration is distinct from interactive duration and prevents navigation controls appearing before the authored outcome has registered.

Hits build bounded persistent resistance strength; misses apply both the phase's authored resistance loss and safety penalty. Net passive pressure is `authored pressure × (1 − resistance strength)`, so accurate performance protects the interval between beats instead of competing with continuous unavoidable damage through discrete healing alone. Successful safety recovery is deliberately weak at zero strength and grows as accurate actions establish resistance. This lets opening episodes make individual mistakes inexpensive without allowing alternating correct and incorrect one-key input to recover indefinitely. The phase owns its recovery, resistance and penalty scalars as data. Rest events compile to intentional unscored pauses that preserve both safety and earned resistance.

Presentation intensity does not manufacture physical danger. The resistance composition's advancing states derive only from resistance safety, so successful inputs can visibly arrest or reverse that advance during a crisis. Authored intensity may escalate atmospheric channels such as the invading work light without falsifying the mechanical state.

Rhythm complexity should be able to increase without requiring an ever-higher input rate. The rule system must remain suitable for reduced-input mappings and must not assume that keyboard, pointer, and touch inputs impose identical physical effort.

## Content compilation pipeline

The **content compiler** is the boundary between the finite authoring grammar and
the functional game engine. It is project-owned TypeScript that translates
validated, declarative content into immutable runtime configuration. It is not
the TypeScript compiler, does not generate JavaScript or machine code, and does
not execute instructions supplied by an episode.

The pipeline has distinct responsibilities:

```text
Authored JSON
    ↓
Structural validation
    ↓
Ownership and reference resolution
    ↓
Semantic validation
    ↓
Content compilation
    ↓
Immutable runtime configuration
    ↓
Functional game engine
```

**Structural validation** uses Zod to reject unknown fields, unsupported
discriminants, missing values and invalid individual field shapes. **Ownership
and reference resolution** builds the selected episode's mechanic scope and
resolves every explicit `shared` or `episode` reference without allowing shared
content to depend on private content, cross-episode access or local shadowing.
**Semantic validation** checks relationships which no isolated field can prove,
such as rhythm-event overlap, curve continuity and whether an interruption fits
a playable musical boundary. **Compilation** then performs deterministic
lowering from author-facing musical and dramatic terms to engine-facing time and
state configuration. Presentation resolution has its own equivalent structural
and semantic validation boundary because it combines the compiled timing with
the selected layout, skins and assets.

For a confrontation, compilation performs these transformations:

- Beat positions and durations become elapsed-time boundaries in milliseconds.
- Repeated rhythm cycles become a finite, chronologically ordered scored cue
  timeline of taps and press-and-release holds.
- Authored rests and the opening lead-in become non-scoring guide and pause
  intervals aligned with the real input windows.
- Dramatic phases become contiguous runtime phases with explicit start and end
  times and their authored pressure, recovery, resistance and intensity values.
- Interruption phrase triggers become non-overlapping warning, active and return
  windows, with their selected reusable mechanic resolved into finite runtime
  interaction data.

The principal outputs are `ResistanceConfig` and `ConfrontationConfig`. These
contain no Phaser objects and require no catalogue lookups during play. The
engine consumes the scored configuration; visual, audio and optional haptic
adapters consume the same guide timing rather than interpreting episode JSON or
maintaining independent clocks.

`loadEpisode` owns the confrontation-compilation boundary: it parses an episode,
creates its ownership scope and invokes the confrontation compiler. `loadGame`
compiles every catalogued episode during content loading, so invalid mechanic
content fails before play rather than producing a partial runtime state.
`npm run validate:content` exercises this real loading and compilation path and
then resolves every episode's presentation, including its timing compatibility,
rather than using a separate, weaker validator.

Compilation must remain generic. It may branch only on documented grammar
discriminants, such as rhythm actions `tap`, `hold` and `rest` or interruption
kinds `sequence` and `hold`; it must never branch on an episode ID. Adding a
compiler capability therefore requires an
author-facing finite vocabulary, structural and semantic validation, a plain
runtime representation, reusable interpretation, documentation and tests of
both accepted compilation and important rejection cases. A new capability must
meet the engine-expansion rules in the [content architecture](content-architecture.md) rather
than entering through an episode-specific compiler exception.

The author-facing vocabulary compiled by this pipeline is defined in the
[episode grammar reference](episode-grammar-reference.md).

## Architectural boundary

```text
Episode JSON and artwork
           ↓
Structural validation
           ↓
Ownership and reference resolution
           ↓
Semantic validation
           ↓
Content compiler
           ↓
Immutable runtime configuration
           ↓
Functional game engine
  - rhythm
  - pressure
  - interruptions
  - phase timing
  - outcomes
           ↓
Thin Phaser scene adapters
  - rendering
  - animation
  - input capture
  - audio
           ↓
Browser canvas
```

This boundary prevents Phaser-specific objects from leaking throughout the engine and makes the rules easier to understand, test and potentially reuse.

Content resolution also has a uniform ownership boundary. The shared library is loaded first and cannot reference episode-owned material. Each episode loader then creates an isolated local scope from that episode's definitions. Explicit `{ source, id }` references resolve against either the shared library or that one local scope; duplicate local IDs, shared-ID shadowing, unresolved references and cross-episode access fail during loading. The resolved engine configuration contains no ownership lookup and no content IDs that alter behaviour.

## Data-driven content

Episodes contain no executable code. They are expressed through validated JSON,
writing, artwork and audio using the complete authoring contract in the
[episode grammar reference](episode-grammar-reference.md). The ownership,
catalogue and engine-expansion rules surrounding that grammar are defined in the
[content architecture](content-architecture.md).

The engine must never branch on a particular episode identifier. A new capability is an explicit, reusable engine expansion and is not part of ordinary episode production.

Application bootstrap starts from `game.json`, which orders campaigns; each campaign JSON orders its episodes. The first campaign and first episode are the natural entry point. Stable, globally unique episode IDs identify content independently of position. Build-time discovery includes every campaign and episode JSON file without content-specific TypeScript imports, while loading and policy checks reject missing, duplicate, unlisted or identity-mismatched content. Adding and ordering campaigns or episodes therefore changes data and creative assets, not application code.

Campaign progression is a plain TypeScript domain transition outside Phaser. A campaign begins with its authored briefing, encounters every episode in order and ends with its authored debriefing. Retrying preserves the current tally; accepting an episode outcome advances and records whether the line held. Phaser scenes render these states and capture input but do not calculate campaign results.

Confrontation composition is likewise a plain TypeScript domain transition. A confrontation coordinator owns the resolved musical timeline, advances the resistance engine, transfers input ownership between resistance and interruptions, applies declared consequences and exposes semantic warning, active, resolved and returning states. The resistance engine remains unaware of Quick Call, Urgent Email and episode IDs; its compiled guide simply contains pressure-pausing interruption and count-in windows. `ResistanceScene` captures normalised keyboard and pointer actions and renders coordinator state without independently scheduling attacks.

All interruption timing is compiled from validated phase, rhythm-cycle and beat data. Active interruptions never overlap scored resistance windows, and passive pressure remains suspended until the first returning cue is playable. Pointer cancellation, interaction loss through blur or visibility change and ordinary early release are separate domain events so a system cancellation cannot become an unexplained penalty or leave a held input stuck.

Interruption presentation uses the same explicit ownership architecture as other reusable content. Each compiled interruption retains an owned skin reference. Presentation loading resolves shared skins or skins private to that episode, validates filename identity, rejects local shadowing and checks that the skin supports the selected mechanic. The shared layout owns interruption anchors and geometry; the selected interruption skin owns semantic theme and typography roles, dimensions of appearance such as strokes and opacity, choice and hold treatments, lifecycle-state styling and layer depth. The Phaser presentation adapter performs only finite state interpretation and runtime progress calculation.

The Phaser application states mirror the validated content hierarchy: `BootScene` preloads assets and opens `CampaignsScene`; campaign selection opens `CampaignBriefingScene`; accepted episode outcomes advance through `ResistanceScene`; completion opens `CampaignDebriefingScene`. Debriefing can replay through the briefing or return to Campaigns. No router or content-specific scene wiring is required.

Copy follows the ownership partition defined in [Content hierarchy and
ownership](content-architecture.md#content-hierarchy-and-ownership). Runtime
code contributes only computed values through a finite named-placeholder
formatter. A policy tripwire rejects direct player-visible string literals
passed to Phaser text, button and announcement APIs; it is intentionally backed
by schema validation, type checking and review rather than treated as a complete
semantic proof.

Presentation genericity is enforced the same way, and is a project invariant
rather than a convention. No module under `src/play/phaser/` may contain an
authored presentation value: not a size, depth, opacity or stroke width written
inline, and not a semantic colour role selected by a code literal. Layout data
owns the confrontation backdrop, control geometry, motion and the rhythm
palette; skin data owns its parts, copy and typography; panel layout data owns
the illustrated briefing and debriefing surfaces. The adapter resolves those
authored roles and chooses none of them.

Interface chrome — buttons, menus and the canvas ground — remains code-owned,
because it is engine furniture that no episode restyles. It is confined to
named constants in `src/play/phaser/design.ts`, the policy check's single
exemption, so the rule stays absolute everywhere else and chrome values remain
inspectable in one module rather than scattered as inline literals.

Content identity is likewise absent from code. No episode, campaign, rhythm,
curve, mechanic, skin, layout or asset ID appears as a TypeScript literal;
selections resolve generically from validated data by filename-matching ID.
Adding a layout that reuses the existing vocabulary is therefore a content
change, while genuinely new visual structure remains an engine expansion.

The play page's static identity is also data-owned. Vite injects title, description, exit label, initial live-region status and application label from `game.json` while transforming the HTML entry. The production static-build check verifies the emitted page contains those values and no unresolved placeholders, so tab titles and navigation remain meaningful before the Phaser bundle executes.

Interface chrome is rendered as real DOM controls layered over the canvas rather than drawn into it. Chrome is engine furniture that no episode restyles, so it can be ordinary HTML: buttons are reachable by keyboard, show a visible focus state, respond to Enter and Space, and are announced by assistive technology with an accurate accessible name. They are styled by the game's own stylesheet, so their appearance is authored once rather than maintained twice.

The overlay is a design-space surface. It is exactly the design size, then scaled and offset onto the canvas that `Scale.FIT` letterboxes, so controls are positioned in the same coordinates the scenes already use and every drawn dimension scales with the composition beneath them instead of drifting away from it. The overlay ignores pointer events so canvas input is unaffected, sits outside the `role="application"` region so its controls remain ordinary buttons to a screen reader, and removes its controls when their scene shuts down.

In-world controls are not affected. The rhythm gates, notes and emitter are authored world composition and remain on the canvas.

Campaign selection is still canvas-drawn, and mobile screen-reader behaviour has not been verified on device. Both remain production work.

Reusable scenes receive the validated episode as scene data; they do not import an episode file or choose an episode ID themselves. Episode presentation data selects a layout and skin. Validated layout JSON owns design-space anchors, pivots, interface slots and reusable motion parameters; validated skin JSON owns prototype primitive geometry or semantic layered-asset references. Phaser code interprets this finite vocabulary and applies runtime state—it does not contain the authored composition coordinates.

Artwork files are resolved through a validated asset catalog using stable semantic IDs. Skins may use either documented prototype shapes or image parts with explicit `{ source, id }` asset references; they never contain repository paths. Episodes likewise select layouts and skins through explicit ownership references. Both skins and physical assets are organised by ownership under `shared/` or `episodes/<episode-id>/`. A shared skin may use only shared assets; an episode-owned skin may use shared assets and assets owned by that episode. An episode may select only a shared skin or one in its own namespace. Build-time recursive discovery and policy validation reject unsafe paths, misleading ownership sources, unknown episode namespaces, missing files and unlisted files, and the generic boot scene preloads catalogued images before the selected presentation is instantiated.

Presentation validation has two levels. Zod schemas enforce the finite structural vocabulary, types and numeric ranges. Semantic validation enforces relationships that schemas alone cannot express: anchors, panels and controls fit the design canvas; the sided controls read left, feedback, right and share one horizontal lane; a timing gate is wide enough to contain its travelling notes while the centre emitter stays subordinate to it; interruption controls meet the enhanced pointer target; an atmospheric channel moves in the authored direction, so the work light cannot weaken as danger rises; required part IDs exist and are unique; image references resolve through the asset catalogue; and layout, skin and asset ownership agree. A JSON file parsing successfully is not sufficient evidence that a composition is usable.

Geometric validation of the resistance composition itself is **not implemented**. A skin whose authored states advanced the wrong end of its structure, or whose loose parts travelled uphill, would be caught by review rather than by the build. Such rules are wanted, and would have to be expressed generically — a monotonic direction check across the authored state sequence, not anything that knows what a bed is. They earn their keep when a second reusable layout exists, because until then the only composition anyone has inspected is also the only one there is.

Prototypes use these same production boundaries. Prototype tuning, writing and shape artwork may be provisional, but episode-specific wiring or disposable scene architecture must not be used as a shortcut.

## Web and mobile path

The game is implemented and tested in the browser first. The same responsive codebase supports:

- Touch controls on mobile browsers.
- Keyboard controls on desktop.
- Pointer controls as a fallback.

If native distribution becomes worthwhile, Capacitor can package the web build for iOS and Android and expose native features such as haptics. Native wrappers should not fork the game rules or episode content.

## Hosting, offline use and distribution

The canonical public site is **[thehorizontalfront.org](https://thehorizontalfront.org)**. Production builds consist only of static HTML, CSS, JavaScript, episode data and media assets, so they can be served by an ordinary static host without application servers, accounts or remote databases.

The browser release must remain usable without a network connection after its required files have been cached. The offline boundary includes the page shell, game code, episode data and the artwork and audio needed to play. Features should not acquire a runtime dependency on third-party APIs, remote fonts, analytics services or content delivery that would make the game fail when disconnected. Updates may of course require a connection to download a new static release.

The repository and distributable project materials form part of the digital commons. Project software uses `AGPL-3.0-or-later`; original cultural and documentary material uses `CC-BY-SA-4.0`, subject to the boundaries and provenance exceptions in [the licensing guide](../LICENSE.md).

The architectural consequence of the project's binding privacy and funding
commitments is that settings and progress remain device-local: no analytics,
advertising, payments, accounts or player-data transmission services are
required. The policy itself is authoritative in the [project
charter](../PROJECT_CHARTER.md).

## Initial exclusions

The first version does not require:

- React or another UI framework.
- A server-side application.
- Accounts or authentication.
- A database or cloud saves.
- Multiplayer infrastructure.
- A conventional progression economy.
- Separate native game implementations.
- A general-purpose visual game editor.

These exclusions keep the technical system aligned with the project's deliberate simplicity. They can be reconsidered only when a concrete requirement justifies them and the change does not weaken the static, offline-capable, non-tracking and non-commercial commitments above.

A future constrained content-authoring tool is not a general-purpose editor.
The planned Propaganda Department is deliberately limited to the documented
game vocabulary and is not required for the first release; its role is defined
in the [content architecture](content-architecture.md#future-authoring-tool).

## Technical principles

1. **Phaser is infrastructure, not the domain model.**
2. **Framework classes remain thin integration adapters.**
3. **Core rules are plain TypeScript data and functions.**
4. **Episodes are validated content and never executable code.**
5. **One rule system serves touch, keyboard and pointer input.**
6. **Time-based calculations must not depend on frame rate.**
7. **The browser is the first and canonical runtime.**
8. **Native packaging must not create a second implementation.**
9. **Static releases remain playable offline after their required files are cached.**
10. **No feature depends on tracking, advertising, payments or accounts.**
11. **Add infrastructure only in response to a demonstrated need.**

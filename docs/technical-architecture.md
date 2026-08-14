# Technical architecture

## Chosen direction

The Horizontal Front will be built as a web-first 2D game using:

- **Phaser** for the game loop, rendering, scenes, input, animation and audio.
- **TypeScript** for application and game code.
- **Vite** for local development and production builds.
- **HTML and CSS** for the page shell, accessibility controls and non-game interface where appropriate.
- **JSON validated against TypeScript schemas** for episodes, confrontations and cartoon compositions.
- **A static, offline-capable web release first**, with a Progressive Web App manifest and service worker used to cache the files required for play.
- **Capacitor later**, if and when the same game is prepared for iOS and Android stores.
- **No application backend.** Device-local settings and progress can use browser storage.
- **No tracking or monetisation.** The deployed game does not require analytics, advertising, payments or player accounts.

The first release target is a responsive, landscape-oriented browser game with touch, keyboard and pointer support.

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

This is a more natural fit than representing the animated bedroom as a large collection of ordinary web-page elements. It also allows gameplay and cartoon sequences to share the same rendering and animation system.

## TypeScript and Phaser

Phaser is a JavaScript library with TypeScript definitions. The project imports Phaser as an npm dependency and uses it from TypeScript:

```ts
import Phaser from "phaser";
```

During development and production builds, Vite converts the TypeScript into JavaScript for the browser. TypeScript provides editor assistance, safer refactoring and compile-time checks; it is not a separate runtime.

```text
TypeScript source
       ↓
Vite type-checks and builds
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
  duvetSafety: number;
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
  // then update persistent resistance strength and duvet safety.
}
```

The `Resistance` value keeps the fixed configuration and changing state of one confrontation together. Public transitions therefore cannot accidentally receive a different configuration on each call. This logic can be tested without starting Phaser or opening a browser. Mobile touch, desktop keyboard and pointer input can all produce the same `ResistanceInput` value.

Rhythm is part of the domain model, not an effect owned by Phaser or the audio system. The functional engine judges normalised press and release input against the resolved score and explicit timing windows. The catalogue already proves straight alternation, waltz grouping, syncopation, explicit rests, sustained holds and call-and-response composition through the same reusable vocabulary.

One elapsed-time clock drives rhythm judgement, dramatic phases and the cues that communicate them. At content-load time, the selected catalogued dramatic curve composes catalogued rhythm cycles into a finite timestamped score. Phaser and the audio adapter may render sound, animation, visual timing targets, and optional haptics, but they derive those cues from that resolved engine timing rather than maintaining competing clocks. This keeps input results deterministic and lets equivalent audio and visual presentations describe the same required rhythm.

The compiler also produces a non-scoring guide timeline containing authored actions, rests and one opening count-in. Action guide events retain the engine's real timing tolerance and hold-release boundary. Later phase lead-ins create anticipation time but no guide event: the next action can be presented in advance while pressure continues against persistent resistance. They never repeat READY or invent a protected REST. Opening READY and authored REST are engine-level pauses: pressure integration and dramatic-curve progress exclude those intervals. The compiler ends each pause at the opening edge of the following cue's timing window, keeping instruction, judgement and pressure semantics on the same boundary. The Phaser adapter projects every action at one constant layout-authored scroll speed from a clipped centre emitter through compact left and right gates. Tempo changes note spacing, hold duration becomes physical note length, and timing tolerance becomes gate width. A gate's centre line marks the ideal beat and a missed note visibly escapes beyond it. Holds render as outlined streaming capsules whose head and tail carry press and release boundaries; the gate latches during an active hold, sustained material changes colour, and early release breaks the capsule. Lane clipping prevents long holds entering the opposite lane or requiring enormous off-screen geometry. The centre also carries compact targetless bands such as REST and the opening READY. Guide count, scroll speed, supported tolerance, geometry and opacity are validated layout data; content loading rejects an episode whose timing window the selected layout cannot display. Phrase previews, procedural audio and optional haptics can consume the same timeline without recreating rhythm interpretation or becoming required for comprehension.

Engine advancement processes passive pressure and missed-cue deadlines chronologically. Advancing once across a long interval must therefore produce the same state and failure point as advancing through many small frames, including when pause intervals interrupt pressure.

The score vocabulary is deliberately finite: tap, hold and rest events positioned within bounded beat cycles. Holds are real press-and-release actions judged at both boundaries. Dramatic phases own tempo, timing tolerance, pressure, recovery, resistance gain and loss, and a continuous presentation-intensity range. Phase pressure is integrated across elapsed time, so results do not depend on frame rate. The resolution duration is distinct from interactive duration and prevents navigation controls appearing before the authored outcome has registered.

Hits build bounded persistent resistance strength; misses apply both the phase's authored resistance loss and safety penalty. Net passive pressure is `authored pressure × (1 − resistance strength)`, so accurate performance protects the interval between beats instead of competing with continuous unavoidable damage through discrete healing alone. Successful safety recovery is deliberately weak at zero strength and grows as accurate actions establish resistance. This lets opening episodes make individual mistakes inexpensive without allowing alternating correct and incorrect one-key input to recover indefinitely. The phase owns its recovery, resistance and penalty scalars as data. Rest events compile to intentional unscored pauses that preserve both safety and earned resistance.

Presentation intensity does not manufacture physical danger. Bed angle, duvet loss and sleeper displacement derive only from duvet safety, so successful inputs can visibly arrest or reverse the lift during a crisis. Authored intensity may escalate atmospheric channels such as the invading work light without falsifying the mechanical state.

Rhythm complexity should be able to increase without requiring an ever-higher input rate. The rule system must remain suitable for reduced-input mappings and must not assume that keyboard, pointer, and touch inputs impose identical physical effort.

## Architectural boundary

```text
Episode JSON and artwork
           ↓
Schema validation and content loader
           ↓
Functional game engine
  - rhythm
  - pressure
  - attacks
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

## Scenes

The likely top-level Phaser scenes are:

- **Boot:** load essential files and validate the content index.
- **Title:** present the title and route to settings or play.
- **Briefing:** perform the pre-confrontation cartoon.
- **Resistance:** run the rhythmic confrontation.
- **Result:** perform the victory, failure or trap-consequence cartoon.
- **Interlude:** present occasional longer narrative sequences.
- **Propaganda Department:** provide development-only episode composition and preview tools.

These are application states and framework integration points, not objects that model the political world.

## Data-driven content

Episodes contain no executable code. They are expressed through validated JSON, writing, artwork and audio using the finite grammar defined in [Data-driven episode architecture](data-driven-episode-architecture.md).

The engine must never branch on a particular episode identifier. A new capability is an explicit, reusable engine expansion and is not part of ordinary episode production.

Application bootstrap starts from `game.json`, which orders campaigns; each campaign JSON orders its episodes. The first campaign and first episode are the natural entry point. Stable, globally unique episode IDs identify content independently of position. Build-time discovery includes every campaign and episode JSON file without content-specific TypeScript imports, while loading and policy checks reject missing, duplicate, unlisted or identity-mismatched content. Adding and ordering campaigns or episodes therefore changes data and creative assets, not application code.

Campaign progression is a plain TypeScript domain transition outside Phaser. A campaign begins with its authored briefing, encounters every episode in order and ends with its authored debriefing. Retrying preserves the current tally; accepting an episode outcome advances and records whether the line held. Phaser scenes render these states and capture input but do not calculate campaign results.

Confrontation composition is likewise a plain TypeScript domain transition. A confrontation coordinator owns the resolved musical timeline, advances the resistance engine, transfers input ownership between resistance and interruptions, applies declared consequences and exposes semantic warning, active, resolved and returning states. The resistance engine remains unaware of Quick Call, Urgent Email and episode IDs; its compiled guide simply contains pressure-pausing interruption and count-in windows. `ResistanceScene` captures normalised keyboard and pointer actions and renders coordinator state without independently scheduling attacks.

All interruption timing is compiled from validated phase, rhythm-cycle and beat data. Active interruptions never overlap scored resistance windows, and passive pressure remains suspended until the first returning cue is playable. Pointer cancellation, interaction loss through blur or visibility change and ordinary early release are separate domain events so a system cancellation cannot become an unexplained penalty or leave a held input stuck.

Interruption presentation uses the same explicit ownership architecture as other reusable content. Each compiled interruption retains an owned skin reference. Presentation loading resolves shared skins or skins private to that episode, validates filename identity, rejects local shadowing and checks that the skin supports the selected mechanic. The shared layout owns interruption anchors and geometry; the selected interruption skin owns semantic theme and typography roles, dimensions of appearance such as strokes and opacity, choice and hold treatments, lifecycle-state styling and layer depth. The Phaser presentation adapter performs only finite state interpretation and runtime progress calculation.

The Phaser application states mirror the validated content hierarchy: `BootScene` preloads assets and opens `CampaignsScene`; campaign selection opens `CampaignBriefingScene`; accepted episode outcomes advance through `ResistanceScene`; completion opens `CampaignDebriefingScene`. Debriefing can replay through the briefing or return to Campaigns. No router or content-specific scene wiring is required.

Copy follows the same content boundaries. Global interface and reusable mechanic copy comes from validated game data, campaign prose from campaign data, episode-specific confrontation/result prose from episode data, and visual-role captions from layout or skin data. Runtime code contributes only computed values through a finite named-placeholder formatter. A policy tripwire rejects direct player-visible string literals passed to Phaser text, button and announcement APIs; it is intentionally backed by schema validation, type checking and review rather than treated as a complete semantic proof. Interface chrome uses shared design-space constants and small code-owned responsive layout functions; authored world composition remains in validated presentation data.

The play page's static identity is also data-owned. Vite injects title, description, exit label, initial live-region status and application label from `game.json` while transforming the HTML entry. The production static-build check verifies the emitted page contains those values and no unresolved placeholders, so tab titles and navigation remain meaningful before the Phaser bundle executes.

The canvas navigation is adequate prototype input scaffolding, not the final accessibility surface. The live region and equivalent keyboard/pointer actions are real; semantic DOM campaign cards, buttons, focus management and mobile screen-reader behaviour remain required production work.

Reusable scenes receive the validated episode as scene data; they do not import an episode file or choose an episode ID themselves. Episode presentation data selects a layout and skin. Validated layout JSON owns design-space anchors, pivots, interface slots and reusable motion parameters; validated skin JSON owns prototype primitive geometry or, later, semantic layered-asset references. Phaser code interprets this finite vocabulary and applies runtime state—it does not contain the authored composition coordinates.

Artwork files are resolved through a validated asset catalog using stable semantic IDs. Skins may use either documented prototype shapes or image parts with explicit `{ source, id }` asset references; they never contain repository paths. Episodes likewise select layouts and skins through explicit ownership references. Both skins and physical assets are organised by ownership under `shared/` or `episodes/<episode-id>/`. A shared skin may use only shared assets; an episode-owned skin may use shared assets and assets owned by that episode. An episode may select only a shared skin or one in its own namespace. Build-time recursive discovery and policy validation reject unsafe paths, misleading ownership sources, unknown episode namespaces, missing files and unlisted files, and the generic boot scene preloads catalogued images before the selected presentation is instantiated.

Presentation validation has two levels. Zod schemas enforce the finite structural vocabulary, types and numeric ranges. Semantic validation enforces relationships that schemas alone cannot express: coordinates and controls fit the design canvas, required part IDs exist and are unique, image references resolve, layout and skin are compatible, the bed head lies opposite its foot pivot, lift motion raises the correct end, and loose objects move downhill. A JSON file parsing successfully is not sufficient evidence that a composition is usable.

Prototypes use these same production boundaries. Prototype tuning, writing and shape artwork may be provisional, but episode-specific wiring or disposable scene architecture must not be used as a shortcut.

## Web and mobile path

The game will be implemented and tested in the browser first. The same responsive codebase will support:

- Touch controls on mobile browsers.
- Keyboard controls on desktop.
- Pointer controls as a fallback.

If native distribution becomes worthwhile, Capacitor can package the web build for iOS and Android and expose native features such as haptics. Native wrappers should not fork the game rules or episode content.

## Hosting, offline use and distribution

The canonical public site is **[thehorizontalfront.org](https://thehorizontalfront.org)**. Production builds consist only of static HTML, CSS, JavaScript, episode data and media assets, so they can be served by an ordinary static host without application servers, accounts or remote databases.

The browser release must remain usable without a network connection after its required files have been cached. The offline boundary includes the page shell, game code, episode data and the artwork and audio needed to play. Features should not acquire a runtime dependency on third-party APIs, remote fonts, analytics services or content delivery that would make the game fail when disconnected. Updates may of course require a connection to download a new static release.

The repository and distributable project materials form part of the digital commons. Project software uses `AGPL-3.0-or-later`; original cultural and documentary material uses `CC-BY-SA-4.0`, subject to the boundaries and provenance exceptions in [the licensing guide](../LICENSE.md).

No tracking or monetisation is part of the architecture. The game should not collect behavioural analytics, profile players, serve advertising, sell access or include purchases. Device-local settings and progress stay on the device and should not be transmitted elsewhere.

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

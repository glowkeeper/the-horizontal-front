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
  rhythmMomentum: number;
  nextRhythmStep: number;
  elapsedMs: number;
};

type Resistance = {
  readonly config: ResistanceConfig;
  readonly state: ResistanceState;
};

type ResistanceInput = {
  side: "left" | "right";
  atMs: number;
};

function applyResistanceInput(
  resistance: Resistance,
  input: ResistanceInput,
): Resistance {
  // Judge the side and timing against the next authored rhythm step,
  // then update momentum and duvet resistance.
}
```

The `Resistance` value keeps the fixed configuration and changing state of one confrontation together. Public transitions therefore cannot accidentally receive a different configuration on each call. This logic can be tested without starting Phaser or opening a browser. Mobile touch, desktop keyboard and pointer input can all produce the same `ResistanceInput` value.

Rhythm is part of the domain model, not an effect owned by Phaser or the audio system. The functional engine should judge normalised input against an authored pattern and explicit timing windows. The first pattern is a repeating left-right alternation, while future reusable capabilities may introduce accents, rests, syncopation, or changes between documented patterns.

One elapsed-time clock should drive rhythm judgement and the cues that communicate it. Phaser and the audio adapter may render sound, animation, visual pulses, and optional haptics, but they should derive those cues from engine timing rather than maintaining competing clocks. This keeps input results deterministic and lets equivalent audio and visual presentations describe the same required rhythm.

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

Application bootstrap selects content through an ordered JSON episode catalog and validates it before starting a gameplay scene. The first catalog entry is the normal campaign entry point; stable episode IDs identify content independently of its position. Build-time discovery includes every episode JSON file without per-episode TypeScript imports, while catalog loading rejects missing, duplicate, unlisted or identity-mismatched content. Adding and ordering an episode therefore changes data and creative assets, not application code.

Reusable scenes receive the validated episode as scene data; they do not import an episode file or choose an episode ID themselves. Episode presentation data selects a layout and skin. Validated layout JSON owns design-space anchors, pivots, interface slots and reusable motion parameters; validated skin JSON owns prototype primitive geometry or, later, semantic layered-asset references. Phaser code interprets this finite vocabulary and applies runtime state—it does not contain the authored composition coordinates.

Artwork files are resolved through a validated asset catalog using stable semantic IDs. Skins may use either documented prototype shapes or image parts referencing those IDs; they never contain repository paths. Build-time discovery rejects missing and unlisted files, and the generic boot scene preloads catalogued images before the selected presentation is instantiated.

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

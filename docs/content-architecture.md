# Content architecture

## Foundational constraint

> **A new episode must require no new programming.**

Not “usually no programming” and not “unless it does something interesting.” If an episode requires code, either the engine is incomplete or the proposed episode exceeds the game’s established vocabulary.

The engine provides reusable layouts and mechanics. Episodes provide structured data, writing, artwork and audio. This is both a technical decision and part of the game's identity: a small, comprehensible system supports creative expression without becoming an ever-expanding productivity apparatus.

## Rhythm as a source of variety

Rhythm is a core rule rather than decorative music laid over a tapping game. Episodes select dramatic curves; each curve composes reusable catalogue-owned rhythm patterns phase by phase. The implemented rhythm vocabulary contains timed left/right taps, explicit rests and sustained holds. Beat positions may be fractional, so the same finite notation expresses straight alternation, waltz groupings, syncopation, deliberate silence, press-and-release grips and call-and-response phrases.

Rhythm files define a bounded cycle in beats. Each event is exactly one of `tap`, `hold` or `rest`. Tap and hold events name a side and beat position; holds also name their duration; rests explicitly reserve silence. A dramatic phase selects a shared or same-episode rhythm and supplies tempo, timing tolerance, lead-in, pressure, recovery, resistance gain and loss, and presentation intensity. The content compiler resolves those references into a finite timestamped score before play. The plain TypeScript engine never branches on a rhythm, curve or episode ID.

The engine judges player input against the required pattern and timing. Successful performance builds persistent resistance strength and helps recover the duvet. Authored phase pressure is multiplied by the remaining exposed fraction, `1 − resistance strength`, until a miss weakens that protection. READY and REST preserve the earned value. The same engine clock should drive judgement and the audio, visual, and optional haptic cues that communicate the rhythm.

Rhythm data remains finite and readable. It has no expressions, callbacks, variables or general looping construct: repeating a bounded cycle for the duration of a phase is a single documented engine rule, not an embedded scripting language. Phase miss penalties are non-negative scalar data and default to zero when omitted. Any vocabulary expansion must serve several plausible episodes, remain simple to explain, and combine safely with existing resistance rules.

Difficulty should come from pattern, timing, composition, interruptions, and pressure rather than primarily from ever-higher input rates. This is both a design principle and a physical-accessibility constraint.

## Content hierarchy and ownership

The complete authoring vocabulary is defined by the [episode grammar
reference](episode-grammar-reference.md). The surrounding hierarchy and
ownership rules below explain how that grammar composes into a complete game.

### Shared and episode-owned definitions

Every reusable content family follows one ownership model:

```text
shared definition → shared definitions only
episode definition → shared definitions or definitions owned by that episode
episode definition → never another episode's private definitions
```

References make that choice explicit as `{ "source": "shared", "id": "..." }` or `{ "source": "episode", "id": "..." }`. An episode may define private rhythms, dramatic curves and any other mechanic family whose schema permits local authorship. Private IDs are scoped to that episode but may not shadow a shared ID; this prevents a reference changing meaning when content is moved or reused. Shared catalogues cannot depend on episode content, and loaders resolve local definitions only inside the episode currently being loaded.

This is the default ownership contract for mechanics, audio compositions, animation sequences, dialogue structures and other reusable systems. Presentation obeys the same dependency direction through its shared and episode skin/asset namespaces. A family may deliberately support only shared definitions—for example a tightly controlled engine layout—but that restriction must be explicit in its schema rather than accidental in its loader.

The authored root is `game.json`. It contains an ordered list of campaigns; each campaign JSON contains an ordered list of episodes. The first campaign and its first episode are the natural entry point. Stable IDs use descriptive lowercase kebab-case without numeric sequence segments, and each JSON filename must exactly match its ID. Episode IDs are globally unique across campaigns so saves, previews, presentation ownership and diagnostics never need a campaign-qualified identity.

Durable IDs name the finished creative work, not the implementation stage that produced it. `one-scene` and `resistance-test` were implementation stand-ins; `the-alarm` names the episode. The build rejects a small set of unambiguous placeholder segments, but this is chiefly an authorial judgement rather than something a vocabulary-blocking regex can decide.

IDs do not contain numeric sequence segments; spell meaningful numbers as words, for example `clause-four` or `the-nine-to-five`.

The generic loader discovers every campaign and episode JSON file without per-content TypeScript imports. It rejects duplicate IDs or files, missing or unlisted files, identity/filename disagreement and episodes listed by more than one campaign.

Each campaign has a finite narrative flow:

```text
briefing → ordered playable episodes → debriefing
```

The campaign JSON authors non-empty briefing and debriefing headlines and body copy, plus the debriefing label for the tally. A briefing may select a catalogued illustration through an explicit `shared` or `campaign` ownership reference; every debriefing must select one. A campaign-debrief illustration is an aftermath image, never an authored outcome: it must remain semantically valid for every possible `held / total` tally, including none, some or all episodes held, and must not visually assert victory, defeat or a particular score. The campaign does not author a score or executable entry, continuation or exit criteria. After an episode result, the player may retry without recording anything or accept either victory or forced verticalisation and advance. Plain TypeScript campaign rules count accepted victories as episodes held, accepted outcomes as episodes attempted, and present `held / total` after the final episode.

The player-facing application follows the same hierarchy. Boot presents a Campaigns screen generated from every validated campaign. Selecting one opens its briefing. After its debriefing, replay returns through that campaign's briefing with a fresh tally, while Campaigns returns to the catalogue. These are generic application states, not campaign-specific routes.

Player-visible language is entirely data-driven and partitioned by ownership:

- `game.json` owns global page and interface vocabulary, navigation labels, input labels, shared mechanic feedback and accessible-status templates.
- Campaign JSON owns that campaign's briefing, debriefing and tally label.
- Episode JSON owns episode-specific confrontation headings, instructions and outcome prose.
- Presentation layout and skin JSON own captions and labels attached to their authored visual roles.
- The engine owns computed values such as time, side and campaign totals, which are inserted into validated named-placeholder templates.

Phaser code selects and formats this copy but contains no player-visible string literals. The build policy checks this boundary so new scene text cannot silently become code-owned again.

Template fields use named placeholders containing letters and numbers only. Literal braces are not permitted in a template field, although ordinary non-template prose may contain them. Copy fields have conservative length limits so malformed content cannot silently spill far beyond the prototype canvas; richer overflow handling remains presentation work.

```text
game.json
campaigns/
  the-monday-uprising.json
episodes/
  the-alarm.json
mechanics/
  catalog.json
  rhythms/
    straight-alternation.json
    managerial-waltz.json
    syncopated-counterpull.json
    deliberate-rests.json
    three-and-rest.json
    sustained-grip.json
    call-and-response.json
  dramatic-curves/
    # shared curve JSON when a curve is genuinely reused
  interruptions/
    quick-call.json
    urgent-email.json
  presentation/
  asset-catalog.json
  layouts/
    episode-confrontation.json
  skins/
    shared/
    episodes/the-alarm/
  interruption-skins/
    shared/
    episodes/
  assets/
    shared/
    episodes/the-alarm/
```

The authoritative, author-facing description of the implemented format is the
[episode grammar reference](episode-grammar-reference.md). In summary, an
episode owns its identity, optional private mechanic definitions, one playable
confrontation and exactly two authored outcomes: victory and forced
verticalisation. Campaign briefings and debriefings belong to campaign JSON,
not episode JSON.

A confrontation selects a shared dramatic curve or one defined by its episode.
A curve contains one or more ordered phases plus a resolution duration. A phase
selects a rhythm and authors its duration, beat timing, pressure, recovery,
resistance-strength response and continuous presentation intensity.

Interruptions are composed at confrontation level and anchored to a named phase
and musical position. The currently implemented interruption mechanics are
`sequence` and `hold`. Possible future capabilities such as dual hold, reverse,
temptation or offensive are design ideas only and are not accepted episode
vocabulary.

Everything is selected from a documented set of valid pieces. The grammar is deliberately finite rather than pretending JSON can describe anything.

## Capabilities, skins and parameters

The engine must never contain episode-specific behaviour such as:

```ts
if (episode.id === "mandatory-wellness") {
  startWellnessAttack();
}
```

It should understand only generic, reusable capabilities selected through the
validated data described in the episode grammar reference.

Every interruption separates three concerns:

```text
Mechanic       What the player physically does
Skin           What corporate absurdity it represents
Parameters     How difficult it is
```

For example:

```json
{
  "id": "wellbeing-check-in",
  "kind": "sequence",
  "mechanic": { "source": "shared", "id": "quick-call" },
  "trigger": { "phase": "pressure", "afterCycles": 0, "afterBeats": 3 },
  "warningBeats": 1,
  "activeBeats": 3,
  "returnCountInBeats": 3,
  "consequences": { "successSafety": 0.03, "failureSafety": -0.04 },
  "presentation": {
    "skin": { "source": "shared", "id": "management-notification" }
  },
  "choices": [
    { "id": "completely", "label": "Completely", "key": "Digit1" },
    { "id": "extremely", "label": "Extremely", "key": "Digit2" },
    { "id": "mandatory", "label": "Mandatory", "key": "Digit3" }
  ],
  "steps": ["mandatory", "completely", "extremely"],
  "copy": {
    "warning": "INCOMING: WELLBEING CHECK-IN",
    "headline": "MANDATORY WELLBEING",
    "instruction": "COMPLETE THE ANSWERS IN ORDER",
    "status": "Complete the highlighted answers in order.",
    "success": "WELLBEING CONFIRMED",
    "failure": "INCORRECT WELLBEING",
    "expired": "WELLBEING AUTO-COMPLETED",
    "cancelled": "CHECK-IN CANCELLED",
    "returning": "BACK TO THE LINE"
  }
}
```

Quick Call and Wellbeing Check-In can therefore use the same mechanic with different presentation.

The [episode grammar reference](episode-grammar-reference.md#interruptions) is
authoritative for interruption composition and rejection rules. Runtime
scheduling, pressure suspension, input ownership and cancellation semantics are
documented under [Data-driven content](technical-architecture.md#data-driven-content);
their evidence basis remains in [Interruption mechanics and accessible rhythm
UI](research/interruption-mechanics-and-accessible-rhythm-ui.md).

Interruption definitions follow the same two-level ownership rule as rhythms and dramatic curves. A shared interruption mechanic may be selected by any episode. An episode may instead define and select a private mechanic, but cannot shadow a shared ID or access another episode's definitions.

Interruption presentation skins are a separate validated content family under `presentation/interruption-skins/shared/` and `presentation/interruption-skins/episodes/<episode-id>/`. Every interruption composition explicitly selects one with `{ source, id }`. A skin declares the mechanic kinds it supports and owns semantic appearance: theme roles, typography roles and sizes, layer depth, panel treatment, choice emphasis, hold progress styling, and warning/active/success/failure/cancelled/returning state treatments. Layout data continues to own anchors, dimensions and spatial offsets. The Phaser adapter interprets those two resolved inputs and contains no authored appearance values.

Resistance skins supply a complete resistance-state sequence when several
visual elements must share one authored perspective. Resistance
states use ordered physical-danger thresholds and ownership-qualified semantic
asset references. One shared display frame and pivot register every state on a
normalized local plane. The skin authors the maximum danger angle so Phaser can
rotate continuously with physical danger, plus the small threshold-transition
vocabulary—crossfade, jolt, shake and a reduced-motion crossfade. The generic
adapter performs the motion without knowing the episode or asset IDs.
Environment and opposing-actor layers remain independently authored so lighting,
spatial pressure and the antagonist's effort can change without being baked into
the primary artwork. The shared resistance layout also owns a semantic status-panel
frame and theme roles, protecting the headline and countdown from busy episode
art without embedding copy or episode-specific presentation in TypeScript.

The data-driven boundary applies to names as well as values. Shared schemas,
renderers and layout IDs describe reusable visual roles
(`confrontation.resistance`, `confrontation.opposingActor`,
`confrontation.environment` and state transitions); they must not
name an episode's furniture, character action or asset. Episode-owned skins and
catalogue entries may use story-specific language because that is authored
content, while ownership-qualified paths remain mandatory. A new episode changes
JSON and catalogued media, never TypeScript or renderer registration.

Shared interruption skins are globally reusable. Episode-owned interruption skins are private, cannot shadow shared IDs and are resolved only for their owning episode. Content loading and repository policy checks reject invalid paths, filename/ID mismatches, unresolved ownership references and mechanic/skin incompatibility.

## JSON must not become programming

The commitment to data-driven episodes must not produce a sprawling scripting language inside JSON. Avoid:

- Arbitrary condition trees.
- Variables created by episodes.
- Loops.
- Executable expressions.
- Custom event names.
- Embedded JavaScript.
- Episode-specific state machines.

Prefer the limited, readable options in the episode grammar reference. A future
engine expansion must update that reference when it introduces a new validated
choice; undocumented outcome commands are not accepted episode vocabulary.

If the schema becomes difficult to explain on one reasonably sized reference page, it is becoming too clever.

## Responsive cartoon composition

Cartoon scenes should use reusable layouts and semantic slots rather than making every episode a unique hard-coded composition.

```json
{
  "layout": { "source": "shared", "id": "episode-confrontation" },
  "skin": { "source": "episode", "id": "the-alarm-bedroom" }
}
```

The layout determines responsive placement, scaling, text-safe areas and
default layer order. The selected skin supplies validated visual parts and
semantic artwork references; episode copy remains in the episode itself.

An episode selects a documented layout and skin through explicit ownership references; it does not contain asset file paths or the complete scene drawing. Layout JSON defines shared design-space anchors, pivots, slots and motion parameters. Skin JSON defines the visual parts occupying those slots through either the finite prototype-shape vocabulary or explicitly owned semantic image references resolved by a validated asset catalogue. Catalogue-owned files use `shared/`, `campaigns/<campaign-id>/` and `episodes/<episode-id>/` namespaces. A campaign narrative may select shared art or art owned by that campaign; an episode result may select shared art or art owned by that episode. Shared skins can use only shared assets. An episode-owned skin can use shared assets and assets owned by the same episode, and only that episode can select it. Resolution never falls back across ownership levels. Shared Phaser adapters validate and interpret those files. This keeps ordinary composition and replacement artwork editable as data without turning episode JSON into a graphical programming language.

Campaign briefings, episode results and campaign debriefings share the validated `illustration-left` narrative layout. Its illustration and semantic-content regions are separate, bounded and approximately two-to-one in width. Artwork contains no story copy: headings, prose, tallies, instructions and actions remain in the semantic panel and retain their existing content ownership. The same renderer consumes all three narrative roles; selecting an illustration never introduces campaign- or episode-ID branching.

Each asset-catalogue entry is ordinary authored data. For example:

```json
{
  "id": "pillow-prototype",
  "file": "episodes/the-alarm/pillow-prototype.png",
  "origin": "ai-generated",
  "status": "prototype-placeholder",
  "creator": "Creator or source",
  "generatedAt": "2026-08-13",
  "generationTool": "Tool used, when applicable",
  "prompt": "Generation prompt, when applicable",
  "edits": ["Human selection, preparation and editing performed"],
  "licence": "CC-BY-SA-4.0",
  "replacementStatus": "What must happen before production approval"
}
```

`id` is the stable semantic name used by skins and narrative illustration references. `file` is the only repository path and must be a PNG or WebP inside an allowed ownership namespace. The remaining fields preserve provenance and distinguish provisional material from production-approved artwork.

Layout and skin validation must check relationships as well as field types. Coordinates and control bounds must fit the design canvas, dimensions must be positive, semantic part IDs must be unique and required parts present, layout/skin references must be compatible, and motion directions must agree with the layout's physical meaning.

## Future authoring tool

The Propaganda Department is a planned, deliberately constrained internal
authoring tool, not a general-purpose game editor and not a requirement for the
first release. It should eventually become the normal episode-authoring
interface and may allow an author to:

- Choose an episode structure and reusable layout.
- Drag, scale, rotate and reorder artwork.
- Select poses, expressions and attack skins.
- Edit dialogue and captions.
- Define phase timing, rhythm and pressure.
- Preview desktop and mobile framing.
- Preview keyboard and touch difficulty.
- Copy or download validated JSON.

It need not initially write directly to repository files. Copying or downloading JSON is sufficient. Direct local saving can be considered only if the manual step genuinely becomes troublesome.

The editor is also a design safeguard:

- If it cannot express an episode, that episode is not currently valid.
- If the editor becomes bewildering, the engine vocabulary is too large.
- If its generated JSON becomes incomprehensible, the data model is too complicated.

## Adding new engine capabilities

When an episode idea requires something outside the grammar, it must not receive a private exception. It proposes an **engine expansion**, which is separate from episode production.

Before adding a capability, ask:

1. Could existing mechanics express the idea?
2. Would the capability suit at least three episodes?
3. Does it reinforce the central rhythm-and-resistance identity?
4. Can it be explained simply in the episode guide?
5. Does it combine safely with existing mechanics?

If the answers are not convincing, rewrite the episode rather than enlarging the engine.

## Episode production workflow

Creating an episode is a repeatable creative process:

1. Write the political premise and punchline.
2. Write the campaign briefing when the episode begins a new campaign.
3. Select or commission the required poses and artwork.
4. Arrange the cartoon through validated layout and skin content; use the
   constrained authoring tool when it becomes available.
5. Define pressure, rhythm and interruptions through the episode grammar, anchoring interruptions to musical phrase boundaries.
6. Preview touch and keyboard difficulty.
7. Add audio and verify accessibility.
8. Validate and ship the episode.

The codebase grows only when the game deliberately gains a reusable mechanic or layout. The game itself grows through writing, balancing data, artwork and audio.

## Hard design rules

1. **Episodes contain no executable code.**
2. **A new episode requires only structured data, writing, artwork and audio.**
3. **The episode format uses a small documented vocabulary.**
4. **New engine capabilities must be reusable—not episode-specific exceptions.**
5. **Repetition is used deliberately as satire.**
6. **Variety comes primarily from writing, composition, timing, presentation and combination.**
7. **The complete episode format must remain understandable by a non-programmer.**

The simplicity should be visible in the finished work, not merely hidden in the architecture. The game repeatedly stages one modest political demand:

> Let me remain in bed.

Capital responds with endless policies, initiatives, incentives and threats. The player responds with the same stubborn rhythm.

That limitation does not impoverish the idea. It gives it form.

# Data-driven episode architecture

## Foundational constraint

> **A new episode must require no new programming.**

Not “usually no programming” and not “unless it does something interesting.” If an episode requires code, either the engine is incomplete or the proposed episode exceeds the game’s established vocabulary.

The engine provides reusable layouts and mechanics. Episodes provide structured data, writing, artwork and audio. This is both a technical decision and part of the game's identity: a small, comprehensible system supports creative expression without becoming an ever-expanding productivity apparatus.

## Simple does not mean same

A deck of cards has only 52 pieces and a handful of actions, yet produces enormous variety. A comic strip repeatedly uses the same characters and panels, but remains interesting because its situations and writing change.

The goal is not unlimited mechanical variety. It is a **small vocabulary with rich combinations**.

The initial mechanical vocabulary might contain:

- Follow an authored rhythm.
- Tap a sequence.
- Press and hold.
- Hold two controls.
- Ignore a temptation.
- Respond to reversed controls.
- Endure increasing pressure.

Episodes can combine these differently:

```text
Episode A
Steady rhythm → Quick Call → frantic finale

Episode B
Slow heavy rhythm → tempting promotion → reversed controls

Episode C
Rapid rhythm → hold an email while continuing → two simultaneous demands
```

Nothing new is programmed, but the dramatic shape changes.

## Rhythm as a source of variety

Rhythm is a core rule rather than decorative music laid over a tapping game. Episodes select dramatic curves; each curve composes reusable catalogue-owned rhythm patterns phase by phase. The implemented rhythm vocabulary contains timed left/right taps, explicit rests and sustained holds. Beat positions may be fractional, so the same finite notation expresses straight alternation, waltz groupings, syncopation, deliberate silence, press-and-release grips and call-and-response phrases.

Rhythm files define a bounded cycle in beats. Each event is exactly one of `tap`, `hold` or `rest`. Tap and hold events name a side and beat position; holds also name their duration; rests explicitly reserve silence. A dramatic phase selects a shared or same-episode rhythm and supplies tempo, timing tolerance, lead-in, pressure, recovery, resistance gain and loss, and presentation intensity. The loader resolves those references into a finite timestamped score before play. The plain TypeScript engine never branches on a rhythm, curve or episode ID.

The engine judges player input against the required pattern and timing. Successful performance builds persistent resistance strength and helps recover the duvet. Authored phase pressure is multiplied by the remaining exposed fraction, `1 − resistance strength`, until a miss weakens that protection. READY and REST preserve the earned value. The same engine clock should drive judgement and the audio, visual, and optional haptic cues that communicate the rhythm.

Rhythm data remains finite and readable. It has no expressions, callbacks, variables or general looping construct: repeating a bounded cycle for the duration of a phase is a single documented engine rule, not an embedded scripting language. Phase miss penalties are non-negative scalar data and default to zero when omitted. Any vocabulary expansion must serve several plausible episodes, remain simple to explain, and combine safely with existing resistance rules.

Difficulty should come from pattern, timing, composition, interruptions, and pressure rather than primarily from ever-higher input rates. This is both a design principle and a physical-accessibility constraint.

## Repetition is meaningful

The game should not become a collection of unrelated minigames. Some sameness is part of the satire:

- The boss always wants more.
- Corporate initiatives have different names but make the same demands.
- The player repeatedly fights for the same basic human freedom.
- Victory is temporary.
- Capitalism endlessly rebrands repetition as transformation.

The Orange Fella might announce, “This is a completely unprecedented productivity framework,” before launching essentially the same attack under a new logo. The player recognises the repetition even though the boss does not.

## Sources of variety

### Narrative

The strongest variety should come from writing and political subject matter:

- Mandatory wellbeing.
- Return-to-office mandates.
- AI productivity surveillance.
- Layoffs after record profits.
- Executive bonuses.
- Performance reviews.
- Corporate family rhetoric.
- Employee engagement surveys.
- Outsourcing.
- Zero-hours contracts.
- “Unlimited” holiday.
- Workplace mindfulness.
- A merger nobody wanted.

Each episode has its own premise, escalation and punchline.

### Dramatic structure

Episodes need not schedule pressure and attacks identically. One may be a steady siege; another may begin suspiciously easily; another may contain repeated temptations, false endings or a late betrayal.

The first production curve, `alarm-escalation`, proves this composition with orientation, establishment, pressure and crisis phases followed by a separately timed resolution. Other curves may use any number of phases and may rise steadily, provide false relief, reverse their pressure or combine different catalogue rhythms. Phase IDs are author-facing descriptions only; they have no special engine behaviour.

`The Alarm` exercises straight alternation, sustained grips and the shared `three-and-rest` phrase in live play. Its orientation teaches alternating taps, establishment introduces alternating press-and-release holds, pressure permits one protected beat after every three actions, and crisis returns to continuous alternation. The shared catalogue also contains deliberate rests, managerial waltz, syncopated counterpull and call-and-response patterns as validated production vocabulary ready for other episode compositions; their compiler and engine paths are covered by tests, but they are not all claimed as play-tested content. Explicit rests reserve authored silence and prevent other events occupying that interval. They intentionally compile to no input cue and suspend pressure, safety movement and resistance changes for their effective interval.

The compiled presentation timeline preserves taps, holds, authored rests and the opening count-in separately from scored input cues. `READY` is reserved for the confrontation's first lead-in. Later phase lead-ins provide unscored anticipation time: the upcoming control is visible while ordinary pressure continues against the resistance already earned. They do not manufacture another READY or an unauthored protected REST. Opening READY and authored REST suspend passive pressure and authored dramatic movement for their complete intervals, so obeying a non-input instruction cannot worsen the player's state. Their visible and mechanical pause ends when the following cue's valid input window opens—not at its nominal centre beat—so the game never accepts an input while still instructing the player to wait. A shared guide selector exposes current and upcoming events to visual, audio or haptic adapters without putting judgement rules in those adapters. The Phaser presentation projects that timeline at one constant scroll speed: tap notes cross compact control gates, long hold notes have duration-derived length and distinct head and tail boundaries, completed actions disappear immediately, and expired actions escape as crossed misses. Each lane clips at the centre emitter and canvas edge, so arbitrarily long authored holds stream through the available space without crossing into the other lane. Gate width is derived from each action's authored timing tolerance, so visual and mechanical acceptance share a boundary; an active hold latches the gate and colours its sustained section. Compact REST and READY bands remain at the centre because they have no control target. Rests remain absent from the scored cue list. Layout data owns guide count, scroll speed, supported tolerance, geometry and opacity; other adapters may consume the same timeline for audio, haptics or phrase rehearsal.

The crisis is a continuous alternating final phrase with no protected internal rest. Its visual intensity and authored pressure reach maximum, but its mechanical pressure remains answerable: resistance earned before and during the phrase persists between its beats, and accurate final play can recover a threatened position. Urgency comes from committing to the phrase rather than from an unsafe leap in input rate.

### Mechanical composition

A small number of mechanics may interact:

- Alternate while holding.
- Follow a sequence while pressure continues.
- Ignore a promotion while it obscures the play area.
- Handle reversed controls during the morning offensive.
- Maintain rhythm while notifications compete for attention.

Supported combinations must be explicit engine capabilities. The data format must not become a hidden programming language.

### Presentation

The bedroom remains recognisable while its presentation changes:

- Dawn, rain, a heatwave or winter darkness.
- A video call projected onto the wall.
- Office furniture invading the room.
- Corporate banners covering personal possessions.
- Multiple Orange Fellas appearing on screens.
- A shareholder meeting outside the window.
- The bedroom becoming increasingly office-like.
- Management presenting the same initiative under a new colour scheme.

Cartoon sequences provide more visual freedom than the gameplay stage needs.

### Emotion

Episodes can be broadly ridiculous, quietly sinister, triumphantly rebellious, melancholic, surreal, hopeful or angry. The same short framework can feel different depending on its narrative context, dialogue, music and result.

## Finite episode grammar

The complete system should have an explicit, documented grammar that a non-programmer can understand.

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

The campaign JSON authors non-empty briefing and debriefing headlines and body copy, plus the debriefing label for the tally. It does not author a score or executable entry, continuation or exit criteria. After an episode result, the player may retry without recording anything or accept either victory or forced verticalisation and advance. Plain TypeScript campaign rules count accepted victories as episodes held, accepted outcomes as episodes attempted, and present `held / total` after the final episode.

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
```

```text
An episode consists of:

1 briefing
1 confrontation
1 result

A confrontation explicitly selects either a shared dramatic curve or one defined by its episode. A curve consists of one or more ordered phases and a resolution duration. `The Alarm` owns `alarm-escalation` inside its episode JSON because that composition is part of the episode's authorship; its phases reuse shared rhythm vocabulary.

A phase may define:

- Duration
- Boss pressure
- Catalogued rhythm ID
- Beat interval, timing window and lead-in
- Recovery and resistance-strength parameters
- Continuous presentation intensity
- Available attacks
- Dialogue interruption
- Visual state
- Audio state

The currently implemented interruption mechanics are:

- Sequence
- Hold

The wider finite vocabulary may grow deliberately to include:

- Dual hold
- Reverse
- Temptation
- Offensive

A result is:

- Victory
- Failure
- Trap consequence
```

Everything is selected from a documented set of valid pieces. The grammar is deliberately finite rather than pretending JSON can describe anything.

## Capabilities, skins and parameters

The engine must never contain episode-specific behaviour such as:

```ts
if (episode.id === "mandatory-wellness") {
  startWellnessAttack();
}
```

It should understand generic, reusable capabilities:

```ts
runAttack({
  type: "sequence",
  prompt: "COMPLETE YOUR WELLBEING CHECK-IN",
  choices: ["Thriving", "Energised", "Fully aligned"],
  order: [2, 0, 1]
});
```

Every attack separates three concerns:

```text
Mechanic       What the player physically does
Skin           What corporate absurdity it represents
Parameters     How difficult it is
```

For example:

```json
{
  "mechanic": { "source": "shared", "id": "quick-call" },
  "presentation": {
    "skin": { "source": "shared", "id": "management-notification" }
  },
  "choices": [
    { "id": "completely", "label": "Completely", "key": "Digit1" },
    { "id": "extremely", "label": "Extremely", "key": "Digit2" },
    { "id": "mandatory", "label": "Mandatory", "key": "Digit3" }
  ],
  "steps": ["mandatory", "completely", "extremely"]
}
```

Quick Call and Wellbeing Check-In can therefore use the same mechanic with different presentation.

An interruption composition anchors a reusable mechanic to a musical boundary using a phase ID, completed cycle count and an optional beat offset within that cycle. It supplies warning, active and return durations in beats—not unrelated wall-clock offsets—and declares bounded success and failure safety consequences. Compilation resolves beats through the selected phase tempo, rejects unknown phases, incompatible mechanic kinds, malformed choices, overlapping windows and starts inside an occupied tap, hold, rest or count-in interval. Cue and guide filtering use the same complete occupied intervals, including hold tails, before emitting pressure-pausing active and count-in intervals.

The return boundary is the end of the authored count-in, expressed against the phase's musical clock. Resistance control becomes available there; an authored rest may deliberately follow before the next playable input window. Presentation validation separately guarantees that the first returning note can make its complete visible approach after the interruption panel clears.

Sequence choices have stable local IDs, labels and keyboard bindings. Their ordered steps may reference only those choices. Hold mechanics define a press window and required duration in beats; episode presentation supplies the control label and confrontation copy. Browser or hardware cancellation is a neutral resolved outcome, distinct from a deliberate early release.

Interruption definitions follow the same two-level ownership rule as rhythms and dramatic curves. A shared interruption mechanic may be selected by any episode. An episode may instead define and select a private mechanic, but cannot shadow a shared ID or access another episode's definitions.

Interruption presentation skins are a separate validated content family under `presentation/interruption-skins/shared/` and `presentation/interruption-skins/episodes/<episode-id>/`. Every interruption composition explicitly selects one with `{ source, id }`. A skin declares the mechanic kinds it supports and owns semantic appearance: theme roles, typography roles and sizes, layer depth, panel treatment, choice emphasis, hold progress styling, and warning/active/success/failure/cancelled/returning state treatments. Layout data continues to own anchors, dimensions and spatial offsets. The Phaser adapter interprets those two resolved inputs and contains no authored appearance values.

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

Prefer a limited collection of readable, validated options:

```json
{
  "onSuccess": "resume",
  "onFailure": "increase-pressure",
  "onIgnored": "award-non-compliance"
}
```

If the schema becomes difficult to explain on one reasonably sized reference page, it is becoming too clever.

## Responsive cartoon composition

Cartoon scenes should use reusable layouts and semantic slots rather than making every episode a unique hard-coded composition.

```json
{
  "layout": "boss-intrudes-right",
  "layers": [
    {
      "asset": "boss-smug",
      "slot": "boss",
      "offset": { "x": -20, "y": 5 },
      "scale": 1.1
    }
  ]
}
```

The layout determines responsive placement, scaling, text-safe areas and default layer order. The episode supplies poses, dialogue, props and small artistic offsets.

An episode selects a documented layout and skin through explicit ownership references; it does not contain asset file paths or the complete scene drawing. Layout JSON defines shared design-space anchors, pivots, slots and motion parameters. Skin JSON defines the visual parts occupying those slots through either the finite prototype-shape vocabulary or explicitly owned semantic image references resolved by a validated asset catalogue. Both skins and catalogue-owned files use `shared/` and `episodes/<episode-id>/` namespaces. Shared skins can use only shared assets. An episode-owned skin can use shared assets and assets owned by the same episode, and only that episode can select it. Shared Phaser adapters validate and interpret those files. This keeps ordinary composition and replacement artwork editable as data without turning episode JSON into a graphical programming language.

Each asset-catalogue entry is ordinary authored data. For example:

```json
{
  "id": "pillow-prototype",
  "file": "episodes/the-alarm/pillow-prototype.png",
  "kind": "image",
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

`id` is the stable name used by skins. `file` is the only repository path and must be a PNG or WebP inside an allowed ownership namespace. The remaining fields preserve provenance and distinguish provisional material from production-approved artwork.

Layout and skin validation must check relationships as well as field types. Coordinates and control bounds must fit the design canvas, dimensions must be positive, semantic part IDs must be unique and required parts present, layout/skin references must be compatible, and motion directions must agree with the layout's physical meaning.

## The Propaganda Department editor

A simple internal composition mode should become the normal episode-authoring interface. It may allow an author to:

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

Once the engine exists, creating an episode should be a repeatable creative process:

1. Write the political premise and punchline.
2. Choose a briefing layout.
3. Select or commission the required poses and artwork.
4. Arrange the cartoon in composition mode.
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

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

Rhythm is a core rule rather than decorative music laid over a tapping game. An episode may select from a small documented vocabulary of reusable rhythm patterns and parameters, including a countable lead-in before the first required input. The first prototype needs only a repeating left-right alternation, but later engine capabilities may support accents, rests, strong and weak beats, syncopation, or changes between established patterns.

The engine judges player input against the required pattern and timing. Successful performance builds rhythmic momentum, which strengthens resistance and helps recover the duvet. Poorly timed or incorrect input loses momentum. The same engine clock should drive judgement and the audio, visual, and optional haptic cues that communicate the rhythm.

Rhythm data must remain finite and readable. It must not grow into a musical programming language, arbitrary sequencer, or executable notation hidden inside episode JSON. Any expansion should follow the same capability test as other mechanics: it should serve several plausible episodes, remain simple to explain, and combine safely with existing resistance rules.

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

```json
{
  "phases": [
    {
      "duration": 6,
      "pressure": "low",
      "mood": "suspiciously-calm"
    },
    {
      "duration": 12,
      "pressure": "high",
      "attacks": ["quick-call", "urgent-email"]
    },
    {
      "duration": 4,
      "pressure": "none",
      "bossLine": "Congratulations. The restructure is complete."
    },
    {
      "duration": 8,
      "pressure": "extreme",
      "attacks": ["return-to-office"]
    }
  ]
}
```

The engine understands phases, dialogue cues, pressure and attacks. The episode merely arranges them.

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

Episodes are listed in an ordered JSON catalog. Array position defines campaign order and the first entry is the natural starting episode. Each entry pairs a stable episode ID with its JSON filename; the ID does not change when an episode is reordered and can later support saves or direct preview. The loader validates both the catalog and every discovered episode, rejecting duplicate IDs or files, missing or unlisted files, and disagreement between catalog and episode IDs. No episode requires a TypeScript import or registration.

```text
An episode consists of:

1 briefing
1 confrontation
1 result

A confrontation consists of:

1–5 phases

A phase may define:

- Duration
- Boss pressure
- Required rhythm
- Available attacks
- Dialogue interruption
- Visual state
- Audio state

An attack is one of:

- Sequence
- Hold
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
  "mechanic": "sequence",
  "skin": "wellbeing-survey",
  "prompt": "How supported do you feel?",
  "choices": [
    "Completely",
    "Extremely",
    "Mandatory"
  ],
  "sequenceLength": 4,
  "timeLimit": 3
}
```

Quick Call and Wellbeing Check-In can therefore use the same mechanic with different presentation.

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

An episode selects a documented layout and skin by stable ID; it does not contain asset file paths or the complete scene drawing. Layout JSON defines shared design-space anchors, pivots, slots and motion parameters. Skin JSON defines the visual parts occupying those slots through either the finite prototype-shape vocabulary or semantic image IDs resolved by a validated asset catalogue. Shared Phaser adapters validate and interpret those files. This keeps ordinary composition and replacement artwork editable as data without turning episode JSON into a graphical programming language.

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
5. Define pressure, rhythm and attacks through the episode grammar.
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

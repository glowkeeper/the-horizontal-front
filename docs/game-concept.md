# The Horizontal Front

> **Seize the Means of Relaxation.**

## High concept

The Horizontal Front is a satirical arcade game for web and mobile. The player is trying to remain safely in bed while their boss applies increasing pressure to tip the bed, expose them from beneath the duvet, and force them into work.

To resist, the player must perform rhythmic patterns through taps, clicks, or keys. The irony is the heart of the game: the player has to work extremely hard to avoid work.

The satire targets exploitative work culture, compulsory productivity, corporate euphemisms, and executive power. The recurring boss is Management: a fictional, broadly recognisable and grotesque embodiment of capitalism at its worst rather than a depiction or coded stand-in for any particular politician or other real person.

## Player fantasy

The player is not merely sleepy. Staying in bed is an act of organised resistance. They are holding the line against forced verticalisation and defending the right to rest.

Possible opening copy:

> **COMRADE, HOLD THE LINE.**  
> Management has breached the bedroom.  
> Your alarm has collaborated with the enemy.  
> Stay horizontal until the shift breaks.

## Core loop

1. A level begins with the player safely in bed.
2. The boss applies continuous pressure, but earned resistance suppresses its mechanical effect between beats.
3. Successful rhythmic inputs strengthen that persistent resistance and pull the duvet back toward safety.
4. Corporate attacks periodically interrupt, complicate, or replace the current rhythm.
5. Pressure escalates through the episode's authored dramatic phases.
6. The final crisis becomes a frantic morning offensive without relying only on faster input.
7. Survive the episode's authored duration to clear it. Lose the duvet completely and the player is tipped out of bed.

The duvet and bed communicate danger directly: the duvet is progressively pulled down, the mattress tilts, the player becomes exposed, and cold work light invades the room. A small optional accessibility indicator may supplement this presentation, but a conventional Tilt Meter is not the primary interface.

The authored pressure curve controls management's attack, not an unavoidable damage rate. Net safety loss is the unresisted fraction of that pressure: accurate performance must remain mechanically effective even when the authored rhythm is slow. The duration, pressure curve, resistance gains and recovery per input all require playtesting.

Episode length is authored per episode, not fixed by the engine. `The Alarm` runs about thirty-three seconds of play followed by a short resolution, and later episodes may run considerably longer where their composition earns it. What constrains length is not a target number but whether each dramatic phase can hold what is authored into it: a phase must fit its rhythm's repeating cycle, its lead-in, and any interruption, and must still leave playable resistance after that interruption returns. Content validation enforces those relationships, so a phase that has been over-filled fails the build rather than quietly dropping the composition's tail.

## Finite vocabulary, rich combinations

A deck of cards has only 52 pieces and a handful of actions, yet produces
enormous variety. A comic strip repeatedly uses the same characters and panels,
but remains interesting because its situations and writing change. The goal is
not unlimited mechanical variety. It is a small vocabulary with rich
combinations.

The intended mechanical vocabulary includes:

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

These are design possibilities, not a claim that every listed capability is
currently accepted by the episode grammar. The authoritative implemented
vocabulary remains the [episode grammar
reference](episode-grammar-reference.md).

## Repetition is meaningful

The game should not become a collection of unrelated minigames. Some sameness is part of the satire:

- The boss always wants more.
- Corporate initiatives have different names but make the same demands.
- The player repeatedly fights for the same basic human freedom.
- Victory is temporary.
- Capitalism endlessly rebrands repetition as transformation.

Management might announce, “This is a completely unprecedented productivity framework,” before launching essentially the same attack under a new logo. The player recognises the repetition even though Management does not.

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

The compiled score and its visual, audio and optional haptic projections share one timing source. The authoritative pause, gate, hold, clipping and layout semantics are documented under [Rhythm timeline and presentation](technical-architecture.md#rhythm-timeline-and-presentation).

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
- Multiple Management broadcasts appearing on screens.
- A shareholder meeting outside the window.
- The bedroom becoming increasingly office-like.
- Management presenting the same initiative under a new colour scheme.

Cartoon sequences provide more visual freedom than the gameplay stage needs.

### Emotion

Episodes can be broadly ridiculous, quietly sinister, triumphantly rebellious, melancholic, surreal, hopeful or angry. The same short framework can feel different depending on its narrative context, dialogue, music and result.

## Basic input

Normal tapping represents pulling the duvet back, gripping the mattress, or otherwise resisting the boss. The game should reward rhythm and sustained effort without demanding unsafe or inaccessible input speeds.

The first episode begins with a simple alternating left-right pattern, but alternation is only the first member of the implemented rhythm catalogue. The same validated vocabulary already expresses rests, sustained holds, waltz groupings, syncopation, call-and-response and deliberately awkward managerial rhythms. Episodes and dramatic phases select and combine those reusable patterns as data. Difficulty should come from listening, anticipation, coordination, interruptions, and pattern changes as well as pressure. It should not primarily scale by demanding ever more inputs per second.

Accurate hits build persistent resistance strength. Authored pressure acts only on the remaining exposed fraction, so resistance continues between beats rather than behaving like discrete healing against continuous unavoidable damage. Misses weaken resistance; READY and REST freeze both safety and earned strength. Beat frequency therefore does not determine whether an episode gives the player enough opportunities to survive.

The required rhythm, player input, procedural audio, visual timing cues, and optional haptic cues should share one timing source. Music can therefore teach and enforce a pattern rather than merely accompany it. Critical timing must never be communicated by music alone: equivalent visual cues must support deaf and hard-of-hearing players, while clear audio cues should support players who cannot rely on the visual presentation.

Complex rhythms must be taught before they are tested. The implemented outward-moving guide makes timing visible at the left and right controls, represents hold duration geometrically and pauses danger during genuine READY and REST instructions. Its authoritative timing and presentation behaviour is documented under [Rhythm timeline and presentation](technical-architecture.md#rhythm-timeline-and-presentation).

Difficulty should be calibrated per input method. Five taps per second on a touchscreen does not necessarily represent the same effort as five alternating keyboard presses. The experience should feel equivalently demanding across devices rather than using identical numerical thresholds. Complex rhythms should usually trade physical speed for cognitive or coordinative difficulty, and reduced-input options should preserve the rhythmic idea without requiring unsafe repetition.

## Corporate attacks

Boss attacks briefly replace or complicate normal resistance. Each should be readable through animation and layout without requiring the player to study instructions.

Quick Call and Urgent Email are the currently implemented interruption
mechanics. Team Player, Performance Review and Promotion Opportunity are design
directions rather than accepted episode vocabulary. Return to Office describes
a dramatic crisis, not an interruption mechanic.

### Quick call?

Several excuse buttons appear around the screen, such as **Dentist**, **Wi-Fi**, and **Family emergency**. The player must hit the highlighted buttons in sequence before the call connects. A wrong or late input lets the boss tip the bed further.

This tests accuracy rather than raw speed.

### Urgent email

A large email notification obstructs part of the screen. The player must press and hold it to **Mark as unread**. Releasing too early opens the email and strengthens the boss.

A later, harder version could require the player to continue resisting with a second finger or key while holding the notification.

### Team player

Two targets appear, perhaps labelled **Synergy** and **Collaboration**. The player must activate both simultaneously or alternate between them rapidly.

The joke is that one employee is expected to do two people's work.

### Performance review

The controls reverse temporarily. The normal resistance input now assists the boss, forcing the player to use the opposite side or control. A clear horizontal flip, colour change, and warning animation must signal the reversal fairly.

### Promotion opportunity

A shiny offer appears: **ACCEPT PROMOTION — +20% PAY!**

Accepting grants a small immediate benefit but permanently increases the boss's strength through **More Responsibility**. Ignoring it is usually the strategically wiser choice. This should be tempting enough that accepting it feels like a meaningful mistake rather than an obvious trap.

## Return to office crisis

Return to Office is a climactic dramatic phase rather than a separate attack.
Management pressure intensifies, office alarms flash, and the boss launches an
all-out productivity offensive. The required rhythm may become more insistent
or disruptive, but the finale should not depend only on increasing the physical
input rate.

## First playable milestone

The first playable prototype proves the physical comedy and difficulty curve
with two interruptions and one crisis phase:

1. **Quick Call** — accurate sequential tapping.
2. **Urgent Email** — press and hold.
3. **Return to Office crisis** — the frantic finale expressed through the dramatic curve.

Team Player, Performance Review and Promotion Opportunity remain possible future
capabilities and are not part of the implemented grammar.

## Web and mobile controls

The game should use one responsive codebase and one set of rules, with controls adapted to the device.

### Mobile

- Tap the left and right resistance controls in time with the authored rhythm.
- Alternate thumbs when the selected pattern calls for alternating sides.
- Press and hold notifications to dismiss them.
- Use two fingers for Team Player.
- Tap highlighted areas for Quick Call.
- Use animation, sound, and optional vibration to make successful inputs satisfying.

Device shaking and physical tilt should not be required. They are unreliable, inaccessible, and awkward for someone genuinely playing in bed. They could become optional novelty modes later.

### Desktop web

- Alternate `A` and `L`, or the left and right arrow keys, as the preferred resistance input.
- Support mouse and trackpad clicking as a fallback.
- Use Space or a held mouse button for Urgent Email.
- Use numbered keys or clicking for Quick Call.
- Hold two keys simultaneously for Team Player.

Alternating keys should initially feel like an old arcade game. Input is judged against the required pattern and timing rather than rewarded simply for arriving quickly.

### Control mapping

| Event | Status | Mobile | Desktop |
| --- | --- | --- | --- |
| Quick Call | Implemented interruption | Tap highlighted excuses | Tap them or use numbered keys |
| Urgent Email | Implemented interruption | Press and hold | Hold pointer or Space |
| Team Player | Design direction | Two-finger input | Hold two keys simultaneously |
| Performance Review | Design direction | Touch zones reverse | Left and right keys reverse |
| Return to Office crisis | Implemented dramatic phase | Authored final rhythm | Authored final rhythm |
| Promotion Opportunity | Design direction | Tap or ignore | Click, press Enter, or ignore |

## Progression ideas

Possible levels or campaign beats:

1. Monday Morning
2. Mandatory Stand-up
3. Quarterly Crunch
4. Return to Office
5. Executive Offsite
6. The Shareholder Awakens

The difficulty can increase through stronger constant pressure, more frequent interruptions, combined attacks, deceptive offers, and more demanding finales—not merely by requiring ever-higher tapping speeds.

### Interruption readability

Management interruptions follow one shared perceptual lifecycle: warning, active interaction, immediate outcome and a musical return count-in. They begin only at validated rhythm-phrase boundaries. Replacement interruptions visibly take ownership of the controls, suspend baseline pressure and return control at the opening edge of the first playable resistance window. The first episode introduces Quick Call and Urgent Email individually rather than requiring simultaneous resistance.

The evidence and design inferences behind this convention are recorded in [Interruption mechanics and accessible rhythm UI](research/interruption-mechanics-and-accessible-rhythm-ui.md).

## Tone and language

The game presents the bedroom as a revolutionary front and corporate demands as military offensives. Useful vocabulary includes:

- Players: **Horizontalists**
- Staying in bed: **Holding the line**
- Levels: **Shifts** or **Days of resistance**
- Losing: **Forced verticalisation**
- Boss attacks: **Productivity offensives**
- Final crisis: **The morning offensive**
- Opening campaign: **The Monday Uprising**
- Perfect level: **Full Non-Compliance**
- Player community: **The Horizontal Front**

The writing should be sharp and ridiculous, not doctrinaire. Corporate euphemisms are funnier when management treats them with complete seriousness.

Additional slogans and achievement language:

- Workers of the world, sleep in.
- Work hard. Stay horizontal.
- Your boss wants you vertical.
- Nobody gets up until conditions improve.
- Industrial inaction begins at dawn.
- Hold the line. Keep it horizontal.
- The struggle is real. The mattress is soft.
- Defeat productivity from the comfort of home.

## Visual direction

The preferred style is a colourful editorial cartoon with revolutionary-poster energy:

- The bedroom uses cosy, soft, desirable colours and rounded forms.
- Work intrusions use aggressive gold, red, and corporate blue.
- The bed should look irresistibly comfortable.
- Corporate objects should be sharp, loud, intrusive, and faintly ridiculous.
- Visual motifs could include raised fists gripping pillows, crossed alarm clocks, duvet-red banners, and management propaganda.

Management should be a wholly fictional grotesque of authoritarian executive power and capital accumulation. The figure may combine impossible corporate polish, acquisitive anatomy, predatory machinery, vanity, bluster and gaudy excess, but must not use a recognisable politician's face, hair, gestures, costume or signature traits as visual shorthand.

The game's logo and art direction should be original.

### Starting colour system

The first intentional palette establishes a semantic opposition between warmth, solidarity and resistance on one side, and cold work light and gaudy management authority on the other:

- **Duvet cream (`#F3E8D0`)** — the warm foundational surface.
- **Ink charcoal (`#201C19`)** — readable text and structural line work.
- **Resistance red (`#B8322A`)** — collective action, primary emphasis and calls to resist.
- **Work-light blue (`#3E6F8F`)** — corporate intrusion, danger and forced verticalisation.
- **Management gold (`#C8952E`)** — vanity, accumulation and executive spectacle.
- **Paper white (`#FFFDF7`)** — documents, cards and quiet readable surfaces.

These are intentional starting roles rather than a claim that every final shade is settled. Public HTML and Phaser must consume the same shared design tokens for colour and typography so visual meaning does not drift between the site and game. Canvas-specific sizes and wrapping remain in the Phaser adapter because they respond to the fixed game coordinate system rather than the document layout.

## Audio and feedback

Every successful action needs satisfying feedback: mattress movement, duvet snaps, meter recovery, character effort, and escalating music. Corporate attacks could arrive through notification chimes, video-call tones, office alarms, and motivational voice lines.

The default audio direction is original procedural synthesis rather than sampled effects. Duvet pulls, rhythm ticks, notification chirps, warning alarms, victory and failure stings, and fluorescent office hum can be generated mathematically and tuned with the gameplay. This provides especially clear provenance and may remain suitable for production if the resulting sound design is strong enough.

Management does not need intelligible recorded dialogue. The figure can rumble, bluster and punctuate scenes through an original, unintelligible synthesised voice while speech bubbles carry the actual words. This makes Management sound like noisy institutional power without cloning or impersonating a real person. It also keeps politically important dialogue readable.

Mobile vibration should be optional. Sound, colour, and motion cues should never be the sole way critical information is communicated.

## Accessibility and comfort

Pure tapping can become physically unpleasant before it becomes funny. The game should preserve the joke without excluding players or encouraging strain.

Potential measures:

- A reduced-input accessibility mode.
- Configurable hold-to-resist controls.
- Input requirements calibrated for the selected device and accessibility mode rather than fixed extreme speeds.
- Short levels and generous pauses.
- Strong non-colour indicators for changing states.
- Reduced motion and vibration settings.
- Full keyboard, pointer, and touch support.
- Avoid gestures that require shaking the device.

Accessibility mode should change the required input pattern, not patronise the player or remove the satire.

## Design principles

1. **The contradiction is the game.** Working hard to avoid work must remain mechanically visible.
2. **Every interruption is a corporate joke.** Mechanics and writing should reinforce each other.
3. **Escalate through variety.** Do not rely only on faster tapping.
4. **Readable before explained.** Attacks should communicate themselves through motion and layout.
5. **Equivalent effort across devices.** Mobile and desktop need not use identical thresholds.
6. **Frantic, not harmful.** Physical comedy should never require pain.
7. **Satirise systems and archetypes.** Keep fictional characters distinct from real individuals.
8. **Episodes are content, not software releases.** New episodes require data, writing, artwork and audio, but no new programming.

## Open questions

The settled reasoning is recorded in [Design decisions](design-decisions.md).

The ownership and catalogue architecture is documented in [Content
architecture](content-architecture.md); the accepted authoring vocabulary is
defined by the [Episode grammar reference](episode-grammar-reference.md).

Questions that remain genuinely open include:

- What is the smallest episode vocabulary that produces sufficient variety?
- How should the first set of episodes vary in rhythm, dramatic shape and emotion?
- Which appearance choices, if any, should the protagonist eventually offer?
- How much narrative should occur between confrontations without weakening the arcade pace?
- Which original recurring visual and sonic traits make Management recognisable without evoking a particular real person?

## Naming note

The working and intended title is **The Horizontal Front**, paired with **Seize the Means of Relaxation**.

The phrase has some unrelated technical uses, including a genetics term, but an initial web search found no obvious existing game or entertainment title collision. This was a preliminary search, not formal trademark clearance.

Repository name: `the-horizontal-front`

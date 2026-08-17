# Episode grammar reference

This page describes the complete episode vocabulary currently accepted by The
Horizontal Front. It is an authoring contract, not a list of future ideas. A new
episode uses JSON, writing, catalogued artwork and audio; it contains no code,
expressions, variables, loops or private engine commands.

`The Alarm` in `src/play/content/episodes/the-alarm.json` is the first complete
example. An episode file is named exactly `<episode-id>.json` and has this shape:

```text
schemaVersion: 1
id: descriptive-lowercase-kebab-case
title: player-facing title
definitions: optional private rhythms, dramatic curves and interruption mechanics
confrontation: resistance, interruptions, presentation and copy
results: success and failure
```

Campaign briefing and debriefing prose is not episode content. Global interface
and reusable mechanic wording belongs to `game.json`.

## References and ownership

A reference is `{ "source": "shared", "id": "..." }` or
`{ "source": "episode", "id": "..." }`.

- Shared definitions may reference shared definitions only.
- Episode definitions may reference shared definitions or definitions owned by
  that same episode.
- An episode cannot use another episode's private content.
- A private ID cannot shadow a shared ID.

Shared rhythms and interruption mechanics must be listed in
`mechanics/catalog.json` with an exactly matching JSON filename. Dramatic curves
are usually episode-owned today; the shared-curve catalogue is supported but is
currently empty. Every array inside `definitions` may be omitted when unused.

## Rhythms

A rhythm has `schemaVersion`, `id`, positive `cycleBeats` and one or more
`events`. Beat positions may be fractional. An event is exactly one of:

```text
tap:  action, side (left|right), atBeat
hold: action, side (left|right), atBeat, durationBeats
rest: action, atBeat, durationBeats
```

Every event must fit inside the cycle. Events and declared rests must not
overlap, coincident taps are invalid, and a rhythm must contain at least one tap
or hold.

## Dramatic curves and phases

A curve has `schemaVersion`, `id`, `startingSafety` from 0 to 1,
`resolutionDurationMs`, `approachLeadBeats`, and one or more uniquely named
`phases`. Adjacent phases must join at the same presentation intensity.

`approachLeadBeats` is how far ahead of each sided demand the apparatus
announces it, measured in beats rather than milliseconds so it keeps its
musical place as the tempo changes. A half-beat lead puts the announcement on
the offbeat, between one strike and the next; a whole beat puts it on the
preceding beat. It is what makes the score playable by ear.

Each phase authors:

| Field | Meaning |
| --- | --- |
| `id` | Author-facing phase name. It has no special engine behaviour. |
| `durationMs` | Positive phase duration. |
| `rhythm` | Shared or same-episode rhythm reference. |
| `beatIntervalMs` | Milliseconds per beat. |
| `timingWindowMs` | Input tolerance on either side of a beat; less than half a beat. |
| `leadInBeats` | Whole beats before this phase's first rhythm cycle. On the first phase this creates READY. |
| `pressurePerSecond` | Opposing-actor pressure while play is active. |
| `recoveryPerAction` | Safety recovered by a successful action. |
| `safetyPenaltyPerMiss` | Non-negative safety penalty for a miss; defaults to zero. |
| `resistanceGainPerHit` | Persistent resistance gained by a hit, from 0 to 1. |
| `resistanceLossPerMiss` | Persistent resistance lost by a miss, from 0 to 1. |
| `resistanceRecoveryBonus` | Recovery multiplier supplied by accumulated resistance. |
| `presentationIntensity` | `from` and `to`, each from 0 to 1. |

`confrontation.resistance.dramaticCurve` selects the curve to compile.

## Interruptions

An interruption mechanic definition is reusable rules without episode prose or
presentation. A `sequence` definition has `schemaVersion`, `id`, `kind`,
`choiceCount` (two or three) and `stepCount` (one to eight). A `hold` definition
has `schemaVersion`, `id`, `kind`, positive `pressWindowBeats` and positive
`holdBeats`.

`confrontation.interruptions` may be omitted. Otherwise it is an ordered array
of sequence or hold compositions. Every interruption has:

```text
id, kind, mechanic
trigger: phase, afterCycles, afterBeats
warningBeats, activeBeats, returnCountInBeats
consequences: successSafety, failureSafety
presentation.skin
copy: warning, headline, instruction, status, success, failure,
      expired, cancelled, returning
```

`afterCycles` is a whole number. `afterBeats` may be fractional but must fall
inside the selected rhythm cycle. Warning, active and return windows must fit
inside the selected phase, must not overlap another interruption, and cannot
start inside an occupied tap, hold, rest or count-in interval.

A `sequence` additionally authors two or three `choices`, each with a unique
local `id`, player-facing `label` and key `Digit1`, `Digit2` or `Digit3`.
`steps` lists choice IDs in the required order. Steps may repeat a choice; their
count and the choice count must match the selected mechanic.

A `hold` has no episode-owned choices. Its selected mechanic supplies the press
window and required hold duration in beats. Those windows must fit inside the
composition's `activeBeats`.

### Outcomes and consequences

An interruption is judged separately from the rhythm and resolved once. While it
is active no rhythm cue is scored and passive pressure is suspended, so the
player can neither miss a note nor bleed safety while dealing with it. The
interruption itself is not free, though: succeeding applies `successSafety` and
failing applies `failureSafety`. Both are authored per interruption, and they
need not be symmetrical — in `The Alarm` a failure costs more than a success
pays, so ignoring an interruption is a worse bargain than attempting one.

A sequence fails on a wrong choice or on running out of time. A hold fails on
releasing early, on pressing after its press window has closed, or on never
pressing at all. Doing nothing is a failure, not a way to opt out.

Cancellation is a third outcome and is deliberately neutral: nothing is applied.
It covers the interaction being taken away by the browser or hardware — a lost
pointer capture, a window blur, a hidden tab — which is not the player's
failure and must not be charged as one. It is distinct from a deliberate early
release, which is. An input arriving when no interruption is in progress is
ignored rather than resolving anything.

## Presentation, copy and results

`confrontation.presentation` selects:

- `layout`: a shared layout, today `{ "source": "shared", "id": "episode-confrontation" }`;
- `skin`: a shared or same-episode skin.

Layout identity is ordinary data. A layout is a JSON file under
`presentation/layouts/` whose filename matches its ID, and the engine resolves
the selection generically — no layout ID appears in TypeScript. Adding a layout
that reuses the existing vocabulary is therefore a content change: author the
JSON, point a skin at it, and select it from an episode. A layout needing
genuinely new visual structure is a separate engine expansion, because the
interpreter would have to learn to draw something new.

The layout is a reusable intensity-driven composition, not a bed or episode
instruction: its skin authors `confrontation.resistance`,
`confrontation.opposingActor` and `confrontation.environment`, plus their finite
transitions. Layout data owns the confrontation backdrop, control geometry,
motion and the rhythm palette; skin data owns its parts, copy and typography.
The selected skin must name the selected layout. Interruption skins must
support their mechanic kind and obey the same ownership rules.

`confrontation.opposingActor` authors two independent kinds of movement, and
they deliberately read different signals.

Its `states` are discrete and read physical danger — the same live signal the
resistance itself reads. Each names a `minimumDanger` and swaps artwork when
danger crosses it, so the actor's effort is visibly the cause of what is
happening to the resistance rather than a performance running on its own clock.
The selection ratchets: the engine holds the greatest state reached for the
attempt and never eases back down, because someone straining at apparatus does
not visibly relax the instant the load lightens. A retry starts the ratchet
again. `transition` authors the dissolve between drawings with a
`crossfadeDurationMs` and an `ease`; the actor holds a continuous position
throughout, so only the drawing beneath it changes.

Its `strain` is continuous and reads the dramatic curve instead, so the actor's
agitation mounts with the episode however well the player is doing. A skin
authors `restFrequencyHz` and `strainFrequencyHz`, a `restAmplitude` and
`strainAmplitude` point each, and a `lean` point reached at full intensity; the
engine interpolates between rest and strain by intensity. The split is the
point: what the actor *does* answers the player, while how wound up they are
answers the clock.

`reducedMotion.amplitudeScale` multiplies only the oscillation, so a reader who
prefers reduced motion still sees the lean — a static pose offset — without
anything shaking, and `reducedMotion.crossfadeDurationMs` shortens the dissolve
without removing it, a cross-fade being gentler than a hard cut.

`confrontation.copy` supplies `headline` and accessible `instructionsStatus`.
`results` contains exactly `success` and `failure`; each supplies
non-empty `headline` and `feedback` and may select a catalogued illustration
through a `shared` or same-episode reference. The illustration contains no
story copy and is rendered by the shared illustrated narrative layout. No
failure, trap-consequence or custom outcome discriminant exists.

## Audio

Every episode selects a soundscape:

```text
audio:
  soundscape: shared or same-episode reference
  cues: optional private cue definitions
  soundscapes: optional private soundscapes
```

Sound is synthesised from authored numbers. There are no audio files, no
samples and no recordings anywhere in the game, which is both an aesthetic
choice and a provenance one — see [Art direction](art-direction.md) and the
audio production rules in `AGENTS.md`.

### Roles

A soundscape maps every one of the twenty-three semantic roles to a cue:
`count-in`, `beat`, `downbeat`, `cue-approach-left`, `cue-approach-right`,
`cue-due-left`, `cue-due-right`, `tap-hit`, `tap-miss`,
`resistance-strain`, `resistance-ease`, `hold-start`, `hold-release`,
`hold-broken`, `interruption-warning`, `interruption-input`,
`interruption-success`, `interruption-failure`, `interruption-return`,
`opposing-actor-voice`, `outcome-success`, `outcome-failure` and
`interface-action`.

The engine names outcomes `success` and `failure`, not the fiction an episode
dresses them in. Being forced upright is how The Alarm loses; another episode
may lose by being marched to a desk, and only its copy and illustration change.
The same holds for the antagonist: the recurring role is Management today, but a
CEO, a colleague or a whole department could oppose a later episode's player, so
the grammar says opposing actor and content says who.

All twenty-three are required. A moment meant to pass quietly is authored as a
quiet cue rather than left out, so silence is always a decision on record.
Adding a role is an engine change; deciding what a role sounds like is content.

Six roles carry the rhythm between them. `beat` sounds on every beat of the
compiled grid, so the apparatus keeps time whether or not the beat asks for
anything — without it the score falls silent through rests and the player loses
the pulse. `downbeat` replaces it on the first beat of each rhythm cycle: a
pulse that is merely periodic gives the player tempo but not position, and they
cannot predict where the next demand falls without knowing where they are in
the bar. `cue-due-left` and `cue-due-right` accent the beats that do ask,
replacing the plain tick, so a demand is heard as an accent on the pulse rather
than a sound layered over it.

`cue-approach-left` and `cue-approach-right` announce a demand before it lands.
Synchronising to a rhythm is anticipatory rather than reactive — people place a
movement by predicting the beat, not by responding to it — so a sided signal
arriving at the instant of the demand cannot be answered in time by anyone.
Without the approach, the score can only be read on screen and never heard. The
dramatic curve authors `approachLeadBeats`, the distance ahead in beats, so the
announcement keeps its musical place as the tempo changes rather than being a
fixed millisecond constant. An approach that would fall on a strike is dropped
rather than doubled. See
[audio-led rhythm cueing](research/audio-led-rhythm-cueing.md).

The demand is sided because the player has to know which hand to answer with.
Two roles rather than one panned cue keeps that decision in content: the sides
should differ in pitch and timbre as well as stereo position, so the
distinction survives a mono speaker or hearing in one ear. Stereo alone is
never sufficient.

`resistance-strain` and `resistance-ease` are the apparatus itself rather than
the player: they sound when the resistance artwork advances or eases, so the
structure is heard being hauled a notch further or settling back as ground is
won. Judgement cues answer the player; these answer the opposing actor.

Interruption cancellation is deliberately silent, because the interaction was
taken away from the player rather than failed by them.

### Cues and layers

A cue has `schemaVersion`, `id` and one to eight `layers`. Each layer is a
`tone` or a `noise`, and every layer authors `delayMs`, `attackMs`, `holdMs`,
`releaseMs` and `gain`:

| Field | Meaning |
| --- | --- |
| `delayMs` | Start offset within the cue, so one stamp can be a thump with its click just behind it. |
| `attackMs`, `holdMs`, `releaseMs` | The envelope. Short attack and release read as an impact; longer ones as a hiss or a ring. |
| `gain` | Layer level from 0 to 1, multiplied by the soundscape's `gain`. |
| `pan` | Stereo position from -1 to 1. Reinforcement only; never the sole signal. |
| `space` | How much of the layer is also sent to the room, 0 to 1. Optional, defaulting to none. |

A `tone` adds `wave` (`sine`, `square`, `triangle` or `sawtooth`) with
`startFrequencyHz` and `endFrequencyHz`; equal values hold a pitch, differing
values sweep. A `noise` adds `filter` (`lowpass`, `highpass` or `bandpass`),
`startCutoffHz`, `endCutoffHz` and `resonance`. Pitched machinery comes from
tone; impacts, paper and hiss come from noise. Most convincing cues use both.

`space` places a sound at a distance without moving it in time: the dry signal
is untouched and reflections are added alongside it, so a reverberant cue still
lands exactly on its beat. Two sounds competing in the same frequency range stop
fighting when one of them is plainly further away. Anything the player is
expected to answer is authored dry, right in front of them.

The room itself is synthesised — exponentially decaying noise, generated at
runtime — rather than a recording of a real space, which would be a licensed
third-party asset the project would have to carry provenance for.

Every parameter is bounded and validated. A cue whose layers are all silent, or
all zero-length, is rejected rather than shipped as an inaudible mystery.

### Sustained layers and the stress train

A soundscape authors three continuous layers and one train of events, each
answering a different thing. Keeping them apart is what lets a player hear
whether they are in trouble or merely late in the day.

| Layer | Follows | What it is |
| --- | --- | --- |
| `ambience` | dramatic intensity | the room, tightening with the working day |
| `opposingActorPresence` | dramatic intensity | the antagonist, grumbling throughout rather than only when interrupting |
| `resistanceStrain` | physical danger | the sustained body of the structure under load |
| `resistanceStressBursts` | physical danger | discrete bursts, quickening and growing as ground is lost |

The two clock-driven layers rise however well the player is doing, because the
working day advances regardless. The two danger-driven layers answer the player
alone, and can be authored to be silent while safety holds: set `restGain` to
`0` on `resistanceStrain` and choose a `minimumDanger` above zero on
`resistanceStressBursts` to suppress them until danger rises.

`resistanceStressBursts` is a train of cues rather than a sustained layer,
because a structure under stress emits discrete bursts rather than a tone: a
sustained layer following danger sounds like a hum, not like a structure being
worked. It authors a `cue`, a `minimumDanger` below which the structure is
silent, `restIntervalMs` and `strainIntervalMs` between which the bursts
quicken, `restGain` and
`strainGain` between which it grows, and an `intervalPattern` of uneven
multipliers. The pattern is authored rather than random so an episode sounds the
same way twice, and uneven because evenly spaced bursts read as machinery. What
a burst sounds like is content: The Alarm's timber creaks, and another episode's
resistance might groan or ring without any code changing.
Validation rejects a pattern whose values are all equal, and a strain interval
no shorter than the rest interval.

`resistanceStrain` exists only to bind the bursts together. Transients separated
by silence are heard as separate events, so without a quiet sustained layer in
the same register a run of bursts reads as a series of unrelated squeaks rather
than as one object. It is authored well below them, and is not a substitute for
them: on its own it is just a hum.

Each sustained layer takes the same shape:

```text
ambience:
  restGain, strainGain   the layer's level at rest and at full intensity
  responseMs             how quickly it follows a change
  layers                 one to six sustained tone or noise layers
```

An ambience layer has no envelope, because it never ends on its own. It has two
settings of itself instead — a tone gives `restFrequencyHz` and
`strainFrequencyHz`, a noise gives `restCutoffHz` and `strainCutoffHz` — and
the engine glides between them as dramatic intensity rises. That movement is
what makes an episode feel like it is tightening: the office hum climbs in
pitch, brightens and grows louder as the working day advances.

The sustained layers only exist while the game is audible. Muted play builds
none of them, and unmuting mid-episode brings them in on the next frame.

### Ownership

Audio follows the same two-level ownership as the rest of the grammar. Shared
cues and soundscapes live under `audio/` with a catalogue whose entries match
their filenames exactly. A shared soundscape may reference shared cues only, so
it stays reusable; an episode soundscape may reference either. An episode cue
cannot shadow a shared identifier, and no episode can reach another's private
cues.

### Muting

Muted play is a first-class mode, not a degraded one. Muting changes nothing
about rules, timing or scoring, and the game creates no audio at all while
muted. Every essential timing and state signal is available on screen, so
critical information is never carried by sound alone.

## Phase capacity

A phase is a window of time, and everything authored into it competes for that
window: the lead-in before its first cycle, the repeating rhythm cycle itself,
and any interruption's warning, active play and return count-in.

Compilation is deliberately unforgiving about the tail. A rhythm event beginning
after the phase ends is dropped, and a hold whose release would fall past the end
is dropped whole rather than truncated, because a hold the player could start but
never legitimately release would be unplayable.

Three rules make that visible instead of silent. An interruption must leave at
least one playable cue in its phase. Every phase must contain at least one scored
cue. And a rhythm cycle that begins inside a phase must yield at least one cue —
a phase ending part-way through a cycle is ordinary, but one with visible room
for a whole cycle that produces nothing has been mis-timed.

There is no minimum or maximum episode duration. A phase is long enough when it
fits its cycle, its lead-in and its interruption and still returns the player to
resistance; that is a relationship between authored values, not a target number.
A slower tempo, a longer cycle or a longer interruption all demand a longer
phase.

## What compilation means

After an episode passes structural validation, the content compiler resolves its
owned references, checks relationships between the selected definitions and
translates its beat-based composition into the finite runtime configuration used
by the game engine. In particular, it expands rhythm cycles into timestamped
cues, constructs phase boundaries and places interruption warning, active and
return windows. It does not execute episode-authored code; episodes have no such
facility.

This is distinct from the TypeScript compiler used to build the application.
The complete pipeline, its runtime outputs and the rules for adding a reusable
compiler capability are documented under [Content compilation
pipeline](technical-architecture.md#content-compilation-pipeline).

## Why an episode is rejected

Validation reports the field path for structural mistakes. Reference resolution
and semantic validation then check relationships which a field cannot establish
alone:

| Rejection | What to check |
| --- | --- |
| Unknown reference or ownership error | The ID exists in the stated source and does not cross episode ownership. |
| Rhythm event outside its cycle | `atBeat` and any duration end no later than `cycleBeats`. |
| Overlapping rhythm events | Taps, holds and declared rests occupy distinct beat intervals. |
| Invalid timing tolerance | Twice `timingWindowMs` is less than `beatIntervalMs`. |
| Discontinuous curve | One phase's intensity `to` equals the next phase's `from`. |
| Unknown trigger phase | `trigger.phase` names a phase in the selected curve. |
| Invalid beat offset | `afterBeats` is smaller than the selected rhythm's `cycleBeats`. |
| Interruption does not fit | Its warning, active play and return finish inside the phase. |
| Interruption leaves no playable cue | After it returns, its phase must still contain resistance to return to. Shorten the interruption or lengthen the phase. |
| Phase has no playable cue | Every phase must contain at least one scored cue, or it is content the player can never meet. |
| Phase has room for a cycle that yields nothing | A rhythm cycle beginning inside the phase produced no cue because its events fall past the end. Adjust the phase duration, tempo or lead-in. |
| Interruption starts during an event | Move it to a genuine musical boundary. |
| Interruption windows overlap | Move one interruption beyond the other's protected return. |
| Mechanic kind mismatch | Composition `kind` equals the selected mechanic's kind. |
| Wrong sequence shape | Choice and step counts match the selected mechanic; IDs and keys are unique and every step names a choice. |
| Hold is too short | `activeBeats` contains both the mechanic's press and hold windows. |
| Presentation incompatibility | The layout can display the timing tolerance and each selected skin supports its role and ownership. |

Unknown fields are rejected everywhere. Unsupported interruption kinds such as
`reverse`, `dual-hold` and `temptation`, and unsupported rhythm actions such as
`reverse`, are invalid rather than silently ignored.

Run `npm run validate:content` before committing. It loads the real game,
campaign and mechanic catalogues, compiles every episode, resolves presentation
content and reports structural errors with readable field paths.

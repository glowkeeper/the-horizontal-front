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
results: victory and forcedVerticalisation
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
`resolutionDurationMs`, and one or more uniquely named `phases`. Adjacent phases
must join at the same presentation intensity.

Each phase authors:

| Field | Meaning |
| --- | --- |
| `id` | Author-facing phase name. It has no special engine behaviour. |
| `durationMs` | Positive phase duration. |
| `rhythm` | Shared or same-episode rhythm reference. |
| `beatIntervalMs` | Milliseconds per beat. |
| `timingWindowMs` | Input tolerance on either side of a beat; less than half a beat. |
| `leadInBeats` | Whole beats before this phase's first rhythm cycle. On the first phase this creates READY. |
| `pressurePerSecond` | Management pressure while play is active. |
| `recoveryPerAction` | Duvet recovery from a successful action. |
| `safetyPenaltyPerMiss` | Non-negative duvet penalty for a miss; defaults to zero. |
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

## Presentation, copy and results

`confrontation.presentation` selects:

- `layout`: currently exactly `{ "source": "shared", "id": "episode-confrontation" }`;
- `skin`: a shared or same-episode skin.

These literals are intentional finite engine capabilities. Adding another one
requires a separately designed reusable interpreter, not an episode exception.
The layout is a reusable intensity-driven composition, not a bed or episode
instruction: its skin authors `confrontation.resistance`,
`confrontation.opposingActor` and `confrontation.environment`, plus their finite
transitions. The selected skin must support the selected layout. Interruption skins must
support their mechanic kind and obey the same ownership rules.

`confrontation.copy` supplies `headline` and accessible `instructionsStatus`.
`results` contains exactly `victory` and `forcedVerticalisation`; each supplies
non-empty `headline` and `feedback` and may select a catalogued illustration
through a `shared` or same-episode reference. The illustration contains no
story copy and is rendered by the shared illustrated narrative layout. No
failure, trap-consequence or custom outcome discriminant exists.

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

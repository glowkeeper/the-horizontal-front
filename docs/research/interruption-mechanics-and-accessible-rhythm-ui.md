# Interruption mechanics and accessible rhythm UI

Status: initial design basis for Quick Call and Urgent Email

This note records the evidence considered before adding the game's first reusable interruption mechanics. It separates published findings and standards from the design decisions inferred for The Horizontal Front. Those decisions must still be tested through play.

## Question

How can management interruptions complicate a rhythm-based resistance game without making its timing, controls or recovery unreadable—particularly for new players and people using keyboard, pointer or touch input?

## Evidence reviewed

### Interruption timing and recovery

- Powers and Scerbo found that interruptions at fine task breakpoints increased resumption time and mental workload, whereas interruption at coarse breakpoints performed similarly to no interruption in their task. The study concerned trip planning rather than games, so applying its hierarchy to musical phrases is a design inference. [Examining the Effect of Interruptions at Different Breakpoints and Frequencies Within a Task (2021)](https://doi.org/10.1177/00187208211009010)
- Adamczyk and Bailey found that the effects of interruption varied according to the moment within task execution, supporting interruption at lower-workload boundaries rather than arbitrary instants. [If Not Now, When? (2004)](https://interruptions.net/literature/Adamczyk-CHI04-p271-adamczyk.pdf)
- Trafton and colleagues found that advance warning allowed participants to prepare for an interruption and resume the primary task more quickly. Their eight-second experimental warning is not a proposed game timing value; the relevant finding is that perceptible preparation aids resumption. [Preparing to resume an interrupted task (2003)](https://doi.org/10.1016/S1071-5819(03)00023-5)

### Input and time-dependent interaction

- Xbox Accessibility Guideline 107 recommends examining the input type, timing and speed a game requires, supporting players' available input mechanisms, and avoiding unnecessary barriers such as complex combinations and simultaneous actions. [Xbox Accessibility Guideline 107: Input](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/107)
- Xbox Accessibility Guideline 116 notes that time-dependent controls can particularly affect players with limited dexterity or cognitive disabilities and players who are new to games. Core rhythm play necessarily uses timing, but difficulty and assistance should remain deliberate rather than accidental. [Xbox Accessibility Guideline 116: Time limits](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/116)
- WCAG 2.2 requires pointer interactions to support cancellation or reversal unless down-event activation is essential, establishes a 24 by 24 CSS pixel minimum pointer target, and recommends 44 by 44 pixels at its enhanced level. Gameplay controls under pressure should comfortably exceed these web minima. [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- Pointer Events provides one device-independent event model for mouse, touch and pen. Pointer capture preserves an active interaction when the pointer drifts outside its original target; `pointercancel` and lost capture are distinct termination paths that software must handle. [W3C Pointer Events Level 2](https://www.w3.org/TR/pointerevents2/)

### Rhythm cueing

- Mrazik and Khatib's blind-accessible rhythm-game study demonstrates the value of conveying rhythm information through more than one modality. Its playtest findings also identify music-aligned warning timing, synchronisation adjustment and difficulty options as important refinements. The study is a small proof of concept with seven survey respondents, so it informs direction rather than establishing universal timing rules. [Feel the Rhythm (2024)](https://doi.org/10.1145/3651278)

## Resulting design decisions

### Interrupt at musical boundaries

An interruption is anchored to a validated musical phrase or similarly meaningful rhythm boundary, never inserted at an arbitrary elapsed millisecond. Content validation must reject an interruption that starts during a tap window, rest, count-in or hold.

The reusable lifecycle is:

1. Finish the current rhythm phrase.
2. Announce the pending interruption through equivalent visual and, when available, audio and haptic cues.
3. Transfer control from resistance to the interruption.
4. Resolve one focused interruption interaction.
5. Show its outcome immediately.
6. Provide an authored musical count-in for returning to resistance.
7. Resume baseline pressure only when the first returning resistance note can be played.

### Keep the first composition singular

The grammar may support both replacement and simultaneous compositions, but The Alarm introduces Quick Call and Urgent Email as replacement interactions. The player is not initially required to resist with one input while completing an interruption with another. More demanding compositions must be authored deliberately after the individual mechanics are understood.

### Prefer recognition over recall

Quick Call tests ordered accuracy rather than memory or rapid tapping. Its choices remain in stable positions, the currently required choice remains visible, and progress through the sequence is explicit. Correct, incorrect and expired responses have distinct multimodal feedback.

### Make holding explicit and cancellable

Urgent Email presents one large hold target with visible press, progress, release and outcome states. A deliberate release before the required duration is a gameplay failure. Browser or hardware cancellation, lost pointer capture, loss of visibility and window blur are neutral cancellation paths: they clear all held state and must not become an unexplained penalty or stuck input. The engine may resume or retry the interruption according to validated policy.

### Use one clock and equivalent cue timing

Resistance notes, warnings, interruption windows, count-ins and eventual synthetic audio derive from the same musical clock. Visual, audio and haptic representations announce the same event with equivalent anticipation. Colour, sound or text may reinforce a state but none is its only signal.

## Implications for the existing interface

The current outward-moving guide already establishes useful spatial invariants: notes emerge from the centre, travel toward their actual control, and show tap or hold duration geometrically. Interruption work should preserve these rather than replace them with a second rhythm language.

Before or alongside the first interruption implementation, the shared presentation architecture must support:

- **Explicit control ownership.** Resistance controls and notes visibly become unavailable when an interruption takes control. Hidden input routing alone is insufficient; the screen must not invite an action that the engine will ignore.
- **Boundary-aware warning.** An interruption warning is driven by the musical timeline and appears before the phrase boundary. It must not cover a note, obscure a hold tail or compete with the existing centre-to-control guide.
- **A real return count-in.** Returning notes are previewed from the same centre emitter and follow the same travel-speed model. During the count-in, resistance input is inactive and passive pressure is suspended.
- **Stable spatial focus.** Replacement interruptions occupy the rhythm interaction region while leaving the bed and danger state visible. They should not force the player to scan unrelated top, centre and bottom instruction regions.
- **Reduced textual competition.** The active controls carry the immediate action. Central copy announces the interruption or reports an outcome; it does not duplicate constantly changing button instructions.
- **Multimodal state.** Disabled, warning, active, correct, incorrect, cancelled and returning states differ by shape, motion and wording as well as colour. Audio and haptics can later express those same semantic states without changing the mechanic.
- **Unified input cleanup.** The existing resistance input path and the interruption path need a shared control owner and cancellation boundary so keyboard releases, pointer cancellation, blur and scene transitions cannot leave either mechanic held.
- **Responsive target guarantees.** Authored presentation validation must ensure interruption targets remain comfortably operable at supported canvas sizes and do not overlap or fall outside the interactive area.

The most consequential architectural implication is that interruption presentation cannot merely be drawn over `ResistanceScene` while both systems continue independently. The confrontation needs an explicit coordinator that owns the musical timeline, routes input to exactly one active mechanic unless a composition explicitly permits both, governs pressure policy and exposes semantic presentation state. Phaser remains responsible for input capture and rendering; the coordinator and interruption rules remain plain TypeScript.

## Verification implications

Automated tests should cover phrase-boundary scheduling, warning and count-in timing, pressure suspension, exclusive input ownership, early release, neutral cancellation, lost capture and absence of stuck inputs. Presentation validation should cover target bounds, spacing and required semantic states. Manual testing must include keyboard, mouse and touch or touch emulation, and should explicitly observe whether a player can explain when normal resistance stops and resumes without being coached.

## Open empirical questions

These are tuning questions for playtesting, not missing architectural boundaries:

- How many warning beats are perceptible without draining the interruption of surprise?
- Is one or two return beats sufficient after each interruption?
- How many Quick Call choices remain readable within this episode's dramatic curve?
- Should a neutral system cancellation restart the attack or resume resistance?
- At what point can an overlay composition be introduced without overwhelming the core rhythm?

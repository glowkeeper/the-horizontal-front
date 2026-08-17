# Audio-led rhythm cueing

Status: design basis for The Alarm's production soundscape

This note records the evidence considered before authoring the game's rhythmic
audio layer and its cue timing. It separates published findings and standards
from the design decisions inferred for The Horizontal Front. Those decisions
must still be tested through play, including with players who cannot see the
screen.

It extends [interruption mechanics and accessible rhythm
UI](interruption-mechanics-and-accessible-rhythm-ui.md), which already decided
that visual, audio and haptic representations announce the same event with
*equivalent anticipation*. That decision is currently unmet: the implemented
sided cue sounds at the instant the input is due, while the visual guide shows
notes travelling toward their control.

## Question

Can a rhythm game built on resisting the working day be played by ear — and
what must its audio do so that hearing the score is enough to play it, rather
than merely accompanying a screen the player is actually reading?

## Evidence reviewed

### Synchronisation is anticipatory, not reactive

- Repp's review of the tapping literature identifies the *negative mean
  asynchrony*: when people tap along to a metronome, their taps typically
  **precede** the acoustic event rather than following it. The phenomenon is
  attributed to temporal prediction — people anticipate the beat rather than
  responding to it. [Sensorimotor synchronization: A review of the tapping
  literature (2005)](https://doi.org/10.3758/BF03206433)
- The 2006–2012 update reviews subsequent work on the same mechanisms.
  [Sensorimotor synchronization: A review of recent research
  (2013)](https://doi.org/10.3758/s13423-012-0371-2)

The practical consequence is that a cue sounding *at* the moment of a required
action cannot be answered on time by any player. Synchronisation works by
entrainment to a predictable pulse; a sound that arrives simultaneously with the
demand leaves only reaction, which is too slow and too variable to hit a rhythm
window.

### Auditory rhythm supports better synchronisation than visual rhythm

- Comstock, Hove and Balasubramaniam review behavioural and neural differences
  between the modalities and report that movement synchronisation is **less
  variable and can occur at faster rates with auditory metronomes** than with
  visual flashing metronomes, citing Repp (2003), Patel et al. (2005) and
  Elliott et al. (2010). They attribute the advantage to stronger coupling
  between the auditory and motor systems, noting that auditory timing tasks
  produce more activation in motor structures such as SMA and premotor cortex,
  and that visual timing requires "additional processing of visual information
  ... to interface with the motor system". [Sensorimotor Synchronization With
  Auditory and Visual Modalities (2018)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6058047/)

This reframes the work. Audio-led play is not a concession made for accessibility
at the expense of the sighted experience: on this evidence the auditory channel
is the *better* channel for rhythm, and a game whose timing is legible only on
screen is asking every player to use the weaker one.

### Blind-accessible rhythm cueing in practice

- BlindBeat, a rhythm game designed for visually impaired players, plays each
  note's audio warning **twice**: "once as an early warning and once when the
  notes are actually spawned". The designer's stated reason is directly the
  point above — "players cannot react quickly enough if they need to 'tap'
  precisely when they hear a sound". Lane direction is conveyed by audio
  panning, establishing a left-right mechanic. No timing values are published.
  [The Design of BlindBeat](https://medium.com/@quinelawensky/the-design-of-blindbeat-a-rhythm-game-for-the-visually-impaired-d9429ea9933a)
- Mrazik and Khatib's blind-accessible rhythm-game study, already recorded in
  the interruption note, demonstrates the value of conveying rhythm information
  through more than one modality, and identifies **music-aligned warning
  timing**, synchronisation adjustment and difficulty options as important
  playtest refinements. [Feel the Rhythm (2024)](https://doi.org/10.1145/3651278)

### Multisensory redundancy standards

- Xbox Accessibility Guideline 103 requires that "any visual content that's
  critical to understanding gameplay ... should be expressed by using at least
  one other sensory method", and equally that critical audio content is
  expressed visually. It gives stereo panning as a worked example: in Killer
  Instinct, properly panned combat cues give "a player who is blind the ability
  to track their character's location, as well as the location of their enemy
  through audio alone". [XAG 103: Visual and audio
  alternatives](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/103)

## Limits of this evidence

- The synchronisation literature is laboratory finger-tapping to metronomes. It
  establishes that synchronisation is predictive and that auditory pacing beats
  visual pacing; it says nothing directly about *sided* demands, interruptions
  or a game's timing windows. Applying it here is a design inference.
- The Comstock review was consulted for its comparative claims and mechanism.
  No millisecond values for asynchrony or variability were extracted, so none
  are asserted here.
- BlindBeat is a single practitioner design account, not peer-reviewed, and
  publishes no timing values.
- Feel the Rhythm remains, as the earlier note records, a small proof of concept
  with seven survey respondents. It informs direction rather than establishing
  universal timing rules.
- **No source consulted fixes a lead time.** A figure of roughly 0.2 seconds
  surfaced during searching but could not be traced to a retrievable primary
  source, and is therefore not adopted. The lead must be authored, tuned and
  accepted by ear.
- None of this evidence has been tested against this game. It is an input to
  playtesting, not a substitute for it.

## Resulting design decisions

1. **A demand sounds twice: an approach and a strike.** Every scored cue is
   announced before it falls due and again as it lands. This satisfies the
   existing equivalent-anticipation decision, which the current implementation
   does not meet.
2. **The lead is music-aligned and authored.** It is expressed against the
   score's own beat grid rather than as an arbitrary millisecond constant in
   TypeScript, following Feel the Rhythm's music-aligned warning finding and the
   existing one-clock decision. Its value is provisional until accepted by ear.
3. **Side is carried by pitch and timbre as well as position.** Panning alone is
   unreliable on laptop speakers, in mono, and for players with unilateral
   hearing loss. The cue-role vocabulary already separates left from right so
   content can differ in more than pan; approach cues follow the same rule.
4. **The pulse must be metrical, not merely periodic.** Prediction requires
   knowing *where in the bar* the next demand falls, not only that beats are
   passing. An undifferentiated tick supplies tempo without position, so the bed
   carries an accented downbeat.
5. **The rhythmic bed sits where players can hear it.** Energy placed below the
   range of laptop and phone speakers is authored loudness the player never
   receives; the bed is voiced and mixed for the devices in the support matrix.
6. **Audio never becomes the only channel.** The visual guide keeps its own
   anticipation, muted play stays mechanically equivalent, and no state is
   signalled by sound alone. Adding an audio path to competence does not remove
   the visual one.
7. **Playtest before fixing the grammar.** These values are hypotheses. The
   acceptance test is whether a person can play the episode without watching the
   screen — and that is a human judgement no automated check can supply.

## Implications for the existing soundscape

The cue-role vocabulary is a fixed enum, and the audio schema records the
boundary deliberately: choosing what a role sounds like is content, while adding
a role is an engine change. Decisions 1 and 4 therefore require a designed,
reusable engine expansion rather than content tuning — approach roles, a
downbeat role, and an authored lead — serving any rhythm episode rather than
The Alarm alone.

Decisions 3 and 5 are content: cue synthesis parameters and ambience levels
within the existing grammar.

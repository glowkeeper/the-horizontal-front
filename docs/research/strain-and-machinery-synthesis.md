# Synthesising strain and machinery sound

Status: design basis for the resistance and antagonist layers of the production soundscape

This note records the evidence considered before synthesising the sound of a
structure under load. It separates published findings from the design decisions
inferred for The Horizontal Front. Those decisions must still be tested by ear.

It companions [audio-led rhythm cueing](audio-led-rhythm-cueing.md), which
covers the score the player answers. This one covers what the world does
underneath it.

## Question

The game's resistance is a bed frame being hauled upward against a player
holding it down. What does a structure under increasing load actually sound
like, and why did a continuous synthesised layer following that load sound
merely like a hum rather than like something straining?

## Evidence reviewed

### Structures under load emit bursts, not tone

- A study of acoustic emission during fault stick-slip finds emission occurs in
  distinct stages rather than continuously. During shear-stress build-up "low-
  frequency and low-amplitude signals mainly appear"; approaching instability
  "the AE count rate increases rapidly" and "increases abruptly in the meta-
  instability stage"; and "the AE counts reach the maximum value at the fault
  slip transient". Typical amplitudes rose from 1.3 mV during build-up to
  6.1 mV at meta-instability and 23.5 mV at instability — roughly eighteenfold.
  The paper also documents a comparatively quiet period preceding slip.
  [Investigation on acoustic emission characteristics of fault stick-slip under
  different lateral pressures (2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10954729/)
- A multiscale review of friction-induced interactions describes acoustic
  emission from stick-slip as transient wave bursts, generated as stored elastic
  strain energy is released, with high-frequency content accompanying the
  stick-slip transitions of creep groan. [Friction-induced interactions:
  acoustic emissions, vibrations, and wear (2025)](https://link.springer.com/article/10.1007/s11071-025-11397-5)

The mechanism is stick-slip: a loaded structure grips, stores elastic energy,
releases it suddenly, and grips again. The sound is the release. It is therefore
intrinsically discrete and intrinsically irregular, and both its rate and its
amplitude climb as failure approaches.

## Limits of this evidence

- These are geological and tribological studies — rock faults and brake
  assemblies — not timber bed frames. What transfers is the mechanism and its
  temporal signature, not any specific frequency content.
- Amplitude figures are millivolts at a sensor, not loudness at a listener. The
  eighteenfold growth is used here as a direction and rough proportion, not as a
  calibration.
- No source consulted addresses synthesis. Everything below is design inference.
- The references the maintainer supplied for the intended character were audio
  recordings, which an AI collaborator cannot hear. The synthesis was reasoned
  from the acoustics of the phenomenon and must be judged by ear by a human.

## Resulting design decisions

1. **The structure creaks; it does not hum.** The resistance layer is a train of
   discrete short cues rather than a sustained oscillator bed. A continuous tone
   following load was implemented first and was immediately identified as a hum,
   which is what the evidence predicts: a held oscillator cannot represent a
   sequence of discrete energy releases.
2. **Rate and amplitude both follow load.** Creaks quicken and grow together as
   physical danger rises, following the observed acceleration in count rate and
   amplitude toward instability. Neither alone reads as increasing stress.
3. **The spacing is uneven and authored.** Intervals are multiplied by a cycled
   pattern of uneven factors. Evenly spaced bursts read as machinery rather than
   as timber; random spacing would be irreproducible, and the project requires
   synthesis parameters explicit enough to tune and repeat. Authoring the
   irregularity satisfies both.
4. **Below a threshold the structure is silent.** A frame bearing little load
   has no stored energy to release. Silence while the player is winning is
   information, not an omission.
5. **A threshold crossing keeps its own longer cue.** The moment the bed is
   hauled up a notch is a slip transient, where the evidence puts peak emission.
   It remains a separate, longer, louder event over the ongoing train.
6. **Roughness comes from beating, not modulation.** The synthesis vocabulary has
   no LFO. Detuned oscillator pairs a few hertz apart produce amplitude beating
   that reads as roughness; several pairs at mutually prime beat rates produce a
   composite that does not audibly repeat. This is used for both the frame and
   the antagonist's growl.
7. **The antagonist is present, not punctual.** Management grumbles continuously
   beneath the episode on the dramatic curve, rather than only when interrupting
   — consistent with the existing decision that Management's agitation follows
   the clock rather than the player's performance. It is authored low: a
   presence, not an event.

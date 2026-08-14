# The Alarm playable-scene production specification

## Status and scope

This is the production-facing asset hypothesis for the playable confrontation
in **The Alarm**, within **The Monday Uprising**. It translates the accepted
first-draft political-cartoon direction into separable artwork, semantic states
and reusable composition data. It is not perceptual acceptance of the finished
assets.

The first-draft protagonist, Management, bed, duvet-state and environment
artwork is now catalogued and selected by the episode skin. Its runtime
composition remains a prototype pending perceptual review and refinement. No
item below permits episode-specific TypeScript. Assets belong to the episode,
are selected by its skin and respond to generic dramatic intensity and outcome
states.

## Composition argument

The playable image stages one continuously escalating contradiction:

```text
warm horizontal stronghold
        versus
cold vertical administrative invasion
```

The protagonist and bed retain the broad, low silhouette and moral authority.
Management and its apparatus enter from above and the right through narrow,
hard-edged forms. Escalation changes the room around the protagonist; it must
not gradually make the protagonist weak, frightened or ridiculous.

## Asset families and ownership

All first-enactment assets below are episode-owned under
`episodes/the-alarm/`. Stable semantic IDs describe their finished role, not
their draft number or filename.

### Protagonist cut-out

Identity-critical parts:

- `protagonist-torso`: low, stable upper-body mass with scarf and clothing;
- `protagonist-head`: face base without hair or expression marks;
- `protagonist-hair`: strong asymmetric silhouette, separate from the face;
- `protagonist-eyes-calm`, `protagonist-eyes-strain` and
  `protagonist-eyes-defiant`: interchangeable expression overlays;
- `protagonist-mouth-set`, `protagonist-mouth-effort` and
  `protagonist-mouth-victory`: interchangeable expression overlays;
- `protagonist-arm-near` and `protagonist-arm-far`: shoulder-pivoted sleeves;
- `protagonist-hand-grip-near` and `protagonist-hand-grip-far`: expressive,
  reusable grip silhouettes; and
- `protagonist-fist-raised`: outcome-only victory part.

The face, hair, scarf, body scale and skin treatment must remain recognisably
gender-ambiguous. Hands communicate effort and conviction; they are not tiny
decorations. Gameplay poses must read at final canvas scale without depending
on facial detail.

### Management cut-out

Identity-critical parts:

- `management-torso`: overdressed bureaucratic bulk with pockets, badges and
  receipt machinery, avoiding a body-size joke;
- `management-head`: original fictional face base, not a public likeness;
- `management-hair` and `management-glasses`: separate silhouette parts;
- `management-face-orientation`, `management-face-irritation` and
  `management-face-rage`: escalating overlays from performed professionalism
  through wounded vanity to comic administrative fury;
- `management-arm-present`, `management-arm-point`,
  `management-arm-lever` and `management-arm-stamp`: shoulder-pivoted gestures;
- `management-hand-present`, `management-hand-point`,
  `management-hand-lever` and `management-hand-stamp`; and
- `management-receipt-spool`: separately animated administrative excess.

Management is funny first, unpleasant second and mildly threatening third.
Threat comes from institutional machinery and its effect on the room, never
weapons, horror anatomy or resemblance to a real politician. The default pose
retains a brittle professional performance so irritation and rage have
somewhere to escalate.

### Bed and duvet

- `bed-frame`, `bed-mattress`, `bed-headboard` and `bed-footboard` are separate
  parts sharing the authored foot pivot used by the lift motion;
- `pillow-near` and `pillow-far` remain independent of the mattress;
- `duvet-rest`, `duvet-tension-low`, `duvet-tension-high` and
  `duvet-forced-verticalisation` are authored silhouettes, not runtime mesh
  deformation;
- duvet hands overlap their corresponding duvet silhouettes deliberately; and
- mattress, duvet and protagonist pivots must preserve physical attachment
  throughout the existing lift and slip motions.

The duvet may read briefly like a banner or defended boundary, but must remain
cloth rather than becoming a superhero cape or national flag.

### Bedroom and office-incursion layers

Bedroom layers:

- warm wall and floor base;
- bedside table, lamp, alarm clock, mug, books, plant and personal pictures;
- soft domestic shadow wash; and
- window/dawn layer with restrained parallax.

Office-incursion layers:

- cold fluorescent light wedge;
- cable and articulated-lamp silhouettes entering from above;
- paperwork and receipt overlays in low, medium and high densities;
- control console, stamp, lever and rolling office-chair fragments;
- hard geometric wall/floor overlays that partially—but never completely—turn
  the bedroom into an office; and
- a high-intensity administrative clutter layer kept clear of rhythm targets,
  hands and faces.

The bedroom is never replaced by a second scene. Domestic and office layers
coexist, allowing the room to show what Management is doing to an inhabited
space.

## Dramatic-intensity presentation

The existing normalized dramatic intensity remains the reusable driver. The
episode skin authors thresholds, alpha ranges, offsets and state selections;
the renderer merely interpolates the documented vocabulary.

| Intensity | Bedroom | Office incursion | Characters and bed |
| --- | --- | --- | --- |
| `0.00–0.24` | Warm and dominant | Small cold edge and idle apparatus | Calm defiance; performed Management orientation |
| `0.25–0.49` | Warmth begins to recede | Fluorescent wedge, cables and sparse papers enter | Duvet low tension; Management irritation |
| `0.50–0.74` | Domestic shadows cool but objects remain readable | Console, receipts and hard geometry occupy the right third | Duvet high tension; pointing/stamping Management |
| `0.75–1.00` | Warm pool survives around protagonist and bed | Maximum clutter and cold light without obscuring controls | Comic rage; bed danger motion; protagonist remains defiant |

Intensity must not encode the final outcome. Victory and forced
verticalisation remain explicit engine outcomes with their own authored
narrative illustrations.

## Motion grammar and pivots

- protagonist breathing: restrained torso and duvet movement, never sleepiness;
- grip response: hands compress toward duvet tension states on successful hold;
- Management agitation: head, pointing arm, stamp arm and receipt spool use
  different amplitudes so the figure does not move as one rigid sticker;
- apparatus encroachment: short directional slides and alpha changes, not
  expensive frame-by-frame animation;
- office-light transition: continuous alpha and colour-role interpolation;
- bed danger and forced verticalisation: retain the existing foot pivot and
  elapsed-time motion; and
- all authored pivots sit at plausible joints or physical attachment points and
  remain inside their corresponding asset bounds.

## Gameplay clarity

- No high-contrast paper edge, cable or facial feature may masquerade as a
  rhythm note or gate.
- Critical hands, duvet edge, protagonist gaze and Management gesture remain
  distinguishable without colour.
- Busy high-intensity layers leave a protected control corridor around rhythm
  lanes and interruption panels.
- Desktop and supported landscape-mobile crops retain both opposing
  silhouettes and the bed's lift axis.
- Reduced-motion presentation may crossfade authored states but does not remove
  outcome, danger or input information.

## Production and acceptance sequence

1. Agree protagonist and Management character sheets and silhouette rules.
2. Produce deliberately separated character parts with transparent bounds and
   recorded pivots.
3. Produce bed, mattress, pillow and four duvet states against those approved
   character proportions.
4. Produce bedroom base and independently composited office-incursion layers.
5. Extend the validated skin vocabulary for image states, intensity thresholds,
   protected regions and layer motion.
6. Replace prototype primitives through catalogue references only.
7. Run structural validation, Chromium flow checks and maintainer perceptual
   review at desktop and landscape-mobile sizes.

Steps 1–6 have a first-draft implementation. They are not production approval:
runtime attachment, scale, silhouettes, transparency edges and the perceptual
bedroom-to-office transition remain subject to step 7 and later human
refinement.

Production approval requires complete provenance, source inspection for
artefacts and likeness risks, meaningful human refinement of both recurring
characters, valid cut-out separation and explicit maintainer acceptance of
heroism, humour, clarity, transformation and motion.

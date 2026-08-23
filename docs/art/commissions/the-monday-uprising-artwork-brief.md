# The Monday Uprising artwork brief

## Status and scope

This is a working brief for one artist bringing the existing artwork of the
campaign **The Monday Uprising** and its episode **The Alarm** to production
authorship. It covers the fourteen catalogued assets that ship today and adds
no new ones.

It exists because the artwork currently in the game was AI-generated under the
maintainer's direction and integrated without a human repainting pass. That was
accepted deliberately and published as a known limitation rather than concealed,
and it is the reason the released version is numbered `0.2.x` rather than
`1.0.0`. Replacing that thin authorship with real human authorship is the last
creative item on the path to a production release.

This brief is also a pilot. The project intends to open campaign authoring to
outside contributors, and this document is the first attempt at the artefact a
future contributing artist will be handed. Tell the maintainer where it is
unclear, wrong or patronising; that feedback is as useful as the drawings.

## What this document supersedes

Read [Art direction](../../art-direction.md) first. It is the standing statement
of what this game is politically and visually, it applies to all artwork, and
nothing here replaces it.

Do **not** work from `docs/art/the-alarm-playable-scene-production-spec.md`
without reading its status section. That document specifies a separated
cut-out direction — individually rotating arms, hands and duvet parts — which
was tried and then replaced by complete drawn tableaux. Its part lists describe
a design that does not ship. It is preserved as reasoning, not as instruction.

For the fourteen assets listed below, **this brief is the authority**.

The accepted identity references are in `docs/art/production/` — the protagonist
and Management production sheets. Those are the authority for what a character
looks like.

**Start from the masters, not from the game files.** The maintainer will send you
`docs/art/production/sources/`, which holds the full-resolution originals the shipped images were made from, before
they were cut out and shrunk: the bed and duvet atlas, both Management poses,
the protagonist cut-outs and the office incursion, each still on the flat
colour field it was drawn against. The files in the game are resampled,
matted derivatives of these. For every asset you are refining rather than
redrawing, open the master — refining the shipped copy means working on a
smaller, already-degraded version of a picture you could have had at full
size.

## The job

Two treatments, decided by what each asset does:

**Redraw (eight assets).** The protagonist's four resistance states and
Management's four poses. These are the identity-critical characters. Draw them
fresh, using the production sheets as reference for who the characters are
rather than as artwork to trace or paint over. The point is that the finished
drawing is yours from the first mark.

**Refine (six assets).** The two campaign illustrations, the two episode outcome
illustrations, and the two environment plates. Work over the existing images:
repaint, redraw passages, fix what is weak, bring them into line with the
redrawn characters.

The reason for the split is not aesthetic. Generated images may carry no
protectable human authorship at all, which means the licence the project applies
to them in good faith may grant less than it appears to. Painting over a
generated base leaves that base underneath. Redrawing the two characters who
carry the game's identity answers that properly; refinement is honest work on
the rest.

The logo and site mark are **out of scope** — they are already original vector
geometry drawn by the maintainer.

## What is fixed, what is continuous, and what is yours

Worth being explicit, because a brief that is too tight would waste the thing
this is for. There is no point paying a human to imitate a machine.

**Fixed — not negotiable:**

- The politics. The player is the hero and the composition's centre of moral
  authority, even when Management occupies more space. See
  [The player is the hero](../../art-direction.md#the-player-is-the-hero).
- [Management](../../art-direction.md#management) is a fictional grotesque
  embodiment of corporate power, never a portrait, caricature or coded
  stand-in for any real person.
- Readability at the sizes people actually play at, including a phone held
  sideways.
- Every technical contract in this document: canvases, pivots, registration,
  transparency.

**Continuous — these must still be the same characters:**

The protagonist and Management have already been seen by players. Someone
returning should recognise them. Keep the silhouettes, the proportions, the hair
shapes, the scarf, Management's glasses and overdressed bulk. Identity carries
over; rendering does not have to.

**Yours:**

Line quality, weight, texture, mark-making, how the print roughness reads, how
you handle shadow and edge, how much detail survives at scale. The existing
images have a machine's evenness. If your hand is visibly different from theirs,
that is the improvement, not a problem to correct.

## The inventory

All fourteen assets are recorded in `src/play/content/presentation/asset-catalog.json`
and live under `src/play/content/presentation/assets/`.

| Asset | Shipped size | Treatment |
| --- | --- | --- |
| `the-alarm-resistance-states-rest` | 900 × 900 | Redraw |
| `the-alarm-resistance-states-early-pressure` | 900 × 900 | Redraw |
| `the-alarm-resistance-states-high-pressure` | 900 × 900 | Redraw |
| `the-alarm-resistance-states-final-pressure` | 900 × 900 | Redraw |
| `management-rest-pose` | 680 × 850 | Redraw |
| `management-early-pressure-pose` | 680 × 850 | Redraw |
| `management-high-pressure-pose` | 680 × 850 | Redraw |
| `management-lifting-pose` | 680 × 850 | Redraw |
| `bedroom-base` | 1672 × 941 | Refine |
| `office-incursion` | 1672 × 941 | Refine |
| `monday-uprising-briefing` | 1374 × 1145 | Refine |
| `monday-uprising-debriefing` | 1373 × 1145 | Refine |
| `the-alarm-line-holds` | 1373 × 1146 | Refine |
| `the-alarm-forced-verticalisation` | 1375 × 1144 | Refine |

**Match each existing file's pixel dimensions exactly.** The sizes are not
tidy and the four illustrations disagree with each other by a pixel or two —
that is harmless noise from how they were made, and matching it is safer than
correcting it. The registration and the download size of the game are both
known-good at these dimensions, and the game has to keep working offline once
cached, so this is not the moment to make every file larger.

Two of these asset IDs are likely to be renamed before the work lands, which
would change two filenames but nothing about the pictures. You will be told
before it matters.

## Working method and file sizes

Work as large as you like. **Send two files for every asset:**

1. **The shipped PNG**, at exactly the dimensions in the table, transparent
   where the table below says transparent.
2. **The layered source** — your working file, layers intact, at whatever
   resolution you worked at.

Send both to the maintainer however is easiest. **You never need to touch the
repository, use Git or install anything.** The maintainer files the work,
writes the catalogue entries and integrates it into the game: the PNG becomes
the asset the game loads, and your layered source joins the existing masters
in `docs/art/production/sources/`, which is development material — never
catalogued, never built into the game, never downloaded by a player. Only the
shipped PNGs reach anyone playing, which is why they are the only ones that
have to be small.

This matters more than it sounds. Holding the layered source is what lets the
project resample, re-cut or re-separate your work later without asking you to
redraw anything. It is the single most useful thing you can hand over.

## The four families

These behave completely differently at runtime. An asset drawn without knowing
how it moves will look wrong in ways that are not your fault.

### Resistance states — the protagonist, bed and duvet

This is the hard one. Read it twice.

Four drawings of the same subject: the protagonist in bed, and the bed being
progressively hauled up at one end. `rest` is level and calm; `final-pressure`
is steeply tilted and the protagonist is holding on. The other two are between.

The engine draws all four into the same rectangle and crossfades between them.
That means:

- **Canvas: 900 × 900, transparent background.** No floor, no wall, no room —
  the bedroom is a separate image behind.
- **The pivot is the planted foot of the bed, at pixel (176, 766).** This is
  the corner that stays on the floor while the opposite end is lifted.
- **That pivot must fall on exactly the same pixel in all four drawings.**

`docs/art/commissions/templates/resistance-registration.png` is a guide sheet at
exactly that canvas size, with the pivot marked and each state's tilt drawn as a
spoke. Drop it in as a layer, draw against it, and delete it before export. It is
generated from the game's own presentation data, so it cannot disagree with what
the engine actually does.

The last point is the whole game. If the planted foot sits three pixels left in
one state, the bed visibly jumps when the game switches to it. Motion between
states must come from the difference between the drawings — the tilt, the
strain, the grip — never from the whole composition having shifted inside its
canvas. Set up one file with the pivot marked, and draw all four states in it.

Each state is drawn with the bed **already tilted**. The skin records how much:
0°, −15.7°, −19.9° and −28.2°. The engine then rotates only the remainder needed
to reach whatever tilt the current danger level calls for, up to −34°. If you
draw the four tilts differently — which is completely fine, and you may find
better angles — **measure what you actually drew and say so**, because those four
numbers live in
`src/play/content/presentation/skins/episodes/the-alarm/the-alarm-bedroom.json`
and have to be corrected to match.

The duvet may read briefly like a banner or a defended boundary. It must stay
cloth: not a cape, not a flag.

### Management poses

Four whole-figure poses. Management stands at the right of the screen, working a
riveted brass-and-iron console with a lever, hauling the bed upright.

- **Canvas: 680 × 850, transparent background.**
- Drawn at twice the size it appears on screen, so detail can afford to be fine.
- The figure is cropped very slightly by the right edge of the screen in play.
  Keep nothing essential in the last few pixels on the right.

`docs/art/commissions/templates/opposing-actor-registration.png` is the matching
guide sheet: canvas bounds, the floor line the figure stands on, and the band on
the right that the screen edge cuts off.

The poses **ratchet**. Each one is a peak that holds — Management reaches a level
of exertion and stays there rather than relaxing between efforts. Draw them as
four held positions, escalating from a brittle professional performance, through
wounded irritation, to comic administrative fury. Management is funny first,
unpleasant second and mildly threatening third, and the threat comes from the
machinery and what it does to the room.

**The console is fixed furniture.** It is bolted down. It must be identical
across all four poses — same position, same scale, same angle, same pipework,
same paper spool, same plinth width. In the current artwork it is not: it was
redrawn from scratch for each pose and its plinth measures 158, 154, 152 and 153
pixels across the four. In play the machine very slightly breathes. Fixing that
is part of this job.

The lever genuinely moves — it is the thing being hauled — so it changes between
poses. Everything else about the machine does not.

How you achieve that is yours to choose, and depends on how you work:

- If you draw the console once on its own layer and reuse that layer across all
  four poses, it is identical by construction. That is the natural way to do it
  digitally, and it is what the project would prefer.
- If you work in a way where layers are not available, draw it once and copy it,
  and we check the measurements afterwards.

Either is acceptable **provided the layered source comes with it**, because with
the source in hand the project can separate the console into its own reusable
piece later without going back to you.

### Environment plates

Two images, both 1672 × 941, both 16:9, both drawn for a 1280 × 720 screen.

- `bedroom-base` is the room: warm, domestic, dawn light, bedside table, lamp,
  clock, mug, books, plant, pictures. **It contains no bed, no duvet and no
  characters** — those are drawn separately and composited on top. Keep the
  centre and lower middle of the image clear, because that is where the bed
  will sit. Opaque; this is the bottom layer.

- `office-incursion` is the workplace invading the bedroom: cold fluorescent
  light, cables, articulated lamps entering from above, paperwork, hard
  geometric overlays. **It is transparent wherever the bedroom should show
  through.**

The incursion is not a background — it is a wipe. It starts 820 pixels off to
the right and slides left as the pressure rises, so it must read at *every*
partial position, not only when fully arrived. Anything that only makes sense
once the whole image is on screen will spend most of the episode looking like a
mistake. It also renders at 94% opacity throughout, so the room is always
faintly visible behind it.

The office must never completely win. It partially converts the bedroom; it does
not replace it.

### Story illustrations

Four single images shown beside a panel of text, in the scenes before and after
play. These are refinements rather than redraws.

They are cropped to fit a panel of roughly 6:5, and the crop is applied
automatically, so keep important content away from the edges. **No text, no
lettering, no numbers, no interface elements, no signature and no watermark** —
all wording is drawn by the game as real text over the top, and must stay
readable and translatable.

- `monday-uprising-briefing` — the confrontation set up.
- `the-alarm-line-holds` — the protagonist keeps the bed. Fist raised, Management
  and its machinery recoiling in comic defeat.
- `the-alarm-forced-verticalisation` — the bed has been hauled upright and the
  protagonist has lost this one. It must be funny, dramatic and sad. Defeat
  without humiliation: the joke is that power made an absurd demand and enforced
  it, never that the protagonist was foolish to resist.
- `monday-uprising-debriefing` — the one with an unusual constraint. It appears
  after the campaign whatever happened, and the game prints a tally over it. It
  must stay truthful for *every* possible result, including all episodes held
  and none. **It must not assert victory or defeat.** Tired but unbroken,
  ambiguous evidence of struggle, stalled machinery, some suggestion that the
  resistance continues elsewhere.

## Palette

Use the project's existing six colours rather than picking new ones. They are
defined in `src/shared/theme/tokens.css` and the game draws its own text and
interface from the same set, which is what keeps artwork and interface looking
like one thing.

| Role | Value | Used for |
| --- | --- | --- |
| Rest cream | `#f3e8d0` | Warm domestic ground, the bed, safety |
| Paper white | `#fffdf7` | Paper, bedding highlights, light surfaces |
| Ink charcoal | `#201c19` | Linework, silhouettes, shadow |
| Resistance red | `#b8322a` | The protagonist's defiance and effort |
| Authority gold | `#c8952e` | Management, brass, the apparatus |
| Work light blue | `#3e6f8f` | Cold workplace light, the incursion |

Shading, breaking and mixing these is fine — this is a palette, not a paint-by-
numbers. Introducing a seventh strong colour is a conversation, not a decision.

**Nothing important may be communicated by colour alone.** Every state a player
needs to read must also be distinguishable by shape, position or value, because
some players will not see the difference between the red and the gold.

## What must never appear in the artwork

Some of these are legal, some are political, and all of them will send an asset
back:

- Any real person's likeness. Management in particular is an archetype, not a
  politician, celebrity or executive. No recognisable face, no coded features,
  no visual nicknames.
- Any real company's logo, branding, trade dress or product.
- Any other artist's recognisable style copied deliberately. The reference
  traditions in the art direction are qualities to study, not manners to
  reproduce.
- Signatures, watermarks, monograms or dates drawn into the image. Your credit
  goes in the asset record, permanently and by name — see below.
- Text of any kind, in any language.
- Traced, photobashed or copied third-party material, including stock images
  and reference photographs you do not have the rights to use.
- Weapons, gore or horror anatomy. Management's menace is bureaucratic.

## Rights, credit and provenance

**Two questions need an answer from you, in words, before the first finished
asset goes into the game. Neither is about the drawing.**

1. **What name do you want on this?** Your credit goes into a public record
   that is effectively permanent. It can be your full name, a shortened form,
   or a handle that is nothing like your legal name.
2. **Did you use any AI tool, and where?** Including features built into
   ordinary drawing software. "None" is a perfectly good answer, and it is
   the one this whole job needs to be able to record truthfully.

The rest of this section is why those two matter. Read it properly before you
start drawing, because two parts of it surprise people and one of them is
irreversible.

**You keep the copyright in everything you draw.** The project does not ask you
to sign it over and does not want it.

**Your work will be published under the Creative Commons Attribution-ShareAlike
4.0 licence**, the same licence as the rest of the project's writing and art.
This is the part worth understanding before rather than after:

- Anybody may copy, modify and redistribute your drawings.
- **Anybody may use them commercially**, including a company, including on
  things they sell. Open-source does not mean non-commercial, and this project
  cannot promise you otherwise without breaking the commons it is built on.
- Everyone doing so must credit you and must release their version under the
  same licence.

**Your credit is yours to choose.** The licence requires attribution, and the
asset records can carry whatever name you want to be known by. That can be your
full name, a shortened form, or a handle that is not your legal name at all.
This is a public repository and the record is effectively permanent, so decide
deliberately rather than by default. Ask for a pseudonym if you have any doubt;
it is easy to do now and impossible to undo later.

**The project will modify your work.** Assets get resampled, cropped, matted,
composited, and possibly cut into separate pieces. That is the pipeline, not a
judgement on the drawing. By contributing you are agreeing to that happening.

**No generative AI in your own process.** This whole job exists to replace
generated artwork with human authorship, so generating an image and painting
over it would defeat the point and would make the project's published provenance
record false. If you use any AI-assisted tool at all — including things built
into ordinary drawing software, such as generative fill, upscaling or
background removal — say which and where, so the record is accurate.

**You need to confirm the work is yours to give:** that you drew it, and that it
does not incorporate anyone else's material.

For each finished asset, write down in plain prose what you did, so it can go in
the catalogue alongside the existing record: what was redrawn or repainted, by
whom, and when.

## How we will know it is finished

Deliberately mechanical where it can be, so that judging the work stays about
whether the drawing is good and not about whether it fits.

**Measured, not argued:**

- All four resistance states are 900 × 900, and overlaying them shows the
  planted foot on the same pixel in every one.
- The four drawn tilt angles have been measured and reported.
- All four Management poses are 680 × 850, and the console measures identically
  across all four — plinth width included.
- Environment plates are 1672 × 941 and the incursion is transparent where the
  room shows through.
- Every file matches its existing dimensions and every file that needs
  transparency has it.
- Illustrations contain no text, signature or watermark.

**Judged, by looking at it running:**

- The four resistance states read as one escalating struggle, with no jump when
  the game switches between them.
- Management's poses read as a ratchet.
- The protagonist reads as heroic rather than pitiful at every stage, including
  in defeat.
- It is all readable on a phone held sideways.

**Recorded:**

- Provenance notes written and added to the catalogue for each asset.
- Attribution name confirmed.
- AI-tool use answered, including a plain "none", and recorded.
- The maintainer's acceptance of the finished artwork in play, recorded as its
  own thing rather than inferred from the checks passing.

Ask for the reference clip too — twenty seconds of the episode escalating to its
failure, which shows the bed turning about its pivot, the poses ratcheting and
the office sliding in. Three of the constraints above are about motion, and no
amount of writing conveys them as well as watching it once.

## Order of work

**Start with one drawing, not eight.** Draw `the-alarm-resistance-states-rest`,
hand it over, and let it go through the whole pipeline into the running game
before drawing anything else. This is not a test of you — it is a test of this
document. The registration contract is the part most likely to have been
explained badly, and finding that out after one drawing is much better than
after four.

Then the remaining three resistance states, then the four Management poses.

**Those eight go together as one batch.** The bed and Management appear in the
same frame at the same moment, so a redrawn bed next to a generated Management
would look like two different games spliced together. Nothing ships until all
eight are done, which also means there is no rush on any individual one.

The six refinements come after and can land separately, since they appear in
their own scenes.

Nothing currently in the game is removed until its replacement is finished and
accepted, so there is no state in which a half-done batch breaks anything.

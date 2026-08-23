# Art development

This directory preserves visual-development artefacts that inform production art
without becoming runtime game assets merely by existing here.

Nothing under `docs/` is catalogued, preloaded, emitted into the production build
or written into the offline cache. A player never downloads any of it. Artwork
becomes a runtime asset only by being placed under
`src/play/content/presentation/assets/` and given a provenance-bearing entry in
`src/play/content/presentation/asset-catalog.json`; the project policy check
enforces that correspondence in both directions.

This page is the canonical index of what is kept here and why.

## What each directory holds

`concepts/` is exploratory research. These sheets require explicit selection,
refinement, provenance review, catalogue integration and human perceptual
acceptance before any derived artwork can be marked `production-approved`. Keep
materially different drafts so later contributors can inspect how and why the
visual direction changed. It currently preserves two comparisons:

- the campaign concept sheets, `the-monday-uprising-concept-sheet-v1` through
  `-v5`, running from the first dramatic, densely rendered exploration, through
  the quieter editorial line-art alternative, the targeted return to sheet one
  with reduced environmental density, and the comic administrative-Management
  iteration, to the wounded-vanity and corporate-rage expression iteration; and
- the resistance-state sheets, `the-alarm-resistance-state-sheet-v1` through
  `-v5`, recording the move from the early prototype topology to an isolated
  tableau, then regularised posts and finally plain foot posts.

`production/` holds the accepted identity and style references that later
generation was directed against — currently the protagonist and Management
production sheets for `The Alarm`. These are the authority for what a character
looks like, and a replacement pose should be generated against them rather than
against an earlier pose.

`production/sources/` holds the full-resolution pre-matte masters, still on their
flat chroma field, for artwork that ships in cut-out form. Shipped assets are
resampled and matted derivatives, so this is where to start any refinement pass
or any re-export at a different size. Keeping the masters here is what makes it
safe to resample the shipped copies.

`commissions/` holds the working briefs handed to an artist bringing a specific
body of artwork to production authorship. A brief names the assets in scope,
the treatment each receives, the technical contract they must satisfy and the
rights, credit and provenance terms under which the work is contributed. It is
addressed to the artist rather than to the project, and it is deliberately
public: the same artefact is what an outside contributing artist will be handed
once campaign authoring opens. It currently holds [The Monday Uprising artwork
brief](commissions/the-monday-uprising-artwork-brief.md).

`first-playable-layered-parts/` holds the separated cut-out parts from the
first-draft enactment of `The Alarm`, retained after integrated review replaced
independently rotated parts with complete authored tableaux. Its own
[README](first-playable-layered-parts/README.md) records the reasoning.

## Registration contract for multi-state artwork

Where a skin swaps several assets into one part to express a state — as the
`The Alarm` bedroom skin does for its four resistance states — the engine draws
every state into the same fixed rectangle. Any difference in where the subject
sits inside its canvas therefore renders as the subject jumping when the state
changes.

Multi-state artwork must consequently share a registration: a common pivot,
identical on every state, positioned identically within a common canvas size.
For the resistance states that pivot is the planted foot of the bed, which stays
on the floor while the opposite end is progressively lifted. Motion between
states must be authored as the difference between the drawings, never as an
accidental offset of the whole composition.

## Related documents

The authoritative current brief is [Art direction](../art-direction.md), and its
evidence basis is [Political satire and radical print art
direction](../research/political-satire-art-direction.md).

The production-facing layer, state and pivot hypothesis for the first playable
episode is [The Alarm playable-scene production
specification](the-alarm-playable-scene-production-spec.md). It specifies a
separated cut-out direction that integrated review replaced with complete drawn
tableaux, so it is preserved as reasoning rather than as instruction; for the
assets that ship today the authority is [The Monday Uprising artwork
brief](commissions/the-monday-uprising-artwork-brief.md). Its first
protagonist and Management hypotheses are preserved in [First playable character
production sheets](first-playable-character-sheets.md). The generated source
sheets, runtime crops and provenance for the first bed, duvet and environment
enactment are recorded in [First playable bed, duvet and environment
assets](first-playable-environment-assets.md). The replacement whole-composition
hypothesis for keeping the protagonist, duvet, mattress and frame on one
perspective plane is preserved in [The Alarm resistance-state
sheet](the-alarm-resistance-state-sheet.md).

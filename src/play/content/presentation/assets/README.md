# Presentation asset ownership

- Put artwork intentionally reusable across campaigns or episodes under `shared/`.
- Put campaign-specific artwork under `campaigns/<campaign-id>/`.
- Put episode-specific artwork under `episodes/<episode-id>/`.
- Register every image and its provenance in `../asset-catalog.json`.
- Reference the catalogue's semantic asset ID through explicit source-and-ID
  data; never put file paths in campaigns, episodes or skins.

Shared skins may use only shared assets. An episode-owned skin may use shared
assets and assets owned by the same episode.

Campaign briefing and debriefing illustrations may use `shared|campaign`.
Episode result illustrations may use `shared|episode`. Each local reference is
private to its owning campaign or episode.

Every campaign debriefing requires an illustration. Its composition must remain
truthful for every possible campaign tally—none, some or all episodes held—and
must not encode a score or unambiguous victory or defeat in the pixels.

The declared source must agree with the catalogue path; resolution never falls
back from one ownership level to the other.

A skin's authored image width and height describe the complete image frame,
including intentional transparent padding—not only the opaque pixels.

A resistance skin supplies a registered resistance-states sequence. Every
state uses the same transparent production canvas and is selected by an ordered
physical-danger threshold. Every image is normalized to a shared local plane
around the same authored pivot so Phaser can rotate the resistance composition continuously.
The skin owns semantic asset references, display bounds, maximum danger angle,
elapsed-time rotation response, crossfade timing, jolt and shake values, plus a
reduced-motion crossfade. The generic Phaser renderer interprets that finite
vocabulary; it does not branch on an episode or asset ID. Furniture, character
actions and other episode-specific nouns belong only in episode-owned content
and provenance—not in shared schema fields, layout IDs or TypeScript renderers.

Catalogue provenance is origin-specific: AI-generated work records date, tool
and prompt; human-created work records its creator; licensed-source work also
records source, attribution and permitted uses. Cultural assets use the
project's `CC-BY-SA-4.0` licence assertion and retain explicit replacement
status.

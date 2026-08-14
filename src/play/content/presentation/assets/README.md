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

Catalogue provenance is origin-specific: AI-generated work records date, tool
and prompt; human-created work records its creator; licensed-source work also
records source, attribution and permitted uses. Cultural assets use the
project's `CC-BY-SA-4.0` licence assertion and retain explicit replacement
status.

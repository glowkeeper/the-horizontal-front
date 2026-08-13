# Presentation asset ownership

- Put artwork intentionally reusable across episodes under `shared/`.
- Put episode-specific artwork under `episodes/<episode-id>/`.
- Register every image and its provenance in `../asset-catalog.json`.
- Reference the catalogue's semantic asset ID from skins; never put file paths in
  episodes or skins.

Shared skins may use only shared assets. An episode-owned skin may use shared
assets and assets owned by the same episode.

A skin's authored image width and height describe the complete image frame,
including intentional transparent padding—not only the opaque pixels.

Catalogue provenance is origin-specific: AI-generated work records date, tool
and prompt; human-created work records its creator; licensed-source work also
records source, attribution and permitted uses. Cultural assets use the
project's `CC-BY-SA-4.0` licence assertion and retain explicit replacement
status.

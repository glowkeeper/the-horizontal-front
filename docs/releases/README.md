# Releases

Release notes are recorded here as well as published on the GitHub release
record, so that the history of what was shipped travels with the repository
rather than depending on one hosting account remaining available. A project that
insists on being static, archivable and offline-capable should not keep its own
release history somewhere it cannot be cloned.

Each file is the notes for one version, written before that version is
published, and covers content scope, controls, supported environments,
accessibility boundaries, licences, provenance, offline use and known
limitations. The GitHub release record for the same version carries the same
text.

Each file opens with the header block
[the release record](../release-process.md#the-release-record) defines — its
version, date, kind, summary and lifecycle. The list below is generated from
those headers by `npm run generate:docs` and ordered by parsed version rather
than by filename, because `1.10.0` sorts before `1.9.0` in every default string
comparison there is. Maintaining the list by hand would make this page a second
copy of what the records already say, which is the drift this project removes
wherever it finds it. A record whose lifecycle is `draft` is deliberately absent
from the list: the heading says published, and a draft describes a version
nobody can play yet.

Notes are not edited after publication except to correct a factual error, which
is recorded in place rather than silently replaced. Two departures from that are
deliberate and named here rather than taken quietly. A release rolled back after
publication has its `Lifecycle` set to `withdrawn`, because a record that cannot
say what happened to it is worse than one that was amended. And the header block
was added to `0.2.0` and `0.2.1` after both were published: every field restates
something the file or the repository already held — the version from its title,
the kind from its former `Status:` line, the date from its tag — so nothing was
changed, only made structural enough for a check to read. Neither record's prose
was touched, including where it describes rules that have since moved on.

## Published

<!-- generated:releases -->
- [0.2.1](0.2.1.md) — 2026-08-17, public, not production. Two live defects
  fixed, and a documentation-accuracy pass.
- [0.2.0](0.2.0.md) — 2026-08-17, public, not production. One campaign, one
  episode, and AI-generated artwork disclosed as such.
<!-- /generated:releases -->

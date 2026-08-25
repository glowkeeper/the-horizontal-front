# The code-review skill

[`SKILL.md`](SKILL.md) tells an automated reviewer which of this project's rules
are worth raising as findings.

It exists because the reviewer was never short of information — GitHub reads
[`AGENTS.md`](../../../AGENTS.md) as repository instructions, so the rules were
already available to it — but nothing distinguished an invariant from a
stylistic preference. A correct finding about register discipline was demoted to
a collapsed section rather than raised, which is the failure this addresses.

## What belongs in it

Faults that are project invariants **and** that no build check decides. The
project keeps an unusually clear account of which those are: `docs/release-process.md`
has a heading called "Not decidable by any build", and `AGENTS.md` says of
register discipline that it is review discipline rather than a `check:policy`
rule.

## What does not

The rules themselves. `SKILL.md` names a fault and links to the document that
defines it; the definition stays in one place. A skill file restating the rules
would be the second copy that
[`docs/technical-architecture.md`](../../../docs/technical-architecture.md)
forbids, in a file nobody would think to audit.

Anything the build already refuses also stays out, because re-reporting a check
failure wastes review attention on something that has already blocked the merge.

## Keeping it current

`npm run check:docs` covers this directory, so a renamed document or a moved
heading fails the build rather than leaving a dead pointer here. What it cannot
check is whether the list is still the right list. Revisit it when a rule moves
from review into the build — that rule then belongs in the "already enforced"
section, not the first one.

The skill is read by anything implementing the Agent Skills specification, not
only by Copilot code review, so it is written for a reviewer in general rather
than for one vendor.

# Roadmap

This is what The Horizontal Front intends to do next, and which parts of it are
wanted from other people.

It is deliberately short on dates, because the project has none it could keep.
It is a small, deliberately paced effort, and a roadmap that implied a schedule
would be inventing one. What it does say is how far the project has committed
to each thing on it: decided and being worked on, genuinely intended with
nobody on it, or filed and not yet evaluated. Every entry below carries one of
those three, and the next section defines them.

The issues linked below are the authority. This page is a way in, not a second
specification: where something is already written down properly, this links to
it rather than restating it.

## How to read this

<!-- generated:commitments -->
| Term | Meaning |
| --- | --- |
| Committed | Decided, and either in progress or next. |
| Wanted, not scheduled | Genuinely intended, nobody currently working on it. |
| Raised, not decided | Filed and published, but not evaluated. The project has formed no intention about it, and listing it here is not agreement to do it. Moving an issue out of this row is the decision being made. |
<!-- /generated:commitments -->

Every tranche below is a GitHub issue holding the reasoning behind it, with the
work as child issues, which may hold children of their own. Start with the
tranche, not the children — the tranche says why.

Every open issue appears somewhere on this page: in its own tranche, under one,
or separate from the tranches. If it is not here, that is a fault in the page
rather than work being kept quiet.

<!-- generated:roadmap -->
### [Publish the first production release (1.0.0)](https://github.com/glowkeeper/the-horizontal-front/issues/36)

**Committed.** Finish the content that already exists. One campaign, one episode, brought to production quality. Adding more content is not part of it.

*Help wanted:* Production audio and human artwork refinement are both wanted,
and both are currently the hardest things for the project to staff.

- [#37 Bring Management and the protagonist to production authorship](https://github.com/glowkeeper/the-horizontal-front/issues/37)
  - [#27 Reconcile Management's fixed console across the four pose states](https://github.com/glowkeeper/the-horizontal-front/issues/27)
- [#38 Complete and accept the production audio](https://github.com/glowkeeper/the-horizontal-front/issues/38)
- [#39 Playtest The Alarm with representative players](https://github.com/glowkeeper/the-horizontal-front/issues/39)
- [#73 Commit to a versioning scheme and make release status checkable](https://github.com/glowkeeper/the-horizontal-front/issues/73)
- [#40 Prepare and publish the 1.0.0 production release](https://github.com/glowkeeper/the-horizontal-front/issues/40)

### [Meet the commons participation obligations](https://github.com/glowkeeper/the-horizontal-front/issues/44)

**Committed.** Make the project's stated commitments to community participation real, and enforce the process rules it writes down but does not check.

*Help wanted:* Mostly maintainer work on repository process, but the documents
it produces are for contributors and corrections to them are welcome.

- [#45 Publish a public roadmap](https://github.com/glowkeeper/the-horizontal-front/issues/45)
- [#46 Record branch and pull-request conventions in CONTRIBUTING](https://github.com/glowkeeper/the-horizontal-front/issues/46)
- [#47 Require browser and offline checks on main](https://github.com/glowkeeper/the-horizontal-front/issues/47)
- [#48 Keep documentation accurate by construction](https://github.com/glowkeeper/the-horizontal-front/issues/48)
- [#49 Make the no-placeholders invariant machine-checkable](https://github.com/glowkeeper/the-horizontal-front/issues/49)
- [#61 Document and harden offline verification](https://github.com/glowkeeper/the-horizontal-front/issues/61)

### [Open the game to outside authors](https://github.com/glowkeeper/the-horizontal-front/issues/53)

**Wanted, not scheduled.** Let somebody who did not build the game write a campaign for it: compose it in the browser, preview it playing, and package it into a contribution that can be reviewed and merged.

*Help wanted:* This tranche exists so that campaigns can come from outside. It
is the main route in for anyone who wants to write for the game.

- [#54 Own presentation artwork at campaign level and stock a shared starter kit](https://github.com/glowkeeper/the-horizontal-front/issues/54)
- [#55 Render content the build did not ship](https://github.com/glowkeeper/the-horizontal-front/issues/55)
- [#14 Create the Propaganda Department authoring tool](https://github.com/glowkeeper/the-horizontal-front/issues/14)
- [#56 Package a contribution](https://github.com/glowkeeper/the-horizontal-front/issues/56)
- [#57 Write the contributor's editorial standard](https://github.com/glowkeeper/the-horizontal-front/issues/57)

### [Expand the episode grammar beyond one worked example](https://github.com/glowkeeper/the-horizontal-front/issues/41)

**Wanted, not scheduled.** Widen the authoring vocabulary until a second and third episode can be written as data, writing, artwork and audio alone — proving the claim that a new episode needs no new programming.

*Help wanted:* Engine and grammar design, which the maintainer intends to
keep. Episodes written against the grammar are a different matter entirely.

- [#42 Keep campaign progress on the player's device](https://github.com/glowkeeper/the-horizontal-front/issues/42)
- [#43 Validate the geometry of a resistance composition](https://github.com/glowkeeper/the-horizontal-front/issues/43)
- [#11 Add semantic poses and constrained composition offsets](https://github.com/glowkeeper/the-horizontal-front/issues/11)
- [#8 Expand the episode narrative grammar](https://github.com/glowkeeper/the-horizontal-front/issues/8)
- [#9 Add phased confrontation grammar](https://github.com/glowkeeper/the-horizontal-front/issues/9)
- [#10 Expand the reusable rhythm vocabulary](https://github.com/glowkeeper/the-horizontal-front/issues/10)
- [#13 Add a second reusable layout and production-oriented skin](https://github.com/glowkeeper/the-horizontal-front/issues/13)

### Separate from the tranches

An issue belongs here when it is genuinely a one-off: real work with no body
of work behind it for a tranche to explain. Inventing a tranche to hold a
single issue would produce a grouping that says nothing, and the instruction
above is to start with the tranche because the tranche says why. This is a
declared exception rather than a queue: if the list grows long, that is
evidence of work accumulating which no tranche accounts for, and the answer is
a tranche rather than a longer list.

- [#50 Widen the verified support matrix](https://github.com/glowkeeper/the-horizontal-front/issues/50) — **Wanted, not scheduled.**
- [#80 Make the published roadmap complete](https://github.com/glowkeeper/the-horizontal-front/issues/80) — **Committed.**
<!-- /generated:roadmap -->

## Where help is most wanted

Three things are harder for this project to staff than anything else, and all
three are open to anyone.

**Production audio.** Every sound is synthesised from authored numbers, with no
samples anywhere, which keeps the provenance position clean. The mix is a first
pass tuned by a maintainer working without a sound designer, and it needs
someone who actually knows what they are doing. See
[#38](https://github.com/glowkeeper/the-horizontal-front/issues/38).

**Human artwork.** The current character art is AI-generated under maintainer
direction, integrated without a human repainting pass. That is published as a
known limitation rather than concealed, and it is the specific reason the live
release is numbered `0.2.x` rather than `1.0.0`. See
[#37](https://github.com/glowkeeper/the-horizontal-front/issues/37).

**Playtesting.** One person who knows where every note falls cannot tell whether
the joke lands. See
[#39](https://github.com/glowkeeper/the-horizontal-front/issues/39).

## What the maintainer intends to keep

Engine architecture, the episode grammar and the content-ownership rules are
maintainer decisions for now. They are the constraints everything else is built
on, and they are being kept deliberately small and inspectable while the project
is young. Proposals are welcome as issues; the [contributing
guide](CONTRIBUTING.md) explains how to raise one.

The protected commitments in the [project charter](PROJECT_CHARTER.md) are not
on the roadmap at all, because they are not up for revision. How decisions get
made is in [governance](GOVERNANCE.md).

## Writing a campaign

Not yet, honestly. Campaign authoring is what
[#53](https://github.com/glowkeeper/the-horizontal-front/issues/53) exists to
make possible, and until it lands there is no supported route for an outside
author: the tooling, the shared artwork a stranger may use, and the editorial
standard a submission would be judged against are all part of that tranche.

If you want to write for the game, say so on that issue. Knowing somebody is
waiting is the best argument for scheduling it.

## Keeping this honest

This page is generated from a record in the repository, and a check compares its
issue numbers and titles against GitHub. If an issue here is renamed or
reparented and this page is not updated, that check fails. The check also runs
the other way: it lists every open issue and fails if one of them is named
nowhere here, so work cannot start — or sit open for weeks — without appearing
on the plan that claims to be the way in.

One part of this is editorial rather than checked: a tranche goes on the plan
before its work starts. Commitment is what this page publishes, so deciding to
commit and publishing that decision are the same act. An individual issue only
needs listing, with no ordering requirement, and the check leaves a
pull-request cycle of slack for that.

The page still deliberately does not restate whether each issue is open or
closed — the linked issue answers that better than a copy of it could.

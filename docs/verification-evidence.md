# Verification evidence

## Purpose and authority

This document is the authoritative vocabulary for verification claims in The
Horizontal Front. Issues, pull requests, reviews and AI hand-offs use the three
levels below to say what evidence exists and, equally importantly, what has not
been established.

Evidence accumulates; it does not silently upgrade. Source checks do not prove
browser behaviour, and browser automation does not prove that an experience is
clear, funny or satisfying. A report may claim only the levels for which it
records the required evidence.

## The three levels

| Level | What it establishes | What it cannot establish |
| --- | --- | --- |
| **Automated/source verified** | The identified source and structured content were inspected or passed named deterministic checks. | That the application rendered or that a player-facing flow worked. |
| **Browser-flow verified** | A named player-facing flow produced the recorded result in a specified real browser environment. | General aesthetic quality, experiential success, untested browsers or genuine touchscreen behaviour. |
| **Human perceptually accepted** | A person judged the stated perceptual qualities acceptable in a recorded play session. | Universal usability, deterministic correctness or behaviour outside that session's scope. |

The word **accepted** is deliberate at the human level. Readability, timing,
humour and satisfaction are judgements, not facts proved by a test runner.

## Automated/source verified

Claim this level when the relevant source or content has been inspected and the
smallest appropriate deterministic checks have passed.

A valid report records:

- the revision or working-tree state examined;
- the source, content or invariant inspected;
- every command or automated check relied upon and its result;
- any relevant check that was not run; and
- failures, warnings or remaining limitations.

Examples include schemas, unit tests, type checks, content validation, project
policy checks, documentation checks and production builds. A passing check is
evidence only for the behaviour it covers. Reading a Phaser scene is not
evidence that it rendered, and a successful build is not evidence that its
controls worked.

## Browser-flow verified

Claim this level only when a real browser exercised the relevant public
application and the report is reproducible.

A valid report records:

- the revision or build exercised;
- browser family and version, viewport and any device emulation;
- starting URL and the player-facing states reached;
- keyboard, pointer or touch actions performed;
- the expected and observed result;
- the repeatable test, trace or screenshot supporting any claim that needs it;
  and
- browser, device, input or flow coverage that remains unverified.

The browser interaction must use the production-shaped application and its
player-facing controls. Importing scene internals, mutating engine state or
using a test-only route cannot establish this level for the real flow. Follow
the [browser-verification guide](browser-verification.md) for the repository's
repeatable suite, isolated AI-review tooling and evidence locations.

A browser result may establish either success or failure. Reproducing a broken
flow is browser-flow verification of the defect; it is not acceptance of the
experience.

Browser automation cannot claim that presentation is readable, timing feels
fair, satire lands, feedback is satisfying or an interaction works on a real
touchscreen merely because scripted assertions passed.

## Human perceptually accepted

Claim this level only when a person has deliberately experienced the relevant
build and judged the named qualities acceptable.

A valid report records:

- the revision or build experienced;
- the browser or device and input method used;
- the task or scene played and the perceptual questions considered;
- the person's judgement and any observed problems; and
- the boundaries of the session, including devices, accessibility needs or
  alternatives not covered.

The report may identify the reviewer by name, handle or role; it need not expose
personal information. One person's acceptance is evidence from that session,
not a universal usability or accessibility claim. Material accessibility
claims require appropriately scoped human evaluation rather than inference
from a general playtest.

An AI assistant may record a person's stated judgement but can never originate
or infer **Human perceptually accepted** from source review, screenshots,
browser automation or its own assessment.

## Choosing required levels

Acceptance criteria should name the evidence levels proportionately. Not every
change requires all three.

- A schema correction may require only **Automated/source verified**.
- A navigation or input change will usually require **Automated/source
  verified** and **Browser-flow verified**.
- Rhythm tuning, visual clarity, humour or game feel will commonly require all
  three levels.

When a change invalidates an earlier level—for example, presentation code
changes after a browser run—that level must be repeated or reported as not
claimed for the new revision.

## Reporting format

Use every heading below in issue, pull-request and review reports. Write
**Claimed** with evidence or **Not claimed** with the reason. Do not omit a level
in a way that could be mistaken for success.

```text
Automated/source verified — Claimed
- npm test: 160 passed
- npm run build: passed
- Scope: current working tree

Browser-flow verified — Claimed
- Chromium 151, 1280x720, current working tree
- / → /play/ → campaign → briefing → episode
- Keyboard and pointer flows passed via npm run test:browser
- Not covered: real touchscreen input

Human perceptually accepted — Not claimed
- No human playtest was performed for this change.
```

This example does not become a human acceptance claim because the browser flow
passed. If a person subsequently accepts the relevant perceptual qualities,
record that session explicitly rather than editing the meaning of the earlier
evidence.

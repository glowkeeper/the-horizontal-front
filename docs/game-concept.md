# The Horizontal Front

> **Seize the Means of Relaxation.**

## High concept

The Horizontal Front is a satirical arcade game for web and mobile. The player is trying to remain safely in bed while their boss applies increasing pressure to tip the bed, expose them from beneath the duvet, and force them into work.

To resist, the player must tap, click, or alternate keys rapidly. The irony is the heart of the game: the player has to work extremely hard to avoid work.

The satire targets exploitative work culture, compulsory productivity, corporate euphemisms, and executive power. The boss is a fictional, Trumpesque tycoon archetype rather than a direct depiction of a real person: orange-tinted, golden-haired, power-tied, vain, loud, and absurdly self-important.

## Player fantasy

The player is not merely sleepy. Staying in bed is an act of organised resistance. They are holding the line against forced verticalisation and defending the right to rest.

Possible opening copy:

> **COMRADE, HOLD THE LINE.**  
> Management has breached the bedroom.  
> Your alarm has collaborated with the enemy.  
> Stay horizontal for 30 seconds.

## Core loop

1. A level begins with the player safely in bed.
2. The boss continuously tips the bed and pulls the duvet away from the player.
3. Successful rhythmic inputs pull the duvet back toward safety.
4. Corporate attacks periodically interrupt the basic tapping rhythm.
5. Pressure increases throughout the level.
6. The final ten seconds become a frantic morning offensive.
7. Survive for roughly 30 seconds to clear the level. Lose the duvet completely and the player is tipped out of bed.

The duvet and bed communicate danger directly: the duvet is progressively pulled down, the mattress tilts, the player becomes exposed, and cold work light invades the room. A small optional accessibility indicator may supplement this presentation, but a conventional Tilt Meter is not the primary interface.

The duration, pressure curve, and recovery per input all require playtesting. Thirty seconds is the current starting point, not a final rule.

## Basic input

Normal tapping represents pulling the duvet back, gripping the mattress, or otherwise resisting the boss. The game should reward rhythm and sustained effort without demanding unsafe or inaccessible input speeds.

Difficulty should be calibrated per input method. Five taps per second on a touchscreen does not necessarily represent the same effort as five alternating keyboard presses. The experience should feel equivalently frantic across devices rather than using identical numerical thresholds.

## Corporate attacks

Boss attacks briefly replace or complicate normal resistance. Each should be readable through animation and layout without requiring the player to study instructions.

### Quick call?

Several excuse buttons appear around the screen, such as **Dentist**, **Wi-Fi**, and **Family emergency**. The player must hit the highlighted buttons in sequence before the call connects. A wrong or late input lets the boss tip the bed further.

This tests accuracy rather than raw speed.

### Urgent email

A large email notification obstructs part of the screen. The player must press and hold it to **Mark as unread**. Releasing too early opens the email and strengthens the boss.

A later, harder version could require the player to continue resisting with a second finger or key while holding the notification.

### Team player

Two targets appear, perhaps labelled **Synergy** and **Collaboration**. The player must activate both simultaneously or alternate between them rapidly.

The joke is that one employee is expected to do two people's work.

### Performance review

The controls reverse temporarily. The normal resistance input now assists the boss, forcing the player to use the opposite side or control. A clear horizontal flip, colour change, and warning animation must signal the reversal fairly.

### Return to office mandate

This is the climactic end-of-level attack. During the last ten seconds the bed tips faster, office alarms flash, and the boss launches an all-out productivity offensive. The player must tap or alternate furiously to survive.

### Promotion opportunity

A shiny offer appears: **ACCEPT PROMOTION — +20% PAY!**

Accepting grants a small immediate benefit but permanently increases the boss's strength through **More Responsibility**. Ignoring it is usually the strategically wiser choice. This should be tempting enough that accepting it feels like a meaningful mistake rather than an obvious trap.

## Recommended first playable version

The first prototype should prove the physical comedy and difficulty curve with only three attacks:

1. **Quick Call** — accurate sequential tapping.
2. **Urgent Email** — press and hold.
3. **Return to Office** — the frantic finale.

Team Player, Performance Review, and Promotion Opportunity can enter in later levels after the core loop feels good.

## Web and mobile controls

The game should use one responsive codebase and one set of rules, with controls adapted to the device.

### Mobile

- Tap anywhere on the mattress to resist.
- Alternate thumbs for rapid tapping.
- Press and hold notifications to dismiss them.
- Use two fingers for Team Player.
- Tap highlighted areas for Quick Call.
- Use animation, sound, and optional vibration to make successful inputs satisfying.

Device shaking and physical tilt should not be required. They are unreliable, inaccessible, and awkward for someone genuinely playing in bed. They could become optional novelty modes later.

### Desktop web

- Alternate `A` and `L`, or the left and right arrow keys, as the preferred resistance input.
- Support mouse and trackpad clicking as a fallback.
- Use Space or a held mouse button for Urgent Email.
- Use numbered keys or clicking for Quick Call.
- Hold two keys simultaneously for Team Player.

Alternating keys should feel like an old arcade game. Repeatedly hammering one key may provide less resistance than alternating correctly, encouraging a two-handed rhythm.

### Attack mapping

| Attack | Mobile | Desktop |
| --- | --- | --- |
| Quick Call | Tap highlighted excuses | Click them or use numbered keys |
| Urgent Email | Press and hold | Hold mouse button or Space |
| Team Player | Two-finger input | Hold two keys simultaneously |
| Performance Review | Touch zones reverse | Left and right keys reverse |
| Return to Office | Rapid two-thumb tapping | Rapid alternating keys |
| Promotion Opportunity | Tap or ignore | Click, press Enter, or ignore |

## Progression ideas

Possible levels or campaign beats:

1. Monday Morning
2. Mandatory Stand-up
3. Quarterly Crunch
4. Return to Office
5. Executive Offsite
6. The Shareholder Awakens

The difficulty can increase through stronger constant pressure, more frequent interruptions, combined attacks, deceptive offers, and more demanding finales—not merely by requiring ever-higher tapping speeds.

## Tone and language

The game presents the bedroom as a revolutionary front and corporate demands as military offensives. Useful vocabulary includes:

- Players: **Horizontalists**
- Staying in bed: **Holding the line**
- Levels: **Shifts** or **Days of resistance**
- Losing: **Forced verticalisation**
- Boss attacks: **Productivity offensives**
- Final ten seconds: **The morning offensive**
- Opening campaign: **The Monday Uprising**
- Perfect level: **Full Non-Compliance**
- Player community: **The Horizontal Front**

The writing should be sharp and ridiculous, not doctrinaire. Corporate euphemisms are funnier when management treats them with complete seriousness.

Additional slogans and achievement language:

- Workers of the world, sleep in.
- Work hard. Stay horizontal.
- Your boss wants you vertical.
- Nobody gets up until conditions improve.
- Industrial inaction begins at dawn.
- Hold the line. Keep it horizontal.
- The struggle is real. The mattress is soft.
- Defeat productivity from the comfort of home.

## Visual direction

The preferred style is a colourful editorial cartoon with revolutionary-poster energy:

- The bedroom uses cosy, soft, desirable colours and rounded forms.
- Work intrusions use aggressive gold, red, and corporate blue.
- The bed should look irresistibly comfortable.
- Corporate objects should be sharp, loud, intrusive, and faintly ridiculous.
- Visual motifs could include raised fists gripping pillows, crossed alarm clocks, duvet-red banners, and management propaganda.

The boss should be a wholly fictional caricature of an authoritarian executive. A Trumpesque flavour can come from the tan, sculpted golden hair, small hands, long tie, bluster, vanity, and gaudy taste, without copying a real person's face or identity.

The game's logo and art direction should be original.

### Starting colour system

The first intentional palette establishes a semantic opposition between warmth, solidarity and resistance on one side, and cold work light and gaudy management authority on the other:

- **Duvet cream (`#F3E8D0`)** — the warm foundational surface.
- **Ink charcoal (`#201C19`)** — readable text and structural line work.
- **Resistance red (`#B8322A`)** — collective action, primary emphasis and calls to resist.
- **Work-light blue (`#3E6F8F`)** — corporate intrusion, danger and forced verticalisation.
- **Management gold (`#C8952E`)** — vanity, executive spectacle and the Orange Fella's authority.
- **Paper white (`#FFFDF7`)** — documents, cards and quiet readable surfaces.

These are intentional starting roles rather than a claim that every final shade is settled. Public HTML and Phaser must consume the same shared design tokens for colour and typography so visual meaning does not drift between the site and game. Canvas-specific sizes and wrapping remain in the Phaser adapter because they respond to the fixed game coordinate system rather than the document layout.

## Audio and feedback

Every successful action needs satisfying feedback: mattress movement, duvet snaps, meter recovery, character effort, and escalating music. Corporate attacks could arrive through notification chimes, video-call tones, office alarms, and motivational voice lines.

The default audio direction is original procedural synthesis rather than sampled effects. Duvet pulls, rhythm ticks, notification chirps, warning alarms, victory and failure stings, and fluorescent office hum can be generated mathematically and tuned with the gameplay. This provides especially clear provenance and may remain suitable for production if the resulting sound design is strong enough.

The Orange Fella does not need intelligible recorded dialogue. He can rumble, bluster and punctuate scenes through an original, unintelligible synthesised voice while speech bubbles carry his actual words. This makes him sound like noisy managerial power without cloning or impersonating a real person. It also keeps politically important dialogue readable.

Mobile vibration should be optional. Sound, colour, and motion cues should never be the sole way critical information is communicated.

## Accessibility and comfort

Pure tapping can become physically unpleasant before it becomes funny. The game should preserve the joke without excluding players or encouraging strain.

Potential measures:

- A reduced-input accessibility mode.
- Configurable hold-to-resist controls.
- Input requirements calibrated for the selected device and accessibility mode rather than fixed extreme speeds.
- Short levels and generous pauses.
- Strong non-colour indicators for changing states.
- Reduced motion and vibration settings.
- Full keyboard, pointer, and touch support.
- Avoid gestures that require shaking the device.

Accessibility mode should change the required input pattern, not patronise the player or remove the satire.

## Design principles

1. **The contradiction is the game.** Working hard to avoid work must remain mechanically visible.
2. **Every interruption is a corporate joke.** Mechanics and writing should reinforce each other.
3. **Escalate through variety.** Do not rely only on faster tapping.
4. **Readable before explained.** Attacks should communicate themselves through motion and layout.
5. **Equivalent effort across devices.** Mobile and desktop need not use identical thresholds.
6. **Frantic, not harmful.** Physical comedy should never require pain.
7. **Satirise systems and archetypes.** Keep fictional characters distinct from real individuals.
8. **Episodes are content, not software releases.** New episodes require data, writing, artwork and audio, but no new programming.

## Open questions

The original questions about the duvet, rhythm, difficulty, rewards, recurring boss, promotion, narrative, protagonist and failure now have working answers. See [Expanded design direction](expanded-design-direction.md).

The content architecture and finite episode grammar are documented in [Data-driven episode architecture](data-driven-episode-architecture.md).

Questions that remain genuinely open include:

- What is the smallest episode vocabulary that produces sufficient variety?
- How should the first set of episodes vary in rhythm, dramatic shape and emotion?
- Which appearance choices, if any, should the protagonist eventually offer?
- How much narrative should occur between confrontations without weakening the arcade pace?
- What should the recurring Orange Fella be called?

## Naming note

The working and intended title is **The Horizontal Front**, paired with **Seize the Means of Relaxation**.

The phrase has some unrelated technical uses, including a genetics term, but an initial web search found no obvious existing game or entertainment title collision. This was a preliminary search, not formal trademark clearance.

Repository name: `the-horizontal-front`

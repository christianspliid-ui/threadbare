---
lane: tb-design-lane
run: 2026-11-06a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-06 (run a, ~02:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 14:44 UTC on 6 November.

- [Rival gods you can see but not answer](https://linear.app/threadbare/issue/THR-2172) — your answer to a rival is tending, and the game now says so. A place you tend (your seat, somewhere one of your threaded mortals stands, a place you claim, or a town your anointed faction holds) already shrugs off a rival's hand. Nothing ever told the player. Build ticket: [A rival's move has a place and an answer](https://linear.app/threadbare/issue/THR-2185).
- Same ticket — a rival toast appears only when its hand actually lands, and it names the place: *"The Hollow Warden pressed Death on Iron Glade. Tend it and the next blow breaks."* or *"…pressed on Ashford, but your thread held it."* Clicking it opens the place, where your cards for it are. The old random lines ("curses your followers with plague") are gone from the toast, because none of them ever happened.
- Same ticket — a rival starts **hostile**, not "aggressive". It grows angrier when its schemes run, and more so when you break one: *"Toward you: wrathful. You broke its scheme against Iron Glade."* It cools a little each quiet day, but never below hostile.
- Same ticket — the rival's name stops looking like a link (there is no rival page to open). Opening it shows why it is angry, where it last pressed, and how tending stops it.
- Same ticket — the Chronicle line that read *"actor_rival_1's hand has pressed on Iron Glade"* now names the rival god.
- Not in this slice: a new card for fighting rivals. If warm round 4 still says "I could see them but not act", that card is the next slice.

## Work

- **Claimed** [rival gods you can see but not answer](https://linear.app/threadbare/issue/THR-2172), a warm round 3 finding all three testers hit. The build shelf held four, no design map was open, and the UI-focus candidate ([rank words with no scale](https://linear.app/threadbare/issue/THR-2182)) builds on yesterday's 20:40 UTC lane decision, so it waits until 08:40 UTC. This was the next agreed finding.
- **Measured before deciding** (main @ `1c67e898`). The toast is picked at random **before** the rival's pressure lands, and fires even when nothing lands. Temper starts at 0.5, which already reads "aggressive". Its only stored rise is +0.03 per scheme beat, and it never falls. Rivals are not on the world graph (`getNode("actor_rival_1")` is null), so two Chronicle lines print the raw id or say "No one tends it" after a raid. Tending already absorbs a rival's pressure.
- **Plan doc:** [A rival's move has a place and an answer](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md), via [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2762). The intent judge said Revise twice. The first time, the plan had not named the card the player sees on the opened place, and had not measured the warm-build climb. The second time, the answer line listed three ways to tend while the engine has four. Both were fixed, and the third run said Allow. All three auditors passed with notes, and all notes were fixed.
- **Filed** the build ticket [A rival's move has a place and an answer](https://linear.app/threadbare/issue/THR-2185): Ready for Dev, unassigned, claimable from 14:44 UTC on 6 Nov.
- **Released** the finding to Todo, unassigned, blocked by the build. It closes when the build is done, and warm round 4 checks the fix.

## Escalations

None.

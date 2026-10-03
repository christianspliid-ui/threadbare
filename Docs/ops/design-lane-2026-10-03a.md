---
lane: tb-design-lane
run: 2026-10-03a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-03 (run a, ~00:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule): **a hero whose forebears ruled a fallen empire can now come to want a piece of its old land back.** The new want is called *Raise the Old Banner*. Worldgen already marks about a quarter of the people living on a dead empire's land as its descendants, but nothing used that. The calls made:
  - **Nobody living is blamed.** The empires fell 700 to 1,100 years ago, so this is a want, not a vendetta. It names no enemy and has no heat. Wars in living memory are different, and stay as they are: the kin of a commander who fell in one can already hold a real grudge against the Realm that won. *This is the call to veto if you disagree. The alternative is a grudge against whoever holds the old land now. In 7 of 12 cases I measured, nobody does.*
  - **A new want, not the old "Reclaim the Homeland".** That one is an exile's want: go home. Every descendant I measured already lives on the old land and never leaves, so "go home" would be done the day it began.
  - **To finish it, they must do two things.** First, walk among the ruins their forebears left, which are 0 to 4 hexes from home. Second, take a piece of the old land for themselves, something they did not already own when the want began.
  - **Only heroes who already decide take it up,** and only when they are free to want something new. Nobody gets it at game start, and nobody is pulled out of the background for it. It will be rare: about one to three heroes per world.
  - **On their page it reads:** *"Because of the old blood of the Ash-Crowned."*

  Plan: [Raise the Old Banner](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1658-raise-the-old-banner.md). Say "veto old banner" to reverse it, or say that the land's current holder should count as the enemy, and I will re-plan it as a grudge. Not ready for you to look at until it is built.

## Work

- **Chosen:** the build shelf held 7 jobs that are not deferrals (the floor is 4). No map was open, and nothing was staged for design. This was the oldest agreed deferral whose blocker has shipped: [a world with a past](https://linear.app/threadbare/issue/THR-1631) was done on 28 September. The decisions it builds on are five days old.
- **Measured before deciding** (current main, medium map, seeds 42 / 99 / 7, 150 turns):
  - 127 to 136 descendants per world. Only 3 to 6 of them are heroes who make their own decisions.
  - 11 of 12 of those heroes start with no room for a new want. Rewarding the past at game start would therefore reach about one hero in three worlds, so the want comes when a slot frees instead.
  - None of them leaves the old land.
  - "Reclaim the Homeland" was given out 0 times by any route.
  - 1 to 3 per world stood at one of their forebears' ruins without being steered there.
  - Heroes take 4 to 7 holdings per world.
  - Three of the six descendants on one seed already owned a place on the old land, so only land taken after the want begins counts.
  - Reader and data: [the census reader](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/descent-homeland.ts) and [its output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/descent-homeland-2026-10-03-thr1658.json).
- **Reported, not chased:**
  - "Reclaim the Homeland"'s *followers* step can never be met: it asks for loyal followers, and nothing in the game makes anyone loyal in that way.
  - About 30 ties per world carry a relationship word ("bond") that nothing reads.
  - Both are noted for the retro.
- **Checks:**
  - The independent plan reviewer approved. Its one catch, a debug tool name that does not exist, was fixed.
  - The three side reviews passed: rules (with notes), completeness, and vision (with notes). They are recorded in the plan.
- **Plan PR:** [#2177](https://github.com/christianspliid-ui/threadbare/pull/2177).
- **Handed off:** [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule) is in Ready for Dev with its build notes. It waits out the 24-hour veto window, which closes around 03:00 Sunday your time.

## Escalations

- None.

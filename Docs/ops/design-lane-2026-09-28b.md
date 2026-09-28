---
lane: tb-design-lane
run: 2026-09-28b
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-28 (run b, ~06:50Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632): **the plan is written and ready to build.** It follows your "tunable, and start with something we can test" direction. A new world gets a block of settings. The default:
  - every living culture gets its own congregation of the Temple of the Spheres;
  - every culture's own ground carries at least two shrines or temples;
  - the wild towns stay unheld;
  - town guilds are labelled as guilds.

  Plan: [faith and politics as world settings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md). Six calls were made along the way, each open to veto:
  - **"Congregation", not "chapter".** The game already uses "chapter" for a stretch of an encounter's story, so a culture's branch of the Temple is a congregation.
  - **Each congregation sits in its culture's capital**, and its other halls stand only in that culture's own lands. A congregation never takes a wild town, so the unheld ground stays unheld.
  - **The sphere a congregation venerates shows on its page and colours its new holy places.** It does not change who may join: the Temple's joining rule is about what a mortal does, not which sphere they lean to.
  - **Towns near a culture's lands take that culture as its fringe.** Today half of all mortals have no culture, because only towns inside a culture's own provinces get one. A town within 8 hexes of a culture's lands now carries that culture more weakly, and reads as "Varn fringe". Ruins, lairs and wonders stay without a culture. Who holds a town does not change.
  - **Pilgrim routes are kept, not retired.** Each congregation starts with one pilgrim route to its capital, so pilgrims gather at every culture's capital. Letting mortals found new routes mid-game needs its own design: [a faith undertaking consecrates new pilgrim routes](https://linear.app/threadbare/issue/THR-1660).
  - **Town guilds are labelled "guild"**, and the six world-wide guilds stay as they are.

Say "veto faith and politics" to reverse this.

## Work

- **Claimed** [faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632). Only two jobs were ready to build, so this run wrote a plan. Its main input, [faith and politics at game start](https://linear.app/threadbare/issue/THR-1596), was decided about 36 hours ago, with no veto.
- **Measured on today's `main`** with two test worlds (seeds 42 and 99), with every code fact re-read. Three findings shaped the plan:
  - On seed 42, none of the three shrines and temples stands on any culture's ground. The two-per-culture floor starts from zero.
  - The game's word list already uses "chapter", so the plan says "congregation".
  - 26 parts of the game read a town's culture, and none of them treats it as who holds the town. Giving fringe towns a culture is therefore safe.
- **Gates:** the intent judge allowed the plan and found no false claims among more than 40 code references. Its one gap was that the two new words, congregation and fringe, needed a word-list proposal. That proposal was filed as [Congregation and Fringe](https://linear.app/threadbare/issue/THR-1661) and seated under delegation. The rules, completeness and Vision audits all passed.
- **Merged** via [PR #2113](https://github.com/christianspliid-ui/threadbare/pull/2113). The plan is live on `main`.
- **Handed off** slice 1 (the settings block and the default world, engine only) to Ready for Dev, with its coordination block. It must land one after the other with [one notable in every settlement](https://linear.app/threadbare/issue/THR-1654), because both change who holds towns at game start.
- **Filed** three tickets:
  - [the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659): the faction page and hex panel lines, waiting on slice 1;
  - [a faith undertaking consecrates new pilgrim routes](https://linear.app/threadbare/issue/THR-1660): a deferral for the undertaking lane;
  - [the Congregation and Fringe word-list entry](https://linear.app/threadbare/issue/THR-1661), which lands with slice 1.
- **Next run:** [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636) (trade-lane upkeep and the clue climb) is free to start.

## Escalations

None.

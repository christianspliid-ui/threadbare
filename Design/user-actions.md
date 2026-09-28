# User Action Required

**Last updated:** 2026-09-28 10:55 local (08:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### Turn off Linear's auto-complete for sub-issues, which closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night and erased five pieces of authored work.** First, two parts of the appointment feature at 00:12 local. Then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, and each was checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. Until then, it fires again the next time someone completes a parent with unfinished children. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-28: you see what your hand did**: after a cast, the player now sees who it touched and what changed ([THR-1606](https://linear.app/threadbare/issue/THR-1606)). Merged via [#2116](https://github.com/christianspliid-ui/threadbare/pull/2116), and live on the site.
- **2026-09-28: the meeting comes to you**: after Reach Down, Meet The First now opens at the nearest settlement, so a new player can no longer miss The First (first step of [the opening](https://linear.app/threadbare/issue/THR-1605)). Merged via [#2115](https://github.com/christianspliid-ui/threadbare/pull/2115), and live on the site.
- **2026-09-28: every written encounter gets its turn**: each mortal's shortlist is filled fairly, and a mortal in a town sees what it can start there first ([let written encounters land](https://linear.app/threadbare/issue/THR-1633)). Merged via [#2114](https://github.com/christianspliid-ui/threadbare/pull/2114), and live on the site.
- **2026-09-28: newcomers only join the deciding tier when your attention limit has room**, the second step of [notables and ties](https://linear.app/threadbare/issue/THR-1653). Merged via [#2112](https://github.com/christianspliid-ui/threadbare/pull/2112), and live on the site.
- **2026-09-28: a journey keeps its goal**: a mortal walking to an encounter still arrives after a detour ([THR-1639](https://linear.app/threadbare/issue/THR-1639)). Merged via [#2111](https://github.com/christianspliid-ui/threadbare/pull/2111), and live on the site.
- **2026-09-28: every reach now reads the town**: the rest of the culture and sphere lines for encounter openings are written ([THR-1638](https://linear.app/threadbare/issue/THR-1638)). Merged via [#2110](https://github.com/christianspliid-ui/threadbare/pull/2110), and live on the site.
- **2026-09-28: new worlds start with a past**: founding ages, old wars and the dead, stored behind the scenes for now, the first step of [a world with a past](https://linear.app/threadbare/issue/THR-1631). Merged via [#2109](https://github.com/christianspliid-ui/threadbare/pull/2109), and live on the site.
- **2026-09-28: encounter openings now carry the town's culture**: one plain sentence on how a settlement handles this kind of trouble, or what its ruling sphere does to it ([THR-1635](https://linear.app/threadbare/issue/THR-1635)). Merged via [#2091](https://github.com/christianspliid-ui/threadbare/pull/2091), and live on the site.
- **2026-09-28: named heroes now start tied to each other**: each begins with kin, a friend and a rival among their neighbours, the first step of [notables and ties](https://linear.app/threadbare/issue/THR-1630). Merged via [#2106](https://github.com/christianspliid-ui/threadbare/pull/2106).
- **2026-09-27: the world reads bigger.** Your avatar now sees two hexes, and the camera can zoom out to the whole map ([THR-1649](https://linear.app/threadbare/issue/THR-1649)). Merged via [#2105](https://github.com/christianspliid-ui/threadbare/pull/2105), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

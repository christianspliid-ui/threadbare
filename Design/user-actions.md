# User Action Required

**Last updated:** 2026-09-29 04:58 local (02:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-09-29: the player sees who matters here**: a settlement's notables now show on screen ([THR-1655](https://linear.app/threadbare/issue/THR-1655)). Merged via [#2137](https://github.com/christianspliid-ui/threadbare/pull/2137), and live on the site.
- **2026-09-29: spells that work**: every caster now starts with one spell of their tradition, and a cast spell does what it says (step one of [the power runtime](https://linear.app/threadbare/issue/THR-1571)). Merged via [#2136](https://github.com/christianspliid-ui/threadbare/pull/2136), and live on the site.
- **2026-09-29: the player meets the past**: the world's history now reaches the screen ([THR-1656](https://linear.app/threadbare/issue/THR-1656)). Merged via [#2134](https://github.com/christianspliid-ui/threadbare/pull/2134), and live on the site.
- **2026-09-29: a notable in every settlement**: each settlement now starts with a named notable of its own ([THR-1654](https://linear.app/threadbare/issue/THR-1654)). Merged via [#2133](https://github.com/christianspliid-ui/threadbare/pull/2133), and live on the site.
- **2026-09-29: a promise outlasts the journey**: a mortal heading off to keep a promise no longer turns back at every step ([THR-1669](https://linear.app/threadbare/issue/THR-1669)). Merged via [#2132](https://github.com/christianspliid-ui/threadbare/pull/2132), and live on the site.
- **2026-09-28: walking to an encounter starts it**: a mortal who travels to a remote encounter now begins it on arrival ([THR-1668](https://linear.app/threadbare/issue/THR-1668)). Merged via [#2131](https://github.com/christianspliid-ui/threadbare/pull/2131), and live on the site.
- **2026-09-28: written encounters land**: guild social scenes, anomaly places and place-trait bonuses now reach play (last step of [THR-1641](https://linear.app/threadbare/issue/THR-1641)). Merged via [#2130](https://github.com/christianspliid-ui/threadbare/pull/2130), and live on the site.
- **2026-09-28: the ten most common encounters are finished**: each now has its own lines for succeeding at a cost and for crits, and deals a hand from your god's cards (step one of [THR-1634](https://linear.app/threadbare/issue/THR-1634)). Merged via [#2129](https://github.com/christianspliid-ui/threadbare/pull/2129), and live on the site.
- **2026-09-28: the hover tooltip is readable again**: a region's name no longer draws on top of it ([THR-1665](https://linear.app/threadbare/issue/THR-1665)). Merged via [#2127](https://github.com/christianspliid-ui/threadbare/pull/2127), and live on the site.
- **2026-09-28: spotlight mortals join guilds**: heroes who choose for themselves now join a guild when it suits their strengths ([THR-1640](https://linear.app/threadbare/issue/THR-1640)). Merged via [#2126](https://github.com/christianspliid-ui/threadbare/pull/2126), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

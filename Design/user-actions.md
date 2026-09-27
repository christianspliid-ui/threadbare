# User Action Required

**Last updated:** 2026-09-27 15:56 local (13:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-09-27: found items now take their stories from your actual world**: a relic or trophy draws on the world's own dead heroes, disasters and monsters ([THR-1637](https://linear.app/threadbare/issue/THR-1637)). Merged via [#2095](https://github.com/christianspliid-ui/threadbare/pull/2095), and live on the site.
- **2026-09-27: the seeded item generator is live**: a finished masterwork is now born with an idea, a real power and often a price ([THR-1570](https://linear.app/threadbare/issue/THR-1570)). Merged via [#2088](https://github.com/christianspliid-ui/threadbare/pull/2088), and live on the site.
- **2026-09-27: when two duellists kill each other, the second death now leaves grief behind too** ([THR-1629](https://linear.app/threadbare/issue/THR-1629)). Merged via [#2087](https://github.com/christianspliid-ui/threadbare/pull/2087), and live on the site.
- **2026-09-27: heroes' starting faction membership now carries standing** ([THR-1620](https://linear.app/threadbare/issue/THR-1620)). Merged via [#2089](https://github.com/christianspliid-ui/threadbare/pull/2089), and live on the site.
- **2026-09-27: travellers’ resting spots on the road no longer pile up as nameless places** ([THR-1616](https://linear.app/threadbare/issue/THR-1616)). Merged via [#2086](https://github.com/christianspliid-ui/threadbare/pull/2086), and live on the site.
- **2026-09-27: a fight now leaves a record on the ground, and three systems read it** ([THR-1574](https://linear.app/threadbare/issue/THR-1574)). Merged via [#2085](https://github.com/christianspliid-ui/threadbare/pull/2085), and live on the site.
- **2026-09-27: three seeded story hooks whose follow-ups told the wrong story were retired** ([THR-1565](https://linear.app/threadbare/issue/THR-1565)). Merged via [#2084](https://github.com/christianspliid-ui/threadbare/pull/2084), and live on the site.
- **2026-09-27: every monster family has its own portrait** on the lair card and in the fight header ([THR-1554](https://linear.app/threadbare/issue/THR-1554)). Merged via [#2083](https://github.com/christianspliid-ui/threadbare/pull/2083), and live on the site.
- **2026-09-26: the duel odds check works again on the new dice** ([THR-1628](https://linear.app/threadbare/issue/THR-1628)). Merged via [#2082](https://github.com/christianspliid-ui/threadbare/pull/2082), and live on the site.
- **2026-09-26: a protection against losing a condition now refuses the condition it names** ([THR-1625](https://linear.app/threadbare/issue/THR-1625)). Merged via [#2081](https://github.com/christianspliid-ui/threadbare/pull/2081), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

# User Action Required

**Last updated:** 2026-09-26 19:55 local (17:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-09-26: the Follow button now says it keeps a mortal in close view** ([THR-1573](https://linear.app/threadbare/issue/THR-1573)). Merged via [#2077](https://github.com/christianspliid-ui/threadbare/pull/2077), and live on the site.
- **2026-09-26: you answered faith and politics at game start** ([THR-1596](https://linear.app/threadbare/issue/THR-1596)). Your words: *"This should be tunable for different scenarios. To begin let's go with something that allows us to test and see balance and interaction"*. They are recorded on the ticket. It becomes a world setting you can tune. The design lane picks the first test setup and shows it to you under "Decided for you". This was the last open question on [the living-world map](https://linear.app/threadbare/issue/THR-1589).
- **2026-09-26: a mortal's mastery is permanent, and a graduate's mastery moves the dice** ([THR-1584](https://linear.app/threadbare/issue/THR-1584)). Merged via [#2076](https://github.com/christianspliid-ui/threadbare/pull/2076), and live on the site.
- **2026-09-26: the sheet and the skill line now say the same word for a mortal's reach** ([THR-1583](https://linear.app/threadbare/issue/THR-1583)). Merged via [#2075](https://github.com/christianspliid-ui/threadbare/pull/2075), and live on the site. This finishes the [fix for the dice reading every mortal as a master](https://linear.app/threadbare/issue/THR-1575).
- **2026-09-26: the ground remembers its battles** ([THR-1528](https://linear.app/threadbare/issue/THR-1528)). Merged via [#2074](https://github.com/christianspliid-ui/threadbare/pull/2074), and live on the site.
- **2026-09-26: the new dice are live** ([THR-1581](https://linear.app/threadbare/issue/THR-1581)). The dice re-fit and "mortals take on challenges they can win about half the time" merged together via [#2073](https://github.com/christianspliid-ui/threadbare/pull/2073), and are on the site. Skill now counts when a mortal rolls.
- **2026-09-25: you answered how much history a new world starts with: A, "explain the map"** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)). Your words: *"a is fine"*. The two smaller calls were decided by delegation, and you can veto either. First, the outline is shown from minute one, while the specifics are found by visiting. Second, the past stays mortal, with no rival god in it.
- **2026-09-26: culture and Realm names never show a raw terrain code** ([THR-1622](https://linear.app/threadbare/issue/THR-1622)). Merged via [#2070](https://github.com/christianspliid-ui/threadbare/pull/2070), and live on the site.
- **2026-09-26: a new trade route never ends at the town it starts from** ([THR-1619](https://linear.app/threadbare/issue/THR-1619)). Merged via [#2069](https://github.com/christianspliid-ui/threadbare/pull/2069), and live on the site.
- **2026-09-26: you answered the dice question: "1 in 6 is fine"** ([THR-1581](https://linear.app/threadbare/issue/THR-1581)). Your words: *"follow the newer decisions, we learn and grow and evolve. 1 in 6 is fine."* and *"it doesnt have to be a rule, it is a constant we tweak as we search for a good game."*

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

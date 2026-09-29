# User Action Required

**Last updated:** 2026-09-29 14:56 local (12:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-09-29: The First no longer walks back for the same encounter**: on arrival, a journey now takes the encounter that is here instead of turning round for its twin ([THR-1674](https://linear.app/threadbare/issue/THR-1674)). Merged via [#2148](https://github.com/christianspliid-ui/threadbare/pull/2148), and live on the site.
- **2026-09-29: monsters are born with a power**: each of the eight monster families now starts with one power of its kind, such as a beast's thick hide or a wraith that is half there (step three of [the power runtime](https://linear.app/threadbare/issue/THR-1671)). Merged via [#2147](https://github.com/christianspliid-ui/threadbare/pull/2147), and live on the site.
- **2026-09-29: the next ten most-played encounters are finished**: at-cost and critical lines and a dealt hand (step three of [finish the encounters](https://linear.app/threadbare/issue/THR-1667)). Merged via [#2146](https://github.com/christianspliid-ui/threadbare/pull/2146), and live on the site.
- **2026-09-29: a caster casts in the scene**: a mortal reaches for a spell when a step looks bad, and the step shows it (step two of [the power runtime](https://linear.app/threadbare/issue/THR-1670)). Merged via [#2145](https://github.com/christianspliid-ui/threadbare/pull/2145), and live on the site.
- **2026-09-29: The First's own draws are finished**: at-cost and critical lines and a dealt hand for the ten encounters The First meets most (step two of [finish the encounters](https://linear.app/threadbare/issue/THR-1666)). Merged via [#2144](https://github.com/christianspliid-ui/threadbare/pull/2144), and live on the site.
- **2026-09-29: steps roll as hard as their word says**: the hidden discount on everyday rolls is gone, the first step of content above novice level ([THR-1627](https://linear.app/threadbare/issue/THR-1627)). Merged via [#2143](https://github.com/christianspliid-ui/threadbare/pull/2143), and live on the site.
- **2026-09-29: a lead is a reason to look**: a mortal who hears of a ruin can now go and find it, and then delve it (step two of [THR-1636](https://linear.app/threadbare/issue/THR-1636)). Merged via [#2140](https://github.com/christianspliid-ui/threadbare/pull/2140), and live on the site.
- **2026-09-29: the words "lead" and "delve" are in the glossary** ([THR-1662](https://linear.app/threadbare/issue/THR-1662)). Merged via [#2141](https://github.com/christianspliid-ui/threadbare/pull/2141).
- **2026-09-29: the player sees faith and fringe**: congregations and a culture's fringe towns now show on screen, so faith and politics is live end to end ([THR-1659](https://linear.app/threadbare/issue/THR-1659)). Merged via [#2139](https://github.com/christianspliid-ui/threadbare/pull/2139), and live on the site.
- **2026-09-29: the past feeds ambitions**: the world's history now gives mortals things to want ([THR-1657](https://linear.app/threadbare/issue/THR-1657)). Merged via [#2138](https://github.com/christianspliid-ui/threadbare/pull/2138), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

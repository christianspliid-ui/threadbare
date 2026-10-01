# User Action Required

**Last updated:** 2026-10-01 12:58 local (10:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### Your local copy of the game is stuck on 28 September (216 changes behind)

- **Your local copy of the game has not updated since 28 September.** It is 216 changes behind. The hourly auto-update refuses to run because two files on your machine would be overwritten: a draft copy of the faith-and-politics plan (`Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md`, which has since been merged in a different version) and a local settings edit. Nothing is broken online, and the lanes all work from fresh copies, so this only matters if you run the game locally. Next time you are in a session, say "fix my home tree" and an attended session can set the draft aside and catch it up. No lane will touch it on its own.

*— from [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-01b.md). The merged plan: [faith-and-politics settings](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md).*

### Were you away from Tuesday evening to Wednesday evening? (lane silence, 29–30 September, ended)

No scheduled lane ran for about 25 hours: from Tuesday 29 September ~19:30 to Wednesday 30 September ~20:20, your time. Nothing merged in that window, and every lane has now resumed on its own. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Turn off Linear's auto-complete for sub-issues, which closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night and erased five pieces of authored work.** All five were restored, and each was checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. Until then, it fires again the next time someone completes a parent with unfinished children. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep.** But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-01: the shortlist fix is designed**: an expert in town now gets to consider the expert work there ([THR-1687](https://linear.app/threadbare/issue/THR-1687)). Plan merged via [#2161](https://github.com/christianspliid-ui/threadbare/pull/2161); builds after its veto window.
- **2026-10-01: the master level is switched on** ([THR-1681](https://linear.app/threadbare/issue/THR-1681)). Merged via [#2160](https://github.com/christianspliid-ui/threadbare/pull/2160). The master encounters themselves are not written yet; they are now tracked as [THR-1688](https://linear.app/threadbare/issue/THR-1688) and wait on the shortlist fix.
- **2026-10-01: six more everyday encounters for experts** (batch 3, [THR-1680](https://linear.app/threadbare/issue/THR-1680)). Merged via [#2158](https://github.com/christianspliid-ui/threadbare/pull/2158), and live on the site.
- **2026-10-01: ruins get looked at, and waiting mortals keep their meetings**: the lead climb is re-planned ([THR-1684](https://linear.app/threadbare/issue/THR-1684)). Plan merged via [#2159](https://github.com/christianspliid-ui/threadbare/pull/2159); ready to build as [THR-1686](https://linear.app/threadbare/issue/THR-1686).
- **2026-10-01: a reputation chip names the town, not the person** ([THR-1685](https://linear.app/threadbare/issue/THR-1685)). Merged via [#2156](https://github.com/christianspliid-ui/threadbare/pull/2156), and live on the site.
- **2026-10-01: six more everyday encounters for experts** (batch 2, [THR-1679](https://linear.app/threadbare/issue/THR-1679)). Merged via [#2157](https://github.com/christianspliid-ui/threadbare/pull/2157), and live on the site.
- **2026-09-30: six everyday encounters for experts**: the first expert-level batch of town encounters ([THR-1678](https://linear.app/threadbare/issue/THR-1678)). Merged via [#2155](https://github.com/christianspliid-ui/threadbare/pull/2155), and live on the site.
- **2026-09-30: a mortal who hears of a ruin goes to see it** ([THR-1664](https://linear.app/threadbare/issue/THR-1664)). Merged via [#2151](https://github.com/christianspliid-ui/threadbare/pull/2151) after a 30-hour stall, and live on the site.
- **2026-09-30: the spell generator is designed**: each school of magic gets its own book of spells per world ([THR-1572](https://linear.app/threadbare/issue/THR-1572)). Plan merged via [#2154](https://github.com/christianspliid-ui/threadbare/pull/2154); ready to build.
- **2026-09-29: two expert-level monsters**: monster families now field apex elites ([THR-1682](https://linear.app/threadbare/issue/THR-1682)). Merged via [#2153](https://github.com/christianspliid-ui/threadbare/pull/2153), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

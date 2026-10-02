# User Action Required

**Last updated:** 2026-10-02 16:00 local (14:00 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### Was the app closed from Thursday ~17:00 to Friday ~15:30? (lane silence, 1–2 October, ended)

No lane published anything for about 23 hours: the last brief went out Thursday 1 October 16:55, and the next lane output was the orchestrator at Friday 2 October 15:37, your time. The builder, design and grooming lanes all missed their slots. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. **If you weren't:** say so, and it becomes a fault to chase.

### The builder lane has not run since yesterday

Heartbeat check, verbatim: "tb-opus-pickup has not run since 2026-10-01T14:11:01.861Z — 23+ hourly slots behind, while keep-work-flowing-cc kept firing. The lane is stalled, not idle."

Most likely the same outage as above; its next slot is ~16:10 today. If it runs, this clears itself. If not, a session should look for a hung run holding its slot. Meanwhile 15 jobs sit ready and none is being built.

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

- **2026-10-02: your local copy caught up by itself**; the "fix my home tree" ask is withdrawn ([orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md)).
- **2026-10-02: all four design calls passed their veto windows** with no veto: spell generator, lead survey, shortlist draw, pilgrim way. All are ready to build.
- **2026-10-01: the pilgrim way is designed**: a faith-spreader can make a town a place of pilgrimage ([THR-1660](https://linear.app/threadbare/issue/THR-1660)). Plan merged via [#2163](https://github.com/christianspliid-ui/threadbare/pull/2163); builds after its veto window.
- **2026-10-01: the shortlist fix is designed**: an expert in town now gets to consider the expert work there ([THR-1687](https://linear.app/threadbare/issue/THR-1687)). Plan merged via [#2161](https://github.com/christianspliid-ui/threadbare/pull/2161); builds after its veto window.
- **2026-10-01: the master level is switched on** ([THR-1681](https://linear.app/threadbare/issue/THR-1681)). Merged via [#2160](https://github.com/christianspliid-ui/threadbare/pull/2160). The master encounters themselves are not written yet; they are now tracked as [THR-1688](https://linear.app/threadbare/issue/THR-1688) and wait on the shortlist fix.
- **2026-10-01: six more everyday encounters for experts** (batch 3, [THR-1680](https://linear.app/threadbare/issue/THR-1680)). Merged via [#2158](https://github.com/christianspliid-ui/threadbare/pull/2158), and live on the site.
- **2026-10-01: ruins get looked at, and waiting mortals keep their meetings**: the lead climb is re-planned ([THR-1684](https://linear.app/threadbare/issue/THR-1684)). Plan merged via [#2159](https://github.com/christianspliid-ui/threadbare/pull/2159); ready to build as [THR-1686](https://linear.app/threadbare/issue/THR-1686).
- **2026-10-01: a reputation chip names the town, not the person** ([THR-1685](https://linear.app/threadbare/issue/THR-1685)). Merged via [#2156](https://github.com/christianspliid-ui/threadbare/pull/2156), and live on the site.
- **2026-10-01: six more everyday encounters for experts** (batch 2, [THR-1679](https://linear.app/threadbare/issue/THR-1679)). Merged via [#2157](https://github.com/christianspliid-ui/threadbare/pull/2157), and live on the site.
- **2026-09-30: six everyday encounters for experts**: the first expert-level batch of town encounters ([THR-1678](https://linear.app/threadbare/issue/THR-1678)). Merged via [#2155](https://github.com/christianspliid-ui/threadbare/pull/2155), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

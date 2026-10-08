# User Action Required

**Last updated:** 2026-10-08 06:58 local (04:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-08: the 6–8 October silence is explained, no answer needed.** The power log shows the computer asleep from Tuesday 23:23 to Thursday 06:39 ([workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **2026-10-08: the 29–30 September silence is explained, no answer needed.** The computer crashed or lost power; lanes returned ~3½ h after it restarted (same retro).
- **2026-10-08: "heavy tests failing for 35 hours" was a flaky test, not broken code.** The same commit passed on Wednesday's nightly run; [THR-1776](https://linear.app/threadbare/issue/THR-1776/the-main-red-probe-ignores-a-green-re-run-of-the-same-commit-the) fixes the check.
- **2026-10-06: playtesters can now start a few seasons into a world** ([THR-1744](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a), part 1). Merged via [#2264](https://github.com/christianspliid-ui/threadbare/pull/2264) and live. The first warm round comes next.
- **2026-10-06: sphere scores have a design** ([THR-1768](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no)). Plan merged via [#2261](https://github.com/christianspliid-ui/threadbare/pull/2261); the veto window has closed.
- **2026-10-06: the power model behind your Dominion ruling now lives in the game's own tools** ([THR-1767](https://linear.app/threadbare/issue/THR-1767)). Merged via [#2260](https://github.com/christianspliid-ui/threadbare/pull/2260).
- **2026-10-06: the research behind your Dominion formula is on record** ([THR-1759](https://linear.app/threadbare/issue/THR-1759)). Merged via [#2259](https://github.com/christianspliid-ui/threadbare/pull/2259) (notes only).
- **2026-10-06: why masters skip master-level work is now measured** ([THR-1742](https://linear.app/threadbare/issue/THR-1742/masters-still-dont-attempt-harder-work-than-experts-they-choose-master)). Merged via [#2258](https://github.com/christianspliid-ui/threadbare/pull/2258) and live.
- **2026-10-06: fair fights.** Quests now face the same odds window as everything else ([THR-1740](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the)). Merged via [#2257](https://github.com/christianspliid-ui/threadbare/pull/2257) and live.
- **2026-10-06: a found lead now ends the climb** ([THR-1702](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and)). Merged via [#2255](https://github.com/christianspliid-ui/threadbare/pull/2255) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

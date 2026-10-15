# User Action Required

**Last updated:** 2026-10-15 13:57 local (11:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

It happened again on the night of 12 to 13 Oct: no lane ran from 03:57 until 13:57 on Tuesday 13 Oct.

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-15: every dialog now shares one backdrop and one Escape order** ([THR-1884](https://linear.app/threadbare/issue/THR-1884/overlay-and-panel-primitives-one-backdrop-z-band-and-escape-stack)). Merged via [#2423](https://github.com/christianspliid-ui/threadbare/pull/2423) and live.

- **2026-10-15: your TypeSafe key is set and the lanes can see it** (confirmed by [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-15e.md)). [The first encounter coverage run](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev) is queued.
- **2026-10-15: the new story typeface and type rules are live** ([THR-1879](https://linear.app/threadbare/issue/THR-1879)). Merged via [#2421](https://github.com/christianspliid-ui/threadbare/pull/2421).
- **2026-10-15: the encounter coverage runner is live** ([THR-1723](https://linear.app/threadbare/issue/THR-1723/content-categorization-runs-with-typesafe-first-run-encounter-coverage)). Merged via [#2420](https://github.com/christianspliid-ui/threadbare/pull/2420).
- **2026-10-15: the encounter Stage's first slice is live** ([THR-1877](https://linear.app/threadbare/issue/THR-1877/plan-doc-the-encounter-stage-a-mortals-moment-plays-over-the-dimmed)): every moment now has one home list and one foreground. Merged via [#2419](https://github.com/christianspliid-ui/threadbare/pull/2419) and live.
- **2026-10-15: the game-screen split is finished** ([THR-1881](https://linear.app/threadbare/issue/THR-1881/gameview-split-cut-the-game-screen-into-hosts-for-the-frame-map-stage)). Its last step merged via [#2417](https://github.com/christianspliid-ui/threadbare/pull/2417) and is live; the new map-first screen can now be built on it.
- **2026-10-15: master craftsmen now take on harder work than experts on every test world.** [Batch 3](https://linear.app/threadbare/issue/THR-1840/master-everyday-batch-3-eight-more-master-encounters-one-per-reach) merged via [#2410](https://github.com/christianspliid-ui/threadbare/pull/2410), so [batch 4](https://linear.app/threadbare/issue/THR-1841/master-everyday-batch-4-eight-more-master-encounters-one-per-reach) closed as not needed ([#2412](https://github.com/christianspliid-ui/threadbare/pull/2412)).
- **2026-10-15: a test guard no longer flips on any new content** ([THR-1930](https://linear.app/threadbare/issue/THR-1930/journeykeepsgoals-seed-42-never-quiet-for-long-guard-flips-on-any)). Merged via [#2411](https://github.com/christianspliid-ui/threadbare/pull/2411) and live; master batch 3 can now finish.
- **2026-10-15: a gift now names its card before and after you receive it** ([THR-1855](https://linear.app/threadbare/issue/THR-1855/a-gift-never-says-what-it-gave-it-gives-you-this-one-freely-names-no)). Merged via [#2409](https://github.com/christianspliid-ui/threadbare/pull/2409) and live.
- **2026-10-15: screens now read prepared view data** ([THR-1822](https://linear.app/threadbare/issue/THR-1822/design-a-view-model-seam-screens-read-prepared-view-data-from-the)). Merged via [#2408](https://github.com/christianspliid-ui/threadbare/pull/2408) and live; the game-screen split is unblocked.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

# User Action Required

**Last updated:** 2026-10-15 05:00 local (03:00 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

It happened again on the night of 12 to 13 Oct: no lane ran from 03:57 until 13:57 on Tuesday 13 Oct.

### Set the TypeSafe key, when convenient

Add `TYPESAFE_API_KEY` as a Windows user environment variable on the home computer. The key comes from [the TypeSafe console](https://console.typesafe.ai/). **Do not paste it into chat.** Checked 14 Oct: it is not set. The coverage tool ([THR-1723](https://linear.app/threadbare/issue/THR-1723/content-categorization-runs-with-typesafe-first-run-encounter-coverage)) can be built without it, but [the first coverage run](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev) waits on it. Say "done" when it is set. *— from the [orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-14d.md) and the [design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-14c.md)*

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-15: master craftsmen now take on harder work than experts on every test world.** [Batch 3](https://linear.app/threadbare/issue/THR-1840/master-everyday-batch-3-eight-more-master-encounters-one-per-reach) merged via [#2410](https://github.com/christianspliid-ui/threadbare/pull/2410), so [batch 4](https://linear.app/threadbare/issue/THR-1841/master-everyday-batch-4-eight-more-master-encounters-one-per-reach) closed as not needed ([#2412](https://github.com/christianspliid-ui/threadbare/pull/2412)).
- **2026-10-15: a test guard no longer flips on any new content** ([THR-1930](https://linear.app/threadbare/issue/THR-1930/journeykeepsgoals-seed-42-never-quiet-for-long-guard-flips-on-any)). Merged via [#2411](https://github.com/christianspliid-ui/threadbare/pull/2411) and live; master batch 3 can now finish.
- **2026-10-15: a gift now names its card before and after you receive it** ([THR-1855](https://linear.app/threadbare/issue/THR-1855/a-gift-never-says-what-it-gave-it-gives-you-this-one-freely-names-no)). Merged via [#2409](https://github.com/christianspliid-ui/threadbare/pull/2409) and live.
- **2026-10-15: screens now read prepared view data** ([THR-1822](https://linear.app/threadbare/issue/THR-1822/design-a-view-model-seam-screens-read-prepared-view-data-from-the)). Merged via [#2408](https://github.com/christianspliid-ui/threadbare/pull/2408) and live; the game-screen split is unblocked.
- **2026-10-15: the mortal economy map's questions are all decided** ([THR-1863](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents)): the design lane answered the last one ([THR-1870](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and)) with a veto open, so the "which are yours alone" ask is withdrawn. Carve-up into build plans is next.
- **2026-10-14: master craftsmen get more work worthy of them** ([THR-1757](https://linear.app/threadbare/issue/THR-1757/master-work-reaches-masters-boards-the-caps-shortlist-drops-it-4-times)): eight new master encounters, one per craft. Merged via [#2405](https://github.com/christianspliid-ui/threadbare/pull/2405) and live.
- **2026-10-14: heavy simulation tests are green on main again** ([THR-1927](https://linear.app/threadbare/issue/THR-1927/heavy-tests-red-on-main-for-two-days-two-simulation-tests-time-out-on)). Merged via [#2404](https://github.com/christianspliid-ui/threadbare/pull/2404) and live.
- **2026-10-14: economy reads now land** ([THR-1862](https://linear.app/threadbare/issue/THR-1862/economy-reads-that-never-land-prosperity-is-0-100-but-four-readers)). Merged via [#2397](https://github.com/christianspliid-ui/threadbare/pull/2397) and live.
- **2026-10-14: popups no longer steal the player's clicks** ([THR-1853](https://linear.app/threadbare/issue/THR-1853/recurs-after-fix-popups-steal-the-players-clicks-a-held-gift-enters-2)). Merged via [#2395](https://github.com/christianspliid-ui/threadbare/pull/2395) and live.
- **2026-10-14: the First's journey choices now land and never repeat** ([THR-1854](https://linear.app/threadbare/issue/THR-1854/the-firsts-journey-choices-change-nothing-and-repeat-applybeatchoice)). Merged via [#2396](https://github.com/christianspliid-ui/threadbare/pull/2396) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

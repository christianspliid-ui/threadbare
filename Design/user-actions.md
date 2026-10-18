# User Action Required

**Last updated:** 2026-10-18 14:56 local (12:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

It happened again on the night of 12 to 13 Oct: no lane ran from 03:57 until 13:57 on Tuesday 13 Oct. And again on Thursday 15 Oct: no lane ran from about 14:50 to 20:44 local, with 19 jobs waiting for the builder. And overnight Friday 16 into Saturday 17 Oct: no lane ran from 18:31 until 11:34, with 21 jobs ready.

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-18: the fix for armies bleeding out within a week, with almost none raised again** ([THR-1973](https://linear.app/threadbare/issue/THR-1973/every-army-bleeds-out-within-a-week-and-almost-none-are-raised-again)). Merged via [#2480](https://github.com/christianspliid-ui/threadbare/pull/2480), publishing now.
- **2026-10-18: every link, card and map click now opens the Inspector beside the map, and you can cast from its Act row (the Inspector in the game)** ([THR-1911](https://linear.app/threadbare/issue/THR-1911/inspector-s3-the-inspector-in-the-game-every-link-card-and-map-click)). Merged via [#2479](https://github.com/christianspliid-ui/threadbare/pull/2479) and live.
- **2026-10-18: pressing Play on a chapter choice now moves the story on, once (the main-map wall from cold playtest round 4)** ([THR-1976](https://linear.app/threadbare/issue/THR-1976)). Merged via [#2477](https://github.com/christianspliid-ui/threadbare/pull/2477) and live.
- **2026-10-18: the god rail puts Attention beside essence, your cards in the rail, and folds its rows (screen frame, second slice)** ([THR-1894](https://linear.app/threadbare/issue/THR-1894/screen-frame-slice-2-the-god-rail-attention-beside-essence-your-hand)). Merged via [#2474](https://github.com/christianspliid-ui/threadbare/pull/2474) and live.
- **2026-10-18: the Ledger rail opens the screen frame, with the World-Soul heading the chronicle and unread chapters marked (screen frame, first slice)** ([THR-1893](https://linear.app/threadbare/issue/THR-1893/screen-frame-slice-1-the-ledger-rail-world-soul-heads-the-chronicle)). Merged via [#2473](https://github.com/christianspliid-ui/threadbare/pull/2473) and live.
- **2026-10-18: the map gets a lens list, with a Threads lens that follows your mortals, and a Dominion pressure line (map lenses, first slice)** ([THR-1878](https://linear.app/threadbare/issue/THR-1878/plan-doc-map-lenses-and-map-chrome-dominion-threads-trouble-trade-and)). Merged via [#2472](https://github.com/christianspliid-ui/threadbare/pull/2472) and live.
- **2026-10-18: the Inspector's place, faction, army, artifact and attachment pages now draw their rows from the page-layout table (the Inspector, second sheet set)** ([THR-1910](https://linear.app/threadbare/issue/THR-1910/inspector-s2b-move-the-place-faction-army-artifact-and-attachment)). Merged via [#2471](https://github.com/christianspliid-ui/threadbare/pull/2471) and live.
- **2026-10-18: the Inspector's person page now draws its 34 fields from the page-layout table (the Inspector, person sheet)** ([THR-1909](https://linear.app/threadbare/issue/THR-1909/inspector-s2a-move-the-person-sheets-fields-into-the-page-layout-table)). Merged via [#2470](https://github.com/christianspliid-ui/threadbare/pull/2470) and live.
- **2026-10-18: 41 money encounters now pay or cost their mortal, and poor or greedy mortals lean toward paying work (mortal wealth, second slice)** ([THR-1952](https://linear.app/threadbare/issue/THR-1952/mortal-wealth-s2-the-money-encounters-pay-their-mortal-and-poor-or)). Merged via [#2469](https://github.com/christianspliid-ui/threadbare/pull/2469) and live.
- **2026-10-18: one docked panel, the Inspector, now shows every place and person, with their Connections (the Inspector, first slice)** ([THR-1876](https://linear.app/threadbare/issue/THR-1876/plan-doc-the-inspector-one-docked-panel-for-every-place-person-and)). Merged via [#2468](https://github.com/christianspliid-ui/threadbare/pull/2468) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

# User Action Required

**Last updated:** 2026-10-14 12:57 local (10:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

It happened again on the night of 12 to 13 Oct: no lane ran from 03:57 until 13:57 on Tuesday 13 Oct.

### The mortal economy map: are any of its ten questions yours alone?

[The map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents) was charted this morning from [the economy audit](https://claude.ai/artifact/8VYSa156r31iTpSty2Cm1v). The audit found that money drives towns and armies, but no mortal or faction decision looks at wealth. The map has ten questions, for example what money means to a mortal, what a faction does with its purse, and what you as a god get from all this. **Are any of these yours alone to answer? And does the destination wording fit?** Until you say, the design lane may decide the rest for you, with a veto each time. *— from the [orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-14e.md)*

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

- **2026-10-14: the layout contract now targets 1440p, scaling down to 1080p** ([THR-1819](https://linear.app/threadbare/issue/THR-1819/design-move-the-layout-contract-to-1440p-landscape-scaling-width)). Merged via [#2382](https://github.com/christianspliid-ui/threadbare/pull/2382) and live.
- **2026-10-14: factions are reachable from a world card again** ([THR-1851](https://linear.app/threadbare/issue/THR-1851/factions-are-still-out-of-reach-the-links-on-a-world-card-render-as)), the top fix from warm round 2.
- **2026-10-14: the warm brief ticket is closed and warm round 2 ran** ([THR-1785](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage)). [Round 2 report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2.md).
- **2026-10-14: towns founded during play now belong to a people** ([THR-1839](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick)). Merged via [#2366](https://github.com/christianspliid-ui/threadbare/pull/2366).
- **2026-10-14: hovering a besieged town or a battle now says what it is in words** ([THR-1847](https://linear.app/threadbare/issue/THR-1847/a-siege-ring-and-a-battle-sprite-on-the-map-carry-no-words-hovering)). Merged via [#2365](https://github.com/christianspliid-ui/threadbare/pull/2365) and live.
- **2026-10-14: every town now has a people, so no mortal is left without a culture** ([THR-1793](https://linear.app/threadbare/issue/THR-1793/216-of-509-seed-42-mortals-have-no-culture-edge-so-their-sphere-bag-is)). Merged via [#2364](https://github.com/christianspliid-ui/threadbare/pull/2364) and live.
- **2026-10-14: a siege now draws as a siege on the map, not a field battle** ([THR-1846](https://linear.app/threadbare/issue/THR-1846/every-siege-draws-as-a-field-battle-on-the-map-gameview-passes-battle)). Merged via [#2363](https://github.com/christianspliid-ui/threadbare/pull/2363) and live.
- **2026-10-14: god cards carry their progression as data, and the world offers them** ([THR-1811](https://linear.app/threadbare/issue/THR-1811/god-cards-carry-their-progression-as-data-a-tier-how-a-god-gets-each)). Merged via [#2361](https://github.com/christianspliid-ui/threadbare/pull/2361) and live.
- **2026-10-13: Dominion shows on the map and on every sheet, so you can see your turf** ([THR-1750](https://linear.app/threadbare/issue/THR-1750/dominion-on-the-map-and-on-every-sheet-the-player-can-see-their-turf)). Merged via [#2359](https://github.com/christianspliid-ui/threadbare/pull/2359) and live.
- **2026-10-13: after the bond, the god's screen fills one gift at a time** ([THR-1837](https://linear.app/threadbare/issue/THR-1837/the-gods-screen-fills-one-gift-at-a-time-after-the-bond-only-the)). Merged via [#2355](https://github.com/christianspliid-ui/threadbare/pull/2355) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

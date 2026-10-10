# User Action Required

**Last updated:** 2026-10-10 13:30 local (11:30 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-09: Star's third skill word is now "Charted", so no skill word reads as an odds word** (THR-1790). Merged via [#2295](https://github.com/christianspliid-ui/threadbare/pull/2295) and live.
- **2026-10-09: an ending shows one reputation row per mortal, named** ([THR-1789](https://linear.app/threadbare/issue/THR-1789/an-ending-shows-one-reputation-row-per-mortal-named-fold-the-per-step)). Merged via [#2294](https://github.com/christianspliid-ui/threadbare/pull/2294) and live.
- **2026-10-09: the warm start arrives with the opening already played** ([THR-1787](https://linear.app/threadbare/issue/THR-1787/the-warm-start-should-arrive-with-the-opening-already-played-settle)). Merged via [#2292](https://github.com/christianspliid-ui/threadbare/pull/2292) and live.
- **2026-10-09: The First's story moments name their stage in words, not "Beat 1 — Call"** (THR-1788). Merged via [#2293](https://github.com/christianspliid-ui/threadbare/pull/2293) and live.
- **2026-10-09: a bonded First is no longer asked to "Reach Down" again** ([THR-1786](https://linear.app/threadbare/issue/THR-1786/a-bonded-first-is-asked-to-reach-down-again-beat-0-should-settle-as)). Merged via [#2290](https://github.com/christianspliid-ui/threadbare/pull/2290) and live.
- **2026-10-09: your turf can be lost to neglect, rival gods and doom, but never your seat** ([THR-1763](https://linear.app/threadbare/issue/THR-1763/the-opposing-dominion-as-a-force-who-pushes-back-how-fast-turf-erodes)). Decided for you by the design lane; say "veto" in chat to reverse.
- **2026-10-09: God's Will prices now name the sphere they bill** ([THR-1783](https://linear.app/threadbare/issue/THR-1783)). Merged via [#2289](https://github.com/christianspliid-ui/threadbare/pull/2289) and live.
- **2026-10-09: "Who holds power" now opens the person you click** ([THR-1780](https://linear.app/threadbare/issue/THR-1780/who-holds-power-is-a-dead-end-the-notables-badge-counts-active-agendas)). Merged via [#2288](https://github.com/christianspliid-ui/threadbare/pull/2288) and live.
- **2026-10-09: template seams no longer reach the player's text** ([THR-1779](https://linear.app/threadbare/issue/THR-1779/recurs-after-fix-template-seams-reach-the-player-his-only-kin-claims)). Merged via [#2286](https://github.com/christianspliid-ui/threadbare/pull/2286) and live.
- **2026-10-09: you chose B: the world offers powers, you choose and pay** ([THR-1770](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the)). Your words: *"i go with B, and i would like a tier/progression system of actions, aswell as an assessment of which should be generic."* The tiers and generic set are now [THR-1794](https://linear.app/threadbare/issue/THR-1794/god-card-tiers-and-the-generic-set-a-progression-ladder-for-every-god).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

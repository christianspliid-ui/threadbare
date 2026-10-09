# User Action Required

**Last updated:** 2026-10-09 06:45 local (04:45 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### How does your god get new powers: A or B?

The design lane prototyped your "can powers be bought?" question ([THR-1770](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the)) and narrowed it to two options.
- **A: the world gives, by who you are.** Gifts stay free and keep their timing. Each one is drawn to match your god's reaches and spheres.
- **B: the world offers, you choose and pay.** Every few days three omens rise. You take one up with essence you drew through its sphere, or you let them pass. The lane leans B.

[Prototype write-up](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md) · [what B looks like](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html). [How gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on it. Reply "A" or "B".

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

- **2026-10-09: no world starts hostile to your god; hostile ground arrives during the run** ([THR-1760](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five)). Decided for you by the design lane; say "veto" in chat to reverse.
- **2026-10-09: the threading rite's engine half shipped** ([THR-1644](https://linear.app/threadbare/issue/THR-1644/threading-as-character-creation-every-thread-plays-a-ceremony-the)). Merged via [#2274](https://github.com/christianspliid-ui/threadbare/pull/2274); the rite on screen and The First's mark come next.
- **2026-10-08: keeping mortals no longer bankrupts your god** ([THR-1747](https://linear.app/threadbare/issue/THR-1747/divine-economy-shared-prerequisites-thread-upkeep-a-god-can-keep-the)). Merged via [#2269](https://github.com/christianspliid-ui/threadbare/pull/2269) and live.
- **2026-10-08: sphere scores now live on every person, place and faction** ([THR-1768](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no)). Merged via [#2270](https://github.com/christianspliid-ui/threadbare/pull/2270); simulation speed unchanged.
- **2026-10-08: the frozen builder run was released.** The warm playtest job finished ([#2268](https://github.com/christianspliid-ui/threadbare/pull/2268)) and the builder is working through the queue again.
- **2026-10-08: endings will be readable — one named reputation row per mortal, one odds word per step, a findable seat** ([THR-1784](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond)). Decided for you by the design lane; veto window open until Friday 20:25.
- **2026-10-08: a returning player is no longer greeted by the opening again** ([THR-1782](https://linear.app/threadbare/issue/THR-1782/a-returning-player-is-greeted-by-the-opening-again-after-the-warm-up)). Decided for you by the design lane; veto window open until Friday 14:45.
- **2026-10-08: every world will draw its doom at even odds, not always the Breach** ([THR-1774](https://linear.app/threadbare/issue/THR-1774/every-runs-doom-is-breach-six-of-the-seven-authored-doom-archetypes)). Decided for you by the design lane; veto window open until Friday 08:41.
- **2026-10-08: the 6–8 October silence is explained, no answer needed.** The power log shows the computer asleep from Tuesday 23:23 to Thursday 06:39 ([workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **2026-10-08: the 29–30 September silence is explained, no answer needed.** The computer crashed or lost power; lanes returned ~3½ h after it restarted (same retro).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

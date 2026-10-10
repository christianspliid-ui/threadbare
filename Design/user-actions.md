# User Action Required

**Last updated:** 2026-10-10 19:55 local (17:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-10: five small faults from cold playtest round 3 fixed** ([THR-1804](https://linear.app/threadbare/issue/THR-1804/five-small-faults-from-cold-playtest-round-3-setup-cards-take-clicks)). Merged via [#2306](https://github.com/christianspliid-ui/threadbare/pull/2306) and live.
- **2026-10-10: the choice screen states only the paying sphere’s essence, not all twelve summed** ([THR-1803](https://linear.app/threadbare/issue/THR-1803/recurs-after-fix-essence-tells-three-stories-the-authored-choice)). Merged via [#2305](https://github.com/christianspliid-ui/threadbare/pull/2305) and live.
- **2026-10-10: a ruler’s card no longer reads "TRUE_BELIEVER" and shows one thread chip per person** ([THR-1797](https://linear.app/threadbare/issue/THR-1797/a-rulers-card-reads-true-believer-under-the-name-and-repeats-each)). Merged via [#2304](https://github.com/christianspliid-ui/threadbare/pull/2304) and live.
- **2026-10-10: each chapter step shows one odds word, and the line under it says which way your hand moved them** (THR-1791). Merged via [#2303](https://github.com/christianspliid-ui/threadbare/pull/2303) and live.
- **2026-10-10: God’s Will options name the encounter they ask for** ([THR-1802](https://linear.app/threadbare/issue/THR-1802/gods-will-options-never-name-what-they-ask-for-assist-right-here)). Merged via [#2302](https://github.com/christianspliid-ui/threadbare/pull/2302) and live.
- **2026-10-10: a chapter's second step opens with an empty hand** ([THR-1801](https://linear.app/threadbare/issue/THR-1801/a-chapters-second-step-opens-with-the-first-steps-cards-already-picked)). Merged via [#2301](https://github.com/christianspliid-ui/threadbare/pull/2301) and live.
- **2026-10-10: your god grows by spending through its spheres — about five growth steps a run, nothing fades if you stop** ([THR-1765](https://linear.app/threadbare/issue/THR-1765/how-the-gods-own-power-grows-what-raises-the-gods-sphere-score-across)). Decided for you by the design lane; say "veto" in chat to reverse.
- **2026-10-10: a chapter with unpriced choices can be played again** (THR-1800). Merged via [#2299](https://github.com/christianspliid-ui/threadbare/pull/2299) and live.
- **2026-10-10: factions, armies, companies and relics belong to your god through the people and ground they are made of** ([THR-1764](https://linear.app/threadbare/issue/THR-1764/dominion-of-the-secondary-actors-how-a-faction-an-army-a-company-or-an)). Decided for you by the design lane; say "veto" in chat to reverse.
- **2026-10-09: Star's third skill word is now "Charted", so no skill word reads as an odds word** (THR-1790). Merged via [#2295](https://github.com/christianspliid-ui/threadbare/pull/2295) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

# User Action Required

**Last updated:** 2026-09-28 23:58 local (21:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### Turn off Linear's auto-complete for sub-issues, which closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night and erased five pieces of authored work.** First, two parts of the appointment feature at 00:12 local. Then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, and each was checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. Until then, it fires again the next time someone completes a parent with unfinished children. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-28: written encounters land**: guild social scenes, anomaly places and place-trait bonuses now reach play (last step of [THR-1641](https://linear.app/threadbare/issue/THR-1641)). Merged via [#2130](https://github.com/christianspliid-ui/threadbare/pull/2130), and live on the site.
- **2026-09-28: the ten most common encounters are finished**: each now has its own lines for succeeding at a cost and for crits, and deals a hand from your god's cards (step one of [THR-1634](https://linear.app/threadbare/issue/THR-1634)). Merged via [#2129](https://github.com/christianspliid-ui/threadbare/pull/2129), and live on the site.
- **2026-09-28: the hover tooltip is readable again**: a region's name no longer draws on top of it ([THR-1665](https://linear.app/threadbare/issue/THR-1665)). Merged via [#2127](https://github.com/christianspliid-ui/threadbare/pull/2127), and live on the site.
- **2026-09-28: spotlight mortals join guilds**: heroes who choose for themselves now join a guild when it suits their strengths ([THR-1640](https://linear.app/threadbare/issue/THR-1640)). Merged via [#2126](https://github.com/christianspliid-ui/threadbare/pull/2126), and live on the site.
- **2026-09-28: trade lanes stay alive**: a lane now carries while both its towns stand and nothing blocks it, instead of every lane vanishing on day 36 (first step of [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636)). Merged via [#2125](https://github.com/christianspliid-ui/threadbare/pull/2125), and live on the site.
- **2026-09-28: faith and politics as world settings**: every culture gets its own Temple congregation and holy places, nearby wild towns read as its fringe, and town guilds are labelled ([THR-1632](https://linear.app/threadbare/issue/THR-1632)). Merged via [#2124](https://github.com/christianspliid-ui/threadbare/pull/2124), and live on the site; the on-screen step is [THR-1659](https://linear.app/threadbare/issue/THR-1659).
- **2026-09-28: "who am I?" answered on screen**: the avatar's past-life name now reads as "your mortal shape" ([THR-1609](https://linear.app/threadbare/issue/THR-1609)). Merged via [#2123](https://github.com/christianspliid-ui/threadbare/pull/2123), and live on the site.
- **2026-09-28: what you spend and risk, made readable**: a new player can see what an action costs and what it risks before choosing ([THR-1607](https://linear.app/threadbare/issue/THR-1607)). Merged via [#2122](https://github.com/christianspliid-ui/threadbare/pull/2122), and live on the site.
- **2026-09-28: a quiet first screen**: doom, rivals and omens stay hidden until you bond with The First ([THR-1648](https://linear.app/threadbare/issue/THR-1648)). Merged via [#2120](https://github.com/christianspliid-ui/threadbare/pull/2120), and live on the site.
- **2026-09-28: the opening gifts wait for the player**: one gift per thing you do, not a pile of popups before you have acted ([THR-1647](https://linear.app/threadbare/issue/THR-1647)). Merged via [#2119](https://github.com/christianspliid-ui/threadbare/pull/2119), live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.

# User Action Required

**Last updated:** 2026-09-20 20:56 local (2026-09-20 18:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Start the staged designs ([THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)) — *from tb-orchestrator*

No decision owed — the direction on both is already yours. They need a session to write the plan, and no lane may start itself.

- **[THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting at a place by a time. Your direction from 12 September. **Start here:** higher priority, and its blocker (THR-1487) finished on the 12th, so only the plan doc remains.
- **[THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — a held town is a faction position. Your sentence from 10 September.

**The ask: say "design THR-1479" in a chat.** The build queue is empty — 0 building, 0 waiting, nothing filed since 17:27 UTC. All 11 non-wayfinder Todo items have been read and every one declines for needing design first; the other 15 are wayfinder tickets that never enter the queue.

### Finish the sitting — two encounters left, screen now clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live — **including the last blemish.** The raw `{sphere_flavor}` placeholder that was printing in conversation scenes is fixed and live as of 17:27 UTC on 20 September ([THR-1516](https://linear.app/threadbare/issue/THR-1516)). Nothing on these two needs reading past any more.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions — which is exactly the supply the queue is short of. Say **"work the map"** in a chat when done.

### Were the stops deliberate? (lane silence, 13–16, 17 and 18 September)

Every local lane stopped Sunday 13 September 21:00 → Wednesday 16 September 15:55 (~67h), again Thursday 17 September 07:55 → 17:55 (~10h), and again Friday 18 September 02:55 → 18:44 (~16h). None had a pause marker.

**The evidence says the machine was off, not that a lane broke.** The hourly cleanup script — a Windows task with no connection to Claude — stops and restarts at exactly those boundaries; on the 18th every lane fired in one catch-up burst at 18:44; and the Wednesday workflow retro, due 16 September mid-morning, simply never fired. GitHub's own scheduled jobs stayed green throughout, because they don't run here.

**If it was you:** nothing to do. Next time, a pause marker at `~/.claude/threadbare-pause.json` keeps this off your list. **If it wasn't:** say so, and the next session looks into why the machine went quiet. Silence reads as "deliberate."

*(This weekend's stop — Saturday 11:33 → Sunday 12:37 local — is not part of the ask. Weekend quiet is normal by your own ruling, and every lane resumed together.)*

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-20 — the raw `{sphere_flavor}` placeholder no longer prints in conversation scenes** ([THR-1516](https://linear.app/threadbare/issue/THR-1516)). Merged 17:27, live. This was the last blemish on your review sitting.
- **2026-09-20 — finished PRs no longer go red on a stopwatch; the slow test arms got an explicit timeout** ([THR-1517](https://linear.app/threadbare/issue/THR-1517)). Merged 17:18; 47 minutes from filed to fixed.
- **2026-09-19 — the unused "lose a hard fight → Wounded/Terrified" rule is deleted; wounds come from each encounter's written ending** ([THR-1503](https://linear.app/threadbare/issue/THR-1503)). Veto window closed with the merge; live.
- **2026-09-19 — the change classifier reads uncommitted work, and the pickup lane runs it on code changes** ([THR-1513](https://linear.app/threadbare/issue/THR-1513)). Merged 01:10, live.
- **2026-09-19 — a finished work outside a town now has somewhere for its encounter to land** ([THR-1515](https://linear.app/threadbare/issue/THR-1515)). Merged 00:10, live.
- **2026-09-19 — the retro draft picks its period from the newest retro report** ([THR-1512](https://linear.app/threadbare/issue/THR-1512)). Merged 00:08.
- **2026-09-18 — the six unused family tags are deleted** ([THR-1501](https://linear.app/threadbare/issue/THR-1501)). Veto window closed with the merge at 21:18 in silence; any tag restores with one line.
- **2026-09-18 — the undertaking proof script decides seed consumption off state, not off evicted traces** ([THR-1514](https://linear.app/threadbare/issue/THR-1514)). Merged 20:31, live.
- **2026-09-18 — a finished work's follow-up encounter is offered at the town the work touched** ([THR-1511](https://linear.app/threadbare/issue/THR-1511)). Your veto window closed with the merge at 19:33; live.
- **2026-09-17 — the five quarantined Meet The First scenes are redrawn and back in the game** ([THR-876](https://linear.app/threadbare/issue/THR-876)). Merged 18:23, live.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).

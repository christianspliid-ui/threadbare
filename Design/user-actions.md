# User Action Required

**Last updated:** 2026-09-19 07:55 local (2026-09-19 05:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Start the staged designs ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)) — *from tb-orchestrator*

No decision owed — the direction on both is already yours. They need a session to write the plan, and no lane may start itself.

- **[THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — a held town is a faction position. Your sentence from 10 September.
- **[THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting. Your direction from 12 September.

**The ask: say "design THR-1448" in a chat.** The board is fully drained as of 19 September 01:10: nothing ready, nothing in progress. After them, the plan you blessed on 12 September is finished and there is no open bug; the next stretch of building starts here.

### Finish the sitting — two encounters left ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map. Say **"work the map"** in a chat when done. The known blemish (Riders' *failure* ending repeating its opening) is fixed and live — [THR-1505](https://linear.app/threadbare/issue/THR-1505).

### Were the stops deliberate? (lane silence, 13–16, 17 and 18 September)

Every local lane stopped Sunday 13 September 21:00 → Wednesday 16 September 15:55 (~67h), again Thursday 17 September 07:55 → 17:55 (~10h), and again Friday 18 September 02:55 → 18:44 (~16h). None of the stops had a pause marker.

**The evidence says the machine was off, not that a lane broke.** The hourly cleanup script — a Windows task with no connection to Claude — stops and restarts at exactly those boundaries, and on the 18th every lane fired in one catch-up burst at 18:44. GitHub's own scheduled jobs stayed green throughout, because they don't run here.

**If it was you:** nothing to do. Next time, a pause marker at `~/.claude/threadbare-pause.json` keeps this off your list. **If it wasn't:** say so, and the next session looks into why the machine went quiet. Silence reads as "deliberate."

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-19 — the change classifier reads uncommitted work, and the pickup lane runs it on code changes** ([THR-1513](https://linear.app/threadbare/issue/THR-1513)). Merged 01:10, live.
- **2026-09-19 — a finished work outside a town now has somewhere for its encounter to land** ([THR-1515](https://linear.app/threadbare/issue/THR-1515)). Merged 00:10, live.
- **2026-09-19 — the retro draft picks its period from the newest retro report** ([THR-1512](https://linear.app/threadbare/issue/THR-1512)). Merged 00:08.
- **2026-09-18 — the six unused family tags are deleted** ([THR-1501](https://linear.app/threadbare/issue/THR-1501)). Veto window closed with the merge at 21:18 in silence; any tag restores with one line.
- **2026-09-18 — the undertaking proof script decides seed consumption off state, not off evicted traces** ([THR-1514](https://linear.app/threadbare/issue/THR-1514)). Merged 20:31, live.
- **2026-09-18 — a finished work's follow-up encounter is offered at the town the work touched** ([THR-1511](https://linear.app/threadbare/issue/THR-1511)). Your veto window closed with the merge at 19:33; live.
- **2026-09-17 — the five quarantined Meet The First scenes are redrawn and back in the game** ([THR-876](https://linear.app/threadbare/issue/THR-876)). Merged 18:23, live.
- **2026-09-17 — the glossary dashboard keeps a term's status when it carries a note** ([THR-1470](https://linear.app/threadbare/issue/THR-1470)). Merged 04:08, live.
- **2026-09-17 — an unused activity-summary function and its dead data field are gone** ([THR-1502](https://linear.app/threadbare/issue/THR-1502)). Merged 02:19, live.
- **2026-09-17 — every slice encounter path has its bad endings written, and the `?outcome=` review link judges the path on screen** ([THR-1509](https://linear.app/threadbare/issue/THR-1509)). Merged 01:32.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).

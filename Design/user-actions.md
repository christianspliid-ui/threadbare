# User Action Required

**Last updated:** 2026-09-17 18:58 local (16:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map. Say **"work the map"** in a chat when done. The known blemish (Riders' *failure* ending repeating its opening) is fixed and live — [THR-1505](https://linear.app/threadbare/issue/THR-1505).

### Were the stops deliberate? (lane silence, 13–16 September and 17 September daytime)

Every local scheduled lane stopped from Sunday 13 September 21:00 to Wednesday 16 September 15:53 (~67h), and again on Thursday 17 September from about 08:00 to 17:50 (~10h). Neither stop had a pause marker. GitHub's scheduled jobs stayed green, and on the 17th the cleanup script (Windows Task Scheduler, outside Claude) stopped too. So the machine was most likely off or asleep; no lane broke.

**If it was you:** nothing to do. Next time, a pause marker at `~/.claude/threadbare-pause.json` keeps this off your list. **If it wasn't:** say so, and the next session looks into why the machine went quiet. Silence reads as "deliberate."

### Start the staged designs ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)) — *from tb-orchestrator*

No decision owed — the direction on both is already yours. They need a session to write the plan, and no lane may start itself.

- **[THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — a held town is a faction position. Your sentence from 10 September.
- **[THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting. Your direction from 12 September.

**The ask: say "design THR-1448" in a chat.** The build queue is empty — the last item merged at 18:22 on 17 September.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-17 — the five quarantined Meet The First scenes are redrawn and back in the game** ([THR-876](https://linear.app/threadbare/issue/THR-876)). Merged 18:22.
- **2026-09-17 — the glossary dashboard keeps a term's status when it carries a note** ([THR-1470](https://linear.app/threadbare/issue/THR-1470)). Merged 04:08, live.
- **2026-09-17 — an unused activity-summary function and its dead data field are gone** ([THR-1502](https://linear.app/threadbare/issue/THR-1502)). Merged 02:19, live.
- **2026-09-17 — every slice encounter path has its bad endings written, and the `?outcome=` review link judges the path on screen** ([THR-1509](https://linear.app/threadbare/issue/THR-1509)). Merged 01:32.
- **2026-09-17 — network-diagram links** ([THR-1508](https://linear.app/threadbare/issue/THR-1508)). Merged 00:29.
- **2026-09-17 — every codex detail row explains itself on hover** ([THR-1507](https://linear.app/threadbare/issue/THR-1507)). Merged 00:12.
- **2026-09-16 — rumours lead to ruins, and one rumour is enough to post a contract** ([THR-1506](https://linear.app/threadbare/issue/THR-1506)). Merged 22:36, live.
- **2026-09-16 — no encounter ending tells one fact twice** ([THR-1505](https://linear.app/threadbare/issue/THR-1505)). Merged 21:21, live.
- **2026-09-16 — a realm standing chip links the realm it moved** ([THR-1499](https://linear.app/threadbare/issue/THR-1499)). Merged 20:33, live.
- **2026-09-16 — a detail panel's breadcrumb works from the keyboard** ([THR-1504](https://linear.app/threadbare/issue/THR-1504)). Merged 19:19, live.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).

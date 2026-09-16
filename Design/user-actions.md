# User Action Required

**Last updated:** 2026-09-16 15:58 local (13:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map. Say **"work the map"** in a chat when done. Known blemish: Riders' *failure* ending repeats its opening — [THR-1505](https://linear.app/threadbare/issue/THR-1505).

### Was the three-day stop deliberate? (lane silence, 13–16 September)

Every local scheduled lane stopped firing from Sunday 13 September 21:00 to Wednesday 16 September 15:53 (~67h) — Monday and Tuesday included, no pause marker set. GitHub's scheduled jobs stayed green, so it was the local scheduler (app closed, machine off, or usage cap), not a broken lane. It is firing again now.

**If it was you:** nothing to do now — next time, a pause marker at `~/.claude/threadbare-pause.json` keeps this off your list. **If it wasn't:** say so, and the next session looks at why the desktop scheduler went quiet. Silence reads as "deliberate."

### Start the staged designs ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)) — *from tb-orchestrator*

No decision owed — the direction on both is already yours. They need a session to write the plan, and no lane may start itself.

- **[THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — a held town is a faction position. Your sentence from 10 September.
- **[THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting. Your direction from 12 September.

**The ask: say "design THR-1448" in a chat.** The build queue holds ten Low-priority repairs and nothing above them.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-16 — Sunday's engine slowdown was noise** — tick cost back to 59 ms/tick, below the weekly median. Nothing owed.
- **2026-09-13 — the six orphaned tag words came off your list** ([THR-1501](https://linear.app/threadbare/issue/THR-1501)) — standing sunset rule applies. **Veto open.**
- **2026-09-13 — a watched place is now actually watched** ([THR-1483](https://linear.app/threadbare/issue/THR-1483)). Merged 20:43, live.
- **2026-09-13 — a faction no longer lists the same town twice** ([THR-1460](https://linear.app/threadbare/issue/THR-1460)). Merged 18:32, live.
- **2026-09-13 — what a player may leaf through is settled** ([THR-1495](https://linear.app/threadbare/issue/THR-1495)). Merged 17:39, live.
- **2026-09-13 — a region on the map describes itself in words** ([THR-1455](https://linear.app/threadbare/issue/THR-1455)). Merged 16:21, live.
- **2026-09-13 — a consequence can name the place it landed on** ([THR-1462](https://linear.app/threadbare/issue/THR-1462)). Merged 15:32, live.
- **2026-09-13 — the guild notice board says which silence it is** ([THR-1026](https://linear.app/threadbare/issue/THR-1026)). Merged 14:29, live.
- **2026-09-13 — every ending is now read as a whole page** ([THR-1474](https://linear.app/threadbare/issue/THR-1474)). Merged 13:29, live.
- **2026-09-13 — a consequence chip may no longer retell its own ending** ([THR-1473](https://linear.app/threadbare/issue/THR-1473)). Merged 13:14, live.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).

# Briefing
**Generated:** 2026-09-21 21:00 local (19:00 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** That one sentence restarts the pipeline; nothing else on the board will.

[THR-1479 — a mortal keeps or misses a meeting at a place by a time](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) is your direction from 12 September. No decision is owed. Its blocker [THR-1487](https://linear.app/threadbare/issue/THR-1487/content-model-slice-3-the-content-query-and-its-one-resolver-under-the) finished the same day — re-checked live this run — and its connectivity table is already written. **The plan doc is the only missing artifact**, and no lane may start a session to write it.

Ready for Dev and In Dev are **both 0** for a third day, and nothing has merged in 25.5 hours. This is not a supply shortage: 26 Todo and 63 Idea items are waiting, and every one of the 11 non-wayfinder Todo items declines for the same reason — it needs design first. The orchestrator has now reported this for ten consecutive runs, and the grooming lane reached it independently this morning.

## Also waiting (3)

- [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — two encounters left in your review sitting; the last blemish is fixed and live, so the screen is clean. ([Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan))
- **Were the stops deliberate?** Four lane-silence episodes, all now ended. Silence reads as "deliberate" — details in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter inflict? Silence leaves it as-is.

[THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (a held town is a faction position) is the second staged design, behind THR-1479 in the same queue of one — it is part of the lead ask, not a separate one.

## Queue

**Starved — 0 Ready for Dev, 0 In Dev.** No parked issues; the In Dev column is empty, so nothing is stalled under a claim. Upstream: 2 In Design (THR-1479 9 days, THR-1448 10 days — neither has a plan doc), 26 Todo, of which 15 are wayfinder tickets that never enter this queue.

## Health

All green — deploy live on `df1cf66c`, CI and all three scheduled jobs passing, no PRs waiting, all 9 scheduled tasks on time, engine tick cost 75 ms/tick (1% below the 7-day median of 76), worktree reaper ran 20:40.

- **Lane silence — recovered, no pause marker.** Worst gap is Saturday→Sunday (25.1h), declined under your 11 September weekend ruling. The Sunday-evening→Monday-afternoon episode (20.7h) is the one carried as a standing ask above. Every lane has fired on schedule since 17:41 local.

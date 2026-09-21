# Briefing
**Generated:** 2026-09-21 19:57 local (17:57 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** That one sentence restarts the pipeline; nothing else on the board will.

[THR-1479 — a mortal keeps or misses a meeting at a place by a time](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) is your direction from 12 September. No decision is owed — its blocker cleared the same day and its connectivity table is already written. **The plan doc is the only missing artifact**, and no lane may start a session to write it.

Ready for Dev, In Dev and Implementation Planning are **all 0** for a third day, and nothing has merged in 24.5 hours. This is not a supply shortage: 26 Todo and 63 Idea items are waiting. Every one of the 11 non-wayfinder Todo items has been read and declines for the same reason — it needs design first. The orchestrator has now reported this for **nine consecutive runs**, and the grooming lane reached it independently this morning.

## Also waiting (4)

- [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — two encounters left in your review sitting; the last blemish is fixed and live, so the screen is clean. ([Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan))
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — the second staged design, behind THR-1479 in the same queue of one.
- **Were the stops deliberate?** Four lane-silence episodes, all now ended. Silence reads as "deliberate" — details in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter inflict? Silence leaves it as-is.

## Queue

**Starved — 0 Ready for Dev, 0 In Dev, 0 Implementation Planning.** No parked issues (the In Dev column is empty). Upstream: 2 In Design (THR-1479 9 days, THR-1448 10 days — neither has a plan doc), 26 Todo, of which 15 are wayfinder tickets that never enter this queue.

## Health

All green — deploy live on `df1cf66c`, CI and all three scheduled jobs passing, no PRs waiting, no stalled tasks, engine tick cost 61 ms/tick (19% *below* the 7-day median), worktree reaper ran 19:40.

- **Lane silence — recovered, no pause marker.** Worst gap is Saturday→Sunday (25.1h), declined under your 11 September weekend ruling. The Sunday-evening→Monday-afternoon episode (20.7h) is the one carried as a standing ask above. Every lane has fired on schedule since 17:41 local.

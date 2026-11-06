---
lane: tb-orchestrator
run: 2026-11-06c
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-06 (run c, ~22:30Z)

## Needs Christian
Nothing needs you. A small map bug is back in the build queue: a hex card's sphere push could land on the wrong "nearest" town, because the distance was measured on the wrong hex grid. Its fix was already written on 30 Oct but got stuck behind a duplicate pull request that has since been closed: [Hex cards' sphere push picks the nearest place on the wrong hex grid](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid).

## T1 — unblock sweep
Shelf at scan: 1 non-Deferral item in Ready for Dev (THR-2187). THR-1926, promoted in run b, has been picked up and is In Dev. 28 Todo candidates were scanned. Their states are unchanged since run b.

- **promote THR-2091** (Bug, High; was in Idea). The 2026-10-30 checkpoint stopped on write permission for PR #2654, which was armed and DIRTY. #2654 is now CLOSED. On origin/main, `hexPressureTarget.ts` still imports the odd-r `hexDistance` from `./delivery`, so the fix has not landed. Fix branch `thr-2091-oddq` @ `a468c964` is still on origin. No retire verdict. Moved to Ready for Dev and verified by `get_issue` (state Ready for Dev, assignee null). Coordination block posted.
- decline THR-1928: blocked by THR-1926, which is In Dev, not Done.
- decline THR-2179: blocked by THR-2187, which is still Ready for Dev.
- decline THR-2171, THR-2172, THR-2173, THR-2174, THR-2175, THR-1859, THR-1860: warm-round findings. Their builds are filed separately, and they close on round checks.
- decline THR-2164: waits on THR-2106 (still Todo).
- decline THR-2063, THR-2064, THR-2065, THR-2066, THR-1951, THR-1938: process work under the pipeline freeze (THR-1946, through 2026-11-13).
- decline THR-1908, THR-2104, THR-2106, THR-1220: Christian-led picks and sessions.
- decline THR-2181, THR-2074, THR-2025, THR-1972, THR-1943: UL proposals.
- decline THR-1745, THR-2014, THR-791: standing state unchanged.

Product vs process this week: product promotions only (THR-2157, THR-2161, THR-2176, THR-1926, THR-2091). No process ticket was promoted.

## T1.5 — wayfinder sweep
No open wayfinder maps.

## T2 — design authoring
Triggered: the shelf was at 1 non-Deferral item when scanned. The THR-2091 promotion brought it back to 2, the floor, so nothing was staged. In Design: 0 live, 0 excluded.

## T3 — architecture health
Already run today (run a, ~05:30Z). Not repeated.

## Escalations
None.

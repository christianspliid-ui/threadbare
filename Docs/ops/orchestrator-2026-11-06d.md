---
lane: tb-orchestrator
run: 2026-11-06d
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-06 (run d, ~23:30Z)

## Needs Christian
Nothing needs you. The engine half of The Crossroads was built and merged tonight. Its screen half is now queued for building: [The Crossroads on screen](https://linear.app/threadbare/issue/THR-1928/the-crossroads-on-screen-a-threaded-mortals-next-three-roads-as-an). It shows a threaded mortal's next three roads, lets you lean toward one of them, and switches God's Will off, as you ruled on 14 Oct ("yes please replace").

## T1 — unblock sweep
Shelf at scan: 1 non-Deferral item in Ready for Dev (THR-2187). THR-2091, promoted in run c, merged at 23:04Z. 28 Todo candidates were scanned.

- **promote THR-1928** (Crossroads slice B, UI). Blockers: THR-1911 Done 2026-10-18 and THR-1926 Done 2026-11-06T22:43Z, which is the blocker this run cleared. `check:plan-doc-liveness` returned LIVE. Not built on origin/main: there is no Crossroads component and `COMPULSION_PREMONITION_ENABLED` is still `true`. The issue has no comments, so it has no retire verdict. Moved to Ready for Dev and verified by `get_issue` (state Ready for Dev, assignee null). Coordination block posted; it is parallel-safe with THR-2187 because the two tickets edit no common file.
- decline THR-2179: blocked by THR-2187, which is still Ready for Dev (claimable from 23:50Z).
- decline THR-2171, THR-2172, THR-2173, THR-2174, THR-2175, THR-1859, THR-1860: warm-round findings. Their builds are filed separately, and they close on round checks.
- decline THR-2164: waits on THR-2106 (still Todo).
- decline THR-2063, THR-2064, THR-2065, THR-2066, THR-1951, THR-1938: process work under the pipeline freeze (THR-1946, through 2026-11-13).
- decline THR-1908, THR-2104, THR-2106, THR-1220: Christian-led picks and sessions.
- decline THR-2181, THR-2074, THR-2025, THR-1972, THR-1943: UL proposals.
- decline THR-1745, THR-2014, THR-791: standing state unchanged.

Product vs process this week: product promotions only (THR-2157, THR-2161, THR-2176, THR-1926, THR-2091, THR-1928). No process ticket was promoted.

## T1.5 — wayfinder sweep
No open wayfinder maps.

## T2 — design authoring
Triggered: the shelf was at 1 non-Deferral item when scanned. The THR-1928 promotion brought it back to 2, the floor, so nothing was staged. In Design: 0 live, 0 excluded. The next refill is THR-2179, which can be promoted once THR-2187 merges.

## T3 — architecture health
Already run today (run a, ~05:30Z UTC day). The next sweep is due on the first run after 06:00 local. Not repeated.

## Escalations
None.

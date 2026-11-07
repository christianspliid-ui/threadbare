---
lane: tb-orchestrator
run: 2026-11-07e
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-07 (run e, ~15:30Z)

## Needs Christian
Nothing needs you. The event-id bug staged last run is now being built. Another known bug has gone to the design lane to be planned next: [An army taken into its liege's pay keeps marching on its liege's town](https://linear.app/threadbare/issue/THR-2026/an-army-taken-into-its-lieges-pay-keeps-marching-on-its-lieges-town). When a lord starts paying a hired company's wages, the company's army keeps marching toward the lord's own town for up to a day before it turns around. It never attacks, but it walks the wrong way.

## T1 — unblock sweep
Shelf at scan: 2 in Ready for Dev — THR-2145 (bug, non-Deferral) and THR-2188 (Deferral). 27 Todo candidates, the same set as run d. Nothing promoted.

- decline THR-2189: blocked by THR-2188, still Ready for Dev (and needs a design pass first).
- decline THR-2171, THR-2172, THR-2173, THR-2174, THR-2175, THR-1859, THR-1860: warm-round finding trackers, not executor work.
- decline THR-2164: waits on THR-2106 (Todo).
- decline THR-2063, THR-2064, THR-2065, THR-2066, THR-1951, THR-1938: process work under the pipeline freeze (THR-1946, through 2026-11-13).
- decline THR-1908, THR-2104, THR-2106, THR-1220: Christian-led picks and sessions.
- decline THR-2190, THR-2074, THR-2025, THR-1972, THR-1943: UL proposals.
- decline THR-1745, THR-2014, THR-791: standing state unchanged.

Product vs process this week: product promotions only; no process ticket promoted.

## T1.5 — wayfinder sweep
No open wayfinder maps.

## T2 — design authoring
Triggered: 1 non-Deferral item in Ready for Dev, under the floor of 2. In Design was empty (0 live, 0 excluded) — THR-1921, staged in run d, is now In Dev (assigned, updated 15:07Z) — so the bound was free.

- **Staged THR-2026** ("An army taken into its liege's pay keeps marching on its liege's town until the next daily re-aim", M3: Dynamic Economy, Low). Agreed: a bug in a blessed program, measured by `measure:crown-wages` (10 violations on seed 42). Oldest open non-Deferral Backlog bug (2026-10-24); the other candidates were THR-2045 (10-25) and THR-2075 (10-27). Still live on origin/main `8782ecc8`: the only commit naming it is f78ee1eb (THR-2020), which records and defers the gap; `payWages` in `src/engine/crown.ts` still stamps `liegePaidTick` without re-aiming, and `reaimArmies` (gated by `skipsReaim`, `src/engine/warAims.ts`) is still the only re-aim. Design-request comment carries why now, what makes it agreed, a scope note (honour `skipsReaim`; first explain why the tick-168 objective survived; keep to the take-up path), Step-0 loads and the evidence shape (engine-only, CLI measure + fixture). Verified via `get_issue`: In Design, no assignee.

## T3 — architecture health
Already ran today (run b, ~07:30Z). Not re-run.

## Escalations
None.

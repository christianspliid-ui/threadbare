---
lane: tb-orchestrator
run: 2026-11-07d
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-07 (run d, ~12:30Z)

## Needs Christian
Nothing needs you. The bug staged last run (the encounter picture's hidden description being a block of code) is already fixed. Another known bug has gone to the design lane to be planned next: [Event ids collide during play](https://linear.app/threadbare/issue/THR-1921/orchestrator-event-ids-collide-evt-141-10-25-duplicate-react-keys-in). Two different world events can get the same id on the same day, which breaks the event list and makes runs harder to replay exactly.

## T1 — unblock sweep
Shelf at scan: 2 in Ready for Dev — THR-2145 (bug, non-Deferral) and THR-2188 (Deferral). 27 Todo candidates, the same set as run c. Nothing promoted.

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
Triggered: 1 non-Deferral item in Ready for Dev, under the floor of 2. In Design was empty (0 live, 0 excluded) — THR-1733, staged in run c, went Done at ~12:09Z — so the bound was free.

- **Staged THR-1921** ("Orchestrator event ids collide (evt_141_10 ×25) — duplicate React keys", Thematic Pressure & Living World, Low). Agreed: a bug (determinism/inspectability defect visible as duplicate React keys in play). All open Backlog bugs are Low; this is the oldest (2026-10-14). Still live on origin/main `ec90c06e`: no commit references it; `src/engine/orchestrator.ts:369-372` still mints `evt_${currentTickForIds}_${++eventCounter}` from module-scope counters reset per tick. Design-request comment carries why now, what makes it agreed, the likely-cause lead (a second `runTick` pass reaching the same tick), a scope note (derivable id vs. stopping the duplicate pass; do not widen to every phase counter), Step-0 loads and the evidence shape. Verified via `get_issue`: In Design, no assignee.

## T3 — architecture health
Already ran today (run b, ~07:30Z). Not re-run.

## Escalations
None.

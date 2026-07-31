# Orchestrator — 2026-07-31 (run g, ~15:04Z)

## Needs Christian

**Same open item as run f, unchanged:** the vertical-slice wayfinder map (THR-902) still has one question waiting for you — [Slice roster sign-off — pick the 5 encounters](https://linear.app/threadbare/issue/THR-905/slice-roster-sign-off-pick-the-5-encounters). Nothing moved on it in the hour since the last run. Open a chat and say "work the map" when ready.

Nothing else needs you this run.

## T1 — unblock sweep

Two state-filtered scans (Todo: 25 items, Ready for Dev: 46 items before this run's write — shelf depth only, not candidates).

**Promoted:**
- **THR-909** — doc-validating CI gates skip on doc-only PRs. Held back by the promotion ceiling last run (run f); this run's one promotion slot went to it since nothing newer displaced it. No named blocker, self-contained Done-when, three pillars N/A. Coordination block posted (mutex: none known — the file's other recent editor, THR-768, is `Done`).

**Held back by the promotion ceiling (shelf > 15, cap = 1 promotion/run):** none new this run — the next candidate after THR-909 would need re-triage; nothing in the Todo scan reads as equally self-contained.

**Declined — unmet blocker THR-883 (`In Design`, confirmed still not `Done`) — no change since run f:**
- THR-848, THR-855, THR-856, THR-858, THR-859, THR-861, THR-863, THR-864 (WS5 Batch 1 sub-batches)
- THR-875 (Meeting Batch A)

**Declined — wrong destination (needs design finalization, not a mechanical promotion) — unchanged from run f:**
- THR-866 — `encounter.apotheosis.ascension`: needs a `design-session` pass first.
- THR-790, THR-791 — Traits wave 2/3: blocker THR-786 `Done`, but both require a full design pass before Ready for Dev.
- THR-735 — Armed-PR staleness sweep: needs a design call on remedy shape.

**Declined — parked pending Christian, not an issue blocker:**
- THR-870 — Sphere-governance pivot: parked until Christian moves the project out of Idea.
- THR-175 — UI overhaul 08 (Deferral): trigger conditions not met.

**Skipped — containers/trackers, stay Todo by design:** THR-838, THR-778 (WS5 containers), THR-772, THR-789 (program epics).

**Skipped — wayfinder-labeled, never enter Ready for Dev (T1.5's input, not T1's):** THR-902 (map), THR-905 (grilling), THR-906 (task, blocked), THR-907 (prototype, blocked).

Shelf after this run's write: 47 items in Ready for Dev, 18 non-`Deferral`. Well above `ORCH_PROGRAM_WORK_FLOOR` (2) — no T2 trigger.

## T1.5 — wayfinder sweep

One open map: THR-902 (Encounter experience redesign — vertical slice). Frontier recomputed from scratch this run, not assumed from run f's cache:

- THR-903, THR-904 — `Done` (confirmed absent from the Todo scan).
- THR-905 — open, its own blocker (THR-903) `Done` → unblocked, but carries `wayfinder:grilling` (HITL) and is assigned to Christian by design. Surfaced under Needs Christian.
- THR-906 — `blockedBy` THR-905 (not `Done`) and THR-904 (`Done`) → still blocked, dropped from frontier.
- THR-907 — `blockedBy` THR-906 (not `Done`) → still blocked, dropped from frontier.

**Frontier = THR-905 only, same as run f.** Zero AFK tickets available to burn down (`wayfinder:research`/agent-doable `wayfinder:task` candidates: none unblocked). No change in map state since the last run.

## T2 — design authoring

Not triggered. 18 non-`Deferral` items in Ready for Dev after this run's promotion, well above the floor of 2.

## T3 — architecture health

Already ran today (run c, ~06:29 local / 04:29Z). Not repeated per the once-daily cadence.

## Escalations

**PR #1169 (run d's report, `mergeStateStatus: DIRTY` since ~12:52Z) — still open, left untouched per protocol.** Already tracked by [THR-910](https://linear.app/threadbare/issue/THR-910/pr-1169-orchestrator-run-d-report-sits-dirty-salvage-the-stranded), filed by run f and sitting in `Ready for Dev` unclaimed. No new ticket needed — re-filing would duplicate it.

No Discord question needed this run beyond the item already surfaced under Needs Christian.

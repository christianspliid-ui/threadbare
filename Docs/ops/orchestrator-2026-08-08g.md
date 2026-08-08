---
lane: tb-orchestrator
run: 2026-08-08g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-08-08 (run g, ~17:30Z)

## Needs Christian

Nothing new — the demo-readiness update from run e still stands (waiting on four small fixes before the verdict sessions).

## T1 — unblock sweep

Scanned Todo (28 items) and Ready for Dev (32 items pre-sweep, 7 non-`Deferral`).

**Promoted THR-1040** (every `mc.*` mercenary-company template crashes the encounter stage — `buildUnifiedEncounterStageModel` reads `narrativeTemplates.initiation` unguarded) → `Ready for Dev`. Filed by Christian directly into `Todo` ~17:17Z while shipping THR-1038; no named blocker, a self-contained render-crash fix with reproduction steps, a `grep`-re-derivable membership predicate, a recommended direction, and a full Done-when already written. Posted the coordination-block comment `pull-work` requires, flagging a likely `Mutex with: THR-1041` (both touch the encounter-stage adapter/component set) for the executor to verify at claim time. Verified via re-query — state stuck at `Ready for Dev`, no `assignee` key present.

Re-confirmed the standing declines, unchanged since run f:
- **THR-883 still `In Design`** (no state change) — continues to gate the whole WS5/content family: THR-838, 848, 855, 856, 858, 859, 861, 863, 864, 866, 778, 875.
- **THR-790, THR-791** — both explicitly state "Needs its own design finalization before Ready for Dev" / "Needs a full design pass" in their own text.
- **THR-1002, THR-998** — design-ticket / self-declared T2 input, both unchanged.
- **THR-1024** — still blocked on THR-966, unchanged.
- **THR-961, THR-962, THR-870, THR-175** — standing Christian-gated/parked, unchanged.
- **THR-772, THR-778, THR-789** — epic/container issues, no direct Done-when.
- **THR-902, THR-907, THR-974, THR-986** — wayfinder-labeled, T1.5's remit, not T1's.

Ready for Dev held 32 items pre-sweep (>15 threshold) — ceiling capped promotion at 1 regardless; moot, since only one candidate qualified.

## T1.5 — wayfinder sweep

One open map: [Encounter experience redesign — vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map). Recomputed the frontier: unchanged from run f. THR-986 (`wayfinder:task`) still assigned and still blocked — re-checked its native `blockedBy` list directly (13 items: THR-1033–1037, 1003–1005, 923, 973, 978, 979, 1008), none `Done` — not a frontier candidate. THR-974 and THR-907 (`wayfinder:prototype`, HITL-only) remain the only other open children, already surfaced to Christian in run e's report; no new information this run.

## T2 — design authoring

Not triggered. Ready for Dev holds 7 non-`Deferral` program items (THR-1042, THR-1041, THR-1031, THR-951, THR-952, THR-950, THR-867) — above the floor of 2.

## T3 — architecture health

Already run today (run a, ~07:10Z — all four detectors). Not re-run; daily, not per-run. Weekly test-suite health pass not due (today is Saturday, not Monday).

## Escalations

None this run.

---
lane: tb-orchestrator
run: 2026-09-27
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-27 (run a, ~05:30Z)

## Needs Christian

Nothing needs you. The build shelf is empty for now. The next designs are already queued for the design lane, and two finished builds are waiting on a flaky test before they can land (details below; no action needed from you).

## T1 — unblock sweep

- **Shelf at scan:** 0 in `Ready for Dev`. `In Dev`: THR-1629, THR-1570 and THR-1620, each with a PR up. THR-1620's PR #2089 merged at 05:32Z, so the Linear auto-close is pending. The other two are covered in T3.
- **Done since run 09-26i:**
  - THR-1565 (00:32Z)
  - THR-1574 (01:37Z)
  - THR-1616 (02:34Z)
  - map THR-1589 (00:22Z), closed with its carve-up
- **Declined THR-1637** (new, 04:30Z; a Deferral from THR-1570). It has no native blocker. But it extends `buildItemWorldContext` (`src/engine/itemGenerator/worldContext.ts`), which exists only on THR-1570's unmerged branch (PR #2088). `src/engine/itemGenerator/` is not on `main`. Its promise ("lands before or with THR-1626") also ties it to THR-1570. It stays in Todo until THR-1570 is Done.
- **Declined THR-1626** again. It waits on THR-1570, which is In Dev, not Done.
- **Declined THR-1630 to THR-1636** (the living-world carve-up plan-doc tickets, filed 00:22Z). These are design tickets, so they are design-lane input and not executor work.
- **Other declines stand as in [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-26h.md):**
  - THR-1580: gauge-stable gate
  - THR-1627: design ticket
  - THR-1522: census gate
  - design tickets THR-1571/1572/1586/1606–1609/1274/1381/1218: T2 input
  - THR-1220: HITL
  - dormant deferrals THR-175/1393/870
  - THR-789/791: epic, assigned
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. THR-1589 closed at 00:22Z.

## T2 — design authoring

- **Triggered:** 0 non-Deferral items in Ready for Dev, below the floor of 2.
- **Bound held:** In Design has 1 live item. THR-1605 (the new player never meets The First) was staged for the design lane at ~04:30Z by an earlier run today. It is unassigned and 1h old. That run published no report to `ops`; the staging comment on THR-1605 is its record.
- Nothing more staged. The design lane's own queue already holds the seven THR-1589 carve-up plan tickets (THR-1630 to THR-1636). That is ample supply once it runs.

## T3 — architecture health

**Due and run.** This is the first sweep after 06:00 local that has a report on `ops`. Compared against [09-26c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-26c.md).

| Detector | Result | vs. 09-26 |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED | Same seven rows: attachment-activated-effects, attachment-edge-modifiers, branch-decision-writes-archetype-drift, compulsion-card-plants-agent-decision-bias, nudge-card-cost-channels-detection-and-doom, trait-ref-authoring-vocabulary, undertow-card-drifts-mortal-values |
| `sweep:rank-reach` | PASS: 13 apex holders at t900, 0 blocked, 60 gated templates reachable | The verdict is unchanged. Yesterday's 22 `Duplicate node ID: evt_npc_369_*` fail-soft errors **no longer reproduce** (0 this run), and wall time fell back to ~10 min. Resolved, not new |
| `check:process` | exit 0. Wiki, systems inventory, setting coverage, plans index and authoring brief are all up to date. Die-B floors VACUOUS | Unchanged. The Linear-keyed sub-checks need `LINEAR_API_KEY`, which is unset, so they are **not reported clean** |
| `check:canon-staleness` | 35 warnings | Unchanged count. The only change is mtime drift from the systemic wiring guide and wiring checklist edits at 01:24Z |

**New finding: two finished builds are stranded on one intermittent test.**
- PR #2087 (THR-1629) and PR #2088 (THR-1570) both failed `Test · Typecheck · Build` on the same test: `src/testing/__tests__/fightCalibration.test.ts` › "fight calibration against THR-1531", which hit `Hook timed out in 10000ms`.
- In each run, that was the only failure out of ~1,358 test files.
- PR #2089 went green on the same `main` and merged, so this is a timeout flake, not a defect in either diff.
- Both PRs are now also `DIRTY` (conflicting with `main`), so armed auto-merge cannot fire.
- These are the only two red CI runs in the last 40 since 09-24. That is 2 recurrences, below the ≥3/week materiality bar, so this is logged here and not filed as a ticket.
- Recovery belongs to the executor's resume path (merge `origin/main`, re-push, which re-runs CI). Nothing was touched.
- Candidate for the weekly retro: raise the calibration hook's timeout, or move the test to the heavy lane.

**Stalled work: 0.** No issue has 3 or more `Ready for Dev → In Dev` transitions. THR-1629, THR-1570 and THR-1620 each have one.

**In Design: 1 live, 0 excluded** (THR-1605, unassigned, staged 04:30Z).

**Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only, so it was not run. No weekly test-suite pass today (Sunday); the next one is 09-28.

## Escalations

None.

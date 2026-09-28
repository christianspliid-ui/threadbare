---
lane: tb-orchestrator
run: 2026-09-28f
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-28 (run f, ~06:30Z)

## Needs Christian

Nothing needs you. People now only step into the spotlight when there is room for them. That step shipped as groundwork, so it changes nothing you would see in today's worlds. It clears the way for the next piece, now queued: [one notable in every settlement](https://linear.app/threadbare/issue/THR-1654). Each town gets someone with a holding, an old quarrel, a secret or a favour owed, and a local agenda they pursue.

## T1 — unblock sweep

- **Resolved:** THR-1653 (graduation through the attention budget, slice 3) went Done at 2026-09-28T05:41:12Z via [PR #2112](https://github.com/christianspliid-ui/threadbare/pull/2112). The flag `NOTABLE_GRADUATION_BUDGETED` shipped `true`, and the kill criteria were not triggered (127 drawable templates fired against a floor of 121; The First's longest gap was 25 ticks against a ceiling of 30).
- **Promoted THR-1654** (one notable in every settlement, slice 2; Thematic Pressure & Living World):
  - Both native blockers are Done: THR-1630 (2026-09-27T23:57Z) and THR-1653 (2026-09-28T05:41Z).
  - The latest comment was the authoring coordination block, not a retire verdict.
  - `check:plan-doc-liveness` reports `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md` LIVE.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted, suggested model opus. Mutex with THR-1657 (both add t0 worldgen through `seedLivingWorld` and move the t0 decider headcount) and with THR-1633, which is In Dev (its `reach.ts` gate measures against that headcount).
- **Declines unchanged from [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28e.md):**
  - THR-1655 is blocked by THR-1654, which is now Ready for Dev.
  - THR-1640 is blocked by THR-1633, which is In Dev (claimed after run e). THR-1641 is blocked by THR-1640.
  - THR-1646, THR-1647 and THR-1648 wait on THR-1605, which is In Design.
  - THR-1658 and THR-1644 need design first.
  - The carve-up and design tickets (THR-1632, THR-1634, THR-1636, THR-1571, THR-1572) are T2 input.
- **Shelf:** 3 in Ready for Dev (THR-1654, THR-1656, THR-1657), none of them Deferrals. THR-1633 is In Dev.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps.

## T2 — design authoring

**Not triggered:** 3 non-Deferral items are in Ready for Dev, which meets the floor of 2.

## T3 — architecture health

Already ran today in [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28d.md), including the weekly test-suite pass. Not re-run.

## Escalations

None.

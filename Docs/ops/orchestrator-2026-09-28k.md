---
lane: tb-orchestrator
run: 2026-09-28k
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-28 (run k, ~17:30Z)

## Needs Christian

Nothing needs you. A small map bug is now queued: a region's name is drawn on top of the hover tooltip, so it hides the trade-route lines when you hover a settlement near that name. That is [THR-1665](https://linear.app/threadbare/issue/THR-1665/the-maps-region-labels-paint-over-the-hex-hover-tooltip-law-35).

## T1 — unblock sweep

- **Promoted THR-1665** (region labels paint over the hex tooltip, Law 35; Bug; Thematic Pressure & Living World):
  - It names no blockers and has no native `blockedBy` relations.
  - Its only comment was the filer's coordination block, so no retire verdict stands against it.
  - All three named surfaces exist on `origin/main`.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: sonnet, no mutex on the current shelf. Any ticket that edits `HexTooltip.tsx` becomes a mutex.
- **Declined THR-1641:** its blocker THR-1640 moved Ready for Dev → In Dev at 17:12Z and is not Done.
- **Declines unchanged from [run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28j.md):**
  - THR-1664 is blocked by THR-1663 (Ready for Dev).
  - THR-1655 is blocked by THR-1654 (Ready for Dev).
  - THR-1658, THR-1660 and THR-1644 need design first.
  - THR-1634, THR-1571 and THR-1572 are T2 input.
- **Shelf:** 7 in Ready for Dev after this promotion, none of them Deferrals. That is under the ceiling of 15.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. No `wayfinder:map` issue is in Todo.

## T2 — design authoring

**Not triggered.** 7 non-Deferral items are in Ready for Dev, which meets the floor of 2.

## T3 — architecture health

Already ran today in [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28d.md), including the weekly test-suite pass. Not re-run.

## Escalations

None.

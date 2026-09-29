---
lane: tb-orchestrator
run: 2026-09-29d
promoted: 2
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-29 (run d, ~08:30Z)

## Needs Christian

Nothing needs you. The harder-content work is now queued, because the ruling that a local step demands exactly what its author wrote has landed ([THR-1627](https://linear.app/threadbare/issue/THR-1627/journeymen-and-experts-have-almost-nothing-to-attempt-measure-the)). Two batches go first:

- [THR-1676](https://linear.app/threadbare/issue/THR-1676/content-above-novice-s2-journeyman-everyday-encounters-batch-1-star-3): six everyday encounters sized for journeymen (Star ×3, Gold ×2, Stone ×1). You will be asked to sample 2 of the 6 when it ships.
- [THR-1682](https://linear.app/threadbare/issue/THR-1682/content-above-novice-two-expert-monster-elite-cards-rated-severe-dread): two monster elites rated severe dread and severe might, so that experts have something worth fighting.

## T1 — unblock sweep

- **Promoted THR-1676** (content above novice S2; Thematic Pressure & Living World; Content):
  - Native blocker THR-1627 went Done 2026-09-29T07:44Z (PR #2143, merge `4f4f0377`).
  - The plan doc `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` is LIVE on main (PR #2142).
  - No retire verdict stands against it.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus. Mutex with THR-1677, because both edit `engagementWindow.invariant.test.ts`. The filer's THR-1627 mutex is void.
- **Promoted THR-1682** (two expert monster elite cards; Content):
  - Same blocker and plan doc. No retire verdict stands against it.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus. Mutex with THR-1671, because both may touch the monster elite data in `lairEscalation.ts` and `monster-families.ts`.
- **Declined THR-1677 through THR-1681** (S3–S7): each has a native `blockedBy` on the previous batch in the chain, starting at THR-1676, which is Ready for Dev.
- **Declined THR-1664** (the visit to the ruin, S3). Its old blocker THR-1663 went Done at 06:06Z, but it is now natively blocked by **THR-1675** (Todo). THR-1675 is the S2 kill-criterion re-plan: the decider share of leads reached 13–14% against a target of 30%.
- **Declined THR-1675:** it is a re-plan decision ticket (lead hand-off, a wider rumour pool, or re-baselining the target), so it needs design. That makes it T2 input, not executor work.
- **Declined THR-1667:** blocked by THR-1666, which is In Dev (PR #2144 open).
- **Declines unchanged from [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md):**
  - THR-1672 waits on THR-1572's plan.
  - THR-1658, THR-1660 and THR-1644 need design first.
  - THR-1572 is T2 input.
- **Shelf:** 5 in Ready for Dev after these promotions, none of them Deferrals. That is under the ceiling of 15.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. No `wayfinder:map` issue is in Todo.

## T2 — design authoring

**Not triggered.** 5 non-Deferral items are in Ready for Dev, which meets the floor of 2. THR-1675 and THR-1572 are the next design inputs when the shelf thins.

## T3 — architecture health

Already ran today in [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md), so it is skipped here.

## Escalations

None.

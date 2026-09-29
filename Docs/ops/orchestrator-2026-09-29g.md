---
lane: tb-orchestrator
run: 2026-09-29g
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-29 (run g, ~15:30Z)

## Needs Christian

Nothing needs you. The second batch of journeyman encounters is now queued: [THR-1677](https://linear.app/threadbare/issue/THR-1677/content-above-novice-s3-journeyman-everyday-encounters-batch-2-stone). It adds six more everyday things for a mid-skill mortal to attempt in town. Batch 1 ([PR #2150](https://github.com/christianspliid-ui/threadbare/pull/2150)) shipped at 15:05Z. After it, only Iron and Shadow still sit under the floor of three encounters per reach. Batch 2 carries the plan's kill check: if journeymen still attempt nothing harder than novices, the next step is to re-plan the board, not to author expert content. You will be asked for the usual 2-of-6 sample when it ships.

## T1 — unblock sweep

- **Promoted THR-1677** (content above novice, S3; Thematic Pressure & Living World; Content):
  - Native blocker THR-1676 went Done 2026-09-29T15:05Z via PR #2150 (`67201e12`).
  - Plan doc `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` is LIVE on `origin/main`.
  - No retire verdict stands against it. The latest comment is THR-1676's hand-off note from 14:54Z.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus.
    - Parallel-safe with THR-1682.
    - Mutex with THR-1678, because both edit `engagementWindow.invariant.test.ts`.
    - Check-at-claim against THR-1664, on the encounter content catalog.
- **Declined THR-1678 through THR-1681:** the chain now starts at THR-1677, which is Ready for Dev.
- **Declines unchanged from [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29f.md):**
  - THR-1675 has no build work. It waits for an attended close.
  - THR-1683 and THR-1572 are T2 input. THR-1572 is held for the power-runtime veto window.
  - THR-1672 waits on THR-1572.
  - THR-1658, THR-1660 and THR-1644 need design first.
- **Shelf:** 2 in Ready for Dev after this promotion (THR-1682, 1677), none of them Deferrals. THR-1664 is In Dev.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. No `wayfinder:map` issue is in Todo.

## T2 — design authoring

**Not triggered.** The shelf holds 2 non-Deferral items after the promotion, which meets the floor of 2. In Design is empty: 0 live, 0 excluded.

## T3 — architecture health

Already ran today in [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md), so it is skipped here.

## Escalations

None.

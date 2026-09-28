---
lane: tb-orchestrator
run: 2026-09-28g
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-28 (run g, ~07:30Z)

## Needs Christian

Nothing needs you. The fair shortlist is now on: every written encounter gets its turn, and a mortal standing in a town sees what it can start there first. More distinct written encounters fired than in any earlier setting. The next step is queued: [spotlight mortals who join guilds](https://linear.app/threadbare/issue/THR-1640). Today a mortal who chooses to join a guild never actually becomes a member. This step finds out why, fixes it, and makes joining a guild that suits you more likely.

## T1 — unblock sweep

- **Resolved:** THR-1633 (the fair shortlist, S1) went Done at 2026-09-28T06:58:28Z via [PR #2114](https://github.com/christianspliid-ui/threadbare/pull/2114). It shipped with rotation on and an own-hex-first pass.
- **Promoted THR-1640** (S3, spotlight mortals who join guilds; Thematic Pressure & Living World):
  - Its only native blocker, THR-1633, is Done.
  - `check:plan-doc-liveness` reports `Docs/plans/2026-09-27-thr-1633-written-encounters-land.md` LIVE.
  - The latest comment was the authoring coordination block, not a retire verdict.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted, suggested model opus. It is mutex with THR-1654 and THR-1657, because both move the decider headcount that this slice's gates measure against. It is also mutex with THR-1632 (it relabels town guilds and touches faction seeding) and with THR-1641. The comment tells the executor to re-baseline, because S1 moved the numbers in the description.
- **Declined, new:** THR-1659 (the faith and fringe lines, S2) is blocked by THR-1632, which is Ready for Dev.
- **Board moves by other lanes since run f:** THR-1606, THR-1607, THR-1608 and THR-1609 (cold-playtest findings) and THR-1632 (faith and politics S1) entered Ready for Dev. THR-1605 went In Design → Ready for Dev → In Dev at 07:12Z, and its S1 PR is [#2115](https://github.com/christianspliid-ui/threadbare/pull/2115).
- **Declines unchanged from [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28f.md):**
  - THR-1646 and THR-1647 are blocked by THR-1605, which is now In Dev. THR-1648 is gated by the same slice.
  - THR-1655 is blocked by THR-1654, which is Ready for Dev.
  - THR-1641 is blocked by THR-1640, which is now Ready for Dev.
  - THR-1658, THR-1660 and THR-1644 need design first.
  - The carve-up and design tickets (THR-1634, THR-1636, THR-1571, THR-1572) are T2 input. THR-1634 was unblocked by THR-1633, but it is a design ticket.
- **Shelf:** 9 in Ready for Dev (THR-1606, THR-1607, THR-1608, THR-1609, THR-1632, THR-1640, THR-1654, THR-1656, THR-1657), none of them Deferrals. That is under the ceiling of 15.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps.

## T2 — design authoring

**Not triggered:** 9 non-Deferral items are in Ready for Dev, which meets the floor of 2.

## T3 — architecture health

Already ran today in [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28d.md), including the weekly test-suite pass. Not re-run.

## Escalations

None.

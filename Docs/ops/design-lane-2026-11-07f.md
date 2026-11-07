---
lane: tb-design-lane
run: 2026-11-07f
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run f, ~17:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [An army taken into its liege's pay keeps marching on its liege's town](https://linear.app/threadbare/issue/THR-2026/an-army-taken-into-its-lieges-pay-keeps-marching-on-its-lieges-town) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2026-the-paid-army-turns-at-once.md)) — **a company that takes its liege's pay turns to fight for that liege before the day's turn ends.** Before, a hired company could keep walking towards its new paymaster's own town for up to a day before it changed course. It never attacked, but the map showed it heading for a friend. After the fix, as soon as its target is on its paymaster's side, it picks a new target. A company in the middle of a siege, or one on a notable's own errand, keeps its course. This is a technical fix, so nothing is held for a veto.

## Work

- **Unit chosen:** the plan doc for [the liege's-army bug](https://linear.app/threadbare/issue/THR-2026/an-army-taken-into-its-lieges-pay-keeps-marching-on-its-lieges-town), which the orchestrator staged at ~15:30Z. The build shelf held 1 ticket, under the floor of 4. No UI-focus unit could be worked. [The UI legibility map](https://linear.app/threadbare/issue/THR-2114) and its four carve-up plans are done. Every warm round-3 UI finding already has a lane decision and waits on its build or on round 4: [THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-2171](https://linear.app/threadbare/issue/THR-2171), [THR-2172](https://linear.app/threadbare/issue/THR-2172), [THR-2173](https://linear.app/threadbare/issue/THR-2173), [THR-2174](https://linear.app/threadbare/issue/THR-2174) and [THR-2175](https://linear.app/threadbare/issue/THR-2175). [THR-2182](https://linear.app/threadbare/issue/THR-2182) and [THR-2179](https://linear.app/threadbare/issue/THR-2179) are Done.
- **Why the old fix missed:** the day's re-aim runs before the wage is paid in the same tick, and the target town came onto the liege's side two ticks after the take-up (the first violation was at tick 170, the take-up at 168). So a check on the pay step could never see it. The plan adds a narrow end-of-tick guard that runs through the same per-army re-aim, so armies in a siege or on an errand are still skipped.
- **Measured:** `measure:crown-wages` on today's main reads "no march on the paymaster: 0 violations" on seeds 42, 99 and 7 (18, 2 and 5 wage days). The world has drifted since the bug was found, so the measure stays as a regression guard and the build's fixtures carry the proof.
- **Gates:** intent judge Allow (one gap, kill criteria, now fixed). NFP, three-pillar and Vision audits: PASS-with-notes, PASS-with-notes, PASS, with every note fixed. Plan PR [#2785](https://github.com/christianspliid-ui/threadbare/pull/2785).
- **Handoff:** the ticket is in Ready for Dev, unassigned, with its coordination block. There is no veto hold.

## Escalations

None.

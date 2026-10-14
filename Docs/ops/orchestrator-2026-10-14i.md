---
lane: tb-orchestrator
run: 2026-10-14i
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-10-14 (run i, ~16:30Z)

## Needs Christian
Nothing needs you. The bug where [armies besiege towns they have no quarrel with](https://linear.app/threadbare/issue/THR-1922/armies-besiege-towns-they-have-no-quarrel-with-the-civic-guard) is now in the builder's queue. Today the Civic Guard lays siege to towns where it keeps its own halls. The fix lets an army march only on real enemies; an army with no enemy stays where it mustered.

## T1 — unblock sweep
- **Promoted THR-1922** (armies besiege towns they have no quarrel with; Bug, M3: Dynamic Economy). It was filed into Todo at 16:28Z. It has no native blockers (related-to THR-1868 Done, THR-1863 only), no prose or time gate, and no comments, so there is no retire verdict. Ready for Dev was confirmed on re-query, with no assignee. A coordination block is posted: sonnet, no mutex (no open ticket names `armySpawning.ts`).
- **Ceiling applied:** Ready for Dev held 24 items before this promotion, over the limit of 15. One promotion was allowed, and it went to THR-1922.
- **Unchanged since run h:** no other Todo candidate was updated after 15:30Z, apart from the THR-1863 map and its grilling child THR-1871. Every decline in run h stands.
- **Product vs process:** this run did product work only. Two process tickets sit on the shelf (THR-1887, THR-1888); this lane promoted neither.

## T1.5 — wayfinder sweep
- **THR-1863 (Mortal economy):** there is no AFK frontier, because every research ticket is Done. THR-1868 is now Done. **Left for the design lane:** THR-1869, THR-1871 and THR-1873 (grilling), and THR-1870 (prototype). The map's reserved list is empty.

## T2 — design authoring
**Not triggered.** Ready for Dev holds 25 items after this promotion, 22 of them non-Deferral, against a floor of 2.

## T3 — architecture health
Already ran today (run d). No detectors ran this run.

## Escalations
None.

---
lane: daily-backlog-grooming
run: 2026-10-25
promoted: 0
filed: 0
resolved: 0
swept: 5
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-10-25

## Needs Christian
- **Day 3, still open: the "cut the paperwork" changes you approved on 10-15 cannot ship unattended.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) and [THR-1949](https://linear.app/threadbare/issue/THR-1949) both change the gate script, the CI config and the Definition of Done. The unattended lane is not allowed to change those files. **Recommendation:** ship both in one attended sitting. Do not widen the unattended lane's permissions.

## Work in flight
- [THR-2036](https://linear.app/threadbare/issue/THR-2036) (the restless road ends at the door): claimed by the pickup lane and updated today. It is healthy and needs no action.
- [THR-1947](https://linear.app/threadbare/issue/THR-1947): unassigned and `Parked`. Nothing has shipped. It waits on the item above.

## Technical gates resolved this run
- None. No In Dev ticket is stale past 24 h, and no ticket waits on an upstream-shipped close.

## Counts by state
In Dev 2 · Ready for Dev 9 · Todo 19 · Implementation Planning 1 · In Design 0 · Idea 69

## Problems found and fixed
- Orphans: none. Every queried issue has a project.
- Projects: every Now project is High. No open project has all its issues Done. Next and Idea projects hold Idea issues only.
- Stale design: [THR-1926](https://linear.app/threadbare/issue/THR-1926) (Implementation Planning, the Crossroads) last moved 10-18, which is day 7. Flagged, not moved. Its UI sibling [THR-1928](https://linear.app/threadbare/issue/THR-1928) is in Todo.
- Ready-for-Dev deferrals: [THR-2009](https://linear.app/threadbare/issue/THR-2009) and [THR-1944](https://linear.app/threadbare/issue/THR-1944) both carry a build spec and a coordination block, so both can be claimed. THR-2009 is held until its veto day.
- Finding: Ready for Dev fell from 22 to 9 in one day, because the lane shipped a lot. This is not a gap yet, but the design lane should restock it.

## Materiality sweep
Swept 5: THR-1949, 1950 and 2012 (Ready for Dev), and THR-1938 and 1951 (Todo). THR-1948 and 1888 left scope because they shipped. Canceled 0, consolidated 0. The reasons from 10-24 still hold: 1949–1951 are cuts you approved, 1938 false-fails every daily sweep, and 2012 is content QA tooling with a plan doc. Each one has its cost/benefit line.
- Doubt: THR-1949 would hit the same permission refusal as THR-1947. It stays, because the label rule forbids moving it.

## Pipeline status
Next pickups in order: the active-project deferral [THR-1944](https://linear.app/threadbare/issue/THR-1944) (oath brokering), then [THR-2009](https://linear.app/threadbare/issue/THR-2009) once its veto day ends, then the product bugs [THR-2028](https://linear.app/threadbare/issue/THR-2028) and [THR-2030](https://linear.app/threadbare/issue/THR-2030), then [THR-2023](https://linear.app/threadbare/issue/THR-2023). The legacy roadmap has not changed since 07-30. Nothing to file.

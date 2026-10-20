---
lane: daily-backlog-grooming
run: 2026-10-20
promoted: 0
filed: 0
resolved: 1
swept: 8
canceled: 0
newFindings: 1
needsChristian: false
---
# Backlog Grooming — 2026-10-20

## Needs Christian
Nothing new needs you. THR-1719 (second executor lane), THR-1220 (slice checkpoint) and THR-1908 (carved icon shapes) stay reserved for you. On THR-1719 the recommendation is the same: hold it until the pipeline freeze ends on 2026-11-13.

## Work in flight
In Dev: empty. THR-1915 (Find skips undiscovered ruins) merged as #2495. Nothing is blocked, and nothing is stale.

## Technical gates resolved this run
- Project "Onboarding & First-Run Experience" changed from Done to Now. It was closed on 10-17, but it holds 7 open cold-playtest issues: six in Ready for Dev (THR-1979, -1984, -1986, -1987, -1988, -1989) and THR-1993 in Todo. Most were filed after the close. A project comment records the reason, and a re-query confirmed the change (status Now, completedAt null).

## Counts by state
In Dev 0 · Ready for Dev 33 · Todo 28 · In Design 0 · Impl Planning 1 · Idea 60

## Problems found and fixed
- Orphans: none in any state query.
- Projects: the Onboarding project was reopened (see above). "Next" and "Idea" projects (Physical Conflict, Encounter Format Migration, Agent Success Redesign, Attention Tier Model, Codex) hold only Idea issues, so there is no contradiction.
- No priority in Ready for Dev, left as filed: THR-1843, -1844, -1923, -1924, -1944. The design lane and the UL lane set the order for these. They are not defects.
- Stale: THR-791 (Traits wave 3) has been in Todo with no update since 08-15. This is the third flag. THR-1926 (Impl Planning) was updated 10-18, so it is inside the 7-day window.
- Deferrals in Ready for Dev: THR-1896, -1880, -1916, -1944 and -1961 all have a Done-when and a coordination block. THR-1896 was promoted today by the orchestrator, and its coordination block is in that comment. No deferral is unclaimable.
- Legacy roadmap: unchanged since 2026-07-30 and already reconciled.
- Order: THR-1947 (High, pipeline cut 2) has been in Ready for Dev since 10-15 and is not on main. Watch it; this is not an inversion.

## Materiality sweep
Swept 8, canceled 0, consolidated 0. The set has not changed since 10-18, and none of the facts have either.
- THR-1947, -1948, -1949, -1950 and -1951 stay: Christian approved the pipeline cuts in chat on 10-15.
- THR-1888 stays: it removes a rule/practice mismatch that held a gate ~17.5 h.
- THR-1938 stays: the checker false-fails every master-everyday brief.
- THR-1719 stays: it is reserved for Christian.

## Pipeline status
The shelf is healthy: 33 in Ready for Dev and the WIP slot is free. Recommended next pickups: THR-1947 (High, pipeline cut), then THR-1986 (High, onboarding words; this project is now active again), then the remaining Onboarding cold-playtest tickets, which close round 4.

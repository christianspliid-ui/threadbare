---
lane: daily-backlog-grooming
run: 2026-10-21
promoted: 0
filed: 0
resolved: 0
swept: 7
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-10-21

## Needs Christian
- **Two process cuts you approved on 10-15 are stuck behind the permission layer.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) (one status line per PR instead of three ledgers) was claimed by the unattended lane, which was refused every edit to the gate, CI and Definition-of-Done files. Nothing changed. [THR-1949](https://linear.app/threadbare/issue/THR-1949) edits the same files and will hit the same wall. [THR-1951](https://linear.app/threadbare/issue/THR-1951) waits on 1947, and until it ships about half the pickup lane's runs end with nothing claimed. **Decision:** run 1947 and then 1949 in one attended session, or let the unattended lane edit those files. **Recommendation:** one attended session. It is the smaller trust change. The survey is already in [the THR-1947 park comment](https://linear.app/threadbare/issue/THR-1947).

## Work in flight
- [THR-1960](https://linear.app/threadbare/issue/THR-1960) map labels hidden ruins: claimed 07:00Z today, healthy.
- [THR-1937](https://linear.app/threadbare/issue/THR-1937) undertakings-in-economy plan doc: updated 05:55Z, healthy.
- [THR-1947](https://linear.app/threadbare/issue/THR-1947) unassigned In Dev (parked 10-20 16:54Z, ~14 h old). Left where it is: it does not hold the WIP slot, and moving it back to Ready for Dev would only send it to the next refusal. See Needs Christian.

## Technical gates resolved this run
- None needed.

## Counts by state
In Dev 3 · Ready for Dev 28 · Todo 24 · Implementation Planning 1 · In Design 0 · Idea 62

## Problems found and fixed
- Orphans: none (every listed issue has a project). Completed projects still open: none.
- All 8 Ready-for-Dev deferrals (1970, 1991, 1992, 1990, 1998, 1999, 1944, 1961) have a Done-when and a coordination block, so all are claimable.
- Flag, not changed: *Social Systems Expansion* and *Action System & Unlocks* are "Now" projects with only Idea issues. Their status overstates activity, so consider moving them to Next.
- Flag: [THR-1890](https://linear.app/threadbare/issue/THR-1890) (Todo, Deferral: "decide whether category shares mean what they say") looks answered by [THR-1997](https://linear.app/threadbare/issue/THR-1997) (Todo, the build). Both were touched together 10-20. Close 1890 when 1997 is claimed.
- Stale design: none. THR-1926 has been in Implementation Planning for 3 days.
- Legacy roadmap: unchanged since 07-30. Its pending items are already tracked (THR-54/55/56, Social Systems tickets), so nothing was filed.

## Materiality sweep
Swept 7 (RfD: 1888, 1948, 1949, 1950 · Todo: 1938, 1951, 1719). Canceled 0, consolidated 0.
1948–1951 are cuts you approved in chat on 10-15, and they remove process rather than add it. 1888 cost a playtest gate ~17.5 h once. 1938 is a false failure that recurs in every daily T3 sweep (10-12, 10-14, 10-15), so it clears the ≥3-per-week bar. 1719 stays reserved for your decision. No doubts.

## Pipeline status
The shelf is healthy (28 Ready for Dev). Recommended next pickup: [THR-1992](https://linear.app/threadbare/issue/THR-1992) (Medium deferral, active project, lands before 1991/1990 per their mutexes). The process lane is gated on the Needs Christian item above.

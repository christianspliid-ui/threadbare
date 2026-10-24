---
lane: daily-backlog-grooming
run: 2026-10-24
promoted: 0
filed: 0
resolved: 1
swept: 7
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-10-24

## Needs Christian
- **Still open from yesterday: the "cut the paperwork" changes you approved on 10-15 cannot ship unattended.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) and [THR-1949](https://linear.app/threadbare/issue/THR-1949) both edit the gate script, CI config and Definition of Done, which the unattended lane is not allowed to edit. **Recommendation:** ship both in one attended sitting. Do not widen the unattended lane's permissions.

## Work in flight
- [THR-1947](https://linear.app/threadbare/issue/THR-1947): unassigned and `Parked`. Nothing shipped. Waiting on the item above.
- The executor slot is otherwise free. There is no other In Dev ticket.

## Technical gates resolved this run
- [THR-2015](https://linear.app/threadbare/issue/THR-2015) (heavy tests red on main): closed as **Done**. [Run 40044155893](https://github.com/christianspliid-ui/threadbare/actions/runs/40044155893) is green on `c5acdb59`, and I confirmed that commit is on `origin/main`. The ticket's Done-when allows closing on a later green commit. The comment records how to reopen it if the run in progress on `73f631c3` goes red. The write was re-queried and stuck.

## Counts by state
In Dev 1 · Ready for Dev 22 · Todo 23 · Implementation Planning 1 · In Design 0 · Idea 65

## Problems found and fixed
- Orphans: none. Every queried issue has a project.
- Projects: no open project has all its issues Done. The Next and Idea projects (Physical Conflict, Encounter Format Migration, Agent Success Redesign, Attention Tier, Codex) hold Idea issues only.
- Stale design: none past 7 days. THR-1926 (Implementation Planning) last moved 10-18, which is day 6.
- Stale Todo (finding): [THR-791](https://linear.app/threadbare/issue/THR-791) (traits wave 3) has not moved since 08-15. [THR-1220](https://linear.app/threadbare/issue/THR-1220) (your slice playtest) has not moved since 10-10. Both are product work, so they stay.
- Ready-for-Dev deferrals: spot-checked THR-1998 and THR-2008 (promoted today by the orchestrator). Both have coordination blocks. No deferral is unclaimable.

## Materiality sweep
Swept 7: THR-1948, 1949, 1950, 1888 (Ready for Dev) and THR-1938, 1951, 2012 (Todo). This is the same set as 10-23 and no new in-scope ticket arrived. Canceled 0, consolidated 0. Yesterday's reasons still hold: 1948–1951 are the cuts you approved, 1888 is a measured 17.5 h stall, 1938 false-fails every daily sweep, and 2012 is content QA tooling with a plan doc.
- Doubt: THR-1949 sits in Ready for Dev and would hit the same permission refusal as THR-1947, which wastes one pickup run. It stays, because the label rule forbids moving it.

## Pipeline status
22 tickets are in Ready for Dev, so there is no supply gap. Next pickups are the active-project deferrals THR-2005, 1970, 1999 and 1961, then THR-2008 (founding patron, promoted today). The legacy roadmap has not changed since 07-30 and was already cross-referenced. Nothing to file.

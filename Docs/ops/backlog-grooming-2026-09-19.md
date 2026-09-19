---
lane: daily-backlog-grooming
run: 2026-09-19
promoted: 1
filed: 0
resolved: 1
swept: 0
canceled: 0
newFindings: 1
needsChristian: false
---
# Backlog Grooming — 2026-09-19

## Needs Christian
Nothing needs you. One call was made today and can be vetoed:
- **[THR-1503](https://linear.app/threadbare/issue/THR-1503/processencounterconditions-gates-on-a-template-category-no-shipped):** the old automatic rule that was supposed to make "lose a hard fight → Wounded/Terrified" happen has never fired. It will be **deleted**, not revived. Wounds from fights come from the encounter's written ending, as every other consequence does. Say so and it goes back for design.

## Work in flight
In Dev: nothing blocked, because nothing is active. Yesterday's two promotions both shipped: THR-1511 and THR-1501 are Done. So are THR-1510, 1513, 1514, 1515 and 1512.

## Technical gates resolved this run
- THR-1503: fork resolved as option 2 (fold into aftermath and delete). Scope, Done-when and coordination block were posted, and the ticket was promoted to Ready for Dev. The write was confirmed by a re-query.
- THR-1479: recorded that its execution blocker, THR-1487, has been Done since 09-12 ([PR #1922](https://github.com/christianspliid-ui/threadbare/pull/1922)). Only its plan doc remains.

## Counts by state
Ready for Dev 1 (after promotion) · In Dev 0 · Implementation Planning 0 · In Design 2 · Todo 26 · Idea 63

## Problems found and fixed
- **Pipeline gap, second day running.** Ready for Dev and In Dev were both empty again. The lane cleared 7 tickets in about 24 hours, and supply is now the constraint, not throughput. This run's one promotion covers roughly one hourly slot. Finding: the product shelf needs design supply, so the next design session should take THR-1479, THR-1448 or THR-1348.
- In Design staleness: THR-1479 and THR-1448 have been untouched for 7 days, since 09-12, with no plan doc on either. Flagged; they need an attended design session.
- Now projects with no active-state work: Social Systems Expansion and Action System & Unlocks (Idea only). Unchanged; flagged.
- Stale Todo map and epic holders (the Physical Conflict and Powers wayfinder children, plus THR-789, 790, 791 and 870) are unchanged. Flagged only.
- No orphans among issues touched in the last 24 hours. No open project is fully Done. ROADMAP has not changed since 07-30, and its coverage stands from the 09-18 check.

## Materiality sweep
Swept 0, canceled 0. Nothing is in scope: no Ready-for-Dev or Todo ticket carries an Infrastructure or Improvement label or belongs to Continuous Improvement. The four 09-18 drift-scan tickets sit in Idea, outside scope.

## Pipeline status
Recommended next pickup: **THR-1503** (Low, a deferral in the Now project Encounter Experience, opus).
Next closest: THR-1479 (High, In Design, blocker cleared, needs a plan doc), then THR-1448 (In Design) and THR-1348 (Todo, ruling recorded 09-10, needs a plan doc).

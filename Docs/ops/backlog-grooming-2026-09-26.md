---
lane: daily-backlog-grooming
run: 2026-09-26
promoted: 0
filed: 0
resolved: 1
swept: 0
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-09-26

## Needs Christian
- **THR-1581 (new dice + "take on what you can win half the time"), built but stopped.** With skill-separating dice, "success at a cost" drops from ~1 in 3 wins to ~1 in 6; July's ruling wants 3–7 in 10. Decide: keep the band (needs a design change to how at-cost is read) or accept ~1 in 6. Recommendation: accept the lower share for now — clean wins/fails are what skill-separating dice mean — and ask the design lane for an at-cost redesign separately. Parked unassigned in In Dev on purpose so the briefing surfaces it.

## Work in flight
- THR-1581 — S3+S4 on branch `thr-1581-dice-refit` (head 1d6c6282), not merged; stopped on the at-cost gate (above). Checkpoint 2026-09-26 01:25Z, healthy park, no action.

## Technical gates resolved this run
- Onboarding & First-Run Experience project: status Now but priority Medium, while holding an Urgent issue (THR-1605) → set project priority High (verified).

## Counts by state
In Dev 1 · Ready for Dev 15 · Todo 26 · In Design 0 · Impl Planning 1 · Idea 65 · orphans 0

## Problems found and fixed
- Project priority/status contradiction fixed (above). No orphan issues; no In Design/Impl Planning items stale >7 days (THR-1575 updated 09-25).
- Flag: THR-1570 (item generator build, big opus job) and THR-1620 (named heroes' faction standing bug) sit in Ready for Dev with **no priority**, so priority-sorted pickup reaches them last. Left as set by their filing lanes.
- Flag: project Powers & Item Generation is Discovery with no priority but has 3 Ready-for-Dev items.
- Deferrals in Ready for Dev (THR-1621/1624/1625/1573/1576/1528) spot-checked: coordination blocks present. None unclaimable.
- Roadmap Future Work cross-checked: every item has a Linear counterpart (THR-54/55/56, 52, 67, 68, 70, 72; Social Systems & M3 projects).

## Materiality sweep
Swept 0 in-scope tickets: no Ready-for-Dev/Todo ticket carries `Infrastructure`/`Improvement` or sits in Continuous Improvement. 0 canceled, 0 consolidated. Process work is confined to Idea.

## Pipeline status
Shelf healthy (15 Ready for Dev). Recommended next pickup: THR-1623 / THR-1622 / THR-1617 / THR-1618 / THR-1619 (Medium bugs, Thematic Pressure); THR-1576 and THR-1617 are mutex with THR-1581's branch — pick THR-1576 last.

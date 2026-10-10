---
lane: daily-backlog-grooming
run: 2026-10-10
promoted: 0
filed: 0
resolved: 0
swept: 5
canceled: 0
newFindings: 2
needsChristian: false
---
# Backlog Grooming — 2026-10-10

## Needs Christian
Nothing new. THR-1719 (second executor lane) and THR-1220 (integrated slice checkpoint) stay reserved for him and are already in the briefing.

## Work in flight
In Dev: nothing blocked. The column is empty. The three PRs parked at the review-gate cap yesterday (THR-1754, 1781, 1749) all merged on 10-09. Since then 1780, 1774, 1778, 1779, 1783 and 1786–1790 also shipped.

## Technical gates resolved this run
None needed.

## Counts by state
In Dev 0 · Ready for Dev 7 · Todo 24 (was 33) · In Design 0 · Impl Planning 0 · Idea 48

## Problems found and fixed
- **New finding:** the executor slot is empty while Ready for Dev holds 7. The next `tb-opus-pickup` fire should take one. That is expected, not a fault. If it is still empty at the next run, look at the pickup lane.
- **New finding:** THR-1798 (culturalGravity's opposition map contradicts SPHERE_OPPOSITES) sits in Ready for Dev with no priority. It is a canon-contradiction bug in the Dominion project (Now/High). I flagged it and left it unset, because priority belongs to its filer or the orchestrator.
- Orphans: none. Every listed issue has a project.
- Projects: no change. Physical Conflict and Social Systems Expansion are "Now" with only Idea issues open. Sphere-Governed Ascendant is an Idea project with THR-870 in Todo, a deliberate park. Encounter Format Migration, Agent Success Redesign, M3 and Attention Tier ("Next") hold only Idea issues, which is consistent. No project is fully Done while still open.
- Deferrals: none in Ready for Dev. The Todo deferrals (THR-1580, 1757, 175) are unchanged and not claimable from Todo, as expected.
- Legacy roadmap: `.planning/ROADMAP.md` has not changed since 07-30, so there are no new gaps.

## Materiality sweep
Swept 5, canceled 0, consolidated 0.
- THR-1795 (review gate judges the wrong push) stays. An armed PR merged a head the gate never reviewed (PR 2178), which counts as a corrupted shipped artifact. There are also 3 impediment rows in one week.
- THR-1796 (guidance still teaches "turn-based") stays. A plan doc (THR-1730) passed its Vision audit on the retired premise, which is a corrupted shipped artifact. Four design-lane runs a day are exposed.
- THR-1776, THR-1785 and THR-1719 stay, for the same reasons as on 10-09.

## Pipeline status
Ready for Dev holds 7: five Medium, one Low and one with no priority. The product items are THR-1797 (the ruler card reads "TRUE_BELIEVER" and repeats its chips; reachable from every Notables row), THR-1792 (the god's seat is named and findable; warm-playtest, all three pillars) and THR-1798.
- Recommended next pickup: **THR-1797**. It is a visible regression on the surface THR-1780 just opened. **THR-1792** follows it, then the process pair 1795/1796.

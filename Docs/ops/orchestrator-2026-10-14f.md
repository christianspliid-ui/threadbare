---
lane: tb-orchestrator
run: 2026-10-14f
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-10-14 (run f, ~12:30Z)

## Needs Christian

Nothing needs you. The bug you filed this morning, [realms losing most of their members by tick 600](https://linear.app/threadbare/issue/THR-1918), is now in the builder's queue. The fix must find why realms expel their own people so often, then either stop it or record why it is meant to happen.

## T1 — unblock sweep

- **Promoted THR-1918** (realm excommunication churn; Bug, M3: Dynamic Economy). It names no blocker and has no blocking relations or comments. It is a bug, so it is agreed work. Ready for Dev was verified on re-query, with no assignee. The coordination block is posted: opus, no mutex, because no shelf item edits `phaseFactionActions.ts`.
- **Ceiling applied:** Ready for Dev held 24 items before this promotion, against a limit of 15. One promotion was allowed, and it went to THR-1918.
- **New since run e, left alone (an attended session is filing them):** an attended session filed 27 build slices of the THR-1823 UI carve-up between 08:57Z and 10:45Z. They cover the screen frame (THR-1893, THR-1894, THR-1896), the Stage (THR-1892, THR-1895, THR-1897), the Inspector (THR-1909 to THR-1916), map lenses and chrome (THR-1898 to THR-1903), type and icons (THR-1904 to THR-1908), and primitives (THR-1884, THR-1885). They chain on their parent plan-doc tickets THR-1875 to THR-1879, which are still in Ready for Dev and not Done, and on each other. That session was still editing at 12:21Z. The ceiling would hold them back anyway.
- **Reserved:** THR-1908 (carved icon picks) is marked "Reserved for Christian" in its own description. No lane acts on it.
- **Unchanged since run e:** THR-1881, THR-1880, THR-1820 (unmet In Design or Todo blockers), THR-1850, THR-1840, THR-1841, THR-1843, THR-1859, THR-1860, THR-1861, THR-1274, THR-1745, THR-1381.
- **Wayfinder, skipped:** THR-1863 (map) and its children, including the new THR-1917 (prototype, assigned to Christian).
- **Product vs process:** this run did product work only. Two process tickets sit on the shelf (THR-1887, THR-1888). Neither was promoted by this lane.

## T1.5 — wayfinder sweep

- **THR-1863 (Mortal economy):** there is no AFK frontier. THR-1872 (research) is still blocked by THR-1866, which is open. THR-1917 (the crown) is assigned to Christian, so it is not frontier work. The prototype and grilling tickets (THR-1866, THR-1868, THR-1869, THR-1870, THR-1871, THR-1873) are **left for the design lane**.
- **THR-1823 (The Map Is the Table):** there are no open research or task tickets. The carve-up is running in an attended session.

## T2 — design authoring

**Not triggered.** Ready for Dev holds 22 non-Deferral items after this promotion, against a floor of 2.

## T3 — architecture health

Already ran today (run d). No detectors ran in this run.

## Escalations

None.

---
lane: tb-orchestrator
run: 2026-11-07b
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-11-07 (run b, ~07:30Z)

## Needs Christian
Nothing needs you. The build shelf ran empty, so a known bug has gone to the design lane to be planned next: [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145/the-sheets-story-list-shows-a-raw-key-celldestroypower-afflicted). The First's Story list shows a row of code text (`cell.destroy.power (afflicted)`) where a player-facing name should be.

## T1 — unblock sweep
Shelf at scan: 1 item in Ready for Dev (THR-2188, a Deferral), so 0 non-Deferral items. THR-2179, promoted in run a, merged at 02:17Z. 27 Todo candidates were scanned. Nothing was promoted.

- decline THR-2189 (away leans): blocked by THR-2188, which is still Ready for Dev. Its own coordination block also says it needs a design pass first, so it goes to the design lane once THR-2188 merges.
- decline THR-2190: UL-proposal (new since run a).
- decline THR-2171, THR-2172, THR-2173, THR-2174, THR-2175, THR-1859, THR-1860: warm-round finding trackers. They close on round checks, and they are not executor work.
- decline THR-2164: waits on THR-2106 (still Todo).
- decline THR-2063, THR-2064, THR-2065, THR-2066, THR-1951, THR-1938: process work under the pipeline freeze (THR-1946, through 2026-11-13).
- decline THR-1908, THR-2104, THR-2106, THR-1220: Christian-led picks and sessions.
- decline THR-2074, THR-2025, THR-1972, THR-1943: UL proposals.
- decline THR-1745, THR-2014, THR-791: standing state unchanged.

Product vs process this week: product promotions only (THR-2157, THR-2161, THR-2176, THR-1926, THR-2091, THR-1928, THR-2179). No process ticket was promoted.

## T1.5 — wayfinder sweep
No open wayfinder maps.

## T2 — design authoring
Triggered: 0 non-Deferral items in Ready for Dev, under the floor of 2. In Design was empty (0 live, 0 excluded), so the bound was free.

- **Staged THR-2145** ("The sheet's Story list shows a raw key — `cell.destroy.power (afflicted)`", Onboarding & First-Run Experience). It is agreed: it is a bug, a UI Law 14 raw key on a player surface. It is still live on origin/main `2b3bebee`: no commit references it, `refFor` in `src/engine/views/connections.ts` still names rows `templateName ?? node.name`, and the prose for the key already exists in `src/data/undertaking-verb-prose.ts`. The design-request comment carries why now, what makes it agreed, a scope note (fix at the event minter rather than the fallback), the Step-0 loads and the evidence shape. Verified with `get_issue`: In Design, no assignee.
- It came from Backlog, because no Todo item was agreed, undesigned and unblocked. THR-2189 is the next design input once THR-2188 merges.

## T3 — architecture health
**Due and run** (first run after 06:00 local). The home tree is 178 commits behind, so the detectors ran in a fresh detached worktree at `origin/main` @ `2b3bebee`. Diffed against 2026-11-06 (run a).

| Detector | Result | vs. 11-06 |
|---|---|---|
| `generate-interface-map:dry` | exit 0, 7 LEAKED rows | Same seven rows |
| `sweep:rank-reach` | PASS. 149 apex holders at tick 900, 0 of 60 rank-gated templates blocked | Same verdict. The first attempt was killed by this run's own 300 s cap. A direct rerun of the built bundle took 441 s and passed. The duplicate-node logs (`evt_born_lc_*`, `evt_ind_*`) are the same families reported on 11-06 |
| `check:process` | exit 1, from `check:authoring-brief`: the same 3 master-everyday floor errors (THR-1938) and the same `Ocean fraction too low: 7.4%`. All other sub-checks pass | Same findings |
| `check:canon-staleness` | exit 0, the usual mtime warnings plus the generated-file / `world-objects*.md` frontmatter gaps | Same set |

**New findings:** none.

- **Stalled work:** none at the threshold. THR-1947 is still a dead claim (unassigned, In Dev since 2026-10-20, one transition).
- **In Design: 1 live, 0 excluded** (THR-2145, staged this run, unassigned, 0d).
- **Hand-created In Dev:** none.
- **Redundancy:** not assessed this sweep.
- **Test-suite health:** not due (weekly, Mondays).
- **Not run:** `__DEBUG.validateTraitRefs()` (browser-only).

## Escalations
None.

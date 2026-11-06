---
lane: tb-orchestrator
run: 2026-11-06
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-11-06 (run a, ~05:30Z)

## Needs Christian
Nothing needs you.

## T1 — unblock sweep
Shelf at scan: 5 in Ready for Dev (THR-2180, THR-2183, THR-2184, THR-2185, THR-2186), all program work, none Deferral. 29 Todo candidates scanned. New since run 2026-11-05c: THR-2181, THR-2182.

- decline THR-2179 (plan which story chapters should give the god a hand): its blocker THR-2178 is now Done (2026-11-06T00:37Z). But the ticket's Done-when is "a plan doc in `Docs/plans/`", so it is design-lane input and not executor work. Not staged, because T2 is not triggered (shelf 5).
- decline THR-2182 (design request: rank words with no scale): new, split from THR-2175 by the design lane. Titled and scoped as a design request, so it is design-lane input.
- decline THR-2181: UL proposal (new).
- decline THR-2174: parent finding. Its build ticket THR-2178 is Done, and the ticket closes when its build tickets do. Not executor work.
- decline THR-2171, THR-2172, THR-2173, THR-2175: warm round 3 parent findings. Their build tickets THR-2180 / THR-2185 / THR-2184 / THR-2183 are on the shelf now. Not executor work.
- decline THR-1859, THR-1860: unchanged, held for warm round checks.
- decline THR-2164: waits on THR-2106 (still Todo).
- decline THR-2063, THR-2064, THR-2065, THR-2066, THR-1951, THR-1938: process work under the pipeline freeze (THR-1946, through 2026-11-13).
- decline THR-1908, THR-2104, THR-2106, THR-1220: Christian-led picks/sessions.
- decline THR-2074, THR-2025, THR-1972, THR-1943: UL proposals.
- decline THR-1928, THR-1745, THR-2014, THR-791: standing state unchanged.

Product vs process this week: product promotions only (THR-2157, THR-2161, THR-2176). No process ticket promoted while the freeze holds.

## T1.5 — wayfinder sweep
No open wayfinder maps (`wayfinder:map` + Todo returned none).

## T2 — design authoring
Not triggered: 5 non-Deferral items in Ready for Dev (trigger is fewer than 2).

## T3 — architecture health
**Due and run** (first run after 06:00 local). The home tree is 95 commits behind, so the detectors ran in a fresh detached worktree at `origin/main` @ `d964339b`. Diffed against 2026-11-05b.

| Detector | Result | vs. 11-05b |
|---|---|---|
| `generate-interface-map:dry` | exit 0, 7 LEAKED rows | Same seven rows |
| `sweep:rank-reach` | exit 0, PASS. 149 apex holders at tick 900, 0 of 60 rank-gated templates blocked | Same verdict (156 → 149 is run noise) |
| `check:process` | exit 1, from its last sub-check `check:authoring-brief`: the same 3 master-everyday floor errors (THR-1938 false alarm) and the same `Ocean fraction too low: 7.4%`. All other sub-checks pass. Linear-backed checks skipped (no API key) | Same findings. 11-05b reported exit 0, but the checker and briefs are unchanged since then (no commits to `scripts/check-authoring-brief.ts` or the briefs), so the earlier exit code was most likely misread. It is not a regression, and no CI workflow runs this check |
| `check:canon-staleness` | exit 0, the usual mtime warnings plus the `world-objects*.md` / generated-file frontmatter gaps | Same set |

**New finding (1, low):** the rank-reach sweep logs `[EncounterEventNode] Failed to create unified event node evt_born_lc_11_194_0: Duplicate node ID`. Earlier sweeps showed only `evt_ind_*` duplicates. This is a new id family: a birth event minted twice for the same id. It fails soft, so it only logs. Reported only; it needs a seeded reproduction before anyone files a bug. Yesterday's founder-holding refusal (`holding_face_ind_11_…`) did **not** recur on this tree. It appears to be seed- or commit-dependent, and it stays unconfirmed.

- **Stalled work:** none at the threshold. THR-1947 is still a dead claim (unassigned, In Dev since 2026-10-20, one transition).
- **In Design: 0 live, 0 excluded** (column empty), so T2 is free to stage when the shelf drops.
- **Hand-created In Dev:** none.
- **Redundancy:** not assessed this sweep.
- **Test-suite health:** not due (weekly, Mondays).
- **Not run:** `__DEBUG.validateTraitRefs()` (browser-only).

## Escalations
None.

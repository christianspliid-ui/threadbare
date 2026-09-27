---
lane: daily-backlog-grooming
run: 2026-09-27
promoted: 0
filed: 0
resolved: 0
swept: 0
canceled: 0
newFindings: 2
needsChristian: false
---
# Backlog Grooming — 2026-09-27

## Needs Christian
Nothing needs you. Both stalled PRs below are technical and belong to the pickup lane.

## Work in flight
- THR-1570 (item generator): shipped in PR #2088, auto-merge armed, but **not merged**. CI is red and the PR is DIRTY (conflicts with main after #2089/#2090).
- THR-1629 (duel double-knockout id): shipped in PR #2087. Same state: CI red and DIRTY.
- Both CI failures are the same single file: `src/testing/__tests__/fightCalibration.test.ts`, where the beforeAll hook times out at 10000ms (1 failed of 1357/1359 files). Main's last 6 CI runs are green. This is likely a timeout, not a defect (#2088 touches no fight code), but it has now reproduced twice. The resume path is `git merge origin/main && git push` on each branch, then re-run CI. Both tickets were updated today, so this is not a 24h stall and no action was taken.

## Technical gates resolved this run
None.

## Counts by state
In Dev 2 · Ready for Dev 1 · Todo 28 · In Design 1 · Impl Planning 0 · Idea 65

## Problems found and fixed
- No orphan issues. Every queried issue has a project.
- Project states are consistent. All 7 "Now" projects are High priority. "Next" and "Idea" projects hold only Idea-state issues, apart from THR-870 (Todo, parked).
- No Ready-for-Dev deferrals, so no deferral is unclaimable.
- Stale design: none. The one In Design issue, THR-1605, was updated today.
- `.planning/ROADMAP.md` is unchanged since 2026-07-30. Its Future Work phases map to THR-54/55/56.

## Materiality sweep
Swept 0, canceled 0. No Ready-for-Dev or Todo ticket carries Infrastructure/Improvement or sits in Continuous Improvement.

## New findings (logged here, not filed, per the throttle)
- fightCalibration beforeAll hook timeout on 2 PRs today (see above). If a third PR hits it, that clears the ≥3/week bar for an impediment ticket.
- The THR-1629 executor reports the duel calibration missing on struck_down: 35.0 vs a 23.0 target at seed 7 / 40 duels, identical on main. That goes to the owner of duel tuning (Physical Conflict).

## Pipeline status
**Shelf thin: 1 item in Ready for Dev**, THR-1635 (culture/sphere openings slice 1, handoff complete). That is the recommended next pickup once #2087/#2088 are unblocked. The next agreed work is THR-1627 (High, Deferral, Todo), a measurement ticket, followed by the living-world design tickets THR-1630..1636 for the design lane. Promotion is the orchestrator's (T1) job.

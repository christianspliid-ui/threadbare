---
lane: tb-design-lane
run: 2026-11-07e
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run e, ~14:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Event ids collide during play](https://linear.app/threadbare/issue/THR-1921/orchestrator-event-ids-collide-evt-141-10-25-duplicate-react-keys-in) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-1921-one-tick-runs-once.md)). **The world will never run the same day twice.** The game's console filled with duplicate-name errors because, now and then, one day of the world ran twice from the same starting point. When that happens, mortals can take two steps instead of one and the history log writes the day twice. The cause is one place: the normal running clock did not note where it had got to, while every other control did. If something else moved time before the screen caught up, the day ran again. The fix makes the clock note where it got to. It also adds a tracker, so any future repeated day names itself instead of hiding. Nothing changes on screen. This is a technical fix, so nothing is held for a veto. Builders can pick it up now.

Say "veto one tick runs once" to reverse it.

## Work

- **Claimed** [Event ids collide during play](https://linear.app/threadbare/issue/THR-1921/orchestrator-event-ids-collide-evt-141-10-25-duplicate-react-keys-in), which the orchestrator staged at ~12:29Z. Why not UI-focus work: the shelf was thin (one non-Deferral ticket ready). The only UI-period candidate, [A sheet's Story list never says who did the deed](https://linear.app/threadbare/issue/THR-2191), builds on the Story-rows decision, which stays inside its veto window until 20:30Z.
- **Measured:** the 300-tick id-uniqueness test passes on `main` (`ec90c06e`, 3 passed). A straight run never repeats an id, so the collision needs a day run twice. `doTick` in `useSimulation.ts` is the only one of six state-advancing paths that does not update the live-state pointer before committing.
- **Gates:** intent judge **Allow** (one wording gap fixed: the debug tick pauses the clock, so the browser check now restarts it each round). NFP, pillar and Vision audits all PASS or PASS-with-notes, and every note is fixed in the doc. Docs gate PASS.
- **Plan PR:** [docs(plan): 2026-11-07 one tick runs once](https://github.com/christianspliid-ui/threadbare/pull/2782), auto-merged. Ticket handed off to Ready for Dev with its coordination block.

## Escalations

None.

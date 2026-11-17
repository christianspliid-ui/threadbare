---
lane: tb-design-lane
run: 2026-11-17a
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-17 (run a, ~08:20Z)

## Needs Christian

Nothing new needs you. The briefing's main question, "what should the design lane plan next?", is still yours. This run's decision does not answer it. It only makes the one Doom answer we have work as designed.

## Decided for you

- [Stay the Unmaking lands crooked every time](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it): **Stay gets easier to cast, and its card says "uncertain" instead of "favorable".** Today a god with no star affinity never holds the hour cleanly (0 clean casts in 400). The seeded Witness is such a god, and so are two of the three census gods. After the change that god lands clean about a third of the time, and a star god about 60%. Doom slows about half again as much per held day for the off-star god. The other landings stay crooked, as the card's design wants. Say "Stay should be equally easy for every god" and it gets its own plan to roll in the god's best reach instead of star. Say "Doom should only be answered crookedly" and the change is dropped.

## Work

- **Claimed** [Stay the Unmaking lands crooked every time](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it) with the marker `design-lane claim dl-20261117T0819Z` (assignment checked).
  - **Why this unit:** Ready for Dev was empty. The orchestrator had staged this ticket for the lane at 06:30Z, after the builder stopped on the ticket's own stop clause: "favorable" cannot be reached by difficulty alone. It was the only agreed work waiting on a design decision. No map is open, and the UI-focus project still holds only your icon picks, so no focus unit could be worked.
  - **Measured:** the builder's table (live resolver, 400 casts per cell) is in [its comment on the ticket](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it). I checked the two numbers it rests on myself: the difficulty is 0.35 ([game-config.ts:60](https://github.com/christianspliid-ui/threadbare/blob/main/src/data/game-config.ts#L60)), and the cosmic scale adds 0.10 ([resolutionScaleAdjust.ts:47](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/resolutionScaleAdjust.ts#L47)).
  - **Amended** [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md) with the card-face row, the constants table and a new § Amendments, in [the plan amendment PR](https://github.com/christianspliid-ui/threadbare/pull/2853). Docs gates pass, auto-merge is armed, and the plan doc's liveness check reads LIVE.
  - **Handed off:** the ticket was re-scoped (new build steps and Done-when; the old ones are kept as history) and moved to Ready for Dev with no assignee and a coordination block. Builders can claim it from 20:20Z, after the 12-hour veto window.
- **Shelf:** 0 → 1 non-Deferral ticket in Ready for Dev (held until 20:20Z).

## Escalations

None.

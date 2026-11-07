---
lane: tb-design-lane
run: 2026-11-07a
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run a, ~03:40Z)

## Needs Christian

Nothing needs you.

## Decided for you

From [A lean waits for its road](https://linear.app/threadbare/issue/THR-2188). Nobody builds on these before 15:36 UTC on 7 November.

- **Your lean now reaches the choice you paid for.** When you lean on a mortal's road at the Crossroads, the game keeps that road in front of them. Until now, the game's shortlist of what a mortal can see often dropped the road a few hours later, and your lean ended "Your lean finds nothing to hold". That happened to more than half of all leans. The God's Will pick had this protection, and the lean lost it when it replaced God's Will.
- Same ticket — **a lean waits for its road.** If the road is out of sight when the mortal next chooses (they moved on, or they are resting after a chapter), your hand stays on them until it comes back, for up to six days. The held line now reads *"Your hand rests on Kael, toward The Oath-Breaker's Rite. It waits until Kael next faces that road."* If it never comes back, the fade names it: *"Your lean fades: Kael never came back to The Oath-Breaker's Rite."*
- Same ticket — **"likely" means more than before.** "Kael will likely turn to it" now needs a clearer lead. Before, two kinds of lean that each worked about 4 times in 10 both said "likely". Now, leaning toward a road works about 56% of the time on "likely", 38% on "may" and 14% on "not enough".
- Same ticket — the lean still never passes the rest a mortal takes after a chapter. If it could, the leaned road would win by default while other roads are hidden, and that would be an order, not a lean.

Measured over two worlds: "likely" leans were followed 22% of the time before and 64% after; leans that came to nothing went from 58% to 2%. Say "veto A lean waits for its road" to reverse it.

## Work

- **Claimed** [A lean waits for its road](https://linear.app/threadbare/issue/THR-2188), which the orchestrator had staged for design. The build shelf was empty. No UI-focus unit was workable: the [UI legibility map](https://linear.app/threadbare/issue/THR-2114)'s four plan docs are all handed off, every warm-round-3 UI finding already has its build shipped, and [the mid-game words finding](https://linear.app/threadbare/issue/THR-2175) waits on its vocabulary proposal ([THR-2181](https://linear.app/threadbare/issue/THR-2181)).
- **Measured before deciding** (main @ `2b3bebee`). A new census instrument on the never-merged branch [`proto/thr-2188-lean-waits-for-its-road`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2188-lean-waits-for-its-road), run on seeds 42 and 7, 600 ticks, six threaded mortals per seed. Four arms: today, cap reserve, reserve + wait, reserve + wait + margin. Repeat runs were identical.
- **Plan doc:** [A lean waits for its road](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2188-a-lean-waits-for-its-road.md), via [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2777) (merged, liveness LIVE).
  - Intent judge: Revise twice, then Allow. The first run found missing kill criteria, the after-roll toasts not quoted, and a false claim that the terms were in the glossary. The second run found the forecast tooltip not quoted; it is now reworded to match the new held line.
  - NFP, three-pillar and Vision audits: all PASS-with-notes. The notes are fixed: a trace field showing when the reserve saved a road, the waiting trace's volume, and an explicit no-map-change line.
- **Handed off** to Ready for Dev, unassigned. The description has the plan-doc line and "Claimable from 2026-11-07T15:36:00Z". The decision record and the handoff with its coordination block are the latest comment.
- **Filed** [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189) (Todo, blocked by THR-2188). A lean *away* from the mortal's favourite is followed 77–98% of the time whatever its word says, including "Kael will hold to it anyway", because the road a mortal passed over is rarely first again. That is a question of what an away lean is worth, so it is kept out of this slice and may come to you.
- **Filed** [UL-proposal: Crossroads, Lean and Road](https://linear.app/threadbare/issue/THR-2190). None of the three words has a glossary entry, and "road" (one choice) collides with real roads between towns.
- **Process slip:** the proto branch commit used `--no-verify`. Its prototype engine edits read environment switches and would fail the gates by design, and it is never merged. Nothing on main skipped a hook.

## Escalations

None.

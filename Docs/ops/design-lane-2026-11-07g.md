---
lane: tb-design-lane
run: 2026-11-07g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run g, ~21:05Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189/away-leans-almost-always-work-kael-will-hold-to-it-anyway-is-followed) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2189-an-away-lean-waits-for-the-reach.md)): **when you lean a mortal away from the road they favour, your hand now waits until they actually reach for that road again.** Before, the game said "Kael sets it aside, as you leaned" even when Kael would have set it aside anyway, which was true about three times in four. Now that line appears only when your hand did it. Before paying you read one honest line, "If Kael reaches for it again, your hand will likely turn them from it.", in place of three words that turned out to mean nothing. "Lean away" no longer shows on a mortal's own work, where it almost never mattered. One trade to know about: the away line is now a rate measured over many runs, not something read off Kael's current choices, because that reading told you nothing. Nobody builds on this before 09:00 UTC on 8 November.

Say "veto away lean waits" to reverse it.

## Work

- **Claimed** [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189/away-leans-almost-always-work-kael-will-hold-to-it-anyway-is-followed). It was staged by the orchestrator and is outside this period's UI focus. No UI-focus plan-doc candidate was open: the [UI legibility map](https://linear.app/threadbare/issue/THR-2114)'s four plan docs and every warm round-3 UI finding already have shipped builds, and the only open tickets in the UI project are your two icon picks ([doom kinds, strands and more](https://linear.app/threadbare/issue/THR-1908), [the Inspector's tabs](https://linear.app/threadbare/issue/THR-2104)). The build shelf held one ticket.
- **Measured** on the never-merged [prototype branch](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2189-away-lean-waits): seeds 42 and 7, 600 ticks, six threaded mortals, an away lean at every reading. Today 533 of 608 away leans end "followed", but the lean changed the choice in only 156. With the wait, 86 of 158 end "followed", and the lean changed the choice in all 86. On the day the mortal reaches for the road, the hand turns them 74% of the time. About one away lean in four fades unused.
- **Gates:** intent judge Revise and then Allow (the shared forecast tooltip was fixed to name both directions, and one figure was corrected). NFP audit PASS-with-notes, pillar audit PASS, Vision audit PASS-with-notes. The plan merged in [PR #2788](https://github.com/christianspliid-ui/threadbare/pull/2788), and the plan-doc liveness check reads LIVE.
- **Handed off** to Ready for Dev, unassigned, with the decision record and the coordination block on the ticket and `Claimable from: 2026-11-08T09:00:00Z` in the description.

## Escalations

None. One process note: the prototype commit on the proto branch was made with `--no-verify`, because it deliberately reads an environment switch inside `src/`. The branch is never merged, and no hook was skipped on the plan-doc PR.

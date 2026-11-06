---
lane: tb-design-lane
run: 2026-11-06d
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-06 (run d, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

From [Plan which of the mortal's own chapters should give the god a hand](https://linear.app/threadbare/issue/THR-2179). Nobody builds on these before 23:50 UTC on 6 November.

- **Your cards now say how they landed.** Every card carries a line for each result, such as *"The odds had been quietly widened, and Kael walked through the gap."* No screen has ever shown one. The only answer a played card got was "your cards held it". Each card you play now adds its line under how the step went, on the encounter screen and in the Ledger: *"Press The Odds — The odds had been quietly widened, and Kael walked through the gap."* At most two lines per step. Build ticket: [Your cards say how they landed](https://linear.app/threadbare/issue/THR-2187).
- Same ticket — when a card has no line for a critical failure (31 of the 38 library cards don't), it uses its plain failure line. So the god's card is never missing from the worst roll.
- **Five quiet chapters now ask you once.** Measured live over four worlds, 70% of The First's story chapters already wait for your cards. The ones that play out alone are mostly five: Consecrate the Ground, The Haggle, Tend the Shrine, The Market Haggle and Heal the Sick. Each gets a hand dealt from your cards on its **first step only**. That makes the world stop about a fifth more often for The First, against nearly half more if every step asked. How often The First starts a chapter does not change. This builds after the card lines, so the new hands pay off.
- Same ticket — the other seven quiet chapters stay as they are. Together they are a quarter of the alone chapters, and they are rare.

Say "veto <title>" to reverse any of these.

## Work

- Claimed [THR-2179](https://linear.app/threadbare/issue/THR-2179) (shelf at 4, no open map, the only open UI-project tickets are your icon picks, so no UI-focus unit was workable this run). Its blocker [THR-2178](https://linear.app/threadbare/issue/THR-2178) shipped 6 Nov 00:37 UTC.
- Live census on main @ `2b3bebee`: 4 seeds × 600 ticks, The First pre-bonded. 103 story chapters, 72 wait, 31 alone, from 12 templates; the top 5 carry 74%. 6 of the top 20 offer no move. Instrument on the never-merged branch [`proto/thr-2179-chapter-hand-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2179-chapter-hand-census).
- Found: `collectNudgeBandProse` has no production caller, so 1,310 authored card lines (529 cards, 116 templates) and every library card's lines never render. Filed as the slice-1 bug ticket [THR-2187](https://linear.app/threadbare/issue/THR-2187).
- Plan doc [Your cards say how they landed](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-06-thr-2179-cards-say-how-they-landed.md), via [PR #2767](https://github.com/christianspliid-ui/threadbare/pull/2767). Intent judge Revise, then Allow. NFP, three-pillar and Vision audits PASS-with-notes, notes fixed.
- Handoff: [THR-2187](https://linear.app/threadbare/issue/THR-2187) in Ready for Dev; [THR-2179](https://linear.app/threadbare/issue/THR-2179) carries slice 2, in Todo and blocked by THR-2187. Both are claimable from 23:50 UTC on 6 November.

## Escalations

None.

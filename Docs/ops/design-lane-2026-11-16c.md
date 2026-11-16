---
lane: tb-design-lane
run: 2026-11-16c
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-16 (run c, ~17:20Z)

## Needs Christian

Nothing new needs you. One fact may help with the briefing's main question, "what should the design lane plan next?". **Today's census never reached the end of an age.** Every run stops at tick 800, while Doom stands at 91–99% of its clock. "Every age ended at Doom's last stage" really means "every run was in Doom's last stage at tick 800". Doom's last stage starts at 80% of the clock. So even Stay the Unmaking at full strength, held all run, could only delay the end by about an eighth of the clock. It could never lift a run out of that stage. Changing how the age ends is still your call.

## Decided for you

- [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202/give-both-clocks-a-verb-the-mortals-deeds-fill-the-mandate-and-doom): **Stay the Unmaking is weaker than its design says, and the fix is a number.** The card should slow Doom to three quarters while you hold it. In practice it slows Doom only to nine tenths, because a new god almost never casts it cleanly: all 12 casts in the measurement landed crooked. The fix makes a clean hold the usual result ([Stay the Unmaking lands crooked every time](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it), filed, Ready for Dev, held until 05:50Z for your veto). Its daily cost stays as it is for now. Say "Doom should only be answered crookedly" and the fix is dropped.

## Work

- **Claimed** [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202/give-both-clocks-a-verb-the-mortals-deeds-fill-the-mandate-and-doom) with the marker `design-lane claim dl-20261116T1721Z` (assignment checked).
  - **Why this unit:** Ready for Dev was empty again (both tickets from run b have shipped), no map is open, and nothing was waiting in In Design. The UI-focus project still holds only your icon picks, so no focus unit could be worked. The new census result ([the agency census answer arm](https://linear.app/threadbare/issue/THR-2243/the-agency-census-answers-the-clocks-a-third-arm-that-holds-stay-the), [PR #2852](https://github.com/christianspliid-ui/threadbare/pull/2852)) showed Stay holding Doom back by only 0.013–0.030. That is far below what a three-quarters rate gives, so the shipped card was not doing what its plan says. Checking that is agreed work (a consequence of a shipped design).
  - **Measured** on main @ `b0f047b7` with a per-tick counter on [proto/thr-2202-stay-strength-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2202-stay-strength-census) (never merged), warm 300 to t800, seeds 42 and 7 (answer arm) and seed 42 (greedy arm):
    - Clock ticks saved per held tick: **0.100 on both seeds**. Seed 42 saved 21.2 in 213 held ticks; seed 7 saved 26.5 in 266. That is exactly the crooked rate (0.9×). A clean landing at 0.75× saves 0.25.
    - Cause: a new god's cast skill is 0.13–0.15 ([THR-1775](https://linear.app/threadbare/issue/THR-1775)) against the card's difficulty of 0.35, and god casts never fall below a crooked landing ([THR-728](https://linear.app/threadbare/issue/THR-728)).
    - Stay was held for 43% and 54% of the ticks after the gift. Seed 42 turned down 1446 cast attempts because the purse could not pay.
    - Doom's own step stayed 1.0 all run. About 145 of the 645 clock ticks Doom moved on seed 42 came from other pushes (complications), which Stay does not slow.
  - **Recorded** the decision on the ticket, filed [THR-2244](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it) with its coordination block and a `Claimable from` line for the 12-hour veto window, linked the two tickets, and released THR-2202 to Todo with no assignee. Its "fixed when" is still checked in warm round 5.
- **Shelf:** 0 → 1 non-Deferral ticket in Ready for Dev.

## Escalations

None.

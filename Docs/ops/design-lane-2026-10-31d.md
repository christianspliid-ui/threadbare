---
lane: tb-design-lane
run: 2026-10-31d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-31 (run d, ~20:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Both are on [Cheap place cards plateau: Reshape, Preserve and Bind stall below half their Mandate](https://linear.app/threadbare/issue/THR-2094/cheap-place-cards-plateau-reshapepreservebind-first-sphere-reaches-26):

- **When a god works a town, its sphere push lands in the town's quietest Place.** The card still changes the town as it says (walls, stores, footings). The push to the god's sphere lands in the inn, granary or gatehouse of that town that holds least of the sphere. A Reshape god then reaches 66 of 87 by doom 0.75 instead of 34. The trade: rivals rarely reach those Places, so a town god's ground is as lightly contested as Witness's is today. Veto line: "the push should stay on the town".
- **A card that changes the world pushes twice what a look pushes.** Vision (1 essence, it only looks) stays at 3. Every card at 2 essence or more pushes 6, capped there. With both changes, Preserve reaches 45 and Bind 58, so all three town-card gods clear half. Witness does not move. Veto line: "keep every push at 3".

Say "veto <line>" to reverse either. The window closes about 09:10 UTC on 1 November.

## Work

- Claimed the staged design request [Cheap place cards plateau](https://linear.app/threadbare/issue/THR-2094/cheap-place-cards-plateau-reshapepreservebind-first-sphere-reaches-26). Ready for Dev held 2 items, below the floor of 4. It builds on the doom-tide decision on [Spirit, life and entropy get a cheap place card](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life), so the measuring began before that decision's window closed at 20:52Z, and the plan was not started until after.
- **Measured** on the never-merged [proto branch](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2094-place-card-plateau): 23 census arms, raw logs committed. Both of the ticket's hypotheses were tested:
  - Towns do not saturate (force 0–4 against a cap of 10).
  - Casts stall on essence, not refusals: the god cannot afford its card on 95% of ticks.
  - The root cause: a push raises its target by one level at most, so a cast is worth about one point. The 87 target was fitted on Witness's 1-essence card, which gets twice the casts on fresh ground.
- **Plan doc:** [Town cards reach the Mandate](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2094-town-cards-reach-the-mandate.md), merging via [PR #2667](https://github.com/christianspliid-ui/threadbare/pull/2667) (auto-merge armed). [Brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2094-town-cards-reach-the-mandate-brainstorm.md).
  - The intent judge returned Revise twice for wording: "mark" collides with The God's Mark, and "district" is not the canon word, which is *Place*. Both were fixed, and run 3 returned Allow.
  - All three cold auditors (NFP, three pillars, Vision) passed with notes. The fixable notes were fixed: a Blast Radius section, a lazily built lookup, and a push-scale field in the trace.
  - Docs gate: PASS.
- **Handoff:** `Todo`, blocked by [THR-2090](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life) so the build measures on top of its doom-tide change. `Claimable from: 2026-11-01T09:10:00Z` is in the description.

## Escalations

None.

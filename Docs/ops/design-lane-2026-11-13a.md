---
lane: tb-design-lane
run: 2026-11-13a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-13 (run a, ~08:47Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Make the purse bite — a full hand should cost more than the god can afford](https://linear.app/threadbare/issue/THR-2201) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md)). **Essence becomes scarce mainly because the god earns less, not only because cards cost more.**
  - **What was tested:** I measured three worlds. The god could afford every card in the hand at every attended step, in all three. Even with prices tripled and a smaller pool, it still could. Attended steps come only every 40 to 48 ticks, and in that time the god's own pools earn about ten times what a hand costs.
  - **What changes:** cards cost about three times more, each pool holds 35 instead of 50, and the god's base and home-seat income halve. Two hidden rules also change. The cheaper price on your own spheres now goes only to spheres you actually chose. A card with no sphere is now paid from your own spheres, not from all twelve pools added together.
  - **Result in the test runs:** the full hand was affordable at 5 of 13 steps in one world and 2 of 19 in another.
  - **Safeguards:** the builder stops tuning at the first setting where a full hand is affordable less than half the time. At least one card must stay playable at nine steps in ten, a god who plays nothing must keep its threads, and Meet The First must not change.
  - **Veto:** held for your veto until 20:46 UTC today. Say "veto purse bite" to keep the god's income as it is and only raise prices. The measurements say that alone will not make anyone choose.

## Work

- **Unit chosen:** I resumed this lane's own claim on [Make the purse bite](https://linear.app/threadbare/issue/THR-2201). Last night's run had claimed it and left no checkpoint, no branch and no work. Rule 1 applied: the build shelf was thin, with one ready item. No UI-focus plan-doc candidate was open, so the period focus did not apply.
- **Census:** I ran a headless census of the seeded route on three seeds with a greedy god, then eight experiment runs that each change one lever (raw table in the [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2201-make-the-purse-bite-brainstorm.md)). The script is on the never-merged branch [proto/thr-2201-essence-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2201-essence-census). The experiments used a local patch that was reverted, so nothing under `src/` was committed.
- **Gates:**
  - The intent judge said **Allow** with two gaps, both fixed before the PR. The debug bridge prices hands with its own copy of the rules, so it now shares one helper. The meeting exemption from the price scale also had no named mechanism, and now has one.
  - The design audits came back **PASS-with-notes** on all three axes, and every note was answered in the plan.
  - `npm run gate -- --final` passed on the docs track.
- **Plan doc:** merged in [PR #2805](https://github.com/christianspliid-ui/threadbare/pull/2805). `check:plan-doc-liveness` returned LIVE.
- **Handoff:** the ticket is in Ready for Dev, unassigned, with the coordination block. Its description carries `Claimable from: 2026-11-13T20:46:00Z`.
- **Filed:** [A greyed card says which pool is short and how fast it refills](https://linear.app/threadbare/issue/THR-2206), the UI slice. It is blocked by the purse ticket and carries its own coordination block.

## Escalations

None.
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">cd /c/Users/chris/Dev/Projects/wt-dl-20261113T0747Z && npm run check:substantive --silent -- --lane report --file Docs/ops/design-lane-2026-11-13a.md --json 2>&1 | tail -3
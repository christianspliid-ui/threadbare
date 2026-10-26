---
lane: tb-design-lane
run: 2026-10-26d
promoted: 1
filed: 2
resolved: 1
newFindings: 1
needsChristian: false
---
# Design lane — 2026-10-26 (run d, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

[The path you chose doesn't steer what comes next](https://linear.app/threadbare/issue/THR-2059/the-path-you-chose-doesnt-steer-what-comes-next-an-unseen-blade-is): four calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2059-the-path-steers.md). Each can be vetoed on its own until Tuesday 14:30 UTC.

- **God's Will only offers work that becomes a chapter.** Chores (Forage, Take Stock, Shore Up Shelter) never appear as options. If fewer than two real choices are left, God's Will waits for the next decision. *Veto:* "God's Will may offer chores".
- **Compelled work always says how it ended.** When the work you pushed her toward is done, one message says so, in the same word the chapter uses: *"Your will is done. The Haggle: Morthane held."* or *"Your will was not enough. The Haggle: Morthane broke."* Today a compelled chore, like the round-5 dead drop, ends in silence. *Veto:* "the start message is enough".
- **The path you chose leans her chapters.** Scenes in the path's two Reaches (shadow and iron for the unseen blade, about a third of all scenes) are half again as likely to be chosen. This applies to her own choices and to what God's Will offers. It is a lean, not a filter, so she still does other things. *Veto:* "the path should only lean God's Will" or "the lean should be stronger".
- **An option that fits the path says so:** *"Fits the unseen blade."* *Veto:* "no label".

## Work

- **Claimed** [THR-2059](https://linear.app/threadbare/issue/THR-2059/the-path-you-chose-doesnt-steer-what-comes-next-an-unseen-blade-is), the round-5 playtest ticket that the [previous run's plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md) left out of scope. The shelf was full (9 ready), no wayfinder map was open, and no vetoes were in the briefing.
- **Measured** on `origin/main` @ `fc447b8d`:
  - "Service a Dead Drop" is a trivial chore, so when it is compelled it runs silently. Nothing filters chores out of God's Will.
  - The live decision board never reads the score that the trade's lean multiplies.
  - The scene cache keeps only a scene's main Reach.
  - Census: each path's two Reaches cover 83 to 204 of 539 story scenes.
- **Plan doc** [2026-10-26-thr-2059-the-path-steers.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2059-the-path-steers.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2059-the-path-steers-brainstorm.md), via [PR #2603](https://github.com/christianspliid-ui/threadbare/pull/2603).
  - Intent judge: Revise, then Revise, then Allow. The fixes were the player-facing text table, done lines on the game's one band-word list, and a measured answer for compelled work that is dropped.
  - NFP, pillar and Vision audits: PASS-with-notes, all notes answered.
- **Filed** in *Cold playtest · round 5*:
  - [God's Will offers story, compelled work answers, the path leans](https://linear.app/threadbare/issue/THR-2068/gods-will-offers-story-compelled-work-answers-the-path-leans-no-chores): Ready for Dev, claimable from 2026-10-27T14:30Z.
  - The finding, [The trade's lean never reaches the live board](https://linear.app/threadbare/issue/THR-2067/the-trades-lean-never-reaches-the-live-board-roleaffinitymultiplier): Todo, a bug. The First's trade, which THR-1984 meant her chapters to weigh, reorders only God's Will's list, never her own choice.
- **Closed** THR-2059 under its Done-when (implementation tickets filed into the milestone), as THR-2058 was.

## Escalations

None.

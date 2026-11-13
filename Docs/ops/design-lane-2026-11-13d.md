---
lane: tb-design-lane
run: 2026-11-13d
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-13 (run d, ~17:19Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Measure whether the player matters](https://linear.app/threadbare/issue/THR-2205) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md)). **Today, playing every card changes nothing about how the age ends.**
  - **What was tested:** the same world was run twice on each of three seeds. In one run the god never played a card. In the other it played every card it could afford: 117, 178 and 139 cards.
  - **What happened:** on all three seeds, both runs ended by Doom within 15 days of each other. The First became an Aspect, or lived, the same way in both. The Apotheosis came by day 400 in both. The Mandate never passed 13%. A second card-free run matched the first exactly, so none of this is chance.
  - **Underneath, play does move things.** The First's chapters differ by 14–35% between the runs, and the outcome mix shifts. None of it reaches the ending. That is the gap the other four "make the middle a game" tickets have to close, and this number will show when one does.
  - **The measure:** "the player mattered" when the played run differs from the unplayed one in how the age ended, the First's fate, the Apotheosis, the Mandate or the Doom stage. It asks whether the runs ended *differently*, never which ending was better. The game does not rank the player.
  - **Where it lives:** an on-demand command the builders run when a sibling ticket lands. Your ticket placed it in the weekly review. The pipeline freeze, made permanent this morning, bans new standing lane steps, so that part is held. Say "lift the freeze for the agency number" to have the weekly review run it.
  - The build ticket is held for your veto until 06:20 UTC tomorrow: [Ship the agency census](https://linear.app/threadbare/issue/THR-2213). Say "veto agency measure" to stop it.

## Work

- **Unit chosen:** a plan doc, under rule 4 (agreed, undesigned work). No map is open. The shelf held five items, so rule 1 did not apply.
  - The UI-focus slice [A greyed card says which pool is short](https://linear.app/threadbare/issue/THR-2206) builds on the purse decision, which is inside its veto window until 20:46 UTC.
  - [Put the god in the climax](https://linear.app/threadbare/issue/THR-2204) also builds on the purse and clocks decisions, so it was skipped too.
  - [Measure whether the player matters](https://linear.app/threadbare/issue/THR-2205) builds on neither, so this run took it.
- **Claimed** with marker `design-lane claim dl-20261113T1719Z`.
- **Census** on the never-merged branch [proto/thr-2205-agency-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2205-agency-census). It reuses the purse census's seeded-route build and its card-playing god.
  - Each run takes 15–17 minutes to reach the end of the age, past the 600-second command limit. The runs therefore go in the background.
  - A first try ran seven at once and slowed every run about eightfold. That cost about 20 minutes. Logged as a recurrence of impediment #1212 ([PR #2814](https://github.com/christianspliid-ui/threadbare/pull/2814)).
- **Gates:**
  - Intent judge: Allow. Its one gap, in the kill criteria, is fixed.
  - Audits: rules PASS-with-notes, with the timing note fixed; pillars PASS; Vision PASS.
  - The final docs-track gate passed.
- **Plan doc:** [PR #2813](https://github.com/christianspliid-ui/threadbare/pull/2813), merged. The liveness check reads LIVE.
- **Handoff:**
  - [Ship the agency census](https://linear.app/threadbare/issue/THR-2213) is in Ready for Dev with its coordination block, claimable from 2026-11-14T06:20Z.
  - The design ticket is back in Todo, blocked by the build ticket.
- **A slip, caught before any PR opened:** the plan branch was first pushed under a name that carried the issue id. It was renamed and the old branch deleted.

## Escalations

None.

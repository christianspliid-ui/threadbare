---
lane: tb-design-lane
run: 2026-09-29c
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-29 (run c, ~12:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Re-plan the lead climb's first rung](https://linear.app/threadbare/issue/THR-1675/re-plan-the-lead-climbs-first-rung-deciders-are-too-rare-in-rumour): **the "30% of rumours reach a decision-maker" target is dropped. The visit to the ruin goes ahead now.** The target stood in for "someone who can act surveys the ruin they heard about", and that already happens (3 and 2 such mortals on the two test worlds). Most rumours still land on ordinary folk and fade, which is how gossip works. If the visit step later shows too few mortals going to ruins, the next lever is letting ordinary folk pass a rumour to a decision-maker they know. Also added: a mortal can have only one visit to a given ruin pending at a time. Plan: [seeded things that stay alive, § Re-plan after S2](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md).

## Work

- **Chosen:** the build shelf held 2 jobs (floor 4), and no map was open, so a plan unit. [The seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) was skipped because it builds on the [power runtime plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md), a lane decision from 00:52Z today, and its 24-hour veto window is still open (closes ~00:52Z 09-30). It is the next run's first candidate.
- **Claimed** [the lead-climb re-plan](https://linear.app/threadbare/issue/THR-1675/re-plan-the-lead-climbs-first-rung-deciders-are-too-rare-in-rumour) at 12:51Z, after its parent plan's veto window closed. No veto appeared in the briefing.
- **Decided** option (c) from the S2 evidence (`upkeep-2026-09-29-thr1663.json`). Intent judge: Revise → Allow. Run 1 caught an overstated visit count (6·3 surveys are 3·2 distinct mortal–ruin pairs) and a duplicate-visit hole in the visit slice; both were fixed. Forked audit skipped with a written rationale, because no pillar changed.
- **Plan amended:** [PR #2149](https://github.com/christianspliid-ui/threadbare/pull/2149), merged `cf68929f`, liveness `LIVE`.
- **Unblocked** [the visit to the ruin](https://linear.app/threadbare/issue/THR-1664/the-visit-to-the-ruin-a-survey-arranges-a-visit-the-visits-dice-decide): blocker removed, and the one-pending-visit rule added as item 6. Its remaining blocker is the shipped S2, so the orchestrator can promote it.
- **Released** the re-plan ticket to `Todo`, unassigned, with the decision record as its latest comment.

## Escalations

- [The lead-climb re-plan](https://linear.app/threadbare/issue/THR-1675/re-plan-the-lead-climbs-first-rung-deciders-are-too-rare-in-rumour) is finished but has no build work, and no lane may mark it Done. This is the known satisfied-ticket-with-no-closer shape. An attended session can close it in one click. It blocks nothing any more.

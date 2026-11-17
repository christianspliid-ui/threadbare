---
lane: tb-design-lane
run: 2026-11-17b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-17 (run b, ~17:20Z)

## Needs Christian

Nothing new needs you. The briefing's main question, "what should the design lane plan next?", is still yours. This run's work is a small legibility fix and does not answer it.

## Decided for you

- [A sheet's Story list never says whether the mortal did the deed or had it done to them](https://linear.app/threadbare/issue/THR-2191/a-sheets-story-list-never-says-whether-the-mortal-did-the-deed-or-had): **a Story row now says when the deed was done to the mortal, and stays quiet when it was their own.** After the chapter name comes one short word: "done to them", "set upon" (a fight started against them), "defending" (their side was attacked) or "fell in it" (died in a past war). On a live world, 96% of a mortal's Story rows are their own deeds, so only the other 4% get a word. A chapter they ran and the same chapter run on them become two rows, so "twice" never mixes the two. Say "mark every row" and own deeds also get "by them". Say "put the word first" and it moves in front of the name.

## Work

- **Claimed** [the Story-list ticket](https://linear.app/threadbare/issue/THR-2191/a-sheets-story-list-never-says-whether-the-mortal-did-the-deed-or-had) with the marker `design-lane claim dl-20261117T1719Z` (assignment checked).
  - **Why this unit:** Ready for Dev held one ticket (thin), and it is held until 20:20Z. No map is open. Every other agreed ticket already has its decision or plan and is waiting on builds or a playtest. This was the one agreed plan-doc ticket left in the UI legibility focus project. Nothing it draws on is inside a veto window.
  - **Measured:** the Story steps in [connections.ts](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/views/connections.ts#L81) set no fact. Since the repeat fold shipped, the fold overwrites the row's fact and groups by chapter only. A live census (seed 42, tick 300) counted 3,407 "took part in" links: 3,277 own deeds, 78 done to them, 19 fights against them.
  - **Plan:** [the plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-17-thr-2191-story-rows-say-whose-deed.md), merged in [PR #2854](https://github.com/christianspliid-ui/threadbare/pull/2854). The intent judge's first pass said Revise: its line numbers were copied from the ticket and were stale, and a complaint class was mislabelled. After the fixes it said Allow. The three auditors (rules, pillars, vision) passed, with notes. The plan doc's liveness check reads LIVE.
  - **Handed off:** Ready for Dev, unassigned, with a coordination block. Builders can claim it from 05:45Z on 18 Nov, after the 12-hour veto window (the hold is written in the description).
- **Shelf:** 1 → 2 non-Deferral tickets in Ready for Dev (both on veto holds).

## Escalations

None.

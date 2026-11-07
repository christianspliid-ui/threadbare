---
lane: tb-design-lane
run: 2026-11-07c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run c, ~08:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2145-story-rows-name-the-deed.md)) — **a mortal's Story list will name what happened to them in words, never in the game's internal code.** Kael's sheet showed "cell.destroy.power (afflicted)". It will now read "Destroy a power", the same words the work's card uses. A fight death reads as the fight's title ("The Beast in Its Den"), and a commander killed in battle reads "A commander slain in battle". This one place in the game named these events from their code. Fixing it there also fixes the event's own page and the region's history. Nobody builds on this before 20:30 UTC on 7 November.

Say "veto Story rows name the deed" to reverse it.

## Work

- **Claimed** [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145), which the orchestrator staged at 07:31Z because the build shelf was empty (one held ticket). It is a bug, so it counts as agreed. It is also a UI legibility fix, which is this period's focus.
- **Measured:** of the twelve places that write an event into the world, one names it from a raw id ([`undertakingOutcomeNode.ts` line 231](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/grievance/undertakingOutcomeNode.ts)). It has three callers: undertakings, fight deaths and battle deaths. The game's lookups give a player name for every undertaking and for the fight template. Battles need one fallback phrase.
- **Gates:** the intent judge said Revise first. It found the plan had no kill criteria and had not said how the row reads on the sheet of the mortal it was done *to*. Both were fixed, and a cold re-run said **Allow**. The three auditors said NFP PASS with notes, pillars PASS with notes and Vision PASS; each note was fixed in the plan. Docs gates and the final gates passed.
- **Plan PR:** [PR #2779](https://github.com/christianspliid-ui/threadbare/pull/2779), auto-merge armed.
- **Filed** [A sheet's Story list never says whether the mortal did the deed or had it done to them](https://linear.app/threadbare/issue/THR-2191) (Idea). No Story row today says whether the mortal did the deed or suffered it. That is a whole-list question, split out so this bug stays small.

## Escalations

None.

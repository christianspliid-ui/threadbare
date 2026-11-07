---
lane: tb-design-lane
run: 2026-11-07d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-07 (run d, ~11:35Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The encounter illustration's alt text is the whole encoded contract](https://linear.app/threadbare/issue/THR-1733/the-encounter-illustrations-alt-text-is-the-whole-encoded-contract) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-1733-scene-picture-speaks-words.md)): **an encounter's opening picture will be read aloud as a scene, never as the game's internal data.** Today a screen reader reads several thousand characters of the encounter's hidden setup data aloud when it reaches the picture that opens a story encounter. After the fix it says "Scene from Road Ambush". An encounter with no name says "An encounter scene". Encounters that already have a written description of their picture, such as the apprenticeship ones, keep it. Sighted players see no change. Writing a proper description for every painting would be better still, but that is a separate writing job and nothing is filed for it. Nothing is on hold, because the fix is exactly what the ticket asked for. Say "veto scene picture alt text" to reverse it.

## Work

- **Shelf was thin.** Only one ticket was ready to build that was not a follow-up ([Story list raw key](https://linear.app/threadbare/issue/THR-2145)), so this run wrote one plan doc. All four plan docs from the closed [UI legibility map](https://linear.app/threadbare/issue/THR-2114) are already done, so the focus candidate was the bug the orchestrator staged this morning. It is a UI bug: what a screen reader hears.
- **Claimed** [the alt-text bug](https://linear.app/threadbare/issue/THR-1733/the-encounter-illustrations-alt-text-is-the-whole-encoded-contract) with the lane marker, wrote the plan and handed it off. It is **Ready for Dev**, unassigned, with the coordination block.
- **Measured before writing.** In the code on main, two stage view models turn the field into the picture's label (`buildSimpleEncounterStageModel.ts:363`, `buildUnifiedEncounterStageModel.ts:998`). One component renders it (`EncounterVeil.tsx:257`, as `aria-label`). At least 23 painted encounters carry the data in that field. The ticket's file paths were out of date because the files had moved, and the plan corrects them.
- **Gates.** The intent judge first returned Revise: it wanted the complaint class named, the real rendered text quoted and a playtest check a tester can confirm. After those fixes it returned **Allow**. The three design auditors returned NFP PASS-with-notes, three-pillar PASS and Vision PASS. The plan doc PR [#2780](https://github.com/christianspliid-ui/threadbare/pull/2780) has merged, and `check:plan-doc-liveness` reports LIVE.

## Escalations

None.

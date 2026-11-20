---
lane: tb-design-lane
run: 2026-11-20a
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-20 (run a, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The goal is named before it is shown](https://linear.app/threadbare/issue/THR-2262/the-goal-is-named-before-it-is-shown-aftermaths-and-cards-say-raised) — the Mandate now arrives with its first mention. The first time Kael's deeds raise the Mandate (or the Seat comes, if that is first), the Mandate row appears beside the map in that same moment, ahead of anything else waiting. Before that, cards no longer say "Counts toward your Mandate." The rest of the new panels still arrive one per chapter. Veto in chat. The build ticket waits until 23:30Z (00:30 local) for that.

## Work

- **Claimed** [THR-2262](https://linear.app/threadbare/issue/THR-2262/the-goal-is-named-before-it-is-shown-aftermaths-and-cards-say-raised) under Step 2, rule 4, as a period-focus (UI legibility) unit. The shelf held 6 non-Deferral items in Ready for Dev, so it was not thin. There are no open maps, no claims of this lane's to resume, and no vetoes in the briefing.
- **Measured** on main @ `55c0c2ca`:
  - The Aftermath's Mandate line is written for any chapter closed by a mortal bound to the god (`unifiedActionResolution.ts:3251-3257`). So it fires from the first chapter after the bond.
  - The Mandate row waits for the Seat gift (`opening-reveal-table.ts:109`), then queues behind Doom and Rivals at one arrival per closed chapter (`openingReveal.ts:318-324`).
  - The card hint reads only the mortal's spheres (`buildNudgePhaseModel.ts:1019-1023`).
  - These are two separate clocks, which is why two of three round-8 testers saw the words and never the row.
- **Decision recorded** on THR-2262 with the options weighed. THR-2262 is closed under the design-request carve-out, because its Done-when ("decision recorded, implementation tickets filed into *Cold playtest · round 8*") is met.
- **Filed** [The Mandate arrives with its first mention](https://linear.app/threadbare/issue/THR-2265/the-mandate-arrives-with-its-first-mention-the-rail-row-lands-with-the). It is in Ready for Dev, unassigned, with `Claimable from: 2026-11-20T23:30:00Z` and a coordination block. It is mutex with [THR-2261](https://linear.app/threadbare/issue/THR-2261) (the same card view model) and [THR-2252](https://linear.app/threadbare/issue/THR-2252) (the Mandate row). There is no plan doc: it is one shared rule, one queue flag and one hint gate, and the ticket spells out the build.
- **Not taken this run:** [Chapters arrive back to back](https://linear.app/threadbare/issue/THR-2263/chapters-arrive-back-to-back-with-no-quiet-beat-on-the-map-the-next), the other round-8 design request. It is the next lane unit (one unit per run).

## Escalations

None.

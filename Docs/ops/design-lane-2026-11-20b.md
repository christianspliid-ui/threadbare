---
lane: tb-design-lane
run: 2026-11-20b
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-20 (run b, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Chapters arrive back to back](https://linear.app/threadbare/issue/THR-2263/chapters-arrive-back-to-back-with-no-quiet-beat-on-the-map-the-next) — you now get a quiet day on the map between chapters. When you close a chapter's Aftermath, the world keeps running for one game day (about 12 seconds at normal speed) before it opens the next chapter on its own. While you wait, "Needs you" lists that chapter, and you can open it early. Pausing does not use up the day, and chapters you open yourself never wait. Veto in chat. The build ticket waits until 02:30Z (03:30 local) for that.

## Work

- **Claimed** [THR-2263](https://linear.app/threadbare/issue/THR-2263/chapters-arrive-back-to-back-with-no-quiet-beat-on-the-map-the-next) under Step 2, rule 4, as a period-focus (UI legibility) unit. Ready for Dev held 5 non-Deferral items, so the shelf was not thin. There were no open maps, no lane claims to resume, and no vetoes in the briefing. Run a had named this as the next unit.
- **Measured** on main @ `11574595`:
  - Three things can hold a chapter the world opens: one of the player's surfaces is open, the player clicked in the last 2.5 s, or a card is armed (`interruptRegistry.ts:54`, `worldOpenedEncounterHeldBy`). Nothing spaces one chapter from the next.
  - At speed 1 the game runs one tick a second (`useSimulation.ts:302`), and a day is 12 ticks (`attention-constants.ts:14`).
  - A held chapter shows up only in the debug state (`GameView.tsx:4224`). "Needs you" never lists it.
  - The headless CLI has no bonded First, so I could not count the gap between chapters there. The build ticket counts it in the browser instead.
- **Decision recorded** on THR-2263 with the options weighed: a wall-clock hold, holding until the player acts, a longer hold, and slowing the engine's chapter supply. THR-2263 is closed under the design-request carve-out, because its Done-when is met.
- **Filed** [A quiet day on the map between chapters](https://linear.app/threadbare/issue/THR-2266/a-quiet-day-on-the-map-between-chapters-after-a-chapters-aftermath). It is in Ready for Dev, unassigned, with `Claimable from: 2026-11-21T02:30:00Z` and a coordination block. It is mutex with [The Mandate arrives with its first mention](https://linear.app/threadbare/issue/THR-2265), because both change the moment after an Aftermath closes. It has no plan doc: it is one hold reason, one constant and one "Needs you" row.

## Escalations

None.

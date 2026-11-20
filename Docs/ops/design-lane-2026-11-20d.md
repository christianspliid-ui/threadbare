---
lane: tb-design-lane
run: 2026-11-20d
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-20 (run d, ~23:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The Doom panel's left column shows raw numbers](https://linear.app/threadbare/issue/THR-2270/the-doom-panels-left-column-shows-raw-numbers-speed-modifier-090-doom): the Doom dialog stops printing engine numbers.
  - "Counter-omens 2" and "Doom debt +1.0" become one row, **"Next Doom card: Lands harder"** or **"Lands softer"**. The row hides when the two cancel out, or when no stage is left to come.
  - "Speed modifier ×1.05" becomes **"Pace: Hastened"** (or "Slowed"). That row tells you your own bargains paid in Doom sped the age up.
  - The Mandate dialog keeps its count of the counter-omens you earned.
  - Veto in chat. The build waits until 11:30Z (12:30 local) for that.

## Work

- **Claimed** [The Doom panel's left column shows raw numbers](https://linear.app/threadbare/issue/THR-2270/the-doom-panels-left-column-shows-raw-numbers-speed-modifier-090-doom) under Step 2 rule 1. The shelf was thin: 2 items in Ready for Dev, both waiting out their veto windows. This ticket is a UI-legibility bug, so it falls inside the period focus. It was filed last run and left out of the Doom-panel layout fix on purpose.
  - The briefing held no vetoes, and the lane had no claims to resume or open maps to work.
  - Every other agreed UI plan-doc candidate in Todo already has a design (listed in run c). [Which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174) is your open question.
- **Measured** on main @ `470b0fae`:
  - At each stage's start, the engine nets debt and omens into one weight for that stage's Doom card (`phaseDoom.ts:292-300`).
  - Debt 1 with 2 omens lands the card exactly as written. Today the dialog shows a green "2" beside an orange "+1.0" for that case.
  - Stay the Unmaking never changes the stored pace (since THR-2207). The "speed modifier" is moved only by Bargains paid in Doom (+0.05 each) and by teaching the dark. The ticket's own premise ("×0.90 while Stay holds") was wrong.
- **Decision recorded** on the ticket, with the options weighed.
  - The description now holds a four-item build spec and Done-when: one shared reader for the next card's weight (Law 3), two reworded rows, and a new named float-noise constant.
  - The ticket is in Ready for Dev, unassigned, with a coordination block (sonnet; mutex with anything editing `DoomClockDetail.tsx`). It is claimable from 2026-11-21T11:30Z.

## Escalations

None.

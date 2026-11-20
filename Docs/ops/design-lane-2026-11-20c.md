---
lane: tb-design-lane
run: 2026-11-20c
promoted: 1
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-20 (run c, ~20:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The Doom panel scrolls at its last stage](https://linear.app/threadbare/issue/THR-2269/the-doom-panel-scrolls-at-its-last-stage-at-19201080-the-stage-list) — the Doom dialog now fits on one screen. Each Doom card shows once, in the stage that dealt it. The "Recent consequences" list goes, because it repeated those same cards. Passed stages fold to their names, and you can open one to read it again. The "1.23x" severity numbers go. The dialog says "stage" instead of "chapter", because a chapter is a story. It is a layout fix with no change to how the Doom plays, so the build has no hold. Veto in chat.

## Work

- **Claimed** [The Doom panel scrolls at its last stage](https://linear.app/threadbare/issue/THR-2269/the-doom-panel-scrolls-at-its-last-stage-at-19201080-the-stage-list) under Step 2 rule 1 (the shelf was thin: 2 in Ready for Dev, both on veto hold). It is a period-focus (UI legibility) bug. There were no vetoes in the briefing, no own claims to resume, and no open maps. Every agreed UI plan-doc candidate in Todo already has a design: [the mortal's mid-game](https://linear.app/threadbare/issue/THR-1859), [outcome words](https://linear.app/threadbare/issue/THR-1860), [Read the Threads](https://linear.app/threadbare/issue/THR-2225), [rivals](https://linear.app/threadbare/issue/THR-2172), [stop only for real decisions](https://linear.app/threadbare/issue/THR-2203), [read the race](https://linear.app/threadbare/issue/THR-2246) and [Doom's last stage](https://linear.app/threadbare/issue/THR-2247). [Which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174) is your open question, so it was left alone.
- **Measured** on main @ `651e44a6`:
  - A stage deals one Doom card (two at stage 5), once, on the tick it begins (`doomClock.ts:641-655`, `phaseDoom.ts:525-539`).
  - The dialog draws each card up to three times: as an authored title (`DoomClockDetail.tsx:374-389`), as a resolved card (`:391-414`), and under Recent consequences (`:424-453`).
  - The finding's own sizes put the fixed right column at about 600px, inside the 745px body.
- **Decision recorded** on the ticket, with the options weighed. The description now holds a six-item build spec and Done-when. The ticket is in Ready for Dev, unassigned, with a coordination block: sonnet, parallel-safe with [the Mandate arrives with its first mention](https://linear.app/threadbare/issue/THR-2265) and [a quiet day between chapters](https://linear.app/threadbare/issue/THR-2266), and claimable now.
- **Filed** [The Doom panel's left column shows raw numbers](https://linear.app/threadbare/issue/THR-2270/the-doom-panels-left-column-shows-raw-numbers-speed-modifier-090-doom) (Idea, unassigned). "Speed modifier ×0.90", "Doom debt +0.4" and a bare Counter-omens count break UI Law 13. That fix needs a reading per row, so it was kept out of this slice.

## Escalations

None.

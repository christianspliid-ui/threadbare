---
lane: tb-design-lane
run: 2026-10-08d
promoted: 0
filed: 4
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-08 (run d, ~18:20Z)

## Needs Christian

Nothing needs you this run.

## Decided for you

- [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond). This decision has four parts:
  - **One reputation row per mortal.** The six identical "World Standing" rows were one mortal's reputation, counted again on every chapter step. An ending now shows one row per mortal, with their name and the word "reputation", as their character sheet says.
  - **The ▲ scale is explained.** The legend at the top of an ending explains ▲ as slight, clear or great.
  - **One odds word per step.** A chapter step shows only one odds word. Star's skill word "Fated" becomes "Charted", so it no longer looks like an odds word.
  - **The seat is always in a town and always findable.** Your god's seat always lands in a town, never empty wilderness. A "Seat: <town>" line on your god's bar jumps the map to it. You are not asked where to put it.
  - Building waits until 20:25 Friday your time.
  - *To veto, say:* **"keep the word standing"**, **"let me choose where the seat goes"** or **"keep Fated for Star"**.

## Work

- **Resumed:** nothing. No `design-lane claim` or `checkpoint` was open, and no veto was in the briefing.
- **The shelf was not thin:** 13 items in Ready for Dev.
- **Dominion map ([Wayfinder map — Dominion](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run)): no ticket was workable.**
  - [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) still waits on [the sphere-score seeding bug](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no). Five tickets wait on the formula.
  - [How a player's gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on your A/B call on [the buy system](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the).
- **Decided:** [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond).
  - **Why this ticket:** it was the older of the two warm-playtest design tickets that run c left for this lane.
  - **Process:** claimed with the lane marker. The decision record was posted on the ticket, and the ticket was closed Done (verified).
  - **Measured on `ca089d08`, and it corrected two of the ticket's own guesses:**
    - The rows have no counterparty. They are the mortal's own `reputationScore`. Three producers add a row on each step, and the steps only ever add rows. The residual producer reports the total change, so one movement shows twice.
    - There is no chapter-level fate tier. The three words are the Star skill word, the live forecast, and the "your hand: X → Y" line.
    - The "seat" tag on the map's held-by line is a faction's court seat, not the god's.
- **Filed** into the Warm playtest · round 1 milestone. All four are Todo and unassigned, and three carry a `Claimable from: 2026-10-09T18:25:00Z` hold and a coordination block:
  - [An ending shows one reputation row per mortal, named](https://linear.app/threadbare/issue/THR-1789/an-ending-shows-one-reputation-row-per-mortal-named-fold-the-per-step) (engine, copy and legend)
  - [UL-proposal: Star's "Fated" → "Charted"](https://linear.app/threadbare/issue/THR-1790/ul-proposal-stars-third-skill-word-fated-charted-so-a-skill-word-never)
  - [One odds word per chapter step](https://linear.app/threadbare/issue/THR-1791/one-odds-word-per-chapter-step-the-hand-shift-line-says-which-way-the) (UI and copy; blocked by the UL proposal)
  - [The god's seat is named and findable](https://linear.app/threadbare/issue/THR-1792/the-gods-seat-is-named-and-findable-a-seat-line-on-the-gods-bar-that) (engine and UI; blocked by [the warm-start ticket](https://linear.app/threadbare/issue/THR-1787/the-warm-start-should-arrive-with-the-opening-already-played-settle), because both edit seat placement)
- **Left for a later run:** [Warm brief v1 tripped its kill criterion](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage).

## Escalations

None.

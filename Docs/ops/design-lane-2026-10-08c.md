---
lane: tb-design-lane
run: 2026-10-08c
promoted: 0
filed: 3
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-08 (run c, ~12:20Z)

## Needs Christian

Nothing needs you this run.

## Decided for you

- [A returning player is greeted by the opening again](https://linear.app/threadbare/issue/THR-1782/a-returning-player-is-greeted-by-the-opening-again-after-the-warm-up). A warm world now arrives with the opening already played. Your god is never again asked to "Reach Down" to a mortal it is already bound to. The three opening gifts that offer no choice (the Seat, the Thing Left Behind, the First Word) are settled before the seasons run, so the god has a seat and a whisper while it is away. Only "A Path Opens" (dreamer, prophet or patron) waits for you. The First's story moments say "The Call" instead of "Beat 1 — Call". *To veto, say:* **"let warm testers play the opening gifts"** or **"give returning players a while-you-were-away screen"**. Building waits until 14:45 Friday your time.

## Work

- **Resumed:** nothing. No `design-lane claim` or `checkpoint` was open.
- **Dominion map ([Wayfinder map — Dominion](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run)): no ticket was workable.**
  - [The formula settled](https://linear.app/threadbare/issue/THR-1760/the-formula-settled-normalisation-the-gods-power-factor-and-the-five) waits on [the sphere-score seeding bug](https://linear.app/threadbare/issue/THR-1768/sphere-scores-never-land-where-dominion-must-read-them-the-god-has-no), which is in Ready for Dev.
  - Five more tickets wait on the formula.
  - [How a player's gods grow across runs](https://linear.app/threadbare/issue/THR-1773/how-a-players-gods-grow-across-runs-what-a-second-fifth-and-twentieth) waits on [the reserved A/B buy-system fork](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the).
- **The shelf was not thin:** 13 items in Ready for Dev.
- **Decided:** [A returning player is greeted by the opening again](https://linear.app/threadbare/issue/THR-1782/a-returning-player-is-greeted-by-the-opening-again-after-the-warm-up).
  - Why this ticket: it was the oldest of the three warm-playtest design tickets that name this lane.
  - It was claimed with the lane marker, the decision record was posted on it, and it was closed Done (verified).
  - Measured on `ca089d08`:
    - The brief says the opening was played (`scripts/cold-playtest/player-brief-warm.md` lines 1, 11).
    - Beat 0 only grants two cards and seeds nothing (`src/data/ascendant-beat-content.ts` ~110-114).
    - "Beat 1" is the journey modal's footer index (`src/components/Game/JourneyVignetteModal.tsx` line 236).
    - The catch-up screen reuses the "Lives on" line (`src/data/ui-content.ts` ~568-571).
- **Filed** into the Warm playtest · round 1 milestone. All three are Todo and unassigned, each with a `Claimable from: 2026-10-09T12:45:00Z` hold and a coordination block:
  - [A bonded First is asked to "Reach Down" again](https://linear.app/threadbare/issue/THR-1786/a-bonded-first-is-asked-to-reach-down-again-beat-0-should-settle-as) (engine)
  - [The warm start should arrive with the opening already played](https://linear.app/threadbare/issue/THR-1787/the-warm-start-should-arrive-with-the-opening-already-played-settle) (engine + copy; blocked by the first)
  - [The First's story moments are footed "Beat 1 — Call"](https://linear.app/threadbare/issue/THR-1788/the-firsts-story-moments-are-footed-beat-1-call-an-internal-index-that) (UI)
- **Left for later runs:**
  - [Outcomes still can't be read](https://linear.app/threadbare/issue/THR-1784/recurs-after-fix-twice-outcomes-still-cant-be-read-six-identical-bond)
  - [Warm brief v1 tripped its kill criterion](https://linear.app/threadbare/issue/THR-1785/warm-brief-v1-tripped-its-kill-criterion-2-of-3-testers-were-coverage)

## Escalations

None.

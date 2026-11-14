---
lane: tb-design-lane
run: 2026-11-14e
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-14 (run e, ~20:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Read the Threads returns only a tally](https://linear.app/threadbare/issue/THR-2225/read-the-threads-costs-a-dozen-essence-and-a-short-look-back-returns): **paying more for Read the Threads now always shows more, never less.**
  - **What went wrong:** the story tester paid 12 essence for the longest look back (3 days). That read blurred everything it covered into counts like "2 encounters: 2 succeeded". It even blurred the last half day, which the cheapest read (2 essence) shows in full. The most expensive read gave the least.
  - **The fix:** each chapter fades by its own age. A 3-day read shows the last half day in full and lets only older days fade. The original attention design already said this: "threads of the past fray with time".
  - **Faded days still tell a story:** each faded group opens with one story line about its biggest chapter, naming the mortal, in the same words as the mortal's Story So Far. The count sits under it.
  - **Each window says what it buys** before you pay, e.g. "3 days: the last half day in full, older days fading to a line each".
  - **Also fixed:** at the faded level, the "Notable" heading showed with nothing under it.
  - Built in [A longer look back is always more, not less](https://linear.app/threadbare/issue/THR-2235/a-longer-look-back-is-always-more-not-less-read-the-threads-fades-each).
  - **Veto:** say "keep deep reads blurry" if a long look back should stay a blur on purpose. The build is held for your veto until 08:35 UTC tomorrow.

## Work

- **Claimed** [Read the Threads returns only a tally](https://linear.app/threadbare/issue/THR-2225/read-the-threads-costs-a-dozen-essence-and-a-short-look-back-returns) (claim marker `dl-20261114T2019Z`). Why this one: the build shelf holds 6, so it is not thin. Every wayfinder map is closed. All four UI-legibility plans are done. This was the newest UI-led finding from warm round 4 with no decision yet, and nothing it relies on is inside a veto window.
- **Measured** on main @ `3d128efd`:
  - The panel works out one detail level per read from the window length (`ReadTheThreadsPanel.tsx:141-155, :598`). The 3-day read (`READ_THREADS_COST_36 = 12`) is the faded level for every row.
  - At the faded level, Notable rows draw nothing (`:186`), even though `:473` says they always show.
  - Story lines already exist in `threadDigest.ts` (`scoreSignificance`, `buildBeatLine`).
  - The finding's own diagnosis had the threshold backwards: the faded level starts above 24 ticks, not at 24 or below. This is corrected in the decision record.
- **Decision record** posted on the finding. The finding went back to Todo, unassigned, blocked by the build (verified).
- **Filed** [A longer look back is always more, not less](https://linear.app/threadbare/issue/THR-2235/a-longer-look-back-is-always-more-not-less-read-the-threads-fades-each):
  - Ready for Dev, unassigned, in the *Warm playtest · round 4* milestone (verified).
  - `Claimable from: 2026-11-15T08:35:00Z` is in its description.
  - Its coordination block is the latest comment: parallel-safe with all six Ready tickets, no mutex.
  - No plan doc: it is one slice, and the ticket body carries the plan with all three pillars and a Done-when.

## Escalations

None.

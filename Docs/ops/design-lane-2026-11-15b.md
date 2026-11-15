---
lane: tb-design-lane
run: 2026-11-15b
promoted: 0
filed: 1
resolved: 0
newFindings: 0
needsChristian: true
---
# Design lane — 2026-11-15 (run b, ~05:18Z)

## Needs Christian

- **Should every one of The First's own chapters give you a hand?** Today about 1 in 4 of Kael's chapters is "Theirs alone": it plays out without you and says so. Two of three warm testers asked for cards in every one. Your options:
  - (a) Keep it as now.
  - (b) Every story chapter of The First deals you a small hand on its first step. That means about 4 more stops per 300 ticks, from about 10 to about 14.

  The lane leans (b), because canon calls a chapter "a moment … the player decides what kind of god to be toward it". But it changes how The First's life feels, so it is your call. Say "every chapter asks" or "keep theirs alone". Details: [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows).

## Decided for you

- [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows): **the Play button stops promising more than the game does.**
  - **What went wrong:** in warm round 4 the story tester read the chapters Kael plays out alone as the game breaking its word. The first Play tooltip says the world "stops again for every moment that matters".
  - **What is really happening:** the "Waits for you" and "Theirs alone" words are honest. 30 of the 32 chapters marked "Waits for you" really stopped. Only the tooltip over-promises.
  - **The fix:** the tooltip will read "Play lets mortals live their days, and it stops whenever a moment waits for your hand. Chapters marked 'Theirs alone' play out without you; you can read them after."
  - **Kept as it is:** which chapters stop. That question is the one above.
  - Built in [Play promises only what it keeps](https://linear.app/threadbare/issue/THR-2238/play-promises-only-what-it-keeps-the-first-run-play-tooltip-says-the).
  - **Veto:** say "keep the old Play line". The build is held for your veto until 17:40 UTC today.

## Work

- **Claimed** [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174) with the marker `design-lane claim dl-20261115T0518Z`.
  - Why this one: the build shelf holds 5, so it is not thin. No wayfinder map is open. Your icon picks are the only open UI-project tickets.
  - Warm round 4 marked this finding *not met for one tester*, and the 2026-11-14f run set it aside for a run with a measurement first. Its main work is legibility, the period focus.
- **Measured** on main @ `02cd1510` with a census on [`proto/thr-2174-alone-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2174-alone-census) (never merged). Warm route, seeds 42, 99 and 7, ticks 300 to 600, every held step released with no card:
  - The First started 44 story chapters. 12 were theirs alone (27%), and they came from 11 different chapter templates.
  - 32 were marked "Waits for you", and 30 of them stopped.
  - The longest run of alone chapters on any seed was 2.
  - The Fated shortcut fired twice, both times on chapters that stopped on another step.
  - The first count wrongly included chapters that had finished during the warm-up. It was fixed before any number above was taken.
  - Caveat: seed 42 run twice gave different chapter lists (three processes in parallel the first time, one the second). The shape held across seeds, but the exact lists did not.
- **Filed** [Play promises only what it keeps](https://linear.app/threadbare/issue/THR-2238):
  - Ready for Dev, unassigned, in the *Warm playtest · round 3* milestone (verified).
  - `Claimable from: 2026-11-15T17:40:00Z` is in its description.
  - Its coordination block is the latest comment: parallel-safe with every Ready ticket, no mutex.
  - No plan doc: it is one copy string, so the ticket body is the plan.
- **Decision record** posted on the finding. Released to Todo, unassigned, blocked by the build. The "every chapter asks" fork is written there with the options.

## Escalations

None.

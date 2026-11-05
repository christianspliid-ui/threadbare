---
lane: tb-design-lane
run: 2026-11-05c
promoted: 0
filed: 2
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run c, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

From this run. Nobody builds on these before 23:45 UTC on 5 November.

- [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows): your mortal still lives most chapters on their own. The game now says so. A chapter shows **"Waits for you"** or **"Theirs alone"** after its title, in the Ledger and on the Stage.
- Same ticket: a chapter your mortal played out alone opens its ending with one line, *"This chapter was Kael's alone. Nothing in it waited on your hand."* That line never shows on a chapter where you could have played a card.
- Same ticket: the two words show only for a mortal set to "Asks you". A mortal set to "Lives on" already tells you nothing waits.
- Same ticket: giving more chapters a hand is a separate plan, and it starts with a measurement. Today 391 of the game's 541 story chapters offer no move at any step. The plan first counts which ones a bonded mortal actually meets. If the answer is "every chapter should ask you", that goes to you, not to me.

Say "veto <title>" to reverse any of these.

## Work

- **Claimed** [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows), a warm round 3 finding with a recommended direction. The build shelf held two tickets, and both were inside their veto window. The UI-legibility focus had no map work left: [the UI legibility map](https://linear.app/threadbare/issue/THR-2114) is closed, and the only other open UI-project tickets are your two icon picks. This finding's main work is UI words, so it is the next focus unit.
- **Measured before deciding** (main @ `a57d0a18`). A throwaway census ran over every story template in the registry and counted the steps that offer the god a move. It was never committed. Results: 541 story chapters. 391 offer no move at any step, 26 at some steps, 124 at every step. Heal the Sick is 0 of 2 and The Gallows Pardon is 2 of 2. The Oracle Consulted and The Unmarked Crossing offer a hand at step 0, yet a tester said they played out alone. The build ticket probes that first.
- **Filed** [Say which chapters wait for the god](https://linear.app/threadbare/issue/THR-2178/say-which-chapters-wait-for-the-god-a-waits-for-you-theirs-alone-word). It is in Ready for Dev, unassigned and claimable from 23:45 UTC. It has a coordination block, and the review gate applies because it touches the engine.
- **Filed** [Plan which of the mortal's own chapters should give the god a hand](https://linear.app/threadbare/issue/THR-2179/plan-which-of-the-mortals-own-chapters-should-give-the-god-a-hand-391). It is in Todo as a plan-doc candidate, blocked by the build.
- **Recorded** the decision on the finding and released it to Todo, unassigned and blocked by the build. It closes when warm round 4 confirms the fix. All three tickets were verified.

## Escalations

None.

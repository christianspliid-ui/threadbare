---
lane: tb-design-lane
run: 2026-11-14c
promoted: 0
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-14 (run c, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The mid-game words still mean nothing (seventh recurrence)](https://linear.app/threadbare/issue/THR-2224/recurs-after-fix-seven-times-the-mid-game-words-still-mean-nothing): **half of this complaint came from the test, not the game.**
  - **Warm testers have been playing a showcase world.** The warm-playtest link loads a developer test kit. It gives the god 11 made-up "Hooks" (pacts and clues with nothing to finish) and a little essence in every pool, including Order and Light. That is the "Hooks · 11 unfinished" all three testers quoted, and the Order pool one tester never knew they had. From now on the warm start skips that kit: [Warm playtests arrive in a real world](https://linear.app/threadbare/issue/THR-2230/warm-playtests-arrive-in-a-real-world-the-warm-start-stops-loading-the).
  - **On a chapter screen, dots mean only the odds.** Today the header shows the mortal's skill as a word plus five dots ("Heart · Revered ●●●●●"), right above cards whose dots are the odds. The header keeps the word and drops its dots.
  - **The Elder powers row shows up the first time a card's price names an elder pool**, not only after the player pays from one or hovers the card.
  - **The card tags' hovers get checked on cards you can't afford.** In the code every tag has a hover, but testers saw none. The builder tests this in the browser first and fixes it only if it is broken. These three are built in [One mark, one meaning on the Stage](https://linear.app/threadbare/issue/THR-2231/one-mark-one-meaning-on-the-stage-the-steps-standing-reads-as-a-word).
  - **No new words for the rail.** Hooks and Signatures already stay hidden until you have one. The next warm round, in a real world, shows whether they still confuse.
  - **Veto:** say "keep the test kit" if warm rounds should keep the showcase world on purpose. Both builds are held for your veto until 02:40 UTC tomorrow.

## Work

- **Unit chosen:** decide a finding's design question (the period focus is UI legibility, and this was the open legibility finding). The shelf held four items, so it was not thin. No wayfinder map is open. The UI legibility map is closed, and its four plan docs are done. Today's two earlier runs had already designed every agreed parent ticket ([Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202), [Stop the world only for real decisions](https://linear.app/threadbare/issue/THR-2203), [Put the god in the climax](https://linear.app/threadbare/issue/THR-2204), [Measure whether the player matters](https://linear.app/threadbare/issue/THR-2205)).
- **Claimed** [the mid-game words finding](https://linear.app/threadbare/issue/THR-2224/recurs-after-fix-seven-times-the-mid-game-words-still-mean-nothing) with the marker `design-lane claim dl-20261114T1418Z`. Measured all four diagnosed screen sites on main @ `96510de7` before deciding; file and line evidence is in the decision comment.
  - The warm link `?view=game&seeded&size=medium&warm=300` counts as the dev quick-start (`App.tsx:286`), so it runs `devSeedAscendantTestPackage` (`gameInit.ts:1113`). That adds 4 conditions, 3 clues and 4 agreements, which are exactly the 11 Hooks.
  - The step header's standing uses `ReachStanding` inline layout with five round dots. That header is the layout's only caller in the game.
  - Hooks and Signatures rows already have `rendersWhenEmpty: false`.
  - Card-mark hovers are wired in the code (verb, keyword and reach marks). Testers reported none, so the build tests in the browser before it fixes anything.
- **Filed** two build tickets into *Warm playtest · round 4*, both Ready for Dev, unassigned, with `Claimable from: 2026-11-15T02:40:00Z` in the description and a coordination block as the latest comment:
  - [Warm playtests arrive in a real world](https://linear.app/threadbare/issue/THR-2230/warm-playtests-arrive-in-a-real-world-the-warm-start-stops-loading-the): should land before warm round 5.
  - [One mark, one meaning on the Stage](https://linear.app/threadbare/issue/THR-2231/one-mark-one-meaning-on-the-stage-the-steps-standing-reads-as-a-word): kept apart from the climax builds, because they touch the same files.
- **Released** the finding to Todo, unassigned, blocked by both builds. Its Done-when (builds filed and Done) closes it later, and warm round 5 checks its Fixed-when.

## Escalations

None. One thing for whoever reads round 4's results: the Hooks and elder-pool lines in warm rounds 1–4 were measured on the test kit. Round 5 will not compare line for line on those two.

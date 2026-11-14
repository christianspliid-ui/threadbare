---
lane: tb-design-lane
run: 2026-11-14f
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-14 (run f, ~23:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The Mandate bar says the mortal's deeds fill it, but they never do](https://linear.app/threadbare/issue/THR-2199/the-mandate-bar-says-the-mortals-deeds-fill-it-but-they-never-do-after): **the Mandate now says what moves it.**
  - **What went wrong:** in warm round 4 the Mandate still read "Holding" for most of the session. This was the veteran's quit point. The skimmer said "it says it's filled by Mind and Spirit, but my pools are full and the bar looks empty".
  - **What is really happening:** playing any card on Kael's chapter already raises the Mandate. A card with no sphere of its own is paid in the god's main sphere, and that is also the Mandate's main sphere. Without a card, nothing moves. A god who plays nothing gets no credit in 300 ticks; one Mind essence per chapter gets 42 credited chapters. The screen says the opposite: "Filled by what you and the one mortal bound to you raise". Full pools mean nothing was spent.
  - **The fix:** the line now names the act: "Rises when you spend Mind or Spirit essence on Kael's chapters, or on places." "Rising" now lasts three days instead of one. Today it fades before the next chapter you can play into arrives, which reads as progress lost.
  - **Kept as it is:** the rule itself. Only chapters you put essence into count, as decided in [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202).
  - Built in [The Mandate says what moves it](https://linear.app/threadbare/issue/THR-2236/the-mandate-says-what-moves-it-the-fill-line-names-the-spend-rising).
  - **Veto:** say "the mortal alone should fill it" if Kael's chapters should count even when you play nothing. The build is held for your veto until 11:30 UTC tomorrow.

## Work

- **Claimed** [The Mandate bar says the mortal's deeds fill it, but they never do](https://linear.app/threadbare/issue/THR-2199/the-mandate-bar-says-the-mortals-deeds-fill-it-but-they-never-do-after) with the marker `design-lane claim dl-20261114T2320Z`. Why this one: the build shelf holds 7, so it is not thin. Every wayfinder map is closed, and the four UI-legibility plans are done. The two open UI-project tickets are your icon picks. Warm round 4 marked this finding as *recurred* (2 of 3 testers), and it had no decision after its first fix shipped. Its main work is legibility, the period focus.
- **Measured** on main @ `b7ab4c12`:
  - `npm run census:mandate -- deeds-none seeded`: 0 credited chapters in 300 ticks, ledger 0.0 / 0.0.
  - `npm run census:mandate -- deeds seeded`: 42 credited chapters, ledger 28.3 of 87. That is about 0.8% of the bar per chapter at one essence each.
  - The default card price comes from the god's primary sphere (`buildNudgePhaseModel.ts:981`), and the Mandate's spheres are the same alignment (`mandateGenerator.ts:105`).
  - The trend window is 12 ticks (`game-config.ts:174`). A chapter you can play comes about every 25 ticks: one chapter about every 7 ticks, about 28% of which offer a move.
- **Decision record** posted on the finding.
- **Filed** [The Mandate says what moves it](https://linear.app/threadbare/issue/THR-2236/the-mandate-says-what-moves-it-the-fill-line-names-the-spend-rising):
  - Ready for Dev, unassigned, in the *Cold playtest · round 7* milestone (verified).
  - `Claimable from: 2026-11-15T11:30:00Z` is in its description.
  - Its coordination block is the latest comment: parallel-safe with all seven Ready tickets, no mutex.
  - No plan doc: it is one slice of copy and one constant. The ticket body carries the plan and the Done-when, including a browser check that the deed line actually shows after a played chapter. No round 4 tester mentioned seeing it.
- **Closed** the finding under the design-request carve-out. Its Done-when (build ticket filed into the same milestone, then closed by the design pass) is quoted in the decision comment. Round 8 checks the Fixed-when.
- **Not taken this run:** [The player can't tell which chapters wait for their cards](https://linear.app/threadbare/issue/THR-2174) and [Rival gods are a threat you can see but never answer](https://linear.app/threadbare/issue/THR-2172). Both were *partly met* in round 4. Two of three testers now want a hand in every one of Kael's chapters. Whether to give it to them changes the pacing of most chapters, so it needs its own run with a measurement first.

## Escalations

None.

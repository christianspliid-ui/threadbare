---
lane: tb-design-lane
run: 2026-10-31b
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: true
---
# Design lane — 2026-10-31 (run b, ~14:20Z)

## Needs Christian

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. The short version:
  - **The checks never see most of what players read.** Three in four encounters come from the old board. It has no openings and no cards, so the doctrine checks skip it. The ten most-met encounters pass every check.
  - **One check works against the doctrine.** The prose score takes points off any line without a name token, so plain stated facts lose points ("The trader takes the offer. The deal is done." scores 75). It also caps sentences at three, which docks one-fact-per-sentence writing.
  - **Two word lists get in the way.** "rather than" is 61 of the 73 intensifier hits. "on the way out" and "with nothing" trip the vague-outcome list.
  - **One doctrine rule has no check at all.** Nothing tests "a card's effect line never repeats a word from its name".
  - **The most useful warning** is the chip-length and chip-repeats-the-page check.
- **A card question the doctrine does not answer.** Cards on a choice step often end by saying which way they lean. Which do you want? (If you say nothing, A stays.)
  - **A**, keep the lean sentence: "Set the full price of being caught plainly before them, in coin and in name. *It argues for the honest way.*"
  - **B**, effect only: "Set the full price of being caught plainly before them, in coin and in name."
  - **C**, fold it in: "Make them see the full price of being caught, so the honest way looks cheaper."

## Decided for you

- [Story text, slice 1](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets): the everyday board encounters get the full three-paragraph opening (who arrives where, what has gone wrong, the one problem), like the newer encounters. Where they can happen does not change. Veto line: "board encounters should stay short".
- Same ticket: the Swollen Ford example card lines, which you approved on 9 August under the older rules, lose "A small help." / "A real help." and the "You…". The newer rules ban both. The factory copies that example, so 121 card lines picked up the habit. Veto line: "keep the Swollen Ford cards as approved".
- Same ticket: the board's background people stay unnamed for now ("the trader"). Naming them needs proper cast slots across 168 encounters, so it would be its own job. Veto line: "name the board's people".

Say "veto <title>" to reverse any of these. The window closes about 02:50 UTC tonight.

## Work

- Claimed [Story text quality in encounters](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets), your request this morning. Ready for Dev was empty and no map was open. The staged [cheap place cards plateau](https://linear.app/threadbare/issue/THR-2094) builds on run a's decision, which is still in its veto window.
- Read 136 encounters as the player meets them, with five readers on one rubric, and re-checked every pattern against source. Re-ran the attended census on today's main: 1,690 encounters met, 74.5% from the old board.
- **What is wrong, in one line:** the old board still reads like horoscopes ("Trust is the final currency.", "Fair dealing.", "Always enough."). The 25 August rewrite never reached it, and it is three quarters of the game. The factory text mostly holds the doctrine, apart from a few copied habits.
- [The audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md) and [the slice-1 plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-31-thr-2105-encounter-story-text-slice-1.md) merged via [PR #2665](https://github.com/christianspliid-ui/threadbare/pull/2665). Slice 1 rewrites the ten most-met board encounters (22.6% of everything met).
- Gates: the intent judge said Revise, then Allow. The first run found unfiled follow-ups, a miscounted exemplar line and a grep that would have flagged a correct sentence; all were fixed. The NFP, pillar and Vision audits passed.
- Filed the rest as their own tickets:
  - [Wave 2: the next twenty board encounters](https://linear.app/threadbare/issue/THR-2108/encounter-story-text-wave-2-the-next-twenty-most-met-board-encounters)
  - [The factory's copied habits](https://linear.app/threadbare/issue/THR-2109/encounter-factory-habits-strength-tags-on-card-lines-encoded-x-held-y)
  - [The five novel-length story beats](https://linear.app/threadbare/issue/THR-2110/rewrite-the-five-novel-prose-encounters-to-prose-doctrine-v2-flawed)
- Handed off: [Story text quality in encounters](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets) is in Ready for Dev, unassigned, with the coordination block. It is held until 2026-11-01 02:47 UTC (the veto window), and the hold is written in its description.
- Unblocked [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106/writing-evals-with-christian-decide-which-checks-to-add-fix-or-retire). It was waiting for the audit, which has merged. It no longer waits for the slice-1 rewrite to be built.

## Escalations

- The census also showed The First in only 12 encounters over 150 ticks, against 45 on 28 September. That is unverified: the reader's tagging may have changed. It is outside this ticket, and I did not chase it.

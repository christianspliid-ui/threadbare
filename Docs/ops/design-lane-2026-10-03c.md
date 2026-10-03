---
lane: tb-design-lane
run: 2026-10-03c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-03 (run c, ~12:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [After the bond the game lives The First's life without the player](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her): **The First's important moments now stop the world and wait for you, and her everyday chores no longer show up as chapters.** Two of the three round-2 testers quit at exactly this point. The calls I made:
  - **After an important moment ends, she lives two days of ordinary life before the next one can start.** *This is the call to veto if you disagree.* Without it, a new moment would stop the world about every seven seconds at normal speed, because she reaches for a new scene every 6 to 8 turns. With it, you get roughly 5 to 8 of her moments in the first 150 turns. If that is too few or too many, it is one number.
  - **She is born asking.** Her bond starts set to stop and ask, not to resolve on its own. This is the store page's "when the moment matters you whisper" and your 27 September ruling that time stops for every moment.
  - **Chores are the encounters already written as trivial:** mending, foraging, resting, the harvest. They still happen and still count. They sit under a new **Daily life** filter in the Chapter Ledger, one click away, instead of filling its main list and its badge.
  - **The Auto/Pause switch on her row works now.** It could never reach pause for her before, and it did not visibly change when clicked. It now reads **Asks you** / **Lives on**.
  - **Changing it is free.** It was meant to cost 2 essence, but that charge never once worked. Say so if you want paying attention to cost something.
  - **The Ledger badge counts unread important moments, not chores.** The ticket suggested counting "moments waiting on you", but under this plan a waiting moment is already open on screen.

  Plan: [The First asks](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1715-the-first-asks.md). Say "veto first asks" to reverse it, or name the one call you disagree with. Not ready for you to look at until it is built. The veto window closes around 14:50 Sunday your time.

## Work

- **Chosen:**
  - The build shelf held well over 4 jobs, no map was open, and nothing was staged for design.
  - This was the one Urgent agreed ticket waiting on a plan, filed from [the round-2 cold playtest](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md) with its outcome already set by the store page.
- **Measured before deciding** (current main, the dev identity with The First seeded, medium map, seeds 42 / 99 / 7, 150 turns):
  - She started 22 to 27 chapters per world. 4 to 11 of them were chores, every one written as trivial; the rest were real scenes.
  - **Not one of her chapter steps ever offered you a hand of cards.** Of the step prompts the game built for her, two were built and both expired unseen. All she produced were aftermath cards that resolved on their own.
  - The reason is in the code. Her bond was born "auto". Her scenes are a tier that only asks after you have answered a thread tug. And the switch could not reach pause for a new bond.
  - Her scenes come every 6 to 8 turns (one real second each at normal speed), which is why the plan adds a breath between them.
  - Reader and data: [the census reader](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/first-chapters.ts) and [its output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/first-chapters-2026-10-03-thr1715.json).
- **Checks:**
  - The independent plan reviewer allowed it. It flagged two gaps: the plan doc lacked its own section on how we would know it was wrong, and "Daily life" is a new term. Both are fixed.
  - The three side reviews (rules, completeness, vision) all passed with small notes, which were folded in.
- **Plan PR:** [#2194](https://github.com/christianspliid-ui/threadbare/pull/2194).
- **Filed:** [UL-proposal: Daily life](https://linear.app/threadbare/issue/THR-1721/ul-proposal-daily-life-a-mortals-chores-kept-off-the-chapter-ledgers), the glossary entry for the new term. It lands with the build.
- **Handed off:** [After the bond the game lives The First's life without the player](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her) is in Ready for Dev with its build notes. It waits out the 24-hour veto window.
- **Reported, not chased:** the encounter cache rates every older encounter as trivial danger, whatever its author wrote. The step that weighs a mortal's courage against danger therefore cannot tell a forage from a vault heist. It is a separate engine question, recorded in the plan's executor notes for triage.

## Escalations

- None.

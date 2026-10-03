---
lane: tb-design-lane
run: 2026-10-03d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-03 (run d, ~18:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Dilemmas hide the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes now tell you what your hand did.** All three round-2 testers misread these scenes, though they named them as their best moment. The roll itself does not change. The calls I made:
  - **After each roll, one line says what happened.** For example: *"Your hand made it Favorable. Fate turned against you: Kael came out Power-Hungry."* or *"You stayed silent. It stood Uncertain. Fate answered alone, and kindly."* It uses words only, never odds or dice numbers, as your earlier ruling set.
  - **The button says what you are doing.** It reads **"Play your hand, let fate answer"** with cards picked and **"Stay silent, let fate answer"** with none. This applies on every encounter, not only the bonding scenes. The ticket suggested "Whisper", but Whisper is already the name of a card, so I avoided it.
  - **"was Perilous" becomes "your hand: Perilous → Uncertain"**, so it no longer reads as if the roll has already happened.
  - **A bonding card that pulls the mortal one way says so on its face**, for example **"Leans Brave"**. It uses the same words as the character sheet. *This is the call to veto if you think it reads as a promise.*
  - **One judgement against an earlier ruling.** You ruled that the bonding scenes teach in the story only, with no on-screen callouts. I treated the new line as the narrator saying what happened, not a callout. If you disagree, the line can be rewritten to sit fully inside the story.
  - **Ordinary encounters get the new button and the "your hand" line, but not the after-roll line.** The evidence came from the bonding scenes. If round 3 shows the same confusion elsewhere, that is a follow-up.

  Plan: [Show the roll](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). Say "veto show the roll" to reverse it, or name the one call you disagree with. It is not ready for you to look at until it is built. The veto window closes around 20:45 Sunday your time.

## Work

- **Chosen:**
  - The build shelf held well over 4 jobs, no map was open, and nothing was staged for design.
  - This was the highest-priority agreed ticket waiting on a plan, once [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her) had been handed off last run.
- **Measured before deciding** (current main; the real bonding-scene resolver; all 64 bonding dilemmas, 200 seeds each; the bond scene over 1,000 seeds):
  - When every card leans one way, **fate turns it the other way 38.5% of the time.** Your design intends that. The problem was that nothing on screen said so.
  - Playing nothing still gets a good result **35%** of the time in a dilemma, and **53%** in the bond scene. With every bond card played it is **89%**. This is why the veteran's empty-handed third scene felt as good as a paid one.
  - **Finding, not chased:** the "half-landed" outcome never happens in the bonding scenes (0 in 12,800 rolls), so that tier of the meeting is effectively dead. It is recorded in the plan's executor notes for whoever next tunes the meeting.
  - **Finding, fixed by this plan:** the two records the bonding scenes were meant to leave in the trace log were declared when the meeting was converted but never written.
- **Checks:**
  - The independent plan reviewer allowed the plan. It caught that "Whisper" is already a card's name, and that is fixed.
  - Of the three side reviews (rules, completeness, vision), completeness passed outright. Rules and vision passed with small notes, which are recorded in the plan.
- **Plan PR:** [#2200](https://github.com/christianspliid-ui/threadbare/pull/2200), merged.
- **Handed off:** [Dilemmas hide the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) is in Ready for Dev with its build notes. It is held until the 24-hour veto window closes. It must not be built at the same time as [the tooltips ticket](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2) or [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), because they edit the same files.

## Escalations

- None.

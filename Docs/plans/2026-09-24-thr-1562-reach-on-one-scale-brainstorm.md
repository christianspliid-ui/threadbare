# Brainstorm — Reach on one scale (THR-1562)

Companion to `2026-09-24-thr-1562-reach-on-one-scale.md`. The research scripts and their output are kept in the vault at `Brainstorms/2026-09-24-reach-scale-research/`.

## What the research changed about the question

The ticket asked for one choice: normalize the read sites to the dice's 0–1 curve, or re-author the thresholds in raw units. Measuring showed that the first option does not work, and that the bug is wider than ambitions:

- **The dice curve saturates across the protagonist range.** Its midpoint is raw 10, the bottom of a protagonist's roll. Reading thresholds on it lets every protagonist through every floor, and shuts ordinary mortals out of nearly every standard ambition.
- **Seven kinds of check read four different numbers.** The most surprising is the reverse case: guild joins read the curve against raw-authored requirements, so none can ever be offered.
- **The sheet saturates too.** It shows the top skill word in every reach for every protagonist. Fixing it honestly means fixing the dice's curve.

## The options

| Option | Result |
|---|---|
| **A. Read the dice curve** | Protagonists: 100% pass every floor, and 21 of 25 milestones are still met on first check. Ordinary mortals: 0–13% pass. It does not gate the people it should, and gates out the people who should keep local wants |
| **B. Re-author every threshold in raw units** | It works, but content authors then write raw numbers whose meaning depends on the worldgen roll. The next worldgen change silently breaks every threshold again |
| **C. A linear share of a named full point, thresholds stay 0–1** | **Chosen.** Authors keep writing 0–1. One constant ties the scale to the world. It resolves the whole population. And it equals B mathematically, so any calibration B could reach, C reaches by moving one number |

## Choosing the full point

The research swept the full point from 15 to 50 (seed 42; 99 at 30, 40 and 50):

| Full point | Mortals keeping a standard ambition | Protagonist milestones met on first check |
|---|---|---|
| 15 | 87% | 97% |
| 20 | 65% | 93% |
| 30 | 29% | 80% |
| 40 | 16% | 66% |
| 50 | 13% | 51% |

No single point serves both jobs, because they are different jobs:
- **Floors decide who may take up a builder's ambition.** At 40, the capable take them up and ordinary mortals do not. That is what THR-1348's ruling wants ("the world's builders become the people the player can watch"), and minted and grievance ambitions keep 97–100% of mortals wanting something.
- **Milestones pace an ambition once taken.** At 40, two thirds are met on day one. Raising the authored milestones by a quarter paces them like a full point of 50, where about half are met at once and half wait for the capability growth that completing work brings.

So: **full point 40, floors as authored, milestones × 1.25.** It is one scale with one content adjustment, and the reason is recorded.

## Alternatives considered inside C

- **Two full points** (one for floors, one for milestones). Rejected: two scales for one concept is how this bug was born.
- **Milestones as growth** ("gain X in a reach" rather than "reach X"). This is the more honest pacing model, but it is a redesign of milestones with no ticket behind it. It belongs in a later ambition design if the rescale proves too coarse.
- **Read the base instead of the effective score.** Rejected: items, traits and conditions are what the player's choices change. The dice read the effective score, so gates should too. Measured difference: small (2–16 points of pass rate).

## Found while researching, filed separately

- **THR-1575:** the dice curve saturates for every protagonist, and the sheet shows the top word. Christian's call, because it changes the odds everywhere.
- **THR-1576:** colocation chance pins at its bounds (raw × weight), and a dormant role-fit formula saturates.
- **THR-1571** owns the `reach_drain` payment.
- Side finding: `scripts/measure-nudge-headroom.ts` calls `runTick(state, runtime)`, discarding the returned state, so its ticks mode never advances. Noted for the headroom work.

## Vision premises touched

- `00-north-star.md:15`: builders' ambitions go to the capable, who are the ones the spotlight brings into view.
- `02-non-negotiables.md:23`: a milestone met the day it was set tells no story.

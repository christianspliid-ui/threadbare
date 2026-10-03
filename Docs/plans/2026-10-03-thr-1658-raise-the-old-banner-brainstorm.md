# Raise the Old Banner — brainstorm companion (THR-1658)

Companion to [the plan](2026-10-03-thr-1658-raise-the-old-banner.md). The considered alternatives, the tensions, and the Vision premises behind the lane's five decisions. Numbers are from the plan's census table.

## Is it wanted?

The deferral's Done-when allows closing it as not wanted. Against that: the living-world audit Christian adopted with option A named `reclaim_homeland` among the ambitions with no holder at t0, and the past's whole second payoff was "it feeds ambitions". Descent exists on 127–136 mortals per world and today does exactly one thing (a clue's preference for a descendant). A past that only explains the map and never moves anyone is half the payoff. Wanted.

The honest counter-weight is scale: 3–6 heirs per world decide, and the drive will reach perhaps one to three of them in a run. That is fine. A rare hero raising an old banner is a story the player notices because it is rare.

## Why not `reclaim_homeland` itself

Tried first, measured, rejected. The template is an exile's arc: gather followers, grow strong, return. Every heir lives on the old land and none leaves (0 of 12 off it at t0 and at t150). For them *return* is true from the first residence observation, *strength* is already true for about half, and *followers* needs `loyalty` ties nobody writes. Handed to an heir it would be either instantly half-done or a want that finishes because the hero happened to be strong at home. Neither is "wanting the old homeland back".

Variant considered: keep the template and swap its `return` milestone per holder. Rejected: milestones are template data shared by every holder; a per-pursuit override is new machinery for one drive, and it would muddy the exile's drive, which is correct as it stands for `holding_seized` victims.

## Grievance or not (the meaning question)

The ticket flagged this as possibly Christian's. Options:

- **A. Soft drive, no culprit** (chosen). The empire fell 700–1100 years ago. Nobody living did it.
- **B. Grievance against the current holder's leader.** Rejected on evidence: 7 of 12 heirs' towns have no holder at all, so the rule would mostly have no culprit; where there is one, the Realm did not destroy the empire (the elder war was between two dead empires). It would also make every descendant a standing threat to whichever Realm drew the border, which is a political-game premise nobody has agreed.
- **C. Grievance only where a living Realm holds the empire's old seat.** Narrower B; same objection, and seats of dead empires are ruins, not Realm towns.

The line the plan states — *wars in living memory breed grievances, ancient falls do not* — is the line THR-1657 already shipped. The veto stays open: if Christian wants B, the drive moves to the grievance pool with a culprit rule.

## Who and when

- **t0 mint** (the S3 pattern): reaches 1 heir in 3 worlds because slots are full. Rejected as near-dead, and adding displacement at t0 would override THR-1631 Lane decision 5's "no history pulls anyone".
- **Event trigger — a delve at an ancestral ruin:** 0 delves by anyone in 450 measured ticks. Dead substrate.
- **Event trigger — standing at an ancestral ruin:** possible (1–3 heirs per world stand on one), but needs a new mint lane reading positions, and the slot is still the gate.
- **Re-evaluation refill with a descent gate** (chosen): the existing funnel already runs when a slot frees, already excludes previously pursued drives, and a reclaim-like profile measured top-ranked. One clause.

## What finishing means

Considered milestones: followers (dead), strength (free for half), return (free), kin rallied (heirs hold ≤ 1 kin tie), hold a settlement (individuals hold 0–1 settlements per world — near-unreachable), hold an elder ruin (0 held anywhere), stand at an ancestral ruin (1–3 per world, unsteered), take any holding on the old land since the drive began (deciders take 4–7 holdings per world; the drive's claim cells steer the heir). The last two are the story and both are reachable; the window on the holding stops seed 7's pre-owned Places counting.

## Tensions noted, not resolved here

- The milestone pass runs every 15 ticks; a short ruin visit can fall between checks. Lever: `OLD_BANNER_RUIN_REACH_HEXES`.
- Claim targets are proximity-ordered from the heir's hex; an heir near a border could plant the banner just over it. Reported by the census; a target rule would be its own decision.
- `bond` as a written basis that no reader understands, and `loyalty` as a read basis that no writer produces, both turned up while measuring. Findings for the retro, not this plan.

## Vision premises

- *The world does something next; the pleasure is witnessing* (`Vision/00-north-star.md`): history that moves a living hero.
- *Consequences compound* (`Vision/01-core-loop.md`): the drive leads to ruins and holdings already on the board.
- *Narrative over mechanical perfection* (`Vision/02-non-negotiables.md`): no false vendetta, no exile's return for someone who never left.

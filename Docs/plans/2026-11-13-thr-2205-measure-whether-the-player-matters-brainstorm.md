> **title:** Brainstorm companion — Measure whether the player matters (THR-2205)
> **linear_issue:** THR-2205
> **author:** Claude Code (design lane, run dl-20261113T1719Z)
> **created:** 2026-11-13

# Brainstorm companion — Measure whether the player matters

The alternatives, tensions and Vision premises behind
[`2026-11-13-thr-2205-measure-whether-the-player-matters.md`](2026-11-13-thr-2205-measure-whether-the-player-matters.md).

## Tension 1 — divergence is not agency

The world is a deterministic chaotic system. Any card play changes what the seeded dice draw next, so the
two arms' chapter lists drift apart within a few dozen ticks whether or not the play *meant* anything. A
measure that counts "how different are the two worlds" therefore reads 100% on every build and proves
nothing. The plan separates **headline outcomes** (which clock ends the age, the First's fate, whether the
Apotheosis arrives, Mandate and Doom levels at a fixed tick) from **diagnostics** (chapter-list overlap, band
mix, essence left). Only the headline counts toward the predicate. The 2026-11-12 expert session's complaint
was exactly a headline one: the same Apotheosis, the same "Aspect", the same ending.

Considered and rejected for now: a third **random-play arm** (plays one seeded random affordable card per
step) to separate "the policy mattered" from "any perturbation mattered". It would sharpen the reading once
the headline starts moving. Today the headline is expected not to move at all, so the third arm adds
runtime with nothing to separate. It is named in the plan's Notes as the first extension.

## Tension 2 — Law 32: the game does not rank the player

"A run played well must end differently" can be read as "a played run should end *better*". Law 32 forbids
ranking: the Mandate and Doom are two endings, not a win and a loss. The predicate therefore tests
**different**, never **better**. It never asks which arm reached the Mandate, only whether the two arms
reached different places.

## Tension 3 — which verbs the played arm uses

The god has two verbs: the hand at a held step (nudge cards) and divine casts on the map. The ticket names
the hand ("always play the best affordable hand"), and the four sibling tickets all work on the hand, the
clocks' answers and the climax. Since THR-2081 the Mandate fills only from the god's own casts, so a
hands-only arm cannot move the Mandate on today's `main`. That is a real finding about today's game, and
THR-2208 (a bound mortal's deeds fill the Mandate) is the ticket that changes it. Adding casts would mix
two verbs into one number and hide which one carries agency. Rejected for this slice. The Mandate
census's `godloc` arm (`scripts/mandate-census.ts`) already measures casts on their own.

## Tension 4 — the pipeline freeze

Christian's ticket places the number "beside the existing census measures, reported with the weekly review".
On 2026-11-13, a few hours before this run, the weekly review made the pipeline freeze (THR-1946)
permanent. It bans new gates, probes, ratchets, hooks, baselines, CI jobs **and standing lane rules**. The
census script is a product tool of the same class as the roughly thirty `census:*` commands already on
`main` (including `census:mandate`, promoted from a design-lane proto the same way), so it ships. Adding a
weekly step to the review lane's prompt is a new standing lane rule, so that wiring is held, as the ticket
itself allowed ("say so in the plan and hold only the wiring, not the design"). Only Christian can lift
the freeze.

## Tension 5 — the 600-second cap

A full age ends at 820–880 ticks. The first estimate, from a solo run to t340 in 94 s, was "a few minutes
per arm". That was wrong: later ticks cost more, and one arm took 15–17 minutes to reach the age's end. A
first attempt ran seven arms at once and slowed every arm about eightfold. Three to five at once ran at
near-solo speed. So no arm fits a foreground command. The census spawns its arms as background child
processes, at most four at a time, writes JSON, and a separate `--compare` pass prints the verdict in the
foreground in seconds.

## Vision premises engaged

- North star: the god shapes mortals' stories; a run is good if it leaves a story the player can tell.
- Non-negotiable §1: forks are decided by the mortal (Law 11). Both arms leave forks to the mortal.
- Law 10: fate picks the band. The measure looks at what the bands added up to, never at a chosen ending.
- Law 28: consequences compound. If play changes nothing at t900, compounding is not reaching the
  headline, and the measure says so.

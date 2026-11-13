> **title:** Brainstorm companion — Give both clocks a verb (THR-2202)
> **linear_issue:** THR-2202
> **author:** Claude Code (design lane, run dl-20261113T0820Z)
> **created:** 2026-11-13

# Brainstorm companion — Give both clocks a verb

Companion to [the plan](2026-11-13-thr-2202-give-both-clocks-a-verb.md). This file records the options weighed and the tensions behind each decision.

## The shared premise

Law 30 needs every answer to cost from the same purse as the nudges. Each answer was therefore tested on one question: *does paying for this mean not paying for something on the other clock?* An answer that is free, or that draws on a separate currency, fails the premise however good it reads.

## Mandate — options

1. **Direct deed credit: base plus Mandate-sphere spend (chosen).** The spend half turns the nudge hand into a Law-30 choice. Playing a Mind card for the First's scene is also Mandate progress, while spending on Doom is not. The base half keeps the bar's promise for a player who plays few cards.
2. **Raise `ENCOUNTER_PRESSURE_PER_STEP`.** Rejected. It moves every mortal's scene in the world, not the god's choice. And because the ledger credits only score level-ups, the effect would stay lumpy and hard to read.
3. **Credit on undertaking milestones.** Deferred. Undertakings push no sphere pressure today, so this would be a second new path. Chapter credit is measured first.
4. **Change the bar's text to stop promising deeds.** Rejected. Christian's direction was "the mortal's deeds fill the Mandate", which makes it the ticket's own title.

Tension: rulebook §415 says the Mandate "counts only what your own hand raised". THR-2081's decision 2 already ruled that a threaded mortal's scene counts as the god's own hand, and no veto came. This plan builds on that ruling and does not reopen it.

Trend word: the measured 2% cumulative gate (`primaryDelta > 0.02`) means "Holding" is really "under 2% of the world's sphere total". A trend word must read recent change, or it stays frozen whatever the rate.

## Doom — options

1. **A sustained self-card with upkeep, on the existing `doom_rate_multiplier` (chosen).** It is a running drain on the same purse, which is the purest form of Law 30. It rides a rule override `phaseDoom` already reads (Law 42). It is bounded: the rate is never below `DOOM_STAY_RATE` and never stops.
2. **Nudge cards with negative `doomDelta`.** Rejected as the main answer. The channel lives only inside chapters, and `decelerateDoomClock` permanently lowers `tickModifier`, so a few cards would freeze Doom at the 0.1 floor for the rest of the run. An executor could still author a few such cards later, with small deltas. This plan does not add any.
3. **Roll Doom back.** Rejected. Buying the age back has no natural cap and turns Law 31's floor into a ceiling the player can push.
4. **An answer per stage card (each Doom event gets its own counter).** Rejected for now. 35 stage cards would need 35 counters, which is bespoke per kind (Law 42). It could become a content pass once the generic answer is measured.

Finding along the way: `phaseDoom` writes the multiplied `tickModifier` back into state, so any active multiplier compounds every tick. This must be fixed before the new card exists.

## Rivals — options

1. **Rebuke: tend the pressed place, push back, raise temper (chosen).** It extends tending, the concept the player already met in the toast (Law 43). The "next blow" promise becomes true through the existing absorb path. The temper rise is a cost the world remembers (Law 22 spirit).
2. **Strike the rival directly.** Rejected. Rivals are not graph nodes, and a new node type is Christian's call (load-bearing decision).
3. **Make Claim Dominion a starting card.** Rejected. It is the held-ground milestone's reward, and moving it changes the power ladder Christian ruled on in THR-1745.
4. **Drop "Tend it" from the toast and add nothing.** Rejected. Testers asked for an answer, not less text.

## Vision premises leaned on

- North star: a small purse, two clocks, quiet stretches never safe.
- Non-negotiables §1: the god influences and never commands. Rebuke acts on a place, not on the rival's will.
- Law 32: neither clock becomes a loss. Stay slows the ending; it does not cancel it.

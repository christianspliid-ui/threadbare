> **Brainstorm companion** to `Docs/plans/2026-11-02-thr-2146-every-card-says-what-it-buys.md` (THR-2146). Design lane, 2026-11-02 run f.

# Every card says what it buys — brainstorm

## The reading that changed the question

The ticket asked whether each card tag needs to be on the face at all. The testers' own words answered a different question. Nobody said "I do not know what *Balm* means". They said they could not see what Balm *bought*: *"Only 'Boost' ever visibly changed the odds."* Every tag already has a hover (THR-1713 D4, THR-1002). So removing or renaming tags would not touch the complaint. The gap is that an odds card shows its pay-off in pips, and a non-odds card shows nothing in that slot.

## Options considered

1. **Drop the type chips from the face, keep them in the hover.** Cuts reading load. Rejected: the Repertoire (THR-887) makes the 21 types a vocabulary learned once, and the chip is how variation reads across a run. It also does nothing for "what did Balm buy me".
2. **A legend over the hand** (the THR-972 glyph-legend pattern). Rejected: one more surface to read at the moment of choice, and it explains names, not results.
3. **Rewrite the authored effect lines as mechanism text.** Rejected: 18 lines, the voice of the card is lost, and the line still cannot name the mortal or the condition, because it is authored before the hand is dealt.
4. **A result line computed from the grant, in the odds slot (chosen).** The reminder-text pattern from card games: a short rule on the face says what the keyword does, and the keyword stays as the name. It names the mortal and the exact thing (condition, item, ambition), so it satisfies Christian's 2026-08-23 chip ruling on the face as well as the ending.

## Balm on an unhurt mortal

- Filter it out of the deal: rejected, because the deal is re-derived at render and at resolution, and a card disappearing between the two breaks a held selection.
- Show it dimmed with a reason: considered first. The existing render policy shows only `essence_unavailable` dimmed and withholds every other blocked code (ruling 4 in `nudge-stage-content.ts`). A dimmed Balm would be the first exception. Withholding follows the house rule.
- Lower its score: rejected, a scoring nudge still deals it on a thin repertoire.

## The coloured circles

Two marks sit beside the price: the reach icon and the sphere icon. The sphere icon repeats the pool word beside it (measured: the paying pool is `card.sphere ?? budget`), and the tint repeats it again. Three signals for one fact, while the reach mark, a different fact, sits in the same cluster. The rule chosen: everything next to the price is about the price. The reach mark moves to the kind side with its word, so it no longer carries meaning alone.

Christian loves the sphere tint on choice cards (2026-09-25). The tint stays; only the duplicate icon goes.

## Scale on action cards

"Scale: Cosmic" was in the veteran's never-understood list. Scale matters to the choice only when it puts a target out of range, and that already reads as a blocked reason in words. Folding the scale sentence into the verb chip's hover keeps it one hover away and leaves one kind chip, as a nudge card has.

## Tensions left open

- SCAR / BOND / BOON / PATH being "too much to take in" is the Aftermath legend, outside this ticket.
- If the result line is not read in round 7, the kill criterion moves it above the authored line.

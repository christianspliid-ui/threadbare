# Encounter Pipeline: The Failing Dyke
> Scale: medium | Slug: flood-dyke-mending | Pass: editorial
> Date: 2026-10-01 | Pipeline version: 2.0
> Critic loop: 1 of 2

## 1. Prose Quality

The opening is in narrator mode and follows the skeleton: arrival, a stated complication, a stated mystery, a named rival. It names every object the hand later touches (the soft section, the seep, the sacks, the crew, the crest). Two defects in the opening itself:

- **The stake for the village is implied, not stated.** "The winter wheat is sown behind it" asks the reader to work out what a breach costs. Doctrine v2 says announce it.
  `[EDITORIAL REWRITE]` P2: "The dyke that keeps the river off the lower fields has a soft section, and water is seeping through it. If it breaks, the river will drown the winter wheat."
- **Seam echo (trigger 22).** Step 0 spine ends "who are piling sacks on top"; step 1 spine says "{cast:ganger}'s crew is still piling sacks on top". Same shape, same words, one seam apart.
  `[EDITORIAL REWRITE]` step 1: "The sacks {cast:ganger}'s crew has piled are in the way of the dig."

**The fee is invented state (trigger 31).** Step 2's spine says "The reeve will pay whoever's work is standing in the morning", and the success overviews say the reeve "paid {actor} the fee". Nothing writes coin. The overview would tell the player they were paid while their purse does not move. The real payment on the success side is the drawn prize and the standing. Cut the fee everywhere.
`[EDITORIAL REWRITE]` step 2 spine, last sentence: "By morning, the village will know whose work held." (enacted by `reputation_with` on both sides of step 2).

**Constraints on later behaviour with no enacting effect (trigger 34).**
- critical_failure overview: "Nobody in {location} will send for {actor} again." No effect stops anyone sending for them. Cut.
- critical_success overview: "The whole valley hears whose work held." Only `$here` standing is written. Narrow to the village, then cut it anyway (see the page read: it repeats the BOND chip).

**Invented agent history (trigger 31).** Recall The Old Craft's failure fragment: "{actor} remembered a drain from another valley". That asserts a past visit the graph does not hold.
`[EDITORIAL REWRITE]` "{actor} remembered the old trick, and dug for a drain in the wrong place."

**Detector hits (trigger 15), outcome class:**
- Draw Out The Leak, failure: "showed **nothing** narrower than that" — natural indefinite, banned after the roll.
  `[EDITORIAL REWRITE]` "The ground darkened along the whole soft section, and showed them only what they already knew."
- Chill The High Snow, success_at_cost: "higher than **anyone** had seen".
  `[EDITORIAL REWRITE]` "The crest came late, but it came higher than the reeve had ever seen."
- critical_success overview (draft) had no `something`; the keystone sentence in draft § 13 did ("had left something") — **outcome-hider, banned in every class.**
  `[EDITORIAL REWRITE]` "The reeve lets {actor} keep what the first builders left under the culvert's old keystone."

**Path truth.** success_at_cost is reached by a failure at step 0 or 1 followed by a clean finish, as well as by a costly finish at step 2. "Most of the lower fields are dry" contradicts the clean-finish route's step 2 afterimage ("held through the night").
`[EDITORIAL REWRITE]` "The dyke holds. It took {actor} longer than it should have, and the reeve saw every slip."

**critical_failure path truth.** The band is reached by a critical failure at any of the three steps. The step 0 route ended at "told the reeve the dyke only needed height" — no breach happened on the page, yet the overview opens "The soft section gave way". Make every route end in a breach:
`[EDITORIAL REWRITE]` step 0 crit_fail afterimage: "They read the seep wrong and told the reeve the dyke only needed height. The soft section burst at the first rise of water." · step 1 crit_fail afterimage: "The sides of the hole slid in, and the river broke through the soft section."
And state plainly why it costs more for an expert (brief, cool failure):
`[EDITORIAL REWRITE]` critical_failure overview: "The reeve sent for a mason to save the dyke, and now blames {actor} for breaking it, in front of everyone in {location}."

## 2. Branch Seduction Audit

Linear. The reaction pairs carry the choice (see § 7).

## 3. Branch Count Assessment

KEEP 0.

## 4. Scale Discipline Check

Medium, three beats, reactions present. Matches.

## 5. Inspiration Anchor Honesty

Honest. The harvest hook gives the place condition its reason; the gauntlet hook gives the crest. The descent hook is admitted to survive only as the culvert.

## 6. Aftermath Payoff

Lands, and is actor-centred: the reeve, the rival crew's leader by name, the village by name.

## 6b. Page read

- **failure — REPETITION (trigger 35).** Overview: "The river is over the lower fields". SCAR caption: "The river took the lower fields — food in {location} will run short." Same fact, two blocks. And the BOND caption "Their dyke gave way" repeats the overview's "did not hold the dyke".
  `[EDITORIAL REWRITE]` SCAR: title "A Short Year", detail only "Food in {location} will run short this year." · BOND: causeClause "Sent for, and found wanting", detail "{location} thinks less of {actor} now." · overview drops the "remembers that the mason … did not hold the dyke" sentence and the pay talk: "The river is over the lower fields, and the winter wheat is drowned. The reeve thanks {cast:ganger}'s crew for their sacks, and walks past {actor} without a word."
- **critical_success — REPETITION.** "The whole valley hears whose work held" against the BOND caption "Their mend stood through the crest — {location} thinks well of {actor} now." Cut the overview sentence; the chip carries the standing.
  `[EDITORIAL REWRITE]` "The lower fields are dry, and not one row of wheat was lost. The reeve gives {actor} what the first builders left under the culvert's old keystone, in front of the whole village."
- **critical_failure.** With the rewrite above, the BOND caption should carry no cause clause (the overview has already said why): "{location} thinks less of {actor} now."
- success, success_at_cost: clean after the fee cut.
- No conflicts found after the rewrites.

## 7. Dilemma Energy

The aftermath reactions are real stances. Success side: give the cheaper crew a share of the credit (generosity to a competitor), or say publicly that their sacks would have failed (your name at their expense). Failure side: stay and dig out the ditches, or blame the sacks. Each pair is defensible both ways.

## 8. Experience Differentiator Gate

1 YES after the P2 rewrite · 2 YES · 3 YES · 4 YES · 4b NO → fixed (sacks seam) · 5 **NO → fixed**: "Trip The Rival Crew" and "Chill The High Snow" carry scene nouns on the face (trigger 16). A face must read in three unrelated encounters.
`[EDITORIAL REWRITE]` **Trip Up A Rival** (effect unchanged). **Call A Hard Frost** — "Draw the warmth out of the air, so snow and ice melt slower and rivers rise later." Also **Harden The Fresh Clay** → **Harden Wet Earth** — "Make loose ground pack and set like old ground, so new work holds against water." (no word of the name repeated).
6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (every noun is a sheet word: `reputation with {location}`, `Blighted Harvest`, `seed`) · 11b YES after § 6b · 12 YES · 13 YES · 14 YES (residue: split sacks in standing water, an old keystone set on the bank).

## 9. Verdict

**PASS WITH REVISIONS.**

Every trigger hit above (15, 16, 22, 31, 34, 35) is a field-level defect with a written replacement, applied inline in the revised file. The design block, the hand's shape, the consequence wiring and the step structure are sound and unchanged. Precedent: `pawnbrokers-strongroom-editorial.md` and `wolf-winter-watch-editorial.md` fixed trigger 13/31/35 hits under the same verdict.

## 10. Revision Summary

**Must fix (applied):** fee cut everywhere (31); "never send for again" and "the whole valley" cut (34); failure and critical_success page repetition (35); three detector hits (15); "another valley" history (31); two scene-bespoke faces renamed (16); sacks seam echo (22); success_at_cost and critical_failure made path-true; stake stated in P2.
**Should fix (applied):** critical_failure overview says plainly why it costs an expert more.
**Consider (for systems):** critical_failure reached through step 2 also writes Blighted Harvest without a chip, and through steps 0–1 does not write it at all. The new overview no longer claims the fields drowned, so nothing on the page lies, but systems should confirm the asymmetry is acceptable.

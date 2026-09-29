# Encounter Pipeline: The Assize Letter
> Scale: short | Slug: assize-letter | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-1, slot 3, THR-1676). Fixes applied directly to `assize-letter.package.json`; no separate revised file (batch critic contract).

## 1. Prose Quality

The opening is sound narrator-mode game prose: arrival, situation, stake, ask. Three defects:

- **The hand's targets were not in the spine.** "Clear The Night Sky" acted on a night road and a sky, and neither appeared in the urban opening or the spine. The draft's gate answer 8 claimed they were. That is a NO on gate question 8, and the player could not retell what "judge the road" meant, because no road was named.
  `[EDITORIAL REWRITE]` spine (65 words; 79 with either opening): *"A miller stands before the assize in two days, charged with heresy. The priest's sealed letter swears for him. If the letter comes late, the court rules without it, and the mill and its six jobs are lost. The ridge road is long, walked by night; the valley road is short, across a ford. The clerk asks {actor} to judge the road and carry it."*
  The openings drop the appositive ("{cast:clerk} of the assize") to stay inside 80 words.
- **Seam echoes between afterimage and overview, on four of five bands** (trigger 22). Examples: crit afterimage "with a night to spare" with overview "with a night to spare"; success_at_cost afterimage "went all night without rest to get it there" with overview "went all night without rest to get it there"; failure afterimage "judged the valley road the faster … ford too high" with overview "judged the valley road the faster and found the ford too high". Rewritten: the afterimages now carry how the road went, and the overviews carry what the court did.
- **`narrativeTemplates.initiation` announced the outcome ladder** ("The right road gets it there in time. The wrong one leaves the court to rule without it", trigger 25). It is now a plain statement of the errand. `narrativeTemplates.failure` said "reached the court after", which contradicted the critical_failure band ("never reached"). It is now band-neutral.

## 2–4. Branch seduction · count · scale

Linear, one step, short scale. KEEP 0 branches. One sharp Star test fits a journeyman errand. No reaction choices are needed at short scale.

## 5. Inspiration Anchor Honesty

`hook.heresy_hunt` genuinely shapes the stake (the accuser, and the knowledge record naming them). The rolled plea / law (duty) / judge-asked-to-rule are all present: the court is the law that will not wait, and the mortal is asked to judge the road.

## 6. Aftermath Payoff

The draft wrote bond + knowledge + relocation on every success band (step `successMetadata`) but chipped the bond only on critical_success and chipped only the path on success_at_cost. That breaks visibility parity (Christian, 2026-08-16): a real write that the sheet shows (reputation with the clerk, a knowledge record) went unreported in two bands. All three success bands now carry bond · boon · path. They are told apart by their overviews: a night early and the charge thrown out; read into the record; read at the last moment, after a night without sleep.

## 6b. Page read (assembled, post-fix)

- **critical_success**: "The letter was on the court's table a night early. The priest's oath was read, the charge did not stand, and the mill stays the miller's. Six workers keep their wages." / BOND · reputation with {clerk}: *Proved a sure carrier — {clerk} trusts them with the assize's business now.* / BOON · knowledge: *Stayed for the hearing — {actor} knows who laid the heresy charge, and why.* / PATH · seed: *Left with the letter — {actor} is travelling away from {location} now.* No repetition and no conflict. Pre-fix, the bond cause "Carried the clerk's letter in time" and the boon cause "Heard the priest's letter read aloud" both paraphrased the overview (**trigger 35**, fixed).
- **success**, **success_at_cost**: the same chips under distinct overviews. Clean.
- **failure**: "The letter went back to {clerk} and reached the court by carter, a day after the case was heard. The mill is forfeit." / SCAR: *Misjudged the ford — {clerk} trusts them less …* Pre-fix, the cause "Brought the letter back undelivered" retold the overview (fixed).
- **critical_failure**: "The letter never reached the court. The miller was found guilty without it …" / SCAR: *Took the wrong road — {clerk} trusts them far less than before.* Pre-fix, the cause "Returned the sealed letter unopened" and the title "A day lost" retold the afterimage and the overview (fixed).
- The PATH chip's cause "Went on from the county seat" contradicted its own detail "travelling away from {location}", because `{location}` is the town where the clerk found them, not the county seat. It now reads "Left with the letter", which the fiction and the engine both make true.

Script check: no 4-word run is shared between any two blocks on any band. Chip sentences are 11–13 words.

## 7. Dilemma Energy

A test, not a choice. The tension is legible: long and safe in the dark against short across water.

## 8. Experience Differentiator Gate (post-fix)

1 Y · 2 Y · 3 Y (the ford and the night road are in the spine) · 4 Y · 4b Y (the seams are rewritten) · 5 Y · 6 Y · 7 Y (both cards carry failure fragments) · 8 Y (was N) · 9 Y (water on the short road against light on the long one) · 9b Y · 10 Y · 11 Y (see the systems pass for the PATH noun) · 11b Y (was N) · 12 N/A · 13 N/A · 14 Y (a sealed letter on an empty bench at dawn: residue).

**Hand.** "Clear The Night Sky" was the third near-identical sky-clearing special in the batch's three Star slots (overdue-caravan and pilots-reckoning both author "Clear The Sky"). It is replaced by **Draw Down The River** (matter, `generic.matter`): *"Pull the water off the crossing overnight, so a ford that ran deep runs shallow. A real help."* It is grounded in the spine's ford and pays off on failure ("The river was falling when they reached the ford, but not fast enough."). **Lengthen The Day**'s effect line was scene-bespoke ("before the court sits", trigger 16), and the rewrite had first repeated its name word "day" (spec rule 2). It now reads *"Hold the evening light past its hour, so more road is walked before dark."* Its image tag is corrected from `generic.memory` (mind) to `generic.time-slow` (time). All six StepOutcomes are still covered.

**Motivations.** `honesty_cunning` (Shadow) did not describe this scene. It is swapped for `sacrifice_survival` (Star: spend yourself for someone else's livelihood). `loyalty_ambition` is kept.

## 9. Verdict

**PASS WITH REVISIONS**. Every fix is applied to the package, and dry-run compile is clean.

## 10. Revision Summary

- Must fix (done): spine grounding (gate 8), seam echoes (22), page repetition and conflict (35), initiation announcing mechanics (25), scene-bespoke effect line (16), name-word repeat, chip parity.
- Consider: success_at_cost's cost ("has not slept") is prose only, because a step-level write cannot be band-keyed without reactions. This is acceptable for a short test.

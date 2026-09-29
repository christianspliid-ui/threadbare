# Encounter Pipeline: The Ledger by Lamplight
> Scale: short (local) | Slug: ledger-by-lamplight | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0

Critic loop 1 of 2. Fixes applied directly to `ledger-by-lamplight.package.json`. No `-revised.md` file: under this batch's critic contract the package is the revised artefact. The draft doc carries the list under "Critic revisions".

## 1. Prose Quality

The draft is plain narrator prose with one stake (a season's wages for one page) and a hard, stated rule. The god's levers (dark, clock, wax, memory) are all named in the scene before the hand is dealt. Eight defects, all fixed:

- **Unreadable referent, opening→P2 (trigger 29).** P1 said "the night its counting houses close the quarter's books" (plural), and P2 then said "A rival house lost a contract to *this one*". No single house had been introduced for "this one" to point at. [EDITORIAL REWRITE] P1: "…on the night its biggest counting house closes the quarter's books." P2: "A rival house lost a contract to it and wants to know how." Opening plus spine comes to 76 words.
- **Conflict, step 0 critical_failure→step 1 spine (trigger 35 class).** The critical_failure afterimage said the clerk "sent for the watch before they got inside". But step 0 is `continue_weakened`, so step 1 always runs, and its spine has the mortal at the press. On that band the scene put them outside and then set them to copying. The draft also implied the watch was called on a band whose step 1 could still succeed with no watch written. [EDITORIAL REWRITE] "The clerk saw a shadow at the shutter and doubled his walks. They are inside, with little time to work."
- **Soft conflict, step 0 failure→step 1 spine.** "The clerk found a shutter open on the second walk and began to look" has the clerk already searching, while the spine says he "will walk the room again within the hour". [EDITORIAL REWRITE] "They got in, but left a shutter unlatched, and the clerk will see it on the next walk."
- **Seam echo, step 0 critical_success afterimage→Stretch The Rounds fragment (trigger 22).** "had the whole time between the walks to work" was followed by "the gap ran long enough to work without hurry". [EDITORIAL REWRITE] the fragment is now "The clerk sat down at the far end of the house, and did not get up for a long while."
- **Conflict, step 1 success_at_cost afterimage→Clear The Head fragment.** "half the page went uncopied" against "ran out of time at the foot of the page". [EDITORIAL REWRITE] "They copied fast and clean, and still ran out of time halfway down."
- **Conflict, step 1 failure afterimage→Clear The Head fragment.** The failure band means the seal cracked and was *found at dawn*: they were not seen. The fragment said "the clerk came in before the press was shut", which is the critical_failure fiction. [EDITORIAL REWRITE] "The figures went down right. It was the seal that went wrong."
- **Seam echo, step 1 critical_success afterimage→overview.** "the dawn check passed the seal" followed by "the house found every seal whole at dawn". The afterimage is now "…and still set the seal back before the clerk came round". The dawn check is told once, in the overview.
- **Card name off the verb lexicon.** "Darken The Front" was flagged, because `darken` is not in `IMPERATIVE_VERB_LEXICON`, and "The Front" read as scene-bespoke. [EDITORIAL REWRITE] **Smother The Lamps**, with effect line "Put out every light along the house's street side, so nobody sees who stands at the shutter. A real help." No name word is repeated in the effect line.

The step 1 spine is good as written. It names the press, the seal, the one lamp, the clerk's next walk and the dawn check, which covers every object the step's two specials and five afterimages act on.

## 2. Branch Seduction Audit

Linear, no branches. N/A.

## 3. Branch Count Assessment

KEEP 0. That fits the Seeded Sequel shape and `local` scale.

## 4. Scale Discipline Check

Two beats, get in and then copy, both Shadow and both about going unseen: first unseen *entry*, then an unseen *trace*. The beat count is right for `local`. The journeyman weight sits in the fiction: a season's wages, a paying house, a town that may start watching.

## 5. Inspiration Anchor Honesty

`hook.stronghold_raid` shapes the encounter, inverted into a raid that takes nothing but a copy. The faction-doctrine opposition is the house's stated rule, and it binds both steps (the walks, the dawn seal check). Disposition neutral: the house keeps its rule and hunts nobody. Trespasser role: the mortal is the one inside the room. Every die left a mark.

## 6. Aftermath Payoff

The aftermath centres on the actor and names its people: the factor by name, and the town by `{location}`. Success pays a real prize (an engine PRIZE, `#shadow` possession), the factor's trust, and more work. Failure costs the purse, the factor's trust, and the town's watch. Cool failure holds: nobody is hurt, jailed or branded. The critical_failure overview says plainly why being seen weighs more for someone who sells quiet work.

The old success_at_cost overview promised "the rest had better come next time". No effect performs that, since the `#steal` sequel is not the rest of this page (trigger 34). It now reads "paid in kind for what there was", and the band's cost shows in the BOND caption: "trusts {actor}'s hands, if not their speed."

## 6b. Page read (assembled per band: scar · bond · boon · path; no reactions)

Before the fix, all five bands failed. Each chip retold its overview:

- crit: "asked where to send next time" beside PATH "will send for {actor} with more work", and "two pages … whole" beside BOND "Two pages came back clean".
- success: BOND "The page came back clean" and PATH "Copied a sealed page unseen" paraphrased an overview that had just said both.
- success_at_cost: BOND "The seal went back whole … and wants the rest" retold two overview facts, and PATH "The house never knew" paraphrased "found its seal whole".
- failure: SCAR "A cracked seal was found at dawn" retold the overview's first sentence, and SCAR "The purse went unpaid" retold its second.
- critical_failure: SCAR "A thief was seen at the press" retold the overview (`check:encounter` also caught the four-word run "seen at the press").

**Fix: chips state only the change, and causes appear only where they add a fact the page does not already carry.** As assembled now:

- **critical_success**: "{actor} handed {cast:factor} two pages instead of one. The house checked its seals at dawn and found nothing wrong. The factor paid in kind." · BOND reputation: "{cast:factor} trusts {actor} with quiet work now." · PRIZE (engine) · PATH seed: "{cast:factor} will send for {actor} with more work." Clean.
- **success**: "{actor} gave {cast:factor} the copied page before dawn. The house checked its seals and found nothing wrong. The factor paid in kind." · the same BOND · PRIZE · PATH. Clean.
- **success_at_cost**: "{actor} brought {cast:factor} half a page. The house checked its seals at dawn and found nothing wrong. The factor paid in kind for what there was." · BOND reputation: "{cast:factor} trusts {actor}'s hands, if not their speed." · PRIZE · PATH. Clean. The cost is on the page twice, but as two different facts (half a page; trust with a caveat).
- **failure**: "The house knows its ledger was read. {cast:factor} will not pay for a secret the house knows is out." · SCAR Under Watch: "The house raised the alarm — {location} is watched now, and quiet work there is harder." · SCAR reputation: "{cast:factor} trusts {actor} less with quiet work." Clean. The cause is a new fact, how the town came to watch.
- **critical_failure**: "{cast:factor} paid nothing for an empty page. A copyist seen at the press is no use to a house that buys secrets." · SCAR Under Watch: "The clerk raised the alarm — {location} is watched now, and quiet work there is harder." · SCAR reputation: "{cast:factor} trusts {actor} less with quiet work." Clean. The overview no longer retells the step 1 afterimage ("The clerk walked in while the press stood open…").

**Conflict found on the chip tag itself (fixed):** the draft's BOND/SCAR noun was `reputation with {target}`. On this everyday organic draw the scene target is the town, so the tag would have read "REPUTATION WITH <town>" over a sentence about the factor. That is a chip disagreeing with its own sentence. See systems § 4b for the code path. The noun is now the sheet word `reputation` (tooltip `ui.reputation_with`).

## 7. Dilemma Energy

This is a job, not a moral fork, and that is the right weight for everyday journeyman content. The divine posture shows in the choice of lever: hiding the mortal (lamps), bending the house's clock (the walk), or making the work itself flawless (wax, memory).

## 8. Experience Differentiator Gate

1 YES: P1 arrival with graph names, P2 events with costs paid, P3 the rule and the problem, 76 words. · 2 YES · 3 YES: street lamps, shutter, clerk's walks, press, seal, lamp, dawn check. · 4 YES: "copy one sealed page unseen for a season's wages, or the town starts watching." · 4b YES, after the fixes listed in § 1. · 5 YES: Smother The Lamps / Stretch The Rounds / Spare The Seal / Clear The Head, all on the lexicon, no flavor quotes. · 6 YES: each effect line says what the god does and why the odds move, and each is priced in essence. · 7 YES: every special carries a failure fragment, and none reaches Δ0.15. · 8 YES · 9 YES: concealment, time, material, cognition. · 9b YES: 2 specials plus a `deal` on each step, and no pick-an-ending. · 10 YES · 11 YES: nouns are `Under Watch` (condition name), `reputation` (THR-1206 sheet word), `seed`, and the engine PRIZE. · 11b YES (§ 6b, after fixes). · 12 N/A (local). · 13 N/A. · 14 YES: a cold lamp, a closed press and an unbroken seal at grey dawn, with no people. Residue, not action.

## 9. Verdict

**PASS WITH REVISIONS** (applied). `check:encounter` run on the package (a probe that injects the uncompiled template into the real gate stack) is clean, with 0 warnings. Before the fixes it had 4 warnings: the card-name verb, two 16-word chips, and one chip retelling its overview.

## 10. Revision Summary

- **Must fix, all done:** the opening referent (29); the step 0 critical_failure / failure conflicts with the step 1 spine; three card-fragment conflicts or echoes; the crit afterimage→overview echo; the page repetition on all five bands (35); the chip-tag conflict from `{target}`; one trigger-34 promise ("the rest had better come next time"); the card name off the lexicon; two chips over 15 words.
- **Consider:** a success-side place write. Not taken. A clean copy leaves no trace, so the town learns nothing, and the brief's own wording for the place family ("the counting house's town knows its books were read") is failure-side.

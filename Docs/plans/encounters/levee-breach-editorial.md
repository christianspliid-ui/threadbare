# Encounter Pipeline: The Levee Breach
> Scale: medium (3 steps, `scale: 'local'`) | Slug: levee-breach | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0 | Critic: independent (batch journeyman-everyday-2, slot 2)

Edits were applied directly to `levee-breach.package.json`, which is the revised artifact for this batch (as in batch 1, there is no separate `-revised.md`). The draft doc records them under **Critic revisions**.

## 1. Prose quality

Narrator mode throughout. There is no interiority and no camera work, and the stake is stated plainly: bank the mill and save the houses, and the far bank goes unwatched with the harvest a month off. Opening plus step-0 spine: 78 words urban, 77 rural. Every step's reach matches its theme: hauling (iron), finding the washout (eye), holding the breach (iron).

Defects found and fixed:

- **Trigger 31 (invented game state), step-0 spine.** "{actor} stood the evening watch on that bank." The narrator asserted a past fact about the agent: that they hold a duty in this town and were on that bank. Nothing in the graph backs it, and the mortal may be a traveller passing through. **[EDITORIAL REWRITE]** "{cast:warden}, the levee warden, says {actor} stood the evening watch on that bank and missed the seep." The narrator now reports an accusation that is happening in the scene, and nothing about the agent's history. It also sharpens the rolled hook (`heresy_hunt`: blame laid before the facts), because the charge can now be false. This settles the author's own doubt.
- **Step-1 spine asserted a band.** "The mill bank holds, but…" is false after a step-0 failure, and the carryover line on the same screen says "The mill bank is still seeping". The same sentence also had water "rising in the lowest houses" from the far bank, which contradicts the P3 geography (the mill bank protects the houses and the far bank protects the fields). **[EDITORIAL REWRITE]** "Water is spreading across the lowest fields, and it is not coming from the mill bank. It is coming through somewhere on the far bank." This is true on every band and keeps the geography consistent.
- **Step-2 spine seam (trigger 22).** "cut into the far bank above the fields" repeated the step-1 success afterimage right above it ("where the far bank is washing out from beneath, above the fields"). **[EDITORIAL REWRITE]** "The water breaks through the bank late in the night. {cast:warden} brings the men over from the mill. {actor} stands in the breach up to the waist…"

## 2–4. Branch seduction / count / scale

Linear Test-and-Consequence (investigation → resolution), three beats. Carryover lines key each step on the previous band. **KEEP 0** branches. Medium scale is right: the warden's theory (the mill), the real fault (the far bank) and the resolution (the breach) each need a beat, and the shape names exactly three.

## 5. Inspiration anchor honesty

`heresy_hunt` really drives the encounter. The hostile warden names a culprit before anyone looks for the fault, the mortal has to find the fault to answer the charge, and the ending turns on whether the charge is retracted (critical success), dropped (success) or made public (critical failure). After the step-0 rewrite, the charge is something that happens in the scene rather than a history the narrator gives the mortal. `endless_pursuit` shapes the night-long walk after the water. The Seed Dice are honoured: a P3 choice, faction-orders opposition read as a town office, a hostile warden, the agent as suspect, and a settlement-scale harvest.

## 6. Aftermath payoff and 6b. Page read

**How the bands are reached** (`computeFinalActionOutcome`). Any failure on step 0 or 1 (continue_weakened), and any success-at-cost or near miss on any step, sends the action to `success_at_cost`. Any critical on a clean run sends it to `critical_success`. The final step is `fail_action`, so `failure` and `critical_failure` come only from step 2. The success-at-cost overview must therefore be true on six different paths. The drafted one ("the field at its foot went under") was false on every path where step 2 itself succeeded cleanly: the step-2 afterimage on those paths says "the fields below stayed dry".

Assembled as the player meets each band (overview → chips scar·bond·boon·path → reactions), **before** the fixes:

| Band | Finding | Fix |
|---|---|---|
| critical_success | The overview "The river fell at dawn with the far bank whole" echoed the step-2 afterimages ("held until the river fell", "by dawn"), a trigger-22 seam. "The warden told the town whose work had saved the harvest" paraphrased the `BOND · reputation with {location}` chip ("thinks well of {actor} now"), a trigger-35 repetition. The crit afterimage "a new bank built behind it" also conflicted with the reaction "Stay on to rebuild the far bank" | Overview → "{cast:warden} takes back the charge about the evening watch, in front of the men who heard it made." This is the hook's payoff and appears nowhere else on the page. Reputation cause → "Found the real fault and held it". Crit afterimage → "…had a second wall of sacks built behind it" |
| success | The overview "The far bank held until the river fell" shared a four-word run with the step-2 success afterimage "The bags held until the river fell" (seam). The thread cause "Kept the river out" restated the overview (repetition). "The fields … will be cut at harvest" was a later-tense promise with no effect behind it | Overview → "{cast:warden} drops the charge about the evening watch and sends everyone home to sleep." Thread cause → "Stood in the water with the god close". Reputation cause → "Held the far bank until morning" |
| success_at_cost | The overview was false on four of the six success-at-cost paths (conflict, trigger 35). Step 2 succeeded on every one of those paths, so the band wrote `reputation_with +0.06` but showed no reputation chip | Overview → "{actor} comes off the levee at noon, long after the others, and sleeps through the rest of the day." This is true on every path, and the cost is the mortal's own. Added `BOND · reputation with {location}` ("Kept the far bank standing — {location} thinks well of {actor} now.") |
| failure | The overview "The breach opened before dawn … the river had the fields" retold the step-2 failure afterimage (seam). The harvest chip cause "The fields were under water for days" then told the flood a third time (repetition) | Overview → "{cast:warden} and the men fall back to the mill bank and keep the houses dry. The far bank is left to the river." Harvest cause → "The crop rotted in the ground" |
| critical_failure | The overview "The far bank tore open in the night. The river took every field below it" nearly repeated the step-2 critical-failure afterimage word for word (seam). The reputation cause "The town takes the warden's word" restated the overview's accusation | Overview → "{cast:warden} and the men fall back to the houses and leave the far bank to the river. At dawn the warden tells {location} that the river came in through {actor}'s watch." Reputation cause → "Believed to have missed the seep". Harvest cause → "The crop drowned where it stood" |

**After the fixes**, each band reads as one text:

- **critical_success.** The warden takes back the charge in front of the men who heard it made. **BOND · thread**: "Held the breach with the god close — The thread to {actor} runs stronger." **BOND · reputation with {location}**: "Found the real fault and held it — {location} thinks well of {actor} now." Reactions: *Stay on to rebuild the far bank* / *Walk the levee again at first light*. One retraction, then two changes, then two stances. No fact is told twice.
- **success.** The warden drops the charge and sends everyone home. **BOND · thread**: "Stood in the water with the god close — …". **BOND · reputation with {location}**: "Held the far bank until morning — …". Reactions as above. Clean.
- **success_at_cost.** The mortal comes off the levee at noon and sleeps the day away. **BOND · thread**: "Held the bank with the god close — …". **BOND · reputation with {location}**: "Kept the far bank standing — …". The overview carries the toll and the chips carry the gains. It is true on every path, including the one where a field is lost, because it names no field.
- **failure.** Everyone falls back to the mill bank, the houses stay dry, and the far bank is left to the river. **SCAR · Blighted Harvest**: "The crop rotted in the ground — {location} will go short this winter." **SCAR · reputation with {location}**: "Blamed for the watch and the breach — …". **SCAR · thread**: "The bank broke with the god watching — …". Reactions: rebuilding the far bank is lawful after the river falls, and walking the levee at first light is lawful. Clean.
- **critical_failure.** Everyone falls back to the houses, and at dawn the warden tells the town it was {actor}'s watch. **SCAR · Blighted Harvest**: "The crop drowned where it stood — …". **SCAR · reputation with {location}**: "Believed to have missed the seep — …" (the public accusation is the cause, and the town believing it is the change). **SCAR · thread**. Clean.

Every chip caption is 11–14 words. No chip shares a four-word run with its overview (`check:encounter` reports 0 page warnings).

**Verbosity (an `[EDITORIAL REWRITE]` note, not a stop).** The fallback `changes` (the iron-reach growth line) never renders, because every band authors its own `changes` and `applyAftermathOutcomeBand` replaces rather than merges. It is harmless, and I left it because batch 1 carries the same line. The fallback overview is also never reached. It was rewritten anyway, because "has counted what the night cost" is the evasive "it cost something" shape: it now reads "…is out on the levee counting sacks and fields."

## 7. Dilemma energy

The player's real question at step 2 is whether to spend on the wall's load (Bolster The Wall) or on the length of the night (Hasten The Dawn), with a dealt fill beside them. Step 1 sets essence on seeing the fault against saving it for the stand. The reactions split between standing with the town (be seen rebuilding) and keeping what the night taught (walk the bank alone). Both are defensible after a win and after a loss. The warden gives the whole scene a face.

## 8. Experience Differentiator Gate

1 YES (arrival · situation and complication · the problem, 78/77 words, graph names only) · 2 YES · 3 YES (mill, far bank, sacks, breach and night are all established before the cards) · 4 YES · 4b YES, after the three spine seams and the five overview seams above were fixed · **5 NO → fixed.** All four effect lines were scene-bespoke ("the lantern's glow … the still river", "the stack … the sacks", "the people on the bank … the river") and three titles opened with verbs outside the lexicon (`Firm`, `Silver`, `Brace`: `[card name]` warns). Rewritten generic:
  - **Stiffen The Load**: "Make whatever is carried or stacked hold firm, so it sits where it is placed and does not slump."
  - **Show The Leak**: "Make moving water catch whatever lamp or moon is near, so a seep shines plain against still water."
  - **Bolster The Wall**: "Push back against water or weight pressing on a barrier, so the barrier takes less of the load."
  - **Hasten The Dawn**: "Make the dark hours pass quicker for tired people, so morning comes before their strength gives out."

  The ids were renamed to match. No effect line shares a word with its title. · 6 YES (essence 2 on all four, and each effect line states the mechanism) · 7 YES (every special has a failure fragment, and none is big-delta) · 8 YES · 9 YES (step 2: the load on the wall against the length of the night) · 9b YES (composed 1+4, 1+4, 2+3, all ≤2 specials with a deal fill, and no step asks the player to pick an ending) · 10 YES · 11 YES (the chip nouns are `thread`, `reputation with {location}` and `Blighted Harvest`, the condition's own name. Each passes the cover-the-title test) · 11b YES after the fixes · 12 YES · 13 YES (standing against knowledge) · 14 YES (a residue image: a sandbag wall at grey dawn, a lantern on its side, flat water reaching to standing wheat, no people).

**Card type (the author's doubt).** Hasten The Dawn was labelled *Long Game*. In the library, a Long Game plants a trait or hidden mark (`nudgeDispatch.ts`: Long Game → `hidden_mark`). This card grants nothing, and the brief forbids card grants, so it is a **Boost** (time), and the draft label is corrected. All four specials are now Boosts, which is lawful: each step-2 Boost buys a different certainty, and the dealt fill brings the other types. No other `encounter.town.*` has the same type composition (overdue_caravan is Whisper / Boost / Fellowship / Omen), so trigger 21 is clear. The image tag was also wrong: `generic.focus` is the mind plate, so it is now `generic.time-slow`, the only time-sphere plate (the same choice as assize_letter and ledger_by_lamplight).

**Seam fixes inside the hand.** The Show The Leak critical-success fragment repeated "under the bank" from its afterimage, so it becomes "…so did the trickle feeding it from further along". Its success fragment repeated "the far bank", so it becomes "Water running out of the earth…". The Bolster The Wall critical-failure fragment repeated "tore" from its afterimage, so it becomes "…and the bank gave way beside it". The Hasten The Dawn success-at-cost fragment repeated "field went under" from its afterimage, so it becomes "…and the river was falling within the hour".

## 9. REVISE triggers, checked one by one

1 situation prose: present · 2 generic god-verbs: none · 3 thread integration: the thread is written on both sides of the final step and named in the chips · 4 reaction choices: two · 5 reporter prose: every afterimage says what changed · 6 concept art: present and evocative · 7 hand size: 5/5/5 · 8 spheres / common: `check:encounter` passes the composed hand · 9 failure fragments: all four · 10 band coverage: specials plus dealt fill cover all six · 11 digits in effect lines: none · 12 trait hooks: all four answered (no) · 13 nudge payoff in base text: none · 14 instructing the mortal: none · 15 detector hits: 0 (the "really" in `description` was removed) · 16 scene-bespoke card faces: **fixed** · 17 mood effect lines: none · 18 envelope/openings: `rural` + `urban`, both written, and no class scenery in the spines · 19 riders: none · 20 zero-essence or dead grants: none · 21 family composition: clear · 22 seam echo: **fixed** (three spines, five overviews, four fragments) · 23 static factor lines: carryover only · 24 bystander: no, the agent hauls, searches and holds · 25 announced mechanics: no, "If it goes, the harvest goes" is the stated stake · 26 design-block breach: none · 27 title glance test: passes · 28 crux: one sentence · 29 unreadable compression: none · 30 shape: investigation → resolution, from the catalog · 31 invented game state: **fixed** (step-0 spine) · 32 chip nouns: sheet words · 33 chip length/overlap: 11–14 words, no overlap · 34 later-tense promises: "will go short this winter" is enacted by `harvest_blight`, "{location} will blame {actor}" by `reputation_with −0.06`, and "the town will hear who ran" is the warden's threat, which the failure side's reputation write carries out. "…will be cut at harvest" was removed · 35 page read: **fixed** (see §6b).

## 10. Verdict

**PASS WITH REVISIONS.** All revisions are applied to the package. The re-run `check:encounter` (scratch checker on the unregistered package) is clean with **0 warnings**, and the compile dry-run exits 0.

## 11. Revision summary

**Must fix (applied):** step-0 invented state (31); step-1 band assertion and geography; card faces generic, plus lexicon verbs (16); seams across spines, overviews and fragments (22); page conflict on success at cost and repetitions on four bands (35).

**Should fix (applied):** a success-at-cost reputation chip for a write that already fires; the time card's type label and image tag; the evasive fallback overview; "really" in the description.

**Consider:** the place family fires on the failure side only (see the systems pass, where I judge it acceptable). The success-at-cost cost is the mortal's night and day (money, standing, time, bruises), which fits the brief and adds no second personal condition on `$actor`.

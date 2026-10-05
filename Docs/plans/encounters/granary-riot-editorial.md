# Encounter Pipeline: The Granary Riot
> Scale: medium | Slug: granary-riot | Pass: editorial
> Date: 2026-10-05 | Pipeline version: 2.0

Cold read of `Docs/plans/encounters/granary-riot-draft.md` against the nudge-authoring spec (§ Prose doctrine v2, checklist steps 3–6, § Consequences rules 0–3), the SKILL.md REVISE triggers 1–35, and the master-everyday brief slot 3. Items the brief fixes (template id, heart 0.76 → 0.80, danger → confrontation → aftermath, `urban`, relationship + story_seed, rarity 2, warm success, no gates) are not reopened.

**Verdict up front: REVISE BEFORE CONTINUING.** The skeleton is sound and most of the prose is in the right register. But three band pages fail the Page read (§ 6b: repetition on the success-side pages, a conflict on the critical_failure page), and two seams echo (step-1 afterimage → overview on `failure` and `critical_success`). The editorial prompt makes repetition or conflict on any band a REVISE (trigger 35), and the gate makes any NO a REVISE (4b, 11b). Every fix is small and written out in full below, so the redraft should be mechanical.

---

## 1. Prose Quality

**Opening (79 words).** The structure is right: arrival, then costs already paid ("two people are already hurt"), then a plea. Three defects:

- **P1 contradicts P2.** "{actor} arrives at {location} to find no bread for sale." The next sentence says "Bread doubled in price overnight." Bread that costs twice as much is still for sale. P1 also uses the bread fact up early, so P1 → P2 echoes on *bread*.
- **P3 never gives the danger step to the mortal.** "Both ask {actor} to judge how much grain leaves the granary, once the crowd is held back from the gate." The passive "is held back" hides who does the holding. Step 0 tests the mortal's Heart on exactly that act, so the opening must say {actor} has to do it (trigger 26: the prose has to test the step's declared reach).
- **P3 repeats a sentence shape.** "{cast:speaker} speaks for the crowd. The cellarer speaks for the abbey." That parallel is fine once, but the rewrite below folds the two into one sentence to free words for the danger ask.

[EDITORIAL REWRITE — opening]
> {actor} arrives at {location} in the morning.
>
> Bread doubled in price overnight. A crowd is pushing at the gate of the abbey granary, and two people are already hurt. The abbot will not open it. The grain inside is the abbey's seed for next year.
>
> {cast:speaker} speaks for the crowd, and the abbey's cellarer speaks for the abbey. Both ask {actor} to rule how much grain leaves the granary. First {actor} must talk the crowd back from the gate before it gives.

Word count: 6 + 37 + 36 = 79.

**Step-1 spine.** Good. The cellarer is the one named person on stage, the cellarer's argument is reported plainly, and the stake ("one both sides accept") is a stated fact. Keep it as drafted.

**Carryover lines (step 1).** These are the seam the draft did not read. Each carryover restates its step-0 afterimage in nearly the same words, so the player meets the same fact twice in a row:

| Step-0 afterimage | Carryover (draft) |
|---|---|
| "…sat down in the street to wait for the ruling." | "The crowd is sitting quietly, waiting on {actor}'s word." |
| "The crowd stepped back from the gate to hear the ruling." | "The crowd stepped back when {actor} asked." |
| "…not before the gate bar cracked under their weight." | "The gate bar cracked before the crowd stepped back." |
| "…carried sacks out before {cast:speaker} turned them back." | "The crowd has already carried sacks away." |

A carryover is a factor line, so it should say what the step-0 result *means for the ruling*, not what happened. The `crit_fail` carryover can never show: a step-0 critical failure resolves the action as `critical_failure`, so step 1 never runs. Delete it.

[EDITORIAL REWRITE — carryover]
crit "The crowd trusts {actor} to be fair." (+0.06) · success "The crowd is willing to hear {actor} out." (+0.04) · s@c "The cellarer is angry about the damage to the gate." (−0.02) · near_miss "The crowd stepped back late, and is still angry." (−0.03) · failure "The abbey is already short of seed, and angry about it." (−0.05) · *(crit_fail carryover removed — unreachable)*

**Band fragments that echo their own afterimage.** Fragments render beside the base afterimage, so a fragment that repeats it makes the page say one fact twice:

- Hold The Gate `success_at_cost`: "The gate held, but its bar cracked down its whole length." The base afterimage already says "the gate bar cracked under their weight."
  [EDITORIAL REWRITE] "The hinges held the gate shut after the bar gave way."
- Remember Lean Years `success_at_cost`: "…still asked for more grain than the abbey could spare." The base afterimage already says "the abbey gave up more seed than the cellarer wanted."
  [EDITORIAL REWRITE] "The crowd remembered the lean spring, but only the old ones would settle for less."
- Remember Lean Years `critical_failure`: "…went for the granary door before this one began." This repeats the afterimage ("the crowd broke into the granary"). "Before this one began" also takes two readings (trigger 29), and "door" contradicts "gate".
  [EDITORIAL REWRITE] "The crowd remembered the last hungry winter, and would not wait to starve through another."
- Remember Lean Years `near_miss`: "…but only after the shouting." No shouting was ever established. Name the beat instead.
  [EDITORIAL REWRITE] "The crowd remembered the hungry winter, but only after it had refused the first ruling."

**Step-1 afterimage `success_at_cost`.** Once the overview below carries the seed-loss fact (so that it holds on both routes into the band), this afterimage needs a different fact.
[EDITORIAL REWRITE] "Both sides took the ruling, but the cellarer argued over every sack."

## 2. Branch Seduction Audit

Linear, with no branches. The mortal makes no choice inside the steps. The stance lives in the aftermath reactions, and the design block says so. No step asks the player to pick a branch or an ending. N/A.

## 3. Branch Count Assessment

**KEEP 0.** A danger beat and a ruling beat is the right size. A branch (rule for the crowd or rule for the abbey) would turn the Heart test into the player choosing the ruling, which is the rejected authored-futures model.

## 4. Scale Discipline Check

Medium with two steps, at master rarity, owes reaction choices, and the draft has them on both sides. The scale is a settlement (a town's winter and an abbey's spring), which is honest. Pass.

## 5. Inspiration Anchor Honesty

Civil Unrest really did shape the encounter: a town turning on its own institution gave it the crowd and the two voices. The Great Building survives only as a question, and the draft says so honestly. The Relic Awakening was dropped, and the draft explains why. The anti-patterns the draft names are actually avoided: the abbey is not a miser, the crowd is not villains, and nothing turns into a fight. Pass.

## 6. Aftermath Payoff

The aftermath centres on the actor and stays warm on the success side, as the brief requires (bread for the month, seed kept). Failure follows the master's-name rule with no death, jail or brand. Two overview defects, beyond the page-read findings in § 6b:

- **`critical_failure` invents a premise.** "A master was sent for to keep that gate, and the gate is broken." Nobody sent for {actor}: the opening says they *arrive* and are *asked*. They were also asked to rule on the grain, not to keep the gate. The same overview tells the seed loss twice inside itself ("carried off the abbey's seed grain, and the seed for next year's fields is gone").
- **`failure` echoes its afterimage.** The step-1 failure afterimage says "Neither side would take the ruling. The cellarer locked the gate…" The overview then says "The granary is still shut… Neither side would take this one's." That is the same two facts, read one after the other.

[EDITORIAL REWRITE — overviews]
- **critical_success:** "The abbey sells the share {actor} named at last year's price and keeps the rest for seed. The abbot came out to thank {actor} in front of the town."
- **success:** *(keep)* "{cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring."
- **success_at_cost:** "{cast:speaker} led the crowd home with bread. The abbey kept its seed, but less of it than the cellarer meant to spare." This holds on both routes into the band: step-0 failure followed by step-1 success (sacks lost at the gate), and step-1 success_at_cost (more seed given).
- **failure:** "Bread is still dear in {location}. People send for a master because a master's word ends quarrels. This quarrel is still going."
- **critical_failure:** "The abbey has lost most of next spring's seed, and {location} faces another hungry year. Both sides had asked {actor} to stop exactly this."
- **fallback:** *(keep)*

The `critical_success` rewrite also removes the afterimage → overview echo: the afterimage says "the crowd cheered {actor}" and the draft overview said "The crowd cheered the ruling."

## 6b. Page read (THR-1474)

Each page was assembled as overview → chips (bond, bond, bond, path) → reactions, then read once.

**critical_success (draft)**
> {actor} named a share of the grain to be sold at last year's price, and the rest kept for seed. The crowd cheered the ruling, and the abbey rang its bell for it.
> - Their ruling fed the town — {location} thinks well of {actor} now.
> - {cast:speaker} trusts {actor} now.
> - The seed grain was kept — {cast:cellarer} trusts {actor} now.
> - The town watch has heard about {actor}'s ruling.
> > Stay to see the grain shared · Sup at the abbey's table

- **Repetition:** "the rest kept for seed" (overview) and "The seed grain was kept" (chip). "To be sold at last year's price" and "Their ruling fed the town" tell the same outcome twice. **REVISE.**
- **Verbosity:** "the abbey rang its bell for it" adds a little, but the rewrite's abbot carries more.

**success (draft)**
> {cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring.
> - Their ruling fed the town — … · {cast:speaker} trusts … · The seed grain was kept — {cast:cellarer} … · watch

- **Repetition:** "The abbey keeps its seed" and "The seed grain was kept" are the same fact. "Led the crowd home with bread" and "Their ruling fed the town" are a paraphrase, which the machine cannot see. **REVISE.**

**success_at_cost (draft)**
> The ruling holds, but only just. The town has bread, and the abbey will sow fewer fields this spring.
> - Their ruling fed the town — … · The seed grain was kept — …

- **Repetition:** "The town has bread" and "fed the town". **Near-conflict:** "will sow fewer fields" against "the seed grain was kept". **Verbosity:** "The ruling holds, but only just" is carried again by every chip below it. **REVISE.**

**failure (draft)**
> The granary is still shut, and bread is still dear. A master judge is sent for because their word ends quarrels. Neither side would take this one's.
> - {location} thinks less of {actor} now. · {cast:speaker} trusts {actor} less now. · {cast:cellarer} doubts {actor}'s judgment now.
> > Side with the crowd · Side with the abbey

- The page itself reads clean apart from the seam echo with the afterimage noted in § 6. **Conflict after a reaction:** "Side with the crowd" writes `bond_change $cast:speaker +0.12`, which cancels the step-1 failure's −0.12 written under the "{cast:speaker} trusts {actor} less now" chip. "Side with the abbey" (+0.12 cellarer) more than cancels the step-0 −0.06 on the critical_failure route, under "{cast:cellarer} trusts {actor} less now". The chip on the page would be false the moment the player picks the reaction. Drop the reaction magnitudes to ±0.04 so every band chip stays true after either pick.

**critical_failure (draft)**
> The crowd carried off the abbey's seed grain, and the seed for next year's fields is gone. A master was sent for to keep that gate, and the gate is broken.
> - Blamed for the Gate — {location} thinks less of {actor} now. · {cast:cellarer} trusts {actor} less now.
> > Side with the crowd ("…the abbey should open its doors") · Side with the abbey

- **Repetition** inside the overview (seed told twice). **Conflict:** "sent for to keep that gate" against the opening, and the reaction "the abbey should open its doors" against a page where the granary is already broken open and emptied. **REVISE.**

[EDITORIAL REWRITE — chips] (causeClause + detail, ≤15 words; no cause clause where the overview already gave the cause)

| Band | Chip title | Sentence | stateNoun (unchanged) |
|---|---|---|---|
| crit / success / s@c | The Town's Thanks | "{location} thinks better of {actor} now." | `reputation with {location}` |
| crit / success / s@c | The Crowd's Trust | "{cast:speaker} trusts {actor} now." | `reputation` |
| crit / success / s@c | The Abbey's Trust | "{cast:cellarer} trusts {actor}'s judgment now." | `reputation` |
| crit / success / s@c | Work From the Watch | "Word of the ruling will bring {actor} work from a town watch." | `seed` |
| failure | Ruling Refused | *(keep)* "{location} thinks less of {actor} now." | |
| failure | The Crowd's Doubt | *(keep)* | |
| failure | The Abbey's Doubt | *(keep)* | |
| critical_failure | Blamed for the Granary *(retitled: on the step-1 route the gate was not the beat)* | *(keep)* | |
| critical_failure | The Abbey's Blame | *(keep)* | |

Watch seed `seedLabel`: change "The town watch has heard…" to "**A** town watch has heard how {actor} settled the granary, and has work for them." The seed is a placeless query (`#watch_errand`) and fires wherever the mortal is later, so "the" town watch promises this town's watch, which the engine will not deliver (prose rule 7b, trigger 34).

[EDITORIAL REWRITE — reactions]
- **Stay to see the grain shared:** "The mortal stays in the yard until the last sack is handed out, where the whole town can see it." → `reputation_with $here +0.03`. This drops "The town marks who stayed", which is word for word the restless-ossuary reaction in the same batch.
- **Sup at the abbey's table:** "The mortal eats at the abbey's table that night. The cellarer will remember the company." → `bond_change $cast:cellarer +0.04`. "Takes the abbey's thanks" repeated the critical_success overview's thanks.
- **Side with the crowd:** "The mortal says the town's hunger mattered more than the abbey's seed. The crowd's speaker will remember it kindly, and the cellarer will not." → `bond_change $cast:speaker +0.04`, `bond_change $cast:cellarer −0.04`.
- **Side with the abbey:** "The mortal says the seed should have been kept, whatever the town thinks. The cellarer is grateful; the crowd's speaker is not." → `bond_change $cast:cellarer +0.04`, `bond_change $cast:speaker −0.04`.

These read correctly on both failure pages, including one where the granary is already broken.

**Chip backing per route (§ Consequences rule 0).** Checked against every route into each band. Step 0 is `continue_weakened`. A step-0 failure followed by a step-1 success resolves as success_at_cost. A critical failure at either step resolves as critical_failure. A step-1 failure resolves as failure.

- **Success-side chips.** All four are written by step-1 `successMetadata` on every route into crit, success and s@c. On the step-0-failure route, the net standing is −0.02 + 0.06 = +0.04 and the net cellarer bond is −0.06 + 0.12 = +0.06, so every gain chip stays true. ✔
- **Failure chips.** All three are written by step-1 `failureMetadata`. ✔
- **critical_failure chips.** Via step 0: `reputation_with −0.02` and `bond_change $cast:cellarer −0.06`. Via step 1: −0.06 and the cellarer bond. Both chips are backed on both routes. ✔ (Reactions at ±0.04 keep them true. At ±0.12 they did not, as § 6b shows.)

## 7. Dilemma Energy

The dilemma is real. The seed really is next year's harvest, and the hunger really is now, so both sides are defensible and the brief's warm ending is earned rather than given. The god's posture shows in which pressure it leans on: the crowd's memory (time), its own panic (mind), or the mortal's own warmth (trait). The failure reactions are a clean philosophical pair: whose need came first.

## 8. Experience Differentiator Gate

| # | Answer | Evidence |
|---|---|---|
| 1 | **NO** | The skeleton is present, but P1 contradicts P2 (no bread for sale against doubled price), and P3 never puts the danger act on {actor} (the passive "once the crowd is held back"). Fix in § 1. |
| 2 | YES | No interior sensation and no camera work. Every sentence states a fact or the ask. |
| 3 | YES | The crowd, gate, key, seed, speaker and cellarer are all named before the hands that act on them. |
| 4 | YES | Situation and stakes can be retold after one read. |
| 4b | **NO** | Step-1 afterimage → overview echo on `failure` ("Neither side would take…" twice) and on `critical_success` ("the crowd cheered" twice). Every step-0 afterimage → carryover pair restates the same fact. P1 → P2 echoes on bread. |
| 5 | YES | Verb + noun names (calm, hold, remember, open, all in the lexicon). No flavor quotes. One fix: Open Closed Hands' "a judge who minds…" is scene-bespoke (see Must fix 7). |
| 6 | YES | The effect lines state mechanism. Priced in essence, plus the trait card at zero. No name word repeats in its effect line (checked). |
| 7 | YES | Every special has a failure fragment. No big-delta card. |
| 8 | YES | The gate, the crowd and the hunger are all in the prose before the hand. |
| 9 | YES | Panic against timber on step 0. Memory against the mortal's own care on step 1. |
| 9b | YES | Two specials plus `deal: 3` on each step. The trait card hides for non-Warm, giving four visible. |
| 10 | YES | Overviews per band, plus a fallback. |
| 11 | YES | Chip nouns are `reputation with {location}`, `reputation` (the person bonds, honouring THR-1685) and `seed`, all sheet words. |
| 11b | **NO** | § 6b: repetition on the crit, success and s@c pages, and a conflict on the critical_failure page. |
| 12 | YES | Two reactions per side. |
| 13 | YES | Duty to the town against the courtesy of power. The town's hunger against the abbey's seed. |
| 14 | YES | Emotions, then image: residue and no people, with the cracked bar lashed with rope and the spilled grain. Evocative, not a picture of the scene. |

Three NOs → automatic REVISE.

## 9. Verdict

**REVISE BEFORE CONTINUING.** No revised file is produced. The redraft should apply the rewrites in this document verbatim. They are complete, and nothing structural (beats, hand, wiring, chips' backing, cast, seed, trait hooks, art) needs to change beyond them.

## 10. Revision Summary

**Must fix** (each one clears a gate NO or trigger 35):
1. Replace the opening with the § 1 rewrite: P1 without the bread claim, and P3 putting "talk the crowd back from the gate" on {actor}. Keep ≤80 words.
2. Rewrite the step-1 carryover lines per § 1 so none restates its step-0 afterimage. Delete the unreachable `crit_fail` carryover.
3. Replace the four band fragments in § 1 (Hold `success_at_cost`; Remember `success_at_cost`, `critical_failure` and `near_miss`), and the step-1 `success_at_cost` afterimage.
4. Replace the crit, s@c, failure and critical_failure overviews per § 6. The critical_failure overview must not claim {actor} was "sent for to keep that gate".
5. Strip the cause clauses that retell the overview from the success-side chips per the § 6b table. Retitle "Blamed for the Gate" to "Blamed for the Granary". Change the seed label and chip from "The town watch" to "a town watch".
6. Rewrite the four reaction intents per § 6b, and drop their bond magnitudes to ±0.04 (the success-side cellarer reaction to +0.04) so no band chip is contradicted by a reaction.

**Should fix:**
7. Open Closed Hands `effectLine`: "a judge who minds who goes hungry" only reads in this scene (trigger 16). Use "Wake their care for others, so everyone listening believes they mind who goes hungry, and each side gives a little." No word of the name repeats.
8. Update the draft's § 19 self-audit and § 20 gate rows: "Chips backed per route" was right, but "11b YES" was not.

**Consider:**
9. The brief offered "who comes back when the grain runs out" as the seed's story. The watch errand is lawful and live, but a sequel about the grain would pay the scene off more directly if a matching family tag exists. Leave it to the systems pass. Not a blocker.
10. "Calm Frightened People" is three words where a two-word name would read faster, but it is not a defect.

---

## Loop 2 (redraft review)

> Scale: medium | Slug: granary-riot | Pass: editorial (loop 2)
> Date: 2026-10-05 | Pipeline version: 2.0

Cold read of the redraft (`granary-riot-draft.md`, § 21 redraft note) against the same contract. `check:encounter --package` is green with zero warnings, so this pass covers only what the machine cannot judge: narrator mode, seam echoes, the assembled page per band, prose rules 7/7b, chip backing per route, and whether loop 1's must-fixes landed.

**Verdict up front: PASS WITH REVISIONS.** All six loop-1 must-fixes and the should-fix landed. The remaining defects are single sentences, and I fix them inline: one garbled overview (s@c), one premise overclaim plus a seam echo on the critical_failure page, a sold-versus-handed-out mismatch in a success reaction, a "street"/"ruling" echo on the step-0 seams, and a "front" against "most" mismatch on the step-0 critical_failure afterimage. None of them is structural.

### Loop-1 must-fix ledger

| # | Must-fix | Status in redraft |
|---|---|---|
| 1 | Opening: drop the bread claim from P1; P3 puts the danger act on {actor} | **Resolved.** P1 is arrival only. P3 ends "First {actor} must talk the crowd back before the gate gives." 77 words by hand, 78 by the gate. |
| 2 | Carryovers state what step 0 means for the ruling; crit_fail carryover dropped | **Resolved.** No carryover restates its afterimage, and the unreachable line is gone and annotated. |
| 3 | Four fragments + step-1 s@c afterimage | **Resolved** verbatim. |
| 4 | Four overviews; no "sent for to keep that gate" | **Resolved as written, but two of loop 1's own sentences fail a cold read.** The s@c overview, "kept its seed, but less of it than the cellarer meant to spare", literally says the abbey kept less than the cellarer meant to *give away*. The crit_fail overview's "Both sides had asked {actor} to stop exactly this" claims the crowd's own speaker asked {actor} to stop the crowd. Both are fixed below. |
| 5 | Chip cause clauses stripped; "Blamed for the Granary"; "a town watch" | **Resolved.** |
| 6 | Reactions rewritten at ±0.04 | **Resolved.** Re-verified below. |
| 7 (should) | Open Closed Hands effectLine scene-neutral | **Resolved.** |
| 8 (should) | Self-audit rows | **Partly resolved.** § 19 still says "Opening ≤80 words PASS (79)", while § 10 says 74/78. Corrected in the revised file. |

### 1. Prose Quality

**Opening.** This is narrator mode and follows the skeleton: arrival, then the situation with costs already paid (the doubled price, two hurt), then the plea plus the danger ask on {actor}. There is one named person on stage ({cast:speaker}), and the cellarer stays a role noun until step 1 names them. No interior sensation and no camera work. Clean.

**Step-1 spine.** Clean. {cast:cellarer} is the beat's one named person, both arguments are given as reported speech, and the stake is stated plainly.

**Step-0 afterimages.** Two small seam problems:
- The critical_success afterimage ("…sat down in the street to wait for the ruling") renders beside Calm's critical_success fragment ("…and then all the way back to the street"). That puts *street* twice in one block. It also runs straight into the step-1 spine's "Now {actor} must rule", so *ruling* → *rule* lands across the boundary. The success afterimage ("…to hear the ruling") has the same ruling → rule seam.
  [EDITORIAL REWRITE] critical_success: "The crowd stepped back from the gate and sat down to wait." · success: "The crowd stepped back from the gate and fell quiet."
- The critical_failure afterimage says "emptied the front of the granary", but the critical_failure overview says the abbey "has lost most of next spring's seed". *The front* and *most* disagree about how much was taken.
  [EDITORIAL REWRITE] "The crowd broke the gate down and poured into the granary."

**Band fragments, step 1.** The near_miss fragment ("…only after it had refused the first ruling") is correct now. `near_miss` advances (`isStepSuccess`), so a second ruling that does land is the right reading. No other findings.

**Card faces.** All four names lead with a lexicon verb (calm, hold, remember, open). No effect line repeats a word of its name (checked word by word, including *the* in Hold The Gate). There are no numerals and no flavor quotes. Remember Lean Years is hunger-flavoured but serves any famine or shortage scene, so it is reusable rather than scene-bespoke. Accepted.

### 2–5. Branch seduction, branch count, scale, anchors

Unchanged from loop 1, and all still hold: linear, **KEEP 0**, medium with reactions, and the anchors are honest. No step asks the player to pick a branch or an ending.

### 6. Aftermath Payoff

The success side ends warm on all three bands, as the brief requires. The failure side is the master's name, with no death, jail or brand. Two overviews need fixing:

- **success_at_cost.** "The abbey kept its seed, but less of it than the cellarer meant to spare" has to be read twice (trigger 29), and its literal reading is backwards. The obvious repair ("kept most of its seed, though less than the cellarer wanted") would then echo the step-1 s@c afterimage across the seam ("the cellarer argued over every sack": the cellarer's displeasure told twice). The cleaner fix is loop 1's original consequence. Its only objection was the old "The seed grain was kept" chip, and that chip no longer exists.
  [EDITORIAL REWRITE] "{cast:speaker} led the crowd home with bread. The abbey will sow fewer fields this spring." This holds on both routes in: sacks lost at the gate, or more seed given by the ruling.
- **critical_failure.** "Both sides had asked {actor} to stop exactly this" overclaims. The opening has both sides asking for a *ruling*, and {cast:speaker} speaks *for* the crowd that did the breaking. "Another hungry year" also echoes Remember Lean Years' critical_failure fragment ("…would not wait to starve through another") across the fragment → overview seam.
  [EDITORIAL REWRITE] "The abbey has lost most of next spring's seed, and {location}'s next harvest will be small. Both sides asked {actor} to settle this, and both have lost by it." This is true on both routes (a step-0 break-in, or a refused ruling followed by a break-in).

### 6b. Page read (THR-1474), redraft as submitted

Each page was assembled as overview → chips (bond ×3 · path, or bond ×3 / ×2) → reactions, then read once.

**critical_success**
> The abbey sells the share {actor} named at last year's price and keeps the rest for seed. The abbot came out to thank {actor} in front of the town.
> - {location} thinks better of {actor} now. · {cast:speaker} trusts {actor} now. · {cast:cellarer} trusts {actor}'s judgment now. · Word of the ruling will bring {actor} work from a town watch.
> > Stay to see the grain shared: "…until the last sack is handed out, where the whole town can see it." · Sup at the abbey's table: "…The cellarer will remember the company."

- Repetition: none. The abbot's thanks and the town's standing have different subjects.
- Verbosity: none.
- Conflict: soft, not a contradiction. The overview *sells* the share, and the reaction has it *handed out* and *shared*. A sold sack is still handed over, but a player could read "shared … handed out" as free grain. On the success and s@c pages, "where the whole town can see it" also sits under an overview where {cast:speaker} has already led the crowd home. [EDITORIAL REWRITE] Label "Stay until the last sack leaves". Intent: "The mortal stays at the granary until the last sack of the share has gone, and the town hears of it."

**success**
> {cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring.
> - (same four chips) · (same two reactions)

- Clean on all three counts. Loop 1's repetitions ("The seed grain was kept", "fed the town") are gone.

**success_at_cost**
> {cast:speaker} led the crowd home with bread. The abbey kept its seed, but less of it than the cellarer meant to spare.
> - (same four chips) · (same two reactions)

- No repetition or contradiction between blocks. The second sentence is garbled (see § 6), and the rewrite fixes it.

**failure**
> Bread is still dear in {location}. People send for a master because a master's word ends quarrels. This quarrel is still going.
> - {location} thinks less of {actor} now. · {cast:speaker} trusts {actor} less now. · {cast:cellarer} doubts {actor}'s judgment now.
> > Side with the crowd · Side with the abbey

- Clean. "People send for a master" is a general statement, not a claim that anyone sent for {actor}, so it is not the loop-1 defect. The afterimage → overview seam is clean too ("…the crowd went home hungry." → "Bread is still dear…").

**critical_failure**
> The abbey has lost most of next spring's seed, and {location} faces another hungry year. Both sides had asked {actor} to stop exactly this.
> - {location} thinks less of {actor} now. · {cast:cellarer} trusts {actor} less now.
> > Side with the crowd · Side with the abbey

- Repetition: none on the page. Conflict: the second sentence against the opening premise, and "front" against "most" with the step-0 afterimage. Seam echo: "another" with the Remember fragment. All three are fixed by the § 1 and § 6 rewrites.

**Assembled page after revision (success_at_cost and critical_failure re-read):**
> {cast:speaker} led the crowd home with bread. The abbey will sow fewer fields this spring. — {location} thinks better of {actor} now. · {cast:speaker} trusts {actor} now. · {cast:cellarer} trusts {actor}'s judgment now. · Word of the ruling will bring {actor} work from a town watch. > Stay until the last sack leaves · Sup at the abbey's table

> The abbey has lost most of next spring's seed, and {location}'s next harvest will be small. Both sides asked {actor} to settle this, and both have lost by it. — {location} thinks less of {actor} now. · {cast:cellarer} trusts {actor} less now. > Side with the crowd · Side with the abbey

Both read clean: no fact told twice, no padding, no contradiction. Sowing fewer fields sits beside the cellarer's restored trust without conflict, because the cellarer accepted the ruling.

### Chip backing per route (§ Consequences rule 0), re-verified

Route rules as given: step 0 is `continue_weakened`. A step-0 failure followed by a step-1 success resolves success_at_cost. A critical failure at either step resolves critical_failure. A step-1 failure resolves failure. `near_miss` counts as success for `successMetadata`.

| Route | Band | Writes | Chips true? |
|---|---|---|---|
| step 0 ok → step 1 ok/crit | success / crit | s1 success: rep +0.06, speaker +0.12, cellarer +0.12, seed | ✔ all four |
| step 0 fail → step 1 ok | s@c | s0: rep −0.02, cellarer −0.06 · s1: +0.06, +0.12, +0.12, seed | ✔ net rep +0.04, cellarer +0.06 |
| step 1 s@c / near_miss | s@c | s1 success writes | ✔ |
| any → step 1 fail | failure | s1 fail: rep −0.06, speaker −0.12, cellarer −0.1 (+ s0 −0.02/−0.06 if it failed) | ✔ all three |
| step 0 crit_fail | crit_fail | s0 fail: rep −0.02, cellarer −0.06 | ✔ both |
| step 1 crit_fail | crit_fail | s1 fail: rep −0.06, cellarer −0.1 | ✔ both |
| reactions (±0.04) | fail side | worst case: step-0 crit_fail −0.06 cellarer + "Side with the abbey" +0.04 = −0.02 | ✔ "trusts less" survives every pick |

**Prose rule 7.** No invented relationship, debt or standing between {actor} and the world. The town's hungry past appears only in a nudge fragment that the card itself plants, and the rewrite takes "another hungry year" out of base prose.

**Prose rule 7b.** The seed is placeless and says the watch "has work for them". No place or time is promised. "The cellarer will remember the company" and "will remember it kindly" are backed by the reaction's `bond_change`. ✔

### 7. Dilemma Energy

Unchanged and sound: whose winter pays for whose spring, with both sides defensible.

### 8. Experience Differentiator Gate (redraft)

| # | Answer | Evidence |
|---|---|---|
| 1 | YES | Arrival; the price and two hurt as costs paid; the plea plus "First {actor} must talk the crowd back". 78 words by the gate. |
| 2 | YES | No sensation, no camera work. Every sentence states a fact, the test, or the ask. |
| 3 | YES | The crowd, gate, bar, key, seed, speaker and cellarer are all named before the hands that act on them. |
| 4 | YES | Retellable after one read: a bread riot at the abbey granary, two sides, one ruling. |
| 4b | YES | The loop-1 echoes are gone. The three residual seams (street/street, ruling → rule, another/another) are single-word repeats with no repeated image or sentence shape, and they are fixed inline anyway. |
| 5 | YES | Verb + noun spell faces with no flavor quotes. Open Closed Hands is now scene-neutral. |
| 6 | YES | Mechanism, not mood. Essence prices, plus the trait card paid by being Warm. No name word repeats. |
| 7 | YES | Every special carries a failure-band fragment. No big-delta card. |
| 8 | YES | The gate, crowd, memory of hunger and the mortal's care are all in the prose before the hand. |
| 9 | YES | Panic against timber on step 0; memory against the mortal's own care on step 1. |
| 9b | YES | Two specials plus `deal: 3` on each step (5 cards; 4 visible when the trait card is hidden). No branch pick. |
| 10 | YES | Overview per band plus a fallback. |
| 11 | YES | `reputation with {location}`, `reputation` (person bonds, THR-1685-safe) and `seed`. All sheet words. |
| 11b | YES | No band repeats a fact or contradicts itself within its page. The s@c garble and the crit_fail premise overclaim are clarity and premise defects, and they are fixed inline. Pages re-read clean after revision. |
| 12 | YES | Two reactions per side. |
| 13 | YES | Witness to the town against the courtesy of power; hunger first against seed first. |
| 14 | YES | Emotions, then image: residue with no people. |

All YES.

### 9. Verdict

**PASS WITH REVISIONS.** The revised file is written with the edits below applied inline. No mechanical change: every beat, difficulty, hand, write, magnitude, chip, cast, seed, trait hook and art row is as drafted.

### 10. Revision Summary

**Applied (in `granary-riot-revised.md`):**
1. s@c overview → "{cast:speaker} led the crowd home with bread. The abbey will sow fewer fields this spring."
2. critical_failure overview → "The abbey has lost most of next spring's seed, and {location}'s next harvest will be small. Both sides asked {actor} to settle this, and both have lost by it."
3. Step-0 afterimages: critical_success "…sat down to wait." · success "…and fell quiet." · critical_failure "The crowd broke the gate down and poured into the granary."
4. Success reaction: label "Stay until the last sack leaves", intent "The mortal stays at the granary until the last sack of the share has gone, and the town hears of it." (write unchanged, `reputation_with $here +0.03`).
5. § 19 opening row corrected to the gate count (78). § 20 and § 21 folded into the header and a loop-2 note.

**Consider (not applied):**
6. "Calm Frightened People" could be two words. Still not a defect.
7. A grain-sequel seed family would pay the scene off more directly than `#watch_errand`. The redraft's reasoning (`#town_keeper` is hold-gated and would wither) is sound, so this stays a systems-pass question.

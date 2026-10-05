# Encounter Pipeline: The Judicial Duel
> Scale: medium | Slug: judicial-duel | Pass: editorial
> Date: 2026-10-05 | Pipeline version: 2.0 | Batch: master-everyday, slot 4 (THR-1688)

**Verdict: PASS WITH REVISIONS.** Every edit is applied in `judicial-duel-revised.md`.

The design is sound and conforms to the binding row: iron primary, eye 0.72 → iron 0.80 → iron 0.84, investigation → resolution, `urban`, with `thread` + `place` wired on step 2 and no fight system. The prose is in narrator mode throughout. The cards are verb + noun from the lexicon, and the hands are composed correctly. The draft had four real defects, all local prose fixes:

1. **A false spine (conflict).** Step 2 opened "Both fighters are cut and tiring." That is false after step 1 `success` ("gave no ground"), and false for the champion after step 1 `failure`. The same spine's "{cast:champion} has stopped saluting" refers to a salute the prose never showed. It also encodes a fact ("now they mean it") as behaviour for the reader to decode.
2. **Pages that repeat themselves (trigger 35).** The failure overview said the order's people "stay on in {location} to hold it", and the Under Watch chip under it says "The order's men keep watch on {location} now". That is the same fact in two wordings, invisible to the four-word check. The same overview's "packs a cart" was offered back by the reaction "stays to load the family's cart".
3. **Seam echoes (trigger 22).** Every step-2 afterimage told the verdict ("the court gave the farm to the family / the order"), and every overview then opened by telling it again. Five fragments repeated their own base text: "same feint each time" / "every time"; "feints as real blows" / "feints from the real blows"; "the champion saw" ×2; "one knee" ×2; "a cut to the leg" ×2. The opening said "the court calls a trial by combat", and two sentences later the spine said "A duel in the market square will settle it."
4. **Card faces sharing words with their names.** "Slow **A** Fighter" — "**a** beat… **a** watcher". "Rouse **The** Crowd" — "Lift **the** onlookers… **the** other". "Twist **Their** Footing" — "**their** best stroke". "Weigh **A** False Oath" — "Lay **a** lie". The rule is "never repeats a word" ([spec § Calibration exemplar](../../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md)), and it is not scoped to content words.

None of these is structural, so the verdict is PASS WITH REVISIONS, following the `well-sinking` / `comet-disputation` precedent: triggers fired and were fixed in the same pass. No REVISE trigger remains in the revised file.

---

## 1. Prose Quality

**Opening + step-0 spine (78 → 71 words).** It is narrator mode with the agent named and present tense. Four problems:

- **The duel is told twice.** P1 "as the court calls a trial by combat" is followed by "A duel in the market square will settle it." I cut the second; the square is introduced where it is used, in step 1.
- **The ask is implied, not stated.** "{cast:claimant} cannot pay a champion, and offers {actor} a favour owed if the family keeps the farm" never says the family wants {actor} to fight. Q2 asks for the problem to be stated, not decoded.
- **The mystery contradicts the drill.** "Nobody in {location} knows how the order's champion fights" sits next to "The champion drills where anyone can watch." If anyone can watch, someone knows. The design block made it worse by calling the style "knowledge the order guards" while the disposition die says it drills in the open. The rewrite makes the mystery that the style is *new*.
- "for four generations" is the measured specificity the calibration exemplar names as the old mode's residue tell. I cut it.

[EDITORIAL REWRITE] Spine:
> A fighting order claims {cast:claimant}'s family farm. The order bought it from a cousin who never owned it.
>
> {cast:claimant} asks {actor} to be the family's champion. The family cannot pay, and offers a favour owed if the farm is saved. Nobody in {location} has seen the order's champion fight, but the champion drills each morning where anyone can watch.

The favour promise is enacted: `favor_creation` fires on step 2 success, so rule 7b holds. One named person (the claimant) is on stage; the champion stays a role noun until step 1.

**Step 1 spine.**
- "because if the order wins, every old title in the valley can be challenged the same way" promises world behaviour that no effect performs (rule 7b's spirit, trigger 34). It also uses "valley" twice.
- It names {cast:champion} for the first time without saying who that is.
- It is where the friendly disposition belongs, and it never showed it.

[EDITORIAL REWRITE]
> The market square is roped off and packed. Families have come from across the valley, afraid their own old titles could be taken the same way. {cast:champion}, the order's champion, salutes {actor} like a friend and swears before the court that the order's claim is true. Then the champion comes in fast.

The fear is a present fact about the crowd, not a promise. The region scale survives.

**Step 2 spine.** [EDITORIAL REWRITE]
> The bout goes on, and both fighters are tiring. The court will give the farm to whoever makes the other yield. {cast:champion} stops being polite and fights to win.

This is true on every step-1 band, and it states the turn instead of encoding it in a missing salute.

**Afterimages.**
- Step 0 `critical_failure` ("{cast:claimant} found another champion") left the critical_failure overview ("{actor} lost it") false on that route: {actor} never fought. Now: "…{cast:claimant} sent them away and found another champion." The overview is route-neutral (below).
- The step-2 afterimages now carry only the bout ("{cast:champion} went down on one knee and yielded before the court", "{actor} pressed until {cast:champion} yielded", …). The verdict lives in the overview alone.

**Band fragments** (each was de-echoed against the base text it appends to):
- **Slow Every Move**
  - cs: "Every drill ran slow, and {actor} could follow each blade from start to finish."
  - f: "The drills ran slow for a morning, but slow or fast, {actor} watched the wrong hand."
- **Reveal Old Habits**
  - s@c: "{actor} saw the half-step back, the one habit the new drill could not hide."
- **Rouse The Crowd**
  - f: "…{cast:champion} paid it no attention." This replaces "as if it were silence", a figurative image in narrator prose.
- **Twist Their Footing**
  - s@c: "fell into {actor} blade first" did not say whose blade. Now: "{cast:champion} slipped and fell forward, and the falling blade caught {actor} on the way down." This explains the base text's forearm cut.
  - cf: "The cobble" was definite with no antecedent whenever the success fragment had not rendered. Now: "A loose cobble…".
- **Weigh A False Oath**
  - cs: "faltered on the false oath and never found the rhythm again."
  - s: "A hand's width" was measured specificity. Now: "dropped at the end and did not come back up."
  - s@c: "took the opening without guarding the leg."

**Carryover lines.** Three carryover lines restated the afterimage directly above them. They now state the step's state instead:
- "They know how the style wins."
- "They do not know the style."
- "They are fresh and unhurt."

The last one also makes the step-2 spine fix legible.

**Aftermath overviews.**
- **Failure:** "The court gives the farm to the order, and {cast:claimant}'s family must leave it." Under Watch now carries the occupation alone.
- **success_at_cost:** "{actor} watches the verdict read with a bandaged leg" retold the afterimage's leg cut. Now: "…but the whole square saw how near the order came to winning."
- **critical_failure:** "{cast:claimant} tells the whole square that the family trusted {actor}, and {actor} failed them." This is true on all three routes, including the step-0 dismissal. It also says plainly why a master's loss costs more (brief: *"name before the purse"*).

## 2. Branch Seduction Audit

Linear; no branches. The mortal never picks a path, and nothing asks the player to. The stance lives in the reactions (§ 7, Q13).

## 3. Branch Count Assessment

**KEEP 0.** It is a three-step test. A fork would dilute the bout, and the binding row fixes the shape.

## 4. Scale Discipline Check

Medium has three beats (watch, weather the rush, win), two reactions per side, and master difficulty. The size matches.

## 5. Inspiration Anchor Honesty

- **Swindled Family:** honest. The false sale, the cousin, and the favour instead of a fee are all in the prose, and the favour is a real `owes_favor` write.
- **Forbidden Knowledge Price:** thin. Nothing is priced and nothing "cannot be undone". The style is learned by watching and, on failure, can be asked for. I re-labelled it "blended, thin" in the revised § 1 and fixed the design-block row that called the style guarded. Acceptable as recorded; it did not shape the encounter beyond step 0's existence.

## 6. Aftermath Payoff

The aftermath is actor-centred, with named faces: the claimant owes or blames, and the champion is helped up or questioned.
- **Success:** a thread, a favour and standing, plus a feast that writes Festival on the town.
- **Failure:** the order's men Under Watch in the town, a thinner thread, lost standing, and a choice between loyalty to the losers and learning from the winner.
- Both tails land plainly.

## 6b. Page read (THR-1474)

The pages below were assembled from the revised file. Chip order is scar · bond · boon · path.

**critical_success**
> The court gives the farm back to {cast:claimant}'s family and writes the verdict into its rolls. Families from across the valley come to shake {actor}'s hand.
> - The god's thread to {actor} runs stronger. · {cast:claimant} owes {actor} a favour now. · {location} thinks well of {actor} now.
> > Offer the beaten champion a hand — helps the champion up; the champion will remember it.
> > Stand the square a feast — turns the verdict into a feast; the town takes a holiday.

- Repetition: none. The handshakes are an event, and the standing chip is the state it left. These are different facts.
- Verbosity: none.
- Conflict: none.

**success**
> The court gives the farm back to {cast:claimant}'s family. The order's people pack their carts and leave {location} by evening.

Same chips and reactions. Clean.

**success_at_cost**
> The court gives the farm back to {cast:claimant}'s family, but the whole square saw how near the order came to winning.

Same chips and reactions. Clean.
- *Draft:* "watches the verdict read with a bandaged leg" retold the step-2 afterimage across the seam (fixed).
- *Draft repetition, every success band:* the afterimage and the overview both told the verdict (fixed by moving the verdict out of the afterimages).

**failure**
> The court gives the farm to the order, and {cast:claimant}'s family must leave it.
> - scar: The order's men keep watch on {location} now.
> - bond: The god's thread to {actor} runs thinner. · {location} thinks less of {actor} now.
> > Load the family's cart — stays to help the family move out; the family will remember who stayed.
> > Ask the champion to explain the style — asks how the style is won, and keeps the answer.

The **draft** failed this page on two counts:
- **Repetition:** "Its people stay on in {location} to hold it" against the chip "The order's men keep watch on {location} now".
- **Repetition:** "{cast:claimant}'s family packs a cart" against the reaction "stays to load the family's cart".

Both are fixed. The revised page is clean.

**critical_failure**
> The court gives the farm to the order. {cast:claimant} tells the whole square that the family trusted {actor}, and {actor} failed them.
> - bond: {location} thinks less of {actor} now.
> > (the failure-side reactions)

The **draft** failed this page on **conflict**. On the step-0 critical_failure route, the overview's "{actor} lost it" contradicts an afterimage in which {actor} was replaced before the bout. That is fixed. The revised page is clean.

## 7. Dilemma Energy

The tension is real. Three steps at severe difficulty make every essence pip a question.
- Step 0 asks: spend on knowing, or save for the bout?
- The oath card is the only special on the last step and the most expensive, so it is the one the player agonises over.
- Each card is defensible, and none dominates: time vs memory on the watch, crowd vs footing on the rush.
- The reactions reveal posture: magnanimity vs celebration on a win, loyalty vs curiosity on a loss.

## 8. Experience Differentiator Gate

Answered against the revised file.

1. **YES.** Arrival · situation · problem, 71 words, real tokens, facts stated.
2. **YES**, after edits. The one jobless image ("as if it were silence") and the encoded salute are gone.
3. **YES.** The drills (time, memory), the crowd, the loose ground, the oath sworn before the court, and the champion are all established before their cards.
4. **YES.** A cheated family's farm is decided by a duel against a fighter nobody has seen. The family's favour is the fee.
4b. **YES**, after edits. The opening → spine "trial by combat / A duel" echo, the step-2 afterimage → overview verdict echo, and the five fragment-vs-base echoes are all removed.
5. **YES.** All five names open with lexicon verbs (slow, reveal, rouse, twist, weigh). They are ≤4 words, effect lines only, with no quote. The faces are generic enough to read in any watched-fight, crowd, footing or sworn-statement scene.
6. **YES.** Every effect line states what the card does. The prices are essence 1–3.
7. **YES.** Every special has ≥1 failure-band fragment. No card reaches Δ 0.15.
8. **YES.** The oath's target (the sworn claim) is now in the step-1 spine. The crowd is in the step-1 spine. The drills are in the opening.
9. **YES.** The cards cover different ground:
   - Slow Every Move (perception, by time) vs Reveal Old Habits (one tell, by memory).
   - Rouse The Crowd (morale, both fighters) vs Twist Their Footing (one stroke, opponent).
9b. **YES.** The hands compose 2+3, 2+3 and 1+4, each with a `deal` declared. No step asks the player to pick a branch.
10. **YES.**
11. **YES.** The stateNouns are `thread`, `a favour owed`, `Under Watch`, and `reputation with {location}`. All are sheet words, and they survive the cover-the-title test.
11b. **YES**, after edits (§ 6b).
12. **YES.** There are two reactions per side.
13. **YES.** The stances are magnanimity vs celebration, and loyalty vs learning.
14. **YES.** Emotions → an emptied square, a face-down shield, and a court ribbon. It shows residue, not the bout.

## 9. Verdict

**PASS WITH REVISIONS.** Every edit is applied in the revised file. No REVISE trigger remains.

## 10. Revision Summary

**Must fix (done):**
- Step-2 spine conflict ("both fighters are cut").
- Step-2 spine salute that was never introduced.
- Failure page repeated the Under Watch chip and the cart reaction (trigger 35).
- Critical_failure overview false on the step-0 route (trigger 35, conflict).
- Step-2 afterimage → overview verdict echo, and the opening duel told twice (trigger 22).
- Four effect lines sharing a word with their card name.
- Step-1 "every old title can be challenged" promise with no enacting effect (trigger 34).

**Should fix (done):**
- The opening's implied ask, and the mystery-vs-open-drill contradiction (also corrected in the design block's Disposition / Plot hook rows).
- Five fragment echoes against base text.
- Three carryover echoes.
- "The cobble" with no antecedent.
- The ambiguous "blade first".
- Cut "four generations" and "a hand's width".
- Thread chips: removed the empty cause clause.
- Card-type labels normalised to one library type each ("Fellowship-flavoured Boost" → Boost; "Undertow-flavoured Heavy press" → Undertow). The brief bans Heavy Hand here, and "Heavy" on a label invites the wrong reading.

**Consider (systems pass, outside this lane):**
- **success_at_cost has no state-backed cost.** The brief's band table wants "a condition, a debt, an enemy", and the leg cut is prose only.
- **A step-2 critical_failure fires `thread_weaken` and Under Watch with no chip.** The band shows only the standing chip, because the band is shared with the step-0/1 routes. This is visibility parity.
- **`reputation with {location}` as a `stateNoun`.** The spec says stateNoun is not enriched, so the braces may render literally (cf. THR-1685).
- **Slow Every Move sits closest to a plain odds boost.** The spec says specials should not be plain boosts. Its only scene hook is that the drills can be watched. If the systems pass wants a sharper special, this is the one to replace. Reveal Old Habits and Weigh A False Oath are the hand's real specials.

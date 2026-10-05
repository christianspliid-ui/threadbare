# Encounter Pipeline: The Forged Charter
> Scale: short | Slug: forged-charter-inquest | Pass: editorial
> Date: 2026-10-05 | Pipeline version: 2.0

Critic pass. I judged the draft against the nudge-authoring spec (§ Prose doctrine v2, § Consequences rules 0–3, the detector field classes), the 35 automatic REVISE triggers in the encounter-pipeline skill, the batch brief's slot 1 row (`master-everyday-brief.md`) and the shipped sibling *The Mill Lease* (final + editorial). I read every band as an assembled page (§ 6b).

**Verdict: PASS WITH REVISIONS.** The game design underneath is sound. The crux is one plain sentence. The two Eye reads are different tasks: weigh two documents, then find a person. The appointment is wired the way the mill lease proved it. The consequence hand is honest, and every chip noun is a sheet word. The defects are in the words, in one card's type label, and in one card's missing ground. Each one is fixed in place in `forged-charter-inquest-revised.md`. The hard constraints are untouched: id, reach, difficulties 0.74 / 0.80, `urban` only, `rarityTier: 2`, `intrinsicTier: 'shaping'`, knowledge + story_seed, both sequels seed-only, no rule gates.

Triggers that fired on the draft:

- **15** (detector): `nothing` twice in outcome-class fields (the failure overview; Wake Old Guilt's near_miss fragment).
- **22** (seam echo), three times: P2 → step-1 spine ("{cast:steward} … has brought"); Wake Old Guilt's failure fragment against step 1's failure afterimage ("All three clerks…" twice); the kept sequel's spine → its success afterimage ("If the findings hold … lets the charter stand" → "The findings held. The bench let the charter stand").
- **26 / gate 8**: Crack The Inkwell acts on "the steward's papers", and no prose before the hand mentions them.
- **29** (needs two readings): Test The Ink's near_miss ("only where the steward had handled the page"); the missed sequel's purse, which is offered to keep unread findings that have already gone unread.
- **35** (page read): the success_at_cost overview drifts from the step-1 afterimage; the critical_failure overview repeats the SCAR; the critical_failure SCAR's cause is untrue on the step-1 path.
- **Gate 1**: the opening never says what the council asks of {actor}.
- **Type label (gate 6)**: Wake Old Guilt is labelled Whisper, but a Whisper reveals the next step's demand, and step 1 is the last step. Relabelled Signature (mind), as the boundary survey did with Call Up The Oath.

## 1. Prose Quality

**Opening.** The skeleton is right: arrival with graph names, the complication as events with costs paid (the charter is called a forgery, a rival copy has been brought), one mystery stake, and the steward's hostility stated rather than encoded. Two defects:

- **The ask is missing (gate 1).** P1 says {actor} was "sent for", and P3 ends on the steward. Nowhere does the opening say what the council wants. The exemplar's P3 ends on the ask ("…asks for help"). **[EDITORIAL REWRITE]** P3: "Both copies carry the old king's seal, and nobody in {location} can say which one is false. The council asks {actor} to find out. The steward does not want an outsider reading his copy."
- **"count's" four times in P2.** "the count's tolls … The count's lawyers … {cast:steward}, the count's steward … back to the count." **[EDITORIAL REWRITE]** "The town's charter frees its market from the count's tolls. The count's lawyers now call it a forgery. His steward, {cast:steward}, has brought a rival copy that gives the tolls back to him."

Recount after both rewrites: 10 + 33 + 34 = **77** (≤ 80).

**Step-1 spine.**

- **Seam echo (22).** The step-0 P2 says "{cast:steward} … has brought a rival copy". The step-1 spine opens its second sentence "{cast:steward} has brought three clerks". Same subject, same verb, same shape.
- **Ungrounded card (26 / gate 8).** Crack The Inkwell spills ink across "the steward's papers", and the draft's narrator Q8 claims the papers precede step 1's cards. They do not; the spine names only the clerks. **[EDITORIAL REWRITE]** "{cast:steward} keeps three of the count's clerks at his side to write his papers, and any of them could have made it." This one sentence fixes both defects. It changes the verb, and it puts the papers and their writers on the table before the hand is dealt.
- "If {actor} names the one who did, the findings are read out at the inquest in the town hall on court day, in three days, with the steward there to answer them." This is lawful. It names a place and a time on the appointment's own success path (rule 34's one exception), and it states a stake, not outcome mechanics. Kept.

**Afterimages.**

- Step-0 critical_success ("Before noon they could show the council where the count's copy had been scraped and written over in new ink") says less than success, which also finds the moulded seal. A critical success must not read as the smaller win. **[EDITORIAL REWRITE]** "Before noon they could show the council where the count's copy had been scraped and written over, and the mould marks on its seal."
- Step-0 failure ("had only the council's word that the town's is the old one") is good. It is also what makes step 1 coherent on the failure path: the hunt for a forger among the count's clerks goes ahead on the council's word. Kept.
- Step-1 failure ("All three clerks wrote the line in a plain hand…"). Wake Old Guilt's failure fragment also opens "All three clerks", so the band reads the same opener twice. **[EDITORIAL REWRITE]** "Each clerk wrote the line in a plain, careful hand, and {actor} could not say which of them made the copy."
- Step-1 critical_failure ("the steward had that clerk's own letters read out to prove it") is a clean master's overreach. Kept.

**Band fragments.**

- **Test The Ink, critical_success**: "in a dozen places". This is the measured-count residue the doctrine names ("clever specificity"). **[EDITORIAL REWRITE]** "The damp blurred the count's copy all over, and the town's copy did not run at all."
- **Test The Ink, near_miss**: "The damp made the count's ink run, but only where the steward had handled the page." The reader has to work out why handling would make ink run, and whether that proves anything (29). **[EDITORIAL REWRITE]** "The damp made a few letters on the count's copy run, too few to show the council."
- **Wake Old Guilt, near_miss**: "…and the bad night told {actor} nothing." `nothing` is a natural indefinite in an outcome-class field (15). The fragment is also a flat failure dressed as a near miss. **[EDITORIAL REWRITE]** "One clerk came to the table shaking, but the steward said the clerk was only ill." The card nearly worked, and the opposition covered for it.
- **Wake Old Guilt, failure**: **[EDITORIAL REWRITE]** "The bad dreams found all three clerks, and every one of them came to the table shaking." This keeps the draft's good idea (the card fired too widely) and no longer shares an opener with the base afterimage.
- **Crack The Inkwell, failure**: "…came back in a hand nobody knew." This contradicts itself: the steward's papers are written by his own clerks, whose hands {actor} has just seen. **[EDITORIAL REWRITE]** "Ink ran across the steward's papers, but the steward had the fresh copies written by a town scribe." The card fired, and the opposition dodged it.
- **Crack The Inkwell, effect line**: "…fetched from the clerk who writes them" assumes one copyist, which gives away who the forger is. **[EDITORIAL REWRITE]** "…fetched from the clerks who wrote them." The § 9 success_at_cost ladder row now matches the step-1 afterimage (the clerk sent away), not the step-0 overnight delay.
- Warm The Wax's three fragments are clear and coherent. The critical_failure (the town's own seal softens and the lawyers call it a cheap casting) is the best line in the hand. Kept.

## 2. Branch Seduction Audit

Linear. The seduction lives in the hand, and the four specials answer four different questions:

- **Test The Ink** (entropy, Signature): *how old is the writing?* Decay is the honest test of age.
- **Warm The Wax** (energy, Signature): *was the seal cast or pressed?* Heat shows a mould's seams.
- **Wake Old Guilt** (mind, Signature after relabel): *who is guilty?* This is the card that says something about the god. It works on a frightened clerk's conscience rather than on the evidence, and its near_miss shows the steward covering for him.
- **Crack The Inkwell** (chaos, Stumble): *whose hand is it?* It turns the steward's own desk against him and forces a fresh writing sample.

No card dominates. Price and delta track: 1-cost at 0.09–0.10, 2-cost at 0.12.

## 3. Branch Count Assessment

**KEEP 0.** A two-step test and its consequence. The long tail rides the appointment.

## 4. Scale Discipline Check

Short, two beats. This matches the binding row. Two clean beats suit master work: read the documents, then read the people.

## 5. Inspiration Anchor Honesty

Honest. `hook.meeting_to_keep` changed the encounter: the findings are worth nothing until they are read out, so the win plants a meeting rather than closing the job. The two set-aside hooks are named with reasons. The mill lease is credited for the wiring only, and its spheres and types are not reused. The Writ at the Toll Gate's Light card and its single-document read are deliberately avoided.

## 6. Aftermath Payoff

Centred on the actor, with faces. On success the council holds the findings and {cast:steward} must answer them; on failure the town has no answer and the master's name pays. Both failure overviews now say plainly why a master's failure costs more ("it sent for a master to give it one"; "the count's lawyers now have a master's mistake to use"). This is the brief's *name before the purse*.

**Consider.** The brief's band table asks that at success_at_cost "the master carries something". Here the cost lands on the council's case (the clerk is gone, and the findings rest on {actor}'s word alone), and the chips match the success band. This is acceptable for a short appointment encounter, because the cost bites again at the inquest. It is noted, not changed.

## 6b. Page read

Each band is assembled as overview, then scar · bond · boon · path. There are no reactions. I held the step-1 afterimage alongside each page.

**critical_success (draft).** "The council locked both copies in the town chest under its own seal, with the steward watching." · BOND "The council's word on it — {location} thinks well of their work." · BOON "Made in the steward's household — {actor} knows who wrote the count's copy of the charter." · PATH "Court day in the town hall — {cast:steward} answers the findings in {location} in three days."
- Clean. The overview adds the secured evidence, BOND the regard and who spreads it, BOON who forged the copy, PATH the place and the day. Nothing is told twice.

**success (draft).** "The council has the findings in writing, signed by {actor}." Same chips. Clean. "findings" recurs as a noun in PATH, but no fact is retold.

**success_at_cost (draft).** "The council has the findings, but the steward has had time to prepare an answer to them."
- **Conflict (35).** The step-1 afterimage on this band is "the steward sent the clerk out of {location} before the council could hold anyone". The overview's "time to prepare" belongs to the step-0 success_at_cost (the steward kept the copy overnight). On a step-0 success path the overview points at something that did not happen. **[EDITORIAL REWRITE]** "The council has the findings, but with the clerk gone they rest on {actor}'s word alone." This is true on every path into the band, and it adds the consequence rather than retelling the escape.

**failure (draft).** "The council has nothing to answer the count's lawyers with, and it sent for a master so that it would." · SCAR "No forger named — {location} thinks less of their work."
- `nothing` in an outcome field (15), and "so that it would" trails off with no verb. **[EDITORIAL REWRITE]** "The council has no answer for the count's lawyers, and it sent for a master to give it one." The overview carries why it costs a master more; the SCAR carries the regard. Clean.

**critical_failure (draft).** "The count's lawyers have a master's mistake to use against the town, and {location} remembers who made it." · SCAR "Said out of turn — {location} thinks less of their work."
- **Repetition (35).** "{location} remembers who made it" and "{location} thinks less of their work" tell the same fact, a fall in the town's regard, twice. **[EDITORIAL REWRITE]** overview "The count's lawyers now have a master's mistake to use against the town's charter."
- **Conflict (35).** This band is reached two ways: step-0 critical_failure (a word said aloud against the town's copy) or step-1 critical_failure (the wrong clerk named). "Said out of turn" fits the first path. Naming a clerk when asked to name a clerk is not out of turn. **[EDITORIAL REWRITE]** SCAR title "A wrong word", cause "Said before the council". Both paths happen in front of the council. Chip: 4 + 6 = 10 words.

Chip budgets after revision (cause + detail ≤ 15): BOND 11 · BOON 15 · PATH 15 · SCAR failure 9 · SCAR critical_failure 10. No chip shares a four-word run with its overview.

**Sequels.**
- *Kept.* Spine "If {name}'s findings hold against the steward's lawyers, the bench lets the town's charter stand." → afterimage "The findings held. The bench let the town's charter stand…" This is the same if-X → X echo the mill lease critic cut (22). **[EDITORIAL REWRITE]** "The steward's lawyers found no fault in the findings. The bench let the town's charter stand, and the market stays free of the count's tolls."
- *Missed.* "With no reader there, the bench let the count's copy stand. {cast:steward} has come looking for {name}, with a purse for the findings to stay unread." The findings have already gone unread and the ruling is made, so the purse's purpose takes a second reading (29). "With no reader there" also repeats "the findings were never read" from the sentence before it. **[EDITORIAL REWRITE]** "{name} was not in the town hall on court day, and the findings were never read. The bench let the count's copy stand. {cast:steward} has come looking for {name} with a purse, to buy the written findings and burn them." The success afterimage now pays that motive: "{name} swore to the findings before witnesses, and {cast:steward} left with his purse still full." The failure afterimage is unchanged. It is backed by the `reputation_with $cast:steward` write and aimed off `$here`.

## 7. Dilemma Energy

It is a craft test with a master's stake: a town's liberties and the master's name, against a count's lawyers. The god's posture shows in where it presses. It can test the evidence (ink, seal), the forger's conscience, or the steward's own desk. Wake Old Guilt is the posture card: it finds the truth by frightening a clerk, and on a near miss it lets the steward explain him away.

## 8. Experience Differentiator Gate

This gate is answered for the revised file. Where the draft's answer differed, it is given in brackets.

1. **YES.** P1 arrival, P2 costs paid, P3 one mystery stake and the ask; 77 words. [Draft: NO. P3 never stated the ask.]
2. **YES.** Every sentence is the stake (tolls), the accusation, the opposition, the mystery, the ask or the hostility.
3. **YES.** The copies, the seal (step 0); the clerks and the steward's papers (step 1). [Draft: partial. The papers were missing.]
4. **YES.** "The council's master must tell the true charter from the false one and name the forger, or lose their name."
4b. **YES after fixes.** [Draft: NO. P2 → step-1 spine "has brought"; step-1 failure afterimage and fragment opener; kept sequel spine → afterimage.]
5. **YES.** Test, Warm, Wake, Crack are in `IMPERATIVE_VERB_LEXICON`. No effect line repeats a word of its name. No flavor quote.
6. **YES after relabel.** Every effect line states what the card does to the step, and every card is essence-priced (2/1/2/1). [Draft: NO. Wake Old Guilt was typed Whisper, whose mechanism is a reveal of the next step's demand, and there is no next step.]
7. **YES.** Every special has a failure fragment. Max Δ 0.12, so no big-delta double is owed.
8. **YES after fix.** Delete the copies, the seal, the clerks or the steward's papers, and the matching card is senseless here.
9. **YES.** Age of the writing / the cast seal / the guilty conscience / the hand on fresh copies.
9b. **YES.** Two specials plus a `deal` of three on each step; composed 5.
10. **YES.** An overview on every band.
11. **YES.** The steward and the forger are named. Nouns: `reputation with {location}` (`$here`), `knowledge`, `appointment` (`$appointment`). All pass cover-the-title.
11b. **YES after fixes.** [Draft: NO on success_at_cost (conflict) and critical_failure (repetition, conflict).]
12. **N/A** (short). 13. **N/A** (short).
14. **YES.** Emotions first; the image is residue (two parchments, a cracked seal, a spreading ink stain, no people). It shows no scene beat.

## Triggers walked 1–35

Fired and fixed: **15** (×2), **22** (×3), **26**, **29** (×2), **35** (×3), plus gates 1, 4b, 6, 8, 11b. Notes on the rest:

- **3 (thread integration):** none authored, as in the shipped boundary survey and mill lease. No trait reads a forged hand better than the reach does.
- **7 / 8 / 9 / 10:** composed 5 on each step; four special spheres (entropy, energy, mind, chaos) plus the deal's common option; every special has a failure fragment; all six StepOutcomes covered on each step.
- **13:** base afterimages read correctly with any subset of the hand. Step-0 success_at_cost (kept overnight) agrees with Warm The Wax's success_at_cost fragment.
- **14:** every card acts on the scene or a third party (the copies, the hearth, the clerks, the steward's desk). None instructs the mortal.
- **16 / 17:** the specials know their scene, as specials do, but carry no flavor quote. Every effect line is mechanism.
- **19 / 20:** no rider, no grants, one cost channel each.
- **21:** type composition after relabel is Signature + Signature / Signature + Stumble. Boundary survey: Whisper + Stumble / Signature + Compulsion. Mill lease: Cache + Signature / Signature + Kindled Ambition. No repeat.
- **24:** {actor} does the reading and the naming. Not a bystander.
- **25:** stakes stated plainly; no "pass and X / fail and Y" in the opening.
- **27:** "The Forged Charter" passes the glance test.
- **30:** named shape (Seeded Sequel, appointment variant, on Puzzle – Investigation – Resolution); the step structure matches.
- **31:** the charter, the tolls, the clerks and the inquest are scene-local; no standing is asserted.
- **32 / 33:** all nouns are sheet words; every caption is ≤ 15 words.
- **34:** the place-and-time promise rides the appointment seed's success path only. Neither sequel binds the mortal to a later place or time. The missed sequel's "burn them" is the steward's motive, not a promise the engine owes.

**Rulings recorded.**
- **Wake Old Guilt is a Signature (mind) one-off**, not a Whisper (the boundary survey's Call Up The Oath precedent). It binds no `libraryCardId`.
- **Warm The Wax is a Signature (energy) one-off.** It must **not** bind `card.boost.signature.energy`, which the brief bars outright. Bind no `libraryCardId` on any of the four specials.
- Crack The Inkwell's effect line uses "ink", and the name holds "Inkwell". These are different words, so the rule holds, and the line is the plainest available. Kept.

## Revision Summary

**Must fix (applied):** the ask in P3; the step-1 spine grounds the steward's papers and drops the "has brought" echo; `nothing` ×2 removed; Wake Old Guilt relabelled Signature (mind); the success_at_cost and critical_failure overviews; the critical_failure SCAR title and cause; the kept sequel's seam echo; the missed sequel's purse motive.

**Should fix (applied):** P2's four "count's"; step-0 critical_success now outranks success; Test The Ink's critical_success ("a dozen") and near_miss; Wake Old Guilt's failure fragment; Crack The Inkwell's self-contradicting failure fragment; step-1 failure afterimage opener.

**Consider (not applied):** give success_at_cost a cost the master carries (brief band table), if Pass 3 finds a band-keyed write that fits without a new primitive; widen the knowledge record's concept to "who wrote the count's copy, and at whose order" (the brief's "and for whom").

PASS WITH REVISIONS

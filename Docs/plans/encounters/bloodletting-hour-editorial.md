# Encounter Pipeline: The Bloodletting Hour
> Scale: medium | Slug: bloodletting-hour | Pass: editorial
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 (THR-1840), slot 6

## Verdict: PASS WITH REVISIONS

The design is sound and inside the brief: star throughout (0.74 → 0.82), test & consequence with a real carryover, `knowledge` + `secret` wired, the master's failure costs only their name, and the bishop lives on every band. Three problems fired triggers on the draft as gated: no reaction choices on a medium encounter (trigger 4); the knowledge/favour payoff (the canker) appears in no prose before the chips claim it (trigger 26, a payoff with no setup); and three bands whose page tells one fact twice (trigger 35). All three can be fixed inside this pass without touching the design. I fixed them in the package and in `bloodletting-hour-revised.md`. The gate is green after the edits.

## 1. Prose Quality

**Opening (urban).** It follows the skeleton cleanly: P1 arrival, P2 fever + rule of the hour + the physician's refusal, P3 the ask. Weak spot: P3 closed with "{cast:physician} will not wait long for it." That is the third telling of "the physician won't wait" across two paragraphs ("says the fever cannot wait for the stars" one sentence earlier), and the step-1 spine then tells it twice more ("the college bleeds a fever at once" … "The college will bleed the bishop now unless"). It also left the almanac, which Fix The Sums acts on, unintroduced.

[EDITORIAL REWRITE] P3: "The household asks {actor} to cast the figure for the bleeding: the moon's sign and the safe hour, from the tables in their almanac." (Opening total stays 78 words.)

**Step-1 spine.** It doubled the college's rule inside one paragraph and never named the fire that Warm The Chamber acts on.

[EDITORIAL REWRITE] "{cast:physician} speaks for the physicians' college. He stands at the bishop's bed, by the fire, with the basin and the blade. / The household will let {actor} argue the figure's hour at the bedside. The college bleeds a fever at once, and will bleed the bishop now unless {actor} holds them to it. A master who cannot hold a bedside loses the trust of {location}."

**The hidden shape (hook `shifting_shape`).** The draft's central idea, a fever over a hidden canker, exists only in effect metadata and chip text. No line of prose shows the master seeing anything. The favour chip read "Kept his illness quiet", but the player never sees the master keep anything quiet, and "his illness" reads as the fever.

[EDITORIAL REWRITE] Each success-side step-1 afterimage gains: "At the bedside {actor} saw a hard swelling under his ribs, and kept quiet about it." (SAC says "the bishop's ribs" because its first sentence ends on the physician.) The sentence is backed by the `intelligence` and `favor_creation` effects on the same bands, so it asserts no state the band does not write.

**Card fragments.** Fix The Sums SAC "…and the night was nearly gone" echoed the step-0 SAC afterimage "casting it took most of the night" across the seam. [EDITORIAL REWRITE] "Every column added up, but they checked each one twice before they trusted it." Warm The Chamber SAC "the physicians said the heat was {actor}'s doing" needs two readings (a complaint? credit?). [EDITORIAL REWRITE] "The fire held all night and the bishop slept, but the physicians called the heat an astrologer's meddling."

**Afterimages otherwise** are good GM narration: short, factual, with costs stated plainly ("The bishop is weaker, and the college says the astrologer only delayed them").

## 2. Branch Seduction Audit

Linear, with no branches. The mortal does not choose a path. Only the reaction choices fork, after the result (see § 6).

## 3. Branch Count Assessment

KEEP 0. A test & consequence shape needs no fork; the carryover does the work.

## 4. Scale Discipline Check

Medium, two beats: correct. Medium owes reaction choices (trigger 4). The draft justified none ("consequence is clean"), but the scene has a live philosophical fork that the template already names in `motivations: tradition_novelty`: the master has just overruled a college at a bedside. Added on the three success-side bands:
- **Make peace with the college.** Grant the senior physician that his college's rule has saved lives before tonight (bond + with `$cast:physician`).
- **Stand by the art.** Say plainly that the stars rule a bleeding, not the college (bond + with `$cast:bishop`, bond − with `$cast:physician`).

Neither contradicts the favour, which is written on every success band whatever the reaction. I rejected a "tell the chapter about the canker" reaction for that reason: it would contradict the favour chip.

## 5. Inspiration Anchor Honesty

Honest. The zodiac man gave step 0 a concrete test and kept the verb distinct from the board's nativity and feast calendar. Expert-against-institution gave step 1 its opposition. Until this pass `shifting_shape` was decoration: it lived in metadata only. It now lands in prose.

## 6. Aftermath Payoff

The aftermath is actor-centred and names the cost of failure for a master plainly: the palace asks the physicians now, and will not send again. On the success side the favour and the knowledge now have a visible cause. Consider: the SAC cost (the college's grudge) is prose-only, and no state backs it. The reactions now give the player a lever on it (make peace or not), which partly closes the gap.

## 6b. Page read

Assembled as overview → chips (scar · bond · boon) → reactions.

**critical_success (draft).** "The bishop is sitting up, and the household will ask {actor} for the hour of every bleeding now." − reputation: "The palace's word on it. {location} thinks well of their figure." − favour: "Kept his illness quiet. {cast:bishop} owes {actor} a favour." − knowledge: "Under his ribs. {actor} knows of the canker the chapter was never told of." No reactions.
- Repetition: none literal.
- Verbosity: "The palace's word on it" carries nothing.
- Conflict: "Kept his illness quiet" refers to an illness and a silence the page never set up. The reader meets the favour before the canker (bond precedes boon).

**success (draft).** "The bishop's household trusts {actor}'s figure over the college's haste." + "{location} thinks well of their figure."
- **Repetition:** "trusts {actor}'s figure" / "thinks well of their figure" tell the same fact.

**success_at_cost (draft).** "…the physicians' college now speaks against {actor} at every sickbed in {location}." + "{location} thinks well of their figure."
- **Conflict:** the town thinks well of a figure that its physicians denounce at every sickbed in that same town. "At every sickbed" also promises later world behaviour that nothing enacts.

**failure (draft).** "The college bled the bishop before the hour…" + "The college would not wait. {location} thinks less of their figure."
- **Repetition:** "The college would not wait" retells "bled the bishop before the hour".

**critical_failure (draft).** "The household believes {actor} cast the figure wrong…" + "An error in their own sums."
- **Repetition:** "an error in their own sums" retells "cast the figure wrong". Verbosity: "{actor}" twice in one overview sentence.

**Revised pages (as shipped in the package):**

- **critical_success:** overview unchanged · reputation "Word from the palace. {location} thinks well of {actor}." · favour "Kept his secret. {cast:bishop} owes {actor} a favour." · knowledge "Under his ribs. The swelling is a canker his chapter has not been told of." · > Make peace with the college · > Stand by the art. **Clean**: the afterimage has already shown the swelling, the favour names its cause, and the knowledge chip adds the new fact (a canker, hidden from the chapter).
- **success:** overview unchanged (the household's trust) · reputation is now the town's regard, a different party and fact · favour, knowledge and reactions as above. **Clean.**
- **success_at_cost:** "The bishop was bled at the hour, but the physicians' college has not forgiven {actor} for overruling it." · "{location} still thinks well of {actor}." The "still" reconciles the town with the college's grudge. **Clean.**
- **failure:** overview unchanged · "Word from the palace. {location} thinks less of {actor}." **Clean.**
- **critical_failure:** "…and the palace will not send for them again." · "Talk from the bedside. {location} thinks less of {actor}." **Clean.**

## 7. Dilemma Energy

The tension is real: the master's art against an institution acting in good faith, with the patient's life as the shared stake. The god's posture shows in what it touches: memory and sums in step 0; blade and fire in step 1. With the reactions, the player also decides what the master makes of the win: deference or vindication.

## 8. Experience Differentiator Gate

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode opening, ≤80 words | YES | Arrival · fever + rule of the hour + refusal · the ask. 78 words. |
| 2 | Every sentence does challenge/test/outcome work | YES (after edit) | The redundant "will not wait" lines are cut. |
| 3 | Scene names what the hand acts on | YES (after edit) | Moon (Remember), almanac (Fix, added), blade (Blunt), fire (Warm, added). |
| 4 | Retellable after one read | YES | "The physicians want to bleed the bishop now; the master must cast the safe hour and hold them to it." |
| 4b | No seam echoes | YES (after edit) | The physician-won't-wait chain is broken; Fix The Sums no longer echoes "most of the night". |
| 5 | Spell-style card faces, no scene-bespoke prose | YES (after edit) | Blunt The Blade "Dull an edge in the room…"; Warm The Chamber "Keep a fire high and steady…". Both effect lines dropped "physician" and "sickbed". |
| 6 | Effect lines state mechanism; prices real | YES | Each line says what the card does to the step. Essence 1–2. |
| 7 | Every card pays off in failure | YES | Each card has ≥1 failure-band fragment. No Δ ≥ 0.15. |
| 8 | Every card grounded before the hand | YES (after edit) | Almanac and fire are now in the spines. |
| 9 | Cards answer different questions | YES | Memory of the sky vs correct sums; stopping the blade vs easing the fever. |
| 9b | Composed 4–8 hands, no branch-picking | YES | 2 specials + deal 3 per step = 5. |
| 10 | Reflective prose landing | YES | Band overviews plus step-1 afterimages. |
| 11 | Actor-centred, character-sheet chip nouns | YES | `reputation with {location}`, `a favour owed`, `knowledge`. All three pass the cover-the-title test. |
| 11b | Every assembled page reads clean | YES (after edit) | § 6b: three repetitions and one conflict on the draft are resolved. |
| 12 | Medium+: reaction choices | YES (after edit) | Two reactions on each success-side band. Failure bands carry only the scar, as in sibling packages. |
| 13 | Reactions are philosophical stances | YES | Deference to the institution vs the authority of one's own art (`tradition_novelty`). |
| 14 | Two-question art direction, evocative | YES | Waiting / quiet authority / a secret kept: an unlit basin, a folded lancet, the zodiac man at grey dawn, no people. |

## 9. Verdict

**PASS WITH REVISIONS.** On the draft as gated, triggers 4, 26 and 35 fired. Each has a contained prose or aftermath fix, and all are applied in `bloodletting-hour.package.json` and `bloodletting-hour-revised.md`. No id, difficulty, effect, deal, sphere, cost, delta, cast key or stakes rule changed. The reactions are new content (bond_change effects), added because trigger 4 requires them.

## 10. Revision Summary

**Must fix (applied)**
- Add reactions on the success-side bands (trigger 4).
- Put the canker in step-1 success-side afterimages so the favour and knowledge chips have a cause on the page (trigger 26).
- Rewrite the reputation chips and the SAC and critical_failure overviews to remove the repetitions and the SAC conflict (trigger 35).

**Should fix (applied)**
- Cut the duplicated "won't wait" lines; introduce the almanac and the fire before their cards.
- Make the Blunt and Warm effect lines generic, not scene-bespoke.
- Fix The Sums SAC seam echo; make the Warm The Chamber SAC fragment readable in one pass.

**Consider (not applied)**
- The SAC cost (the college's grudge) has no state behind it. A later pass could back it with an effect if a faction-standing channel for the college exists.
- The package `doc` design block still lists the systems quota without the reaction bonds. This is agent-facing only.

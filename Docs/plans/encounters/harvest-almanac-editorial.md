# Encounter Pipeline: Calling the Harvest
> Scale: short | Slug: harvest-almanac | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0
> Template: `encounter.town.harvest_almanac` · Batch: expert-everyday-2, slot 5 (THR-1679)

**Verdict: PASS WITH REVISIONS.** The design block is sound and faithful to the slot 5 row. It has the star reach at 0.64, one step, `rural`, `drive` + `movement` with no swap, a friendly village, own-trait opposition, and a pleasure register. The fixes are local. One card name would fail the imperative-lexicon gate. The P3 stake used announced "if right, then X" framing. There were two seam echoes and one ambiguous overview line. On one ending, the overview and a chip pulled against each other. Coverage of `success_at_cost` depended on a Proud-gated card. The Proud trait card could put a Proud reader ahead of a neutral one for free. Every fix is applied inline in the revised file.

---

## 1. Prose Quality

**Opening.** The skeleton is right: P1 is the arrival, P2 the barley and the storm against the stars, P3 the ask. The facts are stated plainly and nothing is in situ. Three defects:

- **Seam echo (P1 → P2).** P1 ends "in the last days of summer" and P2 then says "a few more days". Two uses of *days* sit across the boundary, and the second one carries the crux, so it has to keep the word.
- **The ask sits in P2.** "{cast:elder}, the village elder, asks {actor} to name the day…" is the problem, so it belongs to P3. P2 should carry only the situation and the complication.
- **P3 announces an outcome mechanic (trigger 25 territory).** "If the call is right, the next village will want this reader too" is conditional success framing, a pass-and-X. The stake should be stated as a fact of the world. That also removes the claim that one specific "next village" will send, which the `nearest_settlement` relocation can only half keep (it may resolve to a town).

[EDITORIAL REWRITE]: opening (P1 is `openings.rural`, P2 + P3 are the spine)
> {actor} arrives at {location} at the end of summer.
>
> The barley is nearly ripe. The stars say it needs a few more days to fill, but a storm is building in the west and may not give them.
>
> {cast:elder}, the village elder, asks {actor} to read the sky and name the day the harvest starts. Every household cuts on that one word. Villages all down the valley send for a reader who gets that call right.

76 words. The P3 promise is now a general fact of the world, and the success half's relocation pays it off.

**Afterimages.** Four of the five are clean. The critical_success afterimage, "saw the storm in the west would not wait", repeats the spine's "storm is building in the west" across the spine → band seam.

[EDITORIAL REWRITE]: critical_success afterimage: *{actor} judged the storm would not wait, and named the next morning.*

**Overviews.**
- critical_success: "the first loaf from the new grain went to the reader". *The reader* is a new noun for {actor}, introduced at the ending. [EDITORIAL REWRITE]: *The last cart was in the barn when the storm broke. {cast:elder} brought the whole village out to thank {actor} with the first loaf of the new grain.*
- success and critical_failure: "{location} will eat this winter" and "{location} will buy grain this winter" are forward claims no effect enacts. They are harmless fiction, but a present-state fact reads better and promises nothing. [EDITORIAL REWRITE]: success, *{location} has its grain for the winter.* critical_failure, *{location} has too little grain for the winter.*
- critical_failure: "The village sent for the best reader it could find" contradicts the opening, where the elder *asks* (why-here is mission **or** chance). [EDITORIAL REWRITE]: *The village staked its year on the best reader it could find, and the best reader got it wrong.* This keeps the expert cost stated plainly, as the brief requires.
- failure: "No one in {location} says so to {actor}'s face." The *so* has no stated antecedent, since the reader's fault is never said. It needs two readings (trigger 29 territory). [EDITORIAL REWRITE]: *No one in {location} blames {actor} out loud.*
- success_at_cost: see § 6b (conflict).

**Band fragments.**
- Hasten, success: "…before naming the day" repeats *day* inside one fragment. [EDITORIAL REWRITE]: *The warnings came a day early, and {actor} had weighed every one before the call.*
- Hasten, near_miss: "the wind turned twice before dawn" encodes the fact instead of stating it. The player cannot tell what it did to the call. [EDITORIAL REWRITE]: *The warnings came early, but they did not agree, and {actor} had to guess between them.*
- Hasten, **added** success_at_cost: *The warnings came early enough for {actor} to change the day, though not for every field.* See § 3 below for why.
- Stoke Their Pride, **added** success: *Every murmur sent {actor} back to the sky, and the second reading caught the storm.* A gated card that pays off only in failure and at-cost reads as a trap. The flaw-as-fuel fantasy needs one clean win.

**Card faces.**
- **"Sting Their Pride" fails the gate.** `sting` is not in `IMPERATIVE_VERB_LEXICON` (`src/data/content-eval/doctrineV2Checks.ts:94`), which is the same failure class as batch 1's "Counsel Patience". [EDITORIAL REWRITE]: **Stoke Their Pride** (`stoke` is in the lexicon, and it says what the card does: the god feeds the flaw until it burns as effort). The id becomes `harvest.stoke_their_pride`, and the Proud variant's `addNudgeIds` follows it.
- Stoke effect line: "Make every doubting murmur rankle, so they check the work again to prove the doubters wrong" says *doubting*/*doubters* twice. [EDITORIAL REWRITE]: *Make every murmur of doubt rankle, so they go over the work again to prove it right.*
- **Hasten effect line is ambiguous.** "Bring a coming change forward" reads first as bringing *the storm* forward, which would hurt the reader. The mechanism is that the *warnings* arrive early. [EDITORIAL REWRITE]: *Make the warnings of a coming change show early, so there is more to read before the choice.* No word from the name is reused, there are no digits, and it stays generic.

## 2. Branch Seduction Audit

Linear, so there are no branches. The seduction is in the hand. **Hasten The Signs** is the "give them more truth" fantasy: the god works on the world, the one thing the reader cannot touch. **Stoke Their Pride** is the rarer and better fantasy: the god works on the mortal's worst habit and turns it into diligence. It protects the reader's name *through* their vanity. The two do not buy the same certainty. Both are worth keeping.

## 3. Branch Count Assessment

**KEEP 0** (linear, single test). Correct for the shape.

**Hand.** The hand is 2 specials plus `deal: 4`, so 5 cards for most readers and 6 for a Proud one, inside 4–8. The draft claimed the specials "between them" cover all six `StepOutcome`s, but the Proud-gated card was the only source for `success_at_cost`. For a non-Proud reader the specials therefore left that band to the dealt fill. It is not a trigger-10 failure, since the dealt members bring `BAND_FRAGMENTS`, but it is a coverage claim that was not true as written. Hasten now carries all six bands on its own, so the claim holds with the gated card absent.

## 4. Scale Discipline Check

Short, one beat, one decision. It is right-sized. The expert weight comes from the stake (a village cuts on one word), not from length. Pass.

## 5. Inspiration Anchor Honesty

Honest. The Natural Disaster archetype's *Hubris vs. Humility* concept moved the opposition from the weather into the mortal. That move is the encounter's best idea, and it is visible in the variants, the trait card and the failure afterimages. The anti-pattern list is applied, not recited: Prophecy-as-Railroad is avoided because the stars can be wrong. Pass.

## 6. Aftermath Payoff

The chips are actor-centred and every chip is backed by a band-half write. The pleasure register holds: on failure the reader stays to help (`assist` compulsion) and is not punished. The critical_failure states the expert cost plainly. The success-side PATH chip was improved (see 6b).

### 6b. Page read (THR-1474)

Each band assembled as the player meets it: overview → chips in scar · bond · boon · path order → no reactions.

**critical_success (draft):**
> The last cart was in the barn when the storm broke. {cast:elder} brought the whole village out to thank {actor}, and the first loaf from the new grain went to the reader.
> - BOND · reputation with {location}: {location} trusts {actor}'s reading of the sky.
> - PATH · seed: Sent for — {actor} is travelling to the next village now.
> - PATH · ambition: Means to write an almanac — {actor} is pursuing Build a Great Work now.

No repetition: thanks and trust are different facts. **Verbosity:** the causeClause "Sent for" is a two-word fragment that makes the reader stop and ask *by whom?* **Conflict (minor):** the chip claims "the next village", but `nearest_settlement` resolves to any hamlet, town, city, capital or camp. [EDITORIAL REWRITE] (all three success bands): causeClause *"Sent for by the nearest settlement"*, detail *"{actor} is on the road there now."* (13 words), concept *"the nearest settlement"*.

**success:** clean after the overview rewrite.

**success_at_cost (draft):**
> The changed day cost the village a field, cut half green. The rest came in dry. {cast:elder} thanked {actor}, and meant it, but **the village will remember the field.**
> - BOND · reputation with {location}: **{location} trusts {actor}'s reading of the sky.**

**Conflict: REVISE-class (trigger 35), fixed inline.** The overview says the village holds the field against the reader. The chip, backed by the same +0.06 write as a clean success, says the village trusts them. The draft's defence ("a reservation, not a loss") is a reading of intent. The page itself tells the player two opposite things about the village's regard. The write cannot change per band, so the overview yields. [EDITORIAL REWRITE]: *The changed day cost the village one field, cut half green. The rest came in dry, and {cast:elder} thanked {actor} all the same.* The cost stays on the page as a fact, and the chip is no longer contradicted.

**failure:**
> The storm came first. It flattened the south fields, and half the barley is lost. No one in {location} blames {actor} out loud.
> - SCAR · reputation with {location}: {location} trusts {actor}'s reading of the sky less.
> - SCAR · compulsion: For a while {actor} puts helping others before their own work.

These are complementary: the overview gives the silence, the chip the loss of trust, and the second chip the forward beat. Clean.

**critical_failure:** the overview now uses *staked its year*, which does not paraphrase the chip's *trusts … less*. Clean.

## 7. Dilemma Energy

The dilemma is the god's, and it is real. A Proud reader's god must decide whether to lean on the flaw for free or to pay two essence for more warning. A Humble reader's god has less reason to spend at all. It is not a moral dilemma, and it does not need to be, because the brief marks this as the batch's pleasure. The tension is judgement under a clock, and the motivations (`courage_prudence`, `tradition_novelty`) name both axes it runs on.

## 8. Experience Differentiator Gate (after revisions)

1. Narrator skeleton, ≤80 words, facts plain? **YES.** 76 words, and the ask has moved to P3.
2. Every sentence does challenge/test/outcome work? **YES.**
3. Scene names what the hand acts on? **YES.** The storm (Hasten) and the stars' reading (Stoke, variants).
4. Retellable after one read? **YES.**
4b. No seam echoes? **YES, after the fixes.** P1 "days" → "end of summer", and the critical_success afterimage no longer repeats "storm in the west".
5. Spell-style faces, no bespoke prose? **YES, after the rename.** "Sting" was outside the imperative lexicon.
6. Mechanism stated, price real? **YES.** Hasten's line was disambiguated. Stoke's price is being Proud (a trait card).
7. Every card pays off in failure? **YES.** Both have failure and critical_failure fragments.
8. Grounded in the scene? **YES.**
9. Different questions? **YES.** The world versus the mortal.
9b. Full hand, no branch picked by the player? **YES.**
10. Reflective aftermath prose? **YES.**
11. Actor-centred; chip nouns are sheet words? **YES, with one noted weakness.** `reputation with {location}`, `ambition` and `compulsion` pass. `seed` on a relocation is the corpus's shipped form (the-sign-over-the-ruin, the-broken-seal, assize-letter) because no travel tooltip exists. It is not fixable in Pass 2, and it is flagged for the batch report.
11b. Every band's page reads clean? **YES, after fixes.** The success_at_cost conflict and the "Sent for" fragment are fixed.
12. Medium+ reactions? **N/A** (short).
13. **N/A.**
14. Evocative art? **YES.** An empty threshing floor, a ringed day and a cloud bank. No people, no outcome.

## 9. Rulings on the drafter's flags

1. **`nearest_settlement` may resolve to null.** *Accept.* `RELOCATION_NEAREST_SETTLEMENT_MAX_HEXES` is 12 (`src/data/movement-content.ts:273`). On a `rural` start, having no hamlet, town, city, capital or camp within 12 hexes is an edge case, not a pattern. `away` would be dishonest to the P3 promise. Pass 3 measures the null rate on a seed sweep and reports it; that is not a Pass 2 stop.
2. **The relocation chip label is weak.** *Improved, not solved.* The caption now names who sent for them and where they are going, without claiming "the next village". The noun stays `seed` for the reason given in gate Q11. A travel/journey tooltip would be a UI-surface addition, outside this ticket.
3. **≥4 spheres depends on the deal.** *Defer to `checkComposedHand()`.* The dealer guarantees breadth and prefers ≥1 ungated common option. Stoke is hidden for non-Proud readers anyway, so it never counted. If the gate reports short, raise `count` to 5 (the hand stays ≤7). Do not move Hasten off `time`, because an Omen on time is the honest sphere for bringing a warning forward.
4. **`rural` includes `mining`, but the prose names barley.** *Keep `rural`; do not narrow.* The spec says to write toward the widest honest envelope, "enforced by prose, never by narrowing". The `locationTypes` override is reserved for genuinely specific encounters, such as a temple rite. A mining hamlet with barley around it is plausible. The revised spine says only "the barley" and "every household", with no farming-village claim.
5. **Judgemental trait ref unproven.** *Live by pattern; the gate confirms.* `trait.personality.<reach>.vice` is the shipped form (`trait.personality.gold.vice` in debt-arbitration, `trait.personality.iron.vice` in ambition-templates). The word is `Judgemental` (`src/types/axisRegistry.ts:128`). `check:encounter`'s `validateTraitRefs` is the proof, and Pass 3 must quote it. If it reports the ref dead, drop the variant rather than substitute another trait.
6. **A Proud reader can net-beat a neutral one on a free card.** *Ruled: Stoke's delta drops to **0.05**, net zero.* In every shipped trait card, the card sits on a *virtue* with a positive variant, so a free card was always a bonus on top of a strength. Here it sits on a vice. The honest reading of "the god turns the flaw into fuel" is that the god can bring a Proud reader back to level for free, but not past a neutral one. Going beyond level is what Hasten's two essence buys. 0.07 would still leave a free +0.02 edge, which is the problem the drafter named.
7. **Systems count at the floor of 3.** *Hold at 3.* An honest fourth would be a seed or a condition. A personal condition is the default the brief tells the batch to avoid. A seed on a closed, local pleasure scene has no second scene to plant, and bolting one on is the nearest-reach habit the Consequence Draw exists to stop. Relocation and compulsion are real further connections, even though the quota's six-system manifest does not count them. The floor is the contract.

## 10. Revision Summary

**Must fix (applied):**
- Rename "Sting Their Pride" → **Stoke Their Pride** (`harvest.stoke_their_pride`), which fixes the imperative-lexicon gate failure. `addNudgeIds` is updated to match.
- Fix the success_at_cost page conflict (overview versus the trust chip).
- Rewrite P3 to remove the "if right, then X" announced framing and move the ask from P2 to P3.
- Fix the seam echoes: P1 "days" → "end of summer", and the critical_success afterimage.
- Stoke delta 0.08 → 0.05.

**Should fix (applied):**
- Disambiguate Hasten's effect line (warnings early, not the storm early).
- Give Hasten a success_at_cost fragment so the ungated special covers all six bands. Give Stoke a success fragment.
- Replace the ambiguous "says so" in the failure overview. Change "sent for" in the critical_failure overview so it does not contradict the opening. Make the grain-for-winter claims present-state.
- Change the PATH chip caption to "Sent for by the nearest settlement / {actor} is on the road there now."
- Fix the critical_success overview's new-noun "the reader". Fix Hasten success's repeated "day". Restate Stoke's effect line without the doubting/doubters repeat.

**Consider (not applied):**
- A travel/journey tooltip so relocation chips stop borrowing `seed`. This is a corpus-wide UI item for the batch report, not this encounter.
- If `checkComposedHand()` reports fewer than 4 spheres, raise `deal.count` to 5.

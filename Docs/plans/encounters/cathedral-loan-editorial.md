# Encounter Pipeline: The Cathedral Loan
> Scale: short | Slug: cathedral-loan | Pass: editorial
> Date: 2026-10-05 | Pipeline version: 2.0

Cold critic pass. I judged the draft against the nudge-authoring spec (§ Prose doctrine v2, § Consequences rules 0–3 and 1b/1c, the detector field classes, § 3 and § 3b on hands), the 35 automatic REVISE triggers in the encounter-pipeline skill, the brief's slot 2 row, premise 2, wiring notes and over-exposed cards (`master-everyday-brief.md`), the green package (`cathedral-loan.package.json`, re-run on the machine gate: clean, 0 warnings), and the two shipped gold experts (`debt-arbitration`, `mill-lease-auction`). I read every band as an assembled page (§ 6b), with the step-1 afterimage held in front of it, because that is the line the player reads just before the overview.

**Verdict: PASS WITH REVISIONS.** The game design is sound. The crux is one plain sentence. The two Gold steps are different jobs: stop a lawful seizure, then win a grant across a table. The opposition is the law doing its duty, and nobody in the scene is a villain. The consequence hand is honest. Every chip is backed by a write, and every chip noun is a sheet word. The defects are in the words, in the seams, and in one special that copies a card both shipped gold experts already play. Each defect is fixed in place in `cathedral-loan-revised.md`. The binding row is untouched: id, reach, difficulties 0.74 / 0.80, danger → confrontation → aftermath, `urban` only, relationship + possession, `rarityTier 2`, `intrinsicTier 'shaping'`, `scale 'local'`.

Triggers that fired on the draft:

- **15** (detector, outcome class): `nothing` in the step-1 critical_failure afterimage ("offered the lenders nothing they could use") and in the failure overview ("saved nothing"). The package's `fallback.overview` also carries the evasive `the matter` ("with the matter of the plate decided"). The draft never shows that line, but it is player-facing, so it is fixed here too.
- **22** (seam echo), five times. Each step-1 afterimage is told again by its band overview in fresh words (success, success_at_cost and failure most nearly). The step-0 success afterimage ends "sent for the lenders' factor", and the step-1 spine opens "{cast:factor}, the lenders' factor". The step-1 critical_failure afterimage "told the whole chapter" is followed by the overview "told the chapter".
- **26 / gate 8** (ungrounded). The chapter's tithes are the whole of the master's offer, but no prose before step 0's afterimages names them. A player meets "the chapter's tithes" for the first time in a result line. The writ is also used with "the" before the opening establishes it.
- **29** (needs two readings). "kept on the carts the plate they had already weighed" (step-0 success_at_cost afterimage). "The dean trusts the mortal more, and the factor less" (who trusts whom less?). Hold To Procedure's near_miss fragment "stopped to hear the offer, and went on loading" says they stopped and did not stop.
- **35** (page read). The step-0 critical_failure afterimage says the carts left "before the factor ever came", but the step-1 spine then has the factor arrive, and step 1 resolves as if the plate were still at hand. The failure overview's "every lender in {location} now knows" repeats its own SCAR. The success_at_cost overview's "paid {actor} … all the same" pulls against the BOND chip ("trusts {actor} now") on the same page. The critical_failure band chips only the dean, but step 1's `failureMetadata` also writes `reputation_with $here −0.10` on that band. The spine promised "every lender in town will hear", and on this band the page never pays it.
- **Brief non-collision** (the orchestrator's comparable-encounter instruction, and the brief's "do not repeat their verb"). **Hold To Procedure** ("Press the letter of their own writ on the bailiffs") is the card both shipped gold experts already play. Debt Arbitration has *Invoke The Rule*, "Hold the elders to the letter of their own procedure". The Mill Lease has *Read Out The Rule*. A third gold expert should not play it a third time. It is re-skinned to **Slow The Loading**, still order and still opposing the bailiffs, but it now buys time instead of a hearing.
- **Type labels (gate 6, as the slot-1 critic ruled for Wake Old Guilt).** Favor creates or calls in a favour owed, and Hold To Procedure owes nobody anything. Cache leaves an item to be found, and Dull The Silver leaves nothing behind. Compulsion is a dream-sent urge on the *mortal's* next decision, but Plant The Fear works on the factor. Whisper reveals the next step's demand, and Open The Ledger is on the last step. All four are relabelled (code comment only, no package field moves): Slow The Loading → Signature (order). Dull The Silver → Stumble (matter): the plate is the bailiffs' security, and the tarnish is physics turned against it. Plant The Fear → Signature (mind). Open The Ledger → Signature (light). The relabel also leaves the batch's one Compulsion unspent.

## 1. Prose Quality

**Opening.** The skeleton is right. P1 is an arrival with graph names. P2 gives the costs already paid (the default, the lawsuit won, the bailiffs weighing). P3 has one threat stake, stated plainly, and ends on the ask. It is a game master's report, with no camera and no texture. Two defects:

- **The tithes are never named before the dice (26).** The master's whole move in both steps is "take the chapter's tithes instead of the plate". The draft's narrator Q8 says the tithes are introduced in step 1's spine, but step 0's own afterimages (critical_success, success) name them first. **[EDITORIAL REWRITE]** P3, last sentence: "{cast:dean}, the dean, asks {actor} to offer them the chapter's tithes before the carts are loaded." The stake now reads as a test: will the bailiffs take the tithes as the better security?
- **"The writ" arrives with "the" before any writ exists.** **[EDITORIAL REWRITE]** P2: "The lenders went to law and won a writ."

Recount after both rewrites: P1 12 + P2 35 + P3 32 = **79** (≤ 80).

**Step-1 spine.** It is clean. One named person (the factor), the opposition's want ("the whole debt"), the test ("make the chapter's tithes worth more to the lenders than the silver"), and the stake stated as fact and cost, which doctrine v2 asks for. "If the factor says no …" names the stake, not outcome mechanics, so trigger 25 does not fire. Kept verbatim. The one seam it had is fixed from the afterimage side (below).

**Afterimages, step 0.**

- critical_success: kept. It now pays a stake the opening set up.
- success: "…and the bailiffs sent for the lenders' factor." It hands the spine its own appositive (22). **[EDITORIAL REWRITE]** "They offered the chapter's tithes in place of the plate, and the bailiffs sent word to the lenders."
- success_at_cost: "The bailiffs stopped, but kept on the carts the plate they had already weighed." The object is inverted, so the line takes two readings (29). **[EDITORIAL REWRITE]** "The bailiffs stopped, but the plate they had already weighed stayed on the carts."
- failure: "…to wait for the factor's word." On this path the factor has not been introduced. **[EDITORIAL REWRITE]** "The bailiffs kept weighing, and the plate went onto the carts to wait for the lenders' word."
- critical_failure: "…and the loaded carts left before the factor ever came." This contradicts the spine that follows: the step is `continue_weakened`, the factor comes, and step 1 resolves as if the plate could still be saved (35). **[EDITORIAL REWRITE]** "The bailiffs would not hear the offer, and loaded every piece of plate onto the carts." This matches Dull The Silver's critical_failure fragment and the step-1 failure carryover.

**Afterimages, step 1.** Each one is the transaction, and the band overview should carry what it *means*. The draft's overviews retold the transaction instead (22, see § 6b). Two afterimages change:

- success_at_cost: **[EDITORIAL REWRITE]** "The factor took the tithes only when {actor} agreed to a harder rate." This tells the moment at the table. The overview then carries the duration ("for a generation") as news, not a retelling.
- critical_failure: "…{actor} had offered the lenders nothing they could use." `nothing` (15). Its "told the whole chapter" is also echoed by the overview's "told the chapter" (22). **[EDITORIAL REWRITE]** "The factor refused, and called for the bailiffs before {actor} had finished speaking." The public scorn moves to the overview, where it is the cause of the two chips.

**Carryover.** critical_success "The bailiffs have already stopped for their offer." Whose offer is "their"? The bailiffs'? **[EDITORIAL REWRITE]** "The bailiffs have already stopped for the chapter's offer." The others are kept.

**Band fragments.**

- **Hold To Procedure → Slow The Loading** (re-skin, see triggers). **[EDITORIAL REWRITE]** effectLine "Make the bailiffs write down every piece before it moves. The carts wait until the list is signed." No name word appears in the effect line, in any form. 18 words. Fragments: critical_success "The bailiffs were still writing their list when {actor} made the offer, and not one piece had moved." · success "The bailiffs stopped loading to write the list, and heard the offer while they wrote." · near_miss "The bailiffs wrote the list quickly, and went on loading while they heard the offer." · failure "The bailiffs loaded first and wrote their list on the carts." It still covers cs / s / nm / f, still opposes `bailiffs`, and keeps essence 2 and Δ 0.10. The draft's near_miss contradiction (29) goes with the old face.
- **Dull The Silver, success**: "…and their clerk stopped writing." This encodes a fact as a gesture for the reader to decode, and the clerk is unintroduced. **[EDITORIAL REWRITE]** "The plate weighed light on the bailiffs' scales, and the tithes looked the better security beside it."
- **Dull The Silver, success_at_cost**: "…and {cast:dean} saw the tarnish on it." This is encoded too: what did seeing it cost? **[EDITORIAL REWRITE]** "The plate weighed light, but the tarnish stayed on it after the weighing." The cost is now stated: the cathedral's own plate is left spoiled.
- **Plant The Fear, failure**: "…and asked for more of the plate to cover it." The writ already takes all of the plate, so there is no "more" to ask for. **[EDITORIAL REWRITE]** "The factor worried about the silver's price, and asked for the tithes as well as the plate."
- Open The Ledger's four fragments are the best lines in the hand. Its critical_failure ("the largest was the chapter's own unpaid interest") is a clean master's reversal. Kept.

## 2. Branch Seduction Audit

The encounter is linear. The seduction lives in the hand, and after the re-skin the four specials answer four different questions:

- **Slow The Loading** (order, Signature): *can the plate be kept off the carts long enough?* It buys time with the bailiffs' own paperwork. Its near_miss shows them loading while they listen.
- **Dull The Silver** (matter, Stumble): *can the plate be made the worse security?* The god spoils the cathedral's own treasure to save it. On success_at_cost the tarnish stays, and that is the card's real price.
- **Plant The Fear** (mind, Signature): *will the factor doubt the silver?* It works on the opposition's arithmetic. On failure the factor's fear makes them greedier (they want the tithes *and* the plate).
- **Open The Ledger** (light, Signature): *what is really owed?* This is the posture card. Light shows everything, including what the client hid, and on critical_failure the truth sinks the chapter.

No card dominates. Price tracks delta: 1-cost at 0.08, 2-cost at 0.10–0.12.

## 3. Branch Count Assessment

**KEEP 0.** A short two-beat test. The stances live in the reactions.

## 4. Scale Discipline Check

Short, two beats, matching the binding row. A master is sent for to settle one sharp problem in an afternoon. The opening (79 words), the spine (4 sentences) and the five bands sit inside every budget.

## 5. Inspiration Anchor Honesty

Honest. `hook.political_labyrinth` changed the encounter: nothing can be taken back by force, and the plate stays only if the lenders *grant* other terms. That is why step 0 cannot win the plate, only stop the seizure. The two set-aside hooks are named with reasons. The non-collision claim was only half true in the draft. The encounter's verb (defend a debtor by substituting the security) is new to Gold. Its order card was not, and it is fixed above.

**Consider.** Open The Ledger (reveal the hidden charges) sits close to The Mill Lease's *Uncover Hidden Tallies* (reveal the unrecorded grain). Light's job is to reveal, and the target differs (the creditor's padding versus the tenant's concealment), so I kept it. If the batch report wants more distance, re-aim it at the *chapter's* books rather than the lenders'.

## 6. Aftermath Payoff

The aftermath is centred on the actor, with faces. The dean who sent for the master pays, thanks or blames them. The town's lenders hear. The factor's regard is the reaction stake. The brief's band table is met. critical_success: the prize at its best, and the people who sent for the master remember it (thanked "before the whole chapter"). success_at_cost: the master can choose to carry a debt. failure: *name before the purse*, said plainly ("A master is judged by what they save"). critical_failure: the penalty lands hard, and after the fix the town SCAR is chipped here too.

## 6b. Page read

Each band was assembled as the step-1 afterimage, then the overview, then scar · bond · boon · path, then the reactions.

**critical_success (draft).** Afterimage "The factor took the tithes for the whole debt and gave back every piece of plate." → overview "The altar plate is back on the altar, and the chapter will pay the loan from its tithes. {cast:dean} gave {actor} a gift from the cathedral treasury in front of the whole chapter." → BOND "{cast:dean} trusts {actor} now." · BOON "{location} thinks better of {actor}'s word on money." · PRIZE (engine) → *Keep the lenders' goodwill* / *Stand with the chapter*.
- **Repetition (22/35).** The overview's first sentence retells the afterimage: tithes for the debt, plate restored. **[EDITORIAL REWRITE]** overview "{cast:dean} thanked {actor} before the whole chapter, and gave them a gift from the cathedral treasury." The overview now adds the public thanks, the BOND adds the trust, the BOON the town, and the PRIZE the item.
- **Ambiguity (29) in a reaction.** "The dean trusts the mortal more, and the factor less." **[EDITORIAL REWRITE]** "Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor takes against them." The same intent appears on the success band.

**success (draft).** Afterimage "The factor took the tithes in place of the plate, and the plate went back inside." → overview "The plate is back inside the cathedral, and the tithes now stand as the lenders' security. {cast:dean} sent {actor} away with a piece from the cathedral treasury."
- **Repetition (22/35).** The overview's first sentence is the afterimage again, nearly word for word. **[EDITORIAL REWRITE]** "The chapter will pay off its loan from the tithes in the years ahead. {cast:dean} sent {actor} away with a piece from the cathedral treasury." This is new (what the tithes now owe) and sets up the success_at_cost contrast. The chips and reactions are as above and read clean.

**success_at_cost (draft).** Afterimage "The factor took the tithes, but at a harder rate the chapter will pay for a generation." → overview "The plate is back inside, but the chapter will pay the lenders a harder rate for a generation. {cast:dean} paid {actor} from the treasury all the same." → BOND "trusts {actor} now" · BOON · PRIZE → *Stand surety* ("Put the mortal's own name to the chapter's bond. The mortal owes the factor a debt, and the dean will not forget it.") / *Leave the chapter its terms* ("The chapter pays its own harder rate. The mortal walks away owing nothing.").
- **Repetition (22/35).** "a harder rate … for a generation" is told by the afterimage and again by the overview. Fixed by the afterimage rewrite above: the afterimage tells the moment, the overview the term.
- **Conflict (35).** "paid {actor} … all the same" reads as grudging, while the BOND chip directly below says the dean trusts {actor} now (a +0.15 write). **[EDITORIAL REWRITE]** overview "The plate is back inside, but the chapter will pay the lenders that harder rate for a generation. {cast:dean} paid {actor} from the treasury, and called the terms a fair price for the plate."
- **Repetition (35).** "harder rate" appears a third time in the reaction intent, and "bond" in the surety intent collides with the BOND tag beside it. **[EDITORIAL REWRITE]** *Stand surety for the chapter*: "Take part of the chapter's debt in the mortal's own name. The mortal owes the factor, and the dean trusts them more for it." (This also drops "will not forget it", a promise of later behaviour; the `bond_change $cast:dean` write is what the intent now names.) *Leave the chapter its terms*: "The chapter carries its terms alone. The mortal owes the factor no debt." The two stances now read as two distinct positions: carry the cost yourself, or let the debtor carry its own.

**failure (draft).** Afterimage "The factor refused the tithes, and the bailiffs drove the plate away to be melted." → overview "The factor would not take the tithes, and the altar plate went to the lenders to be melted down. A master sent for by name is judged by what they save, and every lender in {location} now knows {actor} saved nothing." → SCAR "{location} thinks less of {actor}'s word on money." · BOND "{cast:dean} trusts {actor} less."
- **Repetition (22/35).** The first sentence retells the afterimage. "every lender in {location} now knows" and the SCAR tell the town's verdict twice. `nothing` (15).
- **[EDITORIAL REWRITE]** overview "A master is judged by what they save. The chapter sent for {actor} by name to save its plate, and the plate is lost." This keeps the brief's *why it costs more* in one plain line. The lenders hearing moves to the SCAR as its one-clause cause, which pays the spine's promise: SCAR `causeClause` "Every lender heard" + detail "{location} thinks less of {actor}'s word on money." (3 + 8 = 11 words). BOND unchanged. Clean.

**critical_failure (draft).** Afterimage "The factor refused, and told the whole chapter that {actor} had offered the lenders nothing they could use." → overview "The plate is gone to the lenders' melting pot. {cast:dean} told the chapter that the master they sent for had made it worse." → BOND "{cast:dean} trusts {actor} less."
- **Seam echo (22).** "told the whole chapter" is followed by "{cast:dean} told the chapter".
- **Unreadable (29).** "had made it worse": worse than what? On the step-1 path nothing was made worse. The plate was lost, as on failure.
- **Missing chip on a write that fires (35, Law 56 parity).** Step 1's `failureMetadata` writes `reputation_with $here −0.10` on this band as on failure. The failure page chips it, and this page, the harder fall, does not. It reads as the lighter ending.
- **[EDITORIAL REWRITE]** afterimage (above) "The factor refused, and called for the bailiffs before {actor} had finished speaking." · overview "The plate is gone to the melting pot. The factor told the whole chapter that {actor}'s offer was worthless to the lenders, and said it in front of {cast:dean}." · add SCAR (id `cathedral.cf.town`, scar · loss, title "The Town's Regard", noun `reputation with {location}` on `$here`, `tooltipId ui.reputation_with`) with detail "{location} thinks less of {actor}'s word on money." The SCAR comes before the existing BOND. The overview is the cause, and the two chips are the two changes. Nothing is told twice.

**Fallback overview** (package only, shown when no band matches): "{actor} left the chapter house with the matter of the plate decided." `the matter` is evasive (15). **[EDITORIAL REWRITE]** "{actor} left the chapter house once the factor had given an answer."

Chip budgets after revision (cause + detail ≤ 15): BOND gain 4 · BOON gain 8 · SCAR failure 11 · SCAR critical_failure 8 · BOND loss 4. No chip shares a four-word run with its overview.

## 7. Dilemma Energy

Real, for a short scene. The god's posture shows in what it is willing to spoil or expose to save the plate. It can bury the bailiffs in their own paperwork. It can tarnish the cathedral's silver (and leave the tarnish). It can frighten the creditor, or drag every figure into the light, including the client's. The reactions put a values choice to the player: the master as a friend of money or of the church, and at a cost whether the master carries the chapter's debt in their own name.

## 8. Experience Differentiator Gate

Answered for the revised packet. Where the draft's answer differs, it is given in brackets.

1. **YES.** P1 arrival · P2 default, writ, weighing (costs paid) · P3 lawful writ, the threat, the ask with the tithes named. 79 words. [Draft: YES, though the ask was abstract.]
2. **YES.** Every sentence is the debt, the seizure, the law, the stake, the ask, or (in step 1) the opposition's want and the test.
3. **YES.** Writ, bailiffs, carts, plate and weighing (step 0). Factor, tithes, silver, the lenders' figures (step 1).
4. **YES.** "The lenders' bailiffs are lawfully taking the cathedral's altar plate, and the master must get the tithes accepted instead, or the plate is melted and the master's name pays."
4b. **YES after fixes.** [Draft: NO. Step-0 success afterimage → spine ("the lenders' factor"), and every step-1 afterimage → overview, worst on success, success_at_cost and failure. On critical_failure, "told the whole chapter" → "told the chapter".]
5. **YES.** Slow, Dull, Plant and Open are in `IMPERATIVE_VERB_LEXICON`. No effect line repeats a word of its name. No flavor quote. Each special names its target directly, as a special may (spec § 3b).
6. **YES after relabel.** Every effect line says what the card does to the step, and every card is essence-priced (2/1/2/1). [Draft: NO. Four type labels named mechanisms these cards do not have: Favor, Cache, Compulsion, and a Whisper on the last step.]
7. **YES.** Every special has a failure fragment. Max Δ 0.12, so no big-delta double is owed.
8. **YES after fix.** Writ, bailiffs, carts, plate, factor and lenders' accounts are all on stage before a card touches them. [Draft: partial. The tithes, the offer itself, were first named in a result line.]
9. **YES after re-skin.** Time, value, the creditor's doubt, the true figures. [Draft: YES within the hand. The order card was the gold experts' card again.]
9b. **YES.** Each step has 2 specials + `deal` 4 = composed 6. Tags `social`/`peril` and `social`/`presence`. No step asks the player to pick a branch or an ending.
10. **YES.** Every band overview lands the meaning: thanks, the years of payments, the generation of terms, the master's name, the public scorn.
11. **YES.** `reputation with {target}` on `$cast:dean` and `reputation with {location}` on `$here` are sheet words. The brief's THR-1685 caution is superseded: the renderer fix (2026-09-30, `buildAftermathConsequences.ts` `anchorNameFor`) makes `{target}` in a noun read its own person anchor, and the systemic wiring guide now teaches exactly this shape. PRIZE is engine-rendered.
11b. **YES after fixes.** [Draft: NO. See § 6b: repetition on every band, conflict on success_at_cost, and an unchipped write and an unreadable line on critical_failure.]
12. **YES.** Short scale owes none. Success-side bands offer two each anyway.
13. **YES.** Friend of money or friend of the church. Carry the debtor's cost yourself, or let it carry its own.
14. **YES.** The emotions come first (lawful loss, a debt's weight on a holy place, a bargain still being weighed). The image is residue: an empty altar cloth with the outlines of what stood on it, the bailiff's scale, one tarnished paten. No people and no action.

## 9. Verdict

**PASS WITH REVISIONS.** All edits are applied in `cathedral-loan-revised.md`.

## 10. Revision Summary

**Must fix (applied).**
- Trigger 15: `nothing` ×2 and `the matter` ×1 removed from outcome-class lines.
- Trigger 22: five seam echoes (step-0 success afterimage → spine; each step-1 afterimage → its overview).
- Trigger 26 / gate 8: the tithes and the writ are now established in the opening.
- Trigger 29: step-0 success_at_cost afterimage, the "and the factor less" reaction, and the old near_miss "stopped … went on loading".
- Trigger 35: step-0 critical_failure afterimage contradicted the spine. failure overview repeated its SCAR. success_at_cost overview pulled against its BOND. critical_failure missed the town SCAR its own write fires.
- Brief non-collision: Hold To Procedure → **Slow The Loading** (new face, new fragments; same sphere, cost, delta and opposition).

**Should fix (applied).**
- Gate 6 type labels: Signature (order) · Stumble (matter) · Signature (mind) · Signature (light).
- Dull The Silver success / success_at_cost and Plant The Fear failure fragments: encoded gesture and logic slip.
- Carryover critical_success "their offer".

**Consider (not applied — for the systems pass or the orchestrator).**
- The package's `cathedral.hold_to_procedure` id and `generic.oath` imageTag can stay or move to `cathedral.slow_the_loading`. The face is what changed.
- Dull The Silver as a Stumble could carry `opposes: "bailiffs"` like the other step-0 special.
- Step 1 `successMetadata` fires on `near_miss` (spec § 6, `isStepSuccess`): the dean +0.15, the town +0.08 and the treasury prize. Confirm which `byOutcome` band a step-1 near_miss renders. If it is `failure`, the page shows two losses over two gain writes (Law 56).
- Carryover polarity: success_at_cost is −0.02 *against* and near_miss is +0.02 *for*, so a success band carries a worse line into step 1 than a failure band does. Each line reads true on its own. Check that the inversion is intended.
- There is no critical_failure carryover line on step 1. After the step-0 rewrite the plate is fully loaded on that path, so a line like "Every piece of plate is already on the carts." (against) would read true.
- Open The Ledger sits close to The Mill Lease's *Uncover Hidden Tallies* (see § 5).

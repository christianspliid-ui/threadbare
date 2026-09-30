# Encounter Pipeline: The Widow's Pawned Box
> Scale: short | Slug: pawnbrokers-strongroom | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0
> Template: `encounter.town.pawnbrokers_strongroom` · Batch: expert-everyday-2, slot 4 (THR-1679) · Revised title: **The Cooper's Pawned Box**

The draft holds to the binding slot-4 row: shadow 0.60 → shadow 0.66, `continue_weakened` → `fail_action`, `rural` + `urban`, `story_seed` + `drive`, and a tag-filtered query prize. The mechanical design is sound. A thief's job with a moral hinge, a starved dog whose healing backfires, a race in a cellar and a hatch held shut is a good expert shadow scene.

Five problems still had to be fixed. The premise nearly repeats a shipped encounter in the same family. One card in step 0 acts on a stair the scene has not yet shown. Two bands contradict themselves. The spine's blame sentence asserts a standing nobody wrote. Step 1's base prose breaks when the Heavy Hand is in play. All five are fixed inline in the revised file. **No REVISE trigger remains in the revised file.**

---

## 1. Prose Quality

**Opening (P1).** The narrator mode is correct. The problem is the echo (§ 5): *"{actor} is in {location} for the fair when a widow comes to them"* is `cunning-fair`'s shipped urban opening, *"{actor} is in {location} on fair day when a widow asks for a dream reader"*, with three words changed.

**Spine (step 0).** The spine is plain and briefing-shaped, and each fact takes one sentence. It has three defects.

- *"Any theft here gets blamed on {actor}, the best lock-hand for miles."* This makes two claims. "The best lock-hand for miles" is a comparative standing. The forecast window backs the *capability*: the mortal is expert shadow, or they would not be drawn. It does not back a *reputation* across the district. "Any theft here gets blamed on {actor}" goes further. It says the town already knows this mortal as a thief. In the rural opening the mortal has only just *come into* {location}, so that is invented standing (prose rule 7, **trigger 31**).
  **[EDITORIAL REWRITE]** *"The pawnbroker saw them talking, so any theft will be blamed on {actor}."* This keeps the rolled `suspect_or_cause` role and makes it true *inside the scene*. The blame now comes from what the pawnbroker saw tonight, not from history the graph never wrote. The skill claim is dropped entirely. Being asked is enough, and the draw window guarantees the skill.
- *"A starved, lame dog guards the strongroom door."* Step 0 deals **Quiet The Cellar Stair**, but the stair is never in step 0's scene prose. The draft's own self-audit says the stair "arrive[s] in step 0's afterimages", and afterimages render *after* the hand is played. This fails gate Q8.
  **[EDITORIAL REWRITE]** *"A starved, lame dog guards the stair down to the strongroom."* The stair and the descent are now on the page before the card that acts on them. This also brings the taken hook (`descent_into_darkness`) into the opening instead of leaving it to the afterimages.
- *"She asks {actor} to get there first."* This sentence is good. It is kept, with the client changed.

**Step 1 spine.** It has three defects.

- *"The strongroom is under the house, and the candle will not last long."* The first clause repeats what step 0's afterimages just said (they went down the stair and opened the strongroom), so it is a seam echo (**trigger 22**). "The candle" also arrives with a definite article nobody introduced.
  **[EDITORIAL REWRITE]** *"Their candle will not last long."*
- *"{cast:rival} has come in by the coal hatch at the far end of the cellar."* The Heavy Hand's whole premise is keeping the hatch **shut** against the rival (its critical-success fragment has them putting a shoulder to it twice). A rival who *has already come in* by the hatch makes the card nonsense.
  **[EDITORIAL REWRITE]** *"{cast:rival} is forcing the coal hatch at the far end of the cellar."*
- *"The pawnbroker says the widow's missed interest frees him from his word."* This sentence is kept. It is the anti-binary, and it carries its weight. It is reworded to plain grammar for the new client: *"The pawnbroker says the cooper missed a payment, which frees him from his word."*

**Afterimages and fragments.** They are mostly tight and in narrator register. The defects:

- Step 0 critical success: *"They fed the dog their supper…"*. The base band has the mortal feed the dog, and **Tame The Guard Dog**'s critical-success fragment has the dog eat from their hand. With the card active, the dog is fed twice. This is a nudge payoff written into base text (**trigger 13**).
  **[EDITORIAL REWRITE]** *"They slipped past the dog and down the stair, and opened the strongroom without a sound."* The outcome ladder's "the dog fed" goes too.
- Step 0 critical failure: *"…{cast:rival} heard exactly where they were."* "Exactly" carries nothing and reads as emphasis. It is cut.
- Step 1 failure: *"{cast:rival} reached the shelf first and was gone up the coal hatch with the box."* With **Hold The Coal Hatch** active on the failure band, its fragment says *"The hatch held, so {cast:rival} came in by the back door"*. The base then has the rival leave by the hatch that held. The base text does not read correctly with every subset of the hand (**trigger 13**).
  **[EDITORIAL REWRITE]** *"{cast:rival} reached the shelf first and was gone with the box."*
- Step 1 success at cost: *"…{cast:rival} saw their face in the yard."* The band overview repeats it (*"knows whose face was in the yard"*), sharing the four-word run "face … in the yard". That is a seam echo. The afterimage now carries the event (*"{cast:rival} was in the yard when they came up"*) and the overview carries the consequence (*"{cast:rival} knows their face now"*).
- Tame The Guard Dog, failure and critical failure: *"…the dog barked at them…"* / *"…barked loud enough to wake every room above."* Both repeat the verb and the event of the base failure afterimages (*"The dog barked twice…"*, *"The dog barked until the house woke…"*), so the page says "barked" twice. The fragments should give the *reason*, and the base already gives the *event*.
  **[EDITORIAL REWRITE]** failure *"Fed and whole again, the dog stood up and guarded its door."* · critical failure *"Fed and whole again, the dog was strong enough to bark all night."* · near miss *"The dog lay quiet, then whined for more food as they reached the door."* The near miss drops "just as the lock gave", which the base failure also says.
- Failure overview: *"{cast:rival} sold the widow's box to the buyer at the fair gate."* This contradicts the spine. {cast:rival} is *hired by* the buyer, so they deliver the box and do not sell it. It is the same fault in the outcome ladder.
  **[EDITORIAL REWRITE]** *"{cast:rival} took the cooper's box to the buyer at the fair gate."*

**Card faces.** They are spell-style, the names are verb + noun from the lexicon, and no effect line repeats a word from its name. `Hold The Coal Hatch` names its price on the face in the house form ("Rival gods will see…", as in `the-broken-seal` and `border-levy`). I considered "Other gods", because "rival" also names `{cast:rival}`. I kept "Rival gods" because the price line should read the same on every Heavy Hand in the game, and "an opponent" in the first sentence already separates the two.

## 2. Branch Seduction Audit

N/A. The encounter is linear with no fork. The seduction lives in the hand, and the hand is good.

- **Tame The Guard Dog** (life, Balm). The fantasy is mercy as a tool. A god picks it to be kind and to be quiet at once. Its failure fragments are the best idea in the draft: the healing works, and a healthy dog does its job. The value it protects is compassion, at the cost of noise.
- **Quiet The Cellar Stair** (matter, Boost). This is the craftsman's lean. A god picks it because it touches nothing alive. It answers a different question from Tame: what the house hears, against what the dog does.
- **Hold The Coal Hatch** (force, Heavy Hand, detection only). This is the brute answer to the contest. It is the only card that works directly *on the rival*, and it costs visibility to other gods. It is the right home for the batch's single Heavy Hand.

No card buys the same certainty as another.

## 3. Branch Count Assessment

**KEEP 0.** Test & Consequence at short scale. The two steps are earned: one gets in unheard, the other wins the race out.

## 4. Scale Discipline Check

Short: two beats in one night, no reactions, and five overviews at or under 30 words. The spine is at the 80-word ceiling after revision (79 urban / 80 rural). This matches the declared scale.

## 5. Inspiration Anchor Honesty

Impossible Heist and Descent Into Darkness both did real work. Heist gave the security layers and the "owner hunts you" consequence that became the seed. Descent gave the stair and the candle, which are what make step 1 a race. The revision strengthens Descent by moving the stair into the opening.

**The echo check (drafter's flag 5) fails, and the draft names the echo without fixing it.** `cunning-fair` (`encounter.town.cunning_fair`, "The Widow's Dream", shipped in batch 1 of this same family) is:

- a **widow** whose **husband was recently buried**,
- at a **town fair**,
- who **pays with one of his belongings** (a keepsake) as the tag-drawn prize,
- against a **`{cast:rival}`** competing for the same job,
- with **reputation with {location}** at stake,
- under a title shaped **"The Widow's X"**,
- with an opening sentence of the same shape (*"{actor} is in {location} on fair day when a widow…"*).

The draft differs in reach and in what is tested, but a player who meets both reads the same premise twice. That is exactly the failure the echo check exists to stop. The drafter's defence is that there the prize is a keepsake and the test is a reading, while here the box is the object in dispute. That is a real difference in mechanics and not in anything the player sees.

**Ruling.** Replace the client, the grief and the title shape. The slot-4 *binding* row (reach, steps, shape, settings, consequence hand) does not name a widow. "A widow asks the expert thief" is the lane-authored premise sketch, so replacing her is inside the editorial lane. The client becomes **a cooper who pawned his father's iron box for winter grain**. The `hook.grief_absorption` blend goes with the widow. `plotHookTaken` stays `hook.descent_into_darkness`, and grief was only ever blended in. The fair stays, because it carries load (the sale is tomorrow, and the buyer is at the fair). The openings are re-shaped so the cooper *finds* the mortal "the night before the fair" rather than the cunning-fair form. The title becomes **The Cooper's Pawned Box**. `smugglers-ford` is correctly cleared.

## 6. Aftermath Payoff

The aftermath is actor-centred and cool as a failure. Nobody is jailed or killed, the dog lives, and the cost is standing, which is expert-correct. The PATH seed on the success half and the SCAR compulsion plus BOND reputation on the failure half are each backed by a write on their band (Law 56).

A new, better logic now carries the success bands. The pawnbroker was selling a pledge he had sworn to hold. On success the cooper has his own box back, so the pawnbroker **cannot cry theft without admitting he broke his word**. That is why success leaves no reputation mark while the pawnbroker saw them talking. It also closes a hole the draft left open: why a suspect who succeeds is not accused.

**For Pass 3 (Should fix, systems lane, not applied here):** `success_at_cost` writes exactly what `success` writes. Its cost lives only in the overview ({cast:rival} knows their face). The brief's band table asks that `success_at_cost` carry "a condition, a lean, a debt". Because all writes sit on step 1's `successMetadata`, the band cannot differ mechanically without an aftermath-level write. Pass 3 should decide whether to add one band-keyed write (for example a `favor_creation` or a hidden mark on the rival's side). Otherwise it should record that the band's cost is narrative only. I did not add a support object (outside my lane).

## 6b. Page read (THR-1474)

I assembled every band (overview → scar · bond · boon · path) and read each once as one text. Draft findings:

- **critical_success — CONFLICT (trigger 35).** Overview: *"…The pawnbroker told the fair he had been robbed, and nobody could say by whom."* PATH · SEED: *"The buyer who lost the box will send for {actor}."* The page says nobody knows who did it, then that the buyer knows exactly who to send for. **Fixed.** The overview now says the pawnbroker *cannot cry theft without admitting he broke his word*. That leaves the buyer, whose hired thief was in the same cellar, free to know.
- **success.** Clean in the draft (*"no thief to name"* against the seed). It is rewritten to the same pawnbroker logic so crit and success agree about why nobody is accused.
- **success_at_cost — REPETITION across the afterimage seam** (see § 1). **Fixed.** The afterimage carries the yard and the overview carries "knows their face now".
- **failure — CONFLICT with the spine.** "sold … to the buyer" contradicts "the buyer has hired {cast:rival}". **Fixed** to "took … to the buyer". The chip cause *"Beaten by a hired thief"* sat under the title *"Beaten to the Box"*, so "beaten" appeared twice in one chip. It is now *"Outrun by a hired thief"*. The BOND caption *"{location} thinks less of {actor}"* states the standing change, and the overview states the accusation, so they are different facts and there is no repetition.
- **critical_failure.** Clean. The overview (found at the open strongroom, the fair heard his story), the compulsion (left in the dark) and the bond (the town thinks less) each carry one fact.

No verbosity findings. After the fixes every band reads clean.

## 7. Dilemma Energy

The god's posture shows in the hand, not in a fork. Mercy that makes noise, craft that touches nothing alive, and force that other gods can see are three different gods. The pawnbroker's arguable case (a missed payment frees him) keeps the theft from being a clean good. The tension is genuine for a short scene.

## 8. Experience Differentiator Gate

Judged on the **revised** file. In the draft Q8 and Q11b were NO, and both are fixed.

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton, ≤80 words, real names, plain facts | YES | 79 / 80; `{actor}`, `{location}`, `{cast:rival}`; arrival · situation · contest + suspect stake |
| 2 | Every sentence does challenge/test/outcome work | YES | "The strongroom is under the house" (redundant) cut; each spine sentence is box, clock, rival, ask, dog, blame, or race |
| 3 | Scene prose names what the hand acts on | YES | dog + stair in step 0 spine (was NO for the stair in the draft); hatch in step 1 spine |
| 4 | Retellable after one read | YES | "Get the cooper's box out before the buyer's thief does, without being named for it" |
| 4b | No seam echoes | YES | opening→spine clean; step-0 afterimage → step-1 spine ("under the house") fixed; step-1 s_a_c afterimage → overview fixed; base afterimage ↔ Tame fragments ("barked") fixed |
| 5 | Spell-style card faces, no bespoke flavor | YES | Tame / Quiet / Hold; direct effect lines; no flavor quotes |
| 6 | Mechanism + real price | YES | essence 2 / 2; Hold is detection-only, named on the face |
| 7 | Every card pays off in failure | YES | Tame f + cf, Quiet f, Hold f + cf |
| 8 | Every card grounded in scene before the hand | YES | Quiet's stair now in step 0 spine (NO in draft); Hold's hatch in step 1 spine |
| 9 | Cards answer different questions | YES | dog vs house's ears vs rival's route |
| 9b | Full hand per nudge-bearing step; no step picks a branch | YES | 2 specials + deal 4 / 1 special + deal 4 |
| 10 | Reflective aftermath landing | YES | the pawnbroker's broken word is the success bands' landing |
| 11 | Actor-centred, sheet-word chip nouns | YES | `seed`, `compulsion`, `reputation with {target}` (on `$here`) pass cover-the-title |
| 11b | Every band's page reads clean | YES | § 6b (NO in draft: crit_success conflict) |
| 12 | Medium+ reactions | N/A | short scale |
| 13 | Reactions are stances | N/A | none |
| 14 | Evocative art direction | YES | residue only: empty hook, snapped chain, candle stub; no dog or people on screen |

## Rulings on the drafter's flags

1. **The query prize is a recipe (tag-filtered `rewardPool`), not a seed query.** **Accepted.** The brief says so outright (*"a step `rewardPool` whose entry is tag-filtered (`reward_draw` has no `query` field)"*), and `cunning-fair` shipped the same shape. `#stealth` is seated and worn by 6 items per the tag catalog. The census caveat is Pass 3's to carry, not a prose defect.
2. **The rival reuses `lookout` / `wanderer`, not checked on farmland/mining.** **Accepted for editorial.** Both roles exist (`default-support-bundles.ts`, `civic-guard-encounter-content.ts`). The `spawnNpcRole: 'lookout'` fallback means the rival always materializes, and a stranger in town for the fair reads true at any class. Pass 3 verifies the roster.
3. **"The best lock-hand for miles" as a soft rule-7 claim.** **Ruled a defect and removed.** The drowned-mans precedent covers a *skill* claim. This sentence also asserted that the town *blames the mortal for thefts*, which is a standing the graph never wrote, and false for a mortal who has just arrived. Both are replaced by blame that the scene itself produces: the pawnbroker saw them talking.
4. **Detectors not run.** I read the revised prose by hand against the scoped lexicon. It has no evasive terms. Outcome fields carry no natural indefinites ("nothing", "someone", "thing", "way", "anything"). "Exactly" is cut. No second person, no numerals, no `%`. The god never authors a result. The detector run remains a Pass 3 / machine-gate duty (`compile:encounter --dry-run` + `check:encounter`).
5. **Echo risk with `cunning-fair`.** **Confirmed as a real echo and fixed** (§ 5): the client is now a cooper, the grief blend is dropped, the openings are re-shaped, and the title is renamed.

Also verified: `encounter.black_market_deal` exists (`src/data/encounter-content.ts`). Its `locationTypes` are hamlet/town/city/capital, and its `sublocationTypes` are smugglers-den, which a literal seed skips. It has **no guild or faction gate**. Its opening (*"follows directions given twice and written down nowhere, to a back room"*) is what the seed label promises, so the label's "directions to a back room" is enacted by the sequel itself, and rule 7b is honest. It assumes no membership. Note for Pass 3: the template sits in `retrofitPending.ts` (not yet nudge-retrofitted). That does not block a literal seed.

## 9. Verdict

**PASS WITH REVISIONS.**

The draft tripped triggers 13 (base text broken by an active card, twice), 22 (seam echoes), 31 (invented standing) and 35 (crit_success page conflict), plus gate Q8. Every one is fixed inline in the revised file, and **no REVISE trigger remains**. The mechanical design, the hand and the consequence wiring are unchanged.

## 10. Revision Summary

**Must fix (applied)**
- Replaced the widow client with a cooper, dropped the grief blend, and re-shaped both openings. Title is now **The Cooper's Pawned Box** (echo of `cunning-fair`).
- Put the stair in the step 0 spine so Quiet The Cellar Stair is grounded (Q8).
- Replaced "any theft here gets blamed on {actor}, the best lock-hand for miles" with blame produced in-scene (trigger 31).
- Changed "has come in by the coal hatch" to "is forcing the coal hatch" (Hold's premise).
- Step 1 failure base afterimage no longer uses the hatch (trigger 13 with Hold active).
- Step 0 critical-success base afterimage no longer feeds the dog (trigger 13 with Tame active).
- crit_success overview no longer contradicts the seed chip (trigger 35). All success bands now rest on "the pawnbroker cannot cry theft without admitting he broke his word".
- Changed "sold … to the buyer" to "took … to the buyer" (failure overview + ladder).

**Should fix (applied)**
- Seam echoes: "The strongroom is under the house", the s_a_c yard/face repetition, and the Tame fragments re-stating "barked".
- Chip cause "Beaten by a hired thief" is now "Outrun by a hired thief".
- Cut "exactly".

**Should fix (for Pass 3, not applied)**
- `success_at_cost` has no write that differs from `success`. Add one band-keyed write or record the band's cost as narrative-only against the brief's band table.
- Confirm `lookout` / `wanderer` roster coverage on farmland/mining. Run the detectors and `check:encounter`, and confirm the family type-composition check (trigger 21) against `encounter.town.*`.

**Consider**
- Tame The Guard Dog is typed *Balm* ("removes one condition") but acts as a Δ-only card on a scene-local animal. That is legal, but Pass 3 may prefer the library type that best fits the coverage matrix.

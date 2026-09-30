# Encounter Pipeline: The Drowned Man's Will
> Scale: local (short) | Slug: drowned-mans-testimony | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0
> Judged against: the package strings (`drowned-mans-testimony.package.json`), which are the real text. Precedent: `cunning-fair.package.json` (same family, reach and shape).

## 1. Prose Quality

The opening is in narrator mode and clean. P1 is an arrival. P2 states events as facts: a drowning, a missing will, a hostile claimant. P3 states the stake plainly. Urban is 11 + 66 = 77 words and rural is 12 + 66 = 78, both inside 80. There is no interior sensation and no camera work.

Weak spots, quoted:

- **Stake the player cannot see.** The almshouse first appears in the success overviews, and the failure overview says *"The almshouse gets nothing"*. On one read the player never learns that anyone but the nephew had a claim. That breaks Q4 (retell the stakes).
  `[EDITORIAL REWRITE]` P2 sentence 2 becomes *"He told the almshouse he had made a will, but none has been found."* It costs +2 words. To keep the count flat, `open court` becomes `court` (−1) and `a fairground trick` becomes `a trick` (−1). The second cut also drops an image shared with the Cunning Fair.
- **Detector hits (outcome class).**
  - *"The almshouse gets nothing"* (failure overview): `nothing` is a natural indefinite, and those are enforced at zero in outcome fields.
  - *"closed the matter"* (critical_failure overview): `the matter` is an evasive nominalisation, banned in every field class.
  - *"before anything else"* (both compulsion chips): the compulsion chips add `anything`, and the failure chip's *"looking for it"* has no referent in the chip.
- **Withholding overview.** The critical-failure overview ends *"had heard what the dream reader told the court"*. After the roll that withholds what the player has no other source for.
  `[EDITORIAL REWRITE]` *"By evening all of {location} had heard the reading, and the almshouse was calling it a lie."* It names who objects and why the town's trust drops.
- **Jobless texture.** In the success overview, *"wrapped in oilcloth"* does no challenge, test or outcome work. Cut.
- **Ambiguous pronoun.** The critical-success overview reads *"It leaves the house to {cast:heir} and his savings to the almshouse"*. `his` can read as the nephew's savings.
  `[EDITORIAL REWRITE]` *"It leaves {cast:heir} the house and the almshouse the savings."*

## 2. Branch Seduction Audit

This encounter has no branches; it is a single test. What seduces here is the hand:

- **Loosen The Rival's Tongue** (Stumble, chaos, 2 essence). The fantasy is turning a greedy man's own words against him in open court. The god would choose it to protect a truthful hearing.
- **Call Up The Dead** (Bargain, entropy, 0 essence plus one doom). The fantasy is pulling the dead back to speak. The god would choose it when essence is short, paying in the world's end instead. The god would refuse it to protect the doom clock. This is the batch's one Bargain, and its price is real.

The two cards answer different questions: the source (the dead) and the opposition (the living claimant).

## 3. Branch Count Assessment

`KEEP 1`. The brief requires the batch's single 1-step encounter, with the query-prize face.

## 4. Scale Discipline Check

Local scale: one estate, one heir, one hearing and one beat. The expert weight is the audience (a magistrate, a reading on the record), and it does not come from adding scope. PASS.

## 5. Inspiration Anchor Honesty

The anchors are honest. `hook.endless_pursuit` really drives the failure half: the compulsion keeps the reader searching after the court stops. `hook.relic_awakening` really drives the prize: the `#relic` fee paid from the river finds, and the ambition to uncover what old finds hold. The difference from the Cunning Fair is real. This version has an expert before a magistrate instead of a journeyman at a fair, a hostile named claimant instead of indifferent terrain, specials of Stumble + Bargain instead of Whisper + Omen, and a drive family instead of a secret.

## 6. Aftermath Payoff

The aftermath is actor-centred. The success side gives the town's regard, a stronger thread, an ambition and a drawn relic. The failure side gives a thinner thread, a compulsion and lost regard. Failure costs standing before money and harms no one, which follows the brief. The critical-success overview is almost the same as the success overview. `[EDITORIAL REWRITE]` It now adds *"The magistrate thanked {actor} before the whole court"*, which delivers the brief's crit row (*people who matter remember who did it*). It is a past event, so it makes no promise about later behaviour (7b).

## 6b. Page read (THR-1474)

Each band below is assembled as overview, then chips in scar · bond · boon · path order. The engine PRIZE chip is noted but not authored. There are no reactions.

**critical_success (draft)**
> The will was read in court before noon. It leaves the house to {cast:heir} and his savings to the almshouse. The magistrate paid the reader's fee from the dead man's river finds.
> - BOND · reputation with {location}: {location} holds their readings in higher regard.
> - BOND · thread: Read the will with the god close — The thread to {actor} runs stronger.
> - PATH · ambition: Paid in a river find — {actor} is pursuing Uncover Ancient Secrets now.

- **Repetition (FAIL).** The overview's *"paid the reader's fee from the dead man's river finds"* and the ambition chip's *"Paid in a river find"* tell one fact twice. This is a paraphrase, so the four-word machine check misses it.
- **Minor confusion.** *"Read the will"*: the reader read the dream, and the magistrate read the will. The thread cause becomes *"Read the dream with the god close"*.

**success (draft)**
> The will was in the boat, wrapped in oilcloth. It splits the estate between {cast:heir} and the almshouse. The court paid the reader's fee from the dead man's river finds.
> (same three chips)

- **Repetition (FAIL).** The fee fact appears twice, as above.
- **Repetition across the band seam.** The success afterimage (*"...lifting a board in his boat, and the will was under it"*) is followed at once by *"The will was in the boat"*. The overview now opens *"The magistrate read the will aloud."*

**success_at_cost (draft)**
> The court heard one wrong answer before the right one, and {cast:heir} calls the second one luck. The will says what the dream said, and the almshouse gets its share.

- **Repetition (FAIL).** The wrong-then-right fact is told three times in a row:
  - the afterimage: *"They named a room in his house first, then his boat, and the second answer was the right one."*
  - the Call Up fragment: *"showed his house before his boat"*
  - the overview's opening clause
- **Conflict risk.** A rewrite that says the court half-believed the luck claim would contradict the BOND · reputation gain chip. The revision keeps the jeer with the hostile nephew only: *"{cast:heir} called the second answer luck in front of the whole court."*
- **Consistency.** The fee sentence is added so that the prize and ambition read the same way as in the other success bands.

**failure (draft)**
> The magistrate ruled for {cast:heir}, who takes the whole estate. The almshouse gets nothing, and the will is still missing.
> - SCAR · thread: Misread the dream with the god watching — The thread to {actor} runs thinner.
> - SCAR · compulsion: For a while they will go looking for it before anything else.
> - BOND · reputation with {location}: {location} doubts their readings now.

- **No repetition.** The chips add to the overview: "still missing" becomes "searching".
- **Detector hits.** `nothing` and `anything` fire.
- **Unclear pronoun.** In the chip, `it` has no referent.
- **Awkward wording.** A naive fix, *"they will look for the will"*, reads badly because of the doubled "will". The chip becomes *"For a while they put the search for the will before other work."*

**critical_failure (draft)**
> The magistrate ruled for {cast:heir} and closed the matter. By evening the whole of {location} had heard what the dream reader told the court.
> - SCAR · thread: Denied the will with the god watching — ...
> - SCAR · compulsion: ...before anything else.
> - BOND · reputation with {location}: {location} doubts their readings now.

- **Detector hit.** `the matter` fires.
- **Withholding overview.** Covered in § 1.
- **Retelling (borderline).** *"Denied the will"* retells the critical-failure afterimage (*"told the court the dead man had never made a will at all"*). The cause becomes *"Misled the court with the god watching"*.

**Revised pages.** All five pages now read clean. No fact is told twice, and no block contradicts another. Every chip sentence is 15 words or fewer. No chip shares a four-word run with its overview.

## 7. Dilemma Energy

The dilemma is real at the card level. The god decides whether to spend on the dead or on the living, and whether to pay essence or doom. Call Up is the batch's only doom-priced card, so choosing it is a real posture choice.

## 8. Experience Differentiator Gate

| # | Question | Draft | Revised | Evidence |
|---|---|---|---|---|
| 1 | Narrator-mode skeleton, ≤80, real names, facts plain | YES | YES | 77 / 78 words; `{actor}`, `{location}`, `{cast:heir}` |
| 2 | Every sentence does challenge/test/outcome work | NO | YES | "wrapped in oilcloth" cut |
| 3 | Scene prose names what the hand acts on | YES | YES | the dead man (Call Up), the nephew (Loosen) |
| 4 | Stakes retellable after one read | NO | YES | the almshouse now introduced in P2 |
| 4b | No seam echoes | NO | YES | "in open court" (spine P3 → Loosen crit fragment); house/boat (afterimage ↔ Call Up SAC fragment); boat (success afterimage → overview) all rewritten |
| 5 | Card faces spell-style, no scene-bespoke prose | YES | YES | both effect lines read in a trial, a haggle and a haunting |
| 6 | Effect line = mechanism; price real | YES | YES | 2 essence; 0 essence + doom |
| 7 | Every card pays off in failure | YES | YES | Loosen: failure; Call Up: failure + critical_failure |
| 8 | Every card grounded before the deal | YES | YES | both targets named in the spine |
| 9 | Cards answer different questions | YES | YES | source vs opposition |
| 9b | Full hand, no branch/ending pick | YES | YES | 2 specials + deal 4 = 6 |
| 10 | Reflective prose landing | YES | YES | five banded overviews |
| 11 | Actor-centred; chip nouns are sheet words | YES | YES | `reputation with {location}` ($here), `thread`, `ambition`, `compulsion` |
| 11b | Every page reads clean as one text | NO | YES | § 6b |
| 12 | Medium+ reactions | N/A | N/A | local |
| 13 | Reactions as stances | N/A | N/A | local |
| 14 | Concept art is evocative, not illustrative | NO | YES | The draft image (the stern-seat board lifted over the oilcloth packet) paints the answer to the mystery on art the player sees before the roll. Revised: an empty witness bench, river water pooled beneath, a wet coil of mooring rope, an open court ledger with a blank page. |

After revision, every answer is YES or N/A.

## 9. REVISE triggers (SKILL.md § Pass 2, 1–35)

| # | Trigger | Draft | Revised | Note |
|---|---|---|---|---|
| 1 | No approach prose | PASS | PASS | three-paragraph opening |
| 2 | Generic god-verbs | PASS | PASS | Loosen / Call Up are specific |
| 3 | No thread integration | PASS | PASS | thread is the drawn consequence family, strengthened/weakened on the two halves; cards are the god's thread in play (same footing as the Cunning Fair) |
| 4 | Missing reactions at medium+ | PASS | PASS | local — N/A |
| 5 | Reporter prose | PASS | PASS | each band states what changed and what it cost |
| 6 | No concept art | PASS | PASS | present. The illustrative defect is fixed under Q14. |
| 7 | Hand outside 4–8 / >2 specials | PASS | PASS | 2 + 4 = 6 |
| 8 | <4 spheres / no common | PASS | PASS | the dealer guarantees this on a `deal` step |
| 9 | Nudge with no failure fragment / big-delta missing a band | PASS | PASS | both < 0.15, both carry failure |
| 10 | Uncovered StepOutcome | PASS | PASS | Loosen cs·s·f + Call Up sac·nm·f·cf = all six |
| 11 | Digit or % in effectLine | PASS | PASS | |
| 12 | Trait-hook step skipped | PASS | PASS | four questions answered "none" with reason |
| 13 | Nudge payoff in base text | PASS | PASS | base afterimages read with no card |
| 14 | Option instructs the mortal | PASS | PASS | |
| 15 | Detector hit | **FAIL** | PASS | `nothing` (failure overview) and `the matter` (critfail overview) removed; `anything` (compulsion chips) removed; annotation count 0 |
| 16 | Scene-bespoke card face / flavor quote | PASS | PASS | Name/effect word sharing: the draft shared `the` in both cards (`Loosen The…`/`Make the opponent…`; `Call Up The Dead`/`…The end of the world…`). The precedent tolerates function words, but both lines were rewritten so that no word is shared. |
| 17 | Effect line states mood | PASS | PASS | |
| 18 | Setting envelope / class scenery in spine | PASS | PASS | `urban`, `rural`; "court", "district" read in both |
| 19 | Two riders | PASS | PASS | none |
| 20 | Unpriced zero-essence card | PASS | PASS | Call Up carries `costs.doomDelta: 1` |
| 21 | Identical card-type composition in family | PASS | PASS | Stumble + Bargain; the Cunning Fair is Whisper + Omen; no other `encounter.town.*` template carries a Bargain (grep `doomDelta`) |
| 22 | Seam echo | **FAIL** | PASS | "in open court" spine → Loosen crit; house-before-boat afterimage ↔ Call Up SAC; boat success afterimage → overview |
| 23 | Static factor line | PASS | PASS | none authored |
| 24 | Agent as bystander | PASS | PASS | rolled role "bystander pulled in", but the test lands on the agent; justified in the design block |
| 25 | Announced outcome mechanics | PASS | PASS | P3 states the stake as a fact and a cost, which is lawful |
| 26 | Design-block breach | PASS | PASS | Every declared object is used. The almshouse is now also set up in the scene. |
| 27 | Title glance test | PASS | PASS | "The Drowned Man's Will": the objective is the will |
| 28 | Crux | PASS | PASS | one sentence |
| 29 | Unreadable compression | PASS | PASS | the `his savings` ambiguity is fixed |
| 30 | Shape invented | PASS | PASS | query prize, single test |
| 31 | Invented game state | PASS | PASS | "the best dream reader in the district" is the brief's sanctioned expert framing (*"The mortal is sent for because they are good"*). The forecast window (THR-1575) selects mortals near 0.75 veil. It is scene-local, and no relationship or debt is asserted. |
| 32 | Chip noun not a sheet word | PASS | PASS | Systems pass to confirm that `reputation with {location}` in `stateNoun` renders enriched. The spec says `stateNoun` is not enriched, but the shipped Cunning Fair uses the same form. |
| 33 | Chip sentence >15 / 4-word run with overview | PASS | PASS | longest revised chip is 13 words |
| 34 | Unenacted later-behaviour promise | PASS | PASS | compulsion chip is backed by `plant_compulsion` (explore bias, 72 ticks); critical success adds only a past event |
| 35 | Page tells a fact twice / conflicts | **FAIL** | PASS | fee ↔ ambition cause (cs, s); wrong-then-right ×3 (sac) |

The draft trips triggers 15, 22 and 35. All three are word-level defects inside fields that already exist. They are fixed inline below, with no change to structure, mechanics or ids. That is the pipeline's precedent for this class (the Cunning Fair's critic rewrote its seam echoes and page repetitions under PASS WITH REVISIONS). If the orchestrator reads the triggers strictly against the unrevised draft, treat the verdict as REVISE and use the revised file as the retry.

## 10. Verdict

**PASS WITH REVISIONS**

## 11. Revision Summary

**Must fix (applied):**
- Detector hits: `nothing`, `the matter`, `anything`.
- Page repetitions: the fee told twice in the cs and s bands; wrong-then-right told three times in the sac band.
- Seam echoes: "in open court"; house/boat; the boat told twice at the success seam.
- The almshouse introduced in the spine (net zero words).
- The concept art no longer paints the solution.

**Should fix (applied):**
- Card effect lines share no word with their names.
- The critical-success overview is set apart from success (the magistrate thanks {actor}).
- The critical-failure overview names the objection instead of withholding it.
- The `his savings` ambiguity is resolved.
- "wrapped in oilcloth" is cut.
- Thread chip causes now read "the dream" (and "Misled the court" on critical failure).
- The compulsion chip referent is fixed, and its concept text is updated.
- The ambition narrativeHook and title no longer use "things".
- The description no longer overclaims "unable to stop".

**Consider (not applied):**
- `success_at_cost` carries its cost in prose only; its chips match success. The brief's row asks for "a condition, a lean, a debt", but the Cunning Fair shipped the same pattern and no trigger forces a mechanic change. Flag it for the batch-level variance read.

**Mechanics unchanged.** Every id, effect, delta, rewardPool, deal, cost and `opposes` value is as in the package.

# Encounter Pipeline: Called to End a Feud
> Scale: medium (3 steps, `scale: 'local'`) | Slug: feud-mediation | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0 | Critic: independent, cold context (batch expert-everyday-1, slot 2, THR-1678)

The revised packet is `feud-mediation-revised.md`. No id, effect wiring, difficulty, delta, cost or trait ref changed. Every edit is prose: the opening, one spine, afterimages, card faces, fragments, overviews, chip captions and reaction text.

## 1. Prose quality

The draft is in narrator mode. There is no interiority and no camera work, and every step tests its declared reach: finding the sender (eye), getting two bought-suspicious heads to trust the mortal (heart), and holding one table together (heart). The encounter is a clean investigation → resolution.

Defects found:

- **Word budget, rural opening.** The self-audit reported 76 / 77. By count, urban opening + step-0 spine is **77** and rural is **81**, which is over the 80-word cap. **[EDITORIAL REWRITE]** Rural P1: "{actor} comes to {location} at the elders' request, to end a feud between its two landowning households." Revised totals: urban **79**, rural **78**.
- **P3 did not state the stake (brief conformance).** The brief binds every P3 to "names what is at risk in standing, stated plainly". The draft P3 carried only the clock ("meet once… Neither will agree to meet again"). The standing stake appeared only at step 2. **[EDITORIAL REWRITE]** "The heads will meet only once, at sundown in the hall. If the feud outlasts that meeting, {location} will think less of {actor}." This keeps the time opposition and states the cost. The cost is enacted by step 2's `failureMetadata` `reputation_with $here −0.06`, so prose rule 7b holds. P2 was tightened to make room ("The feud began last spring with an insulting letter from the house of {cast:accused}. It broke off the mill contract the two houses shared."). The draft's "broke off … with an insult" needed a second read.
- **Step-2 spine repeated the stake.** Once P3 carries the stake, the step-2 closer "If the feud goes on, {location} will think less of the peacemaker it sent for" tells it a second time. It is cut. The spine now ends on what is asked ("{actor} must end the feud before either head walks out."). "sit down … at sundown" became "take their seats", which removes the sound echo.
- **Class scenery in a band (trigger 18).** The success-at-cost overview and the outcome ladder named "the council's fee", but on a `rural` draw there is no council (the elders sent for the mortal). **[EDITORIAL REWRITE]** "…{actor} turns down any fee for the work."
- **"Thread" as a card word.** Dull A Suspicion's effect line ("lose the thread of their charge") and its failure fragment ("lost the thread") use *thread*, which is the game's own word for the god–mortal bond. On the card face a player will read it as the mechanic. Rewritten as "train of thought" and "faltered".
- **Unreadable compression (trigger 29).** The Wake Old Memory near-miss fragment "…remembered the morning clearly, and remembered it late in the day" reads as though the morning itself was late. **[EDITORIAL REWRITE]** "…remembered the morning clearly, but not until late in the day."

## 2–4. Branch seduction / count / scale

Linear Puzzle – Investigation – Resolution with no fork. **KEEP 0** branches. Medium scale is right: the eye step finds (or fails to find) the truth, the carryover lines carry it into both heart steps, and the resolution uses or does without it. That is exactly three beats.

## 5. Inspiration anchor honesty

The anchors are honest. `unlikely_alliance` supplies the tactical contract, so the peace is a signature and not a friendship. `rebuilding_trust` supplies step 1: the purses, and the aggrieved head who believes only an unbought peacemaker. `compassionate_liberation` survives as the scribe leaving the house's service, which is now told on the companion chip instead of left implicit (see § 6b). The Seed Dice are honoured: the mystery (who sent it), the time clock (one meeting at sundown), and the mortal as the target (both purses).

## 6. Aftermath payoff and 6b. Page read

**How the bands are reached.** Steps 0 and 1 are `continue_weakened` and step 2 is `fail_action`. Any weakness earlier plus a step-2 success lands on `success_at_cost`. `failure` and `critical_failure` come only from step 2. So the success-at-cost overview must be true on every path. The draft's version rested its cost on the step-2 s_a_c afterimage (the oath to take no payment) and told it twice on that path.

Assembled as the player meets each band, **before** the fixes:

| Band | Finding | Fix |
|---|---|---|
| critical_success | **Conflict / unclear referent.** The overview says "The house scribe sent it by mistake", and the chip says "Left the house's service — A guild scribe travels with {actor} now". *House* scribe against *guild* scribe reads as two people, and nothing on the page says the sender is the one who left. The step-0 critical afterimage and the carryover line had also already told the scribe fact | The overview drops the scribe sentence and keeps the new event (the head's private admission). Companion chip: "Sent the letter by mistake and left service — the house scribe travels with {actor} now." (15 words.) The reveal is told once, on the chip whose state it explains. `companion.guild-scribe`'s profession is *Guild Scribe*, which fits a house scribe going out on their own |
| success | The same scribe conflict | The same fix |
| success_at_cost | **Repetition.** The chip "Made the peace unpaid" paraphrased the overview's "leaves the hall without the council's fee". On the step-2 s_a_c path the afterimage had already said the mortal "swore … to take no payment", so the page told the fee three times. The afterimage "Both heads signed" also echoed the overview's "The houses sign" across the seam. The overview also named the council (class scenery) | Step-2 s_a_c afterimage: "The heads agreed terms, but only after each had called {actor} bought before the whole hall." The overview now carries the cost alone: "The houses sign a new mill contract. To show that no house paid for the peace, {actor} turns down any fee for the work. In private…". This is true on every path. Reputation chip: "Ended the feud at sundown — …" |
| failure | **Seam echo and repetition.** The step-2 failure afterimage "…and the feud goes on." was followed by an overview that opened "The feud goes on…" (trigger 22). The page then told the town's judgement three times: "says the peacemaker … could not end it", "is trusted less by it", and the chip "thinks less of {actor} now" | Overview: "The mill stands idle between the two houses for another season. {location} sent for {actor} because other peacemakers had already failed." The first sentence gives the world cost and the second says plainly why it costs more for an expert, as the brief asks. Chip: "Could not make the peace — {location} thinks less of {actor} now." |
| critical_failure | **Conflict and repetition.** The step-2 afterimage has both heads leave "by separate doors", and then the overview has them "tell the hall", which is a sequencing contradiction. The chip cause "Blamed by both houses" retold the overview's accusation, and "by morning the whole of {location} has heard it" paraphrased the chip | Overview: "Each head tells their own house that {actor} took the other side. A peacemaker both sides call bought has lost the name that got them sent for." Chip: "Lost the one meeting — {location} thinks less of {actor} now." |

**After the fixes**, each band reads as one text:

- **critical_success.** Contract signed, thanks before the hall, and the head's private admission. **BOND · reputation with {location}**: "Ended the feud in one sitting". **BOND · a favour owed**: "Kept the letter's author a secret — {cast:accused} owes {actor} a favour." **BOND · companion**: the scribe who sent it leaves with the mortal. Reactions: *See the contract kept* / *Write down how the feud began*. Each block adds a fact the page did not have. Clean.
- **success.** The same shape, signed before the hall empties. Clean.
- **success_at_cost.** Signed. The fee turned down is the cost, and it is told once. Then the admission and the three chips. Clean on all six paths.
- **failure.** The idle mill and the reason it costs more, then the town-standing chip, then *Stay on in town, taking no side* / *Side with the house that was insulted*. Clean.
- **critical_failure.** Each house hears the mortal was bought, and the name is lost. Then the chip, then the same failure pair. Clean.

Every chip caption is 10–15 words. By hand, no chip shares a four-word run with its overview.

**Reaction text.** "Stay a week to see the contract kept" promised a duration the engine will not hold the mortal to (the effect is only `reputation_with +0.03`). It becomes **See the contract kept** (a trigger-34 hazard removed). The intent "…whatever either house says of it later" used *whatever* (natural indefinite, outcome-adjacent). It now reads "however either house tells it later".

## 7. Dilemma energy

Step 0 asks whether to spend on a witness who wants to talk (Loosen A Tongue) or on a clear memory of the day (Wake Old Memory). These are different certainties: a person against a record. Step 1's single special undercuts the one doubting head. Step 2 sets binding the spoken terms (Seal The Handshake) against a Forgiving mortal's example (Lay Grudges Down). The reaction pairs are real stances: be seen keeping the peace or keep the truth (success), and stay neutral in public or take a side (failure). Both are defensible, and the failure-side "take a side" has a real price (the `bond_change` against the other head).

## 8. Experience Differentiator Gate

1 YES, after the fixes (arrival · situation and complication · problem, with the stake now in P3; 79 / 78 words) · 2 YES · 3 YES (the letter, the purses, the hall, the scribe, the steward and the heads are all established before the hands) · 4 YES · **4b NO → fixed** (the step-2 spine restated the P3 stake, and the failure-overview seam "the feud goes on") · **5 NO → fixed.** Four of five effect lines shared a word with their titles (*A* in Loosen A Tongue and Dull A Suspicion, *the* in Seal The Handshake and in Wake Old Memory's "the day … the room"). Loosen A Tongue's "servant" and Dull A Suspicion's "thread" were narrower than generic, and the trait card opened with meta-commentary ("No essence.") and described the mortal acting rather than the god's influence. Rewritten:
  - **Loosen A Tongue**: "Fill frightened witnesses with longing to be rid of what they know, so they tell whoever asks kindly."
  - **Wake Old Memory**: "Bring a past day back clear in the minds of those who were there, so they recall who did what."
  - **Dull A Suspicion**: "Make doubters lose their train of thought mid-accusation, so their charge comes out weaker than they meant."
  - **Seal The Handshake**: "Make any promise spoken aloud weigh on its speaker, so taking it back comes hard."
  - **Lay Grudges Down**: "Wake their forgiving nature, so those around them see an old wrong set aside, and follow."

  None shares a word with its title. All title verbs (loosen, wake, dull, seal, lay) are in `IMPERATIVE_VERB_LEXICON`. · 6 YES (essence 2 on four specials, and the trait card is cost 0 as the trait-only rule requires) · 7 YES (every special has a failure fragment, and none is big-delta) · 8 YES · 9 YES · 9b YES (composed 2+3, 1+4, 1+3 or 2+3, no special cap breached, no ending chosen by the player) · 10 YES · 11 YES (`reputation with {location}` as in the levee-breach precedent, `a favour owed`, `companion`: all pass the cover-the-title test) · **11b NO → fixed** (§ 6b) · 12 YES · 13 YES · 14 YES (residue image: an empty hall, chairs pushed back, a signed contract and a face-down letter, no people).

## 9. REVISE triggers, checked one by one

1 approach prose: present on all three steps · 2 generic god-verbs: none · 3 thread integration: Forgiving/Vengeful variant plus the trait card · 4 reaction choices: two pairs · 5 reporter prose: none, every afterimage says what changed · 6 concept art: present and evocative · 7 hand size: 5 / 5 / 4 (5 for Forgiving) · 8 spheres / common: specials span mind, time, chaos and order, and the dealt fill supplies the common option (`checkComposedHand` to confirm) · 9 failure fragments: all five specials · 10 band coverage: the specials cover crit, success, near_miss and failure. s_a_c and critical_failure rest on the dealt members' `BAND_FRAGMENTS` (the same reliance the precedent accepted, and the machine check confirms it) · 11 digits in effect lines: none · 12 trait hooks: four answered, and `core_forgiveness` refs resolve in `core-trait-content.ts` · 13 nudge payoff in base text: none · 14 instructing the mortal: none (the trait card's line was reworded so the god stirs the trait rather than the mortal performing) · 15 detector hits: none found by hand in the outcome class after the "whatever" fix, and no "not … but" clause · 16 scene-bespoke card faces: **fixed** · 17 mood effect lines: none · 18 envelope / class scenery: **fixed** ("council's fee") · 19 riders: none · 20 zero-essence non-trait / dead grants: none · 21 family composition (Whisper / Boost / Stumble / Boost / Trait card): no `encounter.town.*` match known, left to the systems pass · 22 seam echo: **fixed** (step-2 spine, failure overview, s_a_c afterimage→overview) · 23 static factor lines: carryover only · 24 bystander: no · 25 announced mechanics: no. The P3 stake is a stated cost, as Doctrine v2 asks · 26 design-block breach: none (mystery paid off in every success band, clock paid off at step 2 and in the failure overviews, the purses used in step 1) · 27 title: passes the glance test · 28 crux: one sentence · 29 unreadable compression: **fixed** (P2 letter sentence, near-miss fragment) · 30 shape: from the catalog · 31 invented game state: "at the council's request" and "sent for {actor}" are scene-local premises with no life outside the encounter. They are the brief's own "sent for because they are good", and they assert no debt, visit or standing, so not firing · 32 chip nouns: sheet words · 33 chip length / overlap: 10–15 words, no four-word run · 34 later-tense promises: the P3 "will think less" is enacted by the step-2 failure write, and "Stay a week" was removed · 35 page read: **fixed** (all five bands).

## 10. Verdict

**PASS WITH REVISIONS.** Every revision is applied in `feud-mediation-revised.md`. No mechanics or ids changed.

## 11. Revision summary

**Must fix (applied):** the rural opening was over the 80-word cap. P3 now carries the standing stake the brief binds. Card faces: shared title words, "thread", "servant", and the trait card's meta and mortal-acting line (16). Class scenery "council's fee" (18). Seams at the step-2 spine and the failure overview (22). Page conflicts and repetitions on all five bands, including the house/guild scribe confusion (35).

**Should fix (applied):** the near-miss fragment reading, "Stay a week" (34 hazard), "whatever" in a reaction intent, the self-audit word counts, and the ladder's "Spent" cell.

**Consider (not changed, systems lane):** `aftermathConfig.branchOnStep: 0` with `variants: {}` is inert on a linear encounter. Confirm the fallback-only shape is what the compiler expects. Step 1 and the s_a_c/crit-fail bands on step 0 lean on dealt fragments for coverage, so `checkComposedHand` should confirm this at the live deal.

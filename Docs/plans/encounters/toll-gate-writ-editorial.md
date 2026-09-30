# Encounter Pipeline: The Writ at the Toll Gate
> Scale: medium | Slug: toll-gate-writ | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-2, slot 2 (THR-1679)

**Verdict: PASS WITH REVISIONS** (every edit applied in `toll-gate-writ-revised.md`).

The design is sound. A trained eye is asked to rule, and the mortal's own `revelation_discretion` decides the ruling. The god leans that decision, and the lean has a price, because it chooses which test the mortal faces next. The brief's slot-2 row is honoured exactly: the id, eye 0.60 → fork (eye 0.64 · heart 0.62), `urban`, and a `knowledge` + `movement` hand wired branch-keyed as the brief describes. The draft had four kinds of real defect. All are local, and none is structural:

1. **Two card names would fail `check:encounter`.** "Temper" and "Shake" are not in `IMPERATIVE_VERB_LEXICON` (`src/data/content-eval/doctrineV2Checks.ts:94`). This is the same class as batch 1's "Counsel Patience". They are renamed **Cool Their Scorn** and **Twist A Steady Hand**.
2. **Path-truth failures in the fork.** Seeker's failure and critical_failure overviews called the reading "a guess" and said the mortal "could not prove it". Both are false after a step-0 success, which proved the seal a copy. The Sentinel step-1 narrative ("how long {actor} held the seal to the light") contradicted the step-0 critical_success afterimage ("found the fault at once").
3. **Page repetition and conflict (trigger 35).** On the Sentinel success pages the overview told who made the writ and the knowledge chip told it again. The Sentinel success_at_cost overview ("every carter at the gate watched") contradicted the Turn Away Eyes band fragment ("The carters looked away") on the same band. Both reaction prompts also retold a fact already on the page.
4. **An ungrounded card.** Turn Away Eyes acts on "the waiting carters", but no prose put carters in the scene before the hand. They appeared only in an optional step-0 fragment.

All four are fixed in the same pass, following the `comet-disputation` and `well-sinking` precedent: the triggers fired, and the fixes were local prose.

---

## 1. Prose Quality

**Opening (P1 14 + spine 65 = 79 words).** It follows the skeleton: arrival, the situation with the forgery stated plainly, and one stake of the `choice` shape. Three problems:
- "whoever passes a writ answers for it" needs two readings. A traveller *passes* the gate; a judge *passes* a writ. That is trigger 29. [EDITORIAL REWRITE] "Under the town's toll charter, whoever approves a writ answers for it." P3: "Approving it puts {actor}'s name on a forgery."
- "who knows seals" asserts a skill the graph does not hold (rule 31 adjacent). The draw guarantees an expert **Eye**, not a seal expert. [EDITORIAL REWRITE] "who has a trained eye". This also primes the failure overviews, which now cash in "a trained eye".
- "The family's writ of passage lets them through free of toll" states as fact the thing in doubt. [EDITORIAL REWRITE] "The family carries a writ of passage that frees them of the toll."

**Step 0 afterimages.** They are clean. Each states what the mortal found, which is the test's job. The critical_failure line ("misread the seal in front of the whole gate") leads correctly into an ending with no step 1.

**Step 1 narratives.**
- Seeker is good: one named person (the traveller), and the stake of the next test (the court wants the maker) is stated plainly.
- Sentinel was false on one path, and it failed to establish the carters. [EDITORIAL REWRITE] "{actor} vouches for the family, and they go through the gate without paying the toll. Under the charter, the writ is now {actor}'s to answer for. In front of the waiting carters, {cast:tollmaster} asks why {actor} frowned over a sound seal." "Frowned over" is true whether the fault was found at once, found late, or only suspected. "In front of the waiting carters" gives Turn Away Eyes its target and raises the stake of the interrogation.

**Cards.**
- **Light The Page** / **Cool Their Scorn**. Both lean sentences were near-copies of `comet-disputation`'s step-0 pair: "Clear sight makes them readier to speak out" became "Seeing plainly makes them readier to speak out". The Scorn card's lean mechanism also did not follow. Patience does not make someone keep a secret.
  - [EDITORIAL REWRITE] Light The Page: "Throw the sun full across the writ, so every stroke of ink and wax shows. A fault seen this plainly is hard to keep quiet." (25 words.)
  - [EDITORIAL REWRITE] Cool Their Scorn: "Ease any contempt for the family, so they read the writ slowly and miss no fault. Without contempt, they are slower to condemn." (22 words.) Contempt removed, condemnation slowed: that is the discretion lean, and it now follows.
- **Twist A Steady Hand**. The old line ("so the next seal cut there comes out botched") stated an effect without saying why it helps the search. [EDITORIAL REWRITE] "Put a tremor in the maker's fingers at the bench, so a botched seal lies there for them to find." The botched seal is evidence, which is the mechanism. The four existing band fragments still read true against it.
- **Guide Their Steps**, **Kindle Goodwill** and **Turn Away Eyes** are clean. Each states a mechanism and acts on a named target.

**Factor lines.** "Being Judgemental, they had judged the family…" echoes itself. [EDITORIAL REWRITE] "Being Judgemental, they made up their mind before reading a line." Both factor lines are trait-derived, so they vary per mortal and pass trigger 23.

**Aftermath overviews.** Rewritten band by band in § 6b. The Seeker critical_success overview ("No one at the toll house has seen a forgery this good caught so quickly") is the extreme band doing its job. It is kept.

## 2. Branch Seduction Audit

- **Seeker (name it false).**
  - *Interference fantasy:* throwing light on the fault, then leading a hunt through a town to a forger's bench.
  - *Why a god chooses it:* a public win for a trained eye, the most standing on offer (+0.06), and a reliable intelligence record.
  - *What it protects:* the charter and the next family the seal-cutter sells to.
  - *Cost:* a family goes before a court for buying the only passage it could afford. The reactions let the god decide what the mortal says about that.
- **Sentinel (vouch and keep quiet).**
  - *Interference fantasy:* warming a hard official and turning a crowd's eyes away while a mortal lies well.
  - *Why a god chooses it:* a favour owed by a traveller, the same knowledge (as hearsay), and a road out with the family.
  - *What it protects:* a family's passage and a confidence kept.
  - *Cost:* the steeper, off-reach test and the larger loss on failure (−0.08).
- **The asymmetry is real on four axes:** reach (Eye against Heart), risk (standing gained against a favour owed), who pays (the family against the mortal's name), and reliability (0.9 against 0.75). Neither arm is plainly right. The god's step-0 lean is the only lever, and it is a genuine trade: lean toward discretion, and the mortal takes the harder test. **KEEP 2.**

## 3. Branch Count Assessment

Two arms on one binary registry axis, each with its own continuation, its own hand and its own reactions. That is right for medium. **KEEP 2.**

## 4. Scale Discipline Check

Medium: two beats (the reading, then a pole-specific continuation) and reaction choices on both arms' success bands. The draft's § 2 is right that a third beat (the court, or the road) would restage what the relocation and the reactions already carry. The size matches the declared scale.

## 5. Inspiration Anchor Honesty

- **hook.mad_artificer (drifted).** Honest, and it did real work. The vault's tonal note (a decent goal by illegal means) is what makes the seal-cutter sympathetic and Sentinel tempting. It is visible in the intelligence detail and the Seeker critical afterimage.
- **Seed dice (choice · faction territory · open · trespasser · personal).** Honest. The open, trusting toll-master is what makes Sentinel a betrayal and not a clever dodge. "Trespasser" is a stretch for a stranger at a gate, but the charter binding whoever approves a writ on its ground gives it a mechanical reading.
- **Dilemma Library.** Declared not consulted, with the reason stated. That is honest.

## 6. Aftermath Payoff

It lands, and it is actor-centred. A win leaves the mortal leaving town (to swear at a court, or with the family), holding a named piece of knowledge about the road's false writs, and owed or owing through two named people. A loss is the expert's penalty, stated plainly: the town trusts the mortal's eye less, and each failure overview says why that costs a trained eye more. Nobody is killed, jailed or branded. The family may be held; the mortal never is.

## 6b. Page read, as the player meets it

Each band was assembled (overview, then chips in scar · bond · boon · path order, then reaction label + intent) and read once as one text. What follows is the **revised** page. The draft defect is noted where one existed.

**Seeker (`positive`)**

- **critical_success:** *The case goes up to the county court: the family for carrying the writ, the seal-cutter for making it. {actor} is wanted there to swear to the reading. No one at the toll house has seen a forgery this good caught so quickly.* · BOON reputation with {target}: "The town trusts {actor}'s eye more." · BOON knowledge: "{actor} knows where the false writs on this road come from." · PATH seed: "{actor} is travelling away from {location} now." · > Speak for the family / > Swear to the seal alone.
  - Clean. The overview tells the event, the knowledge chip widens it from this writ to the trade, and the path chip states the leaving that "wanted there" implies. *Draft defect, repetition:* the reaction prompt "The case goes before the county court" retold the overview's first clause word for word. It is now "What does {actor} tell the county court?"
- **success / success_at_cost:** Same chips and reactions. Clean. The success_at_cost cost ("the family spent the whole day held at the gate") is new to the page.
- **failure:** *Without the maker, the town's court would not hold the family, and let them go. The toll house asked a trained eye to settle the writ, and {actor} left it unsettled.* · SCAR reputation with {target}: "The town trusts {actor}'s eye less."
  - *Draft defect, conflict:* "{actor} gave it a guess" contradicts a step-0 success, which proved the seal a copy. The Seeker failure is losing the maker, not misreading the writ. *Draft defect, seam echo:* "No one would name the maker" repeated the step-1 failure afterimage directly above it ("no one would say who cut the seal"). The overview now gives the cause (no maker, so no case) and the expert's cost (unsettled). The SCAR states the change.
- **critical_failure:** *{actor} named the writ false, and the maker was never caught. The town's court let the family go, and every carter at the gate has heard the toll house call {actor}'s reading a guess.* · SCAR as above.
  - *Draft defect, conflict:* "called the writ false and could not prove it" was false on the step-1 path after a step-0 success. The revised overview is true on both paths. "The toll house call it a guess" is now the town's charge, not the narrator's verdict. "In front of every carter" also echoed the step-0 critical_failure afterimage ("in front of the whole gate") across the seam, and was reshaped.

**Sentinel (`negative`)**

- **critical_success:** *The family is through the gate, and the toll house wrote them down as paid. On the far side, {cast:traveller} told {actor} who made the writ, and why it was sold so cheap.* · BOND a favour owed: "{cast:traveller} owes {actor} a favour." · BOON knowledge: "{actor} knows where the false writs on this road come from." · PATH seed: "{actor} is travelling away from {location} with the family." · > Send the name to the toll house / > Keep the family's secret whole.
  - *Draft defect, repetition:* the knowledge chip "knows a seal-cutter in town copies the toll seal" was the overview's "told {actor} who made the writ" said again. It now shares Seeker's wider line. *Draft defect, repetition:* the prompt "{actor} knows who copies the toll seal" retold the chip. It is now "Who else hears the seal-cutter's name?" "On the road outside" also pre-told the path chip and was changed to "On the far side".
- **success:** *The family is through the gate. On the far side, {cast:traveller} told {actor} who made the writ.* Same chips and reactions. Clean after the same edits.
- **success_at_cost:** *The family is through the gate, and {actor}'s name is written in the toll book beside their writ. On the far side, {cast:traveller} told {actor} who made it.*
  - *Draft defect, conflict:* "every carter at the gate watched {actor} being questioned" contradicted the Turn Away Eyes success_at_cost fragment ("The carters looked away…") whenever that card was committed. The cost is now the charter's own ink: the mortal's name sits beside a forgery in the toll book. That is true with any subset of the hand, and it pays off the P2 charter sentence.
- **failure:** *The toll house read the writ again and found it false. The family was brought back from the road and held for the town's court. A trained eye passed that forgery, and under the charter it is {actor}'s to answer for.* · SCAR: "The town trusts {actor}'s eye less."
  - *Draft defect, verbosity:* four sentences, with "trusted {actor}'s eye so it would not have to check the writ itself" sitting awkwardly next to a toll house that had just checked it. Three sentences now. The last states the expert's cost and pays off the charter once.
- **critical_failure:** *{actor} let a forged writ through the gate, and the toll house found it out the same day. The family is held for the town's court, and every carter at the gate knows whose word passed the writ.* · SCAR as above.
  - *Draft defect, echo:* the second "Under the charter the forgery is {actor}'s to answer for" in a row across two bands was cut. The overview is true on both paths (flag 2, below).

## 7. Dilemma Energy

The tension is genuine, and it sits in the right place. The mortal decides; the god only leans. Both options are defensible in the fiction: the charter is fair by its own lights, and the family is poor, not wicked. The god's posture is revealed twice. It shows first in the step-0 lean: leaning toward discretion puts the mortal on the harder Heart test. It shows again in the reaction: mercy against the charter, or repair against confidence.

## 8. Experience Differentiator Gate (answered on the revised text)

**Scene & Prose**
1. **YES.** Arrival, situation & complication, and one `choice` stake, in 79 words with real names.
2. **YES.** Every sentence is challenge, test or outcome. There is no interior sensation and no camera work.
3. **YES** (after edits). The writ, seal, charter, toll-master and family are in the spine. The traveller and the maker are in the Seeker narrative. The carters are now in the Sentinel narrative.
4. **YES.** A player can retell it: "A toll-master asks a trained eye to judge a forged writ; exposing it sends a poor family to court, approving it puts the mortal's name on a forgery."
4b. **YES** (after edits). The seams were checked and three were fixed: step-1 failure afterimage → Seeker failure overview; step-0 critical_failure afterimage → Seeker critical_failure overview; Sentinel failure → critical_failure.

**Choices & Intervention**
5. **YES** (after the two renames). Every name is an imperative verb from the lexicon plus a noun. Effect lines are one or two sentences with no quote. Specials name their targets, which is lawful for specials (spec § communication pivot).
6. **YES.** Every line states a mechanism, and every special is essence-priced (1–2).
7. **YES.** Every special carries at least one failure-band fragment. No Δ ≥ 0.15.
8. **YES** (after edits). Every card's target is in prose before its hand.
9. **YES.** Step 0 offers light that exposes against calm that reads. Seeker offers finding the door against spoiling the bench. Sentinel offers warming the questioner against removing the audience.
9b. **YES.** Every nudge-bearing step has two specials plus a declared deal. The branch is agent-decided. No step asks the player to pick a branch.

**Aftermath & Consequence**
10. **YES.** Every band has an overview landing.
11. **YES.** Every chip noun is a sheet word: `reputation with {target}` (anchored `$here`), `knowledge`, `a favour owed` (no `entityId`, with the traveller as a concept), and `seed` (flag 3). No scene-minted noun. Consequences name the town, the traveller and the toll-master.
11b. **YES** (after edits; § 6b). The draft failed on three Sentinel bands (repetition, conflict) and two Seeker bands (conflict).
12. **YES.** Two reactions per arm, on the success bands.
13. **YES.** Seeker offers mercy against the charter. Sentinel offers repair against confidence.

**Presentation**
14. **YES.** The two-question method is used. The image is residue and absence: a seal off true, a pen set down mid-word, a road running away into sun, and no people.

## 9. Rulings on the drafter's flags

1. **Sentinel arm tests heart 0.62 on an Eye-first mortal: keep.** `NUDGE_OFF_REACH_MAX_DIFFICULTY` binds only `intrinsicTier: 'background'` (`nudgeHandChecklist.ts:419`), and this template is `shaping`. The brief fixed the pole for variance. For the player it is not broken; it is the point. The god sees the fork coming, and **Cool Their Scorn** leans the mortal onto the harder arm. The discretion lean therefore costs something the reveal lean does not. At the 0.40 + 1.25 × (capability − difficulty) curve, an Eye expert with journeyman Heart sits near `unlikely` unaided. The two specials alone (Δ 0.20) lift it a tier, and a full dealt hand reaches `uncertain`, so the hand moves the forecast word. The Sentinel prose is Heart work (holding a trust under questioning), so the step tests its declared reach (trigger 26). Systems records the forecast word per arm for a typical Eye expert as evidence. Switching pole B to eye 0.62 would flatten the one lever that makes the lean a choice, so **not recommended**.
2. **Step-0 critical_failure after the fork picked an arm.** Confirmed in code: `applyAgentDecidedBranches` runs before `advanceStep` (`unifiedActionResolution.ts:2335`), and critical_failure forces `fail_action`. The recorded arm's critical_failure band renders with step 1 unrun.
   - **Sentinel** read true on both paths as drafted.
   - **Seeker** did not. "could not prove it" is false when step 0 succeeded and step 1 critically failed. Fixed (§ 6b). The SCAR is backed on both paths: by step 0's −0.03 on the step-0 route, and by step 1's −0.06 / −0.08 on the step-1 route.
3. **PATH · `seed` for the relocation: keep.** It is the corpus's one relocation chip noun (`assize-letter.ts:299`, `the-broken-seal.ts:752`, `bell-at-the-exchange.ts`, `encounter-content.ts`), with a live `ui.aftermath_seed` tooltip. It names a generic system state, not a scene phrase, so trigger 32 does not fire. A better noun for relocation is a corpus-wide vocabulary change, and belongs outside this encounter.
4. **Rewards resting on favour / bond: acceptable as design.** Sentinel's win writes a persistent `owes_favor`. Seeker's win pays in standing and knowledge, and its reactions carry the persistent thread (`favor_creation` on the toll-master, or regard from the traveller). `comet-disputation` shipped with its favour on one arm. Whether `check:encounter`'s Rewards block counts a variant-scoped write plus reaction writes is a systems question. Hand it to Pass 3.
5. **`wanderer` as a spawn-only role: correct.** It is a live `spawnNpcRole` (`road-ambush.ts:37`, `soul-ferryman.ts:47`, `default-support-bundles.ts`). Omitting `reuseNpcRoles` is right, because a reused local would be a "travelling" family head who lives in the town.

## 10. Verdict

**PASS WITH REVISIONS.**

## 11. Revision Summary

**Must fix (all applied)**
1. Rename **Temper Their Scorn → Cool Their Scorn** (`writ.cool_their_scorn`) and **Shake A Steady Hand → Twist A Steady Hand** (`writ.twist_a_steady_hand`). Both verbs were off `IMPERATIVE_VERB_LEXICON`.
2. Seeker failure and critical_failure overviews: make them true after a step-0 success.
3. Sentinel step-1 narrative: make it true on the step-0 critical_success path, and establish the carters.
4. Sentinel success-side pages: remove the overview/knowledge-chip repetition, and remove the success_at_cost contradiction with the Turn Away Eyes fragment.
5. Both reaction prompts: stop retelling the overview or chip.

**Should fix (all applied)**
6. Opening: "passes" → "approves" (two readings), "who knows seals" → "who has a trained eye", and "lets them through" → "carries a writ … that frees them" (79 words).
7. Step-0 lean effect lines: move them off comet-disputation's wording and give Cool Their Scorn a lean mechanism that follows.
8. Twist A Steady Hand: state why a botched seal helps the search.
9. Sentinel failure: trim to three sentences and pay off the charter once. Sentinel critical_failure: cut the repeated charter sentence.
10. Judgemental factor line: remove the self-echo.

**Consider (for Pass 3)**
- Confirm the type composition differs from `comet-disputation`'s (trigger 21). Both use a revelation_discretion lean pair on step 0 with the same image tags (`generic.light`, `generic.focus`). The draft asserts Whisper+Compulsion, but the comet file carries no type labels to compare against. If they match, re-type Cool Their Scorn (for example as Whisper) or swap its image tag.
- Record the per-arm forecast word for a typical Eye expert (flag 1).
- Confirm the Rewards block counts the Sentinel `favor_creation` and the reaction writes (flag 4).
- The "wanted there to swear" sentence names an off-stage county court the mortal never reaches. The relocation enacts only the leaving, and the PATH chip claims only that, so it is lawful under 7b. If Pass 3 reads it stricter, change it to "{actor} is sent for to swear to the reading."

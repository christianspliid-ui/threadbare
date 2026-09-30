# Encounter Pipeline: The Oath-Breaker's Rite
> Scale: short | Slug: oath-breaker-rite | Pass: editorial
> Date: 2026-09-30 | Pipeline version: 2.0 (run under Encounter Factory 3.0) | Batch: expert-everyday-2, slot 6 (THR-1679)

**Verdict: PASS WITH REVISIONS.** Revised packet: `Docs/plans/encounters/oath-breaker-rite-revised.md`.

## Orchestrator ruling — applied: the fork is KEPT, Heretic arm raised to veil 0.62

The ruling offered two options: raise the Heretic arm to 0.60–0.62 with honest prose, or cut the fork and keep the brief's linear 0.60 → 0.68. **I raised it to 0.62 and kept the fork.** Reasons:

1. **The difficulty can be made honest in one sentence of fact.** The Heretic does not face an empty task. They must take a culprit away from a frightened crowd that already has one, and take authority away from a priest in front of that crowd. The revised spine says so plainly: *"The crowd is afraid, and it would rather believe a priest than a doubter."* The objective is also now a real Veil test: *"prove to the whole square that the priest's rite calls on no power."* The draft's objective was similar, but at 0.40 it read as a formality.
2. **The fork is the brief's own premise.** Slot 6 reads *"the expert may perform the true release, or read whether the curse is real at all."* Cutting the fork would honour the step row and lose the premise.
3. **Cutting would not keep the shape either.** A linear 0.60 → 0.68 is a Test & Consequence with no decline path. The opt-in shape would be lost whichever way the ruling went.

**The shape tension is recorded, not hidden.** The catalog calls the Opt-in Complication's decline *"a cheap, legible exit"*. Under the ruling, no expert-batch decline can be cheap in its odds. The revised design block (§ Shape) states the reading I applied: the decline arm stays **legible** (refuse every rite; no release is attempted) and **cheaper in what it risks** (no Cursed on this arm; a +0.05/−0.06 reputation swing against the Archivist's +0.08/−0.10). Only its odds are expert. I do not count this as trigger 30 (a shape invented on the fly), because the structure is the catalog's and the deviation comes from a batch ruling with a written reason. The batch report should carry one line on it. If the gate or the orchestrator reads it the other way, the fallback label is **Personality Fork**, whose structure is identical. Path means after the raise: Archivist 0.64 (window fit 0.78), Heretic 0.61 (0.75). Both are expert.

## Drafter flags — rulings

| # | Flag | Ruling |
|---|---|---|
| 1 | Step-0 critical failure (known engine bug); `fallback` aftermath written | **Keep as authored.** The fallback is correct and has no chips, which is correct. Added one thing the draft missed: today the chosen arm's critical-failure *overview* is also wrong on that path, not only its chips. It narrates a step-1 rite that never happened. This is the same corpus-wide caveat debt-arbitration shipped with, so it goes to Pass 3 and does not block. |
| 2 | Opening at 79/80 | **Trimmed to 78.** I split the two-fact sentence ("the workshop has burned, and the shrine lamp goes out") into two, which the one-fact rule required anyway, and that dropped the "and". If the gate splits "hedge-priest" the count is 79. There is headroom either way. |
| 3 | `weaver` spawn-only role | **Keep.** `weaver` is a valid `NpcRole` (`src/types/npc.ts`, `artisan_guild` roster). Spawn-only is right: no townsperson is made an oath-breaker. Pass 3 decides `reuseNpcRoles` empty versus omitted. |
| 4 | Heavy Archivist failure shows three chips (Cursed, Under Watch, trust) | **Keep all three.** On the page read (below), none of the three repeats the overview. Each names a different state: a condition on the mortal, a condition on the town, and a standing. WATCH is the rolled hook (*blame falls on outsiders*) turned into state, and it is the reason the priest winning the square matters. Dropping it would leave the hook as prose only. Dropping CURSED would lose the consequence-hand `condition`. Dropping REP− would break P3's stated stake. Three chips at 7–12 words each is not verbose. |
| 5 | "a reader of oaths" (rule 7) · "no curse, only an oath still owed" (annotation) | **Both pass.** "A reader of oaths" is the sent-for role noun, the same shape as the shipped drowned-man spine's *"the best dream reader in the district"*. It asserts a profession the scene is built around, not a relationship with any graph agent. "No curse, only X" matches neither annotation pattern (`notButClause`, `emDashNot`). The encounter's annotation count is zero. The phrase appeared twice, in the Heretic spine and in the Heretic critical-success overview, which is a spine→band seam echo. The rewritten spine drops it, so it now appears once, on the band where it lands as the payoff. |

## 1. Prose Quality

**Opening.** It is strong and follows the skeleton cleanly. P2 states three events, each with a cost already paid (oath broken, workshop burned, lamp). P3 states one mystery, compounded once with a contest, and says the stake plainly. One fix: *"Since then the weaver's workshop has burned, and the shrine lamp goes out whenever the weaver walks in"* carried two facts in one sentence.

[EDITORIAL REWRITE] P2: *"{cast:oathbreaker}, a weaver, broke an oath sworn on the stone in the town shrine. Since then the weaver's workshop has burned. The shrine lamp goes out whenever the weaver walks in."*

**Step-1 spines: "the job" was never offered (must fix).** Both arms began *"{actor} takes the job"* / *"{actor} refuses the job"*. The opening establishes only that the weaver asks whether the curse is real, and that the *priest* holds the rite. Nothing on the page offers {actor} a job, so a player reading the spine meets an undefined referent. That fails gate Q3 (nothing unintroduced) until fixed.

[EDITORIAL REWRITE] Archivist: *"{actor} offers the weaver the old rite in place of the priest's. The old rite is spoken at the stone, before witnesses. {cast:priest}, the hedge-priest, keeps the coin and holds a rival rite in the square. There the priest tells the crowd that the strangers camped outside the gate brought the curse. {actor} must loose the oath before the crowd believes the priest."* (63 words. This also splits the draft's two-fact *"holding a rival rite … and telling the crowd"*. The witnesses are kept because Twist The Words turns on the crowd.)

[EDITORIAL REWRITE] Heretic (see the ruling above): *"{actor} refuses to hold any rite and tells the weaver to keep the oath instead. {cast:priest}, the hedge-priest, holds the midnight rite in the square anyway. The priest blames the strangers camped outside the gate. The crowd is afraid, and it would rather believe a priest than a doubter. {actor} must prove to the whole square that the priest's rite calls on no power."* (64 words.) The draft's *"They tell {cast:oathbreaker} there is no curse, only an oath still owed"* also conflicted with step 0's failure side. A mortal who *"could not tell it from a curse"* cannot then state the fact. *"Keep the oath"* is the Heretic's stance, and it is true on every step-0 band.

Both spines now keep the weaver as a role noun, so each beat has one named person (the priest).

**Step 0 critical-success afterimage.** The design block fixes a truth (a loan owed by midsummer) that no player-facing line ever told. The best band should pay the mystery off in full.

[EDITORIAL REWRITE] *"They read the stone plainly. The oath was a promise to repay a neighbour's loan by midsummer, and it still holds; that is why the lamp goes out. No curse follows the weaver. The fire was the weaver's own lamp, left burning."*

**Fragments.**
- Stir Doubt, critical failure: *"They doubted every sign at the stone but one, and that one was false"* needs two readings (rule zero). [EDITORIAL REWRITE] *"They doubted every true sign at the stone and trusted the one false sign."*
- Wake The Stone, failure: *"The stone answered, and what it answered was the oath, still owed"* is a writerly cleft. [EDITORIAL REWRITE] *"The stone answered only with the oath, still owed."*

**Effect lines (mechanism, not result).** Wake The Stone's *"The oath answers the old rite as it answered the swearing"* reads as the god stating a result. So does Twist The Words' *"The crowd drifts back to the shrine."*
- [EDITORIAL REWRITE] Wake The Stone: *"Stir the memory the shrine holds, so the oath answers the old rite more readily."*
- [EDITORIAL REWRITE] Twist The Words: *"Make the hedge-priest stumble through the rival rite in the square, so the crowd drifts back toward the shrine."*
- Stir Doubt's *"refusing the job"* becomes *"refusing every rite"*, to match the spine.

**Aftermath overviews.** They are mostly clean and actor-centred. Two edits follow from the page read below.

## 2. Branch Seduction Audit

- **Archivist (positive, tradition). Interference fantasy:** the god who makes an old rite work in public, by tripping a frightened fraud in the square or waking a stone. **Why choose it:** the richest win (a Tended Shrine, the coin handed back) and the harshest loss (Cursed, the watch, a big trust hit). **Value protected:** the old forms are real, and a real oath deserves a real release. It has the most prose and the most chips. The asymmetry is deliberate, because this is the brief's primary path.
- **Heretic (negative, novelty). Interference fantasy:** the god who backs a doubter against a crowd. **Why choose it:** the god cannot choose it directly. It leans the mortal there through Stir Doubt, and that is the point: the god is deciding whether this mortal becomes someone who takes rites apart. **Value protected:** no one should pay for a rite, and the strangers should not carry the blame. At 0.40 the arm was a safe exit with no drama. At 0.62, with the crowd's fear stated, it is a real stand. Its payoff is smaller (reputation only, and the watch on failure), which keeps it the cheaper arm to *lose* without making it cheap to *try*.
- **Asymmetry check.** The moral arguments are balanced: tradition honours the oath, and novelty refuses the fraud. Both arms protect the strangers when they win. Neither arm is a trap. **Keep both.**

## 3. Branch Count Assessment

Two branches on a short scale is the floor for a branching encounter, and both are earned now that the Heretic arm is a real test. **KEEP 2.**

## 4. Scale Discipline Check

Short scale with two beats (test, then one fork arm). Five bands per arm, a three-band fallback, and no reactions. That matches the scale. Spines run 63–64 words, near the 60 band-base budget. This is warn-level and consistent with shipped spines (debt-arbitration and drowned-man run similar).

## 5. Inspiration Anchor Honesty

Honest. *Blame falls on outsiders* became both the Under Watch state and, in revision, the stated difficulty of the Heretic arm. *Haunted relic* became the stone, with its tonal note used exactly as written: the lamp goes out because the oath is real and still owed. Setting *artifact_recovery* aside is justified in the design block. The drowned-man differentiation holds: a ritual contest ending in conditions, against a divination ending in an item.

## 6. Aftermath Payoff

It lands and it is centred on people. The priest hands the coin back, or keeps it, or names {actor} among the strangers. The weaver walks in under a lit lamp, or stays with the priest. The world keeps state on every half: a timed Veil bonus, a timed Shadow cost, the curse, and a standing.

## 6b. Page read (THR-1474)

Each band was assembled as overview → chips in scar · bond · boon · path order → (no reactions), and read once as a single text.

**Archivist · critical_success.** *"The oath came off the stone before midnight, in front of half the town. {cast:priest} handed the weaver's coin back where everyone could see. ~~No curse had ever followed the weaver.~~"* + BOON A Tended Shrine *"Rites at the shrine in town take more easily now."* + BOON reputation *"The town trusts {actor}'s word on oaths more."*
- **Verbosity (fixed):** the third sentence re-told step 0's critical-success afterimage (*"No curse follows the weaver"*). On the Archivist path it adds nothing, since the release is what happened here. Cut.
- Repetition: none. Conflict: none.

**Archivist · success.** Draft: *"… {cast:priest} kept the coin and held no rite."*
- **CONFLICT (trigger 35, fixed):** the Archivist spine says the priest *"holds a rival rite in the square"*, and Twist The Words' fragments have the priest speaking it. The overview said the priest held no rite.
- [EDITORIAL REWRITE] *"The oath came off the stone, and the shrine lamp stayed lit when {cast:oathbreaker} walked in. {cast:priest} kept the coin, and the rival rite ended to an empty square."*
- The outcome ladder row is updated to match. Chips: SHRINE, REP+. Clean.

**Archivist · success_at_cost.** *"Most of the crowd had gone home before the ~~rite~~ old rite ended. The oath is off the stone, and {cast:priest} kept the weaver's coin."* + SHRINE + REP+.
- "The rite" was ambiguous between the two rites, so it now says "the old rite". No repetition or conflict. The cost (a lost audience) is thin against a full REP+; see Consider.

**Archivist · failure.** *"The oath is still on the stone, and part of it caught on {actor}. {cast:priest} kept the crowd in the square and blamed the strangers at the gate."* + SCAR Cursed *"Misfortune clings to {actor} for a while."* + SCAR Under Watch *"The town watches every newcomer now, and quiet work there is harder."* + SCAR reputation *"The town trusts {actor}'s word on oaths less."*
- The overview gives causes (the oath caught, the priest blamed the strangers). The chips give the states those causes left (misfortune, a watch, lost trust). There is no paraphrase pair: "caught on {actor}" is the cause and "misfortune clings" is the sheet effect. **Clean (flag 4 ruling).**

**Archivist · critical_failure.** *"The whole crowd saw the rite fail. {cast:priest} told the square that the strangers had brought the curse, and that {actor} was one of them."* + CURSED + WATCH + REP−.
- Clean on the step-1 path. The overview does not say the oath caught on {actor}, so the CURSED chip is the only place the curse is stated. That is the chip doing its job, not a gap. On the step-0 terminal path the page conflicts, because the rite it describes never ran. That is the engine caveat, carried to Pass 3.

**Heretic · critical_success.** *"The crowd went home before the rite ended. The strangers at the gate were never named, and {cast:oathbreaker} knows now that there is no curse, only an oath still owed."* + REP+. Clean. This is now the phrase's only occurrence.

**Heretic · success.** *"The crowd went home, and {cast:priest} ended the rite early. No one named the strangers at the gate."* + REP+. Clean.

**Heretic · success_at_cost.** *"The crowd went home, but {cast:oathbreaker} stayed in the square with {cast:priest}, still sure of a curse."* + REP+. Clean. The cost (the weaver) is named and does not conflict with the trust gain from the town.

**Heretic · failure.** *"{cast:priest} named the strangers at the gate as the cause of the curse, and the crowd believed it."* + WATCH + REP−. Clean.

**Heretic · critical_failure.** *"{cast:priest} named the strangers at the gate, and named {actor} with them. The square believed every word."* + WATCH + REP−. Clean.

**fallback · success / failure / critical_failure.** No chips. Each overview stands alone, and none repeats another. Clean.

**Base overview (Heretic).** It said *"{actor} refused the job."* That is the same undefined "job" as the spine, so it becomes *"{actor} refused to hold any rite."*

## 7. Dilemma Energy

The fork is genuine. Both poles are defensible to a god, and the god's only lever is the step-0 lean pair. That means what the player reveals is a divine posture toward ritual itself: do you want your mortal to be a keeper of forms or a breaker of frauds? Raising the Heretic arm to an expert test is what gives this energy. At 0.40 the "breaker" posture was also the safe one, which flattened the question into risk management.

## 8. Experience Differentiator Gate (revised packet)

| # | Q | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton, ≤80 words, real names | **YES** | P1 `{location}` arrival; P2 three paid costs; P3 mystery + contest; 78 words. |
| 2 | Every sentence does challenge/test/outcome work | **YES** | After the P2 split, no sentence is atmosphere. The lamp is the haunt's evidence and the stone card's target. |
| 3 | Scene prose names what the hand acts on | **YES (after fix)** | The draft's undefined "the job" is fixed. The stone, lamp, priest, rival rite, crowd and strangers all appear before any card. |
| 4 | Retellable after one read | **YES** | "A weaver broke an oath and thinks it's a curse; a scared hedge-priest already has the job; get it wrong and {actor} loses their name in town." |
| 4b | No seam echoes | **YES (after fix)** | "No curse, only an oath still owed" at the Heretic spine → band seam is removed. "No curse" in the step-0 afterimage → Archivist critical-success overview is removed. |
| 5 | Spell-style card faces | **YES** | Verb + noun; one or two direct sentences; no flavor quote. |
| 6 | Effect lines state mechanism; prices real | **YES (after fix)** | Twist and Wake are restated as "so …" mechanism; essence on every special. |
| 7 | Every card pays off in failure | **YES** | Every special has at least one failure-band fragment; none is big-delta. |
| 8 | Every card grounded in the scene | **YES** | The priest (Twist), the stone (Wake), the fork (both lean cards). |
| 9 | Cards answer different questions | **YES** | Step 0: opposite poles. Archivist: opposition against source. |
| 9b | Full hand per nudge step; no branch/ending picks | **YES** | Composed 6 / 6 / 4; the fork is `decidedBy`. |
| 10 | Reflective aftermath landing | **YES** | Per-band overviews on both arms and the fallback. |
| 11 | Actor-centred; chip nouns are sheet words | **YES** | Cursed, Under Watch, A Tended Shrine (condition `name`s, verified in `src/data/condition-trait-content.ts`), `reputation with {target}` anchored on `$here`. |
| 11b | Every band's assembled page reads clean | **YES (after fix)** | § 6b: one conflict (Archivist success) and one padding line (Archivist critical success) are fixed. |
| 12 | Medium+: reaction choices | **N/A** | Short scale. |
| 13 | Reactions are philosophical stances | **N/A** | No reactions. |
| 14 | Concept art: two-question method, evocative | **YES** | A lamp just gone out and far torchlight: residue, no people. |

## Automatic REVISE triggers (1–35, SKILL.md § Pass 2) — sweep

Clear on the revised packet. The ones that needed an edit or a ruling:
- **3 (thread integration):** clear. The Patient variant plus the fork on the mortal's own Veil axis.
- **26 (design-block breach):** the draft's "Heretic arm (0.40), the cheap legible exit" contradicted the batch's binding band. It is fixed by the ruling and the design block is rewritten to match.
- **30 (shape):** ruled above. This is a recorded deviation under a binding batch ruling, not an invented shape.
- **31 (invented state):** "a reader of oaths" is cleared by precedent (flag 5).
- **34 (unenacted promise):** "a rite at midnight" is tonight's scene, and "their name in town" is enacted by `reputation_with $here` on every failure half.
- **35 (page):** one conflict (Archivist success) is fixed. With it fixed, the trigger does not fire on the revised packet.

The draft as written would have fired **35** and failed gate Q3. Both are single-sentence fixes that need no structural change, which is why the verdict is PASS WITH REVISIONS and not REVISE.

## 9. Verdict

**PASS WITH REVISIONS**

## 10. Revision Summary

**Must fix (applied):**
1. Heretic arm veil 0.40 → **0.62**, under the orchestrator ruling. The spine states the crowd's fear and the priest's authority as the reason the arm is hard. The design block, beat structure, measurement and self-audit are updated.
2. Both step-1 spines, and the Heretic base overview, establish the job they act on. "The job" was never offered on the page (gate Q3).
3. Archivist success overview: the priest "held no rite" contradicted the spine's rival rite (trigger 35).

**Should fix (applied):**
4. Opening P2 two-fact sentence split (78 words).
5. Step-0 critical-success afterimage tells the oath's content (the loan), so the mystery pays off in full.
6. Heretic spine no longer asserts "no curse" knowledge that step 0's failure side does not have. The seam echo into the critical-success overview is gone.
7. Wake The Stone and Twist The Words effect lines restated as mechanism.
8. Stir Doubt critical-failure and Wake The Stone failure fragments de-compressed.
9. Archivist critical-success overview: cut the line that re-told step 0.
10. Heretic `carryoverFactorLines` gain `success_at_cost` and `near_miss` rows, matching the Archivist table. `purposeLine`s are added to both arms.

**Consider (not applied — numbers, Pass 3's call):**
- The Heretic reputation deltas (+0.05 / −0.06) were set for a 0.40 exit. At 0.62, +0.06 / −0.08 would give parity.
- Archivist success_at_cost costs "the audience", yet it fires the full success half. A lighter REP+ on that band, if the engine can key it, would make the cost land.
- Confirm that the branch-level `fallback` step (a required field) carries the Heretic arm at 0.62, not 0.40.

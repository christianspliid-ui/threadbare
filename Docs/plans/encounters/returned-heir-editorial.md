# Encounter Pipeline: The Returned Heir
> Scale: medium | Slug: returned-heir | Pass: editorial
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 slot 1 (THR-1840)

Inputs read whole: `returned-heir-draft.md`, `returned-heir.package.json` (authoritative), `src/data/encounters/returned-heir-sequels.ts`; register compared against `easter-reckoning.package.json` + `easter-reckoning-sequels.ts`. Mechanics checked against `src/engine/unifiedActionLifecycle.ts` (`advanceStep`, `computeFinalActionOutcome`) and `unifiedActionResolution.ts` (`isStepSuccess` picks `successMetadata`, so `near_miss` fires the success effects).

## Verdict

**PASS WITH REVISIONS.** The design is sound and every chip is backed on every route into its band. The prose has six seam echoes (trigger 22) and three page repetitions (trigger 35). Those are wording faults, fixable in place, so the verdict stays PASS WITH REVISIONS rather than REVISE. 25 surgical edits; nothing structural; no binding constraint touched (difficulties 0.74 / 0.80, rarity 2, `local`, `shaping`, `urban` + `rural`, relationship + movement, the `$here` / `$cast:steward` appointment with its missed branch, a name-only failure, no rule gates).

## Route map (what fires on each band)

Step 0 is `continue_weakened` (a plain failure goes on to step 1; a `critical_failure` ends the action). Step 1 is `fail_action`. `near_miss` counts as a step success. Any failed or near-missed step on a run that finishes reads as `success_at_cost`.

| Band | Routes | Effects that fired | Chips claimed | Backed? |
|---|---|---|---|---|
| critical_success | s0 crit + s1 success; s0 success + s1 crit | s1 success: bond +, rep +, appointment seed | rep gain, claimant trust, appointment | yes |
| success | s0 success + s1 success | same | same | yes |
| success_at_cost | s0 failure/near_miss + s1 any success; s1 s@c/near_miss | s1 success effects (+ s0 bond −0.05 / rep −0.02 on the s0-failure route; nets stay positive: bond +0.07/+0.05, rep +0.04) | same three | yes, net |
| failure | any s0 except crit-fail + s1 failure | s1 failure: bond −, rep −, relocation (+ s0 penalties) | rep loss, claimant blame, travelling away | yes |
| critical_failure | (a) s0 crit-fail; (b) s1 crit-fail | (a) s0 bond −0.05, rep −0.02 only; (b) s1 failure effects incl. relocation | rep loss, claimant blame (no road) | yes on both routes |

The draft got the hard case right: the critical_failure band claims no road, because route (a) never reaches step 1's relocation. On route (b) the relocation fires unchipped, which is lawful (Law 56 forbids a false chip, not an unreported write).

## 1. Prose Quality

The opening is the skeleton done plainly: arrival, a war-dead son, a man claiming to be him, the widow's yes and the uncle's no, then the court's day and the plea. The steps read as narrator mode throughout, and no sentence is camera work or interior sensation. Weak passages:

- Opening P2, "says impostor." This is telegraphic and needs a second read. → "says he is an impostor." To hold the budget, "ready or not" comes out of P3; "sits in three days" already states the clock. Final count is 78 (urban) / 77 (rural).
- Step-1 spine, "like the name of the son's old nurse." The nurse is *Deepen His Sleep*'s payoff ("called for the son's old nurse by a pet name"), so when that card lands the spine repeats it at the seam. It also states as a fact what the man knows after a step-0 failure ("he could not name his own horse"). [EDITORIAL REWRITE] "Anyone in the house could have taught the man what he knows." This reads true after every step-0 band.
- Step-1 spine, "{cast:steward} keeps…". The steward was "the steward" for the whole of step 0 and then appears by name with no join. [EDITORIAL REWRITE] "The steward, {cast:steward}, keeps…" (the easter-reckoning form: "The dean, {cast:dean}, keeps the tables").
- Step-0 s@c afterimage: "the uncle heard {actor} had questioned him all night and called the master bought." Hard questioning is no evidence of a bribe, so the logic fails. [EDITORIAL REWRITE] "…but {actor} heard them in the widow's own chamber, and the uncle called the master bought."
- Step-1 crit afterimage: "only the son could remember it." The "it" has no clear antecedent. The second sentence ("{cast:steward} wrote the finding down that night") is told again by the crit overview ("The steward has written the finding into the manor rolls"). [EDITORIAL REWRITE] One sentence: "{actor} sorted what the man was told from what he remembered, and what he remembered only the son could know."
- *Wake A Conscience* near_miss / failure: "The maid admitted it to the widow". Only one fragment shows per band, so this "maid" has no introduction and "it" has no antecedent. Fixed as "The widow's maid…" with the object stated.
- *Uncover Old Letters* failure: "the war had changed the man's hand past matching". "Past matching" is writerly. It also echoes step 0's failure afterimage ("War had changed his face and hands too much to read") on a fail-then-fail run. Rewritten.
- Cold factor line, "his mother's tears". No tears are established in the scene; the widow only says he is her boy. Changed to "hope".

## 2. Branch Seduction Audit

Linear: there are no branches to audit. The mortal's choices live in the aftermath reactions (§ 13 below). No step asks the player to pick a branch or an ending.

## 3. Branch Count Assessment

KEEP 0. Linear two-step plus the appointment, which is a seed, not a fork.

## 4. Scale Discipline Check

Medium, two beats plus a placed and timed sequel. "Read the man, then read the house" is the honest size. Who holds a manor is settlement scale (the scale die); the template field stays `local` per the brief.

## 5. Inspiration Anchor Honesty

Honest. The scar recognition from the Odyssey shows up literally: the scar on his chin at step 0 crit, and the boyhood scar mistaken for a war wound at step 0 crit-fail. The impostor-heir tradition shows up as the coached-servant question at step 1. The anti-patterns the draft names are avoided: the maid only appears behind the step-1 roll.

## 6. Aftermath Payoff

Lands, and it is actor-centred. The appointment makes the success side open onto a real next scene, and the failure side costs the master their name and their place in the town without hurting their body. One soft spot is design-lane, not prose: `success_at_cost` has no backed cost of its own. Its chips are identical to `success`, and the uncle's charge lives only in prose. This is lawful (no chip claims the charge), but thin against the brief's "the master carries something for it". See Consider.

## 6b. Page read (THR-1474), as assembled, before edits

**critical_success**
> The steward has written the finding into the manor rolls, and the widow has asked {actor} to stand beside her son in court.
> - BOND · reputation with {location}: Read the man true — {location} thinks well of {actor} now.
> - BOND · reputation: Named him the son — {cast:claimant} trusts {actor} now.
> - PATH · appointment: Court day — {cast:steward} hears the finding sworn in {location} in three days.
> > Sit with the son at his mother's table — The mortal eats with the family on the night before the court sits. The son will remember who sat with him.
> > Keep the finding for the court — The mortal says not a word of it until the hearing. The town will respect a reader who keeps quiet.

The page is clean. One verbosity issue: the second reaction says the same thing twice ("says not a word" / "keeps quiet"). [EDITORIAL REWRITE] "The mortal tells no one what the finding is until the hearing. The town will respect the discretion."

**success**
> The finding names the man as the lord's son, and it is in the steward's hands.
> - … Named him the son — {cast:claimant} trusts {actor} now. …

**Repetition (trigger 35).** "The finding names the man as the lord's son" and "Named him the son" tell one fact twice. The step-1 success afterimage just before the page ends "The finding is that he is the lord's son": the same fact a third time, across the seam (trigger 22). Fix: the afterimage stops at the evidence, the overview carries a new fact, and the chip names the son.

**success_at_cost**
> The finding names the man as the lord's son, and the uncle tells the whole manor the widow bought it.
> - same three chips

**Repetition (trigger 35).** Same pair as success. Seam echo on the step-1 s@c route: the afterimage "the uncle swore in the hall that the widow had paid {actor} for it" is followed at once by the overview "the uncle tells the whole manor the widow bought it". That is the same charge twice in a row. Fix: the afterimage carries a different cost (the uncle will fight the finding in court, which sets up the kept sequel), and the overview keeps the charge.

**failure**
> The court will sit with no finding before it, and the uncle keeps the manor. The steward sent for a master to settle the claim, and {actor} could not.
> - SCAR · reputation with {location}: Read him and could not say — {location} thinks less of {actor} now.
> - BOND · reputation: Left him unread — {cast:claimant} blames {actor} now.
> - PATH · seed: The uncle's order — {actor} is travelling away from {location} now.

**Repetition (trigger 35).** "{actor} could not", "Read him and could not say" and "Left him unread" tell one fact three times. The step-1 failure afterimage also ends "With no finding to swear to", which echoes the overview's "no finding" at the seam. Fix: the overview's second sentence gives the claimant's new position (only his mother's word). Each chip cause names a different source: the manor's talk, his reader failing him, the uncle's order. The afterimage ends on the road, not on "no finding".

**critical_failure**
> The whole household watched {actor} misread the man. The steward sent for a master and got a laughing-stock, and the manor will send for someone else next time.
> - SCAR · reputation with {location}: Laughed at in the hall — {location} thinks less of {actor} now.
> - BOND · reputation: Doubted before his mother — {cast:claimant} blames {actor} now.

**Repetition (trigger 35).** "laughing-stock" and "Laughed at in the hall" are one fact. On route (b) the step-1 afterimage has already said "The hall laughed at {actor}'s reading", so the page tells it a third time.
**Conflict.** "Doubted before his mother" is true on route (a): the master called the son's scar a war wound. It is false on route (b): the master's reading was *for* the man and was laughed at when he could not answer the uncle. That is not doubt.
**Seam echo.** Both routes' afterimages show the misreading happening before the hall, and the overview then opens "The whole household watched {actor} misread the man."
The sentence "the manor will send for someone else next time" also promises later world behaviour that no effect performs. The reputation loss stands in for it only loosely (trigger 34 is borderline here).
Fix: the overview gives the consequence, as easter-reckoning's crit-fail does ("The dean now has a master's own error…"): "The uncle now has a master's own error to hold up in court against the man." This is true on both routes and explains the claimant's blame. Chip causes: "Talk of the household" and "Misread before his mother" (true on both routes).

## 7. Dilemma Energy

Good. Mother against uncle, and a man nobody can be sure of. The Cold/Warm variant prices the pull of the widow's hope. Both reaction pairs are real stances: success is loyalty to the person against discretion for the institution; failure is honesty to the man against honesty to the next reader.

## 8. Experience Differentiator Gate

1. Opening follows the skeleton, ≤80 words, real names, facts stated: **YES.** Arrival, events, plea; 78 / 77 after edit.
2. Every sentence does challenge, test or outcome work: **YES**. "Ready or not" was the one decorative phrase, now cut.
3. Scene prose names what the hand acts on: **YES.** Scars and memory (step 0); the steward's old letters and anyone in the house who could have coached him (step 1).
4. A player could retell situation and stakes after one read: **YES.**
4b. No seam echoes: **YES after revision.** Six found and fixed: the nurse at s0 band → s1 spine; s1 success afterimage → overview; s1 s@c afterimage → overview; s1 crit afterimage → crit overview; s1 failure afterimage → overview; the "boyhood scar" fragment of *Show The Scars* doubling the crit afterimage's chin scar inside one band.
5. Card faces spell-style, nothing scene-bespoke: **YES.** Show The Scars / Deepen His Sleep / Wake A Conscience / Uncover Old Letters. Imperative verb plus noun, no flavor quote.
6. Effect lines state mechanism; prices real: **YES.** No effect line repeats a word of its name (checked: shirt/wound, dark/dreaming, trouble/coached, bundle/handwriting); no digits; essence 2/1/2/2.
7. Every card pays off in failure: **YES.** Each has a `failure` fragment; Deepen His Sleep and Uncover Old Letters also cover `critical_failure`. None is big-delta (max 0.10).
8. Every card is grounded before the hand is dealt: **YES.**
9. Cards answer different questions: **YES.** Body evidence, unguarded memory, who coached him, the handwriting.
9b. Composed 4–8 hands: **YES.** 2 specials + `deal` 3 per step; no branch or ending pick.
10. Reflective prose landing: **YES.**
11. Actor-centred, nouns from the character sheet: **YES.** `reputation with {location}`, `reputation` (+ claimant concept), `appointment` (`$appointment`), `seed` (the `assize-letter` precedent for relocation).
11b. Every band's page reads clean: **YES after revision.** NO on the draft; see § 6b.
12. Medium: reaction choices: **YES.**
13. Reactions are stances: **YES.**
14. Art direction evocative: **YES.** Residue only: a torn shirt, unopened letters, an empty chair, no people.

## Stakes, description, detectors

- Stakes are bare phrases ≤60 chars with no tokens, and `risk` = `lostBadly` = the worst ending. `lost` read "found nothing to swear to…": "nothing" is an outcome-class natural indefinite, and stakes are written from the endings. → "reached no finding and was sent off the manor".
- `narrativeTemplates.success` promised the court "hears it sworn" before the appointment is kept. → "is to be sworn".
- Vagueness sweep of every outcome-class field after edits: no someone / something / nothing / anything / thing / way / whatever. "anyone" and "no one" are not in the lexicon. There are no annotation clauses ("not … but" within a sentence, or an em-dash followed by "not"), so the budget of one holds. No divine outcome-authorship. No digits or `%` on mortal-facing surfaces. "Three days" is in words.
- All chips ≤15 words (cause + detail), longest 12.

## Sequels

Both read in register with easter-reckoning's pair. **Sworn**: place and time named lawfully (kept branch), the uncle's side questions the finding, and success hands the manor to the son. **Defaulted**: names no place, the regard write targets the claimant, and the man comes looking for the master who stayed away. Effects back every afterimage claim ("says so to anyone who will listen" ↔ `reputation_with` the claimant). No edits.

## Exact edit list (apply to `returned-heir.package.json` verbatim)

1. `template.steps[0].narrativeTemplate`: "The uncle, who holds the manor now, says impostor." → "The uncle, who holds the manor now, says he is an impostor."
2. `template.steps[0].narrativeTemplate`: "The manor court sits in three days, ready or not." → "The manor court sits in three days."
3. `template.steps[0].nudges[heir.show_the_scars].bandProse.critical_success`: "His shirt tore on a nail, and the hall saw the boyhood scar the widow had described." → "His shirt tore on a nail, and the hall saw the old burn on his back that the widow had described."
4. `template.steps[0].nudges[heir.show_the_scars].bandProse.success`: "His shirt tore, and under it was the boyhood scar the widow had described." → "His shirt tore, and on his back was the old burn the widow had described."
5. `template.steps[0].successAtCostAfterimage`: "He told the old stories well, but the uncle heard {actor} had questioned him all night and called the master bought." → "He told the old stories well, but {actor} heard them in the widow's own chamber, and the uncle called the master bought."
6. `template.steps[1].narrativeTemplate`: "The man knows things only the family should know, like the name of the son's old nurse. Someone in the house could have taught him. {cast:steward} keeps the manor's old letters, and every servant answers to him." → "Anyone in the house could have taught the man what he knows. The steward, {cast:steward}, keeps the manor's old letters, and every servant answers to him."
7. `template.steps[1].criticalSuccessAfterimage`: "{actor} sorted all he knew into what he was told and what he remembered, and only the son could remember it. {cast:steward} wrote the finding down that night." → "{actor} sorted what the man was told from what he remembered, and what he remembered only the son could know."
8. `template.steps[1].successAfterimage`: "{actor} found who had told him the recent news, and he knew the old stories himself. The finding is that he is the lord's son." → "{actor} found who had told him the recent news, and he knew the old stories himself."
9. `template.steps[1].successAtCostAfterimage`: "The finding is that he is the lord's son, but the uncle swore in the hall that the widow had paid {actor} for it." → "The finding stands, but the uncle has sworn to break it before the court."
10. `template.steps[1].failureAfterimage`: "{actor} could not tell what the man remembered from what he had been told. With no finding to swear to, the uncle had {actor} shown off the manor." → "{actor} could not tell what the man remembered from what he had been told, and the uncle had {actor} shown the road."
11. `template.steps[1].nudges[heir.wake_a_conscience].bandProse.near_miss`: "The maid admitted it to the widow, who kept it to herself until court day was close." → "The widow's maid admitted to her mistress what she had told him, and the widow kept it from {actor}."
12. `template.steps[1].nudges[heir.wake_a_conscience].bandProse.failure`: "The maid cried in the kitchen all night and told no one why." → "The widow's maid cried in the kitchen all night and told no one why."
13. `template.steps[1].nudges[heir.uncover_old_letters].bandProse.failure`: "The letters turned up, but the war had changed the man's hand past matching." → "The letters turned up, but the man's hand matched them only here and there."
14. `template.traitVariants[0].factorLine` (trait.core.core_warmth.vice): "Being Cold, they read the man and not his mother's tears." → "Being Cold, they read the man and not his mother's hope."
15. `template.stakes.lost`: "found nothing to swear to and was sent off the manor" → "reached no finding and was sent off the manor"
16. `template.narrativeTemplates.success`: "The finding names the man as the lord's son, and the manor court hears it sworn on court day." → "The finding names the man as the lord's son, and is to be sworn before the manor court on court day."
17. `template.aftermathConfig.fallback.reactions[heir.keep_it_for_the_court].intent`: "The mortal says not a word of it until the hearing. The town will respect a reader who keeps quiet." → "The mortal tells no one what the finding is until the hearing. The town will respect the discretion."
18. `template.aftermathConfig.fallback.byOutcome.success.overview`: "The finding names the man as the lord's son, and it is in the steward's hands." → "The steward has the finding in writing, and the manor's servants already call the man the young lord."
19. `template.aftermathConfig.fallback.byOutcome.success_at_cost.overview`: "The finding names the man as the lord's son, and the uncle tells the whole manor the widow bought it." → "The steward has the finding in writing, and the uncle tells the whole manor the widow bought it."
20. `template.aftermathConfig.fallback.byOutcome.failure.overview`: "The court will sit with no finding before it, and the uncle keeps the manor. The steward sent for a master to settle the claim, and {actor} could not." → "The court will sit with no finding before it, and the uncle keeps the manor. The man will face the court with only his mother's word."
21. `template.aftermathConfig.fallback.byOutcome.failure.changes[heir.lost.town_regard].causeClause`: "Read him and could not say" → "The manor's talk"
22. `template.aftermathConfig.fallback.byOutcome.failure.changes[heir.lost.claimant_blame].causeClause`: "Left him unread" → "His reader failed him"
23. `template.aftermathConfig.fallback.byOutcome.critical_failure.overview`: "The whole household watched {actor} misread the man. The steward sent for a master and got a laughing-stock, and the manor will send for someone else next time." → "The uncle now has a master's own error to hold up in court against the man."
24. `template.aftermathConfig.fallback.byOutcome.critical_failure.changes[heir.broke.town_regard].causeClause`: "Laughed at in the hall" → "Talk of the household"
25. `template.aftermathConfig.fallback.byOutcome.critical_failure.changes[heir.broke.claimant_blame].causeClause`: "Doubted before his mother" → "Misread before his mother"

No edits to `returned-heir-sequels.ts`. No effect, difficulty, card mechanic, id or chip noun changes.

## Revision Summary

**Must fix (applied):** edits 6–10, 18–25 (trigger 22 seam echoes, trigger 35 page repetitions, the route-(b) conflict on the crit-fail bond chip).
**Should fix (applied):** edits 1–5, 11–17 (opening clarity, the bribe logic, scar/burn doubling, the maid's introduction, the stakes and success-template wording, reaction verbosity, the uninvented tears).
**Consider (systems lane, not applied):**
- `success_at_cost` has no state-backed cost of its own; the uncle is not cast. A third-system write (e.g. a small `reputation_with $here` debit on step-1 `success_at_cost`) cannot key on a step band today without engine support. Leave as is unless the systems pass finds a lawful band-keyed write.
- On crit-fail route (a) the action ends at step 0, before `{cast:steward}` is named anywhere. The "Leave the notes with the steward" reaction writes `bond_change` with `$cast:steward`, so the systems pass should confirm the lazy-materialized steward is bound on that route. Otherwise the reaction silently writes nothing.
- The PATH appointment chip's "in three days" restates the opening's clock. This is acceptable and matches easter-reckoning.

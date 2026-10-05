# Encounter Pipeline: The Granary Riot
> Scale: medium | Slug: granary-riot | Pass: final
> Date: 2026-10-05 | Pipeline version: 2.0
> Status: **READY FOR IMPLEMENTATION**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | Heart danger → confrontation: hold a hungry crowd back from the abbey granary's gate, then rule on the grain before crowd and cellarer. The hand is relationship + story_seed. |
| Editorial | PASS WITH REVISIONS (loop 2) | Loop 1 sent the draft back over band-page repetition and conflict and over seam echoes. Loop 2 fixed the rest inline: the s@c overview, the critical_failure overclaim, the step-0 seam words, and the success reaction label. |
| Systems | READY FOR IMPLEMENTATION | Every id, field, role, tag and trait was verified against `src/`. Every chip holds on every route, including after the reactions. Five fixes were applied inline (below). No missing primitives. |

### Caveats / Blockers

None blocking. One limitation is accepted: the `#watch_errand` sequel is a `query` seed, so it withers (it fires the withered narrative instead) if the mortal is outside a town, city or capital (or a hamlet, for one member) when it ripens 48 ticks later. The chip now claims only that word of the ruling reaches the watch.

### Systems fixes applied in this file

| # | Where | Change | Why |
|---|---|---|---|
| S1 | § 15, Work From the Watch | detail "Word of the ruling will bring {actor} work from a town watch." → **"Word of {actor}'s ruling reaches a town watch."** It also gets a `{actor}` → `$actor` concept anchor. | A query seed can wither, so the chip may not promise delivery. A seed chip anchors through its carrier. |
| S2 | § 13, critical_failure overview | "…and {location}'s next harvest will be small." cut | Prose rule 7b: no effect writes the town's next harvest, and a `place` write cannot be keyed to this band alone. |
| S3 | § 13, success_at_cost overview | "The abbey will sow fewer fields this spring." → **"The abbey has less seed left than it wanted."** | Rule 7b: a future act with no effect behind it. |
| S4 | § 13, critical_success overview | "sells … keeps" → **"sold … kept"** | Rule 7b (minor): the present habitual read as a standing arrangement the world keeps. |
| S5 | § 15, person bond chips | The chip points at the person through a `concepts` entry (`{cast:speaker}` / `{cast:cellarer}` → `$cast:<key>`, `visualKind: 'agent'`) beside the `trusts`/`doubts` concept; the stateNoun stays plain `reputation` with its tooltip and **no** `entityId` | Law 56 clause 2: the chip points at the person it is about. *Implementation amendment:* the systems pass first put the cast anchor on `stateNoun.entityId`; `check:encounter` fails that shape (THR-1472: a stateNoun anchored on its carrier rather than a state object), so the anchor moved to `concepts` — the `tithe-barn-raid` / `feud-mediation` shape. The plain `reputation` text still avoids `{target}` (THR-1685). |

### Editorial Notes Summary

Loop 1 (REVISE): the opening had bread "not for sale" against bread doubled in price. The danger act was passive and is now {actor}'s. The carryovers restated the step-0 afterimages, and were rewritten to say what step 0 means for the ruling; the unreachable crit_fail carryover was dropped. Success-side chip cause clauses were stripped. Repetition and conflict on the band pages were cleared, and four overviews were rewritten. Loop 2 (PASS WITH REVISIONS): the s@c overview was de-garbled. The critical_failure premise overclaim and the "another" echo were removed. The "street", "ruling" and "front"/"most" seams on step 0 were cleared. The success reaction was relabelled "Stay until the last sack leaves" with an intent that holds when the grain was sold. The self-audit word count was set to the gate's 78. No mechanical change in either loop.

### Implementation File Map

Only the compiled set. `Docs/plans/encounters/granary-riot.package.json` compiles through `compile:encounter` into `src/data/encounters/granary-riot.ts`, `src/data/encounters/__tests__/granary-riot.test.ts` and both registrations. Gate it with `check:encounter -- --package` before compiling (#1114). Beyond the compiled set:

- concept art per § 17;
- a `src/data/content-eval/plotHooks.ts` `usedBy` stamp for `hook.civil_unrest` at closeout (orchestrator);
- regenerated census and coverage artifacts.

There are no engine, type or support-bundle edits.

**Package must-carries:**

- `intrinsicTier: 'shaping'` and `scale: 'local'`.
- The seed is `{ kind: 'encounter_seed', query: { kind: 'encounter_template', tags: ['#watch_errand'] }, targetAgentId: '$actor', delayTicks: 48, priority: 0.8, seedLabel }`, with no `inheritContext`.
- The success-side reactions go on `fallback.reactions`. The failure-side pair goes on **both** `byOutcome.failure.reactions` and `byOutcome.critical_failure.reactions`. Band reactions replace the fallback's; they do not merge (`applyAftermathOutcomeBand`).
- "Side with the abbey" may carry `trustDelta` on the cellarer only if it is ≤ +0.04.
- The specials (Whisper / Boost / Omen in shorthand) are plain `StepNudge`s with `sphere` set and no `libraryCardId`. Never `card.boost.core` or `card.compulsion.signature.mind`.
- The trait card is `id: 'granary.open_closed_hands'` with `requiredTrait` set, and the Warm variant names it in `addNudgeIds` (the `hired-knives` shape).

Full audit: `Docs/plans/encounters/granary-riot-systems.md`.

---

## Encounter Packet

> Template: `encounter.town.granary_riot` · Batch: master-everyday, slot 3 (THR-1688) · Brief: `Docs/plans/encounters/master-everyday-brief.md`
> Source: `granary-riot-revised.md` (editorial loop 2), with the systems fixes S1–S5 applied inline and marked *[systems S#]*.

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A hungry crowd is forcing the abbey granary's gate, and both the crowd and the abbey ask {actor} to rule how much grain leaves it. |
| Title | **The Granary Riot**, the complication in three words. |
| Shape | Danger – Confrontation – Aftermath. heart 0.76 (`continue_weakened`) → heart 0.80 (`fail_action`). Linear, branch count 0. Mean 0.78, window fit 0.92 (master). |
| Setting | `urban` only. The rolled `sacred` is overridden by the brief; it survives as the abbey granary inside the town. |
| Stake (P3) | plea (rolled): {cast:speaker} speaks for a crowd in trouble and asks for a ruling. |
| Opposition | beast (territory), read as people (brief override): a frightened crowd guarding what it thinks is its own. |
| Disposition | open: the crowd wants a ruling, not a fight. |
| Agent role | judge asked to rule (rolled). |
| Scale | settlement: the town's bread for the winter and the abbey's seed for the spring. `scale: 'local'`. |
| System target | cards (rolled): two specials per step, and a trait card on step 1. |
| Plot hook | rolled `hook.civil_unrest`, `hook.relic_awakening`, `hook.the_great_building` · **taken `hook.civil_unrest`**: a town turning on its own institution over bread. |
| Consequence hand (binding) | `relationship` + `story_seed`. No swap. relationship = `bond_change` with `$cast:speaker` and `$cast:cellarer` on both sides of step 1, and with `$cast:cellarer` on step 0 failure. story_seed = a placeless `encounter_seed` with `query: { kind: 'encounter_template', tags: ['#watch_errand'] }` on step 1 success. |
| Standing | `reputation_with $here` +0.06 on step 1 success, −0.06 on step 1 failure, −0.02 on step 0 failure (backs the critical_failure chip on both routes). |
| Cast | `speaker` (the crowd's speaker, must-persist) and `cellarer` (the abbey monk who keeps the granary key, must-persist). The abbot is an off-stage role noun. |
| Systems | cast · seeds · reputation · rewards (persistent bond/standing writes) = 4. |
| Mortal choice | None in the steps: this is a test of Heart. The stance lives in the aftermath reactions. |
| Tone | Ends warm on the success side: the crowd goes home with bread and the abbey keeps its seed. |
| Cool failure | Nobody dies, is jailed or is branded. Failure costs the master their name: the town sent for a judge whose word ends quarrels, and neither side took it. |
| Cost channels | All specials are priced in essence except the trait card (cost 0, paid for by being Warm). No Heavy Hand, no rider, no grants. |
| Expert collision | The Heart experts are `feud_mediation` (make peace between two houses) and `inheritance_wake` (settle a will). This verb is *hold back a crowd, then apportion a store*: crowd control and rationing, not reconciliation. |

## 1. Inspiration Anchors

- **Event — Civil Unrest** (taken hook): a town turning on one of its own institutions. It contributed the crowd at the gate and the two cast, one voice for the street and one for the abbey.
- **Event — The Great Building** (rolled, not taken): survives only as the question underneath it, who decides and whose labour pays. Here: whose winter pays for whose spring.
- **Event — The Relic Awakening** (rolled, not taken): dropped. A relic in a granary would turn an everyday job into an uncanny one.
- Anti-patterns avoided: the crowd as a mob of villains (they are hungry and frightened, and the speaker is reasonable); the abbey as a miser (the grain really is next year's seed); a fight gate (the danger step is held with words and nerve, never steel).

## 2. Scale Justification

Medium: two beats, the danger and the ruling, at master rarity. The outcome touches a whole town's winter and an abbey's next harvest, which is what a master should be sent for. Medium owes reaction choices.

## 3. Pressure Knot

Bread doubled in price overnight. A crowd has come to the abbey granary, where the town knows grain is stored, and is pushing on the gate. Two people are already hurt. The abbot has ordered the gate kept shut because the grain is the abbey's seed. The crowd's speaker and the abbey's cellarer have both asked for the same visiting judge.

## 4. Intervention Fantasy

The god watches one person stand between a hungry town and a full granary. The hand reaches into the crowd's panic (mind), the gate itself (force), a hard winter the town remembers (time), and the mortal's own care for others (the Warm trait card). None of it tells the mortal what share to name.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | protagonist; asked by both sides to rule |
| `{cast:speaker}` | actor, must-persist | speaks for the crowd; reuse `smith` / `innkeeper`, spawn `smith`, spawnName **Wynn Halloway**, supportRole `granary_crowd_speaker` |
| `{cast:cellarer}` | actor, must-persist | the abbey monk who keeps the granary key; reuse `priest`, spawn `monk`, spawnName **Osric Vane**, supportRole `abbey_cellarer` |
| the abbot | role noun | ordered the gate shut; never on stage |
| `{location}` (`$here`) | location | the town; carries the standing edge |
| the abbey granary, its gate and bar | scene fiction | the step-0 target; never chipped |
| the town watch | family tag `#watch_errand` | the seed's query |

## 6. Beat Structure

1. **Hold back the crowd** (heart 0.76, `continue_weakened`). The danger: the crowd is pushing at the gate. The mortal must talk the front rows into stepping back before the gate gives. A plain failure lets the crowd carry sacks out before it is turned back. A critical failure breaks the gate and ends the action.
2. **Rule on the grain** (heart 0.80, `fail_action`). The confrontation: before the abbey and the crowd, the mortal must name a share of the grain both sides accept. Success opens the gate on the mortal's terms; failure locks it.

## 7. Branching Profile

Linear, no branching. Branch count 0.

## 8. Branching Map

N/A: linear encounter.

## 9. Outcome Ladder

| Band | Route | Progress | Spent | Burden / opening |
|---|---|---|---|---|
| critical_success | both steps clean, one critical | the town fed, the seed kept, both sides trust the judge | nothing | watch seed; standing up |
| success | both steps clean | the town fed, the seed kept | a hard day | watch seed; standing up |
| success_at_cost | step 0 failed or near-missed, or step 1 at cost | the ruling holds | sacks lost at the gate, or more seed than the abbey wanted | watch seed; standing up net |
| failure | step 1 failed | nothing | the master's word | both sides trust them less; standing down |
| critical_failure | step 0 or step 1 critical failure | nothing | the abbey's seed grain | the cellarer trusts them less; standing down |

## 10. Sample Opening

**Opening (urban):**
> {actor} arrives at {location} in the morning.

**Spine (step 0 narrative):**
> Bread doubled in price overnight. A crowd is pushing at the abbey granary's gate, and two people are already hurt. The abbot will not open it. The grain inside is the abbey's seed for next year.
>
> {cast:speaker} speaks for the crowd, and the abbey's cellarer for the abbey. Both ask {actor} to rule how much grain leaves the granary. First {actor} must talk the crowd back before the gate gives.

Word count: 7 + 36 + 34 = 77 by hand (the gate tokenizer counts 78), within the limit of 80.

## 11. The Hand Per Step

### Step 0 — Hold back the crowd (heart 0.76) · purpose "Hold back the crowd"
`deal: { count: 3, tags: ['presence', 'peril'] }`

**Afterimages**
- critical_success: "The crowd stepped back from the gate and sat down to wait."
- success: "The crowd stepped back from the gate and fell quiet."
- success_at_cost: "The crowd stepped back, but not before the gate bar cracked under their weight."
- failure: "The crowd forced the gate and carried sacks out before {cast:speaker} turned them back."
- critical_failure: "The crowd broke the gate down and poured into the granary."

Failure metadata: `bond_change $cast:cellarer` sentiment −0.06, trust −0.06 · `reputation_with $here −0.02`.

**Specials**
1. **Calm Frightened People**: Whisper (mind) · essence 2 · Δ 0.10 · `generic.crowd`
   effectLine: "Take the panic out of a crowd, so those at the front stop pushing and start to listen."
   - critical_success: "The pushing stopped at the front first, and then all the way back to the street."
   - success: "The people at the front stopped pushing and turned to listen."
   - near_miss: "The front of the crowd grew calm, but the back kept pushing for a while."
   - failure: "The people at the front grew calm, and the people behind pushed them into the gate anyway."
2. **Hold The Gate**: Boost (force) · essence 2 · Δ 0.08 · `generic.ward`
   effectLine: "Make a door or bar bear far more weight than it was built for, so it stands a while longer."
   - success: "The gate bar bowed under the crowd's weight and did not break."
   - success_at_cost: "The hinges held the gate shut after the bar gave way."
   - failure: "The bar held, and the hinges tore out of the wall instead."
   - critical_failure: "The gate held until it fell flat into the yard all at once."

*Implementation note [systems]: "Whisper", "Boost" and "Omen" are type shorthand. Author the specials as plain `StepNudge`s with `sphere` set and no `libraryCardId`.*

### Step 1 — Rule on the grain (heart 0.80) · purpose "Rule on the grain"
`deal: { count: 3, tags: ['presence', 'social'] }`

**Spine:**
> Now {actor} must rule, in front of the crowd and the abbey. {cast:cellarer} holds the granary key, and says every sack given away now is a field unsown next spring. The crowd's speaker says the town will not reach spring without bread. The ruling has to be one both sides accept.

**Carryover (from step 0):** crit "The crowd trusts {actor} to be fair." (+0.06) · success "The crowd is willing to hear {actor} out." (+0.04) · s@c "The cellarer is angry about the damage to the gate." (−0.02) · near_miss "The crowd stepped back late, and is still angry." (−0.03) · failure "The abbey is already short of seed, and angry about it." (−0.05) · *(no crit_fail carryover: a step-0 critical failure ends the action, so step 1 never runs)*

**Afterimages**
- critical_success: "Both sides took the ruling. The cellarer opened the gate, and the crowd cheered {actor}."
- success: "Both sides took the ruling, and the cellarer opened the gate."
- success_at_cost: "Both sides took the ruling, but the cellarer argued over every sack."
- failure: "Neither side would take the ruling. The cellarer locked the gate, and the crowd went home hungry."
- critical_failure: "Neither side would take the ruling, and the crowd broke into the granary."

Success metadata: `bond_change $cast:speaker` sentiment +0.12, trust +0.1 · `bond_change $cast:cellarer` sentiment +0.12, trust +0.1 · `encounter_seed query #watch_errand` (targetAgentId `$actor`, delay 48, priority 0.8, seedLabel "A town watch has heard how {actor} settled the granary, and has work for them.") · `reputation_with $here +0.06`.
Failure metadata: `bond_change $cast:speaker` sentiment −0.12, trust −0.1 · `bond_change $cast:cellarer` sentiment −0.1, trust −0.1 · `reputation_with $here −0.06`.

**Specials**
1. **Remember Lean Years**: Omen (time) · essence 2 · Δ 0.10 · `generic.memory`
   effectLine: "Bring back a hungry winter everyone listening lived through, so they weigh tomorrow's hunger against today's."
   - critical_success: "Old people in the crowd spoke of the spring the seed was eaten, and the young ones listened."
   - success: "An old weaver in the crowd remembered the spring with no seed to sow, and said so."
   - success_at_cost: "The crowd remembered the lean spring, but only the old ones would settle for less."
   - near_miss: "The crowd remembered the hungry winter, but only after it had refused the first ruling."
   - failure: "The crowd remembered a hungry winter, and judged this one worse."
   - critical_failure: "The crowd remembered the last hungry winter, and would not wait to starve through another."
2. **Open Closed Hands**: Trait card (Warm) · `id: 'granary.open_closed_hands'` · `requiredTrait: trait.core.core_warmth.virtue` · essence 0 · Δ 0.08 · `generic.warmth`
   effectLine: "Wake their care for others, so everyone listening believes they mind who goes hungry, and each side gives a little."
   - success: "{actor} spoke as one who cares who eats, and the crowd believed it."
   - failure: "{actor} plainly cared who ate, and the cellarer called that soft."

## 12. Linear continuation

> Now {actor} must rule, in front of the crowd and the abbey. {cast:cellarer} holds the granary key, and says every sack given away now is a field unsown next spring. The crowd's speaker says the town will not reach spring without bread. The ruling has to be one both sides accept.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The abbey sold the share {actor} named at last year's price and kept the rest for seed. The abbot came out to thank {actor} in front of the town." *[systems S4: was "sells … keeps"]*
- **success:** "{cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring."
- **success_at_cost:** "{cast:speaker} led the crowd home with bread. The abbey has less seed left than it wanted." *[systems S3: was "The abbey will sow fewer fields this spring."]*
- **failure:** "Bread is still dear in {location}. People send for a master because a master's word ends quarrels. This quarrel is still going."
- **critical_failure:** "The abbey has lost most of its seed for the spring. Both sides asked {actor} to settle this, and both have lost by it." *[systems S2: was "…most of next spring's seed, and {location}'s next harvest will be small."]*
- **fallback:** "The yard empties, and {location} counts what the granary gave."

## 13b. Narrative templates (chronicle lines)

- **initiation:** "A hungry crowd is at the abbey granary gate, and both sides send for a judge to rule on the grain."
- **success:** "The ruling held, and the granary gave the town bread without giving up the seed."
- **failure:** "The ruling failed, and the granary stayed shut against a hungry town."

## 14. Aftermath Reaction Choices

Success side (`fallback.reactions`, inherited by the three success bands):
- **Stay until the last sack leaves**: "The mortal stays at the granary until the last sack of the share has gone, and the town hears of it." → `reputation_with $here +0.03`.
- **Sup at the abbey's table**: "The mortal eats at the abbey's table that night. The cellarer will remember the company." → `bond_change $cast:cellarer +0.04`.

Failure side (authored explicitly on **both** `byOutcome.failure.reactions` and `byOutcome.critical_failure.reactions`, since band reactions replace the fallback's). Magnitudes are held at ±0.04 so no band chip is contradicted after either pick:
- **Side with the crowd**: "The mortal says the town's hunger mattered more than the abbey's seed. The crowd's speaker will remember it kindly, and the cellarer will not." → `bond_change $cast:speaker +0.04`, `bond_change $cast:cellarer −0.04`.
- **Side with the abbey**: "The mortal backs the abbey: the seed should have been kept, whatever the town thinks. The cellarer is grateful; the crowd's speaker is not." → `bond_change $cast:cellarer +0.04` (any `trustDelta` ≤ +0.04), `bond_change $cast:speaker −0.04`.

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | The Town's Thanks: "{location} thinks better of {actor} now." | reputation / bond / gain | `reputation with {location}` (`entityId: '$here'`, `visualKind: 'location'`, tooltip `ui.reputation_with`) | step 1 success `reputation_with +0.06` (net +0.04 after a step-0 failure) |
| crit / success / s@c | The Crowd's Trust: "{cast:speaker} trusts {actor} now." | reputation / bond / gain | `reputation` (tooltip `ui.reputation_with`; concept `{cast:speaker}` → `$cast:speaker`) *[systems S5]* | step 1 success `bond_change $cast:speaker` |
| crit / success / s@c | The Abbey's Trust: "{cast:cellarer} trusts {actor}'s judgment now." | reputation / bond / gain | `reputation` (tooltip `ui.reputation_with`; concept `{cast:cellarer}` → `$cast:cellarer`) *[systems S5]* | step 1 success `bond_change $cast:cellarer` (net +0.06 after a step-0 failure) |
| crit / success / s@c | Work From the Watch: "Word of {actor}'s ruling reaches a town watch." *[systems S1: was "Word of the ruling will bring {actor} work from a town watch."]* | future_hook / path / opens | `seed` (tooltip `ui.aftermath_seed`) + concept `{actor}` → `$actor`, `visualKind: 'agent'` | step 1 success `encounter_seed` |
| failure | Ruling Refused: "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` (`$here`, `location`) | step 1 failure −0.06 |
| failure | The Crowd's Doubt: "{cast:speaker} trusts {actor} less now." | reputation / bond / loss | `reputation` (concept `{cast:speaker}` → `$cast:speaker`) *[systems S5]* | step 1 failure `bond_change $cast:speaker` |
| failure | The Abbey's Doubt: "{cast:cellarer} doubts {actor}'s judgment now." | reputation / bond / loss | `reputation` (concept `{cast:cellarer}` → `$cast:cellarer`) *[systems S5]* | step 1 failure `bond_change $cast:cellarer` |
| critical_failure | Blamed for the Granary: "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` (`$here`, `location`) | −0.02 (step 0) or −0.06 (step 1) |
| critical_failure | The Abbey's Blame: "{cast:cellarer} trusts {actor} less now." | reputation / bond / loss | `reputation` (concept `{cast:cellarer}` → `$cast:cellarer`) *[systems S5]* | step 0 failure or step 1 failure `bond_change $cast:cellarer` |

Route check (editorial loop 2, re-verified by systems against `unifiedActionLifecycle.ts`): a step-0 failure followed by a step-1 success resolves success_at_cost, with net standing +0.04 and net cellarer bond +0.06 sentiment / +0.04 trust, so every gain chip holds. A critical failure at either step is backed by that step's failure writes, and step 1 never runs after a step-0 critical. A step-1 failure is backed by step-1 `failureMetadata`. The failure-side reactions at ±0.04 leave every loss chip true; the worst case is −0.06 + 0.04 = −0.02 on the cellarer.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `speaker` (the crowd's speaker) | lazy-materialize-on-trigger | reuse `smith`/`innkeeper`, spawn `smith` "Wynn Halloway" | must-persist | bond writes, reactions | live |
| `cellarer` (abbey cellarer) | lazy-materialize-on-trigger | reuse `priest`, spawn `monk` "Osric Vane" | must-persist | bond writes, reactions | live |
| `$here` | the town | resolved location | n/a | standing edge | live |
| watch errand | seed query `#watch_errand` | the 5 registered Civic Guard `cg.quest.*` templates | seed | fires later wherever the mortal stands | live (accepted limit: a query seed keeps the family eligibility filter and can wither outside town/city/capital) |

Seed family note: the seed stays on `#watch_errand`. The only family that reads as "who comes back when the grain runs out" is `#town_keeper`, which is hold-gated, so its query would wither for every mortal who does not keep a town.

## 17. Concept Art Direction

1. *Emotions:* hunger held back by a word; a store that is both a town's winter and an abbey's spring; a fragile peace.
2. *Image:* an abbey granary gate in grey morning light, its oak bar cracked down the middle and lashed with rope. A single split grain sack slumped against the threshold, grain spilled in a fan across the cobbles. No people. Footprints in the spilled grain, all stopping at the same line.

## 18. Trait hooks

1. Gate? None. This is an everyday board job, and the brief allows no trait gates.
2. Variant? `trait.core.core_warmth.virtue` +0.04 ("Being Warm, they can make a hungry crowd believe they care.") with `addNudgeIds: ['granary.open_closed_hands']` · `trait.core.core_warmth.vice` −0.04 ("Being Cold, they cannot make a hungry crowd believe they care.").
3. Trait-only nudge? Yes: **Open Closed Hands** on step 1, cost 0, unlocked by the Warm variant.
4. Trait fragment? The trait card's own band fragments.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class | PASS (urban) |
| Opening ≤80 words | PASS (78 by the gate; 77 by hand) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2 + 3 each step) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS (step 0: crit, success, near_miss and failure via Calm; s@c and critical_failure via Hold. Step 1: all six via Remember) |
| No digits in effect lines; verb+noun names; lexicon verbs (calm, hold, remember, open) | PASS |
| Effect line repeats no word of its name | PASS (checked) |
| Consequence hand wired (relationship + story_seed) | PASS |
| Seed query family live (`#watch_errand`, 5 members) | PASS |
| Chips backed per route | PASS (re-verified in editorial loop 2 and by systems) |
| Later-tense promises each name an effect (rule 7b) | PASS after systems S1–S4 |
| Chip referents resolve | PASS after systems S5 |
| Systems ≥3 | PASS (4) |
| Reactions for medium | PASS |
| Over-exposed cards | PASS (no `card.boost.core` special; no mercy special) |

## 20. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (crowd, gate, bar, key, seed, speaker and cellarer are all in the spines) · 4 YES · 4b YES (carryovers say what step 0 means for the ruling; loop 2 cleared the street/ruling/another single-word seams) · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (panic vs the gate; memory vs the mortal's own care) · 9b YES · 10 YES · 11 YES · 11b YES (every band page re-read as one text after loop 2; s@c and critical_failure overviews rewritten again by systems for rule 7b) · 12 YES · 13 YES (duty to the town vs the courtesy of power; siding with the hungry vs with the seed) · 14 YES.

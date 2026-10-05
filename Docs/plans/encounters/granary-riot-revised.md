# Encounter Pipeline: The Granary Riot
> Scale: medium | Slug: granary-riot | Pass: revised
> Revisions applied: editorial loop 2 (PASS WITH REVISIONS) on redraft 1, which had applied every loop-1 must-fix (new P1/P3 putting the danger act on {actor}, carryovers rewritten with the unreachable crit_fail line dropped, four fragments + step-1 s@c afterimage, four overviews, success-side chip cause clauses stripped, "Blamed for the Granary", "a town watch", reactions at ±0.04, scene-neutral Open Closed Hands effect line). Loop 2 edits: s@c overview de-garbled ("The abbey will sow fewer fields this spring."); critical_failure overview premise overclaim and "another" seam echo removed; step-0 critical_success / success / critical_failure afterimages de-echoed ("street", "ruling") and the "front" vs "most" mismatch cleared; success reaction relabelled "Stay until the last sack leaves" with a sold-grain-safe intent; self-audit opening row set to the gate count. No mechanical change.
> Date: 2026-10-05 | Pipeline version: 2.0
> Template: `encounter.town.granary_riot` · Batch: master-everyday, slot 3 (THR-1688) · Brief: `Docs/plans/encounters/master-everyday-brief.md`

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A hungry crowd is forcing the abbey granary's gate, and both the crowd and the abbey ask {actor} to rule how much grain leaves it. |
| Title | **The Granary Riot** — the complication in three words. |
| Shape | Danger – Confrontation – Aftermath. heart 0.76 (`continue_weakened`) → heart 0.80 (`fail_action`). Linear, branch count 0. Mean 0.78, window fit 0.92 (master). |
| Setting | `urban` only. Rolled `sacred` overridden by the brief; it survives as the abbey granary inside the town. |
| Stake (P3) | plea (rolled): {cast:speaker} speaks for a crowd in trouble and asks for a ruling. |
| Opposition | beast (territory), read as people (brief override): a frightened crowd guarding what it thinks is its own. |
| Disposition | open: the crowd wants a ruling, not a fight. |
| Agent role | judge asked to rule (rolled). |
| Scale | settlement: the town's bread for the winter and the abbey's seed for the spring. `scale: 'local'`. |
| System target | cards (rolled): two specials per step, a trait card on step 1. |
| Plot hook | rolled `hook.civil_unrest`, `hook.relic_awakening`, `hook.the_great_building` · **taken `hook.civil_unrest`** — a town turning on its own institution over bread. |
| Consequence hand (binding) | `relationship` + `story_seed`. No swap. relationship = `bond_change` with `$cast:speaker` and `$cast:cellarer` on both sides of step 1, and with `$cast:cellarer` on step 0 failure. story_seed = placeless `encounter_seed` `query: { kind: 'encounter_template', tags: ['#watch_errand'] }` on step 1 success. |
| Standing | `reputation_with $here` +0.06 on step 1 success, −0.06 on step 1 failure, −0.02 on step 0 failure (backs the critical_failure chip on both routes). |
| Cast | `speaker` (the crowd's speaker, must-persist) and `cellarer` (the abbey monk who keeps the granary key, must-persist). The abbot is an off-stage role noun. |
| Systems | cast · seeds · reputation · rewards (persistent bond/standing writes) = 4. |
| Mortal choice | None in the steps — this is a test of Heart. The stance lives in the aftermath reactions. |
| Tone | Ends warm on the success side: the crowd goes home with bread and the abbey keeps its seed. |
| Cool failure | Nobody dies, is jailed or branded. Failure is the master's name: the town sent for a judge whose word ends quarrels, and neither side took it. |
| Cost channels | All specials priced in essence except the trait card (cost 0, paid by being Warm). No Heavy Hand, no rider, no grants. |
| Expert collision | Heart experts are `feud_mediation` (make peace between two houses) and `inheritance_wake` (settle a will). This verb is *hold back a crowd, then apportion a store* — crowd control and rationing, not reconciliation. |

## 1. Inspiration Anchors

- **Event — Civil Unrest** (taken hook): a town turning on one of its own institutions. Contributed the crowd at the gate and the two cast — one voice for the street, one for the abbey.
- **Event — The Great Building** (rolled, not taken): survives only as the question underneath it — who decides, and whose labour pays. Here: whose winter pays for whose spring.
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

1. **Hold back the crowd** (heart 0.76, `continue_weakened`). The danger: the crowd is pushing at the gate. The mortal must talk the front rows into stepping back before the gate gives. A plain failure lets the crowd carry sacks out before it is turned back; a critical failure breaks the gate and ends the action.
2. **Rule on the grain** (heart 0.80, `fail_action`). The confrontation: before the abbey and the crowd, the mortal must name a share of the grain both sides accept. Success opens the gate on the mortal's terms; failure locks it.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

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

Word count: 7 + 36 + 34 = 77 by hand (the gate tokenizer counts 78). ≤80.

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
1. **Calm Frightened People** — Whisper (mind) · essence 2 · Δ 0.10 · `generic.crowd`
   effectLine: "Take the panic out of a crowd, so those at the front stop pushing and start to listen."
   - critical_success: "The pushing stopped at the front first, and then all the way back to the street."
   - success: "The people at the front stopped pushing and turned to listen."
   - near_miss: "The front of the crowd grew calm, but the back kept pushing for a while."
   - failure: "The people at the front grew calm, and the people behind pushed them into the gate anyway."
2. **Hold The Gate** — Boost (force) · essence 2 · Δ 0.08 · `generic.ward`
   effectLine: "Make a door or bar bear far more weight than it was built for, so it stands a while longer."
   - success: "The gate bar bowed under the crowd's weight and did not break."
   - success_at_cost: "The hinges held the gate shut after the bar gave way."
   - failure: "The bar held, and the hinges tore out of the wall instead."
   - critical_failure: "The gate held until it fell flat into the yard all at once."

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

Success metadata: `bond_change $cast:speaker` sentiment +0.12, trust +0.1 · `bond_change $cast:cellarer` sentiment +0.12, trust +0.1 · `encounter_seed query #watch_errand` (delay 48, priority 0.8, seedLabel "A town watch has heard how {actor} settled the granary, and has work for them.") · `reputation_with $here +0.06`.
Failure metadata: `bond_change $cast:speaker` sentiment −0.12, trust −0.1 · `bond_change $cast:cellarer` sentiment −0.1, trust −0.1 · `reputation_with $here −0.06`.

**Specials**
1. **Remember Lean Years** — Omen (time) · essence 2 · Δ 0.10 · `generic.memory`
   effectLine: "Bring back a hungry winter everyone listening lived through, so they weigh tomorrow's hunger against today's."
   - critical_success: "Old people in the crowd spoke of the spring the seed was eaten, and the young ones listened."
   - success: "An old weaver in the crowd remembered the spring with no seed to sow, and said so."
   - success_at_cost: "The crowd remembered the lean spring, but only the old ones would settle for less."
   - near_miss: "The crowd remembered the hungry winter, but only after it had refused the first ruling."
   - failure: "The crowd remembered a hungry winter, and judged this one worse."
   - critical_failure: "The crowd remembered the last hungry winter, and would not wait to starve through another."
2. **Open Closed Hands** — Trait card (Warm) · `requiredTrait: trait.core.core_warmth.virtue` · essence 0 · Δ 0.08 · `generic.warmth`
   effectLine: "Wake their care for others, so everyone listening believes they mind who goes hungry, and each side gives a little."
   - success: "{actor} spoke as one who cares who eats, and the crowd believed it."
   - failure: "{actor} plainly cared who ate, and the cellarer called that soft."

## 12. Linear continuation

> Now {actor} must rule, in front of the crowd and the abbey. {cast:cellarer} holds the granary key, and says every sack given away now is a field unsown next spring. The crowd's speaker says the town will not reach spring without bread. The ruling has to be one both sides accept.

## 13. Aftermath Paragraph (per band)

- **critical_success:** "The abbey sells the share {actor} named at last year's price and keeps the rest for seed. The abbot came out to thank {actor} in front of the town."
- **success:** "{cast:speaker} led the crowd home with bread for the month. The abbey keeps its seed for the spring."
- **success_at_cost:** "{cast:speaker} led the crowd home with bread. The abbey will sow fewer fields this spring."
- **failure:** "Bread is still dear in {location}. People send for a master because a master's word ends quarrels. This quarrel is still going."
- **critical_failure:** "The abbey has lost most of next spring's seed, and {location}'s next harvest will be small. Both sides asked {actor} to settle this, and both have lost by it."
- **fallback:** "The yard empties, and {location} counts what the granary gave."

## 14. Aftermath Reaction Choices

Success side (fallback reactions, inherited by the three success bands):
- **Stay until the last sack leaves** — "The mortal stays at the granary until the last sack of the share has gone, and the town hears of it." → `reputation_with $here +0.03`.
- **Sup at the abbey's table** — "The mortal eats at the abbey's table that night. The cellarer will remember the company." → `bond_change $cast:cellarer +0.04`.

Failure side (failure and critical_failure). Magnitudes held at ±0.04 so no band chip is contradicted after either pick:
- **Side with the crowd** — "The mortal says the town's hunger mattered more than the abbey's seed. The crowd's speaker will remember it kindly, and the cellarer will not." → `bond_change $cast:speaker +0.04`, `bond_change $cast:cellarer −0.04`.
- **Side with the abbey** — "The mortal backs the abbey: the seed should have been kept, whatever the town thinks. The cellarer is grateful; the crowd's speaker is not." → `bond_change $cast:cellarer +0.04`, `bond_change $cast:speaker −0.04`.

## 15. Aftermath Kit Summary (chips)

| Band | Chip | kind / category | stateNoun | Backing write |
|---|---|---|---|---|
| crit / success / s@c | The Town's Thanks — "{location} thinks better of {actor} now." | reputation / bond / gain | `reputation with {location}` ($here) | step 1 success `reputation_with +0.06` (net +0.04 after a step-0 failure) |
| crit / success / s@c | The Crowd's Trust — "{cast:speaker} trusts {actor} now." | reputation / bond / gain | `reputation` (tooltip `ui.reputation_with`) | step 1 success `bond_change $cast:speaker` |
| crit / success / s@c | The Abbey's Trust — "{cast:cellarer} trusts {actor}'s judgment now." | reputation / bond / gain | `reputation` | step 1 success `bond_change $cast:cellarer` (net +0.06 after a step-0 failure) |
| crit / success / s@c | Work From the Watch — "Word of the ruling will bring {actor} work from a town watch." | future_hook / path / opens | `seed` | step 1 success `encounter_seed` |
| failure | Ruling Refused — "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | step 1 failure −0.06 |
| failure | The Crowd's Doubt — "{cast:speaker} trusts {actor} less now." | reputation / bond / loss | `reputation` | step 1 failure `bond_change $cast:speaker` |
| failure | The Abbey's Doubt — "{cast:cellarer} doubts {actor}'s judgment now." | reputation / bond / loss | `reputation` | step 1 failure `bond_change $cast:cellarer` |
| critical_failure | Blamed for the Granary — "{location} thinks less of {actor} now." | reputation / bond / loss | `reputation with {location}` | −0.02 (step 0) or −0.06 (step 1) |
| critical_failure | The Abbey's Blame — "{cast:cellarer} trusts {actor} less now." | reputation / bond / loss | `reputation` | step 0 failure or step 1 failure `bond_change $cast:cellarer` |

Route check (editorial loop 2): step-0 failure → step-1 success resolves success_at_cost with net standing +0.04 and net cellarer bond +0.06, so every gain chip holds. A critical failure at either step is backed by that step's failure writes. A step-1 failure is backed by step-1 `failureMetadata`. The failure-side reactions at ±0.04 leave every loss chip true; the worst case is −0.06 + 0.04 = −0.02 on the cellarer.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `speaker` (the crowd's speaker) | lazy-materialize-on-trigger | reuse `smith`/`innkeeper`, spawn `smith` "Wynn Halloway" | must-persist | bond writes, reactions | live |
| `cellarer` (abbey cellarer) | lazy-materialize-on-trigger | reuse `priest`, spawn `monk` "Osric Vane" | must-persist | bond writes, reactions | live |
| `$here` | the town | resolved location | n/a | standing edge | live |
| watch errand | seed query `#watch_errand` | registered Civic Guard templates | seed | fires later wherever the mortal stands | live (accepted limit: a query seed keeps the family eligibility filter and can wither) |

Seed family note: the seed stays on `#watch_errand`. The only family that reads as "who comes back when the grain runs out" is `#town_keeper`, which is hold-gated, so its query would wither for every mortal who does not keep a town.

## 17. Concept Art Direction

1. *Emotions:* hunger held back by a word; a store that is both a town's winter and an abbey's spring; a fragile peace.
2. *Image:* an abbey granary gate in grey morning light, its oak bar cracked down the middle and lashed with rope. A single split grain sack slumped against the threshold, grain spilled in a fan across the cobbles. No people. Footprints in the spilled grain, all stopping at the same line.

## 18. Trait hooks

1. Gate? None — an everyday board job, no rule gates by brief.
2. Variant? `trait.core.core_warmth.virtue` +0.04 ("Being Warm, they can make a hungry crowd believe they care.") with `addNudgeIds: ['granary.open_closed_hands']` · `trait.core.core_warmth.vice` −0.04 ("Being Cold, they cannot make a hungry crowd believe they care.").
3. Trait-only nudge? Yes — **Open Closed Hands** on step 1, cost 0, unlocked by the Warm variant.
4. Trait fragment? The trait card's own band fragments.

## 19. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + one opening per class | PASS (urban) |
| Opening ≤80 words | PASS (78 by the gate; 77 by hand) |
| Hand 4–8 composed, ≤2 specials, deal declared | PASS (2 + 3 each step) |
| Every special has a failure-band fragment | PASS |
| All six StepOutcomes covered per step | PASS (step 0: crit, success, near_miss, failure via Calm; s@c, critical_failure via Hold. Step 1: all six via Remember) |
| No digits in effect lines; verb+noun names; lexicon verbs (calm, hold, remember, open) | PASS |
| Effect line repeats no word of its name | PASS (checked) |
| Consequence hand wired (relationship + story_seed) | PASS |
| Seed query family live (`#watch_errand`, 5 members) | PASS |
| Chips backed per route | PASS (re-verified in editorial loop 2) |
| Systems ≥3 | PASS (4) |
| Reactions for medium | PASS |
| Over-exposed cards | PASS (no `card.boost.core` special; no mercy special) |

## 20. Experience Differentiator Gate

1 YES · 2 YES · 3 YES (crowd, gate, bar, key, seed, speaker and cellarer are all in the spines) · 4 YES · 4b YES (carryovers say what step 0 means for the ruling; loop-2 cleared the street/ruling/another single-word seams) · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (panic vs the gate; memory vs the mortal's own care) · 9b YES · 10 YES · 11 YES · 11b YES (every band page re-read as one text after loop 2; s@c and critical_failure overviews rewritten) · 12 YES · 13 YES (duty to the town vs the courtesy of power; siding with the hungry vs with the seed) · 14 YES.

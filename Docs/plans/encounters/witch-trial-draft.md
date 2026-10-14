# Encounter Pipeline: The Witch Trial
> Scale: medium | Slug: witch-trial | Pass: draft
> Date: 2026-10-14 | Pipeline version: 2.0
> Template: `encounter.town.witch_trial` · Batch: master-everyday-2, slot 8 (THR-1757) · Brief: `Docs/plans/encounters/master-everyday-2-brief.md` · Model: `restless-ossuary` (master batch 1, veil query prize)

## 0. Mechanical design block (fixed before prose)

| Row | Value |
|---|---|
| Crux | A healer is in the stocks for witchcraft and the pyre is built. The boy's sickness is in the rye, and the rye does not care whom the town blames. |
| Title | **The Witch Trial** |
| Shape | Query prize on a three-step read → read → rule spine. veil 0.74 (`continue_weakened`) → veil 0.80 (`continue_weakened`) → veil 0.84 (`fail_action`). Linear, branch count 0. Mean 0.793, window fit 0.933 (master band). |
| Setting | `urban` only. The rolled *stronghold* survives as the magistrate's square, the stocks and the pyre (brief override). |
| Stake (P3) | unmitigated risk (rolled): the pyre is built; say whether the healer is touched before it is lit. |
| Opposition | terrain (indifference), read as the sickness in the rye: it gives the boy fits whoever the town burns. |
| Agent role | client who is owed (rolled). The brief's "old favour" is **not** asserted in prose (prose rule 7: no history without a backing read). The role lands as a favour the magistrate may come to owe: the *Leave the miller to the magistrate* reaction mints `favor_creation`, debtor `$cast:magistrate`. |
| Scale | settlement (the town, its crowd, its magistrate). `scale: 'local'`. |
| System target | traits (rolled, advisory): two trait variants. |
| Plot hook | rolled `hook.grief_absorption`, `hook.death_and_return`, `hook.trial_by_combat` · **taken `hook.death_and_return`**: the miller's boy was laid out for dead at harvest and woke under the healer's hands; the lane says what woke is not the boy. The truth: spoiled rye. The fits and the burning hands are the sickness in the bread, and the boy is the boy. |
| Consequence hand (binding) | `relationship` + `secret`. No swap. relationship = `bond_change` with `$cast:accused` (+0.12 sentiment and trust, step 2 success) and with `$cast:magistrate` (−0.12 on step 2 failure; −0.04/−0.05 on step 0 and step 1 failure). secret = `hidden_mark` (`secret_knowledge`, on `$actor`, step 2 success): the miller ground the rye knowing it was spoiled, then named the healer; plus `favor_creation` (debtor `$cast:magistrate`) on the discretion reaction. |
| Query prize | step 2 `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#healing'] }`: a remedy from the healer's house, given in thanks. `#healing`: item 8 bearers. |
| Standing | `reputation_with $here` +0.05 on step 2 success, −0.06 on step 2 failure, −0.02 on step 0 and step 1 failure (backs the critical_failure chips on every route). |
| Cast | `accused` ({cast:accused}, the healer; reuse/spawn `healer`, "Maud Ellery") · `magistrate` ({cast:magistrate}; reuse `clerk`/`noble`, spawn `official`, "Aldous Renn"). Both must-persist. Neither gendered in prose. The miller and the boy are role nouns. |
| Systems | cast · rewards · reputation = 3 (the floor), plus the hidden mark and the favour. |
| Mortal choice | None in the steps. The choice lives in the aftermath reactions: name the miller aloud, or leave him to the court; sit with the healer in chains, or leave. |
| Cool failure | The mortal is not killed, jailed or branded. **failure**: the healer goes to the assize in chains and the town says the master stayed the burning on a doubt. **critical_failure**: the crowd burns the healer's house and every remedy in it, and the healer goes to the assize in chains. The healer is never burned on the page: the cast node persists, and the world must not say a person died whom the graph keeps alive. |
| Cost channels | All specials priced in essence. No Heavy Hand, no rider, no Undertow, no Mercy special. |
| Not colliding | Veil master: lay an ossuary's dead. Veil experts: hear a drowned man, judge an oath-breaker. This one reads a living accused and a sick house; no card questions the dead. |

## 1. Inspiration Anchors

- **Ordeal — Unmaking & Resurrection** (taken hook `hook.death_and_return`): the boy who came back "not quite himself". Contributed the town's fear and its whole case against the healer. The encounter turns the hook's question (what came back?) into a reading the master can get wrong.
- **Ordeal — The Grief Absorption** (rolled, not taken): survives only as the crowd's memory of the patients the healer could not save (the *Wake Old Gratitude* failure fragments).
- **Ordeal — Trial by Combat** (rolled, not taken): the ruling in the square is the trial; no one fights.
- Anti-patterns avoided: the lurid witch-burning (the healer is never burned on the page; the cost is the house and the chains), the healer as secret villain, the miller as cackling villain (he ground bad grain to keep the mill paying and blamed the nearest stranger to it), the god deciding the verdict (every card shifts what the scene shows; none says which ruling to give).

## 2. Scale Justification

Medium: three beats (read the accused, read the house, rule in the square) at master rarity. The outcome touches a person's life and home, a magistrate's trust and a town's regard, which is what a master's everyday job should risk. Medium means reaction choices are owed.

## 3. Pressure Knot

At harvest the miller's boy was laid out for dead and woke in the night under the healer's hands. He has had fits since, and his hands burn. The lane says what woke is not the boy, the miller was the first to say the healer did it, and the town has put the healer in the stocks and built a pyre. The magistrate will not burn anyone without a master's reading, and has sent for {actor}.

## 4. Intervention Fantasy

The god watches a master of the unseen hold back a burning with nothing but a reading. The hand reaches into the prisoner's body (a racing heart slowed), the unseen itself (any mark brought into view), the household's memory of a wet harvest, the decay already in the grain, the crowd's noise and the crowd's memory of the healer's help. None of it gives the ruling.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{actor}` | the mortal | sent for by the magistrate |
| `{cast:accused}` | actor, must-persist | the healer in the stocks; reuse/spawn `healer`; spawnName **Maud Ellery**; never gendered |
| `{cast:magistrate}` | actor, must-persist | hears the ruling; reuse `clerk`/`noble`, spawn `official`; spawnName **Aldous Renn**; never gendered |
| the miller | role noun | keeps the mill house; ground the spoiled rye knowingly; first to accuse |
| the boy | role noun | the miller's son; fits and burning hands |
| `{location}` (`$here`) | location | the town; carries the standing edge |
| the stocks, the pyre, the square | scene fiction | |
| the mill house and its loft | scene fiction | where the spoiled rye is stored |
| a remedy | `possession` drawn by `#healing` | engine-named; given by the healer in thanks (step 2 success) |
| the miller's secret | `hidden_mark` on `$actor` | concealed knowledge; reveals on `investigation` |
| the magistrate's favour | `favor_creation` | discretion reaction only |

## 6. Beat Structure

1. **Read the accused healer** (veil 0.74, `continue_weakened`). Is there any mark of the unseen on the healer? The reveal (none; the healer names the day the boy first ate the new bread) lives behind the bands.
2. **Read the house where the harm began** (veil 0.80, `continue_weakened`). The mill house, the household's account, the loft. The reveal (black rye from the low field) lives behind the bands.
3. **Rule before the magistrate** (veil 0.84, `fail_action`). Noon in the square, the crowd around the pyre. The prize, the bond with the healer, the hidden mark and the main standing write.

## 7. Branching Profile

Linear — no branching. Branch count 0. The choice lives in the aftermath reactions.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | The healer is cleared; the pyre comes down by evening. | Nothing beyond the day. | A remedy (prize); the healer trusts the master; the town thinks well of them; they know the miller knew. |
| success | The healer is cleared; the pyre comes down. | The day's work. | Same. |
| success_at_cost | The healer is cleared, but the miller tells the lane the master lied to save a witch. | An enemy in the miller (told, unchipped). | Same chips. |
| failure | The healer is alive, in chains for the assize; the pyre still stands. | The magistrate's trust, the town's regard. | The town says the master stayed the burning on a doubt. |
| critical_failure | The crowd burns the healer's house and every remedy in it; the healer goes to the assize in chains. | The magistrate's trust, the town's regard, loudly. | A master was sent for to stop this, and it happened anyway. |

## 9b. Stakes Line

```
goal:      clear the accused healer before the pyre is lit
risk:      see the healer's house burned and the healer chained
won:       cleared the accused healer before the pyre was lit
lost:      stayed the pyre but left the healer in chains
lostBadly: saw the healer's house burned and the healer chained
```

description: "A healer sits in a town's stocks for witchcraft, with a pyre built in the square. Someone has to say, before the magistrate and the crowd, whether the healer is touched and what really made the miller's boy sick."

## 10. Sample Opening

> {actor} arrives in {location}, sent for by the magistrate, who owes {actor} an old favour.
>
> A healer is in the stocks for witchcraft, and a pyre stands built in the square. At harvest the miller's boy was laid out for dead and woke under the healer's hands. He has had fits since, and his hands burn. The lane says what woke is not the boy.
>
> The magistrate asks {actor} to say whether {cast:accused} is touched, before the town lights the pyre.

(80 words across the opening and step 0's spine.)

## 11. The Hand Per Step

Every step: two authored specials (`witch.*`) plus a declared `deal` fill of 3 → composed hand of 5.

### Step 0 — Read the accused healer (veil 0.74)

- `purposeLine`: **Read the accused healer**
- `deal`: `{ count: 3, tags: ['lore', 'insight'] }`
- Afterimages:
  - critical_success: "By noon they were sure. No mark of the unseen was on {cast:accused}, and the healer named the day the boy first ate the new bread."
  - success: "No mark of the unseen was on {cast:accused}. The healer was frightened and tired, and told the same account of the boy's waking each time."
  - success_at_cost: "No mark of the unseen was on {cast:accused}, but the crowd watched {actor} sit at the stocks all morning and began to say the master was bewitched too."
  - failure: "They could not tell. {cast:accused} was too frightened to answer plainly, and {actor} left the stocks without a reading."
  - critical_failure: "{cast:accused} would not speak to them at all. The magistrate called off the reading, and the crowd took that for an answer."
- `failureMetadata`: `bond_change $cast:magistrate` −0.04 sentiment / −0.05 trust; `reputation_with $here −0.02`.

**Special 1 — Settle Frightened Breath** (Balm) · `life` · essence 2 · Δ 0.10 · `generic.vigor`
- effectLine: "Slow the prisoner's racing heart, so the answers given in the stocks come steady and plain."
- critical_success: "{cast:accused} stopped shaking and answered every question in a level voice."
- success: "The healer's breathing slowed, and the answers came plain."
- near_miss: "The healer grew calm only by noon, after a morning too frightened to answer."
- failure: "The healer grew calm enough to talk, and talked only of the pyre."

**Special 2 — Uncover True Spirit** (Boost, sight) · `spirit` · essence 2 · Δ 0.08 · `generic.light`
- effectLine: "Bring any mark of the unseen on the prisoner into plain view, if a mark is there."
- success: "No mark of the unseen showed on {cast:accused}, and {actor} could say so plainly."
- success_at_cost: "No mark showed, but the crowd watched {actor} lay hands on the healer and muttered about it."
- failure: "A faint mark showed on the healer, left by years of setting bones with old charms."
- critical_failure: "The crowd saw a light pass over the healer's face and shouted that the witch was proven."

### Step 1 — Read the house where the harm began (veil 0.80)

- `narrativeTemplate`: "The harm began at the mill house, where the boy lies. The miller keeps the door and wants the healer burned. The household says the boy was cold for a night and a day before he woke. Their grain is stored in the loft above. The sickness in the house does not care what the town believes, and it will show its cause only to a careful reading."
- `purposeLine`: **Read the house where the harm began**
- `deal`: `{ count: 3, tags: ['insight', 'peril'] }`
- Afterimages:
  - critical_success: "They found the cause before dark. The rye in the mill loft came in black from the low field, and the household has eaten bread from it since harvest."
  - success: "They found black, spoiled rye in the mill loft. The household has eaten bread from it since harvest."
  - success_at_cost: "They found the spoiled rye in the loft, but the miller caught them at the sacks and threw them out of the house."
  - failure: "They read the house until dark and found no cause they could name. They will have to rule without one."
  - critical_failure: "The boy had a fit while they were in the room, and the miller ran into the street shouting that the witch's friend had brought it on. The magistrate called the reading off."
- Carryover lines (keyed on step 0): critical_success (for, +0.06) "They are sure the healer is not touched." · success (for, +0.04) "They found no mark of the unseen on the healer." · success_at_cost (against, −0.02) "The crowd says they are bewitched too." · near_miss (against, −0.03) "They read the healer only after a long morning." · failure (against, −0.05) "They could not tell whether the healer is touched."
- `failureMetadata`: as step 0.

**Special 3 — Recall Wet Harvest** (Boost, memory) · `mind` · essence 2 · Δ 0.10 · `generic.memory`
- effectLine: "Bring back to the household the rainy weeks at reaping, so they remember which field each sack of grain came from."
- critical_success: "The household remembered at once which sacks came from the low field, and went straight to them."
- success: "The household remembered the rainy reaping, and the sacks from the low field."
- near_miss: "The household remembered the low field only at dusk, after a day of wrong answers."
- failure: "The household remembered the rain, and blamed the healer for it."

**Special 4 — Quicken Hidden Rot** (Gambit-flavoured Boost, decay) · `entropy` · essence 2 · Δ 0.08 · `generic.decay`
- effectLine: "Hasten the decay already in the stored grain, so the spoiled sacks turn black where anyone can see."
- success: "The spoiled sacks in the loft turned black overnight, and the rest stayed clean."
- success_at_cost: "The spoiled sacks turned black, and the miller saw them first and swore they had been cursed."
- failure: "The decay spread to the good sacks too, and the whole loft looked cursed."
- critical_failure: "The whole loft went black in a night, and the lane said the healer had cursed the mill."

### Step 2 — Rule before the magistrate (veil 0.84)

- `narrativeTemplate`: "{cast:magistrate} hears the ruling in the square at noon, with the crowd around the pyre. {actor} must say whether the healer is touched, and what really made the boy sick. The sickness cares nothing for whom the town blames. If the ruling names the wrong cause, the boy will still have fits, and the town will still want a witch."
- `purposeLine`: **Rule before the magistrate**
- `deal`: `{ count: 3, tags: ['presence', 'social'] }`
- Afterimages:
  - critical_success: "{cast:magistrate} tasted the black rye in front of the square and spat it out. The crowd let the healer out of the stocks and pulled down the pyre."
  - success: "{cast:magistrate} ruled that the healer was not touched and that the rye made the boy sick. Afterwards a mill hand told {actor} the miller knew the rye was bad and ground it anyway."
  - success_at_cost: "{cast:magistrate} freed the healer on the ruling, but the miller swore before the whole square that {actor} had lied to save a witch."
  - failure: "The crowd would not hear the ruling. {cast:magistrate} would not burn the healer on {actor}'s doubt, and would not free the healer either."
  - critical_failure: "The ruling fell apart in front of the square, and the crowd stopped listening. {cast:magistrate} held the pyre, and could not hold the crowd."
- Carryover lines (keyed on step 1): critical_success (for, +0.06) "They know the spoiled rye made the boy sick." · success (for, +0.04) "They found the spoiled rye in the mill loft." · success_at_cost (against, −0.02) "The miller threw them out of the mill house." · near_miss (against, −0.03) "They found the spoiled rye only at dusk." · failure (against, −0.05) "They do not know what made the boy sick."
- `successMetadata`: `rewardPool { possession: 1 } tagFilters ['#healing']` + `bond_change $cast:accused` +0.12/+0.12 + `hidden_mark` (`secret_knowledge`, 0.3, "the miller ground the spoiled rye knowing it was bad, then named the healer", `$actor`, reveals `investigation`) + `reputation_with $here +0.05`.
- `failureMetadata`: `bond_change $cast:magistrate` −0.12/−0.12 + `reputation_with $here −0.06`.

**Special 5 — Hush Angry Square** (Insurance-flavoured Boost, crowd) · `order` · essence 2 · Δ 0.08 (step 2 specials sum 0.16: 0.84 + 0.16 = 1.00, the forecast ceiling) · `generic.crowd`
- effectLine: "Quiet the shouting around the pyre, so the ruling is heard to its last word."
- critical_success: "The crowd went quiet, and the ruling was heard to the end."
- success: "The shouting died down long enough for the ruling to be heard."
- near_miss: "The crowd quieted only after the ruling had been read twice."
- failure: "The crowd went quiet, and in the quiet the miller called the ruling a lie."
- critical_failure: "The crowd went silent, then broke into shouting all at once."

**Special 6 — Wake Old Gratitude** (Boost, memory of help) · `mind` · essence 2 · Δ 0.08 · `generic.warmth`
- effectLine: "Bring back to the crowd every fever and broken bone the healer once tended, so each weighs on them as the ruling is read."
- success: "Faces in the crowd remembered fevers the healer had nursed, and turned away from the pyre."
- success_at_cost: "The crowd remembered the healer's help, and the miller shouted that a witch would be helpful."
- failure: "The crowd remembered the healer's help, and the children the healer could not save."
- critical_failure: "The crowd remembered every patient the healer had lost, and called each name aloud."

### Trait hooks

1. Gate? No — everyday board, no rule gate.
2. Variant? Yes:
   - `trait.core.core_warmth.virtue` +0.05: "Being Warm, they can get a frightened healer to talk."
   - `trait.core.core_humility.vice` −0.05: "Being Proud, they want a ruling the crowd will cheer."
3. Trait-only nudge? No.
4. Trait fragment? No.

## 12. Linear continuation

Step 1 and step 2 spines above. The later paragraph is step 2's: noon in the square; say whether the healer is touched and what made the boy sick; the sickness does not care whom the town blames.

## 13. Aftermath Paragraph

fallback overview: "{actor} has given the magistrate a ruling, and {location} waits to see what it does with the healer."

`narrativeTemplates`: initiation "A healer is in a town's stocks for witchcraft, and the magistrate sends for a master to say whether the healer is touched." · success "The healer was cleared, and the pyre came down." · failure "The healer was not cleared, and the town still wants a witch."

| Band | overview |
|---|---|
| critical_success | "{cast:accused} walks out of the stocks cleared, and the pyre is gone from the square by evening. The healer presses a remedy from the house into {actor}'s hands, in front of the whole lane." |
| success | "{cast:accused} is out of the stocks, and the pyre comes down. The healer gives {actor} a remedy from the house in thanks." |
| success_at_cost | "{cast:accused} is out of the stocks and gives {actor} a remedy from the house in thanks. The miller tells the whole lane that {actor} lied to save a witch." |
| failure | "The healer is alive and in chains, waiting for the assize, and the pyre still stands in the square. {location} says {actor} stayed the burning on a doubt, and the town wanted a master's certainty." |
| critical_failure | "{actor} gave the magistrate no ruling that held. The crowd burned the healer's house and every remedy in it, and the healer goes to the assize in chains. A master was sent for to stop this, and it happened anyway." |

## 14. Aftermath Reaction Choices

Success bands (fallback reactions):
- **Name the miller in the square** — "The mortal tells the whole square the miller knew the rye was spoiled and ground it anyway. The town is grateful; the magistrate wanted it kept quiet." → `reputation_with $here +0.04`, `bond_change $cast:magistrate −0.08`.
- **Leave the miller to the magistrate** — "The mortal tells only the magistrate what the miller knew, and lets the court deal with it quietly. The magistrate owes them for the quiet." → `favor_creation` debtor `$cast:magistrate`, 0.15–0.3, "Kept the miller's spoiled rye out of the square".

Failure and critical failure:
- **Sit with the healer in chains** — "The mortal sits with the healer through the first night in chains, where the town can see. The healer will remember it, and the town will too." → `bond_change $cast:accused +0.12`, `reputation_with $here −0.02`.
- **Leave before the crowd turns** — "The mortal leaves the town that evening, before the crowd turns on them too. The healer watches them go." → `bond_change $cast:accused −0.10`.

The stances: the truth told in public at the cost of the magistrate's goodwill, or discretion that puts the magistrate in the mortal's debt; standing by the accused where the town can see, or saving one's own skin.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) |
|---|---|
| critical_success | BOND · reputation — "The Healer's Trust" "{cast:accused} trusts {actor} now." · BOND · reputation with {location} (gain) "Well Regarded" · PATH · hidden mark "The Miller's Rye" "{actor} knows the miller ground the rye knowing it was spoiled." · PRIZE (engine, `#healing`) |
| success | same three chips, same prize |
| success_at_cost | same three chips, same prize |
| failure | BOND · reputation — "The Magistrate's Trust" "{cast:magistrate} trusts {actor} less now." · BOND · reputation with {location} (loss) "Found Wanting" |
| critical_failure | same magistrate chip · BOND · reputation with {location} (loss) "Out of Favour" |

Backing: success chips ← step 2 `successMetadata` (bond_change accused, hidden_mark, reputation_with, rewardPool). failure chips ← step 2 `failureMetadata`. critical_failure chips ← the failureMetadata of whichever step critically failed (all three steps write both a magistrate bond loss and a town reputation loss).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `accused` (the healer) | lazy-materialize-on-trigger | reuse `healer` (town 0.8, city 1.0), else spawn `healer` "Maud Ellery" | must-persist | bond edges; the reactions | live (THR-696 cast binding) |
| `magistrate` | lazy-materialize-on-trigger | reuse `clerk` / `noble`, else spawn `official` "Aldous Renn" | must-persist | bond edges; `owes_favor` | live |
| a remedy | step 2 `rewardPool` `#healing` | item library (8 bearers) | must-persist (possession) | PRIZE chip | live |
| the miller's secret | `hidden_mark` on `$actor` | encounter | must-persist (mark) | reveals on `investigation` | live |
| standing | `reputation_with $here` | the town | must-persist | chips | live |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Design block before prose | PASS | § 0 |
| Opening skeleton ≤80 words | PASS | 80 |
| Narrator mode | PASS | report throughout |
| Prose rule 7 (no unbacked history) | FLAG | the opening asserts "who owes {actor} an old favour" with no backing read |
| One named person per beat | PASS | |
| Hand 4–8 per step, ≥4 spheres, ≥1 common | PASS (by deal) | |
| Every nudge has a failure fragment | PASS | |
| Six StepOutcomes covered per step | PASS | |
| byOutcome ≥3 bands | PASS | all five |
| Every chip backed | PASS | see § 15 backing |
| Consequence hand wired | PASS | relationship = bond_change; secret = hidden_mark + favor_creation |
| Query prize tag live | PASS | `#healing` item 8 |
| Never gender bound cast | PASS | "the healer", "the magistrate" |
| Cool failure, plain not lurid | PASS | house burned, chains; nobody burned on the page |

### Concept Art Direction

1. Emotions: a town's fear looking for a person to land on; a life's work at risk; the quiet after a crowd goes home.
2. Image: a stone mortar and pestle left on the step of empty stocks, a sprig of dried feverfew beside it, the unlit stack of a pyre a blur in the background. Residue, no people.

## Experience Differentiator Gate

1. YES · 2. YES · 3. YES · 4. YES · 5. YES · 6. YES · 7. YES · 8. YES · 9. YES · 9b. YES · 10. YES · 11. YES · 11b. YES · 12. YES · 13. YES · 14. YES (details in the revised packet).

# Encounter Pipeline: The Overdue Caravan
> Scale: medium (3 steps, `scale: 'local'`) | Slug: overdue-caravan | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Batch: journeyman-everyday-1, slot 2 (THR-1676) · templateId `encounter.town.overdue_caravan`
> Package: `Docs/plans/encounters/overdue-caravan.package.json` (dry-run clean; `check:encounter` equivalent clean on the assembled template)

## 1. Inspiration Anchors

- **Plot hooks rolled:** `hook.descent_into_darkness`, `hook.sacred_crime`, `hook.lost_civilization`.
- **Taken: `hook.lost_civilization`**, blended with `descent_into_darkness`. The "place built by people nobody remembers, open again" is the **old road**: older than any town on it, marked with star-cut stones nobody reads now, back in use because the new north road washed out. The descent is the fork at the cutting, where one way runs down under the ground and that is where the caravan is. `sacred_crime` was dropped. It pulls toward a temple frame, and the brief's everyday constraint rules that out.
- **Seed Dice honoured:** P3 obstruction (the north road is out, the old road is the only other way, and the carters will not take it). Opposition is uncanny, read as rumour, weather and the road itself, with no magic: "the road goes wrong after dark", the cloud over the stars. Disposition is hostile: the steward says the house will remember who helped and who did not. Agent role is bystander pulled in (the agent knows roads). Scale is region: a house's whole season on a trade road.
- **Anti-patterns avoided:** a roadside vignette the agent watches (the agent does the reading at every step); a lyrical "haunted road" (the uncanny is stated as what the carters say); a failure that kills or jails.

## 2. Scale Justification

Three steps, medium. The shape is Test and Consequence with carryover, and it needs three beats: the reports tell you where the wagons turned off, the markers tell you how the road runs, and the stars at the fork tell you which way is right. Each beat inherits the last one's band. Stakes are journeyman stakes: a merchant house's season and its debts in town, and the agent's standing with the house. Rarity 2, local.

## 3. Pressure Knot

A merchant house's caravan is days overdue. It carries the house's season, and the house owes money against every wagon. The north road washed out. The old road is the only other way, and the carters say nobody who takes it at night comes back. The steward is going round the market, or riding round the farms, for anyone who knows roads.

## 4. Intervention Fantasy

The god works on the things a road-reader reads. A carter's memory brings back the turn at the marker stone. Low evening light fills the cut signs. The steward's riders stay out after dark. The cloud comes off the stars over the cutting. The mortal still reads and still picks the fork, and fate rolls. The god's hand is plain in failure too: a carter remembers a different road, the sky clears and shows a way that is not the caravan's.

## 5. Cast and World Objects

- **`{cast:steward}`**: steward of a merchant house (spawn `Oda Varrin`, role `merchant`; reuse `merchant` / `trader` / `innkeeper`; must-persist). The one named person on all three beats. Hostile: the house will remember who helped and who did not. Anchor for `reputation_with`.
- **The carters' reports** (scene-local), **the old road and its marker stones** (scene-local), **the cutting** (scene-local). None is a chip referent. All live in prose only.
- **The thread** `$ascendant` ↔ `$actor`, strengthened or weakened on the final step.
- **Seed**: `encounter_seed` by query `#explore` (41 matched templates), placeless, on both sides.
- **Reputation channel**: `reputation_with` on `$cast:steward`, ±0.08 on the final step, +0.04 on one reaction.

## 6. Beat Structure

| Step | Reach · difficulty | Purpose | failBehavior |
|---|---|---|---|
| 0 | eye 0.38 | Read the reports | continue_weakened |
| 1 | star 0.45 | Read the markers (carryover on step 0) | continue_weakened |
| 2 | star 0.48 | Follow the stars (carryover on step 1) | fail_action |

Mean 0.44, Star by two steps to one. Tier is `shaping`: the 0.45 open-draw off-reach ceiling binds `background` only, and this is journeyman content its mortals pick through the forecast window.

## 7. Branching Profile

Linear, no branching. Carryover lines carry each step's result into the next.

## 8. Branching Map

N/A, linear encounter.

## 9. Outcome Ladder

- **critical_success**: the caravan is out by dawn, every wagon whole. The steward tells the market who found the way. Thread up, steward's regard up, a seed planted.
- **success**: the caravan is found where the old paving gave way and brought out. The house has its season back. Thread up, regard up, seed.
- **success_at_cost**: out, less one wagon over the broken paving. The house has most of its season and has counted the loss. Thread up, regard up, seed.
- **failure**: the party turns back at dark. The caravan reaches town days later with half its stock spoiled, and the house cannot pay what it owes. Thread down, regard down, seed.
- **critical_failure**: the party goes the wrong way and spends the night lost. The house loses the caravan and a night of its riders, and the steward tells the market whose reading it was. Thread down, regard down, seed.

Cool failure throughout. The cost is money, standing and time.

## 10. Sample Opening (narrator mode, ≤80 words with the step-0 spine)

**Urban.** {actor} is in {location} when {cast:steward}, steward of a merchant house, goes round the market asking for anyone who knows the roads.

**Rural.** {actor} is at {location} when {cast:steward}, steward of a merchant house, rides in from the town asking every farm for anyone who knows the roads.

**Spine (step 0).** The house's caravan is days overdue. It carries the house's season, and the house owes money against every wagon. {cast:steward} has the carters' reports and wants them read. The north road is washed out. The old road is the only other way, and the carters say nobody who takes it at night comes back.

## 11. The Hand Per Step

Every step authors specials and a `deal` fill. The over-exposed list is respected: no special reuses `card.boost.core`, the energy signature, darkness undertow, mercy or the mind compulsion.

- **Step 0** (deal 4: `insight`, `social`)
  - *Whisper-type special.* **Stir The Memory** (mind, 2 essence, +0.10). "Bring back the detail a carter left out of his report, the one he saw and thought did not matter." Fragments: success, near_miss, failure.
- **Step 1** (deal 4: `lore`, `journey`)
  - *Boost-type special, light sphere.* **Catch The Low Sun** (light, 2, +0.12). "Lay the evening light flat across the marker stones, so the cut signs stand out plain." Fragments: critical_success, success, failure.
- **Step 2** (deal 3: `lore`, `peril`)
  - *Fellowship-type special.* **Stiffen The Riders** (spirit, 2, +0.12). "Give the steward's party the nerve to stay out after dark while the sky is read." Fragments: success, failure, critical_failure.
  - *Omen/Boost-type special.* **Clear The Night** (energy, 2, +0.10). "Push the cloud off the sky above the cutting, so the stars can be read." Fragments: success_at_cost, near_miss, failure.

No card's effect line shares a word with its name. No digits, no odds-talk. No rider, no cost channel and no grant on any special (the brief allows at most one Heavy Hand across the batch).

## 12. Linear continuation

Step 1: {cast:steward} rides out with {actor} to where the wagons left the north road. The old road is older than any town on it. Its marker stones are cut with star signs that nobody reads now, and the rumour in town is that the road goes wrong after dark. The steward says the house will remember who helped and who did not.

Step 2: At dusk the old road forks at the mouth of a cutting. One way runs down under the ground. Wagon tracks go both ways, and the party will not stay out after dark. {actor} has to pick the way by the stars before {cast:steward} turns the party back. Another night out could cost the house its caravan.

## 13. Aftermath Paragraph

Fallback: "The search is over, one way or the other. The house knows now what the old road did with its season." Each band overrides it with its own overview (see the ladder).

## 14. Aftermath Reaction Choices

Two stances on the fallback, inherited by every band:
- **Ride back into town beside the steward**: be seen with the house. `reputation_with` $cast:steward +0.04.
- **Copy down the marker signs before leaving**: keep what the stones taught, whatever the house makes of it. `intelligence` (trade_route, "The Old Road's Markers").

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) | Backing write |
|---|---|---|
| critical_success | BOND · thread; BOND · reputation with {target} ($cast:steward); PATH · seed | step 2 success: thread_strengthen, reputation_with +0.08, encounter_seed |
| success | BOND · thread; PATH · seed | same |
| success_at_cost | BOND · thread | same |
| failure | SCAR · reputation with {target}; SCAR · thread; PATH · seed | step 2 failure: thread_weaken, reputation_with −0.08, encounter_seed |
| critical_failure | SCAR · reputation with {target}; SCAR · thread | same |

Every chip caption is ≤15 words. The gate reports no 4-word overlap with its overview.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| steward (`merchant`) | lazy-materialize-on-trigger | reuse merchant/trader/innkeeper, else spawn `Oda Varrin` | must-persist | `reputation_with` edge | declared |
| `#explore` sequel | seed (query) | 41 live templates | seed | fires later, placeless | resolves |

## 17. Self-Audit

- Composition Contract: **PASS**. Systems: cast, rewards, seeds, reputation, content_query. Verified by running the check-encounter gate on the assembled package template.
- Consequence hand `story_seed` + `thread`: **PASS**. Both wired on the final step, both sides.
- Six StepOutcomes covered across fragments plus dealt fill: **PASS** (gate).
- Prose rule 7 / 7b: **PASS**. No agent history is asserted, and the seed promises no place. The chip says only "the roads will call on {actor} again".
- Chip nouns are sheet words (`thread`, `seed`, `reputation with {target}`): **PASS**.
- **FLAG (batch-level):** steps at 0.45/0.48 fail `NUDGE_OFF_REACH_MAX_DIFFICULTY` under `intrinsicTier: 'background'`. I set `shaping` with the reason recorded in the doc block. Slots 1, 5 and 6 carry steps at 0.48 to 0.50 and will hit the same rule.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (the steward named, the thread) · 11b YES · 12 YES (two reactions) · 13 YES (standing vs knowledge) · 14 YES (see art direction).

**Concept art direction.** Emotions: overdue, a season riding on a guess, the dark closing. Image: a star-cut marker stone at dusk on an empty paved road, with one set of wagon ruts turning off past it. No people.

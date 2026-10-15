# Encounter Pipeline: The Wool Buyers' Ring
> Scale: medium | Slug: wool-staple | Pass: revised
> Revisions applied: detector hits fixed (`the balance` ×3, `way`); card names moved onto the imperative lexicon (Stir Suspicion, Dull The Factor, Clean The Fleece, Steady The Scales) with effect lines reworded; Steady retyped Insurance → scene-scoped Boost (no rider, as the design block declares); "staple" → "wool market" and "factor"/"clip" glossed on player-facing surfaces; spine P2 restructured (seam echo with opening P3, 7b blame line now names the town); eight afterimage/fragment seam echoes rewritten; silk fee told once (chip only); s/sac/f/cf overviews and the sac reaction rewritten for the page read (repetition + pledge conflict).
> Date: 2026-10-15 | Pipeline version: 2.0
> Batch: master-everyday-3 (THR-1840), slot 2 — `encounter.town.wool_staple`

## Mechanical design block (designed before the prose)

```
Crux            The foreign wool buyers at the staple fair have agreed to bid one low price,
                and the wool guild has sent {actor} to break their ring and sell the town's clip.
Title           The Wool Buyers' Ring — the complication is in the title.
Whose problem?  The agent's: sent by name by the wool guild, which will blame them if the clip
                goes cheap. Scene-local; no prior tie asserted (prose rule 7).
Shape           Test & Consequence (binding row), linear, 2 steps. Step 0 continue_weakened
                (a step-0 critical_failure ends the action); step 1 fail_action with
                carryoverFactorLines keyed on step 0 — step 2 inherits how step 1 went.
Reach = theme?  Step 0 Gold 0.74 "Break the buyers' ring" — reading which buyer will defect is
                a merchant's read of price and nerve. Step 1 Gold 0.80 "Sell the clip" — closing
                sack by sack at the weighing house.
Rolled          plotHookRolled: hook.stronghold_mobilization, hook.negotiation_under_pressure,
                hook.meeting_to_keep · plotHookTaken: hook.negotiation_under_pressure.
                setting battlefield → overridden to urban (the weighing-house yard with the two
                parties drawn up) · p3Shape threat · opposition faction (orders: the buyers'
                compact) · disposition neutral · agentRole competitor · scale region.
Consequence hand (binding, THR-1145): possession + story_seed — no swap.
  possession    step 1 successMetadata attachment_grant reward_vestments_merchant_silks on
                $actor: the guild pays the master's fee in the dyed silk the buyers paid
                in kind. Existing possession template, unused by any encounter. BOON item chip
                on cs / s / sac. The pledge: success-band reaction "Sign the mayor's contract"
                and the sac reaction "Give the mayor the guild's pledge" grant
                agreement.treaty.trade with counterparty $cast:mayor (must-persist).
  story_seed    step 1 successMetadata encounter_seed templateId
                encounter.town.bell_at_the_exchange (exists, drawable, gold, urban, its own
                opening stands alone), placeless, delay 72, inheritContext. The ring's factor is
                cast key `buyer` — the key the exchange binds its merchant-house buyer to — so
                the inherited binding seats the same factor at the next bidding floor. PATH chip
                on cs / s / sac anchored through the carrier ($actor) and $cast:buyer.
Extras          reputation_with $here +0.08 (step 1 success) / -0.10 (step 1 failure) /
                -0.05 (step 0 failure: backs the critical_failure page on the step-0 route).
Cool failure    Nobody is hurt, jailed or branded. A master's failure costs the name: the town
                thinks less of their word on wool. It costs more because the guild sent them
                by name, at the last fair of the year.
Trait hooks     Gate: none. Variant: Greedy (trait.personality.gold.vice) +0.04 on both steps
                (template-level). Trait-only nudge: none. Trait fragment: none.
Systems quota   cast + rewards + seeds + reputation — four (floor 3).
Heavy Hand      none. Specials: Stir Suspicion (mind), Dull The Factor (entropy, opposes
                buyer), Clean The Fleece (life), Steady The Scales (matter). No card.boost.core
                special, no rider, no compulsion.
Choice?         None — this is a test & consequence. motivations name what the scene is about:
                loyalty_ambition (the guild's errand vs the master's own name), honesty_cunning
                (breaking a ring is quiet dealing).
```

## 1. Inspiration Anchors

- `hook.negotiation_under_pressure` (taken) — a deal struck against a clock with the other side
  holding the stronger hand. Here: a buyers' cartel and a fair that closes at sunset.
- `hook.meeting_to_keep` (rolled, not taken) — would want an appointment; slot 1 carries the batch's.
- `hook.stronghold_mobilization` (rolled, not taken) — survives only as the yard with the two
  parties drawn up, the rolled *battlefield* class.
- Anti-patterns avoided: the player choosing the mortal's words (the hand only shifts odds); a
  merchant scene told in ledger jargon ("staple", "factor" and "clip" are glossed or replaced on
  every player-facing surface); a seed promising a place (the factor *finds* the mortal).
- Not repeated from the board: save plate from bailiffs, win a salt licence, arbitrate a debt,
  bid at a mill lease. The verb here is *break a buyers' ring, then sell the town's clip*.

## 2. Scale Justification

Medium: two beats, linear, aftermath with reaction choices on the success side. It is a master's
errand — the whole year's wool of a town — but it touches one market day, so it stays `local`.

## 3. Pressure Knot

The fair is on its last day. The buyers from over the sea have agreed among themselves to bid one
price and no higher. Their factor keeps them to it. At that price the shepherds cannot pay rent.

## 4. Intervention Fantasy

The god works on nerves and wool: a fear that another buyer will defect first, a factor who tires
in the heat, fleeces that open clean under the knife, scales that will not lie. The mortal does
the dealing; the god tilts the room.

## 5. Cast and World Objects

| Object | Role | Anchor |
|---|---|---|
| `{cast:buyer}` (Pieter Holm) | the ring's factor; step 0's named person; the seed's carried cast | `$cast:buyer` |
| `{cast:mayor}` (Agnes Fallow) | the staple's mayor, holds the scales; step 1's named person; treaty counterparty | `$cast:mayor` |
| the town (`$here`) | reputation channel | `$here` |
| Merchant Silks | the master's fee, paid in kind | `reward_vestments_merchant_silks` |
| Trade Treaty | the pledge to the market | `agreement.treaty.trade` |
| The Last Lot at the Exchange | the factor's return | `encounter.town.bell_at_the_exchange` |

## 6. Beat Structure

1. **Break the buyers' ring** (gold 0.74, continue_weakened). Find the buyer who will break.
2. **Sell the clip** (gold 0.80, fail_action, carryover from beat 1). Sell sack by sack at the
   weighing house before the mayor closes the scales.

## 7. Branching Profile

Linear — no branching. The second step inherits the first through carryover factor lines.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | clip sold well above the ring's price; the guild praises the master by name | nothing | silk fee, town's regard, the factor comes back to bid against them |
| success | clip sold above the ring's price | nothing | silk fee, town's regard, the factor's return |
| success_at_cost | clip sold above the ring's price, after the mayor kept the scales open late | the mayor wants the guild's next clip promised to the market | silk, regard, return; a pledge to make or refuse |
| failure | clip sold at the ring's price | the town's regard | — |
| critical_failure | buyers walk; half the clip goes home unsold | the town's regard | — |

## 9b. Stakes Line

```
goal:      break the buyers' ring and sell the town's wool
risk:      send half the town's clip home unsold
won:       broke the buyers' ring and sold the town's wool
lost:      sold the town's wool at the ring's price
lostBadly: sent half the town's clip home unsold
```

## 10. Sample Opening (urban — the only class)

> {actor} arrives at the wool market in {location} on the last day of the fair, sent by the wool guild.
>
> The town's whole year of wool, the clip, is for sale. The buyers from over the sea have agreed to bid one price and no higher. {cast:buyer}, the factor who speaks for the buyers, holds them to it.
>
> At that price the shepherds cannot pay their rents. {actor} has to break the ring before the fair closes.

75 words across opening + step-0 spine.

## 11. The Hand Per Step

### Step 0 — Break the buyers' ring (gold 0.74)

`deal: { count: 4, tags: ['social', 'shadow'] }` + 2 specials → composed 6.

- **Stir Suspicion** — Whisper · mind · essence 2 · Δ 0.10 · `generic.rumor`
  - effectLine: "Wake each buyer's fear that another will break the ring first. Each one is tempted to seek a private sale."
  - critical_success: "Every buyer came to suspect the others of dealing in secret."
  - success: "The buyers began to watch each other instead of the wool."
  - near_miss: "The buyers eyed each other all morning, and no second buyer broke."
  - failure: "The buyers grew wary of each other, and still none would bid alone."
- **Dull The Factor** — Stumble · entropy · essence 1 · Δ 0.08 · opposes `buyer` · `generic.decay`
  - effectLine: "Tire the ring's leader through the long fair day. They stop watching which buyer talks to whom."
  - success: "{cast:buyer} sat down in the afternoon heat and missed a buyer slipping off to the guild's table."
  - success_at_cost: "{cast:buyer} dozed in the afternoon heat and woke too soon."
  - failure: "{cast:buyer} nodded off, and the buyers stayed loyal with no one watching."
  - critical_failure: "{cast:buyer} grew tired and short-tempered, and threatened any buyer who left the ring."

Band coverage: cs, s, nm, f (Stir) + s, sac, f, cf (Dull) — all six.

### Step 1 — Sell the clip (gold 0.80)

Spine:

> The sale is held in the weighing-house yard, with the guild's men on one side and the buyers on the other. {cast:mayor}, mayor of the wool market, weighs and seals each sack at the price agreed.
>
> The scales close at sunset. {actor} must sell the whole clip above the ring's price by then. If the wool goes cheap, the town will blame the one the guild sent.

`deal: { count: 4, tags: ['social', 'craft'] }` + 2 specials → composed 6.

- **Clean The Fleece** — Boost (scene-scoped) · life · essence 2 · Δ 0.12 · `generic.vigor`
  - effectLine: "Make each bale open soft and white under the knife. Every buyer at the scales sees good wool."
  - critical_success: "Each bale opened clean and soft, and the buyers stopped haggling over quality."
  - success: "The wool opened clean, and the buyers paid for its quality."
  - near_miss: "The wool opened clean, but the buyers still bid low on the last bales."
  - failure: "The wool opened clean and soft, and the buyers would not pay a penny more for it."
  - critical_failure: "The buyers would not even cut the last bales open to look."
- **Steady The Scales** — Boost (scene-scoped; no rider — retyped from Insurance in Pass 2) · matter · essence 1 · Δ 0.08 · `generic.matter`
  - effectLine: "Make every sack weigh true at the weighing house. No buyer can claim short weight to cut the price."
  - success: "The scales held true, and no buyer could claim short weight."
  - success_at_cost: "The weights held true, and the buyers argued every sack until dark."
  - failure: "The scales held true, and the buyers bargained the price down by the sack."

Band coverage: cs, s, nm, f, cf (Clean) + s, sac, f (Steady) — all six. Two scene-scoped Boosts
in one hand buy different certainties (wool quality vs honest weight).

### Afterimages

Step 0:
- cs: "Two buyers broke from the ring before noon, each asking for a private price."
- s: "One buyer broke from the ring and asked for a private price."
- nm: "One buyer agreed to bid above the ring, but only if the others did not see."
- sac: "One buyer broke from the ring, but {cast:buyer} saw which one."
- f: "The ring held, and the buyers kept to their one price."
- cf: "The ring held, and the buyers left the market to wait for the price to fall."

Step 1:
- cs: "The buyer who broke the ring bid high, and the others followed to keep their share. {cast:mayor} sealed every sack before sunset."
- s: "The buyers bid past the ring's price, and {cast:mayor} sealed every sack."
- nm: "The clip sold a little above the ring's price, and {cast:mayor} sealed it."
- sac: "The clip sold above the ring's price, but only because {cast:mayor} kept the scales open past sunset."
- f: "{cast:mayor} sealed the clip at the ring's price."
- cf: "The buyers walked away from the scales before the last sacks were weighed."

Carryover factor lines on step 1 (keyed on step 0):
- cs: "Two buyers have broken from the ring." (for, +0.06)
- s: "One buyer has broken from the ring." (for, +0.04)
- sac: "The ring's factor knows who broke." (against, -0.02)
- nm: "The only buyer who broke wants it kept quiet." (against, -0.03)
- f: "The ring is holding." (against, -0.04)

## 12. Linear continuation

See step 1's spine above: what changed (the ring holds or cracks), what it cost, what is asked now.

## 13. Aftermath Paragraphs (overviews)

- cs: "The town's clip sold well above the ring's price, and the shepherds have their rent money. The wool guild praised {actor} by name at the close of the fair."
- s: "The town's wool is sold, and the shepherds can pay their rents."
- sac: "The shepherds can pay their rents. {cast:mayor} now wants the guild's next clip promised to this market."
- f: "At the ring's price the shepherds cannot pay their rents. The guild had sent {actor} by name to break the ring."
- cf: "Half the town's clip went back to the sheds unsold, and the shepherds cannot pay their rents. The guild had sent {actor} by name."

## 14. Aftermath Reaction Choices

- cs / s:
  - "Sign the mayor's contract" — "The mortal binds their own trade to this market. The mayor holds the paper." → `attachment_grant agreement.treaty.trade`, counterparty `$cast:mayor`.
  - "Make peace with the ring's factor" — "The mortal stands the factor a meal and talks of next year. The factor is less sour toward the mortal." → `bond_change $cast:buyer` sentiment +0.08, trust +0.05.
- sac:
  - "Give the mayor the guild's pledge" — "The mortal signs the paper for the guild. The mayor holds the guild to it." → treaty with `$cast:mayor` + `reputation_with $here +0.04`.
  - "Refuse the pledge" — "The guild stays free to sell where it likes. The mayor takes it badly." → `bond_change $cast:mayor` sentiment -0.08.
- f / cf: no reaction choices — the consequence is clean.

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| cs | — | — | Merchant Silks · reputation with {location} | seed: the ring's factor |
| s | — | — | Merchant Silks · reputation with {location} | seed: the ring's factor |
| sac | — | — | Merchant Silks · reputation with {location} | seed: the ring's factor |
| f | reputation with {location} | — | — | — |
| cf | reputation with {location} | — | — | — |

Chips:
- Silks (boon): causeClause "The guild's fee, paid in kind" · detail "{actor} holds dyed silk the buyers paid." (13 words)
- Town (boon): detail "{location} trusts {actor} to sell its wool." (7)
- Seed (path): causeClause "Beaten at the wool market" · detail "{cast:buyer} will come to bid against {actor} again." (13)
- Town (scar, f/cf): detail "{location} thinks less of {actor}'s word on wool." (8)

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| `buyer` (ring's factor) | lazy-materialize-on-trigger | reuse merchant/trader/broker, spawn merchant "Pieter Holm" | must-persist | bell_at_the_exchange via inheritContext | live |
| `mayor` (staple's mayor) | lazy-materialize-on-trigger | reuse official/elder/noble, spawn official "Agnes Fallow" | must-persist | treaty counterparty | live |
| Merchant Silks | grant | reward-attachment-catalog | persistent possession | sheet | live |
| Trade Treaty | grant (reaction) | agreement-reward-catalog | 96-tick term | sheet | live |
| seed → bell_at_the_exchange | encounter_seed | registered template | placeless, 72 ticks | the factor returns | live |

## Concept Art Direction

1. Emotions: a year's work weighed against a closed hand of buyers; leverage; the relief of a
   price holding.
2. Image: an empty weighing-house yard at dusk — a great iron balance at rest with one pan
   low, wool sacks stacked and sealed with red wax, a bolt of saffron silk laid across one
   sack. No people.

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope declared, one opening per class | PASS (urban) |
| Opening + spine ≤80 words | PASS (75) |
| Purpose lines ≤4 words | PASS ("Break the buyers' ring", "Sell the clip") |
| No static factor lines | PASS (carryover + trait variant only) |
| Hands 4–8 composed, ≥4 spheres, ungated common | PASS via deal fill (count 4 each) |
| Every special ≥1 failure fragment; no Δ ≥ 0.15 | PASS |
| Six bands covered per step | PASS |
| No digits / % in effect lines; no name word repeated | PASS |
| Card names open with a verb in `IMPERATIVE_VERB_LEXICON` | PASS (stir, dull, clean, steady) |
| Vagueness lexicon (outcome fields) / annotation ≤1 | PASS (0 / 0) |
| Consequence hand wired (possession + story_seed) | PASS |
| Chips backed by writes on their band (Law 56) | PASS |
| Chip nouns are sheet words | PASS (Merchant Silks, reputation with {location}, seed) |
| Seed promises no place (7b) | PASS (the factor comes to them) |
| Cast must-persist for the treaty counterparty | PASS |
| Systems ≥3 | PASS (4) |

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (ring, factor, mayor, scales, wool all named before cards) · 4 YES ·
4b YES (opening→spine and afterimage→fragment seams rewritten in Pass 2) · 5 YES · 6 YES ·
7 YES · 8 YES (each special acts on the buyers, the factor, the wool or the scales) · 9 YES
(nerve of buyers / factor's watch / wool quality / honest weight) · 9b YES · 10 YES · 11 YES ·
11b YES (page read per band in `wool-staple-editorial.md` § 6b) · 12 YES · 13 YES (bind to the
market vs mend the rival; pledge vs freedom) · 14 YES.

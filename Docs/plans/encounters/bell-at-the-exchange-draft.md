# Encounter Pipeline: The Bell at the Exchange
> Scale: local (short) | Slug: bell-at-the-exchange | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.bell_at_the_exchange` · Batch: journeyman-everyday-1, slot 5 (THR-1676) · Package: `Docs/plans/encounters/bell-at-the-exchange.package.json`

## 1. Inspiration Anchors

- **Brief row (binding):** gold 0.40 → gold 0.48, `urban`, query-prize shape, hand `possession` + `drive`, rarity 2, scale local. Rolled: p3 contest, opposition time (the bell), disposition n/a, role trespasser, scale company.
- **Plot hook taken:** `hook.scarcity_crisis` ("there is not enough, there will not be enough"). It becomes a thin trading season: few cargoes came in, the floor has sold almost nothing all week, and one lot is left. Scarcity is why a merchant house wants this lot and why a stranger bidding on it is trespassing. The other two rolls (`hook.blame_falls_on_outsiders`, `hook.assassination_succeeded`) would both have pulled the slot grim; the brief asks this one to be the batch's pleasure.
- **Structural models:** `tithe-demanded.package.json` (two-step gold scene, step-metadata consequences, `plant_compulsion` shape), `the-garrisons-price.ts` (the `compulsion` chip form, `stateNoun: { text: 'compulsion', tooltipId: 'ui.compulsion' }`).
- **Anti-patterns avoided:** no personal condition on the mortal as the failure penalty (the brief's cap); no rule gate (no guild rank, no faction meta); no fiction-named prize (the lot is drawn, so the prose never names what is in it).

## 2. Scale Justification

Local, as the brief fixes. The stakes are a merchant house's lot and the agent's standing with its buyer: a company-scale contest in one room, settled in one hour. Journeyman weight lives in who is across the floor, not in the size of the world touched.

## 3. Pressure Knot

A thin season. The exchange has sold almost nothing all week, the merchant houses treat the floor as their own, and the last lot is on the block with the closing bell an hour off. A house buyer who knows every bidder in the room means to take it.

## 4. Intervention Fantasy

The god works the room from outside it: a memory of last season's price arriving in time, a rival's tally scrambled for one raise, a bell ringer's hand slowed on the rope. The mortal still bids; fate still rolls who holds the last bid.

## 5. Cast and World Objects

| Object | What it is | Wiring |
|---|---|---|
| `{cast:buyer}` — Wenna Castrell (spawn name) | A merchant house's buyer; knows the room | `supportBundle` actor, `must-persist`, reuse `merchant`/`trader`/`noble` (seeded at town/city/capital), spawn `merchant`. Never gendered in prose. |
| The lot | Whatever the world's exchange has in the `#trade` item family | `reward_draw` pool `{ categoryWeights: { possession: 1 }, tagFilters: ['#trade'] }` → projects onto `{ kind: 'item_template', tags: ['#trade'] }`. Live members: Merchant Silks, Hardtack and Salt, Traveler's Wine, Trade Route Dossier, Quartermaster's Harness, plus generator `merchant` cores. |
| The bell | The opposition (time) | Scene-local; carried in prose and the `Hold The Bell` special. |
| Standing with the buyer | `reputation_with` `$cast:buyer` | +0.05 on step-1 success, −0.04 on step-1 failure. |
| The lean toward the next deal | `plant_compulsion` `trade`/`acquire` | Step 0 failure (72 ticks), step 1 failure (96 ticks). |

## 6. Beat Structure

1. **Price the lot** — gold 0.40, `continue_weakened`. Nobody on the floor says what the lot is worth; the agent has to know where to stop. A failure sends them into the bidding with no figure (the compulsion fires here).
2. **Win the bidding** — gold 0.48, `fail_action`. The buyer answers every bid with a small raise; the price is already past last season's; the ringer has a hand on the rope. Success draws the prize.

Mean difficulty 0.44, as the brief row.

## 7. Branching Profile

Linear — no branching. Test & Consequence (step 0 carries into step 1 through `continue_weakened`), composed with the `query_prize` face.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The lot, at a fair price; best draw of the tier curve | An hour | Buyer rates them (standing +) |
| success | The lot | An hour | Buyer thinks better of them (standing +) |
| success_at_cost | The lot, at the top of the bidding | Well past its worth — usually because step 0 failed and the compulsion already fired | Standing + with the buyer; the lean toward the next deal is on the sheet from step 0 |
| failure | None — the house takes the lot | The house paid more because of them | Compulsion (trade/acquire), standing − with the buyer |
| critical_failure | None | They pushed the house to its season high and let it win | Compulsion, standing −; the floor knows them |

Cool failure: nobody is hurt, held or branded. Money, standing and time.

## 10. Sample Opening

> {actor} walks onto the exchange floor in {location} an hour before the closing bell.
>
> Few cargoes came in this season, and the floor has sold almost nothing all week. One lot is left on the block.
>
> The merchant houses treat this floor as their own. {cast:buyer} is bidding for one of them and knows every bidder in the room except {actor}. Whoever holds the last bid when the bell rings takes the lot.

(73 words; the second and third paragraphs are step 0's `narrativeTemplate`.)

## 11. The Hand Per Step

**Step 0 — Price the lot** · `deal: { count: 5, tags: ['insight', 'social'] }` + 1 special

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Recall The Price | Whisper | mind | 2 essence | 0.12 | Bring back what a lot like this one sold for last season, so they know a fair figure when they hear it. |

Fragments: success · near_miss · failure.

**Step 1 — Win the bidding** · `deal: { count: 4, tags: ['social', 'presence'] }` + 2 specials

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Jumble The Count | Stumble | chaos | 2 essence | 0.13 | Scramble the rival buyer's tally of the bids, so one raise goes by unanswered. |
| Hold The Bell | Long Game | time | 2 essence | 0.12 | Slow the ringer's hand on the rope, so the bidding runs long enough for one more raise. |

Fragments: Jumble — critical_success · success · failure; Hold — success_at_cost · failure · critical_failure. `Hold The Bell` cuts both ways on purpose: time given to the agent is also time given to the house.

No core Boost special, no rider special (the deal supplies both), no over-exposed signature card. Specials answer different questions (the price · the rival · the clock); the dealer supplies sphere breadth and the ungated common option.

## 12. Linear continuation

> The bidding opens. {cast:buyer} answers every bid with a small raise and never looks at the lot. The price passes what a lot like it fetched last season. The bell ringer already has a hand on the rope.

## 13. Aftermath Paragraph

Fallback overview: *The bell has rung and the block is empty. The floor is counting the day's takings.* Each band overrides it (see the package `byOutcome`); critical_success is the batch's lively beat: the house buyer bows to the stranger in front of the whole floor.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Local scale; every write fires from step metadata, and the player's decisions were the cards.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon order) | Backing write |
|---|---|---|
| critical_success | BOND · reputation with {target} (gain) · BOON · trade goods | step 1 success: `reputation_with`, `reward_draw` |
| success | BOND · reputation with {target} · BOON · trade goods | same |
| success_at_cost | BOND · reputation with {target} · BOON · trade goods | same (the step-0 compulsion fires too, un-chipped: the success-side face cannot claim a failure-half write) |
| failure | SCAR · compulsion · BOND · reputation with {target} (loss) | step 1 failure: `plant_compulsion`, `reputation_with` |
| critical_failure | SCAR · compulsion · BOND · reputation with {target} (loss) | same |

Fallback carries the uncategorised gold-reach growth line.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `buyer` (house buyer) | lazy-materialize-on-trigger | reuse merchant/trader/noble, else spawn merchant "Wenna Castrell" | must-persist | `reputation_with` edge target | ready |
| The lot | drawn at resolution | `#trade` item_template query | persists as possession on `$actor` | sheet | ready (≥5 members) |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / difficulty exactly as brief | PASS | gold 0.40 → gold 0.48 |
| Setting envelope + one opening per class | PASS | `urban` only |
| Cast bound, token keys declared | PASS | `buyer` |
| Hand rules (specials ≤2, deal declared, failure fragments) | PASS | 1 + 2 specials, every special has a failure fragment, no Δ ≥ 0.15 |
| Consequence hand wired | PASS | possession → `reward_draw`; drive → `plant_compulsion` |
| Query prize | FLAG | `reward_draw` has no `query` field in the live type (`src/types/unifiedAction.ts`, `pool: RewardPoolRecipe`). The recipe *is* the item query (`rewardPool.ts toContentQuery` → `{ kind: 'item_template', tags: ['#trade'] }`). The composition census counts `content_query` only off an `encounter_seed` query, so this slot will not register in the batch report's query census unless a seeded query is added. |
| Rewards persist | PASS | `reward_draw` |
| Systems quota | PASS | cast + rewards + reputation = 3 |
| byOutcome floor | PASS | five bands |
| Chip nouns = sheet words, ≤15 words, no 4-word overview overlap | PASS | checked by script |
| Law 56 backing per band | PASS | see kit table |
| No personal condition, no rule gate | PASS | |
| Word budgets | PASS | opening 73; bands ≤60; fragments ≤25; effect lines ≤25 |
| Machine gates | PENDING | dry-run compile clean; `check:encounter` runs at compile |

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES (price, rival, bell all established) · 9 YES · 9b YES · 10 YES · 11 YES (`{cast:buyer}` named on every chip it anchors) · 11b YES (page-read; overlaps removed) · 12 N/A (local scale, no reactions) · 13 N/A · 14 YES — concept art: an empty auction block and a bell rope still swinging, a single chalked figure on a slate. Residue of a win or a loss, no people.

# Encounter Pipeline: The Salt Monopoly
> Scale: short (local) | Slug: salt-monopoly | Pass: draft
> Date: 2026-10-14 | Pipeline version: 2.0
> Batch: master-everyday-2 (THR-1757), slot 2 · templateId `encounter.town.salt_monopoly` · reach gold

## 0. Mechanical design block (designed before the prose)

```
Crux            The duke's chancery is selling the region's salt licence for ten years, and
                {actor} must win it for the town against a rival town's salt house.
Title           The Salt Monopoly — states the objective (the licence is a monopoly on salt).
Whose problem?  The agent's: sent by name by the town council, which will blame them if the
                salt goes to the rival. Scene-local; no prior tie to any graph agent asserted.
Reach = theme?  Step 0 Gold 0.74 reads the room and builds the purse from the council's
                backers. Step 1 Gold 0.80 closes the bid at the clerk's table, above the duke's
                sealed reserve and above the rival. Mean 0.77, window fit 0.91 (master band).
Shape           Seeded Sequel on a Test & Consequence spine, linear (branch count 0).
                Step 0 continue_weakened (a step-0 critical_failure ends the action);
                step 1 fail_action, carryover lines keyed on step 0.
Catalog picks   setting urban (rolled sacred → the chancery in the cathedral close) ·
                pressure deadline (the bids are called today) · objective win · stakes
                the town's trade for ten years · system carryover (rolled).
Rolled dice     p3 opportunity · opposition law (duty: the clerk and the sealed reserve) ·
                disposition wary · agentRole the_target (the one the council will blame) ·
                scale company (a salt house) → settlement stakes in prose.
Hook            plotHookRolled: hook.underground_city, hook.artifact_recovery,
                hook.deck_reading_gone_wrong.
                plotHookTaken: hook.artifact_recovery — read as recovering a lost instrument
                of power for the town: the licence and its seal case. The other two fight
                an everyday chancery bid (a buried city, a fortune-teller) and are declined.
Consequence hand (binding, THR-1145): possession + story_seed — no swap.
  possession    step 1 successMetadata: attachment_grant reward_tools_instruments_gate_seal_case
                on $actor — the licence-holder's seal case (wax, chalk, the customs stamp that
                marks lawful salt). An existing possession template; no new item id. BOON item
                chip on cs / s / sac. The pledge half of the brief: the sac reaction
                "Take the debt on yourself" grants agreement.debt.minor, counterparty
                $cast:clerk (the unpaid part of the price).
  story_seed    step 1 successMetadata: encounter_seed templateId
                encounter.town.mill_lease_auction (exists, drawable, urban+rural, gold),
                placeless, delayTicks 72, inheritContext true. The rival factor's cast key
                is `merchant`, the same key the mill lease binds its rival grain merchant to,
                so the inherited binding puts the same factor across the next bidding table:
                the losing house does not forget. PATH chip on cs / s / sac.
Extras          reputation_with $here +0.08 (step 1 success) / -0.10 (step 1 failure) /
                -0.05 (step 0 failure: backs the critical_failure page on the step-0 route).
Cool failure?   Nobody is hurt, jailed or branded. A master's failure costs the name before the
                purse: the council sent them by name, and the town's regard for their word on
                money falls.
Trait hooks     Gate: none. Variant: Monopolist (trait.reputation.monopolist) +0.04 —
                a mortal known for cornering trade knows how a cornered trade is priced.
                Trait-only nudge: none. Trait fragment: none.
Systems quota   cast + rewards + seeds + reputation — four.
Heavy Hand      none. Specials: Embolden The Backers (spirit), Muddle The Count (chaos,
                opposes merchant), Weigh The Coin True (order), Stretch The Hour (time).
                No card.boost.core special; no rider special; no compulsion.
```

### The narrator's 12 questions, answered

1. P1 arrival? `{actor} arrives at the duke's chancery in the cathedral close of {location}, sent by the town council.`
2. P2 events? The duke sells the salt licence for ten years; the chancery takes bids today; a rival town's salt house has sent its factor with a heavy purse.
3. P3 one stake? Opportunity: the backers pledge only what they think can win; build a purse big enough before the bids are called.
4. ≤80 words? Opening 17 + step-0 spine 58 = 75.
5. Read aloud? Every sentence is a report.
6. Stated, never encoded? The reserve, the rule of the seal and the blame are stated.
7. Every sentence works? Challenge, test or outcome.
8. Nothing unintroduced? Licence, chancery, rival house, factor, backers and purse before any card; the clerk and the sealed reserve in step 1's spine before its cards act on them.
9. One named person per beat? Step 0 `{cast:merchant}`; step 1 `{cast:clerk}`.
10. Stake in a sentence? "Outbid the rival salt house, above the duke's reserve, before the clerk seals the licence."
11. Cards verb+noun, spell-style? Yes; no name word repeated in its effect line; no digits.
12. Opening per class? urban, the only class, written.

## 1. Inspiration Anchors

- Model package `cathedral-loan` (gold master, batch 1): copied for structure only — two gold steps, continue_weakened then fail_action, carryover lines, a step-1 prize, `reputation_with $here`, a success_at_cost debt reaction. Its verb (save plate from bailiffs) is not repeated.
- Gold experts on the board: `debt-arbitration` (arbitrate a debt) and `mill-lease-auction` (bid at a mill lease). This verb is different — win a monopoly at a ducal chancery against a rival town — and the mill lease becomes the sequel, so the expert scene is reused as the place the grudge comes back.
- Anti-patterns avoided: no rule gate (no guild rank), no fight, the god never instructs the mortal or picks the ending.

## 2. Scale Justification

Local scale, two beats. The stake is a town's trade for ten years, which is settlement-sized, but the scene is one morning at one table. A master is sent for by name; the weight sits in who is across the table (the rival house) and who enforces the rule (the clerk), not in more beats.

## 3. Pressure Knot

The duke needs money and is selling the salt licence. A rival town's salt house has already come with a heavy purse. The clerk will seal the licence today to the best bid above the duke's reserve, whoever makes it.

## 4. Intervention Fantasy

The god leans on purses and on the clock: the backers' pride, the rival's count, the weight of the town's silver on the clerk's scales, the bell that ends the bidding. Fate rolls whether the town's bid stands highest.

## 5. Cast and World Objects

| Object | What it is |
|---|---|
| `{cast:merchant}` | the rival salt house's factor (key `merchant`, reuse merchant / trader / broker, spawn "Isolde Varne") |
| `{cast:clerk}` | the duke's chancery clerk, who holds the sealed reserve (reuse clerk / scribe / steward, spawn "Matthias Penrose") |
| `reward_tools_instruments_gate_seal_case` | the Gate Seal Case — the licence-holder's wax, chalk and customs stamp |
| `agreement.debt.minor` | the unpaid part of the price, on the sac reaction |
| `encounter.town.mill_lease_auction` | the sequel: the same factor bids against the mortal again |
| `$here` | the town's regard for the mortal's word on money |

## 6. Beat Structure

- Step 0 — gold 0.74, "Build the town's purse": the backers pledge, the rival watches.
- Step 1 — gold 0.80, "Close at the clerk's table": the bids are opened against the reserve.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | licence sealed to the town by a wide margin | nothing | Gate Seal Case; town regard up; the factor comes back at the next lease |
| success | licence sealed to the town | the purse | as above |
| success_at_cost | licence sealed, part of the price still owed | the purse and more | the debt (reaction); town regard up; seed |
| failure | licence sealed to the rival | the morning | town regard down |
| critical_failure | the town's purse falls short before the council | the council's trust | town regard down hard |

### Stakes Line

```
goal:      win the duke's salt licence for the town
risk:      see the town's purse fall short before the council
won:       won the duke's salt licence for the town
lost:      lost the salt licence to the rival town
lostBadly: saw the town's purse fall short before the council
```

## 10. Sample Opening (urban)

> {actor} arrives at the duke's chancery in the cathedral close of {location}, sent by the town council.
>
> The duke is selling the salt licence for ten years, and his chancery takes bids today. A rival town's salt house has sent {cast:merchant}, its factor, with a heavy purse.
>
> The council's backers will pledge only what they think can win. {actor} has to read the room and build a purse big enough before the bids are called.

## 11. The Hand Per Step

### Step 0 — "Build the town's purse" (gold 0.74) · deal { count 4, tags social, insight }

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Embolden The Backers | Whisper | spirit | 2 | 0.10 | Fill the council's moneyed men with civic pride. They pledge more of their own silver to the purse. |
| Muddle The Count | Stumble | chaos | 1 | 0.08 | Tangle the rival factor's reckoning of their own coin. They bid as though their chest held less than it does. |

Band fragments:
- Embolden The Backers — cs: The backers pledged their silver loudly, each trying to give more than the last. · s: The backers pledged more than they had meant to, for the town's name. · near_miss: The backers grew proud of the town, but pledged little more than before. · failure: The backers talked proudly of the town, and kept their silver in their purses.
- Muddle The Count — s: {cast:merchant} counted the rival purse twice, and held back a bid that would have won the room. · sac: {cast:merchant} lost the count, but saw how much the town's backers had pledged. · failure: {cast:merchant} lost the count once, found the error, and bid the full purse anyway. · cf: {cast:merchant} found the error aloud, and the backers saw how rich the rival house was.

### Step 1 — "Close at the clerk's table" (gold 0.80) · deal { count 4, tags social, presence }

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Weigh The Coin True | Signature | order | 2 | 0.12 | Make every piece in the town's purse ring full on the clerk's scales. None of it is set aside as clipped or light. |
| Stretch The Hour | Long Game | time | 1 | 0.08 | Hold back the chancery bell while the last bids are read. The clerk hears every offer before the seal is set. |

Band fragments:
- Weigh The Coin True — cs: Every piece rang full on the scales, and the clerk counted the town's purse at its whole worth. · s: None of the town's silver was set aside, and the purse counted whole. · near_miss: The silver rang full, but the clerk still set a few worn pieces aside. · failure: The town's silver counted whole, and the rival's purse still counted more. · cf: The silver counted whole, and the whole of it still fell under the duke's reserve.
- Stretch The Hour — s: The bell rang late, and the clerk heard the town's last offer before the seal was set. · sac: The bell rang late, and the rival used the time to raise as well. · failure: The bell rang late, and the extra time served the rival's purse better than the town's.

Carryover lines (step 1, keyed on step 0): cs "The council's backers pledged more than was asked." (+0.06) · s "The town's purse is big enough to bid." (+0.04) · sac "The rival factor knows what the town has pledged." (−0.02) · near_miss "The backers pledged less than was asked." (−0.03) · failure "The town's purse is thin." (−0.04).

## 12. Linear continuation (step 1 spine)

> {cast:clerk}, the chancery clerk, holds the duke's sealed reserve, the lowest price the duke will take. The clerk will seal the licence to the best bid at or above it, and to nobody else.
>
> {actor} has to close at the clerk's table above both the reserve and the rival's bid. If the salt goes to the rival town, the council will blame the one it sent.

### Afterimages

Step 0 — cs: The backers saw the room clearly, and pledged more than the council had asked. · s: The backers pledged enough to bid against the rival house. · sac: The backers pledged enough, but the rival factor saw exactly how much. · failure: The backers held back, and the town's purse came up thin. · cf: The backers walked out, and the rival factor heard how little the town had.

Step 1 — cs: The town's bid cleared the reserve and the rival's by a wide margin, and the clerk sealed the licence at once. · s: The town's bid cleared the reserve and beat the rival's, and the clerk sealed the licence to the town. · sac: The town's bid cleared the reserve only with part of the price left owing to the chancery. · failure: The rival's bid stood highest, and the clerk sealed the licence to the rival town. · cf: The town's bid fell under the duke's reserve, and the clerk sealed the licence to the rival at once.

### Narrative templates

- initiation: The duke's chancery is selling the region's salt licence for ten years. {actor} has been sent by the town council to win it.
- success: {actor} won the duke's salt licence for the town.
- failure: The salt licence went to a rival town, and {actor} could not stop it.

### Description (player prose)

The duke's chancery is selling the licence to the region's salt for ten years, and a rival town's salt house has come with a heavy purse. The licence goes to the best bid above the duke's sealed reserve.

## 13. Aftermath Paragraph (per band)

- fallback: {actor} left the chancery once the clerk had sealed the licence.
- critical_success: The salt of the whole region is the town's for ten years. The council read the duke's seal aloud in the square, with {actor}'s name beside it.
- success: The salt of the region is the town's for ten years, and the council knows who won it.
- success_at_cost: The licence is the town's, but part of the price is still owed to the chancery, and the backers want their silver back.
- failure: A master is sent for to win. The council sent {actor} by name, and the salt has gone to the rival town for ten years.
- critical_failure: The salt has gone to the rival town for ten years, and the whole council saw the town's purse fall short. {actor} was the one it sent.

## 14. Aftermath Reaction Choices

- cs / s: **Offer the losing house the carting** — give the rival house the work of carting the town's salt; the factor thinks better of the mortal (bond_change $cast:merchant +). **Keep every cart for the town** — the town's carters keep the work; the town thinks better of the mortal and the factor takes against them. (Magnanimity to a beaten rival vs loyalty to the ones who sent you.)
- sac: **Take the debt on yourself** — the mortal owes the chancery the unpaid price (agreement.debt.minor, counterparty $cast:clerk); the town thinks better of them. **Leave the debt with the council** — none of it falls on the mortal; the town thinks less of them. (Carry the cost yourself vs let the ones who sent you pay.)
- failure / cf: no reaction choices — consequence is clean.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) |
|---|---|
| cs | BOON item Gate Seal Case · BOON reputation with {location} · PATH seed (the factor at the next lease) |
| s | same three |
| sac | same three |
| failure | SCAR reputation with {location} |
| cf | SCAR reputation with {location} |

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| merchant (rival factor) | lazy-materialize-on-trigger | reuse merchant/trader/broker, spawn Isolde Varne | must-persist | the mill-lease sequel binds the same key | ready |
| clerk | lazy-materialize-on-trigger | reuse clerk/scribe/steward, spawn Matthias Penrose | must-persist | debt counterparty | ready |
| Gate Seal Case | attachment_grant | `reward_tools_instruments_gate_seal_case` | must-persist | bearer's possessions | built |
| debt | attachment_grant | `agreement.debt.minor` | must-persist | bearer's agreements | built |
| sequel | encounter_seed | `encounter.town.mill_lease_auction` | must-persist | pending seed | built |

## 17. Self-Audit

- Composition: steps 2 (PASS) · hand per step 2 specials + deal 4 (PASS) · setting urban + opening (PASS) · cast 2 bound (PASS) · rewards attachment_grant + seed (PASS) · aftermath 5 bands + fallback (PASS) · systems 4 (PASS) · images generic.* (PASS) · stakes (PASS).
- Law 56: every chip backed by a step-1 write on its band; the critical_failure step-0 route is backed by step 0's -0.05 (PASS).
- Prose rule 7: nothing asserts history. Rule 7b: the PATH chip promises the factor at the next lease; the seed with inheritContext and the shared `merchant` key performs it (PASS).
- FLAG: the Muddle The Count sac fragment and the step-0 sac afterimage both say the factor saw what the town pledged (echo risk; see revision).
- FLAG: the step-1 cf afterimage says the bid fell under the reserve, but the cf aftermath can also be reached on the step-0 route, where the backers walked out; the overview must cover both.

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (pride / the rival's count / the weight of coin / the clock) · 9b YES · 10 YES · 11 YES · 11b see revision (echo flag) · 12 YES · 13 YES · 14 YES.

## Concept Art Direction

Emotions: a whole town's living staked on one sealed number; a rival who lost and will remember. Image: a cooled red wax seal broken in two on a bare chancery table, a few grains of salt spilled beside it, an empty scale pan raised. No people.

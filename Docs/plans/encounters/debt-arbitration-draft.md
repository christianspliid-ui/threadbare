# Encounter Pipeline: The Debt Arbitration
> Scale: short | Slug: debt-arbitration | Pass: draft
> Date: 2026-09-30 | Pipeline version: 3.0 (Encounter Factory) | Batch: expert-everyday-1, slot 1 (THR-1678)

## 0. Mechanical design block (designed before the prose)

```
Crux            A banking house will not pay {actor}'s bill in full, and the only way to be
                paid in full is to call an arbitration that must run to a ruling, against a
                noble who wants the same pledge.
Title           The Debt Arbitration — states the complication (a debt) and the objective
                (an arbitration).
Id              encounter.town.debt_arbitration (binding; never encounter.slice.*)
Brief row       reach gold · steps gold 0.58 → gold 0.66 · shape opt-in complication ·
                settings urban · consequence hand possession + knowledge (binding)
                rarityTier 2 · scale local · intrinsicTier shaping (brief: background's 0.45
                open-draw cap cannot carry expert difficulty)
Rolled dice     p3 contest · opposition uncanny (its own law) read as the house's own custom:
                an arbitration once called runs to a ruling that binds every claim, no magic ·
                disposition hostile (the house master) · agentRole client who is owed ·
                scale settlement (every counting house in the town hears the ruling) ·
                system target carryover (THR-892)
Hook            plotHookRolled: hook.builders_dilemma, hook.unlikely_alliance,
                hook.puzzle_gauntlet
                plotHookTaken:  hook.puzzle_gauntlet, blended with hook.unlikely_alliance.
                The arbitration is the founders' old procedure, "built as a test by people
                who expected to be understood, and it still works": once called, it runs.
                The alliance survives as a reaction: the mortal and the noble who beat or
                fought them for the deed may strike a tactical silence (a favour owed).
                builders_dilemma set aside: a half-built work would be a third fact in P2.
Whose problem?  The agent's. They hold the bill (P1 arrival) and it is their money the house
                will not pay. The bill is scene-local: introduced as the reason they arrived,
                settled inside the encounter, asserting no prior tie to any graph agent
                (prose rule 7 — no invented history; nothing reads or writes it outside).
Reach = theme?  Step 0 tests Gold (0.58) and is *about* pricing the offer: what the house's
                last pledge is really worth against a third in coin. Step 1 tests Gold on
                both arms: the arbitration (0.66) is *about* ranking a bill against a larger
                claim from the house's own books; the cheap exit (0.30) is *about* seeing a
                full third counted in good coin before the strongroom runs dry.
Shape           Opt-in Complication. Step 0 (weigh the offer) is taken by every mortal. Then
                an agent-decided fork on `courage_prudence`: Vanguard (`positive`) calls the
                arbitration (gold 0.66, the test engaged); Watcher (`negative`) takes the
                third and leaves (gold 0.30, the cheap legible exit). The two step-0 specials
                carry opposite pole leans; the player never picks.
Carryover       (system target, THR-892) Step 0 is `continue_weakened`. Both fork arms carry
                `carryoverFactorLines` keyed on step 0's outcome: how well the offer was
                weighed tilts the arbitration and the count. Variant by construction.
Consequence hand (binding, THR-1145): `possession` + `knowledge` — no swap.
  possession    Arbitration arm `successMetadata.rewardPool`
                `{ categoryWeights: { possession: 1 }, tagFilters: ['#gold'] }`: the elders
                pay the ruled bill in goods out of the house's warehouses. Tag-drawn, tier
                scales with the band; the engine renders the drawn item as the PRIZE chip.
  knowledge     `intelligence` (`political_secret`) on the arbitration arm, success AND
                failure halves: the elders read the house's books aloud, and they show that
                most of the house's money went out as loans to the noble's household, never
                repaid. Win or lose, the mortal leaves knowing where the money went.
                BOON chip on all five arbitration bands.
Extras          `reputation_with` the town (`$here`): up on an arbitration win, down on a
                loss (expert failure = reputation before money; the town means the town).
                Watcher arm: `favor_creation` debtor `$cast:master` on success (the house is
                spared an arbitration and owes for it); `reputation_with $here` down on a
                failed count (an expert seen leaving with paper).
                Reactions on arbitration crit/success/failure: keep the noble's debts quiet
                (`favor_creation` debtor `$cast:claimant`, the unlikely alliance) or tell
                the town (`reputation_with $here` up, `reputation_with $cast:claimant` down).
Cool failure?   Nobody is hurt, jailed or branded. A lost arbitration costs the bill and the
                town's trust in the mortal's judgement with money, and they still leave
                knowing who emptied the bank.
Trait hooks     Gate: none (everyday by construction). Variant: Greedy
                (`trait.personality.gold.vice`) +0.04: a mortal who weighs everything by
                what it yields prices a debt well. Trait-only nudge: none (specials cap spent
                on the pole-lean pair and the arbitration pair). Trait fragment: none.
Systems quota   cast + rewards + reputation + favours — four.
Heavy Hand      none authored.
Cast            `master` — the banking house's master, hostile (merchant; step 0, Watcher arm).
                `claimant` — the noble with the largest claim, the rival (noble; arbitration).
Measurement     The fork step carries no top-level difficulty, so `measure:roll-spread` reads
                step 0 only (0.58, window fit 0.72 — still inside the expert band 0.65–0.85).
                The arbitration's 0.66 is rolled only by mortals who engage.
```

## 1. Inspiration Anchors

- **hook.puzzle_gauntlet** (vault: Archetypes/Ordeal — The Puzzle Temple Gauntlet). What it
  contributed: the procedure that still works. The house's founders built an arbitration that
  runs to a ruling once anyone calls it. That is the "uncanny own law" die read with no magic.
- **hook.unlikely_alliance** (vault: Archetypes/Event — Unlikely Alliance). Contributed the
  reaction pair: the noble who fought the mortal for the deed is also the house's great
  unpaid borrower, and the mortal can sell them silence.
- **Anti-patterns avoided:** the helpful passerby (the mortal is the one owed); a
  punishment failure (a lost ruling still pays out knowledge); a duplicate of *The
  Counting-House Dispute* (there the mortal is a hired arbiter judging others; here the
  mortal is a creditor inside the arbitration, contesting a powerful rival).

## 2. Scale Justification

Short: two beats (weigh the offer, then arbitrate or collect). The stake is a bill and a
reputation in one town, settled in an afternoon. Expert difficulty comes from the numbers
and the rival, not from length.

## 3. Pressure Knot

The house stopped paying before the mortal arrived. Three merchants have already settled for a
third. A noble holds the largest claim and wants the deed to the warehouses. None of this
waits for the mortal.

## 4. Intervention Fantasy

The god leans on a creditor at the edge of a gamble: kindle the grievance so they call the
house to account, or counsel the sure coin. In the hall, the god can make a proud noble lose
their place in their own accounts, or hold the elders to the letter of their rule.

## 5. Cast and World Objects

| Object | Kind | Notes |
|---|---|---|
| `{cast:master}` | actor, merchant, must-persist | the house's master; hostile; offers the third; debtor of the Watcher favour |
| `{cast:claimant}` | actor, noble, must-persist | the noble with the largest claim; the rival; debtor of the silence favour |
| the banking house | scene-local | never a graph node; named only as "the house" |
| the deed to the warehouses | scene-local pledge | paid out as a `#gold` possession draw |
| the bill of exchange | scene-local | the reason for arrival |
| `{location}` | location (`$here`) | its standing moves on the ruling |
| intelligence record | `political_secret` | "Where the house's money went" |

## 6. Beat Structure

1. **Weigh the offer** (gold 0.58, continue_weakened). The master offers a third; the mortal
   prices it against the deed.
2. **Fork, decided by the mortal (`courage_prudence`):**
   - Vanguard: **Win the arbitration** (gold 0.66, fail_action).
   - Watcher: **Collect the third** (gold 0.30, fail_action).

## 7. Branching Profile

- Branch depth: light · Branch count: 2
- Where branching lives: the second step's scene prose, hand, carryover lines, and aftermath.
- Convergence policy: none. Each arm ends the encounter.
- Shape: Opt-in Complication (catalog), personality fork on `courage_prudence`.

## 8. Branching Map

Step 0 outcome → carryover line on either arm. Step 1 arm → Vanguard: prize + knowledge +
town standing + reactions; Watcher: master's favour or a standing loss.

## 9. Outcome Ladder (arbitration arm)

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | bill ranked first, noble last | nothing | prize at its best, town sends for them, knows who emptied the bank |
| success | bill ranked first | nothing | prize, town standing, knowledge |
| success_at_cost | bill paid | the arbitration's costs charged to them | prize, knowledge |
| failure | noble paid first | the bill | town trusts their judgement less; knowledge kept |
| critical_failure | ruled against on every point, read aloud | the bill, the name | town standing lost; knowledge kept |

Watcher arm: success → a full third, the master owes a favour; failure → a note on a house
that pays no notes, and the town's trust.

## 10. Sample Opening (urban)

> {actor} arrives in {location} to cash a bill of exchange at its oldest banking house.
>
> The house has stopped paying. {cast:master}, its master, offers each creditor a third of
> their bill in coin. Three merchants have taken it.
>
> A noble with the largest claim wants the house's last pledge, the deed to its warehouses.
> By the house's own rule, any creditor may call an arbitration. Once called, it runs to a
> ruling that binds every claim.

(15 + 61 = 76 words.)

### Step 0 — Weigh the offer (gold 0.58)

- purposeLine: `Weigh the offer`
- criticalSuccessAfterimage: They worked out that the deed alone covers every bill in full, and that a third is a small part of what the house can pay.
- successAfterimage: They worked out that the deed covers far more than a third of every bill.
- successAtCostAfterimage: They worked out what the deed is worth, and the master saw them do it and closed the books.
- failureAfterimage: They saw only the pages the master chose, and the third looked fair.
- criticalFailureAfterimage: They took the master's figures on trust, and the figures were false.

## 11. The Hand Per Step

### Step 0 — deal `{ count: 4, tags: ['insight', 'social'] }` + 2 specials

| id | name | type | sphere | essence | Δ | lean | effectLine |
|---|---|---|---|---|---|---|---|
| `debt.stoke_the_grievance` | Stoke The Grievance | Kindled Ambition | spirit | 1 | 0.06 | courage_prudence → positive | Make the unpaid sum burn in their thoughts. They lean toward calling the house to account before its elders. |
| `debt.counsel_patience` | Counsel Patience | Whisper | mind | 1 | 0.06 | courage_prudence → negative | Put the sure coin first in their mind. They lean toward taking the offer over waiting on a ruling. |

bandProse:
- Stoke The Grievance — success: "The unpaid sum stayed in their thoughts, and they read every page the master showed for it." · failure: "The unpaid sum burned in their thoughts, and they read the master's pages too fast."
- Counsel Patience — critical_success: "They thought of the coin first, and counted exactly what a third came to." · near_miss: "They thought of the coin first, and skipped a page about the deed." · failure: "They thought only of the coin, and never asked about the deed."

imageTags: `generic.energy`, `generic.focus`.

### Step 1, Vanguard arm — Win the arbitration (gold 0.66) — deal `{ count: 4, tags: ['social', 'presence'] }` + 2 specials

narrativeTemplate:

> {actor} calls the arbitration. The house's elders sit in its hall and read every claim against its books. {cast:claimant}, the noble, argues that the largest claim must be paid first, out of the deed. {actor} must prove their own bill ranks ahead. The ruling cannot be appealed, and every counting house in {location} will hear who lost.

Afterimages:
- critical: They proved their bill first in line, and the elders set the noble's claim last of all.
- success: They proved their bill first in line, to be paid out of the deed.
- at cost: They proved their bill first in line, and the elders charged the costs of the arbitration to them.
- failure: The elders ranked the noble's claim first, and the deed did not stretch to their bill.
- critical failure: The elders ruled against them on every point, and read the ruling aloud in the hall.

carryoverFactorLines (keyed on step 0):
| step 0 band | text | polarity | Δ |
|---|---|---|---|
| critical_success | They know the deed covers every bill in full. | for | 0.06 |
| success | They know what the deed is worth. | for | 0.04 |
| success_at_cost | The master is ready for what they found. | against | -0.02 |
| near_miss | They know only part of what the deed is worth. | for | 0.02 |
| failure | They argue from the pages the master chose. | against | -0.03 |
| critical_failure | They argue from figures the master falsified. | against | -0.05 |

| id | name | type | sphere | essence | Δ | effectLine |
|---|---|---|---|---|---|---|
| `debt.scatter_the_figures` | Scatter The Figures | Stumble (opposes `claimant`) | chaos | 2 | 0.10 | Make the noble lose their place in their own accounts before the elders. The larger claim sounds weaker for it. |
| `debt.invoke_the_rule` | Invoke The Rule | Signature (order) | order | 2 | 0.12 | Hold the elders to the letter of their founders' procedure. Every claim is weighed against the books, whatever the claimant's rank. |

bandProse:
- Scatter The Figures — success: "The noble lost their place twice in their own accounts, and the elders noticed." · near_miss: "The noble lost their place once, and {actor} was too slow to press it." · failure: "The noble stumbled over one figure and recovered before the elders cared."
- Invoke The Rule — critical_success: "The eldest of the elders read the rule aloud before the ruling, and ruled by it." · success: "The elders kept to the letter of their rule, and weighed the noble's claim like any other." · failure: "The elders kept to the letter of their rule, and their rule favoured the larger claim."

imageTags: `generic.luck`, `generic.oath`.

successMetadata: rewardPool possession `#gold`; `intelligence` political_secret; `reputation_with $here +0.10`.
failureMetadata: `intelligence` political_secret; `reputation_with $here -0.12`.

### Step 1, Watcher arm — Collect the third (gold 0.30) — deal `{ count: 4, tags: ['social', 'craft'] }`, no specials

narrativeTemplate:

> {actor} takes the offer. {cast:master} counts out the third from the strongroom while other creditors queue behind. Some of the coin is clipped. {actor} must see a full third counted before the strongroom runs dry.

Afterimages:
- critical: They left with a full third in good coin, and the master's thanks for not calling the arbitration.
- success: They left with a full third in good coin.
- at cost: They left with a full third, part of it in clipped coin.
- failure: The strongroom ran dry before their turn, and they left with the master's note instead.
- critical failure: They left with a note on a house that has stopped paying its notes.

carryoverFactorLines:
| step 0 band | text | polarity | Δ |
|---|---|---|---|
| critical_success | They know to the coin what a third comes to. | for | 0.05 |
| success | They know what a third should come to. | for | 0.03 |
| failure | They take the master's count on trust. | against | -0.03 |
| critical_failure | They count by the master's false figures. | against | -0.05 |

successMetadata: `favor_creation` debtor `$cast:master`, magnitude 0.15–0.3.
failureMetadata: `reputation_with $here -0.05`.

## 12. Branch-Dependent Later Paragraphs

(The two step-1 narrativeTemplates above.)

## 13. Aftermath Paragraphs (overviews)

**Vanguard arm (`positive`)**
- critical_success: The elders read the house's books aloud. Most of its money had gone out as loans to {cast:claimant}'s household, never repaid. They ranked {actor}'s bill first and the noble's claim last, and paid {actor} in goods from the warehouses.
- success: The elders read the house's books aloud, and most of its money had gone out as loans to {cast:claimant}'s household. They ranked {actor}'s bill first and paid it in goods from the warehouses.
- success_at_cost: The elders paid {actor}'s bill in goods from the warehouses, less the costs of the arbitration. The books, read aloud, showed that {cast:claimant}'s household had borrowed most of the house's money.
- failure: The elders ranked {cast:claimant}'s claim first, and the deed went to the noble. The books, read aloud, showed that the noble's own household had borrowed most of the money. The ruling stands anyway.
- critical_failure: The elders ruled against {actor} on every point and read the ruling aloud. The bill is worth nothing now, and every counting house in {location} knows who called the arbitration and lost.

**Watcher arm (`negative`)**
- critical_success: {actor} took a full third in good coin and left the house standing. In front of the whole queue, {cast:master} said the house would not forget it.
- success: {actor} took a full third in good coin and left without calling the arbitration. The noble will have the deed.
- success_at_cost: {actor} took the third, some of it clipped, and left the house to its other creditors.
- failure: The strongroom ran dry before {actor}'s turn. They left with the master's note, and the noble will have the deed.
- critical_failure: {actor} left with a note on a house that has stopped paying its notes. The merchants in the queue saw an expert take paper for coin.

## 14. Aftermath Reaction Choices

On Vanguard critical_success, success and failure:
- **Keep the noble's debts quiet** — intent: "Say nothing outside the hall about the noble's loans. The noble owes the mortal for the silence." → `favor_creation` debtor `$cast:claimant`. (The unlikely alliance: tactical, not forgiven.)
- **Tell the town who emptied the bank** — intent: "Let every counting house hear whose household borrowed the money. The town trusts the mortal more, and the noble much less." → `reputation_with $here +0.05`, `reputation_with $cast:claimant -0.12`.

Watcher arm and Vanguard critical_failure: no reaction choices — consequence is clean.

## 15. Aftermath Kit Summary (chips)

Vanguard — every band: BOON `knowledge` "Where the money went" — detail "{actor} knows who borrowed the bank's money." Success bands: BOON `reputation with {location}` — "{location} will send its hardest money questions to {actor}." Failure bands: SCAR `reputation with {location}` — "{location} trusts {actor}'s judgement with money less." The PRIZE chip is engine-rendered from the draw.

Watcher — success bands: BOND `a favour owed` — "{cast:master} owes {actor} a favour." Failure bands: SCAR `reputation with {location}`, causeClause "Left with paper" — "{location} trusts {actor}'s judgement with money less."

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `master` (merchant) | lazy-materialize-on-trigger | reuse merchant, else spawn "Aurel Vance" | must-persist | favour debtor | ready |
| `claimant` (noble) | lazy-materialize-on-trigger | reuse noble, else spawn "Ysolde Carrow" | must-persist | favour debtor, reputation target | ready |
| possession prize | step rewardPool `#gold` | reward attachment catalog | must-persist | item | ready |
| intelligence record | aftermath effect | engine | must-persist | intelligence queries | ready |

## 17. Self-Audit

- Opening skeleton, ≤80 words (76): PASS
- Narrator mode, no interior sensation: PASS (FLAG to critic: "burn in their thoughts" on a card face is effect-line figurative — check plainness)
- Hands: 2 specials + deal on every nudge-bearing step; Watcher arm deal-only: PASS
- Every special has a failure fragment; no Δ ≥ 0.15: PASS
- Consequence hand wired: possession (rewardPool), knowledge (intelligence): PASS
- Law 56: every chip backed on its band: PASS (knowledge on both halves of the arbitration arm)
- Prose rule 7: bill is scene-local: FLAG for critic judgement
- Prose rule 7b: no place/time promise: PASS
- Trait hooks, four answered: PASS

## Concept Art Direction

1. Emotions: a debt that will not be paid; an old procedure that still binds; standing on the line.
2. Image: an empty strongroom shelf with a single stack of clipped coins beside an open ledger and a wax-sealed deed, lamplight, no people. Painterly, muted, threadbare fantasy.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES (short scale, reactions offered on the arbitration arm) · 13 YES · 14 YES

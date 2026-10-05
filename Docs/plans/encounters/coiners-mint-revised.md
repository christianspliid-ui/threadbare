# Encounter Pipeline: False Coin at the Mint
> Scale: short | Slug: coiners-mint | Pass: revised
> Revisions applied: furnaces grounded in P2; step-1 spine rewritten (no echo of step-0 afterimages; states the coiner hangs, so the Warm opposition reads; "tries its doors" grounds Hold); step-0 crit-failure afterimage made path-safe; step-1 afterimages introduce the apprentice; band coverage completed (Loosen crit_failure, Hold success_at_cost); fragment/afterimage conflicts fixed (Harden rekeyed to crit_success + failure, Hold success/failure); carryover lines de-echoed; trait variants declared on step 1, Shadow Walker line trimmed to 12 words; effect lines share no word with names; page read fixed on every band (SAC conflict, failure 7b promise + repetition, crit-failure duplicate cause and path conflict, boon cause true on every success band); chip noun `reputation with {target}` anchored `$here`; fallback overview no longer withholds; "knew nothing" → "did not know".
> Date: 2026-10-05 | Pipeline version: 3.0 (factory batch master-everyday, slot 5, THR-1688)

## Mechanical design block (fixed before prose — brief slot 5)

| Row | Value |
|---|---|
| Crux | False coin is leaving the town mint, and its master asks {actor} to find the coiners quietly before the crown's assayer comes. |
| Title | **False Coin at the Mint** — the glance test: false coin, at the mint, someone has to find it. |
| templateId | `encounter.town.coiners_mint` · reach `shadow` · `rarityTier: 2` · `intrinsicTier: 'shaping'` · `scale: 'local'` |
| Shape | **Puzzle – Investigation – Resolution** (catalog). Step 0 shadow **0.75** (`continue_weakened`) finds where the false coin is struck; step 1 shadow **0.81** (`fail_action`) takes the dies without a hue and cry. Linear, branch count 0. Mean 0.78. |
| Settings | `urban` only (rolled `stronghold` overridden per brief; it survives as the mint's strongroom). |
| Consequence hand (binding) | `standing` → `reputation_with $here` (+0.05 on step 1 success; −0.03 on step 0 failure; −0.08 on step 1 failure). `possession` → `spawn_artifact` "The Coiner's Dies" to `$actor` on step 1 success. No swap. |
| Opposition | **the mortal's own trait**, read from the graph on step 1: `trait.core.core_warmth.virtue` (Warm — slow to hand anyone to the hangman, −0.05) and `trait.core.core_humility.vice` (Proud — will not leave without the dies, whatever the noise, −0.05). The step-1 spine states that the coiner hangs if caught, which is what makes the Warm drag legible. The Warm variant unlocks a trait-only card that buys the drag back. |
| Seed dice | p3 **unmitigated_risk** (the assayer is coming; doing nothing hangs the mint-master) · opposition **own_trait** · disposition **neutral** · agentRole **bystander_pulled_in** · scale **personal** · system **cards**. |
| Plot hook | rolled `hook.reconciliation, hook.stronghold_raid, hook.death_and_return` · taken **`hook.stronghold_raid`** — the strongroom must be entered, learned and left before the house knows. Reconciliation survives as the mercy-or-justice reaction over the apprentice. |
| Cost channels | Step 1 special **Hold The Door Shut** is the batch's one Heavy Hand: essence 0, `costs.detectionDelta` 0.15, one channel. Trait card at cost 0. No `card.undertow.signature.darkness` taken (left to slot 8). |
| Cool failure | Nobody is killed, jailed or branded. Master failure is the name before the purse: the mint is shut, its master goes before the crown's court, and the town that sent for {actor} as a master now calls them the coiner. |
| Systems | cast (`mintmaster`, bond reactions) · rewards (`spawn_artifact`) · reputation (`reputation_with $here`) = 3. |
| Accepted limit | No band-keyed step write: `success_at_cost` takes the same +0.05 standing as success (the mint-master's word outweighs the street talk); the street talk is prose only, and the SAC chip says "a little better" to match the net write when step 0 failed. |
| Prose-rule-7 deviation from brief | The brief calls the mint-master the master's **old friend**. That is agent history the graph does not hold, so base prose never asserts it. The pull the friendship was meant to carry is carried by the Warm trait read instead (the opposition die), and the bond reactions mint the relationship rather than assert it. |

## 1. Inspiration Anchors

- **hook.stronghold_raid** (Archetypes/Adventure & Quest — The Enemy Stronghold Raid): enter a fixed position, learn it, leave before the garrison understands. Here the "garrison" is the night watch and the town itself; the position is the mint's strongroom.
- **hook.reconciliation**: the father-figure and the apprentice who betrayed the house. It shapes the aftermath reactions: keep the apprentice's name quiet (mercy) or name them to the council (justice).
- Anti-patterns avoided: the helpful passerby with nothing at stake (the town's verdict on {actor} is the stake on failure); a rule gate (none); a heist that repeats the expert shadow verbs (`pawnbrokers_strongroom` steals a box from a strongroom; `tithe_barn_raid` raids a barn). This encounter **investigates, then confiscates** — catching a coiner at work, not stealing a prize.

## 2. Scale Justification

Short: two beats, a find and a take. A master is sent for by name, and the weight is in who is at risk (the mint-master's life, the mint's charter, the coiner's neck) and in what the town decides about {actor}, not in length.

## 3. Pressure Knot

False coin with the mint's own mark has been in the market long enough to be noticed. The crown's assayer is on the road to weigh the coin. The coiner keeps working every night, and will hang if caught.

## 4. Intervention Fantasy

The god plays a thief-catcher's hand: a careless word from a porter, smoke from a chimney that should be cold, a door that will not open for the watch, and — for a Warm mortal — a heart hardened just enough to take the dies from frightened hands.

## 5. Cast and World Objects

- **{cast:mintmaster}** — master of the town mint. Reuse `smith` (seeded in town and city), spawn `smith`, spawnName **Marrin Coyle**. `must-persist` (bond reactions). Never gendered in prose.
- **The apprentice** — the mint-master's apprentice, the coiner. Role noun only; revealed behind the investigation gate (step-0 critical_success / critical_failure afterimages, and every step-1 afterimage, which introduces them as "the mint-master's apprentice" on first mention).
- **The night porter**, **the workers**, **the night watch**, **the town council**, **the crown's assayer** — role nouns.
- **The Coiner's Dies** — `spawn_artifact`, `mundane`, tier `common`, tags `#shadow`, `#tool`, to `$actor`.
- **Standing** — `reputation_with $here` ({location}).

## 6. Beat Structure

1. **Find the striking place** (shadow 0.75, `continue_weakened`) — investigation. The reveal (the apprentice, the strongroom, the dies behind the furnace) lives in the afterimages, never in the opening.
2. **Take the dies quietly** (shadow 0.81, `fail_action`) — resolution. Carryover factor lines read how step 0 went; trait variants read who the mortal is.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Dies taken in silence; assayer finds the coin true | — | Dies held; town thinks well of {actor}; the mint-master tells the council {actor} saved the mint |
| success | Dies taken; mint stays open | — | Dies held; standing up |
| success_at_cost | Dies taken, but the street woke | street talk of a thief at the mint | Dies held; standing a little up (the mint-master vouches) |
| failure | Coiner flees with the dies; assayer finds light coin | the mint's charter; {actor}'s name | Mint shut, master before the crown's court; town thinks less of {actor} |
| critical_failure | Caught or exposed; the town calls {actor} the coiner | name | Standing down hard |

## 10. Sample Opening (narrator mode — urban)

> {actor} is in {location} on market day when {cast:mintmaster}, master of the town mint, sends for them.
>
> False coin with the mint's own mark is turning up in the market, and every piece is light. No worker at the furnaces has been caught at it.
>
> The crown's assayer comes at the week's end to weigh the coin. If it is light, the mint will be shut and its master hanged. {cast:mintmaster} asks {actor} to find the coiners first, and quietly.

Word count: 17 + 28 + 34 = 79 / 80.

## Step spines (narrativeTemplate)

**Step 0 — Find the striking place** (P2 + P3 above).

**Step 1 — Take the dies quietly:**

> The assayer is due, and the coiner's dies are still inside the mint. {actor} must take them out without a hue and cry. Whoever struck the false coin will hang for it.
>
> The night watch passes the mint every hour and tries its doors. If the watch is roused, all of {location} will know of the coining by morning.

### Afterimages

| Step | Band | Afterimage |
|---|---|---|
| 0 | critical_success | The coiner is the mint-master's own apprentice, who strikes light coin in the strongroom each night and hides the dies behind the furnace. |
| 0 | success | They learned that the light coin is struck in the strongroom by night. They did not learn who strikes it. |
| 0 | success_at_cost | They found the strongroom where the coin is struck, but the workers saw them asking, and talk has started. |
| 0 | failure | They found the strongroom only on the last night, too late to learn who comes there. |
| 0 | critical_failure | They asked too openly. The coiner, the mint-master's own apprentice, heard every question. |
| 1 | critical_success | They took the dies from the hands of the mint-master's own apprentice, and nobody in the street woke. |
| 1 | success | They waited for the mint-master's apprentice to set the dies down, then took them and left unseen. |
| 1 | success_at_cost | They got the dies, but the mint-master's apprentice ran shouting into the street, and lamps were lit along it. |
| 1 | failure | The mint-master's apprentice saw them first and fled with the dies. The watch found {actor} alone in the strongroom. |
| 1 | critical_failure | The watch broke in and found {actor} beside the anvil, with light coin on the floor. The coiner, the mint-master's apprentice, had slipped away. |

## 11. The Hand Per Step

### Step 0 — purposeLine "Find the striking place" · difficulty 0.75 · `deal: { count: 3, tags: ['shadow', 'insight'] }`

| Card (library type) | Sphere | Essence | Δ | imageTag | effectLine |
|---|---|---|---|---|---|
| **Loosen A Tongue** (Whisper) | mind | 2 | 0.10 | generic.rumor | Put careless words in people's mouths, so they say more than they meant to. |
| **Stir A Banked Fire** (Signature) | energy | 2 | 0.08 | generic.energy | Wake the embers in hidden hearths, so their smoke rises where it can be seen. |

Band fragments:

- Loosen A Tongue — critical_success: "The night porter let slip that the strongroom chimney smokes after the mint is locked." · success: "The night porter grumbled about a lamp burning behind the strongroom door." · near_miss: "The porter talked, but in the yard, where the workers heard every word." · failure: "The porter talked freely, about everything except the strongroom." · critical_failure: "The porter told the workers what {actor} had asked before the day was out."
- Stir A Banked Fire — success: "Smoke rose from the strongroom chimney after dark, where no fire should be lit." · success_at_cost: "Smoke rose from the strongroom chimney, and the coiner saw it too and let the fire die." · failure: "Smoke rose over the mint after dark, from too many chimneys to tell apart."

Coverage: critical_success · success · success_at_cost · near_miss · failure · critical_failure — all six covered by the specials.

### Step 1 — purposeLine "Take the dies quietly" · difficulty 0.81 · `deal: { count: 3, tags: ['shadow', 'finesse'] }`

| Card (library type) | Sphere | Essence | Δ | Costs | imageTag | effectLine |
|---|---|---|---|---|---|---|
| **Hold The Door Shut** (Heavy Hand) | force | 0 | 0.14 | detectionDelta 0.15 | generic.strength | Brace a way in with divine force, so no one outside can open it. Rival gods notice a hand this heavy. |
| **Harden A Kind Heart** (Trait card, `requiredTrait: trait.core.core_warmth.virtue`) | — | 0 | 0.08 | — | generic.focus | Steel them against pity, so they finish the task even when the culprit begs. |

Band fragments:

- Hold The Door Shut — critical_success: "The watch tried the strongroom door on their round, found it fast, and walked on." · success: "The watch rattled the strongroom door once on their round, and went on when it held." · success_at_cost: "The door held, and the watch pounded on it until the next houses woke." · near_miss: "The door held until the watch fetched a bar, and {actor} was out the back by then." · failure: "The door held, so the watch came in by the yard gate instead." · critical_failure: "The door held so hard against the watch that they called half the street to break it."
- Harden A Kind Heart — critical_success: "The apprentice begged to keep the dies, and {actor} did not stop to listen." · failure: "{actor} pitied the frightened apprentice, and stopped short of grabbing the dies."

Coverage: critical_success · success · success_at_cost · near_miss · failure · critical_failure — all six covered by the specials (Harden is hidden off-trait; Hold alone covers all six).

### Carryover factor lines (step 1, from step 0)

| Step 0 band | Line | Polarity | Δ |
|---|---|---|---|
| critical_success | They can be waiting before the coiner arrives. | for | +0.06 |
| success | They know where to wait. | for | +0.04 |
| success_at_cost | The coiner may know they are being watched. | against | −0.02 |
| near_miss | They found the strongroom with little time left. | against | −0.03 |
| failure | They go in without a plan. | against | −0.05 |
| critical_failure | The coiner has been warned. | against | −0.07 |

### Trait hooks (four questions)

1. **Gate?** None — no rule gate on an everyday encounter.
2. **Variant?** Yes, three, all on **step 1**: Warm (−0.05, "Being Warm, they are slow to hand anyone to the hangman."), Proud (−0.05, "Being Proud, they will not leave without the dies, whatever the noise."), Shadow Walker (+0.05, "Being a Shadow Walker, they wait in the dark without a sound.").
3. **Trait-only nudge?** Yes — Harden A Kind Heart, unlocked by the Warm variant on step 1 (`addNudgeIds`).
4. **Trait fragment?** Yes — Harden A Kind Heart's two fragments read only when the Warm mortal's god played it.

All three refs are in the live corpus (`trait.core.*` from `core-trait-content.ts`; `trait.mastery.shadow-walker` used by pawnbrokers_strongroom).

## 12. Linear continuation

Step 1 spine above.

## 13. Aftermath Paragraph (fallback overview)

> The assayer has come and weighed the mint's coin.

## 14. Aftermath Reaction Choices

Success side (fallback):
- **Keep the apprentice's name quiet** — "The mortal tells no one who struck the coin. The mint-master will remember the mercy." → `bond_change $cast:mintmaster +0.12`.
- **Name the apprentice to the council** — "The mortal tells the council who struck the coin. The town trusts them more, and the mint-master will not forgive it." → `reputation_with $here +0.03`, `bond_change $cast:mintmaster −0.12`.

Failure side (failure, critical_failure):
- **Swear for the mint-master at court** — "The mortal tells the crown's court the mint-master did not know. The mint-master will remember who stood up." → `bond_change $cast:mintmaster +0.12`.
- **Name the apprentice to the court** — "The mortal tells the court who struck the coin. The town hears it, and the mint-master will not forgive it." → `reputation_with $here +0.03`, `bond_change $cast:mintmaster −0.12`.

## 15. Aftermath Kit Summary (byOutcome)

Chip nouns: the standing chip is `BOND · reputation with {target}` with `entityId: '$here'`, `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'` (the `stateNoun` field does not enrich `{location}`); the prize chip is `BOON · The Coiner's Dies` anchored `$artifact`, `visualKind: 'artifact'`.

| Band | Overview | Chips (scar · bond · boon · path) |
|---|---|---|
| critical_success | The assayer weighed the mint's coin and found it true. {cast:mintmaster} told the town council that {actor} saved the mint, and did not say from what. | bond: reputation with {target} (gain) — "{location} thinks well of {actor} now." · boon: The Coiner's Dies — cause "Carried out of the strongroom" — "The Coiner's Dies are in {actor}'s possessions now." |
| success | The assayer found the mint's coin true, and the mint stays open. {cast:mintmaster} speaks for {actor} to the council. | same two |
| success_at_cost | The assayer found the coin true, and the mint stays open. The street still talks of a thief at the mint that night. | bond: reputation with {target} (gain) — cause "Vouched for by {cast:mintmaster}" — "{location} thinks a little better of {actor}." · boon: as above |
| failure | The assayer found light coin in the mint's chests. The mint is shut, and {cast:mintmaster} is held for the crown's court. {location} had sent for {actor} to stop it. | bond: reputation with {target} (loss) — "{location} thinks less of {actor} now." |
| critical_failure | The assayer found light coin, and the mint is shut. {location} sent for {actor} as a master, and now calls them the coiner. | bond: reputation with {target} (loss) — "{location} thinks less of {actor} now." |

Writes backing every chip: `spawn_artifact` + `reputation_with +0.05` on step 1 `successMetadata` (fires on every success-side band); `reputation_with −0.08` on step 1 `failureMetadata`; `reputation_with −0.03` on step 0 `failureMetadata` (backs the critical_failure chip when a step-0 critical failure ends the action; on a run where step 0 failed and step 1 succeeded the net is +0.02, which the SAC chip's "a little better" matches).

Chip sentence lengths (cause + detail): 7 · 14 · 7 · 11 · 7 · 7 — all ≤15.

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| mintmaster (actor) | lazy-materialize-on-trigger | reuse `smith`, spawn `smith` "Marrin Coyle" | must-persist | bond reactions | ready |
| The Coiner's Dies | effect (`spawn_artifact`) | step 1 success | persists in possessions | artifact sheet | ready |
| Standing with {location} | effect (`reputation_with $here`) | steps 0/1 | persists | reputation | ready |

## 17. Self-Audit

- Opening skeleton, ≤80 words, graph names — PASS (79).
- Hand 4–8 composed, ≤2 specials, deal declared on both steps — PASS (step 0: 2+3; step 1: 2+3, trait card hidden off-trait → 1+3).
- ≥4 spheres / ≥1 ungated common — delegated to the dealer; verify in `check:encounter` composed-hand output — FLAG until gated.
- All six `StepOutcome`s covered by the specials on both steps — PASS.
- Every nudge has a failure-band fragment — PASS.
- No digits in effect lines; no word shared between a card's name and its effect line — PASS.
- Zero-essence cards priced: Heavy Hand on detection, trait card by trait — PASS.
- Law 56: every chip backed — PASS (see writes above).
- Page read, every band (overview + chips + reactions as one text) — PASS: no fact told twice, no contradiction, chips ≤15 words.
- Prose rule 7: no asserted friendship/history — PASS (brief's "old friend" dropped, recorded above).
- Prose rule 7b: no future place/time promise — PASS (the assayer's coming is the world's obligation, not the mortal's; "will not send again" removed).
- Over-exposed cards: no `card.boost.core` special; Heavy Hand used once (this slot); no darkness Undertow special — PASS; dealt fill to be checked against `card.boost.signature.energy`.

## Concept Art Direction

1. Emotions: a trusted house quietly rotten; mercy against the law; a master's name on the scale.
2. Image: a strongroom anvil at night, a single pair of coin dies left on it beside a cooling furnace, a few light coins scattered on the flagstones, a locked door with lamplight showing under it. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (workers, furnaces, doors established before the hands) · 4 YES · 4b YES (after editorial fixes) · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (the mint-master named, the apprentice, the dies; `reputation with {target}` / `The Coiner's Dies`) · 11b YES (after editorial fixes) · 12 YES · 13 YES (mercy vs justice) · 14 YES.

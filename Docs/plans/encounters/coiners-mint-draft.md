# Encounter Pipeline: False Coin at the Mint
> Scale: short | Slug: coiners-mint | Pass: draft
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
| Opposition | **the mortal's own trait**, read from the graph: `trait.core.core_warmth.virtue` (Warm — slow to hand anyone to the hangman, −0.05) and `trait.core.core_humility.vice` (Proud — will not leave without the dies, whatever the noise, −0.05). The Warm variant unlocks a trait-only card that buys the drag back. |
| Seed dice | p3 **unmitigated_risk** (the assayer is coming; doing nothing hangs the mint-master) · opposition **own_trait** · disposition **neutral** · agentRole **bystander_pulled_in** · scale **personal** · system **cards**. |
| Plot hook | rolled `hook.reconciliation, hook.stronghold_raid, hook.death_and_return` · taken **`hook.stronghold_raid`** — the strongroom must be entered, learned and left before the house knows. Reconciliation survives as the mercy-or-justice reaction over the apprentice. |
| Cost channels | Step 1 special **Hold The Door Shut** is the batch's one Heavy Hand: essence 0, `costs.detectionDelta` 0.15, one channel. Trait card at cost 0. No `card.undertow.signature.darkness` taken (left to slot 8). |
| Cool failure | Nobody is killed, jailed or branded. Master failure is the name before the purse: the mint is shut, its master goes before the crown's court, and the town that sent for {actor} now calls them the coiner. |
| Systems | cast (`mintmaster`, bond reactions) · rewards (`spawn_artifact`) · reputation (`reputation_with $here`) = 3. |
| Accepted limit | No band-keyed step write: `success_at_cost` takes the same +0.05 standing as success (the mint-master still vouches); the street talk is prose only. |
| Prose-rule-7 deviation from brief | The brief calls the mint-master the master's **old friend**. That is agent history the graph does not hold, so base prose never asserts it. The pull the friendship was meant to carry is carried by the Warm trait read instead (the opposition die). |

## 1. Inspiration Anchors

- **hook.stronghold_raid** (Archetypes/Adventure & Quest — The Enemy Stronghold Raid): enter a fixed position, learn it, leave before the garrison understands. Here the "garrison" is the night watch and the town itself; the position is the mint's strongroom.
- **hook.reconciliation**: the father-figure and the apprentice who betrayed the house. It shapes the aftermath reactions: keep the apprentice's name quiet (mercy) or name them to the council (justice).
- Anti-patterns avoided: the helpful passerby with nothing at stake (the town's verdict on {actor} is the stake on failure); a rule gate (none); a heist that repeats the expert shadow verbs (`pawnbrokers_strongroom` steals a box from a strongroom; `tithe_barn_raid` raids a barn). This encounter **investigates, then confiscates** — catching a coiner at work, not stealing a prize.

## 2. Scale Justification

Short: two beats, a find and a take. A master is sent for by name, and the weight is in who is at risk (the mint-master's life, the mint's charter) and in what the town decides about {actor}, not in length.

## 3. Pressure Knot

False coin with the mint's own mark has been in the market long enough to be noticed. The crown's assayer is on the road to weigh the coin. The coiner keeps working every night.

## 4. Intervention Fantasy

The god plays a thief-catcher's hand: a careless word from a porter, smoke from a chimney that should be cold, a door that will not open for the watch, and — for a Warm mortal — a heart hardened just enough to take the dies from frightened hands.

## 5. Cast and World Objects

- **{cast:mintmaster}** — master of the town mint. Reuse `smith` (seeded in town and city), spawn `smith`, spawnName **Marrin Coyle**. `must-persist` (bond reactions). Never gendered in prose.
- **The apprentice** — the mint-master's apprentice, the coiner. Role noun only; revealed behind the investigation gate.
- **The night porter**, **the night watch**, **the town council**, **the crown's assayer** — role nouns.
- **The Coiner's Dies** — `spawn_artifact`, `mundane`, tier `common`, tags `#shadow`, `#tool`, to `$actor`.
- **Standing** — `reputation_with $here` ({location}).

## 6. Beat Structure

1. **Find the striking place** (shadow 0.75, `continue_weakened`) — investigation. The reveal (the apprentice, the strongroom, the dies behind the furnace) lives in the afterimages, never in the opening.
2. **Take the dies quietly** (shadow 0.81, `fail_action`) — resolution. Carryover factor lines read how step 0 went.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Dies taken in silence; assayer finds the coin true | — | Dies held; town thinks well of {actor}; the mint-master tells the council {actor} saved the mint |
| success | Dies taken; mint stays open | — | Dies held; standing up |
| success_at_cost | Dies taken, but lamps lit along the street | street talk of a thief at the mint | Dies held; standing up (the mint-master vouches) |
| failure | Coiner flees with the dies; assayer finds light coin | the mint's charter; {actor}'s name | Mint shut, master before the crown's court; town thinks less of {actor} |
| critical_failure | Caught or exposed; the town calls {actor} the coiner | name | Standing down hard |

## 10. Sample Opening (narrator mode — urban)

> {actor} is in {location} on market day when {cast:mintmaster}, master of the town mint, sends for them.
>
> False coin with the mint's own mark is turning up in the market, and every piece is light. No worker has been caught at it.
>
> The crown's assayer comes at the week's end to weigh the coin. If it is light, the mint will be shut and its master hanged. {cast:mintmaster} asks {actor} to find the coiners first, and quietly.

Word count: 18 + 26 + 33 = 77 / 80.

## Step spines (narrativeTemplate)

**Step 0 — Find the striking place** (P2 + P3 above).

**Step 1 — Take the dies quietly:**

> The coiner works at night in the mint's strongroom, with a second pair of dies hidden there. {actor} must take those dies before the assayer comes, and without a hue and cry.
>
> The night watch passes the mint door every hour. If they are roused, the whole town will know the mint struck false coin.

### Afterimages

| Step | Band | Afterimage |
|---|---|---|
| 0 | critical_success | They found it. The mint-master's own apprentice strikes light coin in the strongroom at night, with dies hidden behind the furnace. |
| 0 | success | They found that the light coin is struck at night in the mint's strongroom, with dies hidden behind the furnace. |
| 0 | success_at_cost | They found the strongroom where the coin is struck, but the workers saw them asking, and talk has started. |
| 0 | failure | They found the strongroom only on the last night, too late to learn who comes there. |
| 0 | critical_failure | They asked too openly. The mint-master's apprentice heard, and hid the dies where no one could find them. |
| 1 | critical_success | They took the dies from the apprentice's hands at the anvil, and nobody in the street woke. |
| 1 | success | They took the dies when the apprentice set them down, and were out of the mint before the watch came round. |
| 1 | success_at_cost | They got the dies, but the apprentice ran into the street shouting, and lamps were lit along it. |
| 1 | failure | The apprentice heard them in the dark and fled with the dies, and the watch found {actor} alone in the strongroom. |
| 1 | critical_failure | The watch broke in and found {actor} beside the anvil, with light coin on the floor. |

## 11. The Hand Per Step

### Step 0 — purposeLine "Find the striking place" · difficulty 0.75 · `deal: { count: 3, tags: ['shadow', 'insight'] }`

| Card (library type) | Sphere | Essence | Δ | imageTag | effectLine |
|---|---|---|---|---|---|
| **Loosen A Tongue** (Whisper) | mind | 2 | 0.10 | generic.rumor | Put a careless word in someone's mouth, so they say more than they meant to. |
| **Stir A Banked Fire** (Signature) | energy | 2 | 0.08 | generic.energy | Wake the coals in a hidden hearth, so its smoke rises where it can be seen. |

Band fragments:

- Loosen A Tongue — critical_success: "The night porter let slip that the strongroom chimney smokes after the mint is locked." · success: "The night porter grumbled about a light in the strongroom long after closing." · near_miss: "The porter talked, but in the yard, where the workers heard every word." · failure: "The porter talked freely, about everything except the strongroom."
- Stir A Banked Fire — success: "Smoke rose from the strongroom chimney after dark, where no fire should be lit." · success_at_cost: "Smoke rose from the strongroom chimney, and the coiner saw it too and let the fire die." · failure: "Smoke rose over the mint after dark, from too many chimneys to tell apart."

### Step 1 — purposeLine "Take the dies quietly" · difficulty 0.81 · `deal: { count: 3, tags: ['shadow', 'finesse'] }`

| Card (library type) | Sphere | Essence | Δ | Costs | imageTag | effectLine |
|---|---|---|---|---|---|---|
| **Hold The Door Shut** (Heavy Hand) | force | 0 | 0.14 | detectionDelta 0.15 | generic.strength | Lean the god's whole weight on a way in, so no one outside can open it. Rival gods notice a hand this heavy. |
| **Harden A Kind Heart** (Trait card, `requiredTrait: trait.core.core_warmth.virtue`) | — | 0 | 0.08 | — | generic.focus | Turn their pity into patience, so they finish the work instead of sparing the one doing it. |

Band fragments:

- Hold The Door Shut — critical_success: "The watch tried the strongroom door on their round, found it fast, and walked on." · success: "The watch rattled the strongroom door once, and went on when it held." · near_miss: "The door held until the watch fetched a bar, and {actor} was out the back by then." · failure: "The door held, so the watch went round to the yard gate, where {actor} had to come out." · critical_failure: "The door held so hard against the watch that they called half the street to break it."
- Harden A Kind Heart — success: "{actor} took the dies from the apprentice's hands, and let the apprentice go." · failure: "{actor} hesitated over the frightened apprentice, and the apprentice ran."

### Carryover factor lines (step 1, from step 0)

| Step 0 band | Line | Polarity | Δ |
|---|---|---|---|
| critical_success | They know who comes, and when. | for | +0.06 |
| success | They know where the coin is struck. | for | +0.04 |
| success_at_cost | The coiner may know they are being watched. | against | −0.02 |
| near_miss | They found the strongroom with little time left. | against | −0.03 |
| failure | They are waiting without knowing who will come. | against | −0.05 |
| critical_failure | The coiner has been warned. | against | −0.07 |

### Trait hooks (four questions)

1. **Gate?** None — no rule gate on an everyday encounter.
2. **Variant?** Yes, three: Warm (−0.05, "Being Warm, they are slow to hand anyone to the hangman."), Proud (−0.05, "Being Proud, they will not leave without the dies, whatever the noise."), Shadow Walker (+0.05, "Being a Shadow Walker, they can wait in a dark room without a sound.").
3. **Trait-only nudge?** Yes — Harden A Kind Heart, unlocked by the Warm variant (`addNudgeIds`).
4. **Trait fragment?** Yes — Harden A Kind Heart's two fragments read only when the Warm mortal's god played it.

All three refs are in the live corpus (`trait.core.*` from `core-trait-content.ts`; `trait.mastery.shadow-walker` used by pawnbrokers_strongroom).

## 12. Linear continuation

Step 1 spine above.

## 13. Aftermath Paragraph (fallback overview)

> The assayer has come and gone, and {location} knows what he found.

## 14. Aftermath Reaction Choices

Success side (fallback):
- **Keep the apprentice's name quiet** — "The mortal tells no one who struck the coin. The mint-master will remember the mercy." → `bond_change $cast:mintmaster +0.12`.
- **Name the apprentice to the council** — "The mortal tells the council who struck the coin. The town trusts them more, and the mint-master will not forgive it." → `reputation_with $here +0.03`, `bond_change $cast:mintmaster −0.12`.

Failure side (failure, critical_failure):
- **Swear for the mint-master at court** — "The mortal tells the crown's court the mint-master knew nothing. The mint-master will remember who stood up." → `bond_change $cast:mintmaster +0.12`.
- **Name the apprentice to the court** — "The mortal tells the court who struck the coin. The town hears it, and the mint-master will not forgive it." → `reputation_with $here +0.03`, `bond_change $cast:mintmaster −0.12`.

## 15. Aftermath Kit Summary (byOutcome)

| Band | Overview | Chips (scar · bond · boon · path) |
|---|---|---|
| critical_success | The assayer weighed the mint's coin and found it true. {cast:mintmaster} told the town council that {actor} saved the mint, and did not say from what. | bond: reputation with {location} (gain) — "{location} thinks well of {actor} now." · boon: The Coiner's Dies — cause "Taken from the coiner's anvil" — "The Coiner's Dies are in {actor}'s possessions now." |
| success | The assayer found the mint's coin true, and the mint stays open. {cast:mintmaster} speaks for {actor} to the council. | same two |
| success_at_cost | The assayer found the coin true, but lamps were lit along the street that night. {location} talks of a thief at the mint, and {cast:mintmaster} still vouches for {actor}. | same two |
| failure | The assayer found light coin in the mint's chests. The mint is shut, and {cast:mintmaster} is held for the crown's court. The town that sent for {actor} will not send again. | bond: reputation with {location} (loss) — "{location} thinks less of {actor} now." |
| critical_failure | The assayer found light coin, and the mint is shut. {location} has heard that {actor} was poking around the mint at night, and now calls them the coiner. | bond: reputation with {location} (loss) — cause "Named as the coiner" — "{location} thinks less of {actor} now." |

Writes backing every chip: `spawn_artifact` + `reputation_with +0.05` on step 1 `successMetadata` (fires on every success-side band); `reputation_with −0.08` on step 1 `failureMetadata`; `reputation_with −0.03` on step 0 `failureMetadata` (backs the critical_failure chip when a step-0 critical failure ends the action).

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| mintmaster (actor) | lazy-materialize-on-trigger | reuse `smith`, spawn `smith` "Marrin Coyle" | must-persist | bond reactions | ready |
| The Coiner's Dies | effect (`spawn_artifact`) | step 1 success | persists in possessions | artifact sheet | ready |
| Standing with {location} | effect (`reputation_with $here`) | steps 0/1 | persists | reputation | ready |

## 17. Self-Audit

- Opening skeleton, ≤80 words, graph names — PASS (77).
- Hand 4–8 composed, ≤2 specials, deal declared on both steps — PASS (step 0: 2+3; step 1: 2+3, trait card hidden off-trait).
- ≥4 spheres / ≥1 ungated common — delegated to the dealer; verify in `check:encounter` composed-hand output — FLAG until gated.
- Every nudge has a failure-band fragment — PASS.
- No digits in effect lines; no word repeated between name and effect line — PASS.
- Zero-essence cards priced: Heavy Hand on detection, trait card by trait — PASS.
- Law 56: every chip backed — PASS (see writes above).
- Prose rule 7: no asserted friendship/history — PASS (brief's "old friend" dropped, recorded above).
- Prose rule 7b: no future place/time promise — PASS (the assayer's coming is the world's, not the mortal's, obligation).
- Over-exposed cards: no `card.boost.core` special; Heavy Hand used once (this slot); no darkness Undertow special — PASS; dealt fill to be checked against `card.boost.signature.energy`.

## Concept Art Direction

1. Emotions: a trusted house quietly rotten; mercy against the law; a master's name on the scale.
2. Image: a strongroom anvil at night, a single pair of coin dies left on it beside a cooling furnace, a few light coins scattered on the flagstones, a locked door with lamplight showing under it. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (the mint-master named, the apprentice and the dies) · 11b YES · 12 YES · 13 YES (mercy vs justice) · 14 YES.

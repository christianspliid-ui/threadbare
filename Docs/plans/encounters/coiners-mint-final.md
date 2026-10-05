# Encounter Pipeline: False Coin at the Mint
> Scale: short (local) | Slug: coiners-mint | Pass: final
> Date: 2026-10-05 | Pipeline version: 2.0 (factory batch master-everyday, slot 5, THR-1688)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | A two-step shadow find-and-take at the town mint: find where the false coin is struck, then take the dies without a hue and cry. Hand: standing + possession. Opposition: the mortal's own trait (Warm / Proud). |
| Editorial | PASS WITH REVISIONS | Triggers 10, 22, 34 and 35 fixed inline. The spine states the coiner hangs, which makes the Warm opposition legible. Furnaces and doors are grounded. Band coverage is complete. Page read is clean on every band. "Old friend" is dropped (prose rule 7). |
| Systems | READY WITH CAVEATS | No missing primitive. Gate FAIL fixed: step-1 specials are 0.12 + 0.07, so 0.81 + 0.19 = 1.00. `[page]` reaction overlaps reworded. Library ids are bound. Trait variants are template-level, so the Proud line is reworded. The chip noun is `reputation with {location}`. |

### Caveats / Blockers

1. Re-run `check:encounter --package` on the compiled package. The step-1 forecast sits at exactly 1.00, and the `[page]` warnings were hand-cleared with the gate's own splitter. The machine run is the proof.
2. Composed-hand check: each step reaches ≥4 spheres and ≥1 ungated common. Also confirm that the step-0 fill does not deal `card.boost.signature.energy` beside Stir A Banked Fire, which the brief forbids. If it does, bind Stir to a library id or change the step-0 deal tags. Never use a type-wide `exclude`, because that would also bar the core Boost the fill is meant to supply.
3. Expected, inert console line on step 0 for a Warm mortal: `traitVariant 'trait.core.core_warmth.virtue' adds unknown nudge id 'coin.harden_a_kind_heart'`. This is the shipped `wolf-winter-watch` pattern.
4. Accepted limits: there is no band-keyed `success_at_cost` write (`EffectPredicate` has no band condition). The own-trait opposition only meets Warm or Proud mortals.

### Editorial Notes Summary

- **Opening and spine.** The editorial grounded the furnaces (Stir), the doors (Hold) and the workers (Loosen) in the opening and spine. It rewrote the step-1 spine to end the afterimage-to-spine echo, and added *"Whoever struck the false coin will hang for it."*
- **Afterimages and fragments.** The step-0 crit-failure afterimage is now path-safe. The apprentice is introduced on first mention in every step-1 afterimage. Band coverage was completed: Loosen gets `critical_failure`, Hold gets `success_at_cost`. Fragment/afterimage conflicts were fixed.
- **Trait line.** The Shadow Walker line was trimmed to 12 words.
- **Page read.** The SAC chip/overview conflict was resolved: the chip's cause is now "Vouched for by {cast:mintmaster}". The failure 7b promise ("will not send again") was cut. The critical-failure duplicate and its path conflict were fixed. The boon cause now reads true on every success band.

### Systems corrections applied in this packet

- **Hold The Door Shut.** `forecastDelta` 0.14 → **0.12**, bound to `libraryCardId: 'card.heavy_hand.signature.force'`.
- **Harden A Kind Heart.** `forecastDelta` 0.08 → **0.07**, bound to `libraryCardId: 'card.trait_card.core'`.
- **Success reactions.** *Name the apprentice to the council* has a new intent, so it no longer shares "who struck the coin" with *Keep the apprentice's name quiet*.
- **Failure reactions.** The label *Swear for the mint-master at court* is now *Swear for the mint-master*. Both failure intents were reworded, so no reaction shares a 4-word run with another block on its page.
- **Trait variants** are declared template-level, so they read on both steps. The Proud factor line is now *"Being Proud, they will not stop short, whatever the noise."* The old line named the dies on step 0.
- **Standing chip noun** is `reputation with {location}`, anchored on `$here`. `{location}` and `$here` resolve to the same node the write targets on every draw path, and this is the corpus convention for location-anchored reputation. See the systems file § 0.
- **Artifact naming.** `spawn_artifact` carries `nameOverride: "The Coiner's Dies"`, so the boon chip names the item the sheet shows.
- **Nudge ids** are declared: `coin.loosen_a_tongue`, `coin.stir_a_banked_fire`, `coin.hold_the_door_shut`, `coin.harden_a_kind_heart`.

### Implementation File Map

- `Docs/plans/encounters/coiners-mint.package.json`: author it from this packet. `compile:encounter` owns the module, the structural test and both registrations (THR-1246). Do not hand-edit those.
- `src/data/content-eval/plotHooks.ts`: stamp `hook.stronghold_raid` `usedBy` with `encounter.town.coiners_mint` at closeout.
- No engine, type, art or primitive files.

---

## Encounter Packet

## Mechanical design block (fixed before prose: brief slot 5)

| Row | Value |
|---|---|
| Crux | False coin is leaving the town mint, and its master asks {actor} to find the coiners quietly before the crown's assayer comes. |
| Title | **False Coin at the Mint**. The glance test: false coin, at the mint, someone has to find it. |
| templateId | `encounter.town.coiners_mint` · reach `shadow` · `rarityTier: 2` · `intrinsicTier: 'shaping'` · `scale: 'local'` |
| Shape | **Puzzle – Investigation – Resolution** (catalog). Step 0, shadow **0.75** (`continue_weakened`), finds where the false coin is struck. Step 1, shadow **0.81** (`fail_action`), takes the dies without a hue and cry. Linear, branch count 0. Mean 0.78. |
| Settings | `urban` only. The rolled `stronghold` is overridden per the brief, and survives as the mint's strongroom. |
| Consequence hand (binding) | `standing` → `reputation_with $here`: +0.05 on step 1 success; −0.03 on step 0 failure; −0.08 on step 1 failure. `possession` → `spawn_artifact` "The Coiner's Dies" to `$actor` on step 1 success. No swap. |
| Opposition | **The mortal's own trait**, read from the graph through template-level `traitVariants`, which apply on both steps. `trait.core.core_warmth.virtue` (Warm: slow to hand anyone to the hangman, −0.05). `trait.core.core_humility.vice` (Proud: will not stop short, whatever the noise, −0.05). The opening puts a hanging on the table, and the step-1 spine states that the coiner hangs if caught, which is what makes the Warm drag legible. The Warm variant also unlocks a trait-only card on step 1 that buys the drag back. |
| Seed dice | p3 **unmitigated_risk** (the assayer is coming; doing nothing hangs the mint-master) · opposition **own_trait** · disposition **neutral** · agentRole **bystander_pulled_in** · scale **personal** · system **cards**. |
| Plot hook | Rolled `hook.reconciliation, hook.stronghold_raid, hook.death_and_return`. Taken: **`hook.stronghold_raid`**. The strongroom must be entered, learned and left before the house knows. Reconciliation survives as the mercy-or-justice reaction over the apprentice. |
| Cost channels | Step 1 special **Hold The Door Shut** is the batch's one Heavy Hand (`libraryCardId: 'card.heavy_hand.signature.force'`): essence 0, `costs.detectionDelta` 0.15, one channel. The trait card (`libraryCardId: 'card.trait_card.core'`) costs 0. No `card.undertow.signature.darkness` is taken (left to slot 8). |
| Cool failure | Nobody is killed, jailed or branded. Master failure is the name before the purse: the mint is shut, its master is held for the crown's court, and the town that sent for {actor} as a master now calls them the coiner. |
| Systems | cast (`mintmaster`, bond reactions) · rewards (`spawn_artifact`) · reputation (`reputation_with $here`) = 3. |
| Accepted limit | No band-keyed step write. `success_at_cost` takes the same +0.05 standing as success (the mint-master's word outweighs the street talk). The street talk is prose only, and the SAC chip says "a little better" to match the net write when step 0 failed. |
| Prose-rule-7 deviation from brief | The brief calls the mint-master the master's **old friend**. That is agent history the graph does not hold, so base prose never asserts it. The Warm trait read (the opposition die) carries the pull the friendship was meant to carry, and the bond reactions mint the relationship rather than assert it. |

## 1. Inspiration Anchors

- **hook.stronghold_raid** (Archetypes/Adventure & Quest, The Enemy Stronghold Raid): enter a fixed position, learn it, and leave before the garrison understands. Here the "garrison" is the night watch and the town itself, and the position is the mint's strongroom.
- **hook.reconciliation**: the father-figure, and the apprentice who betrayed the house. It shapes the aftermath reactions: keep the apprentice's name quiet (mercy) or name them (justice).
- Anti-patterns avoided:
  - The helpful passerby with nothing at stake. The town's verdict on {actor} is the stake on failure.
  - A rule gate. There is none.
  - A heist that repeats the expert shadow verbs. `pawnbrokers_strongroom` steals a box from a strongroom, and `tithe_barn_raid` raids a barn. This encounter **investigates, then confiscates**: it catches a coiner at work rather than stealing a prize.

## 2. Scale Justification

Short: two beats, a find and a take. A master is sent for by name. The weight is in who is at risk (the mint-master's life, the mint's charter, the coiner's neck) and in what the town decides about {actor}, not in length.

## 3. Pressure Knot

False coin with the mint's own mark has been in the market long enough to be noticed. The crown's assayer is on the road to weigh the coin. The coiner keeps working every night, and will hang if caught.

## 4. Intervention Fantasy

The god plays a thief-catcher's hand:

- a careless word from a porter;
- smoke from a chimney that should be cold;
- a door that will not open for the watch;
- for a Warm mortal, a heart hardened just enough to take the dies from frightened hands.

## 5. Cast and World Objects

- **{cast:mintmaster}**: master of the town mint. Reuse `smith` (seeded in town, city and capital), spawn `smith`, spawnName **Marrin Coyle**. `must-persist`, because the bond reactions write to them. Never gendered in prose.
- **The apprentice**: the mint-master's apprentice, the coiner. Role noun only. Revealed behind the investigation gate: in the step-0 critical_success and critical_failure afterimages, and in every step-1 afterimage, which introduces them as "the mint-master's apprentice" on first mention.
- **The night porter**, **the workers**, **the night watch**, **the town council** and **the crown's assayer**: role nouns.
- **The Coiner's Dies**: `spawn_artifact` `{ category: 'mundane', tier: 'common', nameOverride: "The Coiner's Dies", tags: ['#shadow', '#tool'], targetAgentId: '$actor' }`.
- **Standing**: `reputation_with` `{ targetLocationId: '$here' }` ({location}).

## 6. Beat Structure

1. **Find the striking place** (shadow 0.75, `continue_weakened`): investigation. The reveal (the apprentice, the strongroom, the dies behind the furnace) lives in the afterimages, never in the opening.
2. **Take the dies quietly** (shadow 0.81, `fail_action`): resolution. Carryover factor lines read how step 0 went. Trait variants read who the mortal is, on both steps.

## 7. Branching Profile

Linear, no branching. Branch count 0.

## 8. Branching Map

N/A: linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Dies taken in silence; the assayer finds the coin true | — | Dies held; the town thinks well of {actor}; the mint-master tells the council {actor} saved the mint |
| success | Dies taken; the mint stays open | — | Dies held; standing up |
| success_at_cost | Dies taken, but the street woke | street talk of a thief at the mint | Dies held; standing a little up (the mint-master vouches) |
| failure | The coiner flees with the dies; the assayer finds light coin | the mint's charter; {actor}'s name | Mint shut, master held for the crown's court; the town thinks less of {actor} |
| critical_failure | Caught or exposed; the town calls {actor} the coiner | name | Standing down hard |

## 10. Sample Opening (narrator mode, `urban`)

> {actor} is in {location} on market day when {cast:mintmaster}, master of the town mint, sends for them.
>
> False coin with the mint's own mark is turning up in the market, and every piece is light. No furnace worker has been caught at it.
>
> The crown's assayer comes at the week's end to weigh the coin. If it is light, the mint will be shut and its master hanged. {cast:mintmaster} asks {actor} to find the coiners first, and quietly.

Word count: 17 + 26 + 34 = 77 / 80 (gate count 79; trimmed from 81 after the package gate).

## Step spines (narrativeTemplate)

**Step 0, Find the striking place** (P2 + P3 above).

**Step 1, Take the dies quietly:**

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

### Step 0: purposeLine "Find the striking place" · difficulty 0.75 · `deal: { count: 3, tags: ['shadow', 'insight'] }`

| id | Card (library type) | Sphere | Essence | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|
| `coin.loosen_a_tongue` | **Loosen A Tongue** (Whisper; no `libraryCardId`) | mind | 2 | 0.10 | generic.rumor | Put careless words in people's mouths, so they say more than they meant to. |
| `coin.stir_a_banked_fire` | **Stir A Banked Fire** (Signature; no `libraryCardId`) | energy | 2 | 0.08 | generic.energy | Wake the embers in hidden hearths, so their smoke rises where it can be seen. |

Forecast ceiling: 0.75 + 0.10 + 0.08 = 0.93 ≤ 1.00.

Band fragments:

- **Loosen A Tongue**
  - critical_success: "The night porter let slip that the strongroom chimney smokes after the mint is locked."
  - success: "The night porter grumbled about a lamp burning behind the strongroom door."
  - near_miss: "The porter talked, but in the yard, where the workers heard every word."
  - failure: "The porter talked freely, about everything except the strongroom."
  - critical_failure: "The porter told the workers what {actor} had asked before the day was out."
- **Stir A Banked Fire**
  - success: "Smoke rose from the strongroom chimney after dark, where no fire should be lit."
  - success_at_cost: "Smoke rose from the strongroom chimney, and the coiner saw it too and let the fire die."
  - failure: "Smoke rose over the mint after dark, from too many chimneys to tell apart."

Coverage: the specials cover all six bands (critical_success, success, success_at_cost, near_miss, failure, critical_failure).

### Step 1: purposeLine "Take the dies quietly" · difficulty 0.81 · `deal: { count: 3, tags: ['shadow', 'finesse'] }`

| id | Card (library type) | `libraryCardId` | Sphere | Essence | Δ | Costs | imageTag | effectLine |
|---|---|---|---|---|---|---|---|---|
| `coin.hold_the_door_shut` | **Hold The Door Shut** (Heavy Hand) | `card.heavy_hand.signature.force` | force | 0 | **0.12** | `detectionDelta` 0.15 | generic.strength | Brace a way in with divine force, so no one outside can open it. Rival gods notice a hand this heavy. |
| `coin.harden_a_kind_heart` | **Harden A Kind Heart** (Trait card, `requiredTrait: 'trait.core.core_warmth.virtue'`) | `card.trait_card.core` | — | 0 | **0.07** | — | generic.focus | Steel them against pity, so they finish the task even when the culprit begs. |

Forecast ceiling: 0.81 + 0.12 + 0.07 = 1.00 ≤ 1.00. Because both specials carry a `libraryCardId`, the dealer refuses their types in the fill: no second Heavy Hand or trait card is dealt on this step.

Band fragments:

- **Hold The Door Shut**
  - critical_success: "The watch tried the strongroom door on their round, found it fast, and walked on."
  - success: "The watch rattled the strongroom door once on their round, and went on when it held."
  - success_at_cost: "The door held, and the watch pounded on it until the next houses woke."
  - near_miss: "The door held until the watch fetched a bar, and {actor} was out the back by then."
  - failure: "The door held, so the watch came in by the yard gate instead."
  - critical_failure: "The door held so hard against the watch that they called half the street to break it."
- **Harden A Kind Heart**
  - critical_success: "The apprentice begged to keep the dies, and {actor} did not stop to listen."
  - failure: "{actor} pitied the frightened apprentice, and stopped short of grabbing the dies."

Coverage: the specials cover all six bands. Harden is hidden off-trait, and Hold alone covers all six.

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

1. **Gate?** None. An everyday encounter takes no rule gate.
2. **Variant?** Yes, three, declared in the template-level `traitVariants`. `TraitVariant` carries no step field, so each one reads on **both** steps.

   | `traitId` | `forecastDelta` | `factorLine` | `addNudgeIds` |
   |---|---|---|---|
   | `trait.core.core_warmth.virtue` | −0.05 | "Being Warm, they are slow to hand anyone to the hangman." | `['coin.harden_a_kind_heart']` |
   | `trait.core.core_humility.vice` | −0.05 | "Being Proud, they will not stop short, whatever the noise." | — |
   | `trait.mastery.shadow-walker` | +0.05 | "Being a Shadow Walker, they wait in the dark without a sound." | — |

3. **Trait-only nudge?** Yes: Harden A Kind Heart, unlocked by the Warm variant. It appears only on step 1, the step that authors it. On step 0 the `addNudgeIds` entry is inert, with one console warn, which is the shipped `wolf-winter-watch` pattern.
4. **Trait fragment?** Yes. Harden A Kind Heart's two fragments read only when the Warm mortal's god played it.

All three trait refs are in the live corpus. `trait.core.*` is in `coreRegistry.ts` and is already used by `ambition-templates.ts`. `trait.mastery.shadow-walker` is in `mastery-trait-content.ts` and is used by pawnbrokers_strongroom.

## 12. Linear continuation

See the step 1 spine above.

## 13. Aftermath Paragraph (fallback overview)

> The assayer has come and weighed the mint's coin.

## 14. Aftermath Reaction Choices

Success side (fallback; inherited by critical_success, success and success_at_cost):

- id `coin.keep_name_quiet`, **Keep the apprentice's name quiet**: "The mortal tells no one who struck the coin. The mint-master will remember the mercy." → `bond_change { withAgentId: '$cast:mintmaster', sentimentDelta: 0.12 }`.
- id `coin.name_to_council`, **Name the apprentice to the council**: "The town trusts the mortal more, and the mint-master will not forgive it." → `reputation_with { targetLocationId: '$here', delta: 0.03 }`, `bond_change { withAgentId: '$cast:mintmaster', sentimentDelta: -0.12 }`.

Failure side (authored on both failure and critical_failure; ids suffixed `.fail` / `.crit_fail`):

- id `coin.swear_for_mintmaster`, **Swear for the mint-master**: "The mortal swears the mint-master did not know. The mint-master will remember who stood up." → `bond_change { withAgentId: '$cast:mintmaster', sentimentDelta: 0.12 }`.
- id `coin.name_to_court`, **Name the apprentice to the court**: "The town hears it, and the mint-master will not forgive it." → `reputation_with { targetLocationId: '$here', delta: 0.03 }`, `bond_change { withAgentId: '$cast:mintmaster', sentimentDelta: -0.12 }`.

Page check (gate splitter, label + intent as one block, hyphenated words as one token):

- The paired stances share only the 3-word run "the mint-master will".
- No reaction shares a 4-word run with its band's overview or chips.

## 15. Aftermath Kit Summary (byOutcome)

Chip nouns:

- **Standing chip:** `BOND · reputation with {location}`, with `stateNoun: { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`, `concepts: [{ text: 'thinks well of' | 'thinks less of', tooltipId: 'ui.standing' }]`.
- **Prize chip:** `BOON · The Coiner's Dies`, with `stateNoun: { text: "The Coiner's Dies", entityId: '$artifact', visualKind: 'artifact' }`.

| Band | Overview | Chips (scar · bond · boon · path) |
|---|---|---|
| critical_success | The assayer weighed the mint's coin and found it true. {cast:mintmaster} told the town council that {actor} saved the mint, and did not say from what. | **bond**: reputation with {location} (gain), "{location} thinks well of {actor} now." **boon**: The Coiner's Dies, cause "Carried out of the strongroom", "The Coiner's Dies are in {actor}'s possessions now." |
| success | The assayer found the mint's coin true, and the mint stays open. {cast:mintmaster} speaks for {actor} to the council. | the same two chips |
| success_at_cost | The assayer found the coin true, and the mint stays open. The street still talks of a thief at the mint that night. | **bond**: reputation with {location} (gain), cause "Vouched for by {cast:mintmaster}", "{location} thinks a little better of {actor}." **boon**: as above |
| failure | The assayer found light coin in the mint's chests. The mint is shut, and {cast:mintmaster} is held for the crown's court. {location} had sent for {actor} to stop it. | **bond**: reputation with {location} (loss), "{location} thinks less of {actor} now." |
| critical_failure | The assayer found light coin, and the mint is shut. {location} sent for {actor} as a master, and now calls them the coiner. | **bond**: reputation with {location} (loss), "{location} thinks less of {actor} now." |

Writes backing every chip:

- **Step 1 `successMetadata`:** `spawn_artifact` (as § 5) + `reputation_with $here +0.05`. Fires on every success-side band.
- **Step 1 `failureMetadata`:** `reputation_with $here −0.08`.
- **Step 0 `failureMetadata`:** `reputation_with $here −0.03`. This backs the critical_failure chip when a step-0 critical failure ends the action. On a run where step 0 failed and step 1 succeeded, the net is +0.02, which the SAC chip's "a little better" matches.

Chip sentence lengths (cause + detail): 7 · 14 · 7 · 11 · 7 · 7. All are ≤15.

## 16. Support Bundle Contract

| Object | Delivery | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| mintmaster (actor) | lazy-materialize-on-trigger | reuse `smith`, spawn `smith` "Marrin Coyle", supportRole `mint_master` | must-persist | bond reactions | ready |
| The Coiner's Dies | effect (`spawn_artifact`, `nameOverride`) | step 1 success | persists in possessions | artifact sheet | ready |
| Standing with {location} | effect (`reputation_with $here`) | steps 0/1 | persists | reputation | ready |

## 17. Self-Audit

- **Opening:** skeleton followed, ≤80 words, graph names only. PASS (79).
- **Hand composition:** 4–8 cards composed, ≤2 specials, deal declared on both steps. PASS. Step 0 is 2 + 3. Step 1 is 2 + 3, or 1 + 3 with the trait card hidden off-trait.
- **Sphere spread:** ≥4 spheres and ≥1 ungated common, delegated to the dealer. FLAG until the composed-hand output of `check:encounter` confirms it, including no `card.boost.signature.energy` in the step-0 fill.
- **Forecast ceiling:** difficulty + authored specials ≤ 1.00 on both steps. PASS (0.93 and 1.00).
- **Band coverage:** all six `StepOutcome`s covered by the specials on both steps. PASS.
- **Failure fragments:** every nudge has one. PASS.
- **Effect lines:** no digits, and no word shared between a card's name and its effect line. PASS.
- **Zero-essence cards:** priced. The Heavy Hand pays in detection and the trait card by trait. Both are bound to their library ids. PASS.
- **Law 56:** every chip is backed (see the writes above). The boon chip names the `nameOverride` item. PASS.
- **Page read:** every band read as overview + chips + reactions in one text. PASS. No fact is told twice, nothing contradicts, every chip is ≤15 words, and no 4-word run is shared between reactions.
- **Prose rule 7:** no asserted friendship or history. PASS. The brief's "old friend" is dropped, as recorded above.
- **Prose rule 7b:** every later-tense line in a reaction or effect line is enacted by a `bond_change` or by `detectionDelta`. The opening and spine futures are P3 stakes, not promises to the mortal. PASS.
- **Over-exposed cards:** no `card.boost.core` special. The Heavy Hand is used once (this slot) and bound. No darkness Undertow special. PASS. The dealt fill still has to be checked against `card.boost.signature.energy`.

## Concept Art Direction

1. Emotions: a trusted house quietly rotten; mercy against the law; a master's name on the scale.
2. Image: a strongroom anvil at night, a single pair of coin dies left on it beside a cooling furnace, a few light coins scattered on the flagstones, a locked door with lamplight showing under it. No people.

## Experience Differentiator Gate

1 YES · 2 YES · 3 YES (workers, furnaces and doors established before the hands) · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (the mint-master named, the apprentice, the dies; `reputation with {location}` / `The Coiner's Dies`) · 11b YES (after the editorial and systems page fixes) · 12 YES · 13 YES (mercy vs justice, on both sides) · 14 YES.

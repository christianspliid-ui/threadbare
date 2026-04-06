# Culture Integration Design — Prose, Names & Living Settlements

**Date:** 2026-04-06
**Status:** Draft
**Scope:** Units 1 & 2 (Names/Prose + Trait Gating/Sublocations). Unit 3 (Cultural Friction) deferred.

---

## Problem Statement

The culture system has deep backend data (generation, assignment, tension math, gravity scoring, trait seeds) but produces almost no visible player impact. Culture surfaces as `Key: Value` labels and a shallow pool of 20 prose sentences. Agents from different cultures behave identically. Settlements show no cultural character.

**Design principle (game-wide):** If data shows as a label, the UX is unfinished. The finished state is prose.

---

## Unit 1: Names & Prose Foundation

### 1.1 Culture Naming

Each culture gets three name forms generated at worldgen:

| Form | Example | Purpose |
|------|---------|---------|
| **People name** | Daru | The tribal/ethnic identity. Short, 1-3 syllables. This is the culture node's `name`. |
| **Home place name** | Darujistan | The culture's home settlement. Derived: people name + place-suffix. |
| **Demonym** | Daru | What members are called. Usually same as people name. |

#### Name Generation

A phoneme table keyed by foundation × sphere × biome produces syllable pools. The generator:

1. Picks 1-3 syllables from the pool (weighted by foundation for consonant hardness, sphere for vowel color, biome for syllable count)
2. Applies culture-appropriate suffix for the home place name:
   - Fortified cultures (order, force): -stan, -gar, -heim, -hold, -grad
   - Nature cultures (life, spirit): -dell, -mere, -glen, -haven
   - Mystic cultures (mind, entropy, time): -thos, -shar, -oth, -spire
   - Maritime cultures (coastal biomes): -port, -haven, -reach, -tide
3. Demonym is the people name directly (or a common truncation if the people name is 3+ syllables)

#### Examples

| Foundation | Sphere | Biome | People Name | Home Place | Demonym |
|------------|--------|-------|-------------|------------|---------|
| Chaos | Force | Mountains | Vork | Vorkgar | Vork |
| Order | Mind | Grassland | Tessimer | Tessimere | Tessi |
| Light | Life | Forest | Sylen | Sylendell | Sylen |
| Darkness | Entropy | Swamp | Morg | Morgoth | Morg |
| Chaos | Spirit | Coast | Keth | Kethaven | Keth |
| Order | Matter | Hills | Dural | Duralheim | Dural |

#### New Fields on CultureIdentity

```typescript
demonym: string;          // "Daru" — short identity word
homePlaceName: string;    // "Darujistan" — derived settlement name
```

The existing `archetypeLabel` ("The Protector Mountain Folk") is retained as internal lore flavor, available for deep-knowledge prose and tooltips but never used as the primary displayed name.

#### Home Place Assignment

At worldgen, after culture territory assignment, each culture's capital/primary settlement is renamed to the home place name. The settlement retains its canonical `LocationSubtype` (hamlet/town/city/capital) for all mechanical purposes — promotion/demotion, NPC budget, sublocation tier-gating. Culture identity adds a **prose label** that flavors descriptions but does not create new subtypes:

- Martial order-cultures → described as "fortress-city" in prose (mechanically: city or capital)
- Chaotic spirit-cultures → described as "sacred gathering site" (mechanically: town or city)
- Light-life cultures → described as "grove-settlement" (mechanically: hamlet or town)
- Nomadic cultures → described as "seasonal camp" (mechanically: camp)

These labels are stored as `cultureSettlementLabel: string` on the location node properties and consumed by prose resolvers. They do not appear in `LocationSubtype`, are not checked by `phaseSettlementPromotion`, and do not affect the settlement genome tier-gating logic.

#### Region Names

Untouched. Region names come from the historical culture layer via `regionNaming.ts`. This is correct — regions bear older names from prior peoples, not the current culture.

### 1.2 Prose Integration

#### Design Principle

Culture reaches the player through sentences, never through `Key: Value` fields. All existing label displays (`Culture: <name>` in AgentInfoCard, HexSidebar, etc.) are replaced with prose.

#### Three Prose Surfaces

**Agent descriptions** — Culture woven into existing backstory and personality prose:

- **Origin prose:** One sentence establishing cultural identity in backstory.
  > "Kael was raised among the Daru, where debts are paid in iron and silence is a confession."
- **Behavioral prose:** Culture-influenced personality description.
  > "He carries the Daru preference for directness — negotiation bores him, but a clear challenge sharpens his focus."
- **Material prose:** Possessions and appearance reflect cultural origin.
  > "His blade is mountain-forged in the Daru fashion, the hilt wrapped in cured goat-leather."

These weave into whatever agent description prose already exists — backstory resolver, personality description, attachment descriptions. Not separate labeled sections.

**Settlement descriptions** — Generic layer + cultural layer, both as prose:

- **Generic layer** (based on settlement subtype/size):
  > "A walled town sits at the valley mouth, smoke rising from forges and cookfires."
- **Cultural layer** (keyed to culture trait):
  > "Daru banners hang from the gatehouse — a clenched fist on grey. The proving grounds dominate the town square, where disputes are settled before witnesses."

**Hex Chronicle "The People" section** — Currently uses 20 foundation-biased sentences. Replaced with assembled prose from the snippet pool system.

### 1.3 Prose Snippet Pool System

#### Pool Structure

Snippets are organized by three axes, each independently authored:

**Foundation snippets** (~8 per foundation × topic = ~320 total):
> Order + governance: "Disputes here follow ancient precedent — no voice is raised without citing the relevant statute."
> Chaos + governance: "Leadership shifts with the season. Whoever holds the crowd's attention holds the authority."

**Sphere snippets** (~8 per sphere × topic = ~640 total):
> Force + food: "Meals are competitive — the largest portion goes to whoever earned it that day."
> Life + food: "Every dish contains something still growing. They consider cooked roots a sign of impatience."

**Biome snippets** (~5 per biome-group × topic = ~500+ total):
> Mountain + architecture: "Buildings are carved into the cliff face rather than raised from the ground."
> Coast + dress: "Salt-stained leather and shell clasps mark everyone from dockhand to elder."

#### Topics

Each snippet addresses one small facet of daily life:

| Topic | What it covers |
|-------|---------------|
| governance | How decisions are made, disputes settled |
| food | What they eat, how meals work socially |
| dress | What they wear, status signifiers |
| trade | What they value, how commerce works |
| justice | How crimes are punished, who judges |
| religion | How they worship, sacred practices |
| warfare | How they fight, military customs |
| art | What they create, aesthetic values |
| greeting | How strangers are received, hospitality customs |
| death | Funeral rites, attitudes toward mortality |
| architecture | How they build, material choices, spatial organization |

11 topics × (4 foundations × ~8 + 8 spheres × ~8 + ~11 biome groups × ~5) = roughly **1,100+ snippets** in the base pool.

#### Assembly Algorithm

When prose is needed for a culture, the resolver:

1. Looks up the culture's foundation, primary sphere, and biome group
2. Picks a topic appropriate to context (settlement description favors governance/trade/architecture; agent description favors greeting/dress/warfare) or random if no context preference
3. Pulls one snippet from each matching axis (foundation, sphere, biome)
4. Composes into a short paragraph with the culture's demonym woven in

Example — Daru (chaos + force + mountains), three snippet picks for a settlement description:
- Topic: governance → foundation snippet (chaos): "Leadership here is earned, not inherited — whoever holds the proving ground holds the town."
- Topic: food → sphere snippet (force): "Meals are contests of appetite, the largest share claimed by the day's champion."
- Topic: architecture → biome snippet (mountains): "The buildings cling to the mountainside, half-carved from living rock."

Composed paragraph:
> "Leadership here is earned, not inherited — whoever holds the proving ground holds the town. Meals are contests of appetite, the largest share claimed by the day's champion. The buildings cling to the mountainside, half-carved from living rock."

Each pick selects one topic and one axis (foundation, sphere, or biome). Different views of the same settlement pick different topics → different tidbits, same cultural feel.

#### Agent Prose Assembly

Same pool, different topic weighting:
- **Origin context**: greeting, governance, religion (where they came from)
- **Personality context**: justice, warfare, trade (how they behave)
- **Material context**: dress, food, art (what they carry/wear)

#### Biome Groups

To keep the biome snippet pool manageable, similar biomes are grouped:

| Group | Biomes |
|-------|--------|
| mountain | mountains, high_mountains, mountain_pass |
| hills | hills, forested_hills, plateau |
| forest | temperate_forest, dense_forest, boreal_forest, light_forest |
| jungle | jungle, tropical_forest |
| grassland | grassland, farmland, savanna, steppe, floodplain |
| wetland | swamp, marsh, moor_bog |
| coast | coast, coastal_shallows, reef |
| water | ocean, deep_ocean, tropical_ocean, lake, river |
| desert | rocky_desert, sand_dunes, oasis, badlands |
| cold | tundra, snow_fields, glacier, arctic |
| volcanic | volcano, broken_lands, dead_forest |

---

## Unit 2: Culture Trait & Sublocation Content

### 2.1 Culture Trait

Every agent and settlement belonging to a culture gets a culture trait via `has_trait` edge. This is an innate trait — permanent, non-decaying.

#### Canonical Gating Key: Trait Node ID

Culture IDs are runtime-generated (`culture_0`, `culture_1`, etc. — see `cultureGenerator.ts:349`). The culture trait node ID is derived deterministically from the culture ID:

```typescript
// Trait node ID format:
`trait.culture.${cultureId}`   // e.g. "trait.culture.culture_0"
```

The trait node's `name` property is set to the culture's demonym (e.g., "Daru") for display purposes. The `tags` array includes the demonym for backward-compatible lookup. But **all gating uses the trait node ID**, not the demonym string.

#### Consumer Alignment

Three systems currently gate on traits with different lookup semantics. All must converge on trait node ID via `has_trait` edge target:

| Consumer | Current Lookup | Required Change |
|----------|---------------|-----------------|
| Encounters (`encounterFilterPipeline.ts:172`) | `e.target !== req.traitId` — already uses edge target ID | None — already correct |
| Ambitions (`ambitionSelection.ts:61`) | `agent.traits.includes(trait)` — string membership on flat array | Change to edge lookup: `graph.getOutgoingEdges(agentId, 'has_trait').some(e => e.target === req)` |
| Spells (`spellActivation.ts:99-112`) | `traitNames` set from node names + tags | Change to check edge target IDs directly, consistent with encounters |

After alignment, all three consumers use the same check: "does the entity have a `has_trait` edge whose target matches the required trait node ID?"

#### Assignment

At worldgen, after culture assignment:
- Each agent with a `belongs_to` → culture edge gets `has_trait` → `trait.culture.${cultureId}`
- Each settlement location gets the same trait
- Dual-culture agents/settlements get both traits
- Cultureless agents get no culture trait

The culture trait node is created once per culture alongside the culture actor node. Standard trait definition with `category: 'innate'`, `subcategory: 'cultural'`. Node `name` = demonym, `tags` = `[demonym]`.

#### What It Gates

All gating uses `requiredTraits: [{ traitId: 'trait.culture.culture_0' }]` — the trait node ID.

- **Encounters:** `requiredTraits: [{ traitId: 'trait.culture.culture_0' }]` on encounter templates
- **Ambitions:** `requiredTraits: ['trait.culture.culture_0']` on ambition templates (after consumer alignment)
- **Spells:** `prerequisites: { requiredTraits: ['trait.culture.culture_0'] }` on spell definitions (after consumer alignment)
- **Sublocations:** Cultural sublocations spawn only where the culture trait is present
- **Attachments:** Cultural items gated to agents/locations with the culture trait

Since culture IDs are runtime-generated, culture-gated content templates cannot hardcode specific trait IDs. Instead, templates use a `cultureBound: true` flag and the encounter/ambition/spell filter resolves the agent's actual culture trait at runtime.

### 2.2 Cultural Sublocations — Settlement Genome Pass 2

Cultural sublocations run as **Pass 2** of the Settlement Genome pipeline (see `settlement-genome-design.md`). The genome composes settlements through five sequential passes:

1. **Infrastructure** — generic sublocations from settlement tier (inn, market, gatehouse)
2. **Culture** — this section; substitutions + additions from culture identity
3. **Spheres** — hex cosmic influence contributes sphere-flavored sublocations
4. **Reaches** — local economic/activity profile contributes functional sublocations
5. **Archetype recognition** — pattern scan, capstone sublocation if threshold met

Culture runs second so it can substitute generic slots created by the infrastructure pass. Sphere and reach passes add on top — they never replace cultural sublocations.

#### Two Types

**Substitutions** — replace a generic sublocation with a cultural version. Same functional slot, different cultural expression, different NPCs/encounters/items.

| Generic Slot | Daru Version | Sylen Version |
|-------------|--------------|---------------|
| Temple | Forge-Shrine | Grove-Altar |
| Gathering Hall | Hall of Trials | Weaver's Circle |
| Training Ground | Iron Yard | Wind Garden |

**Additions** — unique cultural sublocations with no generic equivalent. Only exist in settlements of that culture.

| Culture | Addition | Tier |
|---------|----------|------|
| Daru | Proving Ground | Town |
| Sylen | Deeproot Archive | City |
| Morg | Bone-Reading Circle | Town |

#### Progression by Prosperity Tier

| Prosperity Tier | Cultural Sublocations |
|----------------|----------------------|
| Hamlet | 1 substitution (temple/shrine equivalent) |
| Town | +1 substitution + 1 addition |
| City | +1 substitution + 1 addition |

These counts are gated by `settlementCultureStrength` (see below). Below 0.3 strength, only 1 substitution regardless of tier; no additions.

On **promotion**, the genome re-runs all passes at the new tier — culture unlocks additional substitutions/additions. On **demotion**, highest-tier cultural sublocations are marked as ruined (consistent with genome demotion rules — ruins persist as prose flavor, not deleted).

When an invading culture conquers a settlement, the existing cultural sublocations may persist under tension or be gradually replaced — this connects to Unit 3 (deferred).

#### Settlement Culture Strength

Culture strength lives on the `belongs_to` edge connecting a location to its culture node, using the existing `CultureEdgeProperties.culturalStrength` field (`culture.ts:29`). This is the single source of truth — not duplicated onto location node properties.

```typescript
// Read via: graph.getOutgoingEdges(locationId, 'belongs_to')
//   → find edge where target is culture node, cultureLayer === 'current'
//   → edge.properties.culturalStrength
```

| Factor | Value | Condition |
|--------|-------|-----------|
| Base | 0.4 | Every culturally-affiliated settlement |
| Heartland bonus | +0.3 | Settlement is in the culture's historical territory |
| Home place bonus | +0.2 | This is the culture's named capital |
| Dilution penalty | -0.1 | Per competing culture present via factions |

Culture strength determines:

| Threshold | Effect |
|-----------|--------|
| < 0.3 | Only 1 substitution, no additions regardless of tier. Generic NPC role names. |
| 0.3 – 0.5 | Normal tier-gated substitutions and additions. Cultural NPC role renaming. |
| > 0.5 | Full cultural expression. Ruin echo flavor from `ruinDescriptors`. Insider beats eligible. |
| > 0.7 | Prose generation weights cultural snippets heavily over generic. |

#### Sublocation Template Structure

Each culture defines ~3-5 sublocation templates, ordered by tier:

```
Culture: Daru (chaos + force + mountains)
  Tier 1 — Forge-Shrine (substitutes: temple)
    Sphere affinity: force
    NPCs: Shrine-Keeper (smith-priest role)
    Encounters: Blade-Offering, Forge-Vow
    Items: Forge-Blessed Iron

  Tier 2 — Proving Ground (addition, unique)
    Sphere affinity: force + heart
    NPCs: Weaponmaster, Judge of Trials
    Encounters: Challenge of Worth, Witnessed Duel
    Items: Champion's Mark, Trial Scar (condition)

  Tier 3 — Hall of Trials (substitutes: gathering hall)
    Sphere affinity: force + mind
    NPCs: Lorekeeper of Duels, Master of the Rolls
    Encounters: Trial by History, Forge-Song Recital
    Items: Saga-Blade (named weapon, rare)
```

#### Generation from Culture Identity

Sublocation templates are not hand-authored per culture. They are generated deterministically from the culture's identity:

1. Foundation determines institutional character (order → rigid institutions, chaos → informal gathering places)
2. Primary sphere determines the domain focus (force → martial places, life → nature places, mind → scholarly places)
3. Biome determines material flavor (mountain → carved stone, coast → driftwood and shell)
4. Reach preferences weight which generic slots get substituted

The 27 existing sublocation variant templates in `culture-content.ts` provide the building blocks. The system selects and flavors them based on culture identity.

#### Each Sublocation Brings

- **NPCs** — Culture-specific roles (not generic "shopkeeper"). A Daru Forge-Shrine has a Shrine-Keeper; a Sylen Grove-Altar has a Root-Speaker. NPC count respects the genome's per-tier NPC budget shared across all five passes.
- **Encounters** — Gated to sublocation + culture trait. "Challenge at the Proving Ground" only fires at a Daru Proving Ground.
- **Items/Attachments** — Cultural artifacts available through these sublocations. Gated by culture trait.
- **Faction anchors** — Cultural factions can be headquartered at these sublocations. "The Order of the Forge" at the Hall of Trials.

#### Deduplication with Other Genome Passes

If culture and sphere/reach passes both want the same sublocation type (e.g., culture wants a library substitution and the mind sphere also contributes a library), the sublocation is created once but carries tags from both sources. This makes archetype recognition more likely — a settlement where both culture and environment push toward scholarship is more likely to trigger the Arcane Conclave archetype.

### 2.3 Insider Beats Integration

The 17 insider beats already authored in `culture-content.ts` (blood_oath_challenge, water_blessing, bone_reading, mountain_pilgrimage, etc.) are wired as culture-gated encounters:

- Each beat's `requiredCultureTags` maps to the corresponding culture trait
- Each beat's `minStrength` maps to a minimum cultural strength threshold on the `belongs_to` edge
- Each beat's `proseSeeds` become encounter step prose templates

These fire at cultural sublocations where the culture trait and sphere prerequisites are met.

### 2.4 Content Authoring Pattern

Content is authored in two layers:

**Generic layer** (no culture gate, fires everywhere):
> "A merchant offers rare goods at the market square."

**Cultural layer** (requires `trait_culture_<demonym>`, fires only at matching settlements):
> "A Daru smith offers to reforge your blade in the mountain fashion — but only if you can name the three trials of the proving ground."

A Daru settlement gets both layers — generic encounters at generic sublocations, cultural encounters at cultural sublocations. Additive composition, not replacement.

---

## Deferred to Unit 3: Cultural Friction

The following are explicitly out of scope for this design but planned as a natural extension:

- Cultural mismatch detection in encounter filter pipeline
- Friction encounter pool (outsider experiences)
- Cultural tension weighting on encounter selection
- Conquest/displacement encounters when settlement culture changes
- Cultural tension feeding into unrest/prosperity mechanics

## Deferred to Approach C: Full Integration

- Culture as mutable hex-level state (like divineInfluence/corruption)
- Map overlay showing cultural boundaries
- Player actions to spread/suppress culture (god-scale manipulation)
- Codex entries for discovered cultures
- Cultural assimilation over time

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CULTURE_SUBLOCATION_TIERS` | `[1, 2, 3]` (hamlet, town, city) | Prosperity tiers that trigger cultural sublocation spawning |
| `CULTURE_SUBSTITUTIONS_PER_TIER` | `[1, 1, 1]` | Generic sublocations replaced per tier |
| `CULTURE_ADDITIONS_PER_TIER` | `[0, 1, 1]` | Unique cultural sublocations added per tier |
| `CULTURE_STRENGTH_BASE` | `0.4` | Baseline `culturalStrength` on `belongs_to` edge for any affiliated settlement |
| `CULTURE_STRENGTH_HEARTLAND_BONUS` | `0.3` | Bonus when settlement is in culture's historical territory |
| `CULTURE_STRENGTH_HOME_PLACE_BONUS` | `0.2` | Bonus when settlement is the culture's named capital |
| `CULTURE_STRENGTH_DILUTION_PENALTY` | `0.1` | Penalty per competing culture present via factions |
| `CULTURE_STRENGTH_MIN_FOR_ADDITIONS` | `0.3` | Below this, no cultural additions regardless of tier |
| `CULTURE_STRENGTH_MIN_FOR_RUIN_ECHO` | `0.5` | Below this, no ruin echo flavor in prose |
| `CULTURE_STRENGTH_HEAVY_PROSE` | `0.7` | Above this, prose generation weights cultural snippets heavily |
| `PROSE_SNIPPETS_PER_ASSEMBLY` | `3` | Number of axis snippets composed per prose paragraph |
| `PROSE_TOPIC_COUNT` | `11` | Number of daily-life topics in snippet pool |
| `NAME_MIN_SYLLABLES` | `1` | Minimum syllables in people name |
| `NAME_MAX_SYLLABLES` | `3` | Maximum syllables in people name |
| `PHONEME_POOL_SIZE` | `~8 per axis` | Syllable options per foundation/sphere/biome |

## Tracing

All traces extend `TraceBase` from `trace.ts` and use the `category` field. Implementation must register new categories in the `TraceCategory` union and `TRACE_CATEGORIES` array (`trace.ts:16-71`), and add corresponding DebugPanel filter entries.

New trace categories to register: `culture_generation`, `culture_sublocation`.

| Trace Category | Emitted When | Fields |
|----------------|-------------|--------|
| `culture_generation` | Worldgen culture creation | `cultureId, peopleName, demonym, homePlaceName, traitNodeId` |
| `culture_generation` | Agent/location gets culture trait | `entityId, traitNodeId, cultureDemonym, edgeCulturalStrength` |
| `culture_sublocation` | Genome Pass 2 creates cultural sublocation | `locationId, sublocationId, cultureId, tier, isSubstitution` |
| `culture_sublocation` | Genome demotion ruins cultural sublocation | `locationId, sublocationId, cultureId, tier` |
| `culture_generation` | Settlement culture strength calculated | `locationId, cultureId, edgeCulturalStrength, factors: { base, heartland, homePlace, dilution }` |
| `culture_generation` | Prose snippet composed for display | `cultureId, foundation, sphere, biome, topics[], snippetCount` |

## PRNG Callouts

- Name generation: seeded per culture (deterministic per world seed)
- Prose snippet selection: seeded per render context (same view of same settlement at same tick = same prose; different tick = may differ)
- Sublocation template selection: seeded per culture (deterministic)
- NPC name/role generation at cultural sublocations: seeded per sublocation instance

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Culture has no phoneme match for foundation/sphere/biome combo | Fall back to generic syllable pool |
| No prose snippets match culture's axes | Use existing generic settlement/agent prose |
| Cultural sublocation template not found for culture identity | Skip cultural sublocation, settlement uses only generic sublocations |
| Agent has no culture trait | Agent uses generic prose, no cultural encounters fire |
| Home place settlement not found during rename | Culture exists without a named home place; log warning |

## Wiring

### Unit 1 — Names & Prose

| Surface | Integration Point |
|---------|-------------------|
| `cultureGenerator.ts` | `generateCultureName()` rewritten; new `generateHomePlaceName()` |
| `CultureIdentity` type | New fields: `demonym`, `homePlaceName` |
| `worldSeed.ts` | Home settlement renamed after culture registration |
| `agentDetail.ts` | Replace `cultureName` label with prose assembly |
| `backstoryResolvers.ts` | Weave cultural prose into backstory generation |
| `proseResolvers.ts` | `cultureResolver` rewritten to use snippet pool |
| `HexChronicle.tsx` | "The People" section uses assembled cultural prose |
| `AgentInfoCard.tsx` | Remove `Culture: <name>` label; prose in description |
| `OverviewTab.tsx` | Culture shown through prose, not label |
| `HexSidebar.tsx` | Cultural prose replaces label |
| `HexFlavorPanel.tsx` | Cultural prose replaces label |
| New data file | `culture-prose-snippets.ts` — the snippet pool (~1000+ entries) |

### Unit 2 — Trait & Sublocations (via Settlement Genome)

Cultural sublocations are created by the Settlement Genome pipeline (`settlement-genome-design.md`), not as a standalone system. The genome orchestrates five composition passes; culture is Pass 2.

| Surface | Integration Point |
|---------|-------------------|
| `cultureGenerator.ts` | Create culture trait node per culture; assign to agents/locations |
| `traits.ts` / trait system | Culture trait as innate, non-decaying |
| `settlementGenome.ts` (new) | Genome pipeline — Pass 2 calls culture sublocation generation. Computes `settlementCultureStrength`. |
| `sublocation.ts` | Cultural sublocation templates selected and instantiated by genome Pass 2. `ensureSublocations()` replaced by genome pipeline at generation; retained as fallback for non-genome locations. |
| Genome reassessment | Promotion/demotion and reach-threshold crossings trigger genome re-evaluation. Culture pass re-runs with new tier, may unlock/ruin cultural sublocations. |
| NPC budget | Culture-pass NPC roles share the genome's per-tier NPC budget with infrastructure, sphere, reach, and archetype passes. |
| Encounter templates | New culture-gated encounter set per sublocation type |
| `encounterFilterPipeline.ts` | Already supports `requiredTraits` — no changes needed |
| `culture-content.ts` | Insider beats mapped to encounter templates with trait gates; `minStrength` checks `culturalStrength` on the location's `belongs_to` edge |
| New data file | `culture-sublocations.ts` — sublocation templates per identity axis |
| New data file | `culture-encounters.ts` — culture-gated encounter templates |

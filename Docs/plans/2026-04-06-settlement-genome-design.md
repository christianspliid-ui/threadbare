# Settlement Genome Design — Emergent Settlement Identity

**Date:** 2026-04-06
**Status:** Draft
**Depends on:** `2026-04-06-culture-integration-design.md` (Unit 2 — cultural sublocations run as Pass 2)

---

## Problem Statement

Settlements lack identity. A city with a port and a city with mines feel the same — same sublocations, same NPC roster, same faction presence. The static `SUBTYPE_SUBLOCATION_MAP` creates a handful of generic sublocations per tier but ignores the hex's cosmic signature, the culture's heritage, the economic activity flowing through the settlement, and the settlement's geographic position. NPCs fall back to parent locations because their preferred sublocations don't exist. Every town is every other town.

**Goal:** Settlements should develop coherent identity from their environmental context — sphere influence, cultural heritage, economic activity, geographic position, and settlement tier. This identity manifests as specific sublocations, NPC rosters, and faction presence that tell a story about why this place exists.

---

## Design Overview

The **Settlement Genome** is a five-pass composition pipeline that runs at world generation and re-runs on discrete phase-change events (promotion, demotion, reach threshold crossings). Each pass contributes sublocations and NPC roles from a different data source. After all passes complete, an archetype recognition step scans the accumulated composition and may add a capstone.

### Composition Order

| Pass | Source | What It Contributes | Persists Through Demotion? |
|------|--------|---------------------|---------------------------|
| 1. Infrastructure | Settlement tier | Generic sublocations every settlement needs (inn, market, gatehouse) | Tier-gated items ruined |
| 2. Culture | Historical culture identity | Substitutions of generic slots + unique cultural additions | Yes — heritage endures |
| 3. Spheres | Hex sphere influence | Cosmic-flavored sublocations + NPCs | Tier-gated items ruined |
| 4. Reaches | Derived settlement reach scores | Economic/activity sublocations + NPCs | Recalculated on reach shift |
| 5. Archetype Recognition | Pattern scan of accumulated tags | Capstone sublocations + prose flavor tag | Removed if pattern breaks |

### Design Principles

- **Culture sets the floor, spheres and reaches add on top.** Cultural sublocations are guaranteed (strength-gated). Spheres and reaches never replace cultural sublocations.
- **Procedural base with authored attractors.** Passes 1-4 are compositional (data-driven menus). Pass 5 uses authored archetype definitions that recognize emergent patterns.
- **Phase-change reassessment, not continuous.** The genome re-evaluates on discrete events (tier change, reach threshold crossing), not every tick.
- **Each sublocation is traceable.** The genome emits a trace per settlement documenting which pass contributed each sublocation and why.

---

## Pass 1: Settlement Infrastructure

Generic sublocations that appear based purely on settlement tier. These are the bread-and-butter places every settlement needs regardless of culture, spheres, or economy.

### Data Shape

```typescript
interface InfrastructureSublocation {
  id: SublocationTypeId;
  minTier: SettlementTier;
  condition?: 'high-prosperity' | 'trade-route' | 'coastal-hex' | 'borderlands';
}

const SETTLEMENT_INFRASTRUCTURE: InfrastructureSublocation[];
```

### Infrastructure Table

| Sublocation | Min Tier | Condition | Rationale |
|------------|----------|-----------|-----------|
| inn | hamlet | — | Every settlement has somewhere to sleep |
| well-fountain | hamlet | — | Basic communal gathering space |
| market-stall | hamlet | — | Even hamlets trade |
| temple-quarter | town | — | Organized worship |
| market-district | town | — | Upgraded commerce |
| gatehouse | town | — | Towns have controlled entry |
| jail | town | — | Law enforcement |
| town-hall | town | — | Local governance |
| harbor | town | trade-route + coastal-hex | Port infrastructure |
| grand-bazaar | city | high-prosperity | Thriving commerce hub |
| palace-keep | capital | — | Seat of power |
| dungeon | capital | — | State enforcement |

Infrastructure creates the generic slots that Pass 2 (culture) can substitute with cultural variants.

---

## Pass 2: Culture

Defined in `2026-04-06-culture-integration-design.md` Unit 2.2. Summary:

- Look up settlement's culture identity (foundation, primary sphere, biome group)
- Generate sublocation templates from culture identity axes (27 variant templates in `culture-content.ts`)
- **Substitutions** replace generic infrastructure slots with cultural versions (temple → Forge-Shrine)
- **Additions** are unique cultural places with no generic equivalent (Proving Ground)
- Tier-gated: hamlet gets 1 substitution; town gets +1 substitution +1 addition; city gets +1 sub +1 add
- Gated by `settlementCultureStrength` (0-1). Below 0.3 → only 1 substitution, no additions.
- Culture-specific NPC roles spawn at cultural sublocations (Shrine-Keeper, not generic priest)
- Culture trait (`trait_culture_<demonym>`) assigned to settlement, gates encounters/items/insider beats

### Settlement Culture Strength

Culture strength lives on the `belongs_to` edge connecting a location to its culture node, using the existing `CultureEdgeProperties.culturalStrength` field (`culture.ts:29`). This is the single source of truth — no duplication onto location node properties.

```typescript
// Read via: graph.getOutgoingEdges(locationId, 'belongs_to')
//   → find edge where target is culture node
//   → edge.properties.culturalStrength
```

If a location belongs to multiple cultures (historical + current), each `belongs_to` edge has its own strength. The genome's culture pass uses the **current** culture edge's strength.

Strength is computed at worldgen and updated on reassessment:

| Factor | Value | Condition |
|--------|-------|-----------|
| Base | 0.4 | Every culturally-affiliated settlement |
| Heartland bonus | +0.3 | Settlement is in culture's historical territory |
| Home place bonus | +0.2 | This is the culture's named capital |
| Dilution penalty | -0.1 | Per competing culture present via factions |

| Threshold | Effect |
|-----------|--------|
| < 0.3 | Minimal expression: 1 substitution only, generic NPC names |
| 0.3 - 0.5 | Normal tier-gated substitutions and additions, cultural NPC renaming |
| > 0.5 | Full expression: ruin echo flavor, insider beats eligible (`minStrength` on insider beats reads this same edge) |
| > 0.7 | Prose generation heavily weights cultural snippets |

---

## Pass 3: Spheres

Each of the 12 spheres contributes sublocations and NPC roles when its hex influence exceeds a threshold. This is the cosmic/environmental layer — what the land itself demands.

### Data Shape

```typescript
interface SphereContribution {
  sublocations: { id: SublocationTypeId; minTier: SettlementTier }[];
  npcRoles: { role: NpcRole; minTier: SettlementTier }[];
}

const SPHERE_SUBLOCATION_MENU: Record<Sphere, SphereContribution>;
```

### Sphere Contribution Table

NPC roles in this table must exist in the `NpcRole` union (`npc.ts:28`). Roles marked with **[NEW]** must be added to the union before implementation. Existing roles are unmarked.

| Sphere | Sublocations (tier-gated) | NPC Roles (tier-gated) |
|--------|--------------------------|------------------------|
| force | smithy (hamlet+), barracks (town+), arena (city+) | smith (hamlet+), guard (town+), commander (city+) |
| matter | mine-entrance (hamlet+), smelter (town+), mason-yard (city+) | mason (hamlet+), smith (town+) |
| energy | lightning-rod (town+), power-nexus (city+) | researcher (town+), scholar (city+) |
| life | herbalist-hut (hamlet+), healing-house (town+), conservatory (city+) | healer (hamlet+), priest (town+) |
| mind | study (hamlet+), library (town+), academy (city+) | scholar (town+), librarian (city+) |
| spirit | shrine (hamlet+), spirit-house (town+), oracle-chamber (city+) | priest (hamlet+), hermit (town+) |
| time | sundial-square (hamlet+), clocktower (city+) | scribe (town+), scholar (city+) |
| entropy | boneyard (hamlet+), plague-ward (town+) | healer (hamlet+), hermit (town+) |
| chaos | gambling-den (town+), fighting-pit (city+) | entertainer (town+), fence (city+) |
| order | courthouse (town+), archive (city+), high-court (capital+) | scribe (town+), noble (city+) |
| light | watchtower (hamlet+), beacon-tower (city+) | lookout (hamlet+), guard (city+) |
| darkness | smuggler-den (town+), black-market (city+) | fence (town+), informant (city+) |

### Sphere Thresholds

```typescript
const SPHERE_CONTRIBUTION_THRESHOLD = 0.3;  // sphere must exceed this to contribute
const SPHERE_STRONG_THRESHOLD = 0.6;         // above this, contributes an extra NPC of that type
```

### Position Modifier

Geographic position adds bonus sublocations independent of spheres:

```typescript
const POSITION_MODIFIERS: Record<'heartland' | 'borderlands', {
  bonusSublocations: SublocationTypeId[];
  bonusNpcRoles: NpcRole[];
}>;
```

| Position | Bonus Sublocations | Bonus NPCs |
|----------|-------------------|------------|
| borderlands | city-walls, watchtower | guard, scout |
| heartlands | festival-ground, granary | farmer, innkeeper |

---

## Pass 4: Reaches

The activity/economic layer. Reaches represent what people *do* here — commerce, warfare, diplomacy, craft. Unlike spheres (cosmic hex influence), reach scores are **derived from settlement contents**: faction presence, NPC roles, sublocation types, trade route activity.

### Settlement Reach Scores

Uses the canonical eight-reach taxonomy from `ReachDomain` in `traits.ts`:

```typescript
type SettlementReachProfile = Record<ReachDomain, number>;
// iron=military, gold=commerce, shadow=power/subterfuge, veil=arcane/concealment,
// heart=relationships/healing, eye=perception/knowledge, stone=craft/material,
// star=aspiration/leadership
```

Reach scores are computed from:
- **Faction presence** — each faction's `reachWeights` contribute proportionally
- **NPC roles** — each role has implicit reach affinity (guards → iron, merchants → gold)
- **Sublocation types** — each type has implicit reach affinity (market → gold, barracks → iron)
- **Trade routes** — active routes boost gold reach
- **Hex sphere bleed** — sphere influence contributes to related reaches (force sphere → iron reach, mind sphere → eye reach)

Reach scores are recalculated when factions arrive/depart, trade routes open/close, or the genome reassesses.

### Reach Contribution Table

```typescript
const REACH_SUBLOCATION_MENU: Record<Reach, {
  sublocations: { id: SublocationTypeId; minTier: SettlementTier }[];
  npcRoles: { role: NpcRole; minTier: SettlementTier }[];
}>;
```

| Reach | Sublocations (tier-gated) | NPC Roles (tier-gated) |
|-------|--------------------------|------------------------|
| iron | armory (town+), war-council (city+), siege-workshop (capital+) | guard (hamlet+), commander (town+), quartermaster (city+) |
| gold | counting-house (town+), customs-house (city+), exchange (capital+) | merchant (hamlet+), trader (town+), broker (city+) |
| shadow | hidden-passage (town+), thieves-guild (city+), spy-network (capital+) | fence (town+), informant (city+), spy (capital+) |
| veil | arcane-sanctum (town+), ward-stones (city+) | researcher (town+), librarian (city+) |
| heart | hospice (hamlet+), counselor-hall (town+), embassy (city+) | healer (hamlet+), priest (town+), steward (city+) |
| eye | scout-post (hamlet+), observatory (town+), intelligence-bureau (city+) | scout (hamlet+), lookout (town+), scholar (city+) |
| stone | workshop (hamlet+), guild-hall (town+), manufactory (city+) | smith (hamlet+), mason (town+), weaver (city+) |
| star | tavern (hamlet+), theater (city+), throne-room (capital+) | entertainer (hamlet+), herald (town+), noble (city+) |

### Reach Threshold

```typescript
const REACH_CONTRIBUTION_THRESHOLD = 0.3;  // reach must exceed this to contribute sublocations
```

---

## Pass 5: Archetype Recognition

After passes 1-4 accumulate sublocations, the recognition pass scans for patterns. An archetype is a named cluster that, when detected, adds a capstone sublocation, a prose flavor tag, and optionally NPC roles.

### Sublocation Tags

Each sublocation type carries 1-2 tags. Archetypes match on tag density, not specific sublocations — so different pass combinations can trigger the same archetype through different paths.

Tag vocabulary: `military`, `scholarly`, `arcane`, `commerce`, `religious`, `cultural`, `underworld`, `nature`, `authority`, `borderlands`.

### Archetype Definition

```typescript
interface SettlementArchetype {
  id: string;
  name: string;                              // "Garrison Town", "Arcane Conclave"
  requiredTags: SublocationTag[];            // minimum tags to trigger
  minMatches: number;                        // how many required tags must be present
  capstoneSublocations: SublocationTypeId[]; // added when archetype triggers
  capstoneNpcs: NpcRole[];                   // added when archetype triggers
  proseFlavor: string;                       // injected into settlement prose
  priority: number;                          // highest priority wins if multiple match
}
```

### Starter Archetypes

| Archetype | Required Tags (min count) | Capstone | Prose Flavor |
|-----------|--------------------------|----------|-------------|
| Garrison Town | military x3 | war-council, siege-stores | "a town that exists to hold the line" |
| Arcane Conclave | scholarly x2 + arcane x1 | arcane-council-chamber | "where knowledge is hoarded and secrets traded" |
| Trade Nexus | commerce x3 | merchant-prince-hall | "the sound of coin never stops" |
| Holy Seat | religious x2 + cultural x1 | cathedral, pilgrim-quarter | "faith made stone" |
| Thieves' Haven | underworld x2 + commerce x1 | hidden-court | "two economies — one you see, one you don't" |
| Frontier Bastion | military x2 + borderlands x1 | reinforced-keep, refugee-quarter | "the last safe place before the wild" |
| Nature Sanctuary | nature x2 + cultural x1 | ancient-grove, beast-pen | "the land speaks here, and they listen" |
| Seat of Power | authority x2 + military x1 | high-court, royal-guard-quarters | "power flows downhill from these walls" |

A settlement can have at most **one** archetype (highest priority wins). Settlements that match no archetype are valid — they're honest places without a dominant identity.

---

## Settlement Vitality

Settlements get a vitality score (0-1) that replaces raw prosperity thresholds for promotion/demotion decisions. Reuses the quintessence drift-toward-equilibrium pattern.

### Vitality Score

```typescript
settlementVitality: number; // 0-1, on location node properties
```

Drift inputs and formula:

```
targetVitality =
    (prosperity * VITALITY_PROSPERITY_WEIGHT)
  + (factionHealth * VITALITY_FACTION_WEIGHT)
  - (threatPressure * VITALITY_THREAT_WEIGHT)
  + (tradeActivity * VITALITY_TRADE_WEIGHT)

// Clamped to [0, 1]. Actual vitality drifts toward target per tick:
vitality += (targetVitality - vitality) * VITALITY_DRIFT_RATE
```

| Input | Weight Constant | Default | Source |
|-------|----------------|---------|--------|
| Prosperity | `VITALITY_PROSPERITY_WEIGHT` | 0.5 | Existing prosperity system |
| Faction health | `VITALITY_FACTION_WEIGHT` | 0.2 | Average health of factions present |
| Threat pressure | `VITALITY_THREAT_WEIGHT` | 0.2 | Count of hostile entities on adjacent hexes, normalized |
| Trade activity | `VITALITY_TRADE_WEIGHT` | 0.1 | Active trade routes / max possible routes |
| Drift rate | `VITALITY_DRIFT_RATE` | 0.05 | Per-tick convergence speed |

### Vitality Thresholds

```typescript
const SETTLEMENT_VITALITY_PROMOTION_THRESHOLD = 0.75;   // sustained above → promotion eligible
const SETTLEMENT_VITALITY_DEMOTION_THRESHOLD = 0.25;     // sustained below → demotion
const SETTLEMENT_VITALITY_SUSTAIN_TICKS = 60;             // must hold for 5 days (60 ticks at 12/day)
const SETTLEMENT_VITALITY_CRISIS_THRESHOLD = 0.1;         // emergency sublocations trigger
```

---

## NPC Roster Generation

Each pass contributes NPC roles. A per-tier budget caps total NPCs to prevent hamlets from feeling like cities.

### NPC Budget

```typescript
const NPC_BUDGET: Record<SettlementTier, { base: number; perSublocation: number }>;
```

| Tier | Base NPCs | Per Sublocation | Typical Total |
|------|-----------|----------------|---------------|
| hamlet | 3 | 1 | 5-8 |
| town | 6 | 1.5 | 12-20 |
| city | 10 | 2 | 25-40 |
| capital | 15 | 2.5 | 40-60 |

### NPC Placement Priority

1. **Direct match** — guard role → gatehouse/barracks (existing `NPC_ROLE_SUBLOCATION_MAP`)
2. **Tag match** — military NPC → any military-tagged sublocation
3. **Parent fallback** — no matching sublocation → parent location

### NPC Personality from Pass Context

- **Culture-pass NPCs** — motivations from culture's foundation bias
- **Sphere-pass NPCs** — motivations influenced by contributing sphere
- **Reach-pass NPCs** — motivations influenced by contributing reach
- **Archetype-capstone NPCs** — motivations from archetype flavor

### Deduplication Rules

- **Sublocations**: no duplicates across any passes. If culture and spheres both want a library, or if sphere (order) and reach (crown) both want a courthouse, one sublocation is created carrying tags from all contributing sources. Multi-source sublocations are stronger archetype signals.
- **NPCs**: duplicates allowed within budget. Two guards from different passes = more guards. Budget cap prevents runaway.

---

## Promotion / Demotion Reassessment

### Trigger Events

| Trigger | What Re-Runs |
|---------|-------------|
| Tier promotion (hamlet→town, town→city, etc.) | All 5 passes at new tier |
| Tier demotion (city→town, etc.) | All 5 passes at new tier; excess sublocations ruined |
| Reach score crosses threshold | Reach pass (4) + archetype recognition (5) only |
| Major faction arrives/departs | Reach recalculation → may trigger reach threshold crossing |
| Vitality crisis (below 0.1) | Emergency sublocations: refugee-quarter, field-hospital |

### Promotion Behavior

1. Infrastructure pass re-runs — new tier unlocks new generic sublocations
2. Culture baseline persists unchanged — heritage doesn't change with growth
3. Sphere pass re-runs — same spheres contribute higher-tier sublocations
4. Reach pass re-runs — higher-tier reach sublocations unlock
5. Archetype recognition re-runs — larger composition may cross new thresholds

### Demotion Behavior

1. Sublocations gated above the new tier are **marked as ruined** — still physically present, no longer functional, available as prose flavor ("the empty stalls of what was once a thriving market")
2. NPCs tied to ruined sublocations relocate to parent location or leave
3. Archetype tag removed if composition no longer meets threshold; capstone sublocations ruined
4. Culture baseline sublocations survive demotion — cultural heritage endures
5. Sphere/reach contributions at or below the new tier persist

### Reassessment Timing

```typescript
const PROMOTION_REASSESSMENT_DELAY = 6;     // ticks after tier change before reassessment (half a day)
const DEMOTION_RUIN_DECAY_TICKS = 120;       // ticks before ruined sublocation fully removed (10 days)
```

---

## Worked Example

**Hex context:** High force (0.7), moderate matter (0.4), low everything else. Borderlands position. Star-Readers culture (foundation: chaos, venerates: time + energy). City tier. Gold reach 0.5 (merchant consortium faction presence). Iron reach 0.6 (military order faction).

**Pass 1 — Infrastructure:**
inn, well-fountain, market-stall, temple-quarter, market-district, gatehouse, jail, town-hall, grand-bazaar (high prosperity)

**Pass 2 — Culture (Star-Readers, strength 0.7 — heartland):**
- Substitution: temple-quarter → Shattered Observatory (cultural temple variant)
- Substitution: town-hall → Star-Reading Chamber (cultural gathering variant)
- Addition: Lens-Grinder's Workshop (unique, city tier)
- NPCs: Star-Priest, Lens-Grinder, Chronicler of Skies

**Pass 3 — Spheres:**
- Force (0.7, strong): smithy, barracks, arena + smith, guard, champion. Extra guard (strong threshold).
- Matter (0.4): mine-entrance, smelter + miner, mason
- Position modifier (borderlands): city-walls, watchtower + guard, scout

**Pass 4 — Reaches:**
- Gold (0.5): counting-house, customs-house + merchant, tax-collector
- Iron (0.6): armory, war-council + soldier, captain

**Pass 5 — Archetype Recognition:**
Tags accumulated: scholarly x2 (observatory, lens-grinder), military x4 (barracks, arena, armory, war-council, city-walls), commerce x3 (market-district, grand-bazaar, counting-house, customs-house).
Multiple archetype candidates:
- Garrison Town (military x3) — matches
- Trade Nexus (commerce x3) — matches
- Priority: Garrison Town wins (borderlands + military dominance)
- Capstone: war-council (already exists → no duplicate), siege-stores added

**Result:** A fortified Star-Readers city on the frontier. The Shattered Observatory and Lens-Grinder's Workshop mark its scholarly heritage. The barracks, arena, city-walls, and siege-stores mark its military reality. The counting-house and customs-house mark its trade activity. The archetype is "Garrison Town" — *"a town that exists to hold the line"* — but one with telescopes on the battlements.

**Total sublocations:** ~20. **Total NPCs:** ~35 (within city budget of 25-40).

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SPHERE_CONTRIBUTION_THRESHOLD` | `0.3` | Minimum sphere influence to contribute sublocations |
| `SPHERE_STRONG_THRESHOLD` | `0.6` | Above this, sphere contributes an extra NPC |
| `REACH_CONTRIBUTION_THRESHOLD` | `0.3` | Minimum reach score to contribute sublocations |
| `SETTLEMENT_VITALITY_PROMOTION_THRESHOLD` | `0.75` | Vitality above this (sustained) → promotion |
| `SETTLEMENT_VITALITY_DEMOTION_THRESHOLD` | `0.25` | Vitality below this (sustained) → demotion |
| `SETTLEMENT_VITALITY_SUSTAIN_TICKS` | `60` | Ticks threshold must be held (5 game days) |
| `SETTLEMENT_VITALITY_CRISIS_THRESHOLD` | `0.1` | Below this, emergency sublocations trigger |
| `NPC_BUDGET_HAMLET` | `{ base: 3, perSublocation: 1 }` | NPC cap for hamlets |
| `NPC_BUDGET_TOWN` | `{ base: 6, perSublocation: 1.5 }` | NPC cap for towns |
| `NPC_BUDGET_CITY` | `{ base: 10, perSublocation: 2 }` | NPC cap for cities |
| `NPC_BUDGET_CAPITAL` | `{ base: 15, perSublocation: 2.5 }` | NPC cap for capitals |
| `PROMOTION_REASSESSMENT_DELAY` | `6` | Ticks after tier change before genome re-runs |
| `DEMOTION_RUIN_DECAY_TICKS` | `120` | Ticks before ruined sublocation is removed (10 days) |
| `ARCHETYPE_MAX_PER_SETTLEMENT` | `1` | Only one archetype per settlement |
| `VITALITY_PROSPERITY_WEIGHT` | `0.5` | Prosperity contribution to vitality target |
| `VITALITY_FACTION_WEIGHT` | `0.2` | Faction health contribution to vitality target |
| `VITALITY_THREAT_WEIGHT` | `0.2` | Threat pressure drain on vitality target |
| `VITALITY_TRADE_WEIGHT` | `0.1` | Trade route activity contribution to vitality target |
| `VITALITY_DRIFT_RATE` | `0.05` | Per-tick convergence speed toward target vitality |

Culture-specific constants are in `2026-04-06-culture-integration-design.md`.

## Tracing

Traces extend `TraceBase` from `trace.ts` and use the `category` field. Implementation must register new categories in the `TraceCategory` union and `TRACE_CATEGORIES` array (`trace.ts:16-71`), and add corresponding DebugPanel filter entries.

New trace categories to register: `settlement_genome`, `settlement_reassessment`.

```typescript
interface SettlementGenomeTrace extends TraceBase {
  category: 'settlement_genome';
  locationId: string;
  locationName: string;
  tier: SettlementTier;
  cultureBias: string;
  cultureStrength: number;
  spheresAboveThreshold: { sphere: string; value: number }[];
  reachesAboveThreshold: { reach: ReachDomain; value: number }[];
  position: 'heartland' | 'borderlands';
  passContributions: {
    infrastructure: SublocationTypeId[];
    culture: { substitutions: SublocationTypeId[]; additions: SublocationTypeId[] };
    sphere: SublocationTypeId[];
    reach: SublocationTypeId[];
    archetype: SublocationTypeId[] | null;
  };
  archetypeMatch: string | null;
  totalSublocations: number;
  totalNpcs: number;
  npcBudgetUsed: number;
  npcBudgetMax: number;
}

interface SettlementReassessmentTrace extends TraceBase {
  category: 'settlement_reassessment';
  locationId: string;
  trigger: 'promotion' | 'demotion' | 'reach_threshold' | 'faction_change' | 'vitality_crisis';
  previousTier: SettlementTier | null;
  newTier: SettlementTier | null;
  sublocationsAdded: SublocationTypeId[];
  sublocationsRuined: SublocationTypeId[];
  archetypeChange: { from: string | null; to: string | null } | null;
}
```

## PRNG Callouts

- **Pass 1-4 sublocation selection:** Seeded per settlement (deterministic per world seed). When multiple sublocations qualify within a tier/threshold, PRNG selects which ones fill remaining budget slots.
- **NPC generation:** Seeded per sublocation instance. Same sublocation at same settlement with same seed → same NPCs.
- **Archetype tiebreaking:** Priority field is deterministic. If equal priority, lower lexicographic archetype ID wins (no PRNG needed).
- **Vitality drift:** Deterministic from input factors. No PRNG in vitality computation.

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Settlement has no culture assignment | Skip Pass 2. Passes 1, 3, 4, 5 still produce a functional settlement. |
| Hex has no sphere data (null `sphereInfluence`) | Skip Pass 3. Log warning. |
| No factions present → reach scores all zero | Skip Pass 4. Settlement has infrastructure + culture + spheres only. |
| Sublocation type referenced but not defined | Skip that sublocation, log warning. Never crash the genome pipeline. |
| NPC budget exceeded mid-pass | Stop adding NPCs for remaining passes. Sublocations still created (they may be empty). |
| Archetype recognition finds no match | Settlement gets no archetype tag. This is normal, not an error. |
| Culture substitution target not found in infrastructure | Cultural sublocation created as addition instead. Log note. |
| Promotion reassessment during active tick | Queue reassessment for next tick. Never interrupt mid-tick processing. |
| `settlementCultureStrength` computation has missing data | Default to `CULTURE_STRENGTH_BASE` (0.4). |

## UI / Visibility

### Player-Facing

- **HexChronicle** — THE PLACES section renders sublocations grouped by pass origin. Cultural sublocations get cultural prose flavor. Archetype tag appears in settlement subtitle ("Garrison Town", "Arcane Conclave").
- **LocationView** — Full sublocation list with NPC rosters. Cultural sublocation names (Forge-Shrine) displayed instead of generic names.
- **HexSidebar** — Settlement tier + archetype name as summary. Vitality indicator (healthy/declining/crisis).
- **Prose** — Settlement description assembled from: generic layer (tier/size) + cultural layer (snippet pool) + archetype flavor sentence. Different views pick different prose topics per the culture integration design.

### Debug Inspection

- **DebugPanel** — Settlement genome trace viewable per location. Shows all five pass contributions, archetype match, NPC budget usage.
- **CLI** — `eval state.graph.getNode('location-id').properties.settlementGenome` to inspect genome result. `eval state.graph.getNode('location-id').properties.settlementVitality` for vitality.
- **Trace system** — `settlement_genome` and `settlement_reassessment` traces in standard trace viewer.

### Notifications

- Settlement promotion: toast notification ("The Bone Coast has grown into a city")
- Settlement demotion: toast notification ("The Bone Coast has fallen into decline")
- Archetype gained: chronicle event ("The Bone Coast is now known as a Garrison Town")
- Archetype lost: chronicle event ("The Bone Coast has lost its identity as a Garrison Town")

## Wiring

### New Module: `settlementGenome.ts`

| Surface | Integration Point |
|---------|-------------------|
| `worldSeed.ts` | After location placement and culture assignment, call `runSettlementGenome()` for each settlement location. Replaces current `ensureSublocations()` call for settlements. |
| `ensureSublocations()` | Retained as fallback for non-settlement locations (towers, ruins, lairs). Settlements use genome pipeline instead. |
| Orchestrator (`orchestrator.ts`) | New phase `phaseSettlementReassessment` — checks vitality thresholds and reach crossings, queues reassessments. Slots after `phaseSettlementPromotion` (Phase 6.635) in the tick loop. |
| `phaseProsperity` (Phase 6.63) | Existing prosperity system feeds into vitality computation. Vitality written to `belongs_to` edge properties alongside `culturalStrength`. |
| `phaseSettlementPromotion` (Phase 6.635) | Existing tier change logic triggers genome reassessment. Vitality thresholds replace raw prosperity thresholds for promotion/demotion decisions. |
| Settlement reach computation | New function `computeSettlementReaches()` — scans factions, NPCs, sublocations, trade routes to derive reach scores. Called during genome and on reassessment triggers. |

### UI Components

| Surface | Integration Point |
|---------|-------------------|
| `HexChronicle.tsx` | Archetype name in settlement subtitle. Cultural sublocation names in THE PLACES. |
| `LocationView.tsx` | Sublocation list uses genome-assigned names and cultural variants. |
| `HexSidebar.tsx` | Vitality indicator, archetype badge. |
| `AgentInfoCard.tsx` / `OverviewTab.tsx` | No changes — NPC placement is upstream. |

### Data Files

| File | Contents |
|------|----------|
| `settlement-infrastructure.ts` (new) | `SETTLEMENT_INFRASTRUCTURE` table |
| `sphere-sublocation-menu.ts` (new) | `SPHERE_SUBLOCATION_MENU` table |
| `reach-sublocation-menu.ts` (new) | `REACH_SUBLOCATION_MENU` table |
| `settlement-archetypes.ts` (new) | `SETTLEMENT_ARCHETYPES` definitions |
| `settlement-constants.ts` (new) | All genome constants (thresholds, budgets, timing) |
| `culture-sublocations.ts` (from culture design) | Cultural sublocation templates |

### Existing Systems Modified

| System | Change |
|--------|--------|
| `sublocation.ts` | `SUBTYPE_SUBLOCATION_MAP` retained for non-settlement locations. `ensureSublocations()` skipped for settlements when genome pipeline runs. |
| `npcSeeding.ts` | NPC spawning reads genome NPC roster instead of generic role lists. Placement uses genome-assigned sublocations. |
| `npc.ts` — `NpcRole` union | Extend with new roles required by sphere/reach menus. Current union has 35 roles. New roles needed (not already in union): `commander` is already present via `LOCATION_ROLE_ROSTERS` military_outpost but missing from sphere/reach tables — verify overlap. Roles genuinely new: none of the sphere/reach tables above should introduce roles outside the existing union. **Implementation constraint:** sphere and reach contribution tables must only reference roles from `NpcRole`. If a desired role doesn't exist, add it to the union first, then update `NPC_ROLE_SUBLOCATION_MAP` (`npc.ts:257`) and `LOCATION_ROLE_ROSTERS` (`npc.ts:121`) in the same PR. |
| `factionSeeding.ts` | Unchanged — faction halls are still dynamically created. Faction presence feeds into reach score computation. |
| `guildSeeding.ts` | Unchanged — guild halls are still dynamically created. Guild presence feeds into reach score computation. |
| Prosperity system | Vitality computation added as a downstream consumer of prosperity values. Existing prosperity thresholds replaced by vitality thresholds for tier changes. |

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | Every threshold, budget, timer is a named constant. Adding archetypes or sphere contributions = adding data rows, not code. |
| 2 | Inspectability | PASS | `SettlementGenomeTrace` documents every pass contribution. Each sublocation traceable to its source pass. |
| 3 | Determinism | PASS | All passes seeded per settlement via world seed. Same seed = same settlements. |
| 4 | Fail-soft | PASS | Each pass fails independently. Missing culture → skip Pass 2. Missing spheres → skip Pass 3. Pipeline never crashes. |
| 5 | Narrative over mechanical perfection | PASS | Culture guaranteed as floor. Archetype prose flavor. Ruined sublocations create history. |
| 6 | Additive over destructive | PASS | New data tables, new pipeline. `ensureSublocations()` retained for non-settlements. No existing systems deleted. |
| 7 | Performance budget | PASS with note | Genome runs once at generation + on discrete phase changes. Not per-tick. Reach recomputation on faction change is O(factions × reaches) — profile if faction churn is high. |

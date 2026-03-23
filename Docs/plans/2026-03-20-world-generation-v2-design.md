# World Generation v2 — 2nd Iteration Design

> **Status:** Design draft
> **Replaces:** The current rapid-prototype worldSeed pipeline (4-6 hardcoded locations, no river integration, weak cosmology influence, random actor placement)

---

## Problem Statement

The current world generation is a functional prototype with significant limitations:

1. **Location sparsity** — Only 4-6 locations in a 300-hex world (~2% coverage). Fixed to 30-50% in the immediate patch, but the placement logic is still random scatter.
2. **Rivers/lakes designed but not integrated** — `riverGeneration.ts`, `lakeGeneration.ts`, `lakeOutflow.ts` exist but aren't called from the production `generateWorld()` pipeline.
3. **Cosmology has negligible effect** — Sphere weights nudge noise by ±0.08. A "high entropy" world looks identical to a "high life" world.
4. **Actor placement is random** — Agents are assigned to random locations with no regard for terrain, culture, or settlement size.
5. **No settlement hierarchy** — A capital and a camp have the same seeding logic. No trade routes, no population distribution, no economic geography.
6. **Historical cultures don't shape the landscape** — Dead empires claim territory abstractly but don't leave physical traces (ruins, roads, cleared land).
7. **Single-pass, no feedback** — Generation runs linearly. Later systems can't influence earlier ones (e.g., cultures can't affect terrain, trade can't influence settlement placement).

---

## Design Principles

1. **Multi-pass pipeline with explicit dependencies** — Each pass declares inputs/outputs. Passes can be reordered or replaced without breaking the chain.
2. **Cosmology as world DNA** — Sphere weights should produce visually and mechanically distinct worlds. High-entropy worlds should *feel* different from high-order worlds.
3. **Geography drives civilization** — Settlement placement follows rivers, coastlines, and passes. Trade routes follow geography. Culture follows settlement.
4. **Layers build on layers** — Terrain → hydrology → resources → settlement → culture → population → history → player start. Each layer reads from previous layers.
5. **Tunable at every level** — Named constants for every threshold, probability, and count. A designer can reshape world feel by editing `game-config.ts`.

---

## Pipeline Architecture

### Pass Overview

```
Pass 0: Grid Scaffold          → HexTile[] (empty, with coordinates)
Pass 1: Continental Shape       → elevation field (Simplex noise + cosmology)
Pass 2: Climate                 → temperature + moisture fields (latitude + altitude + cosmology)
Pass 3: Biome Classification    → terrain types assigned to each hex
Pass 4: Hydrology               → rivers, lakes, depression filling, lake outflows
Pass 5: Coastline Refinement    → coastal terrain smoothing, reef placement
Pass 6: Region Detection        → geographic clusters identified + centroids computed
Pass 7: Resource Distribution   → resource deposits placed by terrain + noise
Pass 8: Historical Cultures     → dead empires seeded, territories claimed, ruins placed
Pass 9: Settlement Placement    → locations placed at geographic attractors
Pass 10: Trade Route Generation → connections between settlements based on geography
Pass 11: Living Cultures        → cultures generated from cosmology + settlement clusters
Pass 12: Population Seeding     → individuals placed at settlements proportional to size
Pass 13: Faction Generation     → factions seeded at settlements with cultural ties
Pass 14: Guild Seeding          → economic factions at trade-active settlements
Pass 15: Artifact Placement     → artifacts at ruins, shrines, and points of interest
Pass 16: Relationship Web       → inter-actor edges based on proximity + culture + faction
Pass 17: Validation             → assert graph integrity, hex coverage, determinism check
```

### Pass Contract Type

Every pass implements:

```typescript
interface WorldGenPass<TInput, TOutput> {
  /** Human-readable pass name */
  readonly name: string;
  /** Which previous passes this depends on (for ordering validation) */
  readonly dependencies: string[];
  /** Execute the pass. Pure function (except for rng consumption). */
  execute(input: TInput, rng: () => number): TOutput;
}
```

**PRNG discipline:** Each pass gets its own PRNG stream derived from `seed + PASS_SEED_OFFSET[passName]`. This ensures adding a new pass doesn't change the output of existing passes.

| Pass | Seed Offset | Rationale |
|------|-------------|-----------|
| Continental Shape | 7919 | Legacy compat with current forceField |
| Climate | 8123 | |
| Hydrology | 9001 | |
| Region Detection | 10007 | |
| Resource Distribution | 11003 | |
| Historical Cultures | 13331 | Legacy compat |
| Settlement Placement | 14159 | |
| Trade Routes | 15271 | |
| Living Cultures | 16381 | |
| Population Seeding | 17389 | |
| Faction Generation | 18397 | |
| Guild Seeding | 31337 | Legacy compat |
| Artifact Placement | 19403 | |
| Relationship Web | 20411 | |

**Constants table — pass seed offsets:**

| Constant | Value | Purpose |
|----------|-------|---------|
| `PASS_SEED_CONTINENTAL` | 7919 | Continental shape PRNG stream |
| `PASS_SEED_CLIMATE` | 8123 | Climate field PRNG stream |
| `PASS_SEED_HYDROLOGY` | 9001 | River/lake PRNG stream |
| `PASS_SEED_RESOURCES` | 11003 | Resource deposit PRNG stream |
| `PASS_SEED_HIST_CULTURES` | 13331 | Historical culture PRNG stream |
| `PASS_SEED_SETTLEMENTS` | 14159 | Settlement placement PRNG stream |
| `PASS_SEED_TRADE` | 15271 | Trade route PRNG stream |
| `PASS_SEED_CULTURES` | 16381 | Living culture PRNG stream |
| `PASS_SEED_POPULATION` | 17389 | Population distribution PRNG stream |
| `PASS_SEED_FACTIONS` | 18397 | Faction seeding PRNG stream |
| `PASS_SEED_GUILDS` | 31337 | Guild seeding PRNG stream |
| `PASS_SEED_ARTIFACTS` | 19403 | Artifact placement PRNG stream |
| `PASS_SEED_RELATIONSHIPS` | 20411 | Relationship web PRNG stream |

---

## Pass Details

### Pass 1: Continental Shape (existing, enhanced)

**Current state:** Simplex noise → elevation field. Works fine.

**Enhancement: Cosmology-driven continental templates.**

Instead of pure noise, the continental pass selects a **template modifier** based on dominant spheres:

| Dominant Sphere | Continental Template | Effect |
|-----------------|---------------------|--------|
| Force | Shattered — high frequency, jagged coastlines | `ELEV_OCTAVES += 2`, `ELEV_SCALE *= 1.5` |
| Matter | Massive — large landmasses, few islands | `ELEV_SCALE *= 0.5`, `LAND_BIAS += 0.15` |
| Energy | Volcanic — sharp peaks, caldera lakes | `ELEV_CONTRAST *= 1.4`, `VOLCANO_CHANCE *= 3` |
| Life | Lush — moderate elevation, wide river valleys | `MOISTURE_BIAS += 0.15`, `VALLEY_WIDTH *= 1.5` |
| Mind | Ordered — geometric coastlines, regular spacing | `ELEV_OCTAVES = 2` (smoother), `GRID_ALIGN += 0.2` |
| Spirit | Ethereal — floating islands, extreme elevation variance | `ELEV_VARIANCE *= 1.6`, `ISLAND_COUNT *= 2` |
| Time | Ancient — eroded, smooth, deep valleys | `ELEV_PERSISTENCE *= 0.7` (more erosion), `VALLEY_DEPTH *= 1.3` |
| Entropy | Broken — irregular, fractured landmasses | `ELEV_LACUNARITY *= 1.4`, `FAULT_LINE_COUNT += 2` |

**Constants table — cosmology template modifiers:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `COSMO_ELEV_OCTAVE_BONUS` | 2 | Extra noise octaves for Force template |
| `COSMO_ELEV_SCALE_MULT` | 1.5 | Scale multiplier for Force/Matter |
| `COSMO_LAND_BIAS` | 0.15 | Extra land probability for Matter |
| `COSMO_MOISTURE_BIAS` | 0.15 | Extra moisture for Life |
| `COSMO_VOLCANO_MULT` | 3.0 | Volcano frequency for Energy |
| `COSMO_ISLAND_MULT` | 2.0 | Island count for Spirit |
| `COSMO_EROSION_FACTOR` | 0.7 | Persistence reduction for Time |
| `COSMO_FAULT_LINES` | 2 | Extra fault lines for Entropy |
| `COSMO_TEMPLATE_STRENGTH` | 0.6 | How strongly the template overrides noise (0=none, 1=full) |

**Tracing:**

```typescript
interface ContinentalShapeTrace {
  type: 'continental_shape';
  seed: number;
  dominantSphere: SphereName;
  templateApplied: string;
  landHexCount: number;
  oceanHexCount: number;
  maxElevation: number;
  minElevation: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No dominant sphere (all equal) | Use pure noise (current behavior) |
| Template produces 0 land hexes | Rerun with `LAND_BIAS += 0.3` |
| Template produces 0 ocean hexes | Rerun with `LAND_BIAS -= 0.3` |
| All retries fail | Fall back to current noise-only |

---

### Pass 4: Hydrology (new integration)

**Current state:** `riverGeneration.ts`, `lakeGeneration.ts`, `lakeOutflow.ts` exist but aren't called from the production path.

**Design:** Integrate the existing hydrology passes into the main pipeline.

```
Fill depressions → Generate lakes → Generate rivers → Generate lake outflows → Mark hasRiver on tiles
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `RIVER_SOURCE_COUNT_MIN` | 4 | Minimum river sources |
| `RIVER_SOURCE_COUNT_MAX` | 8 | Maximum river sources |
| `RIVER_SOURCE_ELEV_THRESHOLD` | 0.7 | Minimum elevation for springs |
| `RIVER_MIN_LENGTH` | 4 | Discard stubby rivers |
| `LAKE_SIZE_MAX` | 5 | Normal lake max hexes |
| `GREAT_LAKE_SIZE_MAX` | 12 | Great lake max hexes |
| `GREAT_LAKE_COUNT` | 1 | Max great lakes per world |
| `LAKE_POUR_THRESHOLD` | 0.08 | Elevation band above basin for lake fill |

**Tracing:**

```typescript
interface HydrologyTrace {
  type: 'hydrology';
  riverCount: number;
  lakeCount: number;
  greatLakeCount: number;
  totalRiverHexes: number;
  totalLakeHexes: number;
  longestRiverLength: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No valid river sources (world too flat) | Skip rivers, log warning |
| Depression fill loops forever | Cap at 1000 iterations, accept remaining depressions |
| Lake outflow can't find path | Skip outflow for that lake |

---

### Pass 9: Settlement Placement (major redesign)

**Current state:** Random scatter on habitable tiles (fixed to 30-50% density, unique hexes).

**Design: Geographic attractor model.** Settlements don't spawn randomly — they spawn where civilizations would naturally build.

#### Settlement Attractors

Each habitable hex gets an **attractiveness score** computed from geographic features:

```typescript
interface SettlementAttractiveness {
  riverBonus: number;      // Adjacent to or on a river
  coastBonus: number;      // Adjacent to ocean (port potential)
  flatlandBonus: number;   // Low elevation, gentle terrain
  resourceBonus: number;   // Resource deposits nearby
  passBonus: number;       // Mountain pass (between peaks, on a route)
  confluenceBonus: number; // River junction
  lakeBonus: number;       // Adjacent to lake
  ruinsBonus: number;      // Historical culture ruins (reoccupation)
  isolationPenalty: number; // Too far from other settlements
  total: number;
}
```

**Constants table — attractor weights:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `SETTLE_RIVER_WEIGHT` | 3.0 | Bonus for adjacent river hex |
| `SETTLE_COAST_WEIGHT` | 2.5 | Bonus for adjacent ocean hex |
| `SETTLE_FLATLAND_WEIGHT` | 1.5 | Bonus for grassland/farmland/steppe |
| `SETTLE_RESOURCE_WEIGHT` | 2.0 | Bonus per resource deposit in 2-hex radius |
| `SETTLE_PASS_WEIGHT` | 3.0 | Bonus for mountain pass hexes |
| `SETTLE_CONFLUENCE_WEIGHT` | 4.0 | Bonus for river junction |
| `SETTLE_LAKE_WEIGHT` | 2.0 | Bonus for lake adjacency |
| `SETTLE_RUINS_WEIGHT` | 1.5 | Bonus for historical ruin hexes |
| `SETTLE_ISOLATION_PENALTY` | -2.0 | Penalty if no settlement within 5 hexes |
| `SETTLE_MIN_SPACING` | 2 | Minimum hex distance between settlements |
| `SETTLE_DENSITY_MIN` | 0.30 | Minimum fraction of habitable hexes with settlements |
| `SETTLE_DENSITY_MAX` | 0.50 | Maximum fraction |

#### Subtype Selection (terrain-aware, score-aware)

Instead of purely random subtype selection, the subtype is influenced by the attractor profile:

| Condition | Promoted Subtypes |
|-----------|-------------------|
| Highest attractor score in region | `capital`, `city` |
| River + coast | `town`, `city` (port) |
| River only | `town`, `hamlet` |
| Mountain pass | `fort`, `tower` |
| Resource-heavy | `mining`, `farmland` |
| Ruins nearby | `ruins`, `camp` |
| High elevation, isolated | `shrine`, `tower` |
| Low score, flat | `hamlet`, `camp`, `farmland` |

The first location (index 0) is always `capital` — this is the player's starting area seed, always placed at the highest-scored hex near the map center.

#### Procedural Location Naming

Names are generated from terrain + subtype fragments (already implemented in the density patch). The handcrafted `LOCATION_NAMES` array seeds the first 8 locations for flavor.

**Tracing:**

```typescript
interface SettlementPlacementTrace {
  type: 'settlement_placement';
  totalHabitableHexes: number;
  settlementsPlaced: number;
  densityAchieved: number;
  subtypeDistribution: Record<LocationSubtype, number>;
  capitalHex: { col: number; row: number };
  averageAttractiveness: number;
  minSpacingViolations: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No hex scores above 0 | Fall back to random scatter (current behavior) |
| Capital can't be placed near center | Pick highest-scored habitable hex anywhere |
| Insufficient habitable hexes for density | Place on all available, log warning |
| Name collision after 5 retries | Append numeric suffix |

**PRNG callout:** Settlement placement uses `PASS_SEED_SETTLEMENTS` stream. The attractor scoring is deterministic (pure computation from terrain data). Only the density fraction roll and tiebreaking between equal-scored hexes consume PRNG.

---

### Pass 10: Trade Route Generation (new)

**Current state:** No trade routes at world gen. Routes are only created during gameplay.

**Design:** Seed initial trade routes between nearby settlements based on geography.

#### Algorithm

1. For each pair of settlements within `TRADE_MAX_DISTANCE` hexes:
   - Compute path cost using A* over terrain costs (existing pathfinding)
   - Score route viability: `1.0 / pathCost * (srcPopulation + dstPopulation)`
   - If viability > `TRADE_VIABILITY_THRESHOLD`, create `trades_with` edge
2. Cap at `TRADE_MAX_ROUTES_PER_SETTLEMENT` per settlement
3. Prefer routes that follow rivers or coastlines (cost reduction)

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `TRADE_MAX_DISTANCE` | 8 | Max hex distance for trade consideration |
| `TRADE_VIABILITY_THRESHOLD` | 0.3 | Min score for route creation |
| `TRADE_MAX_ROUTES_PER_SETTLEMENT` | 3 | Cap routes per settlement |
| `TRADE_RIVER_COST_MULT` | 0.5 | Rivers halve travel cost |
| `TRADE_COAST_COST_MULT` | 0.6 | Coastal paths are cheaper |

**Tracing:**

```typescript
interface TradeRouteTrace {
  type: 'trade_route_generation';
  routesCreated: number;
  avgRouteLength: number;
  isolatedSettlements: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| A* can't find path | Skip that pair |
| Settlement has 0 routes | Log as isolated settlement (gameplay hook) |
| All routes too expensive | Lower threshold by 0.1, retry once |

---

### Pass 12: Population Seeding (major redesign)

**Current state:** 8-12 individuals placed at random locations.

**Design:** Population scales with settlement size and world scope.

#### Population Formula

```
worldPopulation = POPULATION_BASE + (settlementCount * POPULATION_PER_SETTLEMENT)
```

Distribution across settlements is proportional to settlement tier:

| Subtype | Population Weight |
|---------|-------------------|
| `capital` | 8 |
| `city` | 6 |
| `town` | 4 |
| `hamlet` | 2 |
| `fort` / `tower` / `castle` | 2 |
| `camp` | 1 |
| `shrine` / `temple` | 1 |
| `mining` | 2 |
| `farmland` | 2 |
| `ruins` | 0 (no permanent residents) |

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `POPULATION_BASE` | 10 | Minimum world population |
| `POPULATION_PER_SETTLEMENT` | 0.5 | Extra individuals per settlement |
| `POPULATION_MAX` | 60 | Hard cap on total individuals |
| `POPULATION_MIN_PER_INHABITED` | 1 | Every inhabited settlement gets at least 1 |

**Tracing:**

```typescript
interface PopulationSeedTrace {
  type: 'population_seeding';
  totalPopulation: number;
  settlementDistribution: Record<string, number>;
  uninhabitedSettlements: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| 0 habitable settlements | Place all agents at fallback loc.start |
| More agents than names | Use procedural name generator |
| Weight sum is 0 | Equal distribution |

**PRNG callout:** Name selection, axiological profile generation, domain capability rolls, faction membership rolls, and location assignment tiebreakers all consume from the `PASS_SEED_POPULATION` stream.

---

### Pass 8: Historical Cultures (enhanced)

**Current state:** 2-4 dead empires, greedy territory expansion, no physical traces.

**Enhancement: Ruin seeding.** When historical cultures claim territory, they leave behind:

- **Ruins** at 15-25% of their claimed hexes (weighted toward region centers)
- **Roads** connecting their settlements (trade route remnants, movement cost reduction)
- **Cleared terrain** — forest → grassland, jungle → savanna in their core territory

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `HIST_RUIN_DENSITY` | 0.20 | Fraction of claimed hexes with ruins |
| `HIST_ROAD_PROBABILITY` | 0.4 | Chance of road between adjacent claimed hexes |
| `HIST_CLEARING_RADIUS` | 2 | Hexes around ruin centers that get terrain cleared |
| `HIST_CLEARING_CHANCE` | 0.3 | Probability of clearing each hex in radius |

**Tracing:**

```typescript
interface HistoricalCultureTrace {
  type: 'historical_culture';
  cultureCount: number;
  totalClaimedHexes: number;
  ruinsPlaced: number;
  roadsCreated: number;
  hexesCleared: number;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| 0 regions to claim | Skip historical cultures entirely |
| Ruin placement exceeds habitable hexes | Cap at available hexes |
| Road pathfinding fails | Skip that road segment |

---

### Pass 17: Validation (new)

**Current state:** No validation. Broken graph edges would crash at runtime.

**Design:** Post-generation integrity checks.

```typescript
interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}
```

**Checks:**

| Check | Severity | Condition |
|-------|----------|-----------|
| Every location has a hex | Error | `hexCol`/`hexRow` exist and reference a valid tile |
| No duplicate locations on same hex | Error | Unique `(hexCol, hexRow)` per location |
| Every individual has a location | Error | `located_at` edge exists |
| Location density ≥ 30% | Warning | `locationCount / habitableHexCount >= 0.30` |
| At least 1 capital | Error | At least one location with subtype `capital` |
| Graph is connected (location subgraph) | Warning | All locations reachable via adjacency edges |
| Every culture has at least 1 member | Warning | `belongs_to` edge count > 0 |
| PRNG determinism | Error | Re-run with same seed produces identical graph hash |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Validation error | Log error, attempt auto-repair (e.g., add missing edges) |
| Auto-repair fails | Warn player, proceed anyway (fail-soft principle) |
| Determinism check fails | Log critical warning, proceed (gameplay unaffected) |

---

## Implementation Strategy

### Phase 1: Hydrology Integration (low risk, high impact)
- Wire existing `riverGeneration`, `lakeGeneration`, `lakeOutflow` into `generateWorld()`
- Mark `hasRiver` on tiles
- Visual: rivers already render via `RiverOverlay.tsx`

### Phase 2: Settlement Attractors (medium risk, high impact)
- Implement attractor scoring
- Replace random scatter with score-ranked placement
- Keep min-spacing enforcement from the density patch
- Capital placement at best hex near center

### Phase 3: Population Scaling (low risk, medium impact)
- Scale individual count with settlement count
- Distribute by settlement tier weight
- Add procedural name generation for > 16 agents

### Phase 4: Trade Route Seeding (low risk, medium impact)
- A* between nearby settlements
- Create `trades_with` edges at world gen
- Prosperity system already consumes these edges

### Phase 5: Cosmology Templates (medium risk, high impact)
- Continental shape modifiers per dominant sphere
- Climate modifiers per secondary sphere
- Visually distinct worlds per cosmology

### Phase 6: Historical Traces (medium risk, medium impact)
- Ruin placement in historical territories
- Terrain clearing around historical settlements
- Road remnants (movement cost reduction)

### Phase 7: Validation Pass (low risk, high value)
- Post-generation integrity checks
- Auto-repair for recoverable errors
- Determinism assertion

---

## NFP Compliance Summary

| Priority | Status | Notes |
|----------|--------|-------|
| 1. Tunability | PASS | Every threshold is a named constant with defaults table |
| 2. Inspectability | PASS | Every pass emits a typed trace. Validation pass checks integrity. |
| 3. Determinism | PASS | Per-pass PRNG streams with fixed offsets. Validation includes determinism check. |
| 4. Fail-soft | PASS | Every pass has a fail-soft table. No pass can crash the pipeline. |
| 5. Narrative > mechanics | PASS | Cosmology templates prioritize world *feel* over geographic realism |
| 6. Additive | PASS | Existing passes preserved. New passes slot in without rewriting. |
| 7. Performance budget | PASS with note | Attractor scoring is O(n) per hex. Trade route A* is O(n² log n) worst case — profile if > 100 settlements |

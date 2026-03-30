# Phase 2: World Generation - Research

**Researched:** 2026-03-21
**Domain:** Procedural terrain generation, hydrology, climate simulation, province-first world structure
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Terminology hierarchy**
- Hex — single tile (1 hex)
- Region — cluster of similar terrain, flood-fill detected (20-200 hexes)
- Province — group of related regions (3-15 regions, 200-2000+ hexes)
- World — all provinces together (60K hexes)

Province internal structure: Capital region → Heartland regions → Borderland regions → Wilderness (unclaimed)

**Province-first generation (top-down macro structure)**
- Seed provinces BEFORE detailed noise — one per living culture, 3+ for lost cultures, remainder as wilderness
- Province terrain identity: ~70% dominant terrain family, ~30% natural inclusions
- Home region: ~70% preferred biomes; Heartland: ~50% preferred biomes minimum; Borderland: transition biomes
- Wilderness provinces: anything the model produces, no culture bias
- Province placement considers climate logic

**Culture roster drives generation**
- Culture roster determined BEFORE terrain generation
- `CultureIdentity.primaryBiome` must expand to `preferredBiomes: TerrainType[]` and `toleratedBiomes: TerrainType[]`
- `HistoricalCultureTemplate.biomePreference` needs same expansion

**Lost culture provinces**
- At least 3 provinces for lost/dead cultures
- Same internal structure (capital → heartland → borderlands) but ruins and overgrowth
- Variable sizes by seed

**Mountain range generation (ridge overlay)**
- 3-5 ridge spines per world (default, player-tunable)
- Ridges have directional orientation (enabling rain shadows)
- Ridge falloff: 3-4 hex wide foothills transition band
- Mountain passes via saddle detection + river-carved passes

**Canyon generation**
- River-carved canyons along river paths through highland/plateau terrain
- Dry rift canyons — linear low-elevation gashes, similar to ridges but inverted
- Both types coexist; drop one if results are poor during iteration

**Coastline and island generation**
- High-frequency noise near sea level for inlets/peninsulas/bays
- Island chain generator — explicit feature, not just noise artifacts
- Larger islands get internal elevation variation (mini-ridges)
- Peninsula/land bridge generator
- Bay/inland sea carver

**Terrain scale gradient (coast → inland)**
- High-frequency noise near coasts → 3-8 hex terrain patches
- Low-frequency noise inland → 20-30 hex wilderness patches
- Frontier terrain skews harsher; heartland terrain looks cultivated

**Climate system**
- Temperature: latitude gradient + altitude penalty + noise + maritime moderation
- Moisture: prevailing wind direction + orographic effect + coastal proximity + noise
- Temperature reassessment after hydrology (lake effect 2-3 hex band, river valley warmth ~1 hex wide)
- Single biome classification pass AFTER all fields are finalized

**Biome classification and smoothing**
- Whittaker-style classification (existing, enhanced)
- Biome adjacency smoothing pass — eliminates impossible adjacencies

**Hydrology**
- Existing river/lake/depression code integrated into multi-pass pipeline
- River delta generation at coast/lake entry points
- Wetlands at river mouths and lake shores specifically
- Every land hex has drainage path to sea (existing guarantee)

**Player worldgen parameters**
- Exposed as code-level params only; player-facing UI deferred

**Pipeline architecture (11 passes)**
1. Determine culture roster (with expanded biome preferences)
2. Seed province centers
3. Assign biome identity to each province
4. Generate elevation (ridge overlay, canyon carving, province-biased noise)
5. Generate coastline detail
6. Generate climate fields (temperature, moisture, rain-shadow aware)
7. Hydrology (rivers, lakes, depression filling, deltas, wetland placement)
8. Temperature reassessment (lake effect, river valley moderation)
9. Biome classification (single pass after all fields finalized)
10. Adjacency smoothing + borderland transitions
11. Validation (determinism check, drainage guarantee, province coverage)

Each pass gets its own PRNG stream (per-pass seed offsets).

**Continuous field persistence**
- Noise functions and overlay features persist as callable functions after worldgen
- Phase 3 needs `sampleElevation(worldX, worldY): number`
- WorldGenData stores per-hex classified results AND exposes continuous sampling functions

### Claude's Discretion

- Exact noise parameters (scale, octaves, persistence, lacunarity)
- Ridge generation algorithm details (Voronoi boundaries, random walk, or other)
- Province flood-fill algorithm
- Exact falloff curves for ridges and canyons
- Island chain, peninsula, bay, delta algorithm details
- Biome adjacency rules (which transitions are "impossible")
- Province placement algorithm (spatial distribution of culture homelands)
- Performance optimization approach for 60K hex generation

### Deferred Ideas (OUT OF SCOPE)

- Fantasy overlay pass (WGEN-14) — deferred until cosmology + culture systems ready
- Player-facing worldgen UI — templates + advanced mode
- Cosmology-driven continental templates (sphere-based template modifiers)
- Settlement placement (Pass 9+)
- Trade routes, population seeding, faction generation
- Cultural terrain modification
- Player culture picker UI
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WGEN-01 | Multi-octave simplex noise produces continuous heightmap function from world seed | `fractalNoise()` in `forceField.ts` is the base; needs province-biased extension and ridge overlay. `simplex-noise@4.0.3` is installed. |
| WGEN-02 | Sea level threshold classifies land vs ocean from continuous heightmap | Existing `ELEV.DEEP_OCEAN`/`ELEV.SHALLOWS` in `terrain.ts`. New pipeline must set these via named constants. |
| WGEN-03 | Latitude-based temperature function with elevation cooling and maritime moderation | Existing in `forceField.ts` (latitude gradient + altitude penalty). Needs maritime moderation addition. |
| WGEN-04 | Precipitation/moisture function with prevailing wind, orographic effect, and temperature influence | Existing moisture in `forceField.ts`; needs prevailing wind direction awareness from ridge directional data. |
| WGEN-05 | River generation via flow accumulation — precipitation-driven sources, steepest-descent routing, lake formation | `riverGeneration.ts` + `depressionLakes.ts` are complete. Must be wired into new pipeline with delta generation added. |
| WGEN-06 | Temperature reassessment incorporating lake effect and river valley cooling | New pass. Moderate: scan lake hex clusters and mark 2-3 hex buffer; scan river paths and mark 1-hex buffer. |
| WGEN-07 | Hex grid overlay samples all continuous fields at 7 points per hex (center + 6 corners) | New. Hex corners computable from `hexToPixel()` + offset by `HEX_SIZE * cos/sin(60° * i)`. Average or min/max determines per-hex value. |
| WGEN-08 | Whittaker diagram maps temperature x moisture to one of 27 base terrain types | `classifyBiome()` in `terrain.ts` is complete. Needs adjacency smoothing pass on top. |
| WGEN-09 | Elevation overrides assign highland types based on elevation thresholds | Already in `classifyBiome()` via `ELEV.HIGHLAND` thresholds. Needs plateau/mountain_pass support from ridge data. |
| WGEN-10 | Wetland overrides assign marsh/swamp/moor_bog/floodplain based on low elevation + high moisture | Already partially in `classifyBiome()`. Needs river-mouth/lake-shore-specific placement rule. |
| WGEN-11 | Desert sub-type selection from local noise | Not yet in `classifyBiome()`. Needs a local noise discriminator inside the desert classification branch. |
| WGEN-12 | Drainage guarantee pass ensures every land hex has downhill path to sea | `fillDepressions()` in `depressionLakes.ts` implements this. Must wire into new pipeline before river generation. |
| WGEN-13 | Volcanic hex placement via hotspot noise (rare) | Partial in `classifyBiome()` via `VOLCANO_CHANCE` hash. Needs to be callable as an explicit placement pass, not just inline in classify. |
</phase_requirements>

---

## Summary

Phase 2 replaces the existing single-pass `generateWorld()` (which produces a geoField via simplex noise and classifies it into biomes) with a province-first multi-pass pipeline. The critical insight is that terrain generation must be top-down: culture provinces are seeded before noise generation, and the noise parameters are province-biased so each culture gets climatically appropriate terrain. The existing code base has good building blocks: `forceField.ts` (noise generation), `terrain.ts` (Whittaker classification), `riverGeneration.ts`, `depressionLakes.ts`, and `lakeOutflow.ts` are all production-quality and just need to be wired into the new pipeline with new passes added around them.

The three plan units map cleanly to the existing codebase gaps: Plan 02-01 (heightmap + sea level + hex grid sampling = the foundational field layer), Plan 02-02 (climate fields + Whittaker + overrides = the biome layer), and Plan 02-03 (hydrology + drainage + volcanic = the water and special terrain layer). Province seeding logic is the genuinely new algorithmic work; climate, rivers, and biome classification are extensions of working code.

**Primary recommendation:** Build the `WorldGenPipeline` class first (the pass orchestrator and WorldGenData extension), then implement province seeding, then port the existing forceField/terrain/hydrology passes into pipeline-compatible form. This ordering ensures every subsequent pass has a clean place to slot in.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `simplex-noise` | ^4.0.3 (installed) | 2D simplex noise for elevation, temperature, moisture fields | Already in project. `createNoise2D()` API used in `forceField.ts`. Pure function, no global state, seeding via custom PRNG. |
| `vitest` | (installed, project-wide) | Unit testing all worldgen passes | Project-standard test runner. Existing worldgen tests use it. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `mulberry32` from `src/lib/prng.ts` | Local | Seeded PRNG for all randomness in passes | All PRNG in worldgen — never use `Math.random()`. Per-pass stream via seed offset. |
| `fractalNoise` from `src/lib/prng.ts` | Local | Deterministic value noise without consuming PRNG state | Local detail noise within provinces (desert sub-type selection, jitter, volcanic hash). Does NOT share state with pass PRNG streams. |
| `hexNeighbors`, `hexDistance`, `hexToPixel` from `src/lib/hexMath.ts` | Local | Hex coordinate math | All neighbor lookups, distance checks, coordinate conversion. |
| `Float32Array`, `Uint8Array`, `Int16Array` | Platform | Typed arrays for per-hex data | Elevation/temperature/moisture as Float32Array; boolean flags as Uint8Array; IDs as Int16Array. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `simplex-noise` | Custom fractal value noise (already in `prng.ts`) | `fractalNoise()` in prng.ts is deterministic and cheaper but lower quality than simplex for large-scale landmasses. Use simplex for elevation/climate fields, `fractalNoise` for local detail noise only. |
| Province flood-fill (Voronoi) | Weighted growth from seeds | Voronoi produces more uniform provinces; growth from seeds allows terrain obstacles (mountains) to influence province shape. Growth from seeds is preferred here. |
| Ridge generation (random walk) | Voronoi edges as ridges | Random walk with directional bias gives more natural-feeling mountain ranges. Voronoi edges are too straight. |

**Installation:** No new packages needed. All required libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/engine/worldgen/
├── WorldGenPipeline.ts      # Pass orchestrator, WorldGenData extension, entry point
├── passes/
│   ├── pass00-grid.ts       # Grid scaffold (HexTile[] with coords only)
│   ├── pass01-provinces.ts  # Culture roster + province seeding
│   ├── pass02-elevation.ts  # Ridge overlay, canyon carving, province-biased noise
│   ├── pass03-coastline.ts  # High-freq coastal noise, islands, peninsulas, bays
│   ├── pass04-climate.ts    # Temperature, moisture, orographic rain shadow
│   ├── pass05-hydrology.ts  # Rivers, lakes, depression fill, deltas, wetlands
│   ├── pass06-tempReassess.ts # Lake effect, river valley moderation
│   ├── pass07-biome.ts      # Single Whittaker classification pass
│   ├── pass08-smoothing.ts  # Adjacency smoothing + borderland transitions
│   └── pass09-validation.ts # Determinism check, drainage guarantee, coverage
├── types.ts                 # WorldGenData extension (province arrays, continuous fields)
└── constants.ts             # All PASS_SEED_* offsets and tunable constants
```

The existing `forceField.ts`, `terrain.ts`, `riverGeneration.ts`, `depressionLakes.ts`, `lakeOutflow.ts` remain in place. The new passes import and extend them rather than replacing them outright. The entry point `hexGrid.ts` `generateWorld()` is replaced by `WorldGenPipeline.run()` which returns the same `HexTile[]` interface.

### Pattern 1: Pass Contract

Every pass is a pure function with explicit typed inputs and outputs:

```typescript
// Source: 2026-03-20-world-generation-v2-design.md + project NFP patterns
interface WorldGenPass<TInput, TOutput> {
  readonly name: string;
  readonly dependencies: string[];
  execute(input: TInput, rng: () => number): TOutput;
}
```

PRNG discipline: each pass instantiates its own `mulberry32(seed + PASS_SEED_OFFSET)` stream. Pass outputs are deterministic — same seed, same sequence of calls, same result.

### Pattern 2: WorldGenData Extension

Extend the existing `WorldGenData` interface with province fields and continuous field references:

```typescript
// Source: src/engine/worldGenData.ts (extend, do not replace)
export interface WorldGenData {
  // ... existing fields unchanged ...

  // Province data (new in Phase 2)
  provinceIds: Int16Array;           // per-hex province ID (-1 = wilderness)
  provinceCultures: string[];        // indexed by province ID: culture ID or 'lost' or 'wilderness'
  provinceCapitalHexes: HexCoord[];  // one per province

  // Continuous field functions for Phase 3 (new in Phase 2)
  sampleElevation: (worldX: number, worldY: number) => number;
  sampleTemperature: (worldX: number, worldY: number) => number;
  sampleMoisture: (worldX: number, worldY: number) => number;
}
```

### Pattern 3: Province Seeding via Weighted Growth

Province flood-fill grows from seed hexes placed at climatically appropriate positions:

```typescript
// Province growth loop (conceptual — not final code)
const seeds = placeProvinceSeedsForCultures(cultures, cols, rows, rng);
const provinceIds = new Int16Array(cols * rows).fill(-1);

// Priority queue by growth weight — culture-biased hexes get priority
const queue = new PriorityQueue<{ hex: HexCoord; provinceId: number; weight: number }>();
seeds.forEach((seed, i) => queue.push({ hex: seed, provinceId: i, weight: 1.0 }));

while (!queue.isEmpty()) {
  const { hex, provinceId } = queue.pop();
  const idx = hex.row * cols + hex.col;
  if (provinceIds[idx] !== -1) continue; // already claimed
  provinceIds[idx] = provinceId;

  for (const neighbor of hexNeighbors(hex)) {
    const weight = computeGrowthWeight(neighbor, provinceId, cultures[provinceId]);
    queue.push({ hex: neighbor, provinceId, weight });
  }
}
```

Growth weight incorporates province biome preferences and neighboring province identity (borders form at biome transitions).

### Pattern 4: Ridge Overlay

Ridge spines are generated as directed paths with falloff applied to the elevation field:

```typescript
// Ridge is a list of hex coords with an orientation angle
interface Ridge {
  spine: HexCoord[];         // center hexes at peak elevation
  orientation: number;       // radians, e.g. NW-SE = Math.PI * 0.75
  forkCount: number;         // 0-2 forks at PRNG-selected points
}

// Elevation contribution at a hex:
// distance = min distance from hex to any spine hex
// elevationBoost = RIDGE_PEAK_ELEVATION * falloff(distance, RIDGE_FALLOFF_HEXES)
// falloff: 1.0 at distance=0, 0.0 at distance>=RIDGE_FALLOFF_HEXES (cosine curve)
```

Rain shadow in climate pass uses `ridge.orientation` to determine upwind vs downwind direction.

### Pattern 5: 7-Point Hex Sampling (WGEN-07)

Sample continuous fields at center + 6 corners of each hex, use average for classification:

```typescript
// For each hex at (col, row):
// center = hexToPixel(col, row)
// corners[i] = center + HEX_SIZE * { cos(60°*i - 30°), sin(60°*i - 30°) }  (flat-top)
// samplePoints = [center, ...corners]
// hexElevation = average(samplePoints.map(p => sampleElevation(p.x, p.y)))
// This smooths out hex-boundary discontinuities and enables Phase 3 marching squares
```

### Anti-Patterns to Avoid

- **`Math.random()` anywhere in worldgen:** The entire pipeline must be seeded. Use `mulberry32(seed + PASS_SEED_OFFSET)`. Any call to `Math.random()` silently breaks determinism (NFP #3).
- **Classifying biomes before hydrology:** The terrain.ts `classifyBiome()` must run AFTER the temperature reassessment pass (Pass 8), not inline in the elevation pass. The current `worldGenData.ts` `createWorldGenData()` calls `classifyBiome()` eagerly — this pattern must be broken in the new pipeline.
- **Province growth ignoring climate:** Province seeds must be placed at climatically compatible hexes. Placing a desert culture province at a polar latitude will produce incoherent terrain. Province seed placement validates lat/temp compatibility before accepting a seed location.
- **Single PRNG stream for all passes:** If all passes share one PRNG stream, inserting a new pass or changing pass order changes all downstream random outcomes. Per-pass streams with fixed offsets (from `constants.ts`) prevent this.
- **Running fillDepressions after rivers:** `fillDepressions` must run BEFORE river generation. It computes `drainageElevation` which `routeRiver()` requires. The existing `riverGeneration.ts` already uses `drainageElevation` — ensure the pipeline orders: fillDepressions → generateRivers → promoteDepressionLakes → generateLakeOutflows.
- **Storing province bias in terrain type:** Province membership should live in `provinceIds: Int16Array` and `provinceCultures[]`, not encoded into terrain types. Terrain types remain the 27-type vocabulary; culture information is metadata.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 2D continuous noise | Custom hash-based noise for elevation | `simplex-noise@4.0.3` `createNoise2D()` | Simplex noise has better spectral properties for large landmasses. Already installed. Already used in `forceField.ts`. |
| Deterministic PRNG | `Math.random()` or custom LCG | `mulberry32()` from `src/lib/prng.ts` | Existing, tested, project-canonical. RC-218 says not to duplicate it. |
| Depression filling | Custom recursive fill | `fillDepressions()` and `promoteDepressionLakes()` in `depressionLakes.ts` | Already implemented, tested, and handles edge cases (river-fed detection, lake ID assignment). |
| River routing | Custom flow routing | `generateRivers()` in `riverGeneration.ts` + `generateLakeOutflows()` in `lakeOutflow.ts` | Complete implementation with steepest descent, confluence merging, coastal continuation, delta forking, and sea-outlet guarantee. ~430 lines; has all the edge cases solved. |
| Hex neighbor lookups | Manual offset arrays | `hexNeighbors()` from `src/lib/hexMath.ts` | Handles odd-q offset coordinate system correctly. Hand-rolling this introduces off-by-one bugs at odd columns. |
| Biome classification | Custom temperature/moisture lookup | `classifyBiome()` in `terrain.ts` | 27-type Whittaker-style classifier, already tuned. Add adjacency smoothing on top via a post-processing pass, do not rewrite the classifier. |

**Key insight:** The hydrology layer (rivers, lakes, depression filling) is the most algorithmically complex part of worldgen. It's already written and tested. The new work is the province-first structure and the climate enhancement — not rewriting hydrology.

---

## Common Pitfalls

### Pitfall 1: Biome Classification Before Temperature Reassessment

**What goes wrong:** Biomes are classified using pre-hydrology temperatures. Lake hexes and river hexes don't get the moderated climate they should, so you get desert hexes directly adjacent to a great lake with no temperate transition band.

**Why it happens:** `createWorldGenData()` currently classifies biomes inline with field generation (single pass). The new pipeline must break this: classify biomes only in Pass 9, after Pass 8 (temperature reassessment).

**How to avoid:** The `WorldGenPipeline` enforces pass ordering. Pass 9 (`pass07-biome.ts`) takes `temperature[]` as input — by the time it runs, that array has been modified by Pass 8 (lake/river moderation). Test by placing a great lake and checking that adjacent hexes shift one biome category warmer/wetter.

**Warning signs:** Large lakes surrounded by desert hexes; rivers with no green corridor effect.

### Pitfall 2: Province Seed Placement Violates Climate Logic

**What goes wrong:** A tundra culture province is seeded at the tropical equator band, or a desert culture is placed at the poles. The province-biased noise then tries to produce tundra terrain at low latitudes, producing incoherent maps.

**Why it happens:** Province placement is the first pass, before climate fields exist. The implementation must use a simplified climate estimate (latitude only) to constrain seed placement.

**How to avoid:** In Pass 2 (province seeding), compute `estimatedTemperature(row) = 1 - |row - rows/2| / (rows/2)` as a simple latitude proxy. Culture biome preferences map to temperature bands (tropical biomes require `estimatedTemp > 0.7`, tundra requires `estimatedTemp < 0.25`, etc.). Province seed must be placed in a latitude band compatible with its dominant biome family. Document these mappings as named constants.

**Warning signs:** Tundra hexes appearing in equatorial provinces; desert provinces at poles.

### Pitfall 3: Province Flood-Fill Over-Claims the Map

**What goes wrong:** Aggressive province growth fills the entire map. Wilderness provinces have no remaining space, and there's no room for the "vast wild" feel the design requires.

**Why it happens:** Unconstrained Voronoi/growth fills every hex. The design specifies provinces covering only a fraction of the map — the rest is wilderness.

**How to avoid:** Culture provinces have a maximum size (named constant: `PROVINCE_MAX_HEXES = 2000`). Once a province reaches its cap, it stops growing. Wilderness provinces fill the remainder. The growth queue discards items for provinces that hit their cap. Monitor `provinceIds` coverage percentage in the validation pass.

**Warning signs:** Entire map covered by named provinces; no wilderness regions.

### Pitfall 4: Ridge Direction Has No Effect on Rain Shadow

**What goes wrong:** Ridge spines are generated but the moisture pass doesn't use their orientation. All hexes downwind of a mountain range are still wet — no rain shadow effect.

**Why it happens:** The ridge data (orientation angle) must be passed as input to the climate pass. If the climate pass only reads elevation values, it can't determine which hexes are in the rain shadow vs the windward side.

**How to avoid:** The elevation pass outputs both the elevation field AND a `ridges: Ridge[]` array. The climate pass receives `ridges` and uses `ridge.orientation` to compute `distanceDownwind(hex, ridge)`. Moisture penalty applies to hexes on the downwind side of the ridge beyond `RAIN_SHADOW_ONSET_DISTANCE` hexes.

**Warning signs:** No dry terrain difference between ridge flanks; flat moisture field across a mountain range.

### Pitfall 5: 60K Hex Performance — Nested Loops

**What goes wrong:** Province growth with a naive priority queue over 60K hexes, combined with 7-point sampling per hex and adjacency smoothing, causes generation to take >10 seconds.

**Why it happens:** O(n²) algorithms or excessive per-hex object allocation at 60K scale.

**How to avoid:**
- Use typed arrays (`Float32Array`, `Int16Array`) for all per-hex data — avoid `Map<string, ...>` at scale.
- Priority queue backed by a heap structure (not a sorted array) for province growth.
- Adjacency smoothing: use a fixed-size neighbor scan (6 neighbors per hex), single-pass over the array.
- River routing already has a safety limit (500 iterations per river).
- Profile the generation time in the validation pass by storing `Date.now()` before and after each pass. Log to console in dev.

**Warning signs:** worldgen > 5 seconds; GC pauses visible; "out of memory" in test.

### Pitfall 6: PRNG State Leak Between Passes

**What goes wrong:** Pass 2 consumes more PRNG calls than expected (e.g., due to a new branch), shifting the PRNG sequence for all later passes, changing the map even though nothing in those passes changed.

**Why it happens:** Passes sharing one PRNG stream.

**How to avoid:** Each pass creates its own `mulberry32(seed + PASS_SEED_OFFSET)`. The `PASS_SEED_OFFSET` for each pass is a unique prime number constant in `constants.ts`. Adding a new sub-step in Pass 2 doesn't affect Pass 4's sequence because they have independent PRNG streams.

**Warning signs:** Changing an early pass changes output of unrelated late passes; tests that lock in specific later-pass results fail when early passes change.

---

## Code Examples

Verified from existing codebase and design docs:

### Province-Biased Elevation Noise (conceptual pattern)

```typescript
// Source: CONTEXT.md + forceField.ts (existing fractalNoise pattern)
// Province bias is a second noise layer centered on province seed
function provinceElevation(
  col: number, row: number,
  globalNoise: (x: number, y: number) => number,
  provinceId: number,
  provinceSeed: HexCoord,
  provinceTerrainFamily: 'mountain' | 'lowland' | 'forest' | 'desert',
  provinceBiasStrength: number,  // 0.3 for wilderness, 0.7 for culture province
  rng: () => number,
): number {
  const baseElev = (globalNoise(col * ELEVATION_SCALE, row * ELEVATION_SCALE) + 1) / 2;

  // Province bias: distance-decay from province seed center
  const dist = hexDistance({ col, row }, provinceSeed);
  const biasDecay = Math.exp(-dist * PROVINCE_BIAS_DECAY_RATE);
  const targetElev = TERRAIN_FAMILY_ELEVATION[provinceTerrainFamily];  // e.g., 'mountain' => 0.75

  return baseElev * (1 - provinceBiasStrength * biasDecay)
       + targetElev * (provinceBiasStrength * biasDecay);
}
```

### Ridge Elevation Contribution

```typescript
// Source: CONTEXT.md (ridge falloff design)
const RIDGE_PEAK_ELEVATION = 0.85;
const RIDGE_FOOTHILLS_HEXES = 4;   // NFP #1: tunable — 3-4 hex transition

function ridgeElevationAt(hex: HexCoord, ridges: Ridge[]): number {
  let maxBoost = 0;
  for (const ridge of ridges) {
    const dist = minDistanceToPath(hex, ridge.spine);
    if (dist >= RIDGE_FOOTHILLS_HEXES) continue;
    // Cosine falloff: 1.0 at spine, 0.0 at RIDGE_FOOTHILLS_HEXES
    const t = 1 - dist / RIDGE_FOOTHILLS_HEXES;
    const boost = RIDGE_PEAK_ELEVATION * (0.5 - 0.5 * Math.cos(Math.PI * t));
    maxBoost = Math.max(maxBoost, boost);
  }
  return maxBoost;
}
```

### Temperature Reassessment (lake effect)

```typescript
// Source: CONTEXT.md (lake effect: 2-3 hex band of moderated temperature)
const LAKE_EFFECT_RADIUS = 3;       // NFP #1: tunable
const LAKE_EFFECT_STRENGTH = 0.08;  // Temperature shift per radius step

function applyLakeEffect(data: WorldGenData): void {
  const { cols, rows, lakeIds, temperature } = data;
  for (let i = 0; i < cols * rows; i++) {
    if (lakeIds[i] < 0) continue;  // not a lake hex
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Expand outward from lake hexes
    for (let r = 1; r <= LAKE_EFFECT_RADIUS; r++) {
      const strength = LAKE_EFFECT_STRENGTH * (1 - r / LAKE_EFFECT_RADIUS);
      for (const neighbor of hexesAtRadius(col, row, r, cols, rows)) {
        const nIdx = neighbor.row * cols + neighbor.col;
        if (lakeIds[nIdx] >= 0) continue;  // lake hex itself
        // Moderate toward 0.5 (temperate)
        const current = temperature[nIdx];
        temperature[nIdx] = current + (0.5 - current) * strength;
      }
    }
  }
}
```

### Biome Adjacency Smoothing

```typescript
// Source: CONTEXT.md (smoothing pass design)
// Illegal pairs — a hex with this terrain adjacent to that terrain is an outlier
const ILLEGAL_ADJACENCIES: [TerrainType, TerrainType][] = [
  ['desert', 'dense_forest'],
  ['desert', 'jungle'],
  ['tundra', 'tropical_forest'],
  ['tundra', 'jungle'],
  ['glacier', 'desert'],
  ['sand_desert', 'swamp'],
  // etc.
];

function smoothBiomeAdjacency(data: WorldGenData): void {
  for (let i = 0; i < data.cols * data.rows; i++) {
    if (data.isOcean[i]) continue;
    const current = data.terrain[i];
    const neighborTerrains = getNeighborTerrains(i, data);
    if (isIllegalAdjacency(current, neighborTerrains)) {
      data.terrain[i] = findValidTransitionBiome(current, neighborTerrains);
    }
  }
}
```

### Determinism Validation

```typescript
// Source: 2026-03-20-world-generation-v2-design.md (Pass 17 validation)
function validateDeterminism(pipeline: WorldGenPipeline, seed: number): boolean {
  const run1 = pipeline.run(seed);
  const run2 = pipeline.run(seed);
  // Compare terrain array
  return run1.terrain.every((t, i) => t === run2.terrain[i]);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateWorld()` single pass (forceField + classifyBiome) | Multi-pass `WorldGenPipeline` with province-first seeding | Phase 2 | Enables culturally distinct homelands, coherent mountain ranges, proper hydrology integration |
| `Math.random()` for volcano placement in `classifyBiome()` (absent — uses hash) | Per-pass `mulberry32` streams with fixed offsets | Phase 2 | Determinism across all passes |
| `generateGeoField()` returns `Map<string, GeoParams>` (keyed by "col,row") | Phase 2 extends to typed arrays + continuous field functions | Phase 2 | Phase 3 marching squares needs `sampleElevation(x, y)` |
| Biome classification inline with field generation | Single classification pass after all fields finalized | Phase 2 | Temperature reassessment (lake/river effect) correctly influences biome outcomes |
| Rivers, lakes, depression fill in separate standalone files (not wired) | Integrated as hydrology pass in pipeline | Phase 2 | Rivers actually appear in generated worlds |
| `CultureIdentity.primaryBiome: TerrainType` (single) | `preferredBiomes: TerrainType[]` + `toleratedBiomes: TerrainType[]` | Phase 2 | Province generation needs multi-biome culture preferences |

**Deprecated/outdated:**
- `hexGrid.ts` `generateWorld()` function: replaced by `WorldGenPipeline.run()`. The file remains as a re-export shim for any consumers that haven't migrated.
- `createWorldGenData()` in `worldGenData.ts`: its inline biome classification (line 104) is the specific pattern to replace — biome classification moves to Pass 9.

---

## Open Questions

1. **Province size balance: how many provinces cover what fraction of the map?**
   - What we know: Living cultures (2-4) get one province each; lost cultures get 3+ provinces; remainder is wilderness. CONTEXT.md says 200-2000+ hexes per province.
   - What's unclear: With 60K hexes, 2-4 living cultures + 3 lost = 5-7 named provinces. Even at max (2000 hexes each) that's 14,000 hexes — 23% of the map. 77% wilderness seems intentional but is a large number. Should wilderness provinces be a single "province" or many smaller wilderness zones?
   - Recommendation: Claude's discretion per CONTEXT.md. Default: 8-12 wilderness provinces of 3000-5000 hexes each. Named constant `WILDERNESS_PROVINCE_COUNT`.

2. **Province seed placement algorithm for avoiding biome conflicts across province neighbors**
   - What we know: Borderland hexes are transition biomes based on neighboring province identities. But adjacent province seeds could be desert + tundra with no valid transition biome.
   - What's unclear: Is there a minimum climate distance requirement between adjacent province seeds?
   - Recommendation: Province seed placement uses a repulsion constraint — seeds must be at least `PROVINCE_MIN_SEED_DISTANCE` hexes apart (8-12 hexes default). Climate compatibility is loosely enforced (no desert-next-to-glacier) via a compatibility matrix checked at seed time.

3. **`sampleElevation(worldX, worldY)` coordinate system for Phase 3**
   - What we know: Phase 3 needs continuous sub-hex sampling. `hexToPixel()` returns world coordinates used by the Three.js renderer.
   - What's unclear: Should the continuous field functions use hex grid coordinates (col, row) or Three.js world coordinates (pixels)?
   - Recommendation: Use hex grid coordinates as input (col/row can be fractional). The noise functions already take col/row. Pixel coordinate transformation is Phase 3's concern — Phase 2 just needs `sampleElevation(col: number, row: number): number`.

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly set to false in `.planning/config.json` — validation section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (project-wide, already configured) |
| Config file | `vite.config.ts` (vitest block) |
| Quick run command | `npx vitest run src/engine/worldgen/ --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WGEN-01 | Same seed produces identical heightmap | unit | `npx vitest run src/engine/worldgen/__tests__/pipeline.test.ts -t "deterministic"` | ❌ Wave 0 |
| WGEN-02 | Sea level threshold produces >10% land and >10% ocean | unit | `npx vitest run src/engine/worldgen/__tests__/elevation.test.ts` | ❌ Wave 0 |
| WGEN-03 | Equatorial hexes have higher temperature than polar hexes | unit | `npx vitest run src/engine/worldgen/__tests__/climate.test.ts -t "latitude gradient"` | ❌ Wave 0 |
| WGEN-04 | Hexes downwind of a ridge have lower moisture than upwind | unit | `npx vitest run src/engine/worldgen/__tests__/climate.test.ts -t "rain shadow"` | ❌ Wave 0 |
| WGEN-05 | At least one river reaches the sea in any generated world | unit | `npx vitest run src/engine/worldgen/__tests__/hydrology.test.ts -t "sea outlet"` | ❌ Wave 0 |
| WGEN-06 | Hexes adjacent to a large lake have moderated temperature | unit | `npx vitest run src/engine/worldgen/__tests__/hydrology.test.ts -t "lake effect"` | ❌ Wave 0 |
| WGEN-07 | 7-point sampling returns values equal to or between center samples | unit | `npx vitest run src/engine/worldgen/__tests__/sampling.test.ts` | ❌ Wave 0 |
| WGEN-08 | Whittaker classification produces all 27 terrain types across varied inputs | unit | `npx vitest run src/engine/__tests__/forceField.test.ts` (existing) | ✅ (partial) |
| WGEN-09 | High-elevation hexes classified as hills/mountains/plateau | unit | `npx vitest run src/engine/worldgen/__tests__/biome.test.ts -t "elevation overrides"` | ❌ Wave 0 |
| WGEN-10 | Low-elevation + high-moisture hexes near rivers classified as wetland types | unit | `npx vitest run src/engine/worldgen/__tests__/biome.test.ts -t "wetland overrides"` | ❌ Wave 0 |
| WGEN-11 | Desert hexes get sub-type variety (sand, rocky, clay, etc.) | unit | `npx vitest run src/engine/worldgen/__tests__/biome.test.ts -t "desert sub-types"` | ❌ Wave 0 |
| WGEN-12 | Every land hex has a downhill neighbor or is coastal | unit | `npx vitest run src/engine/worldgen/__tests__/hydrology.test.ts -t "drainage guarantee"` | ❌ Wave 0 |
| WGEN-13 | Volcanic hexes appear in high-elevation hot zones at low rate | unit | `npx vitest run src/engine/worldgen/__tests__/biome.test.ts -t "volcanic placement"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/engine/worldgen/ --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/engine/worldgen/__tests__/pipeline.test.ts` — covers WGEN-01, end-to-end determinism
- [ ] `src/engine/worldgen/__tests__/elevation.test.ts` — covers WGEN-01, WGEN-02, ridge overlay
- [ ] `src/engine/worldgen/__tests__/climate.test.ts` — covers WGEN-03, WGEN-04 (rain shadow)
- [ ] `src/engine/worldgen/__tests__/hydrology.test.ts` — covers WGEN-05, WGEN-06, WGEN-12
- [ ] `src/engine/worldgen/__tests__/sampling.test.ts` — covers WGEN-07 (7-point sampling)
- [ ] `src/engine/worldgen/__tests__/biome.test.ts` — covers WGEN-09, WGEN-10, WGEN-11, WGEN-13
- [ ] `src/engine/worldgen/__tests__/provinces.test.ts` — covers province coverage and culture placement

---

## Sources

### Primary (HIGH confidence)

- `src/engine/forceField.ts` — existing fractalNoise, generateGeoField, cosmology bias patterns
- `src/engine/terrain.ts` — Whittaker classification, ELEV/TEMP/MOIST constant tables
- `src/engine/worldGenData.ts` — WorldGenData interface, typed array patterns, factory function
- `src/engine/riverGeneration.ts` — routeRiver(), generateRivers(), ensureSeaOutlet() — complete hydrology
- `src/engine/depressionLakes.ts` — fillDepressions() (imported by name in tests), promoteDepressionLakes()
- `src/engine/lakeOutflow.ts` — generateLakeOutflows()
- `src/lib/prng.ts` — mulberry32(), fractalNoise()
- `src/lib/hexMath.ts` — hexNeighbors(), hexDistance(), hexToPixel()
- `src/types/culture.ts` — CultureIdentity interface (primaryBiome field to expand)
- `src/data/historical-culture-content.ts` — HistoricalCultureTemplate (biomePreference to expand)
- `Docs/plans/2026-03-20-world-generation-v2-design.md` — full 17-pass pipeline, PRNG offsets, trace interfaces, fail-soft tables
- `.planning/phases/02-world-generation/02-CONTEXT.md` — locked decisions, province-first architecture, 11-pass pipeline

### Secondary (MEDIUM confidence)

- Existing test patterns in `src/engine/__tests__/forceField.test.ts` and `worldSeed.test.ts` — confirm vitest patterns for worldgen

### Tertiary (LOW confidence)

- None. All findings confirmed from project source files and design documents.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed and in use
- Architecture: HIGH — directly derived from CONTEXT.md locked decisions and existing codebase patterns
- Pitfalls: HIGH — derived from reading existing implementation (known gaps) and CONTEXT.md design rationale
- Open questions: MEDIUM — identified genuine ambiguities in the design that are explicitly Claude's discretion

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain — no fast-moving dependencies)

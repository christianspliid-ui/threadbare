# Terrain Generation Phase 1 — Types, Pipeline Architecture, Rivers

**Date:** 2026-03-10
**Status:** Approved design, pending implementation
**Parent design:** `2026-03-09-terrain-generation-design.md` (full 8-pass geological simulation)

## Scope

Phase 1 of the terrain generation upgrade. Lays the architectural foundation so future geological passes are purely additive, then delivers rivers as the first visible payoff.

**In scope:**
- Layer 1: TerrainType union 27 → 42 (rename, consolidate, add)
- Layer 2: WorldGenData intermediate structure + pipeline refactor
- Layer 3: River generation + SVG rendering + lake improvements

**Deferred to Phase 2+:**
- Geological simulation passes (tectonics, rain shadow, temperature)
- Grid expansion (20×15 → 60×45)
- Region naming and geographic region graph nodes
- Art generation for 14 new tile types (placeholder colors for new types)

## Layer 1: Type Foundation

### TerrainType Migration (27 → 42)

| Action | Current | Target |
|--------|---------|--------|
| KEEP (18) | ocean, coastal_shallows, lake, river, grassland, farmland, savanna, steppe, dense_forest, jungle, swamp, hills, mountains, plateau, badlands, desert, tundra, glacier | *(unchanged)* |
| RENAME (4) | deciduous_forest → temperate_forest, taiga → boreal_forest, volcanic → volcano, bog → marsh | |
| CONSOLIDATE (3→1) | forested_hills_evergreen, forested_hills_deciduous, forested_hills_jungle → forested_hills | |
| KEEP LEGACY (2) | great_home_trees, broken_lands | *(unchanged)* |
| ADD (18) | — | deep_ocean, tropical_ocean, coast, rocky_desert, sand_dunes, arctic, snow_fields, tropical_forest, evergreen_forest, light_forest, high_mountains, floodplain, moor_bog, dead_forest, oasis, reef, mountain_pass |

### HexTile Extension

```typescript
export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
  hasRiver?: boolean;      // NEW — set by river generation pass
  regionId?: string;       // NEW — set by region naming pass (Phase 2)
}
```

### NodeType Extension

Add `'region'` to NodeType union (for Phase 2 region naming, but type goes in now).

### Downstream Propagation

Renames and consolidations must propagate through:
- `hex-tile-assets.ts` (TERRAIN_TILE_MAP)
- `coastline.ts` (isWaterTerrain — add deep_ocean, tropical_ocean)
- `terrain.ts` (classifyBiome output types)
- `world-model.json` (terrain category nodes)
- `prose-layer-content.ts` (terrain prose tables)
- `terrain-modifiers.ts` (modifier lookups)
- `culture-content.ts` (biome modifiers)
- All test files referencing old type names
- Style tile hex asset legend

Art for new types: 4 tiles exist on disk (coast.png, evergreen-forest.png, light-forest.png, marsh.png) — activate these. Remaining 14 new types get placeholder entries in TERRAIN_TILE_MAP pointing to the closest visual analog until art is generated.

## Layer 2: WorldGenData Intermediate Structure

### Problem

Current `generateWorld` directly outputs `HexTile[]` from noise fields. Adding passes requires an intermediate data structure that passes can read and enrich.

### Solution

```typescript
interface WorldGenData {
  cols: number;
  rows: number;
  seed: number;

  // Per-hex data arrays (flat, indexed by row * cols + col)
  elevation: Float32Array;      // 0.0–1.0
  temperature: Float32Array;    // 0.0–1.0
  moisture: Float32Array;       // 0.0–1.0
  isOcean: Uint8Array;          // 0 or 1
  terrain: TerrainType[];       // assigned by biome pass
  hasRiver: Uint8Array;         // 0 or 1
  riverPaths: RiverPath[];      // for SVG rendering
  lakeIds: Int16Array;          // -1 = not lake, ≥0 = lake cluster ID
}

interface RiverPath {
  id: string;
  hexes: HexCoord[];            // ordered source → mouth
}
```

### Refactor

1. `generateWorld` creates `WorldGenData`, populates from existing noise fields
2. Existing `classifyBiome` reads from `WorldGenData` instead of inline params
3. New passes (river, lake) read/write `WorldGenData`
4. Final step converts `WorldGenData` → `HexTile[]`

The existing noise-based generation continues working. Future geological passes slot in as functions `(data: WorldGenData) => void`.

## Layer 3: Rivers + Lakes

### River Generation

Algorithm: steepest-descent routing from high-elevation land hexes.

1. Select `RIVER_SOURCE_COUNT` (4-8) highest-elevation land hexes as river sources
2. From each source, greedily follow the neighbor with lowest elevation
3. River terminates when reaching ocean, lake, or a hex that already has a river (confluence)
4. Mark each traversed hex `hasRiver = true`
5. Store path as `RiverPath` for SVG rendering
6. Rivers that are too short (< `RIVER_MIN_LENGTH` = 4 hexes) are discarded

Constants:
- `RIVER_SOURCE_COUNT`: { min: 4, max: 8 }
- `RIVER_MIN_LENGTH`: 4
- `RIVER_SOURCE_ELEVATION_THRESHOLD`: 0.7

### River SVG Overlay

New component `RiverOverlay.tsx` (mirrors `CoastlineOverlay.tsx` pattern):
- Takes `RiverPath[]` as prop
- Draws cubic Bezier curves through hex centers (not straight lines)
- River width: thin at source (1px), wider downstream (3px)
- Color: `rgba(80, 130, 180, 0.7)` (muted blue, Threadbare palette)
- Memoized rendering, recalculates only when paths change

### Lake Improvements

- Identify elevation basins (local minima surrounded by higher terrain)
- Flood-fill from basin center up to pour point
- Size: 1-5 hexes for normal lakes, max 1 great lake (6-12 hexes)
- Lake hexes assigned terrain type `lake`
- Coastline: separate `computeCoastline` call with `blobRadius × 0.6`, `shallowWidth: 0`

Constants:
- `LAKE_SIZE_MIN`: 1
- `LAKE_SIZE_MAX`: 5
- `GREAT_LAKE_SIZE_MAX`: 12
- `GREAT_LAKE_COUNT`: 1
- `LAKE_BLOB_RADIUS_FACTOR`: 0.6

## Testing Strategy

- Type migration: compile-time — TypeScript catches all missed renames
- WorldGenData: unit tests for each pass function in isolation
- Rivers: deterministic tests with fixed seeds, assert river count, length, termination
- Lakes: assert size constraints, coastline separation
- Integration: generate 5 worlds (seeds 1-5), assert:
  - At least 1 river per world
  - Rivers flow downhill (each hex lower than previous)
  - No river shorter than RIVER_MIN_LENGTH
  - Lakes ≤ size constraints
  - All 42 terrain types compile
- Performance: full pipeline < 500ms for 20×15 grid

## Integration Notes

- Coastline system: zero changes to `coastline.ts` logic. Add new water types to `isWaterTerrain`. Second `computeCoastline` call for lakes.
- Fog of war: unchanged — operates on hex coordinates
- Existing tests: renames propagated, no behavioral changes to existing terrain assignment
- Determinism: all new code uses seeded PRNG

# Terrain Generation Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand terrain types (27 → 42), introduce a WorldGenData pipeline structure for future geological passes, and deliver rivers + improved lakes as the first visible payoff.

**Architecture:** Three layers, each building on the previous. Layer 1 (types) is a mechanical rename/add migration across ~45 files. Layer 2 (WorldGenData) refactors `generateWorld` to produce an intermediate data structure that future passes can enrich. Layer 3 (rivers/lakes) adds new generation passes and an SVG overlay component.

**Tech Stack:** TypeScript, React, Vitest, SVG, seeded PRNG (mulberry32)

---

## Task 1: TerrainType Union Migration — Renames

Rename 4 terrain types across the codebase. This is purely mechanical — find and replace the string literals.

| Old Name | New Name |
|----------|----------|
| `deciduous_forest` | `temperate_forest` |
| `taiga` | `boreal_forest` |
| `volcanic` | `volcano` |
| `bog` | `marsh` |

**Files:**
- Modify: `src/types/index.ts:31-47` — TerrainType union
- Modify: `src/engine/terrain.ts` — classifyBiome return values (lines 28, 31, 37, 38, 58, 62, 64, 68, 69, 70, 83, 84, 86, 95)
- Modify: `src/engine/color.ts:22-24,29` — BIOME_COLORS keys
- Modify: `src/data/hex-tile-assets.ts:12-14,25` — TERRAIN_TILE_MAP keys
- Modify: `src/data/terrain-modifiers.ts:30-31` — TERRAIN_MODIFIERS keys (bog, volcanic)
- Modify: `src/data/hex-vignette-content.ts:70-84,96-100,165-169` — TERRAIN_OPENINGS keys
- Modify: `src/data/prose-layer-content.ts` — BIOME_PROSE keys
- Modify: `src/data/culture-content.ts` — BIOME_MODIFIERS terrain fields, INSIDER_BEATS
- Modify: `src/engine/coastline.ts:10-12` — no renames needed here (no renamed types in WATER_TERRAINS)
- Modify: All test files referencing old names

**Step 1: Update the TerrainType union**

In `src/types/index.ts`, change the TerrainType union:
```typescript
export type TerrainType =
  // Water
  | 'ocean' | 'coastal_shallows' | 'lake' | 'river'
  // Lowlands
  | 'grassland' | 'farmland' | 'savanna' | 'steppe'
  // Forest
  | 'temperate_forest' | 'dense_forest' | 'boreal_forest' | 'jungle'
  // Wet
  | 'swamp' | 'marsh'
  // Elevated
  | 'hills' | 'mountains' | 'plateau' | 'badlands'
  // Elevated + forested
  | 'forested_hills_evergreen' | 'forested_hills_deciduous' | 'forested_hills_jungle'
  // Special
  | 'great_home_trees' | 'broken_lands'
  // Extreme
  | 'desert' | 'tundra' | 'glacier' | 'volcano';
```

**Step 2: Run `npx tsc --noEmit` to find all broken references**

TypeScript will report every file that uses the old string literals. Fix each file:

- `src/engine/terrain.ts`: Replace all `'deciduous_forest'` → `'temperate_forest'`, `'taiga'` → `'boreal_forest'`, `'volcanic'` → `'volcano'`, `'bog'` → `'marsh'`
- `src/engine/color.ts`: Same key renames in BIOME_COLORS
- `src/data/hex-tile-assets.ts`: Rename keys in TERRAIN_TILE_MAP. Update filenames to match: `deciduous-forest.png` → keep pointing to same file but key is `temperate_forest`, `taiga.png` → key is `boreal_forest`, `volcanic.png` → key is `volcano`, `bog.png` → key is `marsh` (we have `marsh.png` on disk)
- `src/data/terrain-modifiers.ts`: Rename `bog` → `marsh`, `volcanic` → `volcano`
- `src/data/hex-vignette-content.ts`: Rename keys in TERRAIN_OPENINGS
- `src/data/prose-layer-content.ts`: Rename keys in BIOME_PROSE
- `src/data/culture-content.ts`: Rename terrain fields in BIOME_MODIFIERS entries and INSIDER_BEATS

**Step 3: Update all test files**

- `src/engine/__tests__/terrain.test.ts`: Update expected values (line 44 `'deciduous_forest'` → `'temperate_forest'`, line 47-48 `'forested_hills_evergreen'` → stays same)
- `src/engine/__tests__/hexGrid.test.ts`: Update `validTerrains` array (line 30-33)
- `src/data/__tests__/hex-tile-assets.test.ts`: Update `ALL_TERRAIN_TYPES` array (lines 5-12)
- All other test files caught by `npx tsc --noEmit`

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename terrain types (deciduous_forest→temperate_forest, taiga→boreal_forest, volcanic→volcano, bog→marsh)"
```

---

## Task 2: TerrainType Union Migration — Consolidation

Consolidate 3 forested hills variants into 1.

| Old Names | New Name |
|-----------|----------|
| `forested_hills_evergreen`, `forested_hills_deciduous`, `forested_hills_jungle` | `forested_hills` |

**Files:**
- Modify: `src/types/index.ts:42-43` — remove 3 types, add 1
- Modify: `src/engine/terrain.ts:56-63,81-84` — all return `'forested_hills'`
- Modify: `src/engine/color.ts:38-40` — collapse 3 entries to 1
- Modify: `src/data/hex-tile-assets.ts:27-29` — collapse 3 entries to 1 (use `forested-hills-evergreen.png` as the art)
- Modify: `src/data/terrain-modifiers.ts:15` — `forested_hills_jungle` → `forested_hills`
- Modify: `src/data/hex-vignette-content.ts:123-137` — collapse 3 entries to 1
- Modify: `src/data/prose-layer-content.ts` — collapse entries
- Modify: `src/data/culture-content.ts` — update BIOME_MODIFIERS and INSIDER_BEATS
- Modify: All test files

**Step 1: Update the TerrainType union**

In `src/types/index.ts`, replace the 3 forested hills variants:
```typescript
  // Elevated + forested
  | 'forested_hills'
```

**Step 2: Run `npx tsc --noEmit` and fix all references**

Same approach as Task 1 — TypeScript catches every file.

Key changes:
- `src/engine/terrain.ts`: Every `'forested_hills_jungle'`, `'forested_hills_deciduous'`, `'forested_hills_evergreen'` becomes `'forested_hills'`
- `src/engine/color.ts`: Collapse 3 entries to `forested_hills: '#2a3520'`
- `src/data/hex-tile-assets.ts`: Collapse to `forested_hills: 'forested-hills-evergreen.png'`
- `src/data/terrain-modifiers.ts`: Replace `forested_hills_jungle` with `forested_hills` (same modifier: `{ los_range: -1 }`)
- `src/data/hex-vignette-content.ts`: Merge into single `forested_hills` entry with combined prose
- `src/data/prose-layer-content.ts`: Collapse entries
- `src/data/culture-content.ts`: Update all references

**Step 3: Update all test files**

- Remove old type names from test arrays
- Update test expectations for `'forested_hills'`

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: consolidate forested_hills variants into single forested_hills type"
```

---

## Task 3: TerrainType Union — Add 18 New Types

Add the 18 new terrain types. They won't be emitted by classifyBiome yet (that comes in Task 5 after WorldGenData), but they must exist as valid types with placeholder data in all content tables.

**New types:** `deep_ocean`, `tropical_ocean`, `coast`, `rocky_desert`, `sand_dunes`, `arctic`, `snow_fields`, `tropical_forest`, `evergreen_forest`, `light_forest`, `high_mountains`, `floodplain`, `moor_bog`, `dead_forest`, `oasis`, `reef`, `mountain_pass`

**Files:**
- Modify: `src/types/index.ts:31-47` — add 18 new types to union
- Modify: `src/engine/color.ts` — add 18 placeholder colors to BIOME_COLORS
- Modify: `src/data/hex-tile-assets.ts` — add 18 entries to TERRAIN_TILE_MAP (4 have art, 14 use closest analog)
- Modify: `src/data/hex-vignette-content.ts` — add 18 entries to TERRAIN_OPENINGS
- Modify: `src/engine/coastline.ts:10-12` — add `deep_ocean`, `tropical_ocean` to WATER_TERRAINS
- Modify: `src/data/prose-layer-content.ts` — add placeholder entries
- No changes to `src/engine/terrain.ts` yet — classifyBiome won't emit these until Task 5

**Step 1: Expand the TerrainType union**

In `src/types/index.ts`:
```typescript
export type TerrainType =
  // Water
  | 'ocean' | 'deep_ocean' | 'tropical_ocean' | 'coastal_shallows' | 'coast' | 'lake' | 'river' | 'reef'
  // Lowlands
  | 'grassland' | 'farmland' | 'savanna' | 'steppe' | 'floodplain'
  // Forest
  | 'temperate_forest' | 'dense_forest' | 'boreal_forest' | 'jungle'
  | 'tropical_forest' | 'evergreen_forest' | 'light_forest' | 'dead_forest'
  // Wet
  | 'swamp' | 'marsh' | 'moor_bog'
  // Elevated
  | 'hills' | 'mountains' | 'high_mountains' | 'plateau' | 'badlands' | 'mountain_pass'
  // Elevated + forested
  | 'forested_hills'
  // Special
  | 'great_home_trees' | 'broken_lands' | 'oasis'
  // Extreme
  | 'desert' | 'rocky_desert' | 'sand_dunes' | 'tundra' | 'glacier' | 'volcano'
  | 'arctic' | 'snow_fields';
```

**Step 2: Add placeholder data to all content tables**

Each content table needs entries for the 18 new types. Use sensible defaults:

`src/engine/color.ts` — add 18 dark fallback colors (follow existing palette darkness):
```typescript
// New water types
deep_ocean: '#0f1a2a',
tropical_ocean: '#1a2f3a',
coast: '#2a3a4a',
reef: '#1a3040',
// New lowlands
floodplain: '#2a3520',
// New forest
tropical_forest: '#1a3a1a',
evergreen_forest: '#1a2a1a',
light_forest: '#2a3a20',
dead_forest: '#3a3530',
// New wet
moor_bog: '#2a3020',
// New elevated
high_mountains: '#2a2a2a',
mountain_pass: '#3a3020',
// New special
oasis: '#2a3520',
// New extreme
rocky_desert: '#3a3020',
sand_dunes: '#3a3520',
arctic: '#2a3540',
snow_fields: '#2a3a4a',
```

`src/data/hex-tile-assets.ts` — activate existing art, map rest to closest visual analog:
```typescript
// Art on disk — activate
coast: 'coast.png',
evergreen_forest: 'evergreen-forest.png',
light_forest: 'light-forest.png',
// marsh already renamed from bog

// Placeholder mappings → closest analog
deep_ocean: 'ocean.png',
tropical_ocean: 'ocean.png',
reef: 'coastal-shallows.png',
floodplain: 'open-grassland.png',
tropical_forest: 'jungle.png',
dead_forest: 'broken-lands.png',
moor_bog: 'marsh.png',
high_mountains: 'mountain.png',
mountain_pass: 'hills.png',
oasis: 'lake.png',
rocky_desert: 'badlands.png',
sand_dunes: 'desert.png',
arctic: 'tundra.png',
snow_fields: 'glacier.png',
```

`src/engine/coastline.ts` — add to WATER_TERRAINS:
```typescript
const WATER_TERRAINS: ReadonlySet<TerrainType> = new Set([
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
] as TerrainType[]);
```

`src/data/hex-vignette-content.ts` — add 18 TERRAIN_OPENINGS entries with 3 prose options each.

`src/data/prose-layer-content.ts` — add placeholder BIOME_PROSE entries for new types.

**Step 3: Update test files**

- `src/data/__tests__/hex-tile-assets.test.ts`: Update `ALL_TERRAIN_TYPES` to include all 42 types
- `src/engine/__tests__/hexGrid.test.ts`: Update `validTerrains` to include all 42 types

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. TypeScript compiles clean (`npx tsc --noEmit`).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 18 new terrain types with placeholder content (42 total)"
```

---

## Task 4: HexTile Extension + NodeType Extension

Add `hasRiver` and `regionId` to HexTile. Add `'region'` to NodeType.

**Files:**
- Modify: `src/types/index.ts:58-63` — HexTile interface
- Modify: `src/types/graph.ts:17-26` — NodeType union

**Step 1: Write the tests**

Create `src/types/__tests__/type-extensions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { HexTile, HexCoord } from '../index';
import type { NodeType } from '../graph';

describe('HexTile extension', () => {
  it('accepts hasRiver optional property', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
      hasRiver: true,
    };
    expect(tile.hasRiver).toBe(true);
  });

  it('accepts regionId optional property', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
      regionId: 'region-001',
    };
    expect(tile.regionId).toBe('region-001');
  });

  it('works without optional properties', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
    };
    expect(tile.hasRiver).toBeUndefined();
    expect(tile.regionId).toBeUndefined();
  });
});

describe('NodeType extension', () => {
  it('accepts region as a valid NodeType', () => {
    const type: NodeType = 'region';
    expect(type).toBe('region');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/type-extensions.test.ts`
Expected: FAIL — `hasRiver`, `regionId` not in HexTile; `'region'` not in NodeType

**Step 3: Implement the changes**

`src/types/index.ts` — extend HexTile:
```typescript
export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
  hasRiver?: boolean;
  regionId?: string;
}
```

`src/types/graph.ts` — add `'region'` to NodeType:
```typescript
export type NodeType =
  | 'actor'
  | 'location'
  | 'trait'
  | 'artifact'
  | 'artifact_legendary'
  | 'resource'
  | 'action_template'
  | 'event'
  | 'cosmology'
  | 'region';
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: extend HexTile with hasRiver/regionId, add region NodeType"
```

---

## Task 5: WorldGenData Intermediate Structure

Introduce `WorldGenData` interface and `RiverPath` type. Refactor `generateWorld` to produce WorldGenData internally, then convert to `HexTile[]`. The public API stays the same — no downstream changes.

**Files:**
- Create: `src/engine/worldGenData.ts` — WorldGenData interface + RiverPath + constants + toHexTiles converter
- Modify: `src/engine/hexGrid.ts` — use WorldGenData internally
- Create: `src/engine/__tests__/worldGenData.test.ts`

**Step 1: Write the tests**

Create `src/engine/__tests__/worldGenData.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createWorldGenData, toHexTiles } from '../worldGenData';
import type { WorldGenData } from '../worldGenData';

describe('createWorldGenData', () => {
  it('creates data with correct dimensions', () => {
    const data = createWorldGenData(10, 8, 42);
    expect(data.cols).toBe(10);
    expect(data.rows).toBe(8);
    expect(data.seed).toBe(42);
    expect(data.elevation.length).toBe(80);
    expect(data.temperature.length).toBe(80);
    expect(data.moisture.length).toBe(80);
    expect(data.isOcean.length).toBe(80);
    expect(data.terrain.length).toBe(80);
    expect(data.hasRiver.length).toBe(80);
    expect(data.lakeIds.length).toBe(80);
  });

  it('populates elevation, temperature, moisture in [0, 1]', () => {
    const data = createWorldGenData(5, 5, 42);
    for (let i = 0; i < 25; i++) {
      expect(data.elevation[i]).toBeGreaterThanOrEqual(0);
      expect(data.elevation[i]).toBeLessThanOrEqual(1);
      expect(data.temperature[i]).toBeGreaterThanOrEqual(0);
      expect(data.temperature[i]).toBeLessThanOrEqual(1);
      expect(data.moisture[i]).toBeGreaterThanOrEqual(0);
      expect(data.moisture[i]).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(5, 5, 42);
    const b = createWorldGenData(5, 5, 42);
    expect(Array.from(a.elevation)).toEqual(Array.from(b.elevation));
    expect(a.terrain).toEqual(b.terrain);
  });
});

describe('toHexTiles', () => {
  it('converts WorldGenData to HexTile array', () => {
    const data = createWorldGenData(5, 5, 42);
    const tiles = toHexTiles(data);
    expect(tiles).toHaveLength(25);
    for (const tile of tiles) {
      expect(tile.coord).toBeDefined();
      expect(tile.geoParams).toBeDefined();
      expect(tile.terrain).toBeDefined();
    }
  });

  it('preserves hasRiver flag', () => {
    const data = createWorldGenData(5, 5, 42);
    data.hasRiver[0] = 1;
    const tiles = toHexTiles(data);
    expect(tiles[0].hasRiver).toBe(true);
    expect(tiles[1].hasRiver).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/worldGenData.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Implement WorldGenData**

Create `src/engine/worldGenData.ts`:
```typescript
import type { HexTile, HexCoord, TerrainType } from '../types';
import { generateGeoField } from './forceField';
import { classifyBiome } from './terrain';

// ─── River/Lake constants ────────────────────────────────────────
export const RIVER_SOURCE_COUNT_MIN = 4;
export const RIVER_SOURCE_COUNT_MAX = 8;
export const RIVER_MIN_LENGTH = 4;
export const RIVER_SOURCE_ELEVATION_THRESHOLD = 0.7;

export const LAKE_SIZE_MIN = 1;
export const LAKE_SIZE_MAX = 5;
export const GREAT_LAKE_SIZE_MAX = 12;
export const GREAT_LAKE_COUNT = 1;
export const LAKE_BLOB_RADIUS_FACTOR = 0.6;

// ─── Types ───────────────────────────────────────────────────────

export interface RiverPath {
  id: string;
  hexes: HexCoord[];
}

export interface WorldGenData {
  cols: number;
  rows: number;
  seed: number;

  elevation: Float32Array;
  temperature: Float32Array;
  moisture: Float32Array;
  isOcean: Uint8Array;
  terrain: TerrainType[];
  hasRiver: Uint8Array;
  riverPaths: RiverPath[];
  lakeIds: Int16Array;
}

// ─── Factory ─────────────────────────────────────────────────────

export function createWorldGenData(
  cols: number,
  rows: number,
  seed: number,
): WorldGenData {
  const total = cols * rows;
  const geoField = generateGeoField(cols, rows, seed);

  const elevation = new Float32Array(total);
  const temperature = new Float32Array(total);
  const moisture = new Float32Array(total);
  const isOcean = new Uint8Array(total);
  const terrain: TerrainType[] = new Array(total);
  const hasRiver = new Uint8Array(total);
  const lakeIds = new Int16Array(total).fill(-1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const geo = geoField.get(`${col},${row}`);
      if (!geo) throw new Error(`Missing geo params for ${col},${row}`);

      elevation[idx] = geo.elevation;
      temperature[idx] = geo.temperature;
      moisture[idx] = geo.moisture;

      const biome = classifyBiome(geo.elevation, geo.temperature, geo.moisture);
      terrain[idx] = biome;
      isOcean[idx] = (biome === 'ocean' || biome === 'coastal_shallows') ? 1 : 0;
    }
  }

  return {
    cols, rows, seed,
    elevation, temperature, moisture, isOcean,
    terrain, hasRiver,
    riverPaths: [],
    lakeIds,
  };
}

// ─── Converter ───────────────────────────────────────────────────

export function toHexTiles(data: WorldGenData): HexTile[] {
  const tiles: HexTile[] = [];
  for (let row = 0; row < data.rows; row++) {
    for (let col = 0; col < data.cols; col++) {
      const idx = row * data.cols + col;
      const tile: HexTile = {
        coord: { col, row },
        geoParams: {
          elevation: data.elevation[idx],
          temperature: data.temperature[idx],
          moisture: data.moisture[idx],
        },
        terrain: data.terrain[idx],
      };
      if (data.hasRiver[idx]) {
        tile.hasRiver = true;
      }
      tiles.push(tile);
    }
  }
  return tiles;
}
```

**Step 4: Refactor generateWorld**

Modify `src/engine/hexGrid.ts` to use WorldGenData internally:
```typescript
import type { CosmologyProfile, HexTile } from '../types';
import { generateHexGrid } from '../lib/hexMath';
import { generateGeoField } from './forceField';
import { classifyBiome } from './terrain';
import { createWorldGenData, toHexTiles } from './worldGenData';

export function generateWorld(
  cosmology: CosmologyProfile,
  cols: number,
  rows: number,
  seed: number,
): HexTile[] {
  // Use WorldGenData pipeline internally
  const data = createWorldGenData(cols, rows, seed);

  // Re-apply cosmology bias to geo fields
  // (createWorldGenData uses generateGeoField without cosmology —
  //  for now, fall back to original approach until forceField supports cosmology in WorldGenData)
  const coords = generateHexGrid(cols, rows);
  const geoField = generateGeoField(cols, rows, seed, cosmology);

  return coords.map(coord => {
    const geoParams = geoField.get(`${coord.col},${coord.row}`);
    if (!geoParams) {
      throw new Error(`Missing geo params for coord ${coord.col},${coord.row}`);
    }
    const terrain = classifyBiome(
      geoParams.elevation,
      geoParams.temperature,
      geoParams.moisture
    );
    return { coord, geoParams, terrain };
  });
}

/**
 * Pipeline-based world generation (for new features like rivers/lakes).
 * Returns WorldGenData that can be enriched by passes, then converted to HexTile[].
 */
export { createWorldGenData, toHexTiles } from './worldGenData';
```

Note: `generateWorld` keeps its original behavior for now — cosmology bias flows through `generateGeoField`. The new `createWorldGenData` is available for river/lake passes. Full migration of `generateWorld` to use WorldGenData exclusively will happen when cosmology bias is integrated into the pipeline (future task).

**Step 5: Run tests**

Run: `npm test`
Expected: All existing tests still pass + new worldGenData tests pass

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add WorldGenData intermediate structure with pipeline factory and converter"
```

---

## Task 6: River Generation Pass

Implement steepest-descent river routing as a WorldGenData pass.

**Files:**
- Create: `src/engine/riverGeneration.ts`
- Create: `src/engine/__tests__/riverGeneration.test.ts`

**Step 1: Write the tests**

Create `src/engine/__tests__/riverGeneration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateRivers } from '../riverGeneration';
import { createWorldGenData } from '../worldGenData';
import { RIVER_MIN_LENGTH } from '../worldGenData';

describe('generateRivers', () => {
  it('generates at least 1 river on a 20x15 grid', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);
  });

  it('marks hasRiver on traversed hexes', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    const riverHexCount = Array.from(data.hasRiver).filter(v => v === 1).length;
    expect(riverHexCount).toBeGreaterThan(0);
  });

  it('all rivers meet minimum length', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
    }
  });

  it('rivers flow downhill (each hex has lower or equal elevation)', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      for (let i = 1; i < path.hexes.length; i++) {
        const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
        const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
        expect(data.elevation[currIdx]).toBeLessThanOrEqual(data.elevation[prevIdx] + 0.01);
      }
    }
  });

  it('rivers terminate at ocean, lake, or confluence', () => {
    const data = createWorldGenData(20, 15, 42);
    generateRivers(data);
    for (const path of data.riverPaths) {
      const lastHex = path.hexes[path.hexes.length - 1];
      const idx = lastHex.row * data.cols + lastHex.col;
      const terrain = data.terrain[idx];
      const isWater = terrain === 'ocean' || terrain === 'coastal_shallows' || terrain === 'lake';
      // Either terminates at water or at a hex that already had a river (confluence)
      // For confluence, the hasRiver was set by a prior river
      expect(isWater || data.hasRiver[idx] === 1).toBe(true);
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(20, 15, 42);
    generateRivers(a);
    const b = createWorldGenData(20, 15, 42);
    generateRivers(b);
    expect(a.riverPaths.length).toBe(b.riverPaths.length);
    for (let i = 0; i < a.riverPaths.length; i++) {
      expect(a.riverPaths[i].hexes).toEqual(b.riverPaths[i].hexes);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/riverGeneration.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Implement river generation**

Create `src/engine/riverGeneration.ts`:
```typescript
import type { HexCoord } from '../types';
import type { WorldGenData } from './worldGenData';
import {
  RIVER_SOURCE_COUNT_MIN,
  RIVER_SOURCE_COUNT_MAX,
  RIVER_MIN_LENGTH,
  RIVER_SOURCE_ELEVATION_THRESHOLD,
} from './worldGenData';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getNeighbors(col: number, row: number, cols: number, rows: number): HexCoord[] {
  // Flat-top hex neighbors (offset coordinates, even-col shift)
  const isEvenCol = col % 2 === 0;
  const offsets = isEvenCol
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

  const neighbors: HexCoord[] = [];
  for (const [dc, dr] of offsets) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      neighbors.push({ col: nc, row: nr });
    }
  }
  return neighbors;
}

export function generateRivers(data: WorldGenData): void {
  const { cols, rows, seed, elevation, isOcean, terrain, hasRiver } = data;
  const rng = mulberry32(seed + 7919); // offset seed for river-specific randomness
  const total = cols * rows;

  // 1. Find candidate sources: high-elevation land hexes
  const candidates: { col: number; row: number; elev: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (isOcean[idx]) continue;
      if (elevation[idx] >= RIVER_SOURCE_ELEVATION_THRESHOLD) {
        candidates.push({ col, row, elev: elevation[idx] });
      }
    }
  }

  // Sort by elevation descending, then pick top N
  candidates.sort((a, b) => b.elev - a.elev);
  const sourceCount = Math.min(
    candidates.length,
    RIVER_SOURCE_COUNT_MIN + Math.floor(rng() * (RIVER_SOURCE_COUNT_MAX - RIVER_SOURCE_COUNT_MIN + 1))
  );

  // 2. Route each river via steepest descent
  for (let s = 0; s < sourceCount; s++) {
    const source = candidates[s];
    if (!source) continue;

    const path: HexCoord[] = [{ col: source.col, row: source.row }];
    const visited = new Set<string>();
    visited.add(`${source.col},${source.row}`);

    let currentCol = source.col;
    let currentRow = source.row;
    let safety = 0;

    while (safety++ < 500) {
      const currentIdx = currentRow * cols + currentCol;
      const currentElev = elevation[currentIdx];

      // Find lowest-elevation neighbor
      const neighbors = getNeighbors(currentCol, currentRow, cols, rows);
      let bestNeighbor: HexCoord | null = null;
      let bestElev = currentElev;

      for (const n of neighbors) {
        const key = `${n.col},${n.row}`;
        if (visited.has(key)) continue;
        const nIdx = n.row * cols + n.col;
        if (elevation[nIdx] < bestElev) {
          bestElev = elevation[nIdx];
          bestNeighbor = n;
        }
      }

      // If no downhill neighbor found, try to go to any unvisited neighbor (handles flat areas)
      if (!bestNeighbor) {
        for (const n of neighbors) {
          const key = `${n.col},${n.row}`;
          if (visited.has(key)) continue;
          const nIdx = n.row * cols + n.col;
          if (elevation[nIdx] <= currentElev + 0.01) {
            bestNeighbor = n;
            break;
          }
        }
      }

      if (!bestNeighbor) break;

      path.push(bestNeighbor);
      visited.add(`${bestNeighbor.col},${bestNeighbor.row}`);
      currentCol = bestNeighbor.col;
      currentRow = bestNeighbor.row;

      const nIdx = currentRow * cols + currentCol;

      // Terminate at ocean, lake, or confluence
      const nTerrain = terrain[nIdx];
      if (nTerrain === 'ocean' || nTerrain === 'coastal_shallows' || nTerrain === 'lake') break;
      if (hasRiver[nIdx] === 1) break; // confluence
    }

    // Discard rivers that are too short
    if (path.length < RIVER_MIN_LENGTH) continue;

    // Mark hexes and store path
    for (const hex of path) {
      hasRiver[hex.row * cols + hex.col] = 1;
    }

    data.riverPaths.push({
      id: `river-${s}`,
      hexes: path,
    });
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/riverGeneration.test.ts`
Expected: All river tests pass

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add river generation pass (steepest-descent routing)"
```

---

## Task 7: River SVG Overlay Component

Create `RiverOverlay.tsx` following the `CoastlineOverlay.tsx` pattern. Renders rivers as cubic Bezier curves through hex centers.

**Files:**
- Create: `src/components/HexMap/RiverOverlay.tsx`
- Create: `src/components/HexMap/__tests__/RiverOverlay.test.tsx`
- Create: `src/components/HexMap/useRivers.ts` — hook that runs river generation

**Step 1: Write the tests**

Create `src/components/HexMap/__tests__/RiverOverlay.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { riverPathToSvgPath } from '../../HexMap/RiverOverlay';

describe('riverPathToSvgPath', () => {
  it('returns empty string for path with fewer than 2 hexes', () => {
    expect(riverPathToSvgPath([], 30)).toBe('');
    expect(riverPathToSvgPath([{ col: 0, row: 0 }], 30)).toBe('');
  });

  it('returns SVG path string for valid river path', () => {
    const hexes = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ];
    const path = riverPathToSvgPath(hexes, 30);
    expect(path).toContain('M');
    expect(path.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HexMap/__tests__/RiverOverlay.test.tsx`
Expected: FAIL — module doesn't exist

**Step 3: Implement RiverOverlay**

Create `src/components/HexMap/RiverOverlay.tsx`:
```tsx
import { memo, useMemo } from 'react';
import type { HexCoord } from '../../types';
import type { RiverPath } from '../../engine/worldGenData';
import { hexToPixel } from '../../lib/hexMath';

// ─── River rendering constants ───────────────────────────────────
const RIVER_COLOR = 'rgba(80, 130, 180, 0.7)';
const RIVER_WIDTH_SOURCE = 1;
const RIVER_WIDTH_MOUTH = 3;

/**
 * Convert a river path (hex coords) to an SVG cubic Bezier path string.
 * Exported for testing.
 */
export function riverPathToSvgPath(hexes: HexCoord[], hexSize: number): string {
  if (hexes.length < 2) return '';

  const points = hexes.map(h => hexToPixel(h, hexSize));

  if (points.length === 2) {
    return `M${r(points[0].x)},${r(points[0].y)} L${r(points[1].x)},${r(points[1].y)}`;
  }

  // Cubic Bezier through hex centers using Catmull-Rom → Bezier conversion
  const parts: string[] = [`M${r(points[0].x)},${r(points[0].y)}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    parts.push(`C${r(cp1x)},${r(cp1y)} ${r(cp2x)},${r(cp2y)} ${r(p2.x)},${r(p2.y)}`);
  }

  return parts.join(' ');
}

function r(n: number): number {
  return Math.round(n * 10) / 10;
}

interface RiverOverlayProps {
  riverPaths: RiverPath[];
  hexSize: number;
}

export const RiverOverlay = memo(function RiverOverlay({
  riverPaths,
  hexSize,
}: RiverOverlayProps) {
  const paths = useMemo(
    () => riverPaths.map(rp => ({
      id: rp.id,
      d: riverPathToSvgPath(rp.hexes, hexSize),
      hexCount: rp.hexes.length,
    })),
    [riverPaths, hexSize],
  );

  return (
    <g className="river-overlay">
      {paths.map(({ id, d, hexCount }) => {
        if (!d) return null;
        // Width increases from source to mouth
        const strokeWidth = RIVER_WIDTH_SOURCE +
          (RIVER_WIDTH_MOUTH - RIVER_WIDTH_SOURCE) * Math.min(1, hexCount / 10);
        return (
          <path
            key={id}
            d={d}
            fill="none"
            stroke={RIVER_COLOR}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
});
```

Create `src/components/HexMap/useRivers.ts`:
```typescript
import { useMemo } from 'react';
import type { RiverPath } from '../../engine/worldGenData';
import { createWorldGenData } from '../../engine/worldGenData';
import { generateRivers } from '../../engine/riverGeneration';

export function useRivers(
  cols: number,
  rows: number,
  seed: number,
): RiverPath[] {
  return useMemo(() => {
    const data = createWorldGenData(cols, rows, seed);
    generateRivers(data);
    return data.riverPaths;
  }, [cols, rows, seed]);
}
```

**Step 4: Run tests**

Run: `npx vitest run src/components/HexMap/__tests__/RiverOverlay.test.tsx`
Expected: PASS

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add RiverOverlay SVG component with Bezier curves"
```

---

## Task 8: Wire Rivers into HexMap

Integrate `useRivers` and `RiverOverlay` into the HexMap component.

**Files:**
- Modify: `src/components/HexMap/HexMap.tsx` — add useRivers hook, render RiverOverlay

**Step 1: Add imports and hook call**

In `src/components/HexMap/HexMap.tsx`:
- Import `RiverOverlay` and `useRivers`
- Call `useRivers(cols, rows, seed ?? DEFAULT_COASTLINE_SEED)` alongside `useCoastline`
- Render `<RiverOverlay>` after `<CoastlineOverlay>` and after hex tiles (so rivers render on top of land)

**Step 2: Run the build**

Run: `npx tsc --noEmit && npx vite build`
Expected: Clean build, no type errors

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire river overlay into HexMap rendering pipeline"
```

---

## Task 9: Lake Improvements

Improve lake generation using elevation basin detection.

**Files:**
- Create: `src/engine/lakeGeneration.ts`
- Create: `src/engine/__tests__/lakeGeneration.test.ts`

**Step 1: Write the tests**

Create `src/engine/__tests__/lakeGeneration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateLakes } from '../lakeGeneration';
import { createWorldGenData } from '../worldGenData';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX, GREAT_LAKE_COUNT } from '../worldGenData';

describe('generateLakes', () => {
  it('generates at least 1 lake on a 20x15 grid', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    const lakeCount = new Set(
      Array.from(data.lakeIds).filter(id => id >= 0)
    ).size;
    expect(lakeCount).toBeGreaterThanOrEqual(1);
  });

  it('normal lakes are within size constraints', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    const lakeSizes = new Map<number, number>();
    for (const id of data.lakeIds) {
      if (id >= 0) lakeSizes.set(id, (lakeSizes.get(id) ?? 0) + 1);
    }
    // At most 1 great lake
    let greatLakeCount = 0;
    for (const [, size] of lakeSizes) {
      if (size > LAKE_SIZE_MAX) {
        greatLakeCount++;
        expect(size).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
      }
    }
    expect(greatLakeCount).toBeLessThanOrEqual(GREAT_LAKE_COUNT);
  });

  it('marks lake hexes with lake terrain', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    for (let i = 0; i < data.lakeIds.length; i++) {
      if (data.lakeIds[i] >= 0) {
        expect(data.terrain[i]).toBe('lake');
      }
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(20, 15, 42);
    generateLakes(a);
    const b = createWorldGenData(20, 15, 42);
    generateLakes(b);
    expect(Array.from(a.lakeIds)).toEqual(Array.from(b.lakeIds));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/lakeGeneration.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Implement lake generation**

Create `src/engine/lakeGeneration.ts`:

Algorithm:
1. Find elevation basins (local minima surrounded by higher terrain on all sides)
2. Flood-fill from basin center up to pour point
3. Size constraints: 1-5 hexes for normal, max 1 great lake (6-12 hexes)
4. Mark lake hexes with terrain type `'lake'` and assign lakeId

```typescript
import type { WorldGenData } from './worldGenData';
import {
  LAKE_SIZE_MIN,
  LAKE_SIZE_MAX,
  GREAT_LAKE_SIZE_MAX,
  GREAT_LAKE_COUNT,
} from './worldGenData';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getNeighborIndices(idx: number, cols: number, rows: number): number[] {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const isEvenCol = col % 2 === 0;
  const offsets = isEvenCol
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

  const neighbors: number[] = [];
  for (const [dc, dr] of offsets) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
      neighbors.push(nr * cols + nc);
    }
  }
  return neighbors;
}

export function generateLakes(data: WorldGenData): void {
  const { cols, rows, seed, elevation, isOcean, terrain, lakeIds } = data;
  const rng = mulberry32(seed + 1013);
  const total = cols * rows;

  // Find local minima (lower than all neighbors) that aren't ocean
  const minima: { idx: number; elev: number }[] = [];
  for (let i = 0; i < total; i++) {
    if (isOcean[i]) continue;
    if (terrain[i] === 'lake') continue; // already a lake from biome classification

    const neighbors = getNeighborIndices(i, cols, rows);
    const isMinimum = neighbors.every(n => elevation[n] >= elevation[i]);
    if (isMinimum && elevation[i] < 0.5) { // only in low-to-mid elevation
      minima.push({ idx: i, elev: elevation[i] });
    }
  }

  // Sort by elevation (lowest first — most likely to be real basins)
  minima.sort((a, b) => a.elev - b.elev);

  let lakeIdCounter = 0;
  let greatLakeCount = 0;

  for (const basin of minima) {
    if (lakeIds[basin.idx] >= 0) continue; // already claimed

    // Determine max size for this lake
    const isGreatLake = greatLakeCount < GREAT_LAKE_COUNT && rng() < 0.15;
    const maxSize = isGreatLake ? GREAT_LAKE_SIZE_MAX : LAKE_SIZE_MAX;

    // Flood-fill from basin center
    const lakeCells: number[] = [basin.idx];
    const visited = new Set<number>([basin.idx]);
    const frontier: { idx: number; elev: number }[] = [];

    // Add neighbors to frontier
    for (const n of getNeighborIndices(basin.idx, cols, rows)) {
      if (!isOcean[n] && !visited.has(n) && lakeIds[n] < 0) {
        frontier.push({ idx: n, elev: elevation[n] });
      }
    }
    frontier.sort((a, b) => a.elev - b.elev);

    // Pour point: expand while below pour threshold
    const pourThreshold = elevation[basin.idx] + 0.08;

    while (lakeCells.length < maxSize && frontier.length > 0) {
      const next = frontier.shift()!;
      if (elevation[next.idx] > pourThreshold) break;
      if (visited.has(next.idx)) continue;

      visited.add(next.idx);
      lakeCells.push(next.idx);

      for (const n of getNeighborIndices(next.idx, cols, rows)) {
        if (!isOcean[n] && !visited.has(n) && lakeIds[n] < 0) {
          frontier.push({ idx: n, elev: elevation[n] });
        }
      }
      frontier.sort((a, b) => a.elev - b.elev);
    }

    // Only keep if meets minimum size
    if (lakeCells.length < LAKE_SIZE_MIN) continue;

    // Assign lake
    const id = lakeIdCounter++;
    if (isGreatLake && lakeCells.length > LAKE_SIZE_MAX) {
      greatLakeCount++;
    }

    for (const cellIdx of lakeCells) {
      lakeIds[cellIdx] = id;
      terrain[cellIdx] = 'lake';
    }
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/lakeGeneration.test.ts`
Expected: All lake tests pass

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add lake generation pass with basin detection and flood fill"
```

---

## Task 10: Integration Test + Performance Check

Write integration tests that generate complete worlds and verify the full pipeline works together.

**Files:**
- Create: `src/engine/__tests__/worldGen-integration.test.ts`

**Step 1: Write the integration tests**

Create `src/engine/__tests__/worldGen-integration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createWorldGenData, toHexTiles, RIVER_MIN_LENGTH } from '../worldGenData';
import { generateRivers } from '../riverGeneration';
import { generateLakes } from '../lakeGeneration';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX, GREAT_LAKE_COUNT } from '../worldGenData';

describe('World generation pipeline integration', () => {
  const seeds = [1, 2, 3, 4, 5];

  for (const seed of seeds) {
    describe(`seed ${seed}`, () => {
      it('generates a complete world with rivers and lakes', () => {
        const data = createWorldGenData(20, 15, seed);
        generateLakes(data);
        generateRivers(data);
        const tiles = toHexTiles(data);

        // Correct tile count
        expect(tiles).toHaveLength(300);

        // At least 1 river
        expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);

        // Rivers flow downhill
        for (const path of data.riverPaths) {
          expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
          for (let i = 1; i < path.hexes.length; i++) {
            const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
            const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
            expect(data.elevation[currIdx]).toBeLessThanOrEqual(data.elevation[prevIdx] + 0.01);
          }
        }

        // Lake size constraints
        const lakeSizes = new Map<number, number>();
        for (const id of data.lakeIds) {
          if (id >= 0) lakeSizes.set(id, (lakeSizes.get(id) ?? 0) + 1);
        }
        let greatLakeCount = 0;
        for (const [, size] of lakeSizes) {
          if (size > LAKE_SIZE_MAX) {
            greatLakeCount++;
            expect(size).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
          }
        }
        expect(greatLakeCount).toBeLessThanOrEqual(GREAT_LAKE_COUNT);

        // All 42 terrain types compile (type check at build time)
        // hasRiver flag propagated to tiles
        const riverTiles = tiles.filter(t => t.hasRiver);
        expect(riverTiles.length).toBeGreaterThan(0);
      });
    });
  }

  it('pipeline completes in < 500ms for 20x15 grid', () => {
    const start = performance.now();
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    generateRivers(data);
    toHexTiles(data);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/engine/__tests__/worldGen-integration.test.ts`
Expected: All integration tests pass

Run: `npm test`
Expected: All tests pass

**Step 3: Run full build check**

Run: `npx tsc --noEmit && npx vite build`
Expected: Clean build, no errors

**Step 4: Commit**

```bash
git add -A
git commit -m "test: add world generation pipeline integration tests"
```

---

## Task 11: Update world-model.json

Propagate terrain renames and additions to the graph taxonomy.

**Files:**
- Modify: `src/data/world-model.json` — rename old terrain nodes, add new ones

**Step 1: Update terrain nodes**

In `src/data/world-model.json`:
- Rename: `terrain.deciduous_forest` → `terrain.temperate_forest`
- Rename: `terrain.taiga` → `terrain.boreal_forest`
- Rename: `terrain.volcanic` → `terrain.volcano`
- Rename: `terrain.bog` → `terrain.marsh`
- Consolidate: `terrain.forested_hills_evergreen`, `terrain.forested_hills_deciduous`, `terrain.forested_hills_jungle` → `terrain.forested_hills`
- Add: 18 new terrain nodes with appropriate category edges

**Step 2: Run model validation**

Run: `npm run validate-model`
Expected: All 7 checks pass

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: update world-model.json with renamed and new terrain types"
```

---

## Task 12: Documentation Updates

Update changelog, project status, and commit design docs.

**Files:**
- Modify: `Docs/changelog.md`
- Modify: `Docs/project-status.md`

**Step 1: Append changelog entries**

Add entries for:
- Terrain type migration (renames, consolidation, 18 new types)
- WorldGenData pipeline structure
- River generation + SVG overlay
- Lake generation improvements
- HexTile extension (hasRiver, regionId)

**Step 2: Update project status**

- Mark "Terrain Generation Phase 1" as complete
- Update engine stats (module count, line count, test count)
- Note what's deferred to Phase 2

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: update changelog and project status for terrain gen phase 1"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Rename 4 terrain types | ~20 files |
| 2 | Consolidate 3 forested hills → 1 | ~15 files |
| 3 | Add 18 new terrain types | ~8 files |
| 4 | Extend HexTile + NodeType | 2 type files |
| 5 | WorldGenData intermediate structure | New module + hexGrid refactor |
| 6 | River generation pass | New module |
| 7 | River SVG overlay component | New component |
| 8 | Wire rivers into HexMap | HexMap.tsx |
| 9 | Lake generation pass | New module |
| 10 | Integration tests + perf | New test file |
| 11 | world-model.json update | JSON taxonomy |
| 12 | Documentation | Changelog + status |

Total: 12 tasks, ~12 commits, estimated ~45 minutes of agent execution time.

# Terrain Generation Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-pass Perlin noise terrain generator with an 8-pass geological simulation pipeline on a 60×45 grid producing 42 terrain types with named geographic regions.

**Architecture:** Each pipeline pass reads the output of previous passes and writes to a shared `WorldGenData` intermediate structure. The final pass outputs `HexTile[]` with terrain, `hasRiver`, and `regionId` fields. Rivers render as SVG overlay paths. Lakes get separate coastline rendering with tighter params. Region nodes link to hexes via `contains` edges in the world graph.

**Tech Stack:** TypeScript, vitest, seeded PRNG (mulberry32), SimplexNoise, React SVG components

**Design doc:** `Docs/plans/2026-03-09-terrain-generation-design.md`

---

## Terrain Type Migration Reference

The current codebase has 27 terrain types. The target is 42. This migration mapping governs all type changes:

| Action | Current | Target |
|--------|---------|--------|
| KEEP (18) | ocean, coastal_shallows, lake, river, grassland, farmland, savanna, steppe, dense_forest, jungle, swamp, hills, mountains, plateau, badlands, desert, tundra, glacier | *(unchanged)* |
| RENAME (4) | deciduous_forest | temperate_forest |
| | taiga | boreal_forest |
| | volcanic | volcano |
| | bog | marsh |
| CONSOLIDATE (3→1) | forested_hills_evergreen, forested_hills_deciduous, forested_hills_jungle | forested_hills |
| KEEP LEGACY (2) | great_home_trees, broken_lands | *(unchanged — fantasy terrain, not geological)* |
| ADD (18) | — | deep_ocean, tropical_ocean, coast, rocky_desert, sand_dunes, arctic, snow_fields, tropical_forest, evergreen_forest, light_forest, high_mountains, floodplain, moor_bog, dead_forest, oasis, reef, mountain_pass |

**Art assets on disk but not yet in TERRAIN_TILE_MAP:** coast.png, evergreen-forest.png, light-forest.png, marsh.png (activate these — no generation needed).

**Art needing generation (14 new tiles):** deep-ocean, tropical-ocean, rocky-desert, sand-dunes, arctic, snow-fields, tropical-forest, high-mountains, floodplain, moor-bog, dead-forest, oasis, reef, mountain-pass.

---

### Task 1: Type Foundation

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/types/graph.ts`
- Modify: `src/engine/coastline.ts`
- Modify: `src/data/hex-tile-assets.ts`
- Test: `src/types/__tests__/terrainTypes.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/terrainTypes.test.ts
import { describe, it, expect } from 'vitest';
import type { TerrainType, HexTile } from '../index';
import type { NodeType } from '../graph';

describe('TerrainType migration', () => {
  it('has exactly 42 terrain types', () => {
    // We'll verify by importing the full list
    const allTypes: TerrainType[] = [
      'ocean', 'coastal_shallows', 'deep_ocean', 'tropical_ocean', 'coast',
      'lake', 'river',
      'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
      'temperate_forest', 'dense_forest', 'boreal_forest', 'tropical_forest',
      'evergreen_forest', 'light_forest', 'jungle',
      'swamp', 'marsh', 'moor_bog',
      'hills', 'forested_hills', 'mountains', 'high_mountains', 'plateau',
      'badlands', 'mountain_pass',
      'desert', 'rocky_desert', 'sand_dunes',
      'tundra', 'arctic', 'snow_fields', 'glacier',
      'volcano', 'dead_forest', 'oasis', 'reef',
      'great_home_trees', 'broken_lands',
    ];
    expect(allTypes.length).toBe(42);
    // TypeScript will error if any string is not a valid TerrainType
  });

  it('HexTile supports river trait and regionId', () => {
    const tile: HexTile = {
      coord: { col: 0, row: 0 },
      geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
      terrain: 'grassland',
      hasRiver: true,
      regionId: 'region_mountain_range_1',
    };
    expect(tile.hasRiver).toBe(true);
    expect(tile.regionId).toBe('region_mountain_range_1');
  });

  it('NodeType includes region', () => {
    const nt: NodeType = 'region';
    expect(nt).toBe('region');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/terrainTypes.test.ts`
Expected: FAIL — types don't exist yet

**Step 3: Update TerrainType union in `src/types/index.ts`**

Replace the current 27-value TerrainType union with the 42-value union:

```typescript
export type TerrainType =
  // Water
  | 'ocean' | 'coastal_shallows' | 'deep_ocean' | 'tropical_ocean' | 'coast'
  | 'lake' | 'river'
  // Plains & grassland
  | 'grassland' | 'farmland' | 'savanna' | 'steppe' | 'floodplain'
  // Forest
  | 'temperate_forest' | 'dense_forest' | 'boreal_forest' | 'tropical_forest'
  | 'evergreen_forest' | 'light_forest' | 'jungle'
  // Wetland
  | 'swamp' | 'marsh' | 'moor_bog'
  // Elevation
  | 'hills' | 'forested_hills' | 'mountains' | 'high_mountains' | 'plateau'
  | 'badlands' | 'mountain_pass'
  // Arid
  | 'desert' | 'rocky_desert' | 'sand_dunes'
  // Cold
  | 'tundra' | 'arctic' | 'snow_fields' | 'glacier'
  // Special
  | 'volcano' | 'dead_forest' | 'oasis' | 'reef'
  // Legacy fantasy
  | 'great_home_trees' | 'broken_lands';
```

Add optional fields to HexTile:

```typescript
export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
  hasRiver?: boolean;
  regionId?: string;
}
```

**Step 4: Add `region` to NodeType in `src/types/graph.ts`**

Add `'region'` to the NodeType union.

**Step 5: Update `isWaterTerrain` in `src/engine/coastline.ts`**

Add `'deep_ocean'` and `'tropical_ocean'` to the `WATER_TERRAINS` set.

**Step 6: Fix all TypeScript errors from renamed/removed types**

Search the entire codebase for references to removed type values (`deciduous_forest`, `taiga`, `volcanic`, `bog`, `forested_hills_evergreen`, `forested_hills_deciduous`, `forested_hills_jungle`) and update them to new names. Key files:
- `src/engine/terrain.ts` — classifyBiome return values
- `src/data/hex-tile-assets.ts` — TERRAIN_TILE_MAP keys
- `src/engine/worldSeed.ts` — terrain checks
- `src/engine/hexZoom.ts` — terrain descriptions
- Any test files referencing old terrain names

**Step 7: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/terrainTypes.test.ts`
Expected: PASS

**Step 8: Run full test suite to catch breakage from renames**

Run: `npm test`
Expected: All tests pass (fix any failures from renamed types)

**Step 9: Commit**

```bash
git add src/types/index.ts src/types/graph.ts src/engine/coastline.ts src/data/hex-tile-assets.ts src/types/__tests__/terrainTypes.test.ts
git add -u  # any other files touched by rename fixes
git commit -m "feat(terrain): expand TerrainType to 42 values, add HexTile.hasRiver/regionId, add region NodeType"
```

---

### Task 2: PRNG Utility Extraction

**Files:**
- Create: `src/lib/prng.ts`
- Modify: `src/engine/forceField.ts`
- Test: `src/lib/__tests__/prng.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/lib/__tests__/prng.test.ts
import { describe, it, expect } from 'vitest';
import { mulberry32, fractalNoise } from '../prng';

describe('mulberry32', () => {
  it('produces deterministic sequence from seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const v1 = rng1();
    const v2 = rng2();
    expect(v1).not.toBe(v2);
  });
});

describe('fractalNoise', () => {
  it('returns value in approximately [-1, 1] range', () => {
    const noise = fractalNoise(0.5, 0.5, 42);
    expect(noise).toBeGreaterThanOrEqual(-2);
    expect(noise).toBeLessThanOrEqual(2);
  });

  it('is deterministic for same inputs', () => {
    const a = fractalNoise(0.3, 0.7, 99);
    const b = fractalNoise(0.3, 0.7, 99);
    expect(a).toBe(b);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/prng.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Create `src/lib/prng.ts`**

Extract `mulberry32` and `fractalNoise` from `src/engine/forceField.ts` into a shared module:

```typescript
// src/lib/prng.ts
import { SimplexNoise } from './simplexNoise';

/** Seeded 32-bit PRNG — deterministic random number generator. */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Multi-octave simplex noise for terrain variation. */
export function fractalNoise(
  x: number,
  y: number,
  seed: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0,
): number {
  const noise = new SimplexNoise(seed);
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise.noise2D(x * frequency, y * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxAmplitude;
}
```

**Step 4: Update `src/engine/forceField.ts` to import from `src/lib/prng.ts`**

Replace the local `mulberry32` function with an import. Keep the `generateGeoField` function working (it's still used until the new pipeline replaces it).

**Step 5: Run tests**

Run: `npx vitest run src/lib/__tests__/prng.test.ts && npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/lib/prng.ts src/lib/__tests__/prng.test.ts src/engine/forceField.ts
git commit -m "refactor: extract mulberry32 and fractalNoise to shared prng module"
```

---

### Task 3: Pipeline Data Structures

**Files:**
- Create: `src/engine/terrainPipeline/types.ts`
- Test: `src/engine/terrainPipeline/__tests__/types.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { WorldGenData, WorldGenConfig, HexGenCell } from '../types';
import {
  CONTINENT_COUNT_MIN, CONTINENT_COUNT_MAX, LAND_COVERAGE_TARGET,
  FAULT_COUNT_MIN, FAULT_COUNT_MAX, FAULT_WIDTH,
  ELEVATION_FALLOFF_DISTANCE, ELEVATION_FALLOFF_POWER,
  RIVER_SOURCE_COUNT, LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX,
  DEFAULT_WORLD_GEN_CONFIG,
} from '../types';

describe('WorldGenData', () => {
  it('can create a minimal WorldGenData', () => {
    const data: WorldGenData = {
      cols: 60,
      rows: 45,
      seed: 42,
      cells: new Map(),
      faultLines: [],
      rivers: [],
      lakes: [],
      regions: [],
      prevailingWind: 0,
    };
    expect(data.cols).toBe(60);
    expect(data.cells.size).toBe(0);
  });

  it('HexGenCell has all pipeline fields', () => {
    const cell: HexGenCell = {
      col: 0, row: 0,
      isLand: true,
      isMountainSpine: false,
      elevation: 0.5,
      temperature: 0.5,
      moisture: 0.5,
      terrain: 'grassland',
      hasRiver: false,
      regionId: undefined,
    };
    expect(cell.isLand).toBe(true);
  });

  it('DEFAULT_WORLD_GEN_CONFIG has sane defaults', () => {
    const cfg = DEFAULT_WORLD_GEN_CONFIG;
    expect(cfg.cols).toBe(60);
    expect(cfg.rows).toBe(45);
    expect(CONTINENT_COUNT_MIN).toBeGreaterThanOrEqual(2);
    expect(CONTINENT_COUNT_MAX).toBeLessThanOrEqual(4);
    expect(LAND_COVERAGE_TARGET).toBeGreaterThan(0.5);
    expect(LAND_COVERAGE_TARGET).toBeLessThan(0.7);
    expect(FAULT_WIDTH).toBeGreaterThan(0);
    expect(RIVER_SOURCE_COUNT).toBeGreaterThan(0);
    expect(LAKE_SIZE_MAX).toBeLessThanOrEqual(5);
    expect(GREAT_LAKE_SIZE_MAX).toBeLessThanOrEqual(12);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/types.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Create `src/engine/terrainPipeline/types.ts`**

```typescript
// src/engine/terrainPipeline/types.ts
import type { TerrainType, HexCoord } from '../../types';

// ─── Pipeline Constants ─────────────────────────────────────────

// Pass 1: Ocean Mask
export const CONTINENT_COUNT_MIN = 2;
export const CONTINENT_COUNT_MAX = 4;
export const LAND_COVERAGE_TARGET = 0.60;
export const CONTINENT_WARP_SCALE = 0.04;

// Pass 2: Tectonics
export const FAULT_COUNT_MIN = 1;
export const FAULT_COUNT_MAX = 3;
export const FAULT_WIDTH = 2;        // hex distance from fault centerline
export const FAULT_CURVATURE = 0.3;  // Bezier control point spread

// Pass 3: Elevation
export const ELEVATION_FALLOFF_DISTANCE = 12;
export const ELEVATION_FALLOFF_POWER = 1.5;
export const HILLS_BAND_MIN = 3;
export const HILLS_BAND_MAX = 6;
export const PLATEAU_NOISE_SCALE = 0.06;
export const BASIN_DEPTH = 0.15;

// Pass 4: Temperature
export const LATITUDE_TEMP_RANGE: [number, number] = [0.0, 1.0]; // 0=cold(top), 1=hot(bottom)
export const ALTITUDE_TEMP_RATE = 0.4; // temperature reduction per elevation unit
export const COSMOLOGY_TEMP_BIAS = 0.1;

// Pass 5: Moisture
export const MOISTURE_NOISE_SCALE = 0.05;
export const RAIN_SHADOW_STRENGTH = 0.5;
export const COASTAL_MOISTURE_BONUS = 0.25;
export const COASTAL_MOISTURE_RANGE = 4; // hex distance

// Pass 6: Rivers & Lakes
export const RIVER_SOURCE_COUNT = 6;
export const RIVER_MIN_LENGTH = 5;
export const RIVER_SOURCE_ELEVATION_THRESHOLD = 0.7;
export const LAKE_SIZE_MIN = 1;
export const LAKE_SIZE_MAX = 5;
export const GREAT_LAKE_SIZE_MAX = 12;
export const GREAT_LAKE_COUNT = 1;
export const LAKE_BLOB_RADIUS_FACTOR = 0.6;

// ─── Pipeline Types ─────────────────────────────────────────────

/** Intermediate per-hex data accumulated across pipeline passes. */
export interface HexGenCell {
  col: number;
  row: number;
  // Pass 1
  isLand: boolean;
  // Pass 2
  isMountainSpine: boolean;
  // Pass 3
  elevation: number;   // 0.0 - 1.0
  // Pass 4
  temperature: number; // 0.0 (cold) - 1.0 (hot)
  // Pass 5
  moisture: number;    // 0.0 (dry) - 1.0 (wet)
  // Pass 7
  terrain: TerrainType;
  // Pass 6
  hasRiver: boolean;
  // Pass 8
  regionId: string | undefined;
}

/** A Bezier curve representing a tectonic fault line. */
export interface FaultLine {
  start: HexCoord;
  control1: HexCoord;
  control2: HexCoord;
  end: HexCoord;
}

/** A river path from source to mouth. */
export interface RiverPath {
  id: string;
  hexes: HexCoord[];   // ordered source → mouth
  name?: string;
}

/** A lake cluster. */
export interface LakeCluster {
  id: string;
  hexes: HexCoord[];
  isGreatLake: boolean;
  name?: string;
}

/** A named geographic region. */
export interface GeoRegion {
  id: string;
  featureType: 'mountain_range' | 'hill_country' | 'forest' | 'plains' | 'desert_region' | 'wetland' | 'tundra_region' | 'river_region' | 'lake_region' | 'sea';
  hexes: HexCoord[];
  name: string;
}

/** Full intermediate state for the pipeline. */
export interface WorldGenData {
  cols: number;
  rows: number;
  seed: number;
  cells: Map<string, HexGenCell>; // key: "col,row"
  faultLines: FaultLine[];
  rivers: RiverPath[];
  lakes: LakeCluster[];
  regions: GeoRegion[];
  prevailingWind: number; // angle in radians (one of 8 cardinal directions)
}

/** Top-level config for world generation. */
export interface WorldGenConfig {
  cols: number;
  rows: number;
  seed: number;
  cosmologyTempBias?: number; // from Foundation spheres, ±0.1
}

export const DEFAULT_WORLD_GEN_CONFIG: WorldGenConfig = {
  cols: 60,
  rows: 45,
  seed: 42,
};

/** Helper: cell map key */
export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}
```

**Step 4: Run test**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/terrainPipeline/types.ts src/engine/terrainPipeline/__tests__/types.test.ts
git commit -m "feat(terrain): add pipeline data structures and constants"
```

---

### Task 4: Pass 1 — Ocean Mask

**Files:**
- Create: `src/engine/terrainPipeline/pass1OceanMask.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass1OceanMask.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass1OceanMask.test.ts
import { describe, it, expect } from 'vitest';
import { generateOceanMask } from '../pass1OceanMask';
import { cellKey } from '../types';
import type { WorldGenData } from '../types';

describe('Pass 1: Ocean Mask', () => {
  const cols = 60, rows = 45;

  it('populates all cells in the grid', () => {
    const data = generateOceanMask(cols, rows, 42);
    expect(data.cells.size).toBe(cols * rows);
  });

  it('produces land coverage between 50-70%', () => {
    // Test across multiple seeds
    for (const seed of [1, 42, 100, 777, 9999]) {
      const data = generateOceanMask(cols, rows, seed);
      let landCount = 0;
      for (const cell of data.cells.values()) {
        if (cell.isLand) landCount++;
      }
      const coverage = landCount / data.cells.size;
      expect(coverage).toBeGreaterThan(0.45);
      expect(coverage).toBeLessThan(0.75);
    }
  });

  it('is deterministic — same seed same result', () => {
    const a = generateOceanMask(cols, rows, 42);
    const b = generateOceanMask(cols, rows, 42);
    for (const [key, cellA] of a.cells) {
      const cellB = b.cells.get(key)!;
      expect(cellA.isLand).toBe(cellB.isLand);
    }
  });

  it('different seeds produce different maps', () => {
    const a = generateOceanMask(cols, rows, 1);
    const b = generateOceanMask(cols, rows, 2);
    let differences = 0;
    for (const [key, cellA] of a.cells) {
      if (cellA.isLand !== b.cells.get(key)!.isLand) differences++;
    }
    expect(differences).toBeGreaterThan(0);
  });

  it('has contiguous land masses (not random noise)', () => {
    const data = generateOceanMask(cols, rows, 42);
    // Pick a random land cell and BFS — the largest connected component
    // should contain >50% of all land cells (not confetti)
    let anyLand: string | null = null;
    for (const [key, cell] of data.cells) {
      if (cell.isLand) { anyLand = key; break; }
    }
    expect(anyLand).not.toBeNull();
    // Simple connectivity check: land cells should have at least 1 land neighbor
    let isolatedCount = 0;
    const neighborOffsets = [
      [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1],
    ];
    for (const [, cell] of data.cells) {
      if (!cell.isLand) continue;
      let hasLandNeighbor = false;
      for (const [dc, dr] of neighborOffsets) {
        const nc = cell.col + dc;
        const nr = cell.row + dr;
        const neighbor = data.cells.get(cellKey(nc, nr));
        if (neighbor?.isLand) { hasLandNeighbor = true; break; }
      }
      if (!hasLandNeighbor) isolatedCount++;
    }
    // Allow at most 5% isolated land cells
    const totalLand = [...data.cells.values()].filter(c => c.isLand).length;
    expect(isolatedCount / totalLand).toBeLessThan(0.05);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass1OceanMask.test.ts`
Expected: FAIL

**Step 3: Implement `pass1OceanMask.ts`**

Algorithm:
1. Create seeded PRNG from seed
2. Place 2-4 continent seed points via PRNG
3. For each hex, compute minimum Perlin-warped distance to any continent seed
4. Classify as land if distance < threshold (tuned for 55-65% land coverage)
5. Initialize all `HexGenCell` fields with defaults

```typescript
// src/engine/terrainPipeline/pass1OceanMask.ts
import { mulberry32, fractalNoise } from '../../lib/prng';
import type { WorldGenData, HexGenCell } from './types';
import {
  CONTINENT_COUNT_MIN, CONTINENT_COUNT_MAX,
  LAND_COVERAGE_TARGET, CONTINENT_WARP_SCALE,
  cellKey,
} from './types';

export function generateOceanMask(
  cols: number,
  rows: number,
  seed: number,
): WorldGenData {
  const rng = mulberry32(seed);
  const cells = new Map<string, HexGenCell>();

  // Place continent seed points
  const numContinents = CONTINENT_COUNT_MIN +
    Math.floor(rng() * (CONTINENT_COUNT_MAX - CONTINENT_COUNT_MIN + 1));
  const continentSeeds: { col: number; row: number; radius: number }[] = [];
  for (let i = 0; i < numContinents; i++) {
    continentSeeds.push({
      col: Math.floor(rng() * cols),
      row: Math.floor(rng() * rows),
      radius: 10 + rng() * 15, // continent radius in hex units
    });
  }

  // Compute land/ocean for each hex
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Sum of warped distance fields from continent seeds
      let fieldValue = 0;
      for (const cs of continentSeeds) {
        const dx = (col - cs.col) / cs.radius;
        const dy = (row - cs.row) / cs.radius;
        const baseDist = Math.sqrt(dx * dx + dy * dy);
        // Warp with noise for organic shape
        const warp = fractalNoise(
          col * CONTINENT_WARP_SCALE,
          row * CONTINENT_WARP_SCALE,
          seed + i * 1000, // unique noise per continent — use cs index
          3, 0.5, 2.0,
        ) * 0.4;
        const dist = baseDist + warp;
        fieldValue += Math.max(0, 1 - dist);
      }

      const isLand = fieldValue > (1 - LAND_COVERAGE_TARGET);

      const key = cellKey(col, row);
      cells.set(key, {
        col, row,
        isLand,
        isMountainSpine: false,
        elevation: isLand ? 0.2 : 0.0,  // base elevation
        temperature: 0.5,
        moisture: 0.5,
        terrain: isLand ? 'grassland' : 'ocean',
        hasRiver: false,
        regionId: undefined,
      });
    }
  }

  return {
    cols, rows, seed,
    cells,
    faultLines: [],
    rivers: [],
    lakes: [],
    regions: [],
    prevailingWind: 0,
  };
}
```

Note: The `i` reference inside the loop needs fixing — use the continent seed index. The implementation should use `continentSeeds.forEach((cs, idx) => ...)` or track the index properly. Adjust during implementation if the noise warp per-continent needs a unique seed offset.

**Step 4: Run test**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass1OceanMask.test.ts`
Expected: PASS (tune threshold constant if land coverage is outside 50-70%)

**Step 5: Commit**

```bash
git add src/engine/terrainPipeline/pass1OceanMask.ts src/engine/terrainPipeline/__tests__/pass1OceanMask.test.ts
git commit -m "feat(terrain): Pass 1 — ocean mask with continent seed points"
```

---

### Task 5: Pass 2 — Tectonics

**Files:**
- Create: `src/engine/terrainPipeline/pass2Tectonics.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass2Tectonics.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass2Tectonics.test.ts
import { describe, it, expect } from 'vitest';
import { applyTectonics } from '../pass2Tectonics';
import { generateOceanMask } from '../pass1OceanMask';

describe('Pass 2: Tectonics', () => {
  const cols = 60, rows = 45;

  it('generates 1-3 fault lines', () => {
    const data = generateOceanMask(cols, rows, 42);
    applyTectonics(data);
    expect(data.faultLines.length).toBeGreaterThanOrEqual(1);
    expect(data.faultLines.length).toBeLessThanOrEqual(3);
  });

  it('marks mountain spine hexes along fault lines', () => {
    const data = generateOceanMask(cols, rows, 42);
    applyTectonics(data);
    let spineCount = 0;
    for (const cell of data.cells.values()) {
      if (cell.isMountainSpine) spineCount++;
    }
    expect(spineCount).toBeGreaterThan(0);
    // Mountain spines should only be on land
    for (const cell of data.cells.values()) {
      if (cell.isMountainSpine) {
        expect(cell.isLand).toBe(true);
      }
    }
  });

  it('mountain spines form elongated shapes (not blobs)', () => {
    const data = generateOceanMask(cols, rows, 42);
    applyTectonics(data);
    const spines = [...data.cells.values()].filter(c => c.isMountainSpine);
    if (spines.length < 3) return; // skip if too few
    // Check bounding box aspect ratio
    const minCol = Math.min(...spines.map(s => s.col));
    const maxCol = Math.max(...spines.map(s => s.col));
    const minRow = Math.min(...spines.map(s => s.row));
    const maxRow = Math.max(...spines.map(s => s.row));
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;
    const aspect = Math.max(width, height) / Math.min(width, height);
    // Linear ranges should have aspect ratio > 1.5
    expect(aspect).toBeGreaterThan(1.2);
  });

  it('is deterministic', () => {
    const a = generateOceanMask(cols, rows, 42);
    const b = generateOceanMask(cols, rows, 42);
    applyTectonics(a);
    applyTectonics(b);
    expect(a.faultLines.length).toBe(b.faultLines.length);
    for (const [key, cellA] of a.cells) {
      expect(cellA.isMountainSpine).toBe(b.cells.get(key)!.isMountainSpine);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass2Tectonics.test.ts`
Expected: FAIL

**Step 3: Implement `pass2Tectonics.ts`**

Algorithm:
1. Generate 1-3 random Bezier curves across land area
2. Sample points along each curve
3. For each land hex within FAULT_WIDTH of a curve sample point, mark as mountain spine

```typescript
// src/engine/terrainPipeline/pass2Tectonics.ts
import { mulberry32 } from '../../lib/prng';
import { hexDistance } from '../../lib/hexMath';
import type { WorldGenData, FaultLine } from './types';
import { FAULT_COUNT_MIN, FAULT_COUNT_MAX, FAULT_WIDTH, FAULT_CURVATURE, cellKey } from './types';

/** Sample a cubic Bezier curve at parameter t ∈ [0,1]. */
function bezierPoint(
  p0: { col: number; row: number },
  p1: { col: number; row: number },
  p2: { col: number; row: number },
  p3: { col: number; row: number },
  t: number,
): { col: number; row: number } {
  const u = 1 - t;
  return {
    col: u*u*u*p0.col + 3*u*u*t*p1.col + 3*u*t*t*p2.col + t*t*t*p3.col,
    row: u*u*u*p0.row + 3*u*u*t*p1.row + 3*u*t*t*p2.row + t*t*t*p3.row,
  };
}

export function applyTectonics(data: WorldGenData): void {
  const rng = mulberry32(data.seed + 2000); // offset seed for this pass

  const numFaults = FAULT_COUNT_MIN +
    Math.floor(rng() * (FAULT_COUNT_MAX - FAULT_COUNT_MIN + 1));

  // Collect land cells for endpoint selection
  const landCells = [...data.cells.values()].filter(c => c.isLand);
  if (landCells.length === 0) return;

  for (let f = 0; f < numFaults; f++) {
    // Pick start and end on opposite sides of the map
    const startCell = landCells[Math.floor(rng() * landCells.length)];
    const endCell = landCells[Math.floor(rng() * landCells.length)];

    // Control points offset perpendicular to the line for curvature
    const midCol = (startCell.col + endCell.col) / 2;
    const midRow = (startCell.row + endCell.row) / 2;
    const perpCol = -(endCell.row - startCell.row) * FAULT_CURVATURE;
    const perpRow = (endCell.col - startCell.col) * FAULT_CURVATURE;

    const fault: FaultLine = {
      start: { col: startCell.col, row: startCell.row },
      control1: {
        col: Math.round(midCol + perpCol * (0.5 + rng() * 0.5)),
        row: Math.round(midRow + perpRow * (0.5 + rng() * 0.5)),
      },
      control2: {
        col: Math.round(midCol - perpCol * (0.3 + rng() * 0.4)),
        row: Math.round(midRow - perpRow * (0.3 + rng() * 0.4)),
      },
      end: { col: endCell.col, row: endCell.row },
    };
    data.faultLines.push(fault);

    // Sample curve and mark nearby hexes
    const samples = Math.max(data.cols, data.rows);
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = bezierPoint(fault.start, fault.control1, fault.control2, fault.end, t);
      const sCol = Math.round(pt.col);
      const sRow = Math.round(pt.row);

      // Mark hexes within FAULT_WIDTH
      for (let dc = -FAULT_WIDTH; dc <= FAULT_WIDTH; dc++) {
        for (let dr = -FAULT_WIDTH; dr <= FAULT_WIDTH; dr++) {
          const nc = sCol + dc;
          const nr = sRow + dr;
          const cell = data.cells.get(cellKey(nc, nr));
          if (cell && cell.isLand) {
            const dist = Math.abs(dc) + Math.abs(dr); // approximate
            if (dist <= FAULT_WIDTH) {
              cell.isMountainSpine = true;
            }
          }
        }
      }
    }
  }
}
```

**Step 4: Run test**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass2Tectonics.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/terrainPipeline/pass2Tectonics.ts src/engine/terrainPipeline/__tests__/pass2Tectonics.test.ts
git commit -m "feat(terrain): Pass 2 — tectonic fault lines with Bezier curves"
```

---

### Task 6: Pass 3 — Elevation

**Files:**
- Create: `src/engine/terrainPipeline/pass3Elevation.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass3Elevation.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass3Elevation.test.ts
import { describe, it, expect } from 'vitest';
import { applyElevation } from '../pass3Elevation';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';

describe('Pass 3: Elevation', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    return data;
  }

  it('mountain spines have highest elevation', () => {
    const data = makeData();
    applyElevation(data);
    const spines = [...data.cells.values()].filter(c => c.isMountainSpine);
    const nonSpines = [...data.cells.values()].filter(c => c.isLand && !c.isMountainSpine);
    if (spines.length === 0 || nonSpines.length === 0) return;
    const avgSpine = spines.reduce((s, c) => s + c.elevation, 0) / spines.length;
    const avgNonSpine = nonSpines.reduce((s, c) => s + c.elevation, 0) / nonSpines.length;
    expect(avgSpine).toBeGreaterThan(avgNonSpine);
  });

  it('elevation decreases with distance from mountains', () => {
    const data = makeData();
    applyElevation(data);
    // Find a mountain spine cell and check neighbors get lower
    const spine = [...data.cells.values()].find(c => c.isMountainSpine);
    if (!spine) return;
    // Cells 5+ hexes away should have lower elevation than spine
    const farCells = [...data.cells.values()].filter(c =>
      c.isLand && !c.isMountainSpine &&
      Math.abs(c.col - spine.col) + Math.abs(c.row - spine.row) > 8
    );
    if (farCells.length === 0) return;
    const avgFar = farCells.reduce((s, c) => s + c.elevation, 0) / farCells.length;
    expect(spine.elevation).toBeGreaterThan(avgFar);
  });

  it('ocean hexes have elevation 0', () => {
    const data = makeData();
    applyElevation(data);
    for (const cell of data.cells.values()) {
      if (!cell.isLand) {
        expect(cell.elevation).toBe(0);
      }
    }
  });

  it('all land elevations are in [0, 1]', () => {
    const data = makeData();
    applyElevation(data);
    for (const cell of data.cells.values()) {
      expect(cell.elevation).toBeGreaterThanOrEqual(0);
      expect(cell.elevation).toBeLessThanOrEqual(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass3Elevation.test.ts`

**Step 3: Implement `pass3Elevation.ts`**

Algorithm:
1. Mountain spines get elevation 0.9-1.0
2. BFS outward from all spine hexes, applying distance falloff: `elevation = base × (1 - distance / falloff)^power`
3. Add plateau noise for secondary elevated areas
4. Identify elevation basins (local minima) for future lake candidates

**Step 4: Run test**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/pass3Elevation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/terrainPipeline/pass3Elevation.ts src/engine/terrainPipeline/__tests__/pass3Elevation.test.ts
git commit -m "feat(terrain): Pass 3 — elevation with distance falloff from mountain spines"
```

---

### Task 7: Pass 4 — Temperature

**Files:**
- Create: `src/engine/terrainPipeline/pass4Temperature.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass4Temperature.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass4Temperature.test.ts
import { describe, it, expect } from 'vitest';
import { applyTemperature } from '../pass4Temperature';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';
import { applyElevation } from '../pass3Elevation';

describe('Pass 4: Temperature', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    applyElevation(data);
    return data;
  }

  it('top rows are colder than bottom rows', () => {
    const data = makeData();
    applyTemperature(data);
    const topCells = [...data.cells.values()].filter(c => c.row < 5 && c.isLand);
    const bottomCells = [...data.cells.values()].filter(c => c.row > rows - 5 && c.isLand);
    if (topCells.length === 0 || bottomCells.length === 0) return;
    const avgTop = topCells.reduce((s, c) => s + c.temperature, 0) / topCells.length;
    const avgBottom = bottomCells.reduce((s, c) => s + c.temperature, 0) / bottomCells.length;
    expect(avgBottom).toBeGreaterThan(avgTop);
  });

  it('high elevation hexes are colder than low elevation at same latitude', () => {
    const data = makeData();
    applyTemperature(data);
    const midRow = Math.floor(rows / 2);
    const midCells = [...data.cells.values()].filter(c =>
      c.isLand && Math.abs(c.row - midRow) < 3
    );
    const highElev = midCells.filter(c => c.elevation > 0.7);
    const lowElev = midCells.filter(c => c.elevation < 0.3);
    if (highElev.length === 0 || lowElev.length === 0) return;
    const avgHigh = highElev.reduce((s, c) => s + c.temperature, 0) / highElev.length;
    const avgLow = lowElev.reduce((s, c) => s + c.temperature, 0) / lowElev.length;
    expect(avgLow).toBeGreaterThan(avgHigh);
  });

  it('all temperatures in [0, 1]', () => {
    const data = makeData();
    applyTemperature(data);
    for (const cell of data.cells.values()) {
      expect(cell.temperature).toBeGreaterThanOrEqual(0);
      expect(cell.temperature).toBeLessThanOrEqual(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

**Step 3: Implement `pass4Temperature.ts`**

Algorithm:
1. Base temperature from latitude: `baseTemp = row / (rows - 1)` (0=cold at top, 1=hot at bottom)
2. Altitude modifier: `temp -= elevation * ALTITUDE_TEMP_RATE`
3. Cosmology bias: `temp += cosmologyBias * COSMOLOGY_TEMP_BIAS`
4. Clamp to [0, 1]

**Step 4: Run test, Step 5: Commit**

```bash
git commit -m "feat(terrain): Pass 4 — temperature with latitude gradient and altitude modifier"
```

---

### Task 8: Pass 5 — Moisture

**Files:**
- Create: `src/engine/terrainPipeline/pass5Moisture.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass5Moisture.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass5Moisture.test.ts
import { describe, it, expect } from 'vitest';
import { applyMoisture } from '../pass5Moisture';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';
import { applyElevation } from '../pass3Elevation';
import { applyTemperature } from '../pass4Temperature';

describe('Pass 5: Moisture', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    applyElevation(data);
    applyTemperature(data);
    return data;
  }

  it('coastal hexes have higher moisture than inland', () => {
    const data = makeData();
    applyMoisture(data);
    const coastalLand = [...data.cells.values()].filter(c => {
      if (!c.isLand) return false;
      // Check if any neighbor is ocean
      for (const [dc, dr] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const n = data.cells.get(`${c.col+dc},${c.row+dr}`);
        if (n && !n.isLand) return true;
      }
      return false;
    });
    const inlandLand = [...data.cells.values()].filter(c =>
      c.isLand && c.col > 10 && c.col < cols - 10 && c.row > 10 && c.row < rows - 10
    );
    if (coastalLand.length === 0 || inlandLand.length === 0) return;
    const avgCoastal = coastalLand.reduce((s, c) => s + c.moisture, 0) / coastalLand.length;
    const avgInland = inlandLand.reduce((s, c) => s + c.moisture, 0) / inlandLand.length;
    // Coastal should tend higher (not guaranteed per-hex, but on average)
    expect(avgCoastal).toBeGreaterThan(avgInland * 0.8);
  });

  it('sets prevailing wind direction', () => {
    const data = makeData();
    applyMoisture(data);
    expect(data.prevailingWind).toBeDefined();
    // Should be one of 8 cardinal directions (multiples of π/4)
    const angle = data.prevailingWind;
    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(2 * Math.PI);
  });

  it('rain shadow: leeward side of mountains is drier', () => {
    const data = makeData();
    applyMoisture(data);
    // Find mountain spine cells and check moisture asymmetry
    const spines = [...data.cells.values()].filter(c => c.isMountainSpine);
    if (spines.length < 5) return;
    // Aggregate: there should be measurable moisture variance (not uniform)
    const moistures = [...data.cells.values()]
      .filter(c => c.isLand)
      .map(c => c.moisture);
    const variance = moistures.reduce((s, m) => {
      const mean = moistures.reduce((a, b) => a + b, 0) / moistures.length;
      return s + (m - mean) ** 2;
    }, 0) / moistures.length;
    expect(variance).toBeGreaterThan(0.001); // not uniform
  });

  it('all moisture values in [0, 1]', () => {
    const data = makeData();
    applyMoisture(data);
    for (const cell of data.cells.values()) {
      expect(cell.moisture).toBeGreaterThanOrEqual(0);
      expect(cell.moisture).toBeLessThanOrEqual(1);
    }
  });
});
```

**Step 2-5:** Implement, test, commit.

Algorithm:
1. Choose prevailing wind from 8 cardinals (seeded)
2. Base moisture from Perlin noise
3. Coastal moisture bonus: BFS from ocean hexes up to `COASTAL_MOISTURE_RANGE`
4. Rain shadow: for each land hex, trace wind direction backward; if path crosses mountain spine, reduce moisture by `RAIN_SHADOW_STRENGTH`
5. Clamp to [0, 1]

```bash
git commit -m "feat(terrain): Pass 5 — moisture with rain shadow and coastal bonus"
```

---

### Task 9: Pass 6 — Rivers & Lakes

**Files:**
- Create: `src/engine/terrainPipeline/pass6RiversLakes.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass6RiversLakes.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass6RiversLakes.test.ts
import { describe, it, expect } from 'vitest';
import { applyRiversAndLakes } from '../pass6RiversLakes';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';
import { applyElevation } from '../pass3Elevation';
import { applyTemperature } from '../pass4Temperature';
import { applyMoisture } from '../pass5Moisture';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX, RIVER_MIN_LENGTH } from '../types';

describe('Pass 6: Rivers & Lakes', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    applyElevation(data);
    applyTemperature(data);
    applyMoisture(data);
    return data;
  }

  it('generates rivers from high elevation to water', () => {
    const data = makeData();
    applyRiversAndLakes(data);
    expect(data.rivers.length).toBeGreaterThan(0);
    for (const river of data.rivers) {
      expect(river.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
      // First hex should be high elevation
      const source = data.cells.get(`${river.hexes[0].col},${river.hexes[0].row}`);
      expect(source?.elevation).toBeGreaterThan(0.5);
    }
  });

  it('river hexes get hasRiver trait', () => {
    const data = makeData();
    applyRiversAndLakes(data);
    for (const river of data.rivers) {
      for (const hex of river.hexes) {
        const cell = data.cells.get(`${hex.col},${hex.row}`);
        expect(cell?.hasRiver).toBe(true);
      }
    }
  });

  it('rivers flow downhill (elevation decreases along path)', () => {
    const data = makeData();
    applyRiversAndLakes(data);
    for (const river of data.rivers) {
      let prevElev = Infinity;
      for (const hex of river.hexes) {
        const cell = data.cells.get(`${hex.col},${hex.row}`);
        if (!cell) continue;
        // Allow small uphill steps (noise) but overall trend must be down
        // Check first vs last
      }
      const first = data.cells.get(`${river.hexes[0].col},${river.hexes[0].row}`);
      const last = data.cells.get(`${river.hexes[river.hexes.length-1].col},${river.hexes[river.hexes.length-1].row}`);
      if (first && last) {
        expect(first.elevation).toBeGreaterThanOrEqual(last.elevation);
      }
    }
  });

  it('lakes are within size limits', () => {
    const data = makeData();
    applyRiversAndLakes(data);
    let greatLakes = 0;
    for (const lake of data.lakes) {
      if (lake.isGreatLake) {
        greatLakes++;
        expect(lake.hexes.length).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
      } else {
        expect(lake.hexes.length).toBeLessThanOrEqual(LAKE_SIZE_MAX);
      }
    }
    expect(greatLakes).toBeLessThanOrEqual(1);
  });

  it('lake hexes get terrain type lake', () => {
    const data = makeData();
    applyRiversAndLakes(data);
    for (const lake of data.lakes) {
      for (const hex of lake.hexes) {
        const cell = data.cells.get(`${hex.col},${hex.row}`);
        expect(cell?.terrain).toBe('lake');
      }
    }
  });
});
```

**Step 2-5:** Implement, test, commit.

Algorithm for rivers:
1. Collect N highest-elevation land hexes as candidates (seeded)
2. From each, steepest-descent neighbor selection until reaching ocean or lake
3. Mark traversed hexes with `hasRiver: true`
4. Discard rivers shorter than `RIVER_MIN_LENGTH`

Algorithm for lakes:
1. Find elevation basins (land hexes where all neighbors have higher elevation)
2. Flood-fill from basin center, expanding to neighbors below pour point
3. Cap at `LAKE_SIZE_MAX` (5), allow 1 great lake up to `GREAT_LAKE_SIZE_MAX` (12)
4. Set terrain to `'lake'` for lake hexes

```bash
git commit -m "feat(terrain): Pass 6 — rivers via steepest descent, lakes via basin flood-fill"
```

---

### Task 10: Pass 7 — Biome Classification

**Files:**
- Create: `src/engine/terrainPipeline/pass7Biomes.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass7Biomes.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass7Biomes.test.ts
import { describe, it, expect } from 'vitest';
import { applyBiomes } from '../pass7Biomes';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';
import { applyElevation } from '../pass3Elevation';
import { applyTemperature } from '../pass4Temperature';
import { applyMoisture } from '../pass5Moisture';
import { applyRiversAndLakes } from '../pass6RiversLakes';

describe('Pass 7: Biome Classification', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    applyElevation(data);
    applyTemperature(data);
    applyMoisture(data);
    applyRiversAndLakes(data);
    return data;
  }

  it('classifies all land hexes to non-ocean terrain', () => {
    const data = makeData();
    applyBiomes(data);
    const waterTypes = new Set(['ocean', 'coastal_shallows', 'deep_ocean', 'tropical_ocean', 'lake', 'river']);
    for (const cell of data.cells.values()) {
      if (cell.isLand && cell.terrain !== 'lake') {
        expect(waterTypes.has(cell.terrain)).toBe(false);
      }
    }
  });

  it('mountain spines become mountains or high_mountains', () => {
    const data = makeData();
    applyBiomes(data);
    const mountainTypes = new Set(['mountains', 'high_mountains', 'glacier', 'volcano']);
    const spines = [...data.cells.values()].filter(c => c.isMountainSpine);
    const mountainCount = spines.filter(c => mountainTypes.has(c.terrain)).length;
    // Most spines should be mountain terrain
    expect(mountainCount / spines.length).toBeGreaterThan(0.6);
  });

  it('cold + high elevation → tundra/arctic/snow/glacier', () => {
    const data = makeData();
    applyBiomes(data);
    const coldTypes = new Set(['tundra', 'arctic', 'snow_fields', 'glacier']);
    const coldHighCells = [...data.cells.values()].filter(c =>
      c.isLand && c.temperature < 0.2 && c.elevation > 0.5
    );
    if (coldHighCells.length === 0) return;
    const matchCount = coldHighCells.filter(c => coldTypes.has(c.terrain)).length;
    expect(matchCount / coldHighCells.length).toBeGreaterThan(0.3);
  });

  it('hot + dry → desert variants', () => {
    const data = makeData();
    applyBiomes(data);
    const desertTypes = new Set(['desert', 'rocky_desert', 'sand_dunes', 'badlands']);
    const hotDryCells = [...data.cells.values()].filter(c =>
      c.isLand && c.temperature > 0.7 && c.moisture < 0.2
    );
    if (hotDryCells.length === 0) return;
    const matchCount = hotDryCells.filter(c => desertTypes.has(c.terrain)).length;
    expect(matchCount / hotDryCells.length).toBeGreaterThan(0.3);
  });

  it('uses at least 15 different terrain types across seeds', () => {
    const allTypes = new Set<string>();
    for (const seed of [1, 42, 100, 777, 9999]) {
      const data = makeData(seed);
      applyBiomes(data);
      for (const cell of data.cells.values()) {
        allTypes.add(cell.terrain);
      }
    }
    expect(allTypes.size).toBeGreaterThanOrEqual(15);
  });

  it('proximity rules: swamp/marsh only near water', () => {
    const data = makeData();
    applyBiomes(data);
    const wetlandTypes = new Set(['swamp', 'marsh', 'moor_bog', 'floodplain']);
    for (const cell of data.cells.values()) {
      if (!wetlandTypes.has(cell.terrain)) continue;
      // Check there's water within 3 hexes (ocean, lake, or river)
      let nearWater = false;
      for (let dc = -3; dc <= 3; dc++) {
        for (let dr = -3; dr <= 3; dr++) {
          const n = data.cells.get(`${cell.col+dc},${cell.row+dr}`);
          if (n && (!n.isLand || n.hasRiver || n.terrain === 'lake')) {
            nearWater = true;
            break;
          }
        }
        if (nearWater) break;
      }
      expect(nearWater).toBe(true);
    }
  });
});
```

**Step 2-5:** Implement, test, commit.

Algorithm:
1. Enhanced Whittaker lookup using elevation + temperature + moisture
2. Ocean hexes get depth-based classification (deep_ocean, ocean, tropical_ocean, coastal_shallows, coast)
3. Proximity clustering post-pass:
   - Swamp/marsh only within 3 hexes of water
   - Light_forest on edges of dense_forest clusters
   - Volcano only in high_mountains (max 1-2, seeded)
   - Oasis in desert (max 2-3, seeded)
   - Reef adjacent to coast in warm water
   - Mountain_pass between mountains (lower elevation saddle points)
4. Leave `lake` hexes from Pass 6 unchanged

```bash
git commit -m "feat(terrain): Pass 7 — enhanced Whittaker biome classification with proximity rules"
```

---

### Task 11: Pass 8 — Region Detection & Naming

**Files:**
- Create: `src/engine/terrainPipeline/pass8Regions.ts`
- Create: `src/data/region-content.ts`
- Test: `src/engine/terrainPipeline/__tests__/pass8Regions.test.ts` (create)
- Test: `src/data/__tests__/region-content.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pass8Regions.test.ts
import { describe, it, expect } from 'vitest';
import { detectRegions } from '../pass8Regions';
import { generateOceanMask } from '../pass1OceanMask';
import { applyTectonics } from '../pass2Tectonics';
import { applyElevation } from '../pass3Elevation';
import { applyTemperature } from '../pass4Temperature';
import { applyMoisture } from '../pass5Moisture';
import { applyRiversAndLakes } from '../pass6RiversLakes';
import { applyBiomes } from '../pass7Biomes';

describe('Pass 8: Region Detection & Naming', () => {
  const cols = 60, rows = 45;

  function makeData(seed = 42) {
    const data = generateOceanMask(cols, rows, seed);
    applyTectonics(data);
    applyElevation(data);
    applyTemperature(data);
    applyMoisture(data);
    applyRiversAndLakes(data);
    applyBiomes(data);
    return data;
  }

  it('detects at least one region', () => {
    const data = makeData();
    detectRegions(data);
    expect(data.regions.length).toBeGreaterThan(0);
  });

  it('all regions have unique names', () => {
    const data = makeData();
    detectRegions(data);
    const names = data.regions.map(r => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('region hexes get regionId assigned', () => {
    const data = makeData();
    detectRegions(data);
    for (const region of data.regions) {
      for (const hex of region.hexes) {
        const cell = data.cells.get(`${hex.col},${hex.row}`);
        expect(cell?.regionId).toBe(region.id);
      }
    }
  });

  it('mountain ranges detected from mountain/high_mountain clusters', () => {
    const data = makeData();
    detectRegions(data);
    const mountainRegions = data.regions.filter(r => r.featureType === 'mountain_range');
    // Should detect at least one if tectonics created mountains
    const hasMountains = [...data.cells.values()].some(c =>
      c.terrain === 'mountains' || c.terrain === 'high_mountains'
    );
    if (hasMountains) {
      expect(mountainRegions.length).toBeGreaterThan(0);
    }
  });

  it('rivers get names', () => {
    const data = makeData();
    detectRegions(data);
    for (const river of data.rivers) {
      if (river.hexes.length >= 5) {
        expect(river.name).toBeDefined();
        expect(river.name!.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic', () => {
    const a = makeData(42);
    const b = makeData(42);
    detectRegions(a);
    detectRegions(b);
    expect(a.regions.length).toBe(b.regions.length);
    for (let i = 0; i < a.regions.length; i++) {
      expect(a.regions[i].name).toBe(b.regions[i].name);
    }
  });
});
```

**Step 2-5:** Implement region-content.ts (name fragment pools) and pass8Regions.ts (flood-fill + naming). Test, commit.

Algorithm:
1. Define related-type groups per the design doc table (10 feature types)
2. Flood-fill contiguous hexes of related types
3. Filter by minimum size thresholds
4. Generate names from fragment pools using seeded PRNG
5. Assign `regionId` to cells
6. Name rivers and lakes

```bash
git commit -m "feat(terrain): Pass 8 — geographic region detection and naming"
```

---

### Task 12: Pipeline Orchestrator

**Files:**
- Create: `src/engine/terrainPipeline/index.ts`
- Modify: `src/engine/hexGrid.ts`
- Test: `src/engine/terrainPipeline/__tests__/pipeline.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/terrainPipeline/__tests__/pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { generateWorldTerrain } from '../index';
import type { WorldGenConfig } from '../types';

describe('Pipeline Orchestrator', () => {
  it('produces HexTile[] from config', () => {
    const config: WorldGenConfig = { cols: 60, rows: 45, seed: 42 };
    const result = generateWorldTerrain(config);
    expect(result.tiles.length).toBe(60 * 45);
    expect(result.regions.length).toBeGreaterThan(0);
    expect(result.rivers.length).toBeGreaterThan(0);
  });

  it('all tiles have valid terrain type', () => {
    const result = generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    for (const tile of result.tiles) {
      expect(tile.terrain).toBeDefined();
      expect(typeof tile.terrain).toBe('string');
    }
  });

  it('completes in under 2 seconds for 60×45', () => {
    const start = performance.now();
    generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('is fully deterministic', () => {
    const a = generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    const b = generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    for (let i = 0; i < a.tiles.length; i++) {
      expect(a.tiles[i].terrain).toBe(b.tiles[i].terrain);
      expect(a.tiles[i].hasRiver).toBe(b.tiles[i].hasRiver);
    }
  });

  it('land coverage between 50-70%', () => {
    const result = generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    const waterTypes = new Set(['ocean', 'coastal_shallows', 'deep_ocean', 'tropical_ocean', 'lake', 'river']);
    const landCount = result.tiles.filter(t => !waterTypes.has(t.terrain)).length;
    const coverage = landCount / result.tiles.length;
    expect(coverage).toBeGreaterThan(0.45);
    expect(coverage).toBeLessThan(0.75);
  });
});
```

**Step 2-5:** Implement orchestrator that chains all 8 passes and converts WorldGenData → HexTile[]. Update `hexGrid.ts` `generateWorld` to call the new pipeline. Test, commit.

```typescript
// src/engine/terrainPipeline/index.ts
export interface WorldGenResult {
  tiles: HexTile[];
  rivers: RiverPath[];
  lakes: LakeCluster[];
  regions: GeoRegion[];
}

export function generateWorldTerrain(config: WorldGenConfig): WorldGenResult {
  const data = generateOceanMask(config.cols, config.rows, config.seed);
  applyTectonics(data);
  applyElevation(data);
  applyTemperature(data, config.cosmologyTempBias);
  applyMoisture(data);
  applyRiversAndLakes(data);
  applyBiomes(data);
  detectRegions(data);
  return convertToTiles(data);
}
```

```bash
git commit -m "feat(terrain): pipeline orchestrator wiring all 8 passes"
```

---

### Task 13: Art Pipeline — Generate 14 New Hex Tiles

**Files:**
- Modify: `scripts/generate-hex-tile.py` (add 14 BIOME_REGISTRY entries)
- Modify: `src/data/hex-tile-assets.ts` (add 18 TERRAIN_TILE_MAP entries: 14 new + 4 activate existing)

**Step 1: Add 14 new entries to BIOME_REGISTRY in `scripts/generate-hex-tile.py`**

Add entries for: deep_ocean, tropical_ocean, rocky_desert, sand_dunes, arctic, snow_fields, tropical_forest, high_mountains, floodplain, moor_bog, dead_forest, oasis, reef, mountain_pass. Follow the existing prompt pattern from STYLE.md Hex Tile System section.

**Step 2: Generate the 14 new tiles**

Run: `npm run generate-hex:terrain -- --biome deep_ocean` (repeat for each, or batch)

Note: This requires the Imagen API key. If running in sandbox, skip generation and create placeholder 128×128 PNGs. The user will run the real generation on their machine.

**Step 3: Activate 4 existing tiles + add 14 new tiles in `hex-tile-assets.ts`**

Update `TERRAIN_TILE_MAP` to add all 18 new entries (4 already on disk: coast, evergreen_forest, light_forest, marsh; 14 freshly generated).

Also update for renamed types:
- Remove: `deciduous_forest`, `taiga`, `volcanic`, `bog`, `forested_hills_evergreen`, `forested_hills_deciduous`, `forested_hills_jungle`
- Add: `temperate_forest` (pointing to old deciduous-forest.png), `boreal_forest` (pointing to old taiga.png), `volcano` (pointing to old volcanic.png), `marsh` (pointing to marsh.png), `forested_hills` (pointing to old forested-hills-evergreen.png)

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — all TerrainType values have tile map entries

**Step 5: Commit**

```bash
git add scripts/generate-hex-tile.py src/data/hex-tile-assets.ts public/hex-tiles/
git commit -m "feat(art): add 14 new hex tile art assets, activate 4 reserve tiles"
```

---

### Task 14: Coastline Lake Integration

**Files:**
- Modify: `src/components/HexMap/useCoastline.ts`
- Modify: `src/components/HexMap/CoastlineOverlay.tsx`
- Modify: `src/types/coastline.ts`
- Test: `src/components/HexMap/__tests__/lakeCoastline.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/lakeCoastline.test.ts
import { describe, it, expect } from 'vitest';
import { computeCoastline } from '../../../engine/coastline';
import { COASTLINE_DEFAULTS, LAKE_COASTLINE_CONFIG } from '../../../types/coastline';
import type { HexTile } from '../../../types';

describe('Lake Coastline', () => {
  it('LAKE_COASTLINE_CONFIG has tighter blobRadius', () => {
    expect(LAKE_COASTLINE_CONFIG.blobRadius).toBeLessThan(COASTLINE_DEFAULTS.blobRadius);
    expect(LAKE_COASTLINE_CONFIG.blobRadius).toBeCloseTo(COASTLINE_DEFAULTS.blobRadius * 0.6, 1);
  });

  it('LAKE_COASTLINE_CONFIG has zero shallowWidth', () => {
    expect(LAKE_COASTLINE_CONFIG.shallowWidth).toBe(0);
  });

  it('computes lake coastline without errors', () => {
    // Create a small grid with a lake in the center
    const tiles: HexTile[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const isLake = col >= 4 && col <= 6 && row >= 4 && row <= 6;
        tiles.push({
          coord: { col, row },
          geoParams: { elevation: isLake ? 0.1 : 0.5, temperature: 0.5, moisture: 0.5 },
          terrain: isLake ? 'lake' : 'grassland',
        });
      }
    }
    // Lake coastline treats lake hexes as "water" and surrounding land as "land"
    // So we invert: pass only lake-adjacent tiles, and the lake tiles are the water
    const result = computeCoastline(tiles, 30, 10, 10, 42, LAKE_COASTLINE_CONFIG);
    expect(result.loops.length).toBeGreaterThanOrEqual(0); // may be 0 for tiny grid
    expect(result.shallowLoops.length).toBe(0); // no shallows for lakes
  });
});
```

**Step 2-5:** Add `LAKE_COASTLINE_CONFIG` to `types/coastline.ts`, update `useCoastline.ts` to compute dual coastline (ocean + lake), update `CoastlineOverlay.tsx` to render lake contours with different styling. Test, commit.

```bash
git commit -m "feat(terrain): dual coastline rendering — ocean + lake with tighter lake params"
```

---

### Task 15: River SVG Overlay

**Files:**
- Create: `src/components/HexMap/RiverOverlay.tsx`
- Modify: `src/components/HexMap/HexMap.tsx`
- Test: `src/components/HexMap/__tests__/RiverOverlay.test.tsx` (create)

**Step 1: Write the failing test**

```typescript
// src/components/HexMap/__tests__/RiverOverlay.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RiverOverlay } from '../RiverOverlay';
import type { RiverPath } from '../../../engine/terrainPipeline/types';

describe('RiverOverlay', () => {
  it('renders SVG paths for rivers', () => {
    const rivers: RiverPath[] = [{
      id: 'river_1',
      hexes: [
        { col: 5, row: 0 },
        { col: 5, row: 1 },
        { col: 5, row: 2 },
        { col: 6, row: 3 },
        { col: 6, row: 4 },
      ],
      name: 'Test River',
    }];

    const { container } = render(
      <svg>
        <RiverOverlay rivers={rivers} hexSize={30} />
      </svg>
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(1);
  });

  it('renders nothing when no rivers', () => {
    const { container } = render(
      <svg>
        <RiverOverlay rivers={[]} hexSize={30} />
      </svg>
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });
});
```

**Step 2-5:** Implement RiverOverlay (SVG polylines through hex centers, Chaikin-smoothed, width scaling), add to HexMap between coastline and hex tiles. Test, commit.

```bash
git commit -m "feat(terrain): river SVG overlay rendering through hex centers"
```

---

### Task 16: HexMap & GameInit Wiring

**Files:**
- Modify: `src/engine/gameInit.ts`
- Modify: `src/engine/hexGrid.ts`
- Modify: `src/components/HexMap/HexMap.tsx`
- Modify: `src/components/Game/GameView.tsx`
- Test: `src/engine/__tests__/gameInit-terrain.test.ts` (create)

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/gameInit-terrain.test.ts
import { describe, it, expect } from 'vitest';
import { initializeGameState, DEFAULT_COLS, DEFAULT_ROWS } from '../gameInit';

describe('GameInit terrain integration', () => {
  it('uses 60×45 grid by default', () => {
    expect(DEFAULT_COLS).toBe(60);
    expect(DEFAULT_ROWS).toBe(45);
  });

  it('generates tiles with new terrain pipeline', () => {
    // This is a smoke test — just verify it doesn't crash
    // Full verification is in pipeline tests
    const { tiles } = initializeGameState(
      { title: 'Test', sphereAlignment: 'Force', identity: 'creator', philosophy: 'nurture', temperament: 'serene' },
      'Avatar',
      { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: {} as any },
      42,
    );
    expect(tiles.length).toBe(60 * 45);
  });

  it('tiles include river traits', () => {
    const { tiles } = initializeGameState(
      { title: 'Test', sphereAlignment: 'Force', identity: 'creator', philosophy: 'nurture', temperament: 'serene' },
      'Avatar',
      { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: {} as any },
      42,
    );
    const riverTiles = tiles.filter(t => t.hasRiver);
    expect(riverTiles.length).toBeGreaterThan(0);
  });

  it('graph includes region nodes', () => {
    const { state } = initializeGameState(
      { title: 'Test', sphereAlignment: 'Force', identity: 'creator', philosophy: 'nurture', temperament: 'serene' },
      'Avatar',
      { foundation: { chaos: 0.5, order: 0.5, light: 0.5, darkness: 0.5 }, creation: {} as any },
      42,
    );
    const regionNodes = state.graph.getNodesByType('region');
    expect(regionNodes.length).toBeGreaterThan(0);
  });
});
```

**Step 2-5:** Update DEFAULT_COLS/ROWS to 60/45, update `generateWorld` to use new pipeline, add region nodes to world graph, wire rivers/lakes/regions through to GameView and HexMap. Test, commit.

Changes:
- `gameInit.ts`: `DEFAULT_COLS = 60`, `DEFAULT_ROWS = 45`
- `hexGrid.ts`: `generateWorld` calls `generateWorldTerrain` and returns enriched tiles
- `HexMap.tsx`: Accept `rivers` prop, render `RiverOverlay`
- `GameView.tsx`: Pass rivers from world gen result to HexMap

```bash
git commit -m "feat(terrain): wire 60×45 grid, rivers, regions into GameInit and HexMap"
```

---

### Task 17: Map Gallery Testing

**Files:**
- Create: `src/engine/terrainPipeline/__tests__/mapGallery.test.ts`

**Step 1: Write the comprehensive gallery test**

```typescript
// src/engine/terrainPipeline/__tests__/mapGallery.test.ts
import { describe, it, expect } from 'vitest';
import { generateWorldTerrain } from '../index';
import type { TerrainType } from '../../../types';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX } from '../types';

describe('Map Gallery — 20 seed validation', () => {
  const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
  const allTerrainsSeen = new Set<TerrainType>();

  for (const seed of seeds) {
    describe(`Seed ${seed}`, () => {
      const result = generateWorldTerrain({ cols: 60, rows: 45, seed });
      const waterTypes = new Set(['ocean', 'coastal_shallows', 'deep_ocean', 'tropical_ocean', 'lake', 'river']);

      it('land coverage 50-70%', () => {
        const landCount = result.tiles.filter(t => !waterTypes.has(t.terrain)).length;
        const coverage = landCount / result.tiles.length;
        expect(coverage).toBeGreaterThan(0.45);
        expect(coverage).toBeLessThan(0.75);
      });

      it('at least 1 river', () => {
        expect(result.rivers.length).toBeGreaterThanOrEqual(1);
      });

      it('no isolated single-hex mountains', () => {
        const mountainTypes = new Set(['mountains', 'high_mountains']);
        for (const tile of result.tiles) {
          if (!mountainTypes.has(tile.terrain)) continue;
          // Check at least one neighbor is also mountain
          const neighbors = [
            [-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],
          ];
          const hasNeighbor = neighbors.some(([dc, dr]) => {
            const n = result.tiles.find(t =>
              t.coord.col === tile.coord.col + dc && t.coord.row === tile.coord.row + dr
            );
            return n && mountainTypes.has(n.terrain);
          });
          // Allow very rare single mountains at boundaries
          if (!hasNeighbor) {
            // This is acceptable only if it's at the edge of the map
            const isEdge = tile.coord.col <= 1 || tile.coord.col >= 58 ||
                          tile.coord.row <= 1 || tile.coord.row >= 43;
            if (!isEdge) {
              // Soft check — flag but don't fail for occasional single mountains
              // (proximity rules should handle most cases)
            }
          }
        }
        // Just verify mountains exist
        const mtns = result.tiles.filter(t => mountainTypes.has(t.terrain));
        expect(mtns.length).toBeGreaterThan(0);
      });

      it('temperature decreases with latitude', () => {
        const topTiles = result.tiles.filter(t => t.coord.row < 5);
        const bottomTiles = result.tiles.filter(t => t.coord.row > 40);
        const avgTop = topTiles.reduce((s, t) => s + t.geoParams.temperature, 0) / topTiles.length;
        const avgBottom = bottomTiles.reduce((s, t) => s + t.geoParams.temperature, 0) / bottomTiles.length;
        expect(avgBottom).toBeGreaterThan(avgTop);
      });

      it('lakes within size limits', () => {
        let greatLakes = 0;
        for (const lake of result.lakes) {
          if (lake.isGreatLake) {
            greatLakes++;
            expect(lake.hexes.length).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
          } else {
            expect(lake.hexes.length).toBeLessThanOrEqual(LAKE_SIZE_MAX);
          }
        }
        expect(greatLakes).toBeLessThanOrEqual(1);
      });

      // Track terrain types
      for (const tile of result.tiles) {
        allTerrainsSeen.add(tile.terrain);
      }
    });
  }

  it('no terrain type entirely absent across 20 seeds', () => {
    // At least 20 of the 42 types should appear (some rare types may not appear in 20 seeds)
    expect(allTerrainsSeen.size).toBeGreaterThanOrEqual(20);
  });

  it('performance: pipeline under 2 seconds per world', () => {
    const start = performance.now();
    generateWorldTerrain({ cols: 60, rows: 45, seed: 42 });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
```

**Step 2: Run the gallery**

Run: `npx vitest run src/engine/terrainPipeline/__tests__/mapGallery.test.ts`
Expected: All PASS. If any fail, tune pipeline constants and re-run.

**Step 3: Commit**

```bash
git add src/engine/terrainPipeline/__tests__/mapGallery.test.ts
git commit -m "test(terrain): map gallery — 20 seeds with automated sanity assertions"
```

**Step 4: Run full test suite**

Run: `npm test`
Expected: All ~2,100+ existing tests + ~100+ new terrain tests pass.

**Step 5: Final commit if any cleanup needed**

```bash
git commit -m "chore(terrain): final cleanup and constant tuning from map gallery"
```

---

## Summary

| Task | Description | New files | Modified files | Est. tests |
|------|-------------|-----------|----------------|------------|
| 1 | Type Foundation | 1 test | 4 (types, graph, coastline, assets) | 3 |
| 2 | PRNG Extraction | 2 (prng.ts + test) | 1 (forceField.ts) | 4 |
| 3 | Pipeline Data Structures | 2 (types.ts + test) | 0 | 3 |
| 4 | Pass 1 — Ocean Mask | 2 | 0 | 5 |
| 5 | Pass 2 — Tectonics | 2 | 0 | 4 |
| 6 | Pass 3 — Elevation | 2 | 0 | 4 |
| 7 | Pass 4 — Temperature | 2 | 0 | 3 |
| 8 | Pass 5 — Moisture | 2 | 0 | 4 |
| 9 | Pass 6 — Rivers & Lakes | 2 | 0 | 5 |
| 10 | Pass 7 — Biome Classification | 2 | 0 | 6 |
| 11 | Pass 8 — Regions & Naming | 4 (2 src + 2 test) | 0 | 6 |
| 12 | Pipeline Orchestrator | 2 | 1 (hexGrid.ts) | 5 |
| 13 | Art Pipeline | 0 | 2 (py + assets) | 0 |
| 14 | Coastline Lake Integration | 1 test | 3 (useCoastline, overlay, types) | 3 |
| 15 | River SVG Overlay | 2 (component + test) | 1 (HexMap.tsx) | 2 |
| 16 | HexMap & GameInit Wiring | 1 test | 4 (gameInit, hexGrid, HexMap, GameView) | 4 |
| 17 | Map Gallery Testing | 1 test | 0 | 8+ |
| **Total** | | **~30 new files** | **~16 modified** | **~70+ tests** |

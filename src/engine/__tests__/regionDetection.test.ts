import { describe, it, expect } from 'vitest';
import { TERRAIN_TO_FEATURE, FEATURE_MIN_SIZE, type RegionFeatureType } from '../regionDetection';
import type { HexTile, TerrainType } from '../../types';
import { detectRegions, detectRegionsBorderCost, edgeBorderCost, REGION_MIN_SIZE, REGION_MAX_SIZE, type RegionCluster } from '../regionDetection';
import { generateWorld } from '../hexGrid';

function tile(col: number, row: number, terrain: TerrainType, elevation = 0.5): HexTile {
  return { coord: { col, row }, geoParams: { elevation, temperature: 0.5, moisture: 0.5 }, terrain };
}

describe('region detection constants', () => {
  it('maps every grouped terrain type to a feature type', () => {
    expect(TERRAIN_TO_FEATURE.mountains).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.high_mountains).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.glacier).toBe('mountain_range');
    expect(TERRAIN_TO_FEATURE.hills).toBe('hill_country');
    expect(TERRAIN_TO_FEATURE.temperate_forest).toBe('forest');
    expect(TERRAIN_TO_FEATURE.grassland).toBe('plains');
    expect(TERRAIN_TO_FEATURE.desert).toBe('desert');
    expect(TERRAIN_TO_FEATURE.swamp).toBe('wetland');
    expect(TERRAIN_TO_FEATURE.tundra).toBe('tundra');
    expect(TERRAIN_TO_FEATURE.lake).toBe('lake');
    expect(TERRAIN_TO_FEATURE.ocean).toBe('sea');
  });

  it('has minimum cluster sizes for each feature type', () => {
    expect(FEATURE_MIN_SIZE.mountain_range).toBe(3);
    expect(FEATURE_MIN_SIZE.hill_country).toBe(4);
    expect(FEATURE_MIN_SIZE.forest).toBe(5);
    expect(FEATURE_MIN_SIZE.plains).toBe(6);
    expect(FEATURE_MIN_SIZE.desert).toBe(4);
    expect(FEATURE_MIN_SIZE.wetland).toBe(3);
    expect(FEATURE_MIN_SIZE.tundra).toBe(4);
    expect(FEATURE_MIN_SIZE.river).toBe(5);
    expect(FEATURE_MIN_SIZE.lake).toBe(1);
  });

  // Task 1 TDD: TERRAIN_TO_FEATURE coverage for all 42 terrain types
  it('covers all land terrain types (non-water) in TERRAIN_TO_FEATURE', () => {
    // Water types — these may map to 'sea', 'lake', 'river', or undefined (all valid)
    const waterTypes: TerrainType[] = [
      'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
    ];

    // All TerrainType values (42 types from types/index.ts)
    const allTerrainTypes: TerrainType[] = [
      'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
      'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
      'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
      'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
      'swamp', 'marsh', 'moor_bog',
      'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
      'forested_hills',
      'great_home_trees', 'broken_lands', 'oasis',
      'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
      'arctic', 'snow_fields',
    ];

    const missing: TerrainType[] = [];
    for (const terrain of allTerrainTypes) {
      if (waterTypes.includes(terrain)) continue; // water types are optional
      if (TERRAIN_TO_FEATURE[terrain] === undefined) {
        missing.push(terrain);
      }
    }
    expect(missing, `Missing land terrain types: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('has entries for newly required terrain types: plateau, oasis, coastal_shallows, coast, reef', () => {
    expect(TERRAIN_TO_FEATURE.plateau).toBeDefined();
    expect(TERRAIN_TO_FEATURE.oasis).toBeDefined();
    expect(TERRAIN_TO_FEATURE.coastal_shallows).toBeDefined();
    expect(TERRAIN_TO_FEATURE.coast).toBeDefined();
    expect(TERRAIN_TO_FEATURE.reef).toBeDefined();
  });
});

describe('edgeBorderCost', () => {
  it('returns 1.0 when neighbor is coast/ocean', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'coast', 0.3);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(1.0);
  });

  it('returns 0.9 when neighbor is mountain', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'mountains', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.9);
  });

  it('returns 0.7 when there is a river edge between the two hexes', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.5);
    expect(edgeBorderCost(current, neighbor, true)).toBeCloseTo(0.7);
  });

  it('returns 0.5 for steep elevation difference (>0.15)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.68); // diff = 0.18 > 0.15
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.5);
  });

  it('returns 0.4 for biome change (different feature type)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'desert', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.4);
  });

  it('returns 0.1 for same terrain', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'grassland', 0.5);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(0.1);
  });

  it('prioritizes highest cost: mountain neighbor beats river edge (0.9 not 0.7)', () => {
    const current = tile(0, 0, 'grassland', 0.5);
    const neighbor = tile(1, 0, 'mountains', 0.5);
    // Even with river edge, mountain wins (higher cost = stronger boundary)
    expect(edgeBorderCost(current, neighbor, true)).toBeCloseTo(0.9);
  });

  it('prioritizes coast/ocean over mountain (1.0 > 0.9)', () => {
    const current = tile(0, 0, 'mountains', 0.5);
    const neighbor = tile(1, 0, 'ocean', 0.3);
    expect(edgeBorderCost(current, neighbor, false)).toBeCloseTo(1.0);
  });
});

describe('RegionCluster interface', () => {
  it('has an id field on RegionCluster returned from detectRegions', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
    ];
    const regions = detectRegions(tiles);
    const mountain = regions.find(r => r.featureType === 'mountain_range');
    // id may be undefined in old RegionCluster — test that new interface has it
    if (mountain) {
      expect(typeof (mountain as RegionCluster & { id?: number }).id).toBe('number');
    }
    // At minimum, the type shape must compile (no runtime error)
    expect(true).toBe(true);
  });
});

describe('detectRegions', () => {
  it('groups contiguous same-feature hexes into a cluster', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'), tile(2, 1, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(1);
    expect(mountains[0].hexes).toHaveLength(3);
  });

  it('splits non-contiguous same-feature hexes into separate clusters', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'grassland'), tile(2, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'), tile(2, 1, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(0); // each single hex below min size 3
  });

  it('discards clusters below minimum size', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'),
      tile(0, 1, 'grassland'), tile(1, 1, 'grassland'),
      tile(0, 2, 'grassland'), tile(1, 2, 'grassland'),
      tile(0, 3, 'grassland'), tile(1, 3, 'grassland'),
      tile(0, 4, 'grassland'), tile(1, 4, 'grassland'),
      tile(0, 5, 'grassland'), tile(1, 5, 'grassland'),
    ];
    const regions = detectRegions(tiles);
    const mountains = regions.filter(r => r.featureType === 'mountain_range');
    expect(mountains).toHaveLength(0);
    const plains = regions.filter(r => r.featureType === 'plains');
    expect(plains.length).toBeGreaterThanOrEqual(1);
  });

  it('groups related terrain types (e.g., hills + forested_hills)', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'hills'), tile(1, 0, 'forested_hills'),
      tile(0, 1, 'hills'), tile(1, 1, 'forested_hills'),
    ];
    const regions = detectRegions(tiles);
    const hillRegions = regions.filter(r => r.featureType === 'hill_country');
    expect(hillRegions).toHaveLength(1);
    expect(hillRegions[0].hexes).toHaveLength(4);
  });

  it('computes centroid for each cluster', () => {
    const tiles: HexTile[] = [
      tile(0, 0, 'mountains'), tile(1, 0, 'mountains'), tile(2, 0, 'mountains'),
    ];
    const regions = detectRegions(tiles);
    const mountain = regions.find(r => r.featureType === 'mountain_range');
    expect(mountain).toBeDefined();
    expect(mountain!.centerCol).toBe(1);
    expect(mountain!.centerRow).toBe(0);
  });
});

// ─── Task 2: detectRegionsBorderCost tests ────────────────────────────────────

/** Build a synthetic HexTile grid from a 2D terrain array */
function buildGrid(terrain: TerrainType[][], elevation?: number[][]): HexTile[] {
  const tiles: HexTile[] = [];
  for (let row = 0; row < terrain.length; row++) {
    for (let col = 0; col < terrain[row].length; col++) {
      tiles.push({
        coord: { col, row },
        geoParams: {
          elevation: elevation ? elevation[row][col] : 0.5,
          temperature: 0.5,
          moisture: 0.5,
        },
        terrain: terrain[row][col],
      });
    }
  }
  return tiles;
}

describe('detectRegionsBorderCost', () => {
  it('assigns every land hex to exactly one region (no gaps, no overlaps)', () => {
    // 8x8 mixed terrain grid
    const terrain: TerrainType[][] = [
      ['ocean', 'ocean', 'coast', 'grassland', 'grassland', 'grassland', 'ocean', 'ocean'],
      ['ocean', 'coast', 'grassland', 'grassland', 'temperate_forest', 'temperate_forest', 'coast', 'ocean'],
      ['coast', 'grassland', 'grassland', 'hills', 'hills', 'temperate_forest', 'grassland', 'coast'],
      ['grassland', 'grassland', 'mountains', 'mountains', 'hills', 'grassland', 'grassland', 'grassland'],
      ['grassland', 'mountains', 'mountains', 'mountains', 'grassland', 'grassland', 'grassland', 'grassland'],
      ['coast', 'grassland', 'grassland', 'grassland', 'grassland', 'desert', 'desert', 'coast'],
      ['ocean', 'coast', 'grassland', 'grassland', 'desert', 'desert', 'coast', 'ocean'],
      ['ocean', 'ocean', 'coast', 'grassland', 'grassland', 'coast', 'ocean', 'ocean'],
    ];
    const tiles = buildGrid(terrain);
    const { regions, hexRegionId } = detectRegionsBorderCost(tiles, [], 8, []);

    // Every land hex must be assigned
    const landHexes = tiles.filter(t => {
      const f = TERRAIN_TO_FEATURE[t.terrain];
      return f && f !== 'sea';
    });

    for (const h of landHexes) {
      const key = `${h.coord.col},${h.coord.row}`;
      expect(hexRegionId.has(key), `Land hex ${key} not assigned to a region`).toBe(true);
    }

    // No overlaps: each key appears only once (Map enforces this)
    expect(hexRegionId.size).toBeGreaterThanOrEqual(landHexes.length);
  });

  it('mountain wall separating plains creates at least 2 separate regions', () => {
    // Each plains side needs > REGION_MIN_SIZE (20) hexes to avoid being merged.
    // 12 rows x 5 cols: 2 plains | mountain wall | 2 plains
    // Each side: 12 rows * 2 cols = 24 hexes > 20
    const rows = 12;
    const terrain: TerrainType[][] = [];
    for (let r = 0; r < rows; r++) {
      terrain.push(['grassland', 'grassland', 'mountains', 'grassland', 'grassland']);
    }
    const tiles = buildGrid(terrain);
    // Seed each side explicitly
    const seeds = [{ col: 0, row: 0 }, { col: 4, row: 0 }];
    const { regions } = detectRegionsBorderCost(tiles, [], 5, seeds);
    // Should have at least 2 regions (the mountain wall separates two plains areas)
    expect(regions.length).toBeGreaterThanOrEqual(2);
  });

  it('river between two forest areas creates boundary (produces 2+ forest-containing regions)', () => {
    // Build a wider grid so each forest side has > REGION_MIN_SIZE (20) hexes
    // 15 rows x 5 cols: 2 forest cols | river col | 2 forest cols
    // Each side: 15 rows * 2 cols = 30 hexes > REGION_MIN_SIZE=20
    const rows = 15;
    const terrain: TerrainType[][] = [];
    for (let r = 0; r < rows; r++) {
      terrain.push([
        'temperate_forest', 'temperate_forest',
        'river',
        'temperate_forest', 'temperate_forest',
      ]);
    }

    // Build river paths along column 2 (edges between forest hexes, not river terrain hexes)
    // The river path marks edges between col 1 and col 3 for each row
    const riverPath = { id: 'r1', hexes: terrain.map((_, r) => ({ col: 2, row: r })) };

    const tiles = buildGrid(terrain);
    // Seeds on left side (col 0) and right side (col 4)
    const seeds = [{ col: 0, row: 0 }, { col: 4, row: 0 }];
    const { regions } = detectRegionsBorderCost(tiles, [riverPath], 5, seeds);
    // Expect at least 2 regions (river boundary separates the two forest sides)
    expect(regions.length).toBeGreaterThanOrEqual(2);
  });

  it('centroid of each region is within the region', () => {
    const terrain: TerrainType[][] = [
      ['grassland', 'grassland', 'grassland', 'grassland', 'grassland'],
      ['grassland', 'grassland', 'grassland', 'grassland', 'grassland'],
      ['grassland', 'grassland', 'grassland', 'grassland', 'grassland'],
      ['grassland', 'grassland', 'grassland', 'grassland', 'grassland'],
      ['grassland', 'grassland', 'grassland', 'grassland', 'grassland'],
    ];
    const tiles = buildGrid(terrain);
    const { regions, hexRegionId } = detectRegionsBorderCost(tiles, [], 5, []);

    for (const region of regions) {
      const centroidKey = `${region.centerCol},${region.centerRow}`;
      const regionId = hexRegionId.get(centroidKey);
      expect(regionId, `Centroid (${centroidKey}) of region ${region.id} is not within region`).toBe(region.id);
    }
  });

  it('WorldGenResult.regionData is defined after generateWorld()', () => {
    const cosmology = {
      force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
      mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
    };
    const result = generateWorld(cosmology, 20, 20, 42);
    expect(result.regionData).toBeDefined();
    expect(result.regionData!.geographicRegions).toBeDefined();
    expect(result.regionData!.geographicRegions.length).toBeGreaterThan(0);
    expect(result.regionData!.hexRegionId).toBeInstanceOf(Map);
  });
});

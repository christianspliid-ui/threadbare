/**
 * The Area partition is total (THR-1155).
 *
 * An Area is a game object a hex belongs to: an effect scoped `'region'` resolves
 * through `tile.regionId`, so does the `$area` sentinel and the chronicle's region
 * line. A land hex with no Area is therefore a hole in the world, not a cosmetic gap
 * in a border layer — which is what it was while a region was only something the map
 * drew.
 *
 * These assert on **generated** worlds, never a fixture, because the hole this closes
 * was a property of real terrain: islands the watershed could not reach from any
 * province capital. A hand-built grid would not have had one, so a fixture could only
 * have verified the guard against itself. The controlled arm below builds exactly such
 * an island on purpose, and confirms the *detector* — not the assertion — is what
 * closes it.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateWorld } from '../hexGrid';
import { seedWorld } from '../worldSeed';
import { MAP_SIZE_PRESETS, type MapSizePreset } from '../gameInit';
import { detectRegionsBorderCost, TERRAIN_TO_FEATURE } from '../regionDetection';
import { createBalancedCosmology } from '../cosmology';
import { enableTracing, clearTraces, getTraces, disableTracing } from '../traceBuffer';
import { hexKeyFromCoord } from '../../lib/hexKey';
import type { AreaCoverageTrace } from '../../types/trace';
import type { HexTile, TerrainType } from '../../types';

const SEEDS = [42, 99, 7];
const SIZES: MapSizePreset[] = ['small', 'medium', 'large', 'epic'];

function coverageTrace(): AreaCoverageTrace {
  const traces = getTraces().filter(t => t.category === 'area_coverage');
  expect(traces).toHaveLength(1);
  return traces[0] as AreaCoverageTrace;
}

describe('Area coverage — every land hex belongs to exactly one Area', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  for (const seed of SEEDS) {
    for (const size of SIZES) {
      it(`stamps every land hex on seed ${seed}, ${size}`, () => {
        const { cols, rows } = MAP_SIZE_PRESETS[size];
        const world = generateWorld(createBalancedCosmology(), cols, rows, seed);
        const { graph } = seedWorld(
          createBalancedCosmology(), world.tiles, seed, undefined, undefined,
          undefined, world.provinceIds, world.provinces, world.provinceRoles,
          world.regionData?.geographicRegions,
        );

        const trace = coverageTrace();

        // Non-vacuous: a world with no land, or no Areas, would satisfy
        // `unstamped === 0` while proving nothing.
        expect(trace.hexes).toBeGreaterThan(cols * rows * 0.5);
        expect(trace.areas).toBeGreaterThan(0);
        expect(trace.unstamped).toBe(0);

        // The trace reports what the tiles carry — verify against the tiles
        // themselves, so a miscounted trace cannot launder a real hole.
        const landWithoutArea = world.tiles.filter(t => {
          const feature = TERRAIN_TO_FEATURE[t.terrain];
          return feature !== undefined && feature !== 'sea' && !t.regionId;
        });
        expect(landWithoutArea.map(t => `${t.coord.col},${t.coord.row}`)).toEqual([]);

        // Every stamp names an Area that exists as a node, and every Area node was
        // minted from the same partition the map reads.
        const areaNodeIds = new Set(graph.getNodesByType('region').map(n => n.id));
        expect(areaNodeIds.size).toBe(trace.areas);
        for (const tile of world.tiles) {
          if (!tile.regionId) continue;
          expect(areaNodeIds.has(tile.regionId)).toBe(true);
        }

        // **Exactly** one, not at least one. The clusters partition the land, so their
        // hex lists are disjoint and sum to the land count. Before THR-1155 fixed the
        // split pass this failed by up to 1735 hexes on an epic world — a hex listed in
        // two clusters gave two Areas an inflated `hexCount` and one of them a stamp it
        // did not own, which a coverage-only assertion cannot see.
        const membership = new Map<string, number>();
        for (const cluster of world.regionData!.geographicRegions) {
          for (const hex of cluster.hexes) {
            const key = `${hex.col},${hex.row}`;
            membership.set(key, (membership.get(key) ?? 0) + 1);
          }
        }
        expect([...membership.entries()].filter(([, n]) => n > 1)).toEqual([]);
        expect(membership.size).toBe(trace.hexes);

        // The node's own `hexCount` is that same number, so an Area cannot claim a size
        // the partition does not give it.
        const totalNodeHexes = graph.getNodesByType('region')
          .reduce((sum, n) => sum + (n.properties.hexCount as number), 0);
        expect(totalNodeHexes).toBe(trace.hexes);
      }, 120_000);
    }
  }

  it('the graph Areas are the map Areas — same partition, not a join', () => {
    const world = generateWorld(createBalancedCosmology(), 32, 24, 42);
    seedWorld(
      createBalancedCosmology(), world.tiles, 42, undefined, undefined,
      undefined, world.provinceIds, world.provinces, world.provinceRoles,
      world.regionData?.geographicRegions,
    );

    const clusters = world.regionData!.geographicRegions;
    expect(clusters.length).toBeGreaterThan(0);

    // Each detected cluster's hexes carry that cluster's node id — the property the
    // deleted index join could not guarantee, because it reconciled two different
    // partitions by list position.
    for (const cluster of clusters) {
      for (const hex of cluster.hexes) {
        const tile = world.tiles.find(t => t.coord.col === hex.col && t.coord.row === hex.row);
        expect(tile?.regionId).toBe(`region_${cluster.id}`);
      }
    }
  }, 120_000);
});

describe('nearest-cluster fill — the controlled arm', () => {
  /**
   * A mainland the watershed seeds into, and an island separated from it by open
   * ocean. Dijkstra never crosses the water, so before the fill the island came back
   * with no region at all — the shape measured on real worlds (0–24 orphan hexes).
   */
  function islandGrid(): HexTile[] {
    const tiles: HexTile[] = [];
    const put = (col: number, row: number, terrain: TerrainType) => {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain,
      });
    };
    for (let col = 0; col < 14; col++) {
      for (let row = 0; row < 6; row++) {
        // Mainland on the left, ocean channel in the middle, island on the right.
        if (col <= 5) put(col, row, 'grassland');
        else if (col <= 10) put(col, row, 'ocean');
        else put(col, row, 'grassland');
      }
    }
    return tiles;
  }

  it('leaves no land hex unassigned, and the island joins the nearest cluster', () => {
    const tiles = islandGrid();
    const { regions, hexRegionId } = detectRegionsBorderCost(
      tiles, [], 14, [{ col: 1, row: 2 }],
    );

    const land = tiles.filter(t => {
      const f = TERRAIN_TO_FEATURE[t.terrain];
      return f !== undefined && f !== 'sea';
    });
    expect(land.length).toBe(36 + 18); // 6x6 mainland + 3x6 island — non-vacuous

    for (const t of land) {
      expect(hexRegionId.get(hexKeyFromCoord(t.coord))).toBeDefined();
    }

    // The arm bites: the single seed is on the mainland, so the island is reachable
    // only through the fill. Its hexes land in a real cluster whose hex list contains
    // them — a stamp pointing at a cluster that does not list the hex would leave the
    // Area's hexCount wrong.
    const islandHex = { col: 12, row: 3 };
    const islandRegion = hexRegionId.get(hexKeyFromCoord(islandHex));
    expect(islandRegion).toBeDefined();
    const cluster = regions.find(r => r.id === islandRegion);
    expect(cluster).toBeDefined();
    expect(cluster!.hexes.some(h => h.col === islandHex.col && h.row === islandHex.row)).toBe(true);
  });

  it('is deterministic — the same grid fills the same way', () => {
    const a = detectRegionsBorderCost(islandGrid(), [], 14, [{ col: 1, row: 2 }]);
    const b = detectRegionsBorderCost(islandGrid(), [], 14, [{ col: 1, row: 2 }]);
    expect([...a.hexRegionId.entries()].sort()).toEqual([...b.hexRegionId.entries()].sort());
  });
});

describe('teardown', () => {
  it('leaves tracing off', () => {
    disableTracing();
    expect(true).toBe(true);
  });
});

import type { HexCoord, HexTile, TerrainType } from '../types';
import { hexNeighbors } from '../lib/hexMath';

/** Geographic feature categories for region clustering */
export type RegionFeatureType =
  | 'mountain_range' | 'hill_country' | 'forest' | 'plains'
  | 'desert' | 'wetland' | 'tundra' | 'river' | 'lake' | 'sea';

/** Maps terrain types to their primary geographic feature category. */
export const TERRAIN_TO_FEATURE: Partial<Record<TerrainType, RegionFeatureType>> = {
  mountains: 'mountain_range', high_mountains: 'mountain_range',
  glacier: 'mountain_range', volcano: 'mountain_range', mountain_pass: 'mountain_range',
  hills: 'hill_country', forested_hills: 'hill_country', moor_bog: 'hill_country',
  temperate_forest: 'forest', dense_forest: 'forest', boreal_forest: 'forest',
  jungle: 'forest', tropical_forest: 'forest', evergreen_forest: 'forest',
  light_forest: 'forest', dead_forest: 'forest', great_home_trees: 'forest',
  grassland: 'plains', savanna: 'plains', steppe: 'plains', farmland: 'plains',
  desert: 'desert', rocky_desert: 'desert', sand_dunes: 'desert',
  badlands: 'desert', broken_lands: 'desert',
  swamp: 'wetland', marsh: 'wetland', floodplain: 'wetland',
  tundra: 'tundra', arctic: 'tundra', snow_fields: 'tundra',
  lake: 'lake',
  ocean: 'sea', deep_ocean: 'sea', tropical_ocean: 'sea',
} as const;

/** Feature priority for overlap resolution (lower = higher priority) */
export const FEATURE_PRIORITY: Record<RegionFeatureType, number> = {
  mountain_range: 0, hill_country: 1, forest: 2, plains: 3,
  desert: 4, wetland: 5, tundra: 6, river: 7, lake: 8, sea: 9,
};

/** Minimum cluster size to qualify as a named region (NFP #1: Tunability) */
export const FEATURE_MIN_SIZE: Record<RegionFeatureType, number> = {
  mountain_range: 3, hill_country: 4, forest: 5, plains: 6,
  desert: 4, wetland: 3, tundra: 4, river: 5, lake: 1, sea: 999,
};

/** A detected region cluster before it becomes a graph node */
export interface RegionCluster {
  featureType: RegionFeatureType;
  hexes: HexCoord[];
  centerCol: number;
  centerRow: number;
}

/**
 * Detect geographic regions by flood-filling contiguous hexes of related terrain types.
 * Clusters below FEATURE_MIN_SIZE are discarded.
 * Sea/ocean clusters are always discarded (not named).
 */
export function detectRegions(tiles: HexTile[]): RegionCluster[] {
  // Build lookup: "col,row" → HexTile
  const tileMap = new Map<string, HexTile>();
  for (const t of tiles) {
    tileMap.set(`${t.coord.col},${t.coord.row}`, t);
  }

  const visited = new Set<string>();
  const clusters: RegionCluster[] = [];

  for (const t of tiles) {
    const key = `${t.coord.col},${t.coord.row}`;
    if (visited.has(key)) continue;

    const feature = TERRAIN_TO_FEATURE[t.terrain];
    if (!feature) { visited.add(key); continue; }

    // Flood-fill
    const queue: HexCoord[] = [t.coord];
    const clusterHexes: HexCoord[] = [];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      clusterHexes.push(current);

      for (const neighbor of hexNeighbors(current)) {
        const nKey = `${neighbor.col},${neighbor.row}`;
        if (visited.has(nKey)) continue;
        const nTile = tileMap.get(nKey);
        if (!nTile) continue;
        const nFeature = TERRAIN_TO_FEATURE[nTile.terrain];
        if (nFeature !== feature) continue;
        visited.add(nKey);
        queue.push(neighbor);
      }
    }

    // Discard sea clusters and undersized clusters
    if (feature === 'sea') continue;
    if (clusterHexes.length < FEATURE_MIN_SIZE[feature]) continue;

    // Compute centroid
    const sumCol = clusterHexes.reduce((s, h) => s + h.col, 0);
    const sumRow = clusterHexes.reduce((s, h) => s + h.row, 0);
    const centerCol = Math.round(sumCol / clusterHexes.length);
    const centerRow = Math.round(sumRow / clusterHexes.length);

    clusters.push({ featureType: feature, hexes: clusterHexes, centerCol, centerRow });
  }

  return clusters;
}

import type { HexCoord, HexTile, TerrainType } from '../types';
import { hexNeighbors, hexDistance } from '../lib/hexMath';
import { hexKeyFromCoord } from '../lib/hexKey';

/** Geographic feature categories for region clustering */
export type RegionFeatureType =
  | 'mountain_range' | 'hill_country' | 'forest' | 'plains'
  | 'desert' | 'wetland' | 'tundra' | 'river' | 'lake' | 'sea';

/**
 * Maps terrain types to their primary geographic feature category.
 * Covers all 42 TerrainType values from src/types/index.ts.
 * Water types (ocean, deep_ocean, tropical_ocean) map to 'sea'.
 * coast/coastal_shallows/reef map to 'sea' (transition zones).
 *
 * NFP #1 Tunability: Edit this table to change how terrain types group into regions.
 */
export const TERRAIN_TO_FEATURE: Partial<Record<TerrainType, RegionFeatureType>> = {
  // Water
  ocean: 'sea', deep_ocean: 'sea', tropical_ocean: 'sea',
  coastal_shallows: 'sea', coast: 'sea', reef: 'sea',
  lake: 'lake',
  river: 'river',
  // Elevated
  mountains: 'mountain_range', high_mountains: 'mountain_range',
  glacier: 'mountain_range', volcano: 'mountain_range', mountain_pass: 'mountain_range',
  plateau: 'hill_country',
  hills: 'hill_country', forested_hills: 'hill_country', moor_bog: 'hill_country',
  // Forest
  temperate_forest: 'forest', dense_forest: 'forest', boreal_forest: 'forest',
  jungle: 'forest', tropical_forest: 'forest', evergreen_forest: 'forest',
  light_forest: 'forest', dead_forest: 'forest', great_home_trees: 'forest',
  // Lowlands / Plains
  grassland: 'plains', savanna: 'plains', steppe: 'plains', farmland: 'plains',
  floodplain: 'wetland',
  // Wet
  swamp: 'wetland', marsh: 'wetland',
  // Desert
  desert: 'desert', rocky_desert: 'desert', sand_dunes: 'desert',
  badlands: 'desert', broken_lands: 'desert', oasis: 'desert',
  // Tundra / Cold
  tundra: 'tundra', arctic: 'tundra', snow_fields: 'tundra',
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

// ─── Border Cost Constants (NFP #1: Tunability) ───────────────────────────────

/**
 * Edge costs for border-cost watershed detection.
 * Higher cost = stronger natural boundary = more likely to separate regions.
 */
export const BORDER_COSTS = {
  COAST: 1.0,           // coast/ocean neighbor — hardest boundary
  MOUNTAIN: 0.9,        // mountain terrain neighbor — very strong boundary
  RIVER: 0.7,           // river edge between hexes — strong boundary
  STEEP_ELEVATION: 0.5, // elevation diff > ELEVATION_THRESHOLD — moderate boundary
  BIOME_CHANGE: 0.4,    // different feature type — weak boundary
  SAME_TERRAIN: 0.1,    // same terrain — minimal barrier
  ELEVATION_THRESHOLD: 0.15, // minimum elevation difference for STEEP_ELEVATION cost
} as const;

// ─── Watershed Region Size Constants (NFP #1: Tunability) ────────────────────

/** Target geographic region size in hexes */
export const REGION_TARGET_SIZE = 120;
/** Minimum geographic region size — smaller regions get merged into neighbors */
export const REGION_MIN_SIZE = 20;
/** Maximum geographic region size — larger regions get split */
export const REGION_MAX_SIZE = 200;
/** Minimum size for a region to appear on map labels */
export const REGION_MAP_LABEL_MIN_SIZE = 30;

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** A detected region cluster before it becomes a graph node */
export interface RegionCluster {
  id: number;
  featureType: RegionFeatureType;
  hexes: HexCoord[];
  centerCol: number;
  centerRow: number;
}

// ─── Edge Border Cost ─────────────────────────────────────────────────────────

/**
 * Compute the border cost between two adjacent hexes.
 * Higher cost = stronger natural boundary.
 * Costs are mutually exclusive (highest applicable cost wins).
 *
 * NFP #1 Tunability: All costs defined in BORDER_COSTS above.
 * NFP #3 Determinism: Pure function, no randomness.
 *
 * @param current - The hex being expanded from
 * @param neighbor - The adjacent hex being evaluated
 * @param hasRiverEdge - True if a river path crosses this edge
 */
export function edgeBorderCost(
  current: HexTile,
  neighbor: HexTile,
  hasRiverEdge: boolean,
): number {
  const neighborFeature = TERRAIN_TO_FEATURE[neighbor.terrain];

  // Coast / ocean boundary — hardest barrier
  if (neighborFeature === 'sea') {
    return BORDER_COSTS.COAST;
  }

  // Mountain neighbor — very strong barrier
  if (neighborFeature === 'mountain_range') {
    return BORDER_COSTS.MOUNTAIN;
  }

  // River edge — strong barrier (flow lines separate regions)
  if (hasRiverEdge) {
    return BORDER_COSTS.RIVER;
  }

  // Steep elevation change — moderate barrier.
  //
  // NFP #4: a tile with no `geoParams` reads as elevation 0 rather than throwing. The
  // field is optional in practice — hand-built tiles across the test corpus omit it —
  // and this function only became reachable from them when THR-1155 made the watershed
  // the one detector. A missing elevation means "no steep barrier here"; the biome and
  // same-terrain rules below still separate the hexes.
  const currentElev = current.geoParams?.elevation ?? 0;
  const neighborElev = neighbor.geoParams?.elevation ?? 0;
  const elevDiff = Math.abs(currentElev - neighborElev);
  if (elevDiff > BORDER_COSTS.ELEVATION_THRESHOLD) {
    return BORDER_COSTS.STEEP_ELEVATION;
  }

  // Biome change (different feature type) — weak barrier
  const currentFeature = TERRAIN_TO_FEATURE[current.terrain];
  if (neighborFeature !== currentFeature) {
    return BORDER_COSTS.BIOME_CHANGE;
  }

  // Same terrain — minimal barrier
  return BORDER_COSTS.SAME_TERRAIN;
}

// ─── Simple Min-Heap ─────────────────────────────────────────────────────────

/** Entry in the priority queue for Dijkstra-style watershed flood fill */
interface HeapEntry {
  cost: number;
  hexKey: string;
  seedId: number;
}

class MinHeap {
  private heap: HeapEntry[] = [];

  get size(): number { return this.heap.length; }

  push(entry: HeapEntry): void {
    this.heap.push(entry);
    this.siftUp(this.heap.length - 1);
  }

  pop(): HeapEntry | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].cost <= this.heap[i].cost) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].cost < this.heap[smallest].cost) smallest = left;
      if (right < n && this.heap[right].cost < this.heap[smallest].cost) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ─── Border-Cost Watershed Detection ─────────────────────────────────────────

/**
 * Detect geographic regions using weighted border-cost watershed (Dijkstra flood fill).
 *
 * Algorithm:
 * 1. Seed regions from province capital hexes (one seed per capital).
 *    Fallback: place seeds every sqrt(REGION_TARGET_SIZE) hexes on land.
 * 2. Priority-queue flood fill from all seeds simultaneously.
 *    Each edge costs edgeBorderCost() — high cost = strong natural boundary.
 * 3. Merge regions below REGION_MIN_SIZE into lowest-cost neighbor.
 * 4. Split regions above REGION_MAX_SIZE.
 * 5. Fill orphan land hexes into the nearest cluster — the partition is total over
 *    land (THR-1155); every land hex belongs to exactly one region.
 * 6. Snap centroid to nearest in-region hex.
 *
 * NFP #1 Tunability: See BORDER_COSTS, REGION_TARGET_SIZE, REGION_MIN_SIZE, REGION_MAX_SIZE.
 * NFP #2 Inspectability: Returns hexRegionId map for per-hex traceability.
 * NFP #3 Determinism: Pure function — given same tiles + seeds, always same output.
 * NFP #4 Fail-soft: If no seeds, auto-places seeds; empty grid returns empty array.
 *
 * @param tiles - All hex tiles in the world
 * @param riverPaths - River paths for river-edge detection
 * @param cols - Grid width (for index calculation)
 * @param seedHexes - Province capital hexes to seed regions from (may be empty)
 * @returns Array of RegionCluster (geographic regions) plus hexRegionId map
 */
export function detectRegionsBorderCost(
  tiles: HexTile[],
  riverPaths: Array<{ hexes: HexCoord[] }>,
  cols: number,
  seedHexes: HexCoord[],
): { regions: RegionCluster[]; hexRegionId: Map<string, number> } {
  if (tiles.length === 0) {
    return { regions: [], hexRegionId: new Map() };
  }

  // Build tile map
  const tileMap = new Map<string, HexTile>();
  for (const t of tiles) {
    tileMap.set(hexKeyFromCoord(t.coord), t);
  }

  // Build river-edge set: "col1,row1-col2,row2" (canonical: smaller key first)
  const riverEdges = new Set<string>();
  for (const rp of riverPaths) {
    for (let i = 0; i < rp.hexes.length - 1; i++) {
      const a = rp.hexes[i];
      const b = rp.hexes[i + 1];
      const ka = hexKeyFromCoord(a);
      const kb = hexKeyFromCoord(b);
      const edgeKey = ka < kb ? `${ka}-${kb}` : `${kb}-${ka}`;
      riverEdges.add(edgeKey);
    }
  }

  // Identify land hexes
  const landHexes: HexTile[] = [];
  for (const t of tiles) {
    const feature = TERRAIN_TO_FEATURE[t.terrain];
    if (feature && feature !== 'sea') {
      landHexes.push(t);
    }
  }

  if (landHexes.length === 0) {
    return { regions: [], hexRegionId: new Map() };
  }

  // Determine seeds: use province capitals, or auto-place if none
  const effectiveSeeds: HexCoord[] = [];
  for (const s of seedHexes) {
    const key = hexKeyFromCoord(s);
    if (tileMap.has(key)) {
      const t = tileMap.get(key)!;
      const feature = TERRAIN_TO_FEATURE[t.terrain];
      if (feature && feature !== 'sea') {
        effectiveSeeds.push(s);
      }
    }
  }

  // Auto-place seeds if none provided
  if (effectiveSeeds.length === 0) {
    const step = Math.max(1, Math.round(Math.sqrt(REGION_TARGET_SIZE)));
    for (let i = 0; i < landHexes.length; i += step) {
      effectiveSeeds.push(landHexes[i].coord);
    }
  }

  // Dijkstra-style flood fill
  const hexRegionId = new Map<string, number>();
  const pq = new MinHeap();

  // Seed all regions simultaneously
  for (let seedId = 0; seedId < effectiveSeeds.length; seedId++) {
    const seed = effectiveSeeds[seedId];
    const key = hexKeyFromCoord(seed);
    if (!hexRegionId.has(key) && tileMap.has(key)) {
      hexRegionId.set(key, seedId);
      pq.push({ cost: 0, hexKey: key, seedId });
    }
  }

  while (pq.size > 0) {
    const entry = pq.pop()!;
    const { hexKey, seedId } = entry;

    // Parse hex coordinates from key
    const commaIdx = hexKey.indexOf(',');
    const col = parseInt(hexKey.slice(0, commaIdx), 10);
    const row = parseInt(hexKey.slice(commaIdx + 1), 10);
    const currentTile = tileMap.get(hexKey)!;

    for (const neighbor of hexNeighbors({ col, row })) {
      const nKey = hexKeyFromCoord(neighbor);
      if (hexRegionId.has(nKey)) continue;
      const nTile = tileMap.get(nKey);
      if (!nTile) continue;
      const nFeature = TERRAIN_TO_FEATURE[nTile.terrain];
      if (!nFeature || nFeature === 'sea') continue;

      // Check river edge
      const ka = entry.hexKey;
      const kb = nKey;
      const edgeKey = ka < kb ? `${ka}-${kb}` : `${kb}-${ka}`;
      const hasRiverEdge = riverEdges.has(edgeKey);

      const cost = entry.cost + edgeBorderCost(currentTile, nTile, hasRiverEdge);
      hexRegionId.set(nKey, seedId);
      pq.push({ cost, hexKey: nKey, seedId });
    }
  }

  // Build region hex lists
  const regionHexMap = new Map<number, HexCoord[]>();
  for (const [key, regionId] of hexRegionId) {
    if (!regionHexMap.has(regionId)) regionHexMap.set(regionId, []);
    const commaIdx = key.indexOf(',');
    regionHexMap.get(regionId)!.push({
      col: parseInt(key.slice(0, commaIdx), 10),
      row: parseInt(key.slice(commaIdx + 1), 10),
    });
  }

  // Build adjacency: which regions are adjacent to which (for merging)
  function getAdjacentRegions(regionId: number, hexes: HexCoord[]): Set<number> {
    const adjacent = new Set<number>();
    for (const hex of hexes) {
      for (const neighbor of hexNeighbors(hex)) {
        const nKey = hexKeyFromCoord(neighbor);
        const nRegionId = hexRegionId.get(nKey);
        if (nRegionId !== undefined && nRegionId !== regionId) {
          adjacent.add(nRegionId);
        }
      }
    }
    return adjacent;
  }

  // Merge small regions into their largest adjacent neighbor
  // Use union-find approach: track which seed IDs have been merged into which
  const mergeTarget = new Map<number, number>(); // regionId -> canonical regionId

  function canonicalize(id: number): number {
    while (mergeTarget.has(id)) id = mergeTarget.get(id)!;
    return id;
  }

  // Iteratively merge undersized regions
  let changed = true;
  while (changed) {
    changed = false;
    for (const [regionId, hexes] of regionHexMap) {
      const canonical = canonicalize(regionId);
      if (canonical !== regionId) continue; // already merged

      if (hexes.length >= REGION_MIN_SIZE) continue;

      // Find largest adjacent canonical region
      const adjacent = getAdjacentRegions(regionId, hexes);
      let bestNeighbor = -1;
      let bestSize = -1;
      for (const nid of adjacent) {
        const nCanonical = canonicalize(nid);
        if (nCanonical === regionId) continue;
        const nHexes = regionHexMap.get(nCanonical);
        if (nHexes && nHexes.length > bestSize) {
          bestSize = nHexes.length;
          bestNeighbor = nCanonical;
        }
      }

      if (bestNeighbor === -1) continue; // no adjacent region to merge into

      // Merge this region into bestNeighbor
      const targetHexes = regionHexMap.get(bestNeighbor)!;
      for (const hex of hexes) {
        targetHexes.push(hex);
        hexRegionId.set(hexKeyFromCoord(hex), bestNeighbor);
      }
      regionHexMap.delete(regionId);
      mergeTarget.set(regionId, bestNeighbor);
      changed = true;
      break; // restart iteration after each merge
    }
  }

  // Split oversized regions by BFS halving
  const finalRegions = new Map<number, HexCoord[]>(regionHexMap);
  let nextId = Math.max(...Array.from(finalRegions.keys())) + 1;

  for (const [regionId, hexes] of Array.from(finalRegions.entries())) {
    if (hexes.length <= REGION_MAX_SIZE) continue;

    // Split into chunks of REGION_TARGET_SIZE via BFS from first hex
    const hexSet = new Set(hexes.map(h => hexKeyFromCoord(h)));
    const remaining = [...hexes];
    finalRegions.delete(regionId);

    while (remaining.length > 0) {
      const chunkSize = Math.min(REGION_TARGET_SIZE, remaining.length);
      const chunk: HexCoord[] = [];
      const visited = new Set<string>();
      const queue: HexCoord[] = [remaining[0]];
      visited.add(hexKeyFromCoord(remaining[0]));

      while (queue.length > 0 && chunk.length < chunkSize) {
        const hex = queue.shift()!;
        chunk.push(hex);
        for (const neighbor of hexNeighbors(hex)) {
          const nKey = hexKeyFromCoord(neighbor);
          if (!visited.has(nKey) && hexSet.has(nKey)) {
            visited.add(nKey);
            queue.push(neighbor);
          }
        }
      }

      const chunkKeys = new Set(chunk.map(h => hexKeyFromCoord(h)));

      // Take this chunk's hexes out of the pool the *next* chunk's BFS may reach.
      // Without this, `hexSet` still held every hex of the original region, so a
      // later chunk's flood fill walked back over hexes an earlier chunk had already
      // claimed and listed them a second time (THR-1155). `remaining` was filtered,
      // but `hexSet` — the thing the BFS actually consults — was not. Measured on
      // `main` before the fix: 147 hexes in two clusters on a seed-42 medium world,
      // 1735 in two or three on an epic one, which inflated every split region's
      // `hexes.length` and so its label-size gate and its Area `hexCount`.
      for (const key of chunkKeys) hexSet.delete(key);

      const newId = remaining === hexes ? regionId : nextId++;
      finalRegions.set(newId, chunk);
      for (const h of chunk) {
        hexRegionId.set(hexKeyFromCoord(h), newId);
      }

      // Remove chunk from remaining
      const remainingAfter = remaining.filter(h => !chunkKeys.has(hexKeyFromCoord(h)));
      remaining.length = 0;
      remaining.push(...remainingAfter);
    }
  }

  // ── Nearest-cluster fill: the partition must be total (THR-1155) ────────────
  //
  // The watershed only reaches land connected to a seed, so an island carrying no
  // province capital came back with no region at all — measured 0–24 orphan land
  // hexes per world across seeds 42/99/7 at every map size. That was tolerable
  // while a region was a thing the map drew; it is not tolerable now that an Area
  // is a game object a hex belongs to, because an effect scoped to a region, an
  // `$area` sentinel and the chronicle's region line all resolve through
  // `tile.regionId`. A hex with no Area is a hole in the world.
  //
  // Each orphan joins the cluster holding the nearest hex by hex distance; ties
  // break on the lower cluster id, and orphans are visited in coordinate order, so
  // the fill is deterministic (NFP #3). Orphans do not become fill targets for one
  // another — every orphan measures against the watershed's own output — so an
  // island attaches as a unit rather than chaining away from the mainland.
  //
  // Cost is O(orphans × assigned land hexes). The orphan count is exactly what the
  // watershed could not reach, two orders of magnitude below the assigned count on
  // every measured world: a few tens of thousands of comparisons on an epic map.
  const assignedHexes: Array<{ hex: HexCoord; regionId: number }> = [];
  for (const [regionId, hexes] of finalRegions) {
    for (const hex of hexes) assignedHexes.push({ hex, regionId });
  }

  if (assignedHexes.length > 0) {
    const orphans = landHexes
      .filter(t => !hexRegionId.has(hexKeyFromCoord(t.coord)))
      .map(t => t.coord)
      .sort((a, b) => a.col - b.col || a.row - b.row);

    for (const orphan of orphans) {
      let bestRegionId = -1;
      let bestDist = Infinity;
      for (const candidate of assignedHexes) {
        const d = hexDistance(orphan, candidate.hex);
        if (d < bestDist || (d === bestDist && candidate.regionId < bestRegionId)) {
          bestDist = d;
          bestRegionId = candidate.regionId;
        }
      }
      finalRegions.get(bestRegionId)!.push(orphan);
      hexRegionId.set(hexKeyFromCoord(orphan), bestRegionId);
    }
  }

  // Build output RegionCluster array with snapped centroids
  const clusters: RegionCluster[] = [];
  let outputId = 0;

  for (const [, hexes] of finalRegions) {
    if (hexes.length === 0) continue;

    // Compute arithmetic centroid
    const sumCol = hexes.reduce((s, h) => s + h.col, 0);
    const sumRow = hexes.reduce((s, h) => s + h.row, 0);
    const rawCenterCol = sumCol / hexes.length;
    const rawCenterRow = sumRow / hexes.length;

    // Snap to nearest hex IN the region
    const hexInRegion = new Set(hexes.map(h => hexKeyFromCoord(h)));
    let bestHex = hexes[0];
    let bestDist = Infinity;
    for (const hex of hexes) {
      const d = (hex.col - rawCenterCol) ** 2 + (hex.row - rawCenterRow) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestHex = hex;
      }
    }

    // Determine dominant feature type for this region
    const featureCounts = new Map<RegionFeatureType, number>();
    for (const hex of hexes) {
      const hKey = hexKeyFromCoord(hex);
      const t = tileMap.get(hKey);
      if (!t) continue;
      const feature = TERRAIN_TO_FEATURE[t.terrain];
      if (!feature || feature === 'sea') continue;
      featureCounts.set(feature, (featureCounts.get(feature) ?? 0) + 1);
    }
    let dominantFeature: RegionFeatureType = 'plains';
    let maxCount = 0;
    for (const [f, count] of featureCounts) {
      if (count > maxCount) { maxCount = count; dominantFeature = f; }
    }

    // Update hexRegionId to use sequential output id
    for (const hex of hexes) {
      hexRegionId.set(hexKeyFromCoord(hex), outputId);
    }

    clusters.push({
      id: outputId,
      featureType: dominantFeature,
      hexes,
      centerCol: bestHex.col,
      centerRow: bestHex.row,
    });

    outputId++;
  }

  return { regions: clusters, hexRegionId };
}

// ─── Legacy Flood-Fill Detection — deleted (THR-1155) ─────────────────────────
//
// `detectRegions` flood-filled contiguous same-feature hexes into clusters and
// discarded anything under `FEATURE_MIN_SIZE`. It was the graph's Area source while
// `detectRegionsBorderCost` was the map's, which is how the world came to hold two
// different geographies: on a seed-42 medium world the flood-fill made 21 clusters
// and left 55 land hexes in none, the watershed made 16 and left 5, and `gameInit`
// joined the two by list position. One geography now, from the watershed; the
// flood-fill is deleted rather than deprecated, because a second detector nobody
// calls is the thing that grew back last time.
//
// `FEATURE_MIN_SIZE` outlives it — the label and naming layers still read it.

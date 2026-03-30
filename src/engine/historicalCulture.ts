/**
 * Historical Culture Generator — creates dead empire cultures at world-seed time.
 *
 * Uses the same composeCultureIdentity pipeline as living cultures, but
 * constrained by authored templates. Historical cultures don't participate
 * in the simulation but their identity data drives region naming, ruin
 * generation, artifact seeding, and prose enrichment.
 */

import type { CosmologyProfile, SphereName, TerrainType } from '../types';
import { SPHERE_NAMES } from '../types';
import type { WorldGraph } from './graph';
import { composeCultureIdentity, generateCultureName } from './cultureGenerator';
import { generateCultureFlag } from './cultureFlag';
import {
  HISTORICAL_CULTURE_TEMPLATES,
  HISTORICAL_CULTURE_COUNT,
  HISTORICAL_TERRITORY_COVERAGE,
  type HistoricalCultureTemplate,
} from '../data/historical-culture-content';
import { hexNeighbors } from '../lib/hexMath';
import { hexKeyFromCoord } from '../lib/hexKey';
import type { RegionCluster } from './regionDetection';

/** Pick a random element */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const FOUNDATION_IDS = ['chaos', 'order', 'light', 'darkness'] as const;

/**
 * Generate historical cultures and add them to the world graph.
 * Returns array of historical culture node IDs.
 */
export function generateHistoricalCultures(
  graph: WorldGraph,
  cosmology: CosmologyProfile,
  rng: () => number,
): string[] {
  const count = HISTORICAL_CULTURE_COUNT.min + Math.floor(
    rng() * (HISTORICAL_CULTURE_COUNT.max - HISTORICAL_CULTURE_COUNT.min + 1),
  );

  // Shuffle templates and pick `count` without replacement
  const shuffled = [...HISTORICAL_CULTURE_TEMPLATES].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, count);

  const ids: string[] = [];

  for (let i = 0; i < selected.length; i++) {
    const template = selected[i];
    const id = `hist_culture_${i}`;

    // Resolve foundation: use template bias or pick randomly
    const foundationId = template.foundationBias ?? pick(rng, FOUNDATION_IDS);

    // Resolve spheres: use template affinities or pick from cosmology weights
    let spheres: SphereName[];
    if (template.sphereAffinities && template.sphereAffinities.length > 0) {
      spheres = template.sphereAffinities.length > 2
        ? template.sphereAffinities.slice(0, 2)
        : template.sphereAffinities;
    } else {
      spheres = [pick(rng, [...SPHERE_NAMES])];
    }

    // Resolve biome: use template preference or pick a common one
    const biome: TerrainType = template.biomePreference ?? pick(rng, [
      'grassland', 'hills', 'temperate_forest', 'desert', 'mountains',
    ] as TerrainType[]);

    const identity = composeCultureIdentity(foundationId, spheres, biome);
    const name = generateCultureName(identity, rng);

    const flagSeed = Math.floor(rng() * 0xFFFFFFFF);
    const flagSvg = generateCultureFlag(identity, flagSeed);

    graph.addNode({
      id,
      type: 'actor',
      name,
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        cultureIdentity: identity,
        flagSvg,
        templateId: template.id,
        templateName: template.name,
        ruinDescriptors: template.ruinDescriptors,
        legacyFlavor: template.legacyFlavor,
      },
    });
    ids.push(id);
  }

  return ids;
}

/**
 * Assign historical culture territories via greedy round-robin expansion.
 * Each culture starts from a seed region and expands to adjacent unclaimed regions,
 * preferring biome-matching regions, until coverage target is met.
 *
 * Creates belongs_to edges from region nodes to culture nodes with cultureLayer: 'historical'.
 */
export function assignHistoricalTerritories(
  graph: WorldGraph,
  historicalCultureIds: string[],
  clusters: RegionCluster[],
  rng: () => number,
): void {
  if (historicalCultureIds.length === 0 || clusters.length === 0) return;

  const regionIds = clusters.map((_, i) => `region_${i}`);
  const targetClaimed = Math.ceil(regionIds.length * HISTORICAL_TERRITORY_COVERAGE);

  // Build region adjacency: two regions are adjacent if any of their hexes are neighbors
  const regionAdj = new Map<number, Set<number>>();
  const hexToRegionIdx = new Map<string, number>();
  for (let ri = 0; ri < clusters.length; ri++) {
    regionAdj.set(ri, new Set());
    for (const h of clusters[ri].hexes) {
      hexToRegionIdx.set(hexKeyFromCoord(h), ri);
    }
  }
  for (let ri = 0; ri < clusters.length; ri++) {
    for (const h of clusters[ri].hexes) {
      for (const n of hexNeighbors(h)) {
        const nri = hexToRegionIdx.get(hexKeyFromCoord(n));
        if (nri !== undefined && nri !== ri) {
          regionAdj.get(ri)!.add(nri);
        }
      }
    }
  }

  // Pick seed regions for each culture (spread evenly via horizontal sectors)
  const claimed = new Map<number, string>(); // regionIdx → cultureId
  const cultureTerritories = new Map<string, Set<number>>();
  for (const cId of historicalCultureIds) {
    cultureTerritories.set(cId, new Set());
  }

  const sortedByCol = clusters.map((c, i) => ({ idx: i, col: c.centerCol }))
    .sort((a, b) => a.col - b.col);
  const sectorSize = Math.max(1, Math.floor(sortedByCol.length / historicalCultureIds.length));

  for (let ci = 0; ci < historicalCultureIds.length; ci++) {
    const sectorStart = ci * sectorSize;
    const sectorEnd = ci === historicalCultureIds.length - 1
      ? sortedByCol.length
      : (ci + 1) * sectorSize;
    const candidates = sortedByCol.slice(sectorStart, sectorEnd);
    if (candidates.length === 0) continue;

    const picked = candidates[Math.floor(rng() * candidates.length)];
    const cId = historicalCultureIds[ci];
    claimed.set(picked.idx, cId);
    cultureTerritories.get(cId)!.add(picked.idx);
  }

  // Greedy round-robin expansion
  let claimedCount = claimed.size;
  let staleRounds = 0;

  while (claimedCount < targetClaimed && staleRounds < historicalCultureIds.length) {
    let anyExpanded = false;

    for (const cId of historicalCultureIds) {
      if (claimedCount >= targetClaimed) break;

      const territory = cultureTerritories.get(cId)!;
      const frontier: number[] = [];
      for (const ri of territory) {
        for (const adj of regionAdj.get(ri) ?? []) {
          if (!claimed.has(adj)) frontier.push(adj);
        }
      }

      if (frontier.length === 0) continue;

      const unique = [...new Set(frontier)];

      // Score: randomness (could add biome match bonus later)
      let bestIdx = unique[0];
      let bestScore = -1;
      for (const ri of unique) {
        const score = rng();
        if (score > bestScore) {
          bestScore = score;
          bestIdx = ri;
        }
      }

      claimed.set(bestIdx, cId);
      territory.add(bestIdx);
      claimedCount++;
      anyExpanded = true;
    }

    if (!anyExpanded) staleRounds++;
    else staleRounds = 0;
  }

  // Create belongs_to edges
  for (const [ri, cId] of claimed) {
    const regionId = regionIds[ri];
    graph.addEdge({
      id: `edge_hist_territory_${regionId}_${cId}`,
      source: regionId,
      target: cId,
      type: 'belongs_to',
      properties: { culturalStrength: 1.0, cultureLayer: 'historical' },
    });
  }
}

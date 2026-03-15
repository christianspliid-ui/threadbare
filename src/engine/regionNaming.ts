/**
 * Region Naming — generates culture-driven or wilderness names for geographic regions.
 *
 * Claimed regions (with a historical culture) get names built from the culture's
 * CULTURE_NAME_FRAGMENTS combined with geographic vocabulary.
 * Unclaimed regions get plain geographic names.
 */

import type { WorldGraph } from './graph';
import type { RegionFeatureType } from './regionDetection';
import type { CultureIdentity } from '../types/culture';
import { CULTURE_NAME_FRAGMENTS } from '../data/culture-content';
import {
  REGION_NAME_FRAGMENTS,
  CLAIMED_NAME_PATTERNS,
  UNCLAIMED_NAME_PATTERNS,
} from '../data/region-name-content';

/** Pick a random element */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Human-readable feature type label for patterns */
const FEATURE_LABELS: Record<RegionFeatureType, string> = {
  mountain_range: 'Mountains',
  hill_country: 'Hills',
  forest: 'Forest',
  plains: 'Plains',
  desert: 'Desert',
  wetland: 'Marshes',
  tundra: 'Wastes',
  river: 'River',
  lake: 'Lake',
  sea: 'Sea',
};

/**
 * Generate a name for a geographic region.
 *
 * @param featureType - The geographic feature category
 * @param historicalCultureId - The historical culture that claimed this region (undefined = wilderness)
 * @param graph - The world graph (to look up culture identity)
 * @param rng - Seeded PRNG
 * @param usedNames - Set of already-used names for collision avoidance
 * @returns A generated region name
 */
export function generateRegionName(
  featureType: RegionFeatureType,
  historicalCultureId: string | undefined,
  graph: WorldGraph,
  rng: () => number,
  usedNames: Set<string>,
): string {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const name = historicalCultureId
      ? generateClaimedName(featureType, historicalCultureId, graph, rng)
      : generateWildernessName(featureType, rng);

    if (!usedNames.has(name) || attempt === maxRetries) {
      return name;
    }
  }

  // Fallback — should not reach here
  return generateWildernessName(featureType, rng);
}

function generateClaimedName(
  featureType: RegionFeatureType,
  cultureId: string,
  graph: WorldGraph,
  rng: () => number,
): string {
  const cultureNode = graph.getNode(cultureId);
  const identity = cultureNode?.properties.cultureIdentity as CultureIdentity | undefined;

  // Get culture fragments
  const foundFrags = identity
    ? CULTURE_NAME_FRAGMENTS.foundation[identity.foundationBias] ?? []
    : [];
  const sphereFrags = identity?.veneratedSpheres[0]
    ? CULTURE_NAME_FRAGMENTS.sphere[identity.veneratedSpheres[0]] ?? []
    : [];
  const cultureAdjs = [...foundFrags];
  const cultureNouns = [...sphereFrags];

  // Fallback if culture has no fragments
  if (cultureAdjs.length === 0) cultureAdjs.push('Ancient', 'Forgotten', 'Lost');
  if (cultureNouns.length === 0) cultureNouns.push('Ruin', 'Echo', 'Shadow');

  const geoKey = featureType === 'sea' ? 'lake' : featureType;
  const geo = REGION_NAME_FRAGMENTS[geoKey as Exclude<RegionFeatureType, 'sea'>];

  const pattern = pick(rng, CLAIMED_NAME_PATTERNS);

  return pattern
    .replace('{culture_adj}', pick(rng, cultureAdjs))
    .replace('{culture_noun}', pick(rng, cultureNouns))
    .replace('{geo_noun}', pick(rng, geo.nouns))
    .replace('{geo_suffix}', pick(rng, geo.suffixes))
    .replace('{feature_type}', FEATURE_LABELS[featureType]);
}

function generateWildernessName(
  featureType: RegionFeatureType,
  rng: () => number,
): string {
  const geoKey = featureType === 'sea' ? 'lake' : featureType;
  const geo = REGION_NAME_FRAGMENTS[geoKey as Exclude<RegionFeatureType, 'sea'>];

  const pattern = pick(rng, UNCLAIMED_NAME_PATTERNS);

  return pattern
    .replace('{geo_adj}', pick(rng, geo.adjectives))
    .replace('{geo_noun}', pick(rng, geo.nouns))
    .replace('{feature_type}', FEATURE_LABELS[featureType]);
}

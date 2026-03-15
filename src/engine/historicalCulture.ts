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
  type HistoricalCultureTemplate,
} from '../data/historical-culture-content';

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

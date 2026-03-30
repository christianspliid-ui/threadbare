/**
 * Resource Seeding — populates location nodes with terrain-based resources.
 *
 * Called during seedWorld() after locations are placed.
 * Each location gets resources based on its terrain type,
 * with cosmology sphere biases adjusting quantities.
 */

import type { WorldGraph } from './graph';
import type { CosmologyProfile, SphereName } from '../types/index';
import type { ResourceInstance } from '../types/resource';
import { TERRAIN_RESOURCE_TABLE, RESOURCE_DEFINITIONS, COSMOLOGY_RESOURCE_BONUS } from '../data/resource-content';

/**
 * Seed resources onto all locations in the graph.
 *
 * For each location, looks up its terrain in TERRAIN_RESOURCE_TABLE
 * and creates ResourceInstance entries on the location node's properties.
 *
 * @param graph - The world graph (mutated in place)
 * @param locationIds - IDs of all location nodes
 * @param cosmology - Current cosmology profile for sphere bonuses
 * @param rng - Seeded PRNG function
 */
export function seedLocationResources(
  graph: WorldGraph,
  locationIds: readonly string[],
  cosmology: CosmologyProfile,
  rng: () => number,
): void {
  for (const locId of locationIds) {
    const node = graph.getNode(locId);
    if (!node) continue;

    const terrain = node.properties.terrain as string | undefined;
    if (!terrain) continue;

    const entries = TERRAIN_RESOURCE_TABLE[terrain];
    if (!entries || entries.length === 0) {
      // Terrain has no resources (desert, ocean, etc.) — store empty record
      graph.updateNode(locId, {
        properties: { resources: {} },
      });
      continue;
    }

    const resources: Record<string, ResourceInstance> = {};

    for (const entry of entries) {
      const def = RESOURCE_DEFINITIONS[entry.type];
      if (!def) continue;

      // Base quantity from terrain range
      let quantity = entry.min + Math.floor(rng() * (entry.max - entry.min + 1));

      // Cosmology bonus: sphere affinity boosts quantity
      const sphereBonus = computeCosmologyBonus(cosmology, def.sphereAffinities);
      quantity = Math.min(100, quantity + sphereBonus);

      resources[entry.type] = {
        quantity,
        renewable: def.renewable,
        renewalRate: def.renewalRate,
      };
    }

    graph.updateNode(locId, {
      properties: { resources },
    });
  }
}

/**
 * Compute cosmology-based bonus for a resource.
 *
 * Takes the average of the cosmology weights for the resource's sphere affinities,
 * then scales by COSMOLOGY_RESOURCE_BONUS. A balanced cosmology gives ~1/8 bonus;
 * a heavily biased one gives up to the full bonus for matching resources.
 */
function computeCosmologyBonus(
  cosmology: CosmologyProfile,
  affinities: readonly SphereName[],
): number {
  if (affinities.length === 0) return 0;
  let total = 0;
  for (const sphere of affinities) {
    total += cosmology[sphere] ?? 0;
  }
  const avg = total / affinities.length;
  // Cosmology weights sum to 1.0 across 8 spheres, so balanced avg = 0.125
  // Scale so that 0.125 → 0 bonus, 0.5 → full bonus
  const normalized = Math.max(0, (avg - 0.125) / (0.5 - 0.125));
  return Math.floor(normalized * COSMOLOGY_RESOURCE_BONUS);
}

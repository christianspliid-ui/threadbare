/**
 * SphereAffinity — Entity seeding and accessor functions.
 *
 * Provides functions to seed sphere affinity on all entity graph nodes
 * during game initialization. All entities are seeded before the first tick.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { GraphNode } from '../types/graph';
import {
  type SphereAffinity,
  createDefaultSphereAffinity,
  getTerrainSphereScores,
  ARCHETYPE_SPHERE_BONUS_PRIMARY,
  ARCHETYPE_SPHERE_BONUS_SECONDARY,
  LOCATION_HEX_INHERIT_RATIO,
  LOCATION_TYPE_BONUS,
  MAX_SPHERE_SCORE,
} from '../types/sphereAffinity';

// ─── Accessor ────────────────────────────────────────────────────

/**
 * Type-safe accessor for sphere affinity on any graph node.
 * Returns undefined if the node has no sphereAffinity property.
 */
export function getNodeSphereAffinity(node: GraphNode): SphereAffinity | undefined {
  return node.properties.sphereAffinity as SphereAffinity | undefined;
}

// ─── Hex Seeding ─────────────────────────────────────────────────

/**
 * Seed sphere affinity for a hex node from its terrain type.
 * Uses TERRAIN_SPHERE_TABLE lookup → getTerrainSphereScores for full coverage.
 * All non-specified spheres remain at 0.
 */
export function seedHexSphereAffinity(terrainType: string): SphereAffinity {
  const base = createDefaultSphereAffinity();
  const terrainScores = getTerrainSphereScores(terrainType);
  for (const [sphere, score] of Object.entries(terrainScores)) {
    base.scores[sphere as SphereName] = score as number;
  }
  return base;
}

// ─── Agent Seeding ────────────────────────────────────────────────

/**
 * Seed sphere affinity for an agent from their sphereAlignment (CosmologyProfile).
 * Primary sphere (highest weight) gets ARCHETYPE_SPHERE_BONUS_PRIMARY (+2).
 * Secondary sphere (second highest) gets ARCHETYPE_SPHERE_BONUS_SECONDARY (+1).
 * Scores are clamped to MAX_SPHERE_SCORE.
 *
 * If no sphereAlignment provided (e.g., faction with no cosmology), returns defaults.
 */
export function seedAgentSphereAffinity(
  sphereAlignment: Record<string, number> | undefined
): SphereAffinity {
  const base = createDefaultSphereAffinity();
  if (!sphereAlignment) return base;

  // Sort by weight descending, filter out zero-weight spheres
  const sorted = Object.entries(sphereAlignment)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    const primarySphere = sorted[0][0] as SphereName;
    base.scores[primarySphere] = Math.min(ARCHETYPE_SPHERE_BONUS_PRIMARY, MAX_SPHERE_SCORE);
  }
  if (sorted.length > 1) {
    const secondarySphere = sorted[1][0] as SphereName;
    base.scores[secondarySphere] = Math.min(ARCHETYPE_SPHERE_BONUS_SECONDARY, MAX_SPHERE_SCORE);
  }
  return base;
}

// ─── Location Seeding ─────────────────────────────────────────────

/**
 * Seed sphere affinity for a location node from:
 * 1. Its hex's sphere affinity (inherited at LOCATION_HEX_INHERIT_RATIO, floor)
 * 2. An optional thematic sphere bonus (e.g., Force for a forge, Spirit for a shrine)
 *
 * Scores are clamped to MAX_SPHERE_SCORE.
 */
export function seedLocationSphereAffinity(
  hexAffinity: SphereAffinity,
  locationThematicSphere?: SphereName
): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const sphere of SPHERE_NAMES) {
    base.scores[sphere] = Math.floor(hexAffinity.scores[sphere] * LOCATION_HEX_INHERIT_RATIO);
  }
  if (locationThematicSphere) {
    base.scores[locationThematicSphere] = Math.min(
      base.scores[locationThematicSphere] + LOCATION_TYPE_BONUS,
      MAX_SPHERE_SCORE
    );
  }
  return base;
}

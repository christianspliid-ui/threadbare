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

  LOCATION_TYPE_BONUS,
  LOCATION_SPHERE_TABLE,
  MAX_SPHERE_SCORE,
} from '../types/sphereAffinity';
import type { AxiologicalProfile, ValuePair } from '../types/agent';

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
 * 1. Its hex's sphere affinity (passed through directly)
 * 2. Location type bonus from LOCATION_SPHERE_TABLE (additive)
 *
 * Scores are clamped to MAX_SPHERE_SCORE.
 */
export function seedLocationSphereAffinity(
  hexAffinity: SphereAffinity,
  locationSubtype?: string
): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const sphere of SPHERE_NAMES) {
    base.scores[sphere] = hexAffinity.scores[sphere];
  }
  // Add location-type sphere bonus from table
  if (locationSubtype) {
    const typeScores = LOCATION_SPHERE_TABLE[locationSubtype];
    if (typeScores) {
      for (const [sphere, score] of Object.entries(typeScores)) {
        base.scores[sphere as SphereName] = Math.min(
          base.scores[sphere as SphereName] + (score as number),
          MAX_SPHERE_SCORE
        );
      }
    }
  }
  return base;
}

// ─── Agent Decision Sphere Influence ─────────────────────────────

/** Weight of sphere-derived axiological adjustment applied to agent's profile */
export const SPHERE_DECISION_WEIGHT = 0.15;

/** Describes a sphere's axiological influence: which pair and which direction */
export interface SphereAxiologicalMapping {
  /** The ValuePair to shift */
  pair: ValuePair;
  /** +1 = shift toward first pole (virtue); -1 = shift toward second pole (flaw) */
  direction: 1 | -1;
}

/**
 * Maps each sphere to its axiological influence direction.
 * Force → courage (valor) over prudence; Time → prudence over courage; etc.
 */
export const SPHERE_AXIOLOGICAL_MAP: Record<SphereName, SphereAxiologicalMapping> = {
  force:   { pair: 'courage_prudence',    direction: +1 as 1 },  // Bold, assertive
  matter:  { pair: 'loyalty_ambition',    direction: +1 as 1 },  // Order over freedom
  energy:  { pair: 'loyalty_ambition',    direction: -1 as -1 }, // Freedom over order
  life:    { pair: 'mercy_ruthlessness',  direction: +1 as 1 },  // Compassion, preservation
  mind:    { pair: 'honesty_cunning',     direction: +1 as 1 },  // Knowledge, transparency
  spirit:  { pair: 'honesty_cunning',     direction: -1 as -1 }, // Intuition, hidden truth
  time:    { pair: 'courage_prudence',    direction: -1 as -1 }, // Patient, measured
  entropy: { pair: 'mercy_ruthlessness',  direction: -1 as -1 }, // Ruthlessness, consumption
};

/**
 * Find the sphere with the highest score on an affinity object.
 * Returns null if all scores are zero (fail-soft).
 * Deterministic: iterates SPHERE_NAMES in order; first maximum wins.
 */
export function getDominantSphere(affinity: SphereAffinity): SphereName | null {
  let maxScore = 0;
  let dominant: SphereName | null = null;
  for (const sphere of SPHERE_NAMES) {
    if (affinity.scores[sphere] > maxScore) {
      maxScore = affinity.scores[sphere];
      dominant = sphere;
    }
  }
  return dominant;
}

/**
 * Apply a sphere-derived axiological shift to a profile.
 * Adds `direction * SPHERE_DECISION_WEIGHT` to the mapped pair, clamped to [-1, 1].
 * Returns a new profile object — does not mutate the input.
 */
export function applyAxiologicalShift(
  profile: AxiologicalProfile,
  mapping: SphereAxiologicalMapping,
): AxiologicalProfile {
  const current = profile[mapping.pair] ?? 0;
  const shifted = Math.max(-1, Math.min(1, current + mapping.direction * SPHERE_DECISION_WEIGHT));
  return { ...profile, [mapping.pair]: shifted };
}

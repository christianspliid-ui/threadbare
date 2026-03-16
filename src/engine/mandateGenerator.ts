/**
 * Mandate Generator — Sphere-weighted PRNG mandate selection.
 *
 * Uses seeded PRNG (mulberry32) to deterministically select a mandate template
 * based on weighted probabilities derived from ascendant sphere alignment.
 *
 * Weights:
 * - PRIMARY_WEIGHT = 3: template includes alignment.primary
 * - SECONDARY_WEIGHT = 2: template includes alignment.secondary
 * - BASE_WEIGHT = 1: no match (all templates are eligible)
 * - SIMULATION_ACHIEVABLE_MULTIPLIER = 2: simulation_achievable type gets 2x boost
 *
 * Selection uses weighted random based on these scores.
 */

import type { CosmologyProfile, SphereName } from '../types/index';
import type { SphereAlignment } from '../types/influence';
import type { MandateTemplate } from '../data/mandate-content';
import { MANDATE_TEMPLATES } from '../data/mandate-content';

// ─── Constants (from central config) ─────────────────────────────────────

import {
  MANDATE_PRIMARY_WEIGHT as PRIMARY_WEIGHT,
  MANDATE_SECONDARY_WEIGHT as SECONDARY_WEIGHT,
  MANDATE_BASE_WEIGHT as BASE_WEIGHT,
  MANDATE_ACHIEVABLE_MULTIPLIER as SIMULATION_ACHIEVABLE_MULTIPLIER,
} from '../data/game-config';

// ─── Seeded PRNG (same as orchestrator.ts) ────────────────────────────────

/**
 * Mulberry32 PRNG factory.
 * Same implementation as orchestrator.ts to ensure consistency.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Mandate Generator ─────────────────────────────────────────────────────

/**
 * Score a single mandate template based on sphere alignment.
 *
 * Returns the highest weight matched:
 * - PRIMARY_WEIGHT (3) if template includes alignment.primary
 * - SECONDARY_WEIGHT (2) if template includes alignment.secondary
 * - BASE_WEIGHT (1) otherwise
 *
 * Simulation-achievable mandates receive a 2x multiplier to increase selection likelihood.
 */
function scoreTemplate(
  template: MandateTemplate,
  alignment: SphereAlignment,
): number {
  const { primary, secondary } = alignment;
  const { sphereAffinities, type } = template;

  // Compute base weight
  let baseWeight: number;
  if (sphereAffinities.includes(primary)) {
    baseWeight = PRIMARY_WEIGHT;
  } else if (sphereAffinities.includes(secondary)) {
    baseWeight = SECONDARY_WEIGHT;
  } else {
    baseWeight = BASE_WEIGHT;
  }

  // Apply simulation_achievable multiplier
  if (type === 'simulation_achievable') {
    return baseWeight * SIMULATION_ACHIEVABLE_MULTIPLIER;
  }

  return baseWeight;
}

/**
 * Generate a mandate template selection using seeded PRNG with sphere weighting.
 *
 * Deterministic: same (seed, alignment) → same mandate
 * Weighted by sphere affinity: life-primary ascendants favor life mandates
 *
 * @param cosmology Player's sphere profile (unused in current implementation, reserved for future)
 * @param alignment Primary and secondary sphere alignment
 * @param seed Seed for PRNG (e.g., worldSeed + activeTick)
 * @returns Selected MandateTemplate
 */
export function generateMandate(
  cosmology: CosmologyProfile,
  alignment: SphereAlignment,
  seed: number,
): MandateTemplate {
  // Compute scores for all templates
  const scores = MANDATE_TEMPLATES.map((template) =>
    scoreTemplate(template, alignment),
  );

  // Compute cumulative weights for weighted selection
  const cumulativeWeights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < scores.length; i++) {
    totalWeight += scores[i];
    cumulativeWeights.push(totalWeight);
  }

  // Generate random value [0, totalWeight)
  const rng = mulberry32(seed);
  const randomValue = rng() * totalWeight;

  // Find the selected template by cumulative weight
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (randomValue < cumulativeWeights[i]) {
      return MANDATE_TEMPLATES[i];
    }
  }

  // Fallback (should never reach, but safety net)
  return MANDATE_TEMPLATES[0];
}

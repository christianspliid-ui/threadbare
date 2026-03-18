/**
 * Intervention Essence Cost — triangular cost curve for probability boosting.
 *
 * The player spends essence to tilt encounter probability. Cost grows
 * as N*(N+1)/2 (triangular numbers), making small nudges cheap and
 * large interventions dramatically expensive.
 *
 * --- Constants ---
 * | Name                              | Default | Purpose                                  |
 * |-----------------------------------|---------|------------------------------------------|
 * | INTERVENTION_MAX_BONUS            | 0.20    | Hard cap on probability bonus             |
 * | OPPOSING_SPHERE_COST_MULTIPLIER   | 3.0     | Cost multiplier for opposing spheres      |
 * | NEUTRAL_SPHERE_COST_MULTIPLIER    | 1.5     | Cost multiplier for unrelated spheres     |
 * | BOND_EFFICIENCY                   | Record  | Per-tier efficiency of divine intervention|
 *
 * --- Fail-soft ---
 * | Failure                              | Fallback                        |
 * |----------------------------------------|---------------------------------|
 * | desiredBonus exceeds max             | Clamp to INTERVENTION_MAX_BONUS |
 * | Unknown bond tier                    | Use efficiency 0.2 (unbonded)   |
 * | Agent sphere undefined               | Treat as neutral multiplier     |
 * | Encounter sphere undefined            | Multiplier = 1.0 (any essence) |
 *
 * --- PRNG ---
 * None — cost computation is deterministic.
 */

import type { SphereName } from '../types/index';
import { SPHERE_OPPOSITIONS } from './cosmology';
import type { DivineAttention } from './divineAttention';

// --- Constants ---

export const INTERVENTION_MAX_BONUS = 0.20;
export const OPPOSING_SPHERE_COST_MULTIPLIER = 3.0;
export const NEUTRAL_SPHERE_COST_MULTIPLIER = 1.5;

/** Bond efficiency by influence tier */
export const BOND_EFFICIENCY: Record<number, number> = {
  0: 0.2,   // unbonded
  1: 0.4,   // touched
  2: 0.6,   // drawn
  3: 0.8,   // devoted
  4: 0.95,  // exalted
};

// --- Types ---

export interface InterventionCostEstimate {
  probabilityBonus: number;
  essenceCost: number;
  sphereMultiplier: number;
  bondEfficiency: number;
  effectiveBonus: number;
}

// --- Core Functions ---

/**
 * Compute the triangular cost for a given number of percentage points.
 * Cost for +N% = N * (N + 1) / 2
 *
 * Examples: +1% = 1, +5% = 15, +10% = 55, +15% = 120, +20% = 210
 */
export function triangularCost(percentagePoints: number): number {
  const n = Math.max(0, Math.floor(percentagePoints));
  return (n * (n + 1)) / 2;
}

/**
 * Determine the sphere cost multiplier.
 * Same sphere = 1.0, opposing = OPPOSING_SPHERE_COST_MULTIPLIER, else NEUTRAL.
 */
export function computeSphereMultiplier(
  agentSphere: SphereName | undefined,
  encounterSphere: SphereName | undefined,
): number {
  if (!encounterSphere) return 1.0;
  if (!agentSphere) return NEUTRAL_SPHERE_COST_MULTIPLIER;
  if (agentSphere === encounterSphere) return 1.0;
  if (SPHERE_OPPOSITIONS[agentSphere] === encounterSphere) return OPPOSING_SPHERE_COST_MULTIPLIER;
  return NEUTRAL_SPHERE_COST_MULTIPLIER;
}

/**
 * Compute the full intervention cost estimate.
 *
 * desiredBonus: the raw probability bonus the player wants (0.0 to 0.20)
 * agentSphere: the agent's sphere alignment (from worships edge / ascendant)
 * encounterSphere: the encounter's sphereAffinity
 * bondTier: the influence tier (0-4)
 * divineAttention: current divine attention state on the agent
 */
export function computeInterventionCost(
  desiredBonus: number,
  agentSphere: SphereName | undefined,
  encounterSphere: SphereName | undefined,
  bondTier: number,
  divineAttention: DivineAttention,
): InterventionCostEstimate {
  // Clamp desired bonus to max
  const clampedBonus = Math.min(Math.max(0, desiredBonus), INTERVENTION_MAX_BONUS);

  // Convert to percentage points (0.05 = 5 points)
  const percentagePoints = Math.round(clampedBonus * 100);

  // Base cost: triangular number
  const baseCost = triangularCost(percentagePoints);

  // Sphere multiplier
  const sphereMultiplier = computeSphereMultiplier(agentSphere, encounterSphere);

  // Apply sphere multiplier
  let totalCost = baseCost * sphereMultiplier;

  // Apply divine attention cost discount
  if (divineAttention.costDiscount > 0) {
    totalCost *= (1 - divineAttention.costDiscount);
  }

  // Round up to nearest integer
  const essenceCost = Math.ceil(totalCost);

  // Bond efficiency
  const bondEfficiency = BOND_EFFICIENCY[bondTier] ?? BOND_EFFICIENCY[0];

  // Effective bonus after bond efficiency + divine attention boost
  const totalEfficiency = Math.min(1.0, bondEfficiency + divineAttention.efficiencyBoost);
  const effectiveBonus = clampedBonus * totalEfficiency;

  return {
    probabilityBonus: clampedBonus,
    essenceCost,
    sphereMultiplier,
    bondEfficiency,
    effectiveBonus,
  };
}

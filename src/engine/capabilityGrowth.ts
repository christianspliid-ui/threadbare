/**
 * Capability Growth — encounter-driven domain capability progression.
 *
 * When agents complete encounter steps, they gain experience in the step's
 * reach domain. Growth accumulates via synthetic experience traits on the
 * graph. When capability crosses a tier boundary, the caller can fire a
 * promotion event.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default | Purpose                                      |
 * |-------------------------------|---------|----------------------------------------------|
 * | BASE_ENCOUNTER_GROWTH         | 0.5     | Base growth per successful step               |
 * | PROMOTION_ELIGIBLE_MULTIPLIER | 2.0     | Multiplier when step is promotion-eligible     |
 * | DIMINISHING_RETURNS_FACTOR    | 0.7     | Rate at which high capability reduces growth   |
 * | FAILURE_GROWTH_FRACTION       | 0.2     | Fraction of base growth awarded on failure     |
 * | CRITICAL_SUCCESS_MULTIPLIER   | 1.5     | Reserved: multiplier for critical successes    |
 * | CRITICAL_FAILURE_GROWTH       | 0.0     | Reserved: growth on critical failure           |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Growth results are returned to the caller (encounter.ts) which emits
 * encounter_resolution traces. No independent trace emission here.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Missing agent node              | Return zero-growth result             |
 * | Missing experience trait        | Create new trait node + edge          |
 * | computeCapability throws        | Return zero-growth result             |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — growth is fully deterministic based on step parameters.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain, DomainContributions } from '../types/traits';
import { computeCapability, computeTier } from './domainCapability';

// ─── Constants ──────────────────────────────────────────────────

/** Base growth per encounter step completion */
export const BASE_ENCOUNTER_GROWTH = 0.5;

/** Multiplier when the step's outcome has tierPromotionEligible */
export const PROMOTION_ELIGIBLE_MULTIPLIER = 2.0;

/** Controls how much high capability reduces growth (0–1) */
export const DIMINISHING_RETURNS_FACTOR = 0.7;

/** Fraction of base growth awarded on failure */
export const FAILURE_GROWTH_FRACTION = 0.2;

/** Reserved: multiplier for critical success outcomes */
export const CRITICAL_SUCCESS_MULTIPLIER = 1.5;

/** Reserved: growth on critical failure */
export const CRITICAL_FAILURE_GROWTH = 0.0;

// ─── Result Types ───────────────────────────────────────────────

export interface GrowthResult {
  domain: ReachDomain;
  growthApplied: number;
  previousCapability: number;
  newCapability: number;
  previousTier: number;
  newTier: number;
  tierCrossed: boolean;
}

// ─── Difficulty Scaling ─────────────────────────────────────────

/**
 * Map step difficulty (0–100) to a scaling factor.
 * Higher difficulty → more growth reward.
 */
export function difficultyScaling(difficulty: number): number {
  if (difficulty < 20) return 0.2;
  if (difficulty < 40) return 0.5;
  if (difficulty < 60) return 1.0;
  if (difficulty < 80) return 1.3;
  return 1.5;
}

// ─── Growth Computation ─────────────────────────────────────────

/**
 * Compute the growth amount for an encounter step.
 *
 * Success: base × promoMultiplier × difficultyScale × diminishing
 * Failure: base × FAILURE_GROWTH_FRACTION × difficultyScale
 */
export function computeGrowthAmount(
  stepDifficulty: number,
  success: boolean,
  tierPromotionEligible: boolean,
  currentCapability: number,
): number {
  if (!success) {
    return BASE_ENCOUNTER_GROWTH * FAILURE_GROWTH_FRACTION * difficultyScaling(stepDifficulty);
  }

  const base = BASE_ENCOUNTER_GROWTH;
  const promoMult = tierPromotionEligible ? PROMOTION_ELIGIBLE_MULTIPLIER : 1.0;
  const diffScale = difficultyScaling(stepDifficulty);
  const diminishing = 1.0 - currentCapability * DIMINISHING_RETURNS_FACTOR;

  return base * promoMult * diffScale * Math.max(diminishing, 0.1);
}

// ─── Apply Growth ───────────────────────────────────────────────

/**
 * Apply capability growth after an encounter step resolution.
 *
 * Creates or updates a synthetic experience trait on the agent's graph
 * neighborhood. The trait contributes to the step's reach domain via
 * domainContributions, feeding into computeCapability's raw score walk.
 *
 * Fail-soft: if agent node is missing, returns a zero-growth result.
 */
export function applyEncounterGrowth(
  graph: WorldGraph,
  agentId: string,
  domain: ReachDomain,
  stepDifficulty: number,
  success: boolean,
  tierPromotionEligible: boolean,
): GrowthResult {
  const zeroResult: GrowthResult = {
    domain,
    growthApplied: 0,
    previousCapability: 0,
    newCapability: 0,
    previousTier: 1,
    newTier: 1,
    tierCrossed: false,
  };

  // Fail-soft: missing agent
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return zeroResult;

  // Compute current state
  let previousCapability: number;
  try {
    previousCapability = computeCapability(graph, agentId, domain);
  } catch {
    return zeroResult;
  }
  const previousTier = computeTier(previousCapability);

  // Compute growth
  const growthAmount = computeGrowthAmount(
    stepDifficulty,
    success,
    tierPromotionEligible,
    previousCapability,
  );

  if (growthAmount <= 0) {
    return {
      ...zeroResult,
      previousCapability,
      newCapability: previousCapability,
      previousTier,
      newTier: previousTier,
    };
  }

  // Find or create synthetic experience trait
  const traitNodeId = `encounter_experience_${domain}_${agentId}`;
  const existingTraitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  let foundEdge: ReturnType<WorldGraph['getEdge']> | undefined;

  for (const edge of existingTraitEdges) {
    if (edge.target === traitNodeId) {
      foundEdge = edge;
      break;
    }
  }

  if (!foundEdge) {
    // Create new experience trait node
    const domainContributions: DomainContributions = { [domain]: 1.0 };
    graph.addNode({
      id: traitNodeId,
      type: 'trait',
      name: `Experience (${domain})`,
      properties: {
        subcategory: 'experience' as string,
        description: `Accumulated encounter experience in the ${domain} domain`,
        importance: 0.3,
        maxLevel: 100,
        visibility: 'discoverable',
        domainContributions,
        tags: ['experience', 'encounter', domain],
        flavorText: `Hard-won experience in the ways of ${domain}.`,
      },
    });

    // Add has_trait edge with growth as level
    graph.addEdge({
      id: `edge_experience_${domain}_${agentId}`,
      source: agentId,
      target: traitNodeId,
      type: 'has_trait',
      properties: {
        level: growthAmount,
        acquiredTick: 0,
        lastReinforcedTick: 0,
        source: 'encounter_growth',
        visibility: 'discoverable',
      },
    });
  } else {
    // Update existing edge level
    const currentLevel = (foundEdge.properties.level as number) ?? 0;
    graph.updateEdge(foundEdge.id, {
      properties: {
        ...foundEdge.properties,
        level: currentLevel + growthAmount,
        lastReinforcedTick: 0,
      },
    });
  }

  // Recompute capability after growth
  let newCapability: number;
  try {
    newCapability = computeCapability(graph, agentId, domain);
  } catch {
    newCapability = previousCapability;
  }
  const newTier = computeTier(newCapability);

  return {
    domain,
    growthApplied: growthAmount,
    previousCapability,
    newCapability,
    previousTier,
    newTier,
    tierCrossed: newTier > previousTier,
  };
}

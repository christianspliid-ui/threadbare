/**
 * Outcome Consequences — Phase 3 proving slice.
 *
 * Applies differentiated consequences based on the rich outcome ladder
 * for a narrow set of representative action families.
 *
 * Design: The shared resolver produces 5 outcome tiers. This module
 * translates those tiers into concrete game state effects (quintessence
 * changes, growth modifiers, narrative signals) for the proving slice.
 *
 * Proving slice families:
 * - Social/influence: action.heart.* and action.shadow.recruit-agent
 * - Information/exploration: action.eye.* and npc_ask_information
 * - Risky/coercive: action.shadow.assassinate, action.iron.conquer, action.gold.commission-assassination
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                                  | Default | Purpose                                    |
 * |---------------------------------------|---------|--------------------------------------------|
 * | CRITICAL_SUCCESS_GROWTH_MULTIPLIER    | 1.5     | Growth bonus on crit success               |
 * | SUCCESS_AT_COST_GROWTH_MULTIPLIER     | 0.5     | Reduced growth on success at cost          |
 * | CRITICAL_FAILURE_QUINTESSENCE_PENALTY | 0.04    | Extra Q erosion on crit failure            |
 * | SUCCESS_AT_COST_QUINTESSENCE_PENALTY  | 0.02    | Q erosion on success at cost               |
 * | CRITICAL_SUCCESS_QUINTESSENCE_REWARD  | 0.02    | Q recovery on crit success                 |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                    | Fallback                           |
 * |---------------------------------|------------------------------------|
 * | Unknown template ID             | No-op, returns default consequence |
 * | Missing node properties         | Skip quintessence effect           |
 */

import type { StepOutcome } from '../types/unifiedAction';
import type { QuintessenceEvent } from '../types/quintessence';
import { isStepSuccess, isStepFailure } from '../types/unifiedAction';

// ─── Constants (NFP #1: Tunability) ────────────────────────────────

/** Growth multiplier applied to capability growth on critical success */
export const CRITICAL_SUCCESS_GROWTH_MULTIPLIER = 1.5;

/** Growth multiplier applied to capability growth on success at cost */
export const SUCCESS_AT_COST_GROWTH_MULTIPLIER = 0.5;

/** Extra quintessence erosion on critical failure */
export const CRITICAL_FAILURE_QUINTESSENCE_PENALTY = 0.04;

/** Quintessence erosion on success at cost (barely scraped through) */
export const SUCCESS_AT_COST_QUINTESSENCE_PENALTY = 0.02;

/** Quintessence recovery on critical success (surge of power) */
export const CRITICAL_SUCCESS_QUINTESSENCE_REWARD = 0.02;

// ─── Proving Slice Template Sets ──────────────────────────────────

/** Social/influence actions — proving slice family 1 */
const SOCIAL_INFLUENCE_PREFIXES = ['action.heart.', 'action.shadow.recruit'];

/** Information/exploration actions — proving slice family 2 */
const INFORMATION_PREFIXES = ['action.eye.', 'npc_ask_information', 'npc_eavesdrop'];

/** Risky/coercive actions — proving slice family 3 */
const RISKY_COERCIVE_IDS = [
  'action.shadow.assassinate',
  'action.iron.conquer',
  'action.gold.commission-assassination',
];

/**
 * Check if a template ID is in the Phase 3 proving slice.
 * Templates outside this set use default (no-op) consequence behavior.
 */
export function isProvingSliceTemplate(templateId: string): boolean {
  for (const prefix of SOCIAL_INFLUENCE_PREFIXES) {
    if (templateId.startsWith(prefix)) return true;
  }
  for (const prefix of INFORMATION_PREFIXES) {
    if (templateId.startsWith(prefix)) return true;
  }
  return RISKY_COERCIVE_IDS.includes(templateId);
}

// ─── Consequence Results ──────────────────────────────────────────

export interface OutcomeConsequence {
  /** Multiplier applied to capability growth for this step. 1.0 = default. */
  growthMultiplier: number;
  /** Quintessence event to add to pending queue, or null for no Q effect. */
  quintessenceEvent: QuintessenceEvent | null;
  /** Narrative tag for prose system (e.g., 'surge', 'strained', 'catastrophe'). */
  narrativeTag: string;
  /** Extra significance boost for tick events. Added to base significance. */
  significanceBoost: number;
}

const DEFAULT_CONSEQUENCE: OutcomeConsequence = {
  growthMultiplier: 1.0,
  quintessenceEvent: null,
  narrativeTag: 'neutral',
  significanceBoost: 0,
};

// ─── Consequence Computation ──────────────────────────────────────

/**
 * Compute differentiated consequences for a step outcome.
 *
 * Only templates in the proving slice get rich consequences.
 * All others return the default (no-op) consequence.
 *
 * @param templateId - The action template ID
 * @param outcome - The step outcome from the shared resolver
 * @param actorId - The actor node ID (for quintessence events)
 * @param tick - Current game tick
 * @returns Consequence specification for the caller to apply
 */
export function computeOutcomeConsequence(
  templateId: string,
  outcome: StepOutcome,
  actorId: string,
  tick: number,
): OutcomeConsequence {
  if (!isProvingSliceTemplate(templateId)) {
    return DEFAULT_CONSEQUENCE;
  }

  // Determine which family for flavor differences
  const isRisky = RISKY_COERCIVE_IDS.includes(templateId);

  switch (outcome) {
    case 'critical_success':
      return {
        growthMultiplier: CRITICAL_SUCCESS_GROWTH_MULTIPLIER,
        quintessenceEvent: {
          targetNodeId: actorId,
          delta: CRITICAL_SUCCESS_QUINTESSENCE_REWARD,
          source: 'outcome_critical_success',
          tick,
        },
        narrativeTag: 'surge',
        significanceBoost: 0.2,
      };

    case 'success':
      return DEFAULT_CONSEQUENCE;

    case 'success_at_cost': {
      // Risky actions charge a steeper cost
      const penalty = isRisky
        ? SUCCESS_AT_COST_QUINTESSENCE_PENALTY * 1.5
        : SUCCESS_AT_COST_QUINTESSENCE_PENALTY;
      return {
        growthMultiplier: SUCCESS_AT_COST_GROWTH_MULTIPLIER,
        quintessenceEvent: {
          targetNodeId: actorId,
          delta: -penalty,
          source: 'outcome_success_at_cost',
          tick,
        },
        narrativeTag: 'strained',
        significanceBoost: 0.05,
      };
    }

    case 'failure':
      return {
        growthMultiplier: 1.0,
        quintessenceEvent: null,
        narrativeTag: 'setback',
        significanceBoost: 0,
      };

    case 'critical_failure': {
      // Critical failures on risky actions are especially punishing
      const penalty = isRisky
        ? CRITICAL_FAILURE_QUINTESSENCE_PENALTY * 1.5
        : CRITICAL_FAILURE_QUINTESSENCE_PENALTY;
      return {
        growthMultiplier: 1.0,
        quintessenceEvent: {
          targetNodeId: actorId,
          delta: -penalty,
          source: 'outcome_critical_failure',
          tick,
        },
        narrativeTag: 'catastrophe',
        significanceBoost: 0.1,
      };
    }
  }
}

/**
 * Outcome Consequences — Phase 6 universal band differentiation.
 *
 * Applies differentiated consequences based on the six-band outcome ladder
 * for ALL action templates (proving-slice gate removed in Phase 6).
 *
 * Design: The shared resolver produces 6 outcome tiers (Phase 6 adds near_miss).
 * This module translates those tiers into concrete game state effects
 * (quintessence changes, growth modifiers, attachment drop intent, narrative signals).
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────────────
 * | Name                                   | Default | Purpose                                     |
 * |----------------------------------------|---------|---------------------------------------------|
 * | CRITICAL_SUCCESS_GROWTH_MULTIPLIER     | 1.5     | Growth bonus on critical success             |
 * | SUCCESS_AT_COST_GROWTH_MULTIPLIER      | 0.5     | Reduced growth on success at cost            |
 * | NEAR_MISS_GROWTH_MULTIPLIER            | 0.25    | Partial growth credit on near_miss           |
 * | NEAR_MISS_PROGRESS_COUNTER_DELTA       | 0.5     | Progress toward eventual success on near_miss |
 * | CRITICAL_FAILURE_QUINTESSENCE_PENALTY  | 0.04    | Extra Q erosion on critical failure          |
 * | SUCCESS_AT_COST_QUINTESSENCE_PENALTY   | 0.02    | Q erosion on success at cost                 |
 * | CRITICAL_SUCCESS_QUINTESSENCE_REWARD   | 0.02    | Q recovery on critical success               |
 * | CRITICAL_SUCCESS_DROP_WEIGHT           | 1.5     | Drop-table weight on critical success        |
 * | SUCCESS_DROP_WEIGHT                    | 1.0     | Drop-table weight on success (baseline)      |
 * | SUCCESS_AT_COST_DROP_WEIGHT            | 0.4     | Drop weight on success_at_cost (curse/debt)  |
 * | NEAR_MISS_DROP_WEIGHT                  | 0.0     | No drop on near_miss; progress counter instead |
 *
 * ─── Fail-soft ───────────────────────────────────────────────────────────────
 * | Failure case                    | Fallback                                  |
 * |---------------------------------|-------------------------------------------|
 * | Unknown template ID             | Universal band rates applied (no risky-family flavor) |
 * | Missing node properties         | Skip quintessence effect                  |
 * | Drop pipeline rejects intent    | Trace consequence_drop_rejected; Q/growth still applies |
 * | near_miss on no progressCounter | Treat as failure for Q/growth; trace near_miss_unsupported |
 */

import type { StepOutcome } from '../types/unifiedAction';
import type { QuintessenceEvent } from '../types/quintessence';
import { isStepSuccess, isStepFailure } from '../types/unifiedAction';
import type { ComplicationContext, ComplicationResult } from '../types/complication';
import { selectComplication } from './complicationSelection';

// ─── Constants (NFP #1: Tunability) ────────────────────────────────

/** Growth multiplier applied to capability growth on critical success */
export const CRITICAL_SUCCESS_GROWTH_MULTIPLIER = 1.5;

/** Growth multiplier applied to capability growth on success at cost */
export const SUCCESS_AT_COST_GROWTH_MULTIPLIER = 0.5;

/** Partial growth credit on near_miss — agent learns from almost-succeeding */
export const NEAR_MISS_GROWTH_MULTIPLIER = 0.25;

/** Progress counter delta on near_miss — accumulates toward eventual success */
export const NEAR_MISS_PROGRESS_COUNTER_DELTA = 0.5;

/** Extra quintessence erosion on critical failure */
export const CRITICAL_FAILURE_QUINTESSENCE_PENALTY = 0.04;

/** Quintessence erosion on success at cost (barely scraped through) */
export const SUCCESS_AT_COST_QUINTESSENCE_PENALTY = 0.02;

/** Quintessence recovery on critical success (surge of power) */
export const CRITICAL_SUCCESS_QUINTESSENCE_REWARD = 0.02;

/** Attachment drop-table weight on critical success */
export const CRITICAL_SUCCESS_DROP_WEIGHT = 1.5;

/** Attachment drop-table weight on success (baseline) */
export const SUCCESS_DROP_WEIGHT = 1.0;

/** Attachment drop-table weight on success_at_cost; biased toward curse/debt tiers */
export const SUCCESS_AT_COST_DROP_WEIGHT = 0.4;

/** No attachment drop on near_miss — progress counter instead */
export const NEAR_MISS_DROP_WEIGHT = 0.0;

/** Band → loot tier hint for the attachment drop pipeline */
export const LOOT_TIER_BY_BAND: Record<StepOutcome, string> = {
  critical_success: 'mythic',
  success: 'rare',
  success_at_cost: 'curse',
  near_miss: 'none',
  failure: 'none',
  critical_failure: 'none',
};

// ─── Risky-action Template Sets ──────────────────────────────────

/** Social/influence actions — for flavor differences */
const SOCIAL_INFLUENCE_PREFIXES = ['action.heart.', 'action.shadow.recruit'];

/** Information/exploration actions */
const INFORMATION_PREFIXES = ['action.eye.', 'npc_ask_information', 'npc_eavesdrop'];

/** Risky/coercive actions — steeper penalties on failure tiers */
const RISKY_COERCIVE_IDS = [
  'action.shadow.assassinate',
  'action.iron.conquer',
  'action.gold.commission-assassination',
];

/**
 * Check if a template ID is in the risky/coercive family.
 * These templates apply a 1.5× penalty multiplier on failure-tier Q costs.
 */
export function isRiskyTemplate(templateId: string): boolean {
  return RISKY_COERCIVE_IDS.includes(templateId);
}

/**
 * Check if a template ID is in the Phase 3 proving slice.
 * Kept for backward compatibility and test introspection — no longer gates consequences.
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

// ─── Attachment Drop Intent ──────────────────────────────────────

export interface AttachmentDropIntent {
  /** The outcome band that produced this drop intent */
  band: StepOutcome;
  /** Weight multiplier on the base drop probability */
  weight: number;
  /** Tier hint for the attachment pipeline (e.g. 'mythic', 'rare', 'curse', 'none') */
  tierHint: string;
}

// ─── Consequence Results ──────────────────────────────────────────

export interface OutcomeConsequence {
  /** Multiplier applied to capability growth for this step. 1.0 = default. */
  growthMultiplier: number;
  /** Quintessence event to add to pending queue, or null for no Q effect. */
  quintessenceEvent: QuintessenceEvent | null;
  /**
   * Narrative tag for prose system (e.g., 'surge', 'strained', 'catastrophe').
   * Flows to enrichProse() for band-flavored prose variant selection.
   */
  narrativeTag: string;
  /** Extra significance boost for tick events. Added to base significance. */
  significanceBoost: number;
  /**
   * Complication attached to this outcome (null for success tiers).
   * Populated for failure / critical_failure / success_at_cost when a
   * ComplicationContext is provided. (THR-20)
   */
  complication: ComplicationResult | null;
  /**
   * Progress counter delta for near_miss outcomes.
   * Encounter authors use this to register progress toward eventual success.
   * 0 for all non-near_miss bands.
   */
  progressCounterDelta: number;
  /**
   * Attachment drop intent for success bands; null for failure bands.
   * Consumed by the attachment grant pipeline to roll on the drop table.
   */
  attachmentDropIntent: AttachmentDropIntent | null;
}

const DEFAULT_CONSEQUENCE: OutcomeConsequence = {
  growthMultiplier: 1.0,
  quintessenceEvent: null,
  narrativeTag: 'neutral',
  significanceBoost: 0,
  complication: null,
  progressCounterDelta: 0,
  attachmentDropIntent: null,
};

// ─── Consequence Computation ──────────────────────────────────────

/**
 * Compute differentiated consequences for a step outcome.
 *
 * Phase 6: All templates receive band-differentiated Q deltas, growth multipliers,
 * and drop intents across all six bands. The proving-slice gate is removed.
 * Risky-action flavor (1.5× penalty) is preserved for RISKY_COERCIVE_IDS templates.
 *
 * @param templateId - The action template ID
 * @param outcome - The step outcome from the shared resolver
 * @param actorId - The actor node ID (for quintessence events)
 * @param tick - Current game tick
 * @param context - Optional context for complication selection. When absent, no
 *   complication is selected (backward-compatible with legacy callers).
 * @returns Consequence specification for the caller to apply
 */
export function computeOutcomeConsequence(
  templateId: string,
  outcome: StepOutcome,
  actorId: string,
  tick: number,
  context?: ComplicationContext,
): OutcomeConsequence {
  // Complication selection: failure tiers only. near_miss never triggers a complication.
  // success_at_cost: probabilistic via COMPLICATION_MINOR_WEIGHT in selectComplication.
  const isFailureTier = isStepFailure(outcome) || outcome === 'success_at_cost';
  const complication = (context && isFailureTier)
    ? selectComplication(outcome, context)
    : null;

  const isRisky = isRiskyTemplate(templateId);

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
        complication: null,
        progressCounterDelta: 0,
        attachmentDropIntent: {
          band: 'critical_success',
          weight: CRITICAL_SUCCESS_DROP_WEIGHT,
          tierHint: LOOT_TIER_BY_BAND.critical_success,
        },
      };

    case 'success':
      return {
        ...DEFAULT_CONSEQUENCE,
        narrativeTag: 'neutral',
        attachmentDropIntent: {
          band: 'success',
          weight: SUCCESS_DROP_WEIGHT,
          tierHint: LOOT_TIER_BY_BAND.success,
        },
        complication: null,
      };

    case 'success_at_cost': {
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
        complication,
        progressCounterDelta: 0,
        attachmentDropIntent: {
          band: 'success_at_cost',
          weight: SUCCESS_AT_COST_DROP_WEIGHT,
          tierHint: LOOT_TIER_BY_BAND.success_at_cost,
        },
      };
    }

    case 'near_miss':
      return {
        growthMultiplier: NEAR_MISS_GROWTH_MULTIPLIER,
        quintessenceEvent: null,
        narrativeTag: 'fortunate',
        significanceBoost: 0,
        complication: null,
        progressCounterDelta: NEAR_MISS_PROGRESS_COUNTER_DELTA,
        attachmentDropIntent: null,
      };

    case 'failure':
      return {
        growthMultiplier: 1.0,
        quintessenceEvent: null,
        narrativeTag: 'setback',
        significanceBoost: 0,
        complication,
        progressCounterDelta: 0,
        attachmentDropIntent: null,
      };

    case 'critical_failure': {
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
        // Complication has its own dedicated event with its own significance;
        // we do not merge complication.significanceBoost here (THR-20)
        significanceBoost: 0.1,
        complication,
        progressCounterDelta: 0,
        attachmentDropIntent: null,
      };
    }
  }
}

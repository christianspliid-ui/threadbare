/**
 * Quintessence Actions — canonical spend/resist/overreach hooks (Phase 2).
 *
 * Provides the additive hooks for quintessence spending and resistance.
 * Phase 2 implements the contract; full wiring into every content path is Phase 3+.
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                           | Default | Purpose                              |
 * |--------------------------------|---------|--------------------------------------|
 * | PUSH_COST_BASE                 | 0.05    | Base quintessence cost for a push    |
 * | RESIST_COST_BASE               | 0.03    | Base quintessence cost for a resist  |
 * | PUSH_MODIFIER                  | 0.10    | Probability bonus from a push spend  |
 * | RESIST_DOWNGRADE_CHANCE        | 0.60    | Chance resist downgrades outcome     |
 * | OVERREACH_COST_MULTIPLIER      | 2.0     | Multiplier for overreach spending    |
 * | MIN_QUINTESSENCE_FOR_SPEND     | 0.02    | Floor below which spending is blocked|
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                    | Fallback                           |
 * |---------------------------------|------------------------------------|
 * | Missing quintessence property   | Treated as full (QUINTESSENCE_DEFAULT) |
 * | Missing quintessenceMax         | Treated as QUINTESSENCE_MAX_DEFAULT    |
 * | Spend would go below 0          | Clamped to 0                       |
 * | Node not found                  | Returns false/no-op                |
 */

import type { QuintessenceSpendKind } from '../types/resolution';
import type { QuintessenceEvent } from '../types/quintessence';
import {
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_MAX_DEFAULT,
  getQuintessenceRatio,
} from '../types/quintessence';

// ─── Constants (NFP #1: Tunability) ────────────────────────────────

/** Base quintessence cost for a push (reroll/bonus) */
export const PUSH_COST_BASE = 0.05;

/** Base quintessence cost for resisting a negative outcome */
export const RESIST_COST_BASE = 0.03;

/** Probability modifier gained from a push spend */
export const PUSH_MODIFIER = 0.10;

/** Probability that a resist spend will downgrade the outcome */
export const RESIST_DOWNGRADE_CHANCE = 0.60;

/** Cost multiplier for overreach spending (desperation move) */
export const OVERREACH_COST_MULTIPLIER = 2.0;

/** Minimum quintessence ratio required to spend (below this, spending is blocked) */
export const MIN_QUINTESSENCE_FOR_SPEND = 0.02;

// ─── Node Interface ────────────────────────────────────────────────

/** Minimal node interface to avoid import cycles */
interface QuintessenceNodeLike {
  id: string;
  properties: Record<string, unknown>;
}

// ─── Query Functions ───────────────────────────────────────────────

/**
 * Check whether an actor can spend quintessence of the given kind.
 * Returns false if the actor is at or below the minimum spend threshold.
 */
export function canSpendQuintessence(
  node: QuintessenceNodeLike,
  spendKind: QuintessenceSpendKind,
): boolean {
  const ratio = getQuintessenceRatio(node);
  if (ratio <= MIN_QUINTESSENCE_FOR_SPEND) return false;

  const current = (node.properties.quintessence ?? QUINTESSENCE_DEFAULT) as number;
  const cost = getSpendCost(spendKind);
  return current >= cost;
}

/**
 * Get the cost for a given spend kind.
 */
export function getSpendCost(spendKind: QuintessenceSpendKind): number {
  switch (spendKind) {
    case 'push': return PUSH_COST_BASE;
    case 'resist': return RESIST_COST_BASE;
    case 'overreach': return PUSH_COST_BASE * OVERREACH_COST_MULTIPLIER;
  }
}

/**
 * Get the probability modifier from a push spend.
 * Returns 0 if the actor cannot afford the push.
 */
export function getPushModifier(node: QuintessenceNodeLike): number {
  return canSpendQuintessence(node, 'push') ? PUSH_MODIFIER : 0;
}

// ─── Spend Functions ───────────────────────────────────────────────

/**
 * Create a QuintessenceEvent for spending quintessence.
 * Does not mutate the node — returns the event for the pending events pipeline.
 *
 * @returns The spend event, or null if the actor cannot afford it.
 */
export function spendQuintessence(
  node: QuintessenceNodeLike,
  spendKind: QuintessenceSpendKind,
  source: string,
  tick: number,
): QuintessenceEvent | null {
  if (!canSpendQuintessence(node, spendKind)) return null;

  const cost = getSpendCost(spendKind);
  return {
    targetNodeId: node.id,
    delta: -cost,
    source: `spend_${spendKind}_${source}`,
    tick,
  };
}

// ─── Resist Functions ──────────────────────────────────────────────

/**
 * Check whether an actor can resist a negative outcome.
 */
export function canResistOutcome(node: QuintessenceNodeLike): boolean {
  return canSpendQuintessence(node, 'resist');
}

/**
 * Apply a resist attempt: creates the spend event.
 * The caller is responsible for checking the resist probability (RESIST_DOWNGRADE_CHANCE)
 * and actually downgrading the outcome if the resist succeeds.
 *
 * @returns The spend event, or null if the actor cannot afford it.
 */
export function applyResistOutcome(
  node: QuintessenceNodeLike,
  source: string,
  tick: number,
): QuintessenceEvent | null {
  return spendQuintessence(node, 'resist', source, tick);
}

// ─── Encounter Failure Erosion ─────────────────────────────────────

/**
 * Create a QuintessenceEvent for encounter failure erosion.
 * This is the Phase 2 live non-player quintessence pressure seam.
 *
 * @param nodeId - The actor who failed the encounter step
 * @param erosionAmount - Amount of quintessence to erode (use QUINTESSENCE_ENCOUNTER_FAILURE_EROSION)
 * @param tick - Current game tick
 * @returns A QuintessenceEvent to be added to pendingQuintessenceEvents
 */
export function createEncounterFailureErosion(
  nodeId: string,
  erosionAmount: number,
  tick: number,
): QuintessenceEvent {
  return {
    targetNodeId: nodeId,
    delta: -Math.abs(erosionAmount),
    source: 'encounter_failure',
    tick,
  };
}

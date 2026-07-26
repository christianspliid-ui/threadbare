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
  QUINTESSENCE_ENCOUNTER_FAILURE_EROSION,
  getQuintessenceRatio,
} from '../types/quintessence';
import type { StepOutcome } from '../types/unifiedAction';
import {
  DIFFICULTY_EROSION_SCALE,
  EROSION_ATTENDED_MULT,
  EROSION_BAND_MULT,
  QUINTESSENCE_RATIO_FLOOR,
} from '../data/nudge-constants';

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

// ─── Band- and Attention-Scaled Erosion (THR-773) ───────────────────

/** Inputs to the scaled-erosion formula. All optional but the outcome. */
export interface ScaledErosionInput {
  /** Resolved step outcome — only failing bands erode. */
  readonly outcome: StepOutcome;
  /** True when the failing encounter was attended (`story_beat`). */
  readonly attended?: boolean;
  /** Step difficulty, 0–1. Harder failures cost more. */
  readonly difficulty?: number;
  /** Current quintessence ratio, used to clamp at the floor. */
  readonly currentRatio?: number;
}

/**
 * Erosion amount for a failed encounter step, scaled by outcome band, whether
 * the player was watching, and how hard the step was (THR-773).
 *
 *     erosion = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION
 *               × bandMult × attendedMult × (1 + difficulty × DIFFICULTY_EROSION_SCALE)
 *
 * The result is clamped so the *resulting ratio* never falls below
 * `QUINTESSENCE_RATIO_FLOOR`. Erosion alone can therefore never reach zero —
 * death stays owned by the existing zero-state paths, and a catastrophe leaves a
 * mortal broken rather than dead.
 *
 * Pre-WS0 behavior is recovered exactly by setting the three multipliers to
 * 1 / 1 / 0: the formula collapses to the flat base constant.
 *
 * Fail-soft: a non-failing outcome erodes 0; missing difficulty reads as 0;
 * a missing ratio skips the clamp (nothing is known to clamp against).
 */
export function computeScaledErosion(input: ScaledErosionInput): number {
  const bandMult = EROSION_BAND_MULT[input.outcome] ?? 0;
  if (bandMult <= 0) return 0;

  const attendedMult = input.attended ? EROSION_ATTENDED_MULT : 1;
  const difficulty = Math.max(0, Math.min(1, input.difficulty ?? 0));
  const difficultyMult = 1 + difficulty * DIFFICULTY_EROSION_SCALE;

  const raw = QUINTESSENCE_ENCOUNTER_FAILURE_EROSION * bandMult * attendedMult * difficultyMult;

  if (input.currentRatio === undefined || !Number.isFinite(input.currentRatio)) return raw;

  // Clamp against the *ratio* floor, not the erosion amount: what matters is
  // where the mortal lands, not how far they fell.
  const headroom = input.currentRatio - QUINTESSENCE_RATIO_FLOOR;
  if (headroom <= 0) return 0; // already at or below the floor — erosion is spent
  return Math.min(raw, headroom);
}

/**
 * Social Leverage Engine — initial leverage computation for social scenes.
 *
 * Leverage is encounter-local state (0.0–1.0) that represents the social
 * advantage an actor holds over their target at the start of a scene.
 * It accumulates across steps and feeds into difficulty reduction on
 * key persuasion/pitch/resolution steps.
 *
 * Initial leverage comes from four sources:
 * - Bond strength (trust on relates_to edge)
 * - Wealth advantage (Gold capability ratio)
 * - Power advantage (Iron capability gap)
 * - Faction rank advantage (highest rank vs target's highest rank)
 *
 * ─── Constants ────────────────────────────────────────────────────
 * | Name                    | Default | Purpose                                      |
 * |-------------------------|---------|----------------------------------------------|
 * | LEVERAGE_BOND_BONUS     | 0.10    | Starting leverage from strong trust bond      |
 * | LEVERAGE_WEALTH_BONUS   | 0.08    | Starting leverage from wealth advantage       |
 * | LEVERAGE_WEALTH_RATIO   | 1.5     | Wealth must exceed target by this ratio       |
 * | LEVERAGE_POWER_BONUS    | 0.08    | Starting leverage from military power gap     |
 * | LEVERAGE_POWER_GAP      | 0.20    | Capability gap threshold for power advantage  |
 * | LEVERAGE_RANK_BONUS     | 0.05    | Starting leverage from higher faction rank    |
 * | LEVERAGE_RANK_GAP       | 0.30    | Rank difference threshold                     |
 * | LEVERAGE_INITIAL_CAP    | 0.30    | Maximum starting leverage                     |
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * | Failure case                | Fallback                              |
 * |-----------------------------|---------------------------------------|
 * | Actor node missing          | Return 0.0                            |
 * | Target node missing         | Return 0.0                            |
 * | No relates_to edge          | bond bonus = 0 (strangers)            |
 * | No member_of edges          | rank bonus = 0                        |
 * | No capability data          | computeCapability returns 0           |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — all leverage values are deterministic graph walks.
 */

import type { WorldGraph } from './graph';
import { getTrust } from './trustMechanics';
import { computeCapability } from './domainCapability';
import { STRONG_BOND_THRESHOLD } from '../data/agent-behavior-constants';

// ─── Tunable Constants ─────────────────────────────────────────────────────

/** Starting leverage bonus when actor has a strong trust bond with the target. */
export const LEVERAGE_BOND_BONUS = 0.10;

/** Starting leverage bonus when actor's Gold capability substantially exceeds target's. */
export const LEVERAGE_WEALTH_BONUS = 0.08;

/**
 * Wealth ratio threshold. Actor's Gold capability must be at least
 * (target × LEVERAGE_WEALTH_RATIO) to qualify for the bonus.
 */
export const LEVERAGE_WEALTH_RATIO = 1.5;

/** Starting leverage bonus when actor's Iron capability substantially exceeds target's. */
export const LEVERAGE_POWER_BONUS = 0.08;

/**
 * Minimum Iron capability gap required for the power advantage bonus.
 * Both capabilities are on the 0–1 normalized scale.
 */
export const LEVERAGE_POWER_GAP = 0.20;

/** Starting leverage bonus when actor's faction rank substantially exceeds target's. */
export const LEVERAGE_RANK_BONUS = 0.05;

/**
 * Minimum rank difference (normalized 0–1) required for the rank advantage bonus.
 * Raw rank values from member_of edges are normalized by RANK_NORMALIZATION_DIVISOR.
 */
export const LEVERAGE_RANK_GAP = 0.30;

/** Divisor to normalize raw rank numbers (typically 1–10) into 0–1 scale. */
const RANK_NORMALIZATION_DIVISOR = 10;

/**
 * Maximum starting leverage. Ensures actors can't skip directly to a decisive
 * victory just from pre-existing advantages — they must still work through the scene.
 */
export const LEVERAGE_INITIAL_CAP = 0.30;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Get the highest faction rank for an agent across all their memberships.
 * Reads `rank` from member_of edge properties (number, default 0).
 * Returns a normalized value in [0, 1].
 */
export function getHighestFactionRank(graph: WorldGraph, agentId: string): number {
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  if (memberEdges.length === 0) return 0;

  let highest = 0;
  for (const edge of memberEdges) {
    const rank = (edge.properties.rank as number) ?? 0;
    if (rank > highest) highest = rank;
  }

  return highest / RANK_NORMALIZATION_DIVISOR;
}

// ─── Main API ──────────────────────────────────────────────────────────────

/**
 * Compute the starting leverage for a social scene.
 *
 * Called by `initiateEncounter()` when the template is a social scene
 * (i.e. has any step with `leverageOnSuccess` defined).
 *
 * @param graph  Current world graph
 * @param actorId  The agent initiating the social scene
 * @param targetId  The target agent (required for social scenes)
 * @returns Initial leverage value clamped to [0, LEVERAGE_INITIAL_CAP]
 */
export function computeInitialLeverage(
  graph: WorldGraph,
  actorId: string,
  targetId: string,
): number {
  let leverage = 0.0;

  // ─── Bond strength ───────────────────────────────────────────────
  const trust = getTrust(graph, actorId, targetId);
  if (trust > STRONG_BOND_THRESHOLD) {
    leverage += LEVERAGE_BOND_BONUS;
  }

  // ─── Wealth advantage ────────────────────────────────────────────
  // Actor's Gold capability vs target's Gold capability (ratio check)
  const actorGold = computeCapability(graph, actorId, 'gold');
  const targetGold = computeCapability(graph, targetId, 'gold');
  if (targetGold > 0 && actorGold > targetGold * LEVERAGE_WEALTH_RATIO) {
    leverage += LEVERAGE_WEALTH_BONUS;
  } else if (targetGold === 0 && actorGold > 0) {
    // Actor has wealth, target has none — full bonus
    leverage += LEVERAGE_WEALTH_BONUS;
  }

  // ─── Power advantage ─────────────────────────────────────────────
  // Actor's Iron capability vs target's (absolute gap check)
  const actorIron = computeCapability(graph, actorId, 'iron');
  const targetIron = computeCapability(graph, targetId, 'iron');
  if (actorIron > targetIron + LEVERAGE_POWER_GAP) {
    leverage += LEVERAGE_POWER_BONUS;
  }

  // ─── Faction rank advantage ──────────────────────────────────────
  const actorRank = getHighestFactionRank(graph, actorId);
  const targetRank = getHighestFactionRank(graph, targetId);
  if (actorRank > targetRank + LEVERAGE_RANK_GAP) {
    leverage += LEVERAGE_RANK_BONUS;
  }

  // Clamp to cap — can't start with a dominant advantage
  return Math.min(leverage, LEVERAGE_INITIAL_CAP);
}

/**
 * Determine whether an encounter template uses the social leverage system.
 * True if any step has `leverageOnSuccess` defined.
 */
export function isSocialSceneTemplate(steps: ReadonlyArray<{ leverageOnSuccess?: number }>): boolean {
  return steps.some(s => s.leverageOnSuccess !== undefined);
}

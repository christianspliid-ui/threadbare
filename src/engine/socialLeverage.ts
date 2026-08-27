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
import { getFactionMembershipEdges } from './graphQueries';
import { getDerivedMembershipRank } from './factionReputation';
import type { LeverageHistoryEntry } from '../types/encounter';
import { getTrust } from './trustMechanics';
import { computeCapability } from './domainCapability';
import { reputationLeverageTerm } from './reputation';
import { STRONG_BOND_THRESHOLD, FACTION_RANK_MAX } from '../data/agent-behavior-constants';
import {
  SECRET_LEVERAGE_MULTIPLIER,
  FAVOR_LEVERAGE_MULTIPLIER,
} from '../types/secretsFavors';

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
 * Minimum rank difference (0–1) required for the rank advantage bonus.
 * `member_of.rank` is already on that scale, so the difference is read directly.
 */
export const LEVERAGE_RANK_GAP = 0.30;

/**
 * Maximum starting leverage. Ensures actors can't skip directly to a decisive
 * victory just from pre-existing advantages — they must still work through the scene.
 */
export const LEVERAGE_INITIAL_CAP = 0.30;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Get the highest faction rank for an agent across all their memberships.
 * Reads `rank` from member_of edge properties (number, default 0).
 * Returns a value in [0, 1].
 *
 * No normalization divisor (THR-1151): `member_of.rank` is declared 0 (recruit) to
 * 1 (leader) and every writer honours it, so the previous `/ 10` — justified by a
 * comment describing "raw rank numbers (typically 1–10)", a scale nothing has ever
 * written — squashed the maximum to 0.1. Against LEVERAGE_RANK_GAP of 0.30 that made
 * the rank advantage bonus unreachable for every agent in every world. Clamped rather
 * than divided, so a stray out-of-scale fixture cannot hand back more than the ceiling.
 */
export function getHighestFactionRank(graph: WorldGraph, agentId: string): number {
  const memberEdges = getFactionMembershipEdges(graph, agentId);
  if (memberEdges.length === 0) return 0;

  let highest = 0;
  for (const edge of memberEdges) {
    // THR-1177: filter by the target's shape rather than trusting every member_of edge.
    // `EDGE_SCHEMA` declares this family actor→actor — the narrowest NodeType can
    // express — so an individual→individual member_of is schema-legal, and this loop
    // used to read `rank` off it and let it win. A single such edge carrying a high
    // `rank` would hand its bearer a permanent leverage advantage sourced from a
    // membership in nothing. This is the reader-side guard because twelve writers mint
    // `member_of` and only one goes through `joinFaction` — and because worlds already
    // saved cannot be re-minted, so a writer-only fix would never reach them.
    //
    // Three node shapes count as a membership target, all three live in this repo:
    // `actor` + actorType faction, `actor` + actorType group (companies and armies),
    // and a bare `type: 'faction'` node (fixtures and the codex). Matching only the
    // first would silently zero the rank of every company member.
    const targetNode = graph.getNode(edge.target);
    const targetActorType = targetNode?.properties?.actorType;
    // `String(...)` because the bare shapes are off the `NodeType` union — comparing
    // the typed field to them directly is a TS "unintentional comparison" error.
    const targetNodeType = String(targetNode?.type ?? '');
    const isMembershipTarget = targetNodeType === 'faction'
      || targetNodeType === 'group'
      || targetActorType === 'faction'
      || targetActorType === 'group';
    if (!isMembershipTarget) continue;

    // THR-1211 item 3: derived from `reputation`, not read off the cached `rank`.
    // The two disagreed by construction at several mint sites, and one of them wrote
    // a string into this field. See `getDerivedMembershipRank`.
    const rank = getDerivedMembershipRank(edge);
    if (rank > highest) highest = rank;
  }

  return Math.max(0, Math.min(FACTION_RANK_MAX, highest));
}

// ─── Main API ──────────────────────────────────────────────────────────────

export interface InitialLeverageResult {
  leverage: number;
  history: LeverageHistoryEntry[];
}

/**
 * Compute the starting leverage for a social scene.
 *
 * Called by `initiateEncounter()` when the template is a social scene
 * (i.e. has any step with `leverageOnSuccess` defined).
 *
 * @param graph     Current world graph
 * @param actorId   The agent initiating the social scene
 * @param targetId  The target agent (required for social scenes)
 * @returns Initial leverage clamped to [0, LEVERAGE_INITIAL_CAP] and history entries
 */
export function computeInitialLeverage(
  graph: WorldGraph,
  actorId: string,
  targetId: string,
): InitialLeverageResult {
  let leverage = 0.0;
  const history: LeverageHistoryEntry[] = [];

  // ─── Bond strength ───────────────────────────────────────────────
  const trust = getTrust(graph, actorId, targetId);
  if (trust > STRONG_BOND_THRESHOLD) {
    leverage += LEVERAGE_BOND_BONUS;
    history.push({ stepIndex: -1, delta: LEVERAGE_BOND_BONUS, source: 'bond_bonus' });
  }

  // ─── Wealth advantage ────────────────────────────────────────────
  const actorGold = computeCapability(graph, actorId, 'gold');
  const targetGold = computeCapability(graph, targetId, 'gold');
  if (targetGold > 0 && actorGold > targetGold * LEVERAGE_WEALTH_RATIO) {
    leverage += LEVERAGE_WEALTH_BONUS;
    history.push({ stepIndex: -1, delta: LEVERAGE_WEALTH_BONUS, source: 'wealth_bonus' });
  } else if (targetGold === 0 && actorGold > 0) {
    leverage += LEVERAGE_WEALTH_BONUS;
    history.push({ stepIndex: -1, delta: LEVERAGE_WEALTH_BONUS, source: 'wealth_bonus' });
  }

  // ─── Power advantage ─────────────────────────────────────────────
  const actorIron = computeCapability(graph, actorId, 'iron');
  const targetIron = computeCapability(graph, targetId, 'iron');
  if (actorIron > targetIron + LEVERAGE_POWER_GAP) {
    leverage += LEVERAGE_POWER_BONUS;
    history.push({ stepIndex: -1, delta: LEVERAGE_POWER_BONUS, source: 'power_bonus' });
  }

  // ─── Faction rank advantage ──────────────────────────────────────
  const actorRank = getHighestFactionRank(graph, actorId);
  const targetRank = getHighestFactionRank(graph, targetId);
  if (actorRank > targetRank + LEVERAGE_RANK_GAP) {
    leverage += LEVERAGE_RANK_BONUS;
    history.push({ stepIndex: -1, delta: LEVERAGE_RANK_BONUS, source: 'rank_bonus' });
  }

  // ─── Secret bonus (THR-30) ───────────────────────────────────────
  // Actor holds an unrevealed secret about the target
  const secretEdges = graph.getOutgoingEdges(actorId, 'knows_secret_of')
    .filter(e => e.target === targetId && !(e.properties.revealed as boolean));
  if (secretEdges.length > 0) {
    const bestSecret = secretEdges.reduce((best, e) =>
      ((e.properties.magnitude as number) ?? 0) > ((best.properties.magnitude as number) ?? 0) ? e : best
    );
    const secretMagnitude = (bestSecret.properties.magnitude as number) ?? 0;
    const secretBonus = secretMagnitude * SECRET_LEVERAGE_MULTIPLIER;
    leverage += secretBonus;
    history.push({ stepIndex: -1, delta: secretBonus, source: 'secret_bonus' });
  }

  // ─── Favor bonus (THR-30) ────────────────────────────────────────
  // Target owes actor a favor
  const favorEdges = graph.getOutgoingEdges(targetId, 'owes_favor')
    .filter(e => e.target === actorId
      && !(e.properties.redeemed as boolean)
      && !(e.properties.broken as boolean));
  if (favorEdges.length > 0) {
    const bestFavor = favorEdges.reduce((best, e) =>
      ((e.properties.magnitude as number) ?? 0) > ((best.properties.magnitude as number) ?? 0) ? e : best
    );
    const favorMagnitude = (bestFavor.properties.magnitude as number) ?? 0;
    const favorBonus = favorMagnitude * FAVOR_LEVERAGE_MULTIPLIER;
    leverage += favorBonus;
    history.push({ stepIndex: -1, delta: favorBonus, source: 'favor_bonus' });
  }

  // ─── Reputation with the target (THR-1206) ───────────────────────
  // The director's definition doing its literal job: "the social score that modifies
  // interactions between a and b". Signed and centred on neutral, so standing that
  // has soured opens the scene behind — the other terms here are one-directional
  // bonuses, and a reputation that could only help would not be a reputation.
  //
  // Reads through `getReputationWith`, so a guild member's rank, a town's welcome and
  // a personal bond all reach the same opening through one call rather than three
  // bespoke terms that could disagree.
  const reputationTerm = reputationLeverageTerm(graph, actorId, targetId);
  if (reputationTerm !== 0) {
    leverage += reputationTerm;
    history.push({ stepIndex: -1, delta: reputationTerm, source: 'reputation_bonus' });
  }

  // Clamp to cap — can't start with a dominant advantage
  return { leverage: Math.min(leverage, LEVERAGE_INITIAL_CAP), history };
}

/**
 * Determine whether an encounter template uses the social leverage system.
 * True if any step has `leverageOnSuccess` defined.
 */
export function isSocialSceneTemplate(steps: ReadonlyArray<{ leverageOnSuccess?: number }>): boolean {
  return steps.some(s => s.leverageOnSuccess !== undefined);
}

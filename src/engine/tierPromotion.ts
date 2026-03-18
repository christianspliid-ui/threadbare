/**
 * Tier Promotion — narrative events when agents cross capability tier boundaries.
 *
 * When an agent's domain capability crosses a tier boundary (detected by
 * capabilityGrowth), this module grants a named trait signifier and bumps
 * faction rank for aligned factions.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                            | Default | Purpose                                  |
 * |---------------------------------|---------|------------------------------------------|
 * | FACTION_RANK_PER_PROMOTION      | 0.1     | Rank bump for primary-reach faction       |
 * | FACTION_RANK_SECONDARY_FRACTION | 0.05    | Rank bump for secondary-reach faction     |
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Promotion results are returned to the caller (encounter.ts) which emits
 * tier_promotion tick events. No independent trace emission here.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                              |
 * |---------------------------------|---------------------------------------|
 * | Missing agent node              | Return empty result                   |
 * | No trait for tier               | No trait granted, factions still bump  |
 * | No faction membership           | Empty factionRankChanges              |
 * | Missing faction node            | Skip that faction                     |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — promotion is fully deterministic.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';

// ─── Constants ──────────────────────────────────────────────────

/** Rank bump for factions whose primary reach matches the promoted domain */
export const FACTION_RANK_PER_PROMOTION = 0.1;

/** Rank bump for factions whose secondary reach matches the promoted domain */
export const FACTION_RANK_SECONDARY_FRACTION = 0.05;

// ─── Promotion Trait Table ──────────────────────────────────────

/** Named trait signifiers granted at even tiers per reach domain */
export const PROMOTION_TRAITS: Record<ReachDomain, Partial<Record<number, string>>> = {
  iron:   { 2: 'Blooded', 4: 'Forged in Battle', 6: 'Warblade', 8: 'Living Weapon', 10: 'Avatar of Iron' },
  gold:   { 2: 'Shrewd', 4: 'Merchant Prince', 6: 'Master of Coin', 8: 'Gilded Hand', 10: 'Avatar of Gold' },
  shadow: { 2: 'Cunning', 4: 'Master Spy', 6: 'Shadow Master', 8: 'Phantom', 10: 'Avatar of Shadow' },
  veil:   { 2: 'Touched', 4: 'Adept', 6: 'Archmage', 8: 'Weaver', 10: 'Avatar of Veil' },
  heart:  { 2: 'Kindhearted', 4: 'Devoted', 6: 'Beloved', 8: 'Sainted', 10: 'Avatar of Heart' },
  eye:    { 2: 'Perceptive', 4: 'Scholar', 6: 'Sage', 8: 'Oracle', 10: 'Avatar of Eye' },
  stone:  { 2: 'Stonehand', 4: 'Builder', 6: 'Architect', 8: 'Earthshaper', 10: 'Avatar of Stone' },
  star:   { 2: 'Faithful', 4: 'Consecrated', 6: 'Hierophant', 8: 'Exalted', 10: 'Avatar of Star' },
  flesh:  { 2: 'Hardy', 4: 'Ironflesh', 6: 'Unbreakable', 8: 'Deathless', 10: 'Avatar of Flesh' },
};

// ─── Result Types ───────────────────────────────────────────────

export interface PromotionResult {
  traitGranted?: string;
  factionRankChanges: Array<{ factionId: string; oldRank: number; newRank: number }>;
}

// ─── Promotion Handler ──────────────────────────────────────────

/**
 * Handle a tier crossing — grant a named trait signifier and bump faction rank.
 *
 * Called by encounter.ts when applyEncounterGrowth detects tierCrossed.
 * Fail-soft: missing agent → empty result.
 */
export function handleTierPromotion(
  graph: WorldGraph,
  agentId: string,
  domain: ReachDomain,
  newTier: number,
): PromotionResult {
  const emptyResult: PromotionResult = { factionRankChanges: [] };

  // Fail-soft: missing agent
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return emptyResult;

  const result: PromotionResult = { factionRankChanges: [] };

  // 1. Look up promotion trait for this domain + tier
  const traitName = PROMOTION_TRAITS[domain]?.[newTier];
  if (traitName) {
    // Create bestowed trait node
    const traitNodeId = `promotion_${domain}_t${newTier}_${agentId}`;
    const existingNode = graph.getNode(traitNodeId);

    if (!existingNode) {
      graph.addNode({
        id: traitNodeId,
        type: 'trait',
        name: traitName,
        properties: {
          subcategory: 'bestowed',
          description: `Earned by reaching tier ${newTier} in the ${domain} domain`,
          importance: 0.6,
          maxLevel: 1,
          visibility: 'public',
          domainContributions: {},
          tags: ['promotion', 'bestowed', domain, `tier_${newTier}`],
          flavorText: `A mark of mastery in the ways of ${domain}.`,
        },
      });

      graph.addEdge({
        id: `edge_promotion_${domain}_t${newTier}_${agentId}`,
        source: agentId,
        target: traitNodeId,
        type: 'has_trait',
        properties: {
          level: 1,
          acquiredTick: 0,
          lastReinforcedTick: 0,
          source: 'tier_promotion',
          visibility: 'public',
        },
      });
    }

    result.traitGranted = traitName;
  }

  // 2. Bump faction rank for aligned factions
  const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
  for (const edge of memberEdges) {
    const factionNode = graph.getNode(edge.target);
    if (!factionNode) continue;

    // Read faction's reach preferences
    const reachPreferences = factionNode.properties.reachPreferences as
      | Partial<Record<ReachDomain, number>>
      | undefined;
    if (!reachPreferences) continue;

    // Find the primary reach (highest value)
    let primaryReach: ReachDomain | undefined;
    let primaryValue = -Infinity;
    let secondaryReach: ReachDomain | undefined;
    let secondaryValue = -Infinity;

    for (const [reach, value] of Object.entries(reachPreferences)) {
      if ((value as number) > primaryValue) {
        secondaryReach = primaryReach;
        secondaryValue = primaryValue;
        primaryReach = reach as ReachDomain;
        primaryValue = value as number;
      } else if ((value as number) > secondaryValue) {
        secondaryReach = reach as ReachDomain;
        secondaryValue = value as number;
      }
    }

    // Determine rank bump
    let rankBump = 0;
    if (primaryReach === domain) {
      rankBump = FACTION_RANK_PER_PROMOTION;
    } else if (secondaryReach === domain) {
      rankBump = FACTION_RANK_SECONDARY_FRACTION;
    }

    if (rankBump > 0) {
      const oldRank = (edge.properties.rank as number) ?? 0;
      const newRank = oldRank + rankBump;

      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          rank: newRank,
        },
      });

      result.factionRankChanges.push({
        factionId: edge.target,
        oldRank,
        newRank,
      });
    }
  }

  return result;
}

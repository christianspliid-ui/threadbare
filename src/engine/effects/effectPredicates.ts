/**
 * Effect Predicates — shared condition evaluation for all effect handlers.
 *
 * Every primitive that takes a `condition` field uses this module to evaluate
 * whether the condition is met. One function, one context builder, shared
 * across resolution, tick, event, and query handlers.
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

import type { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import type { EffectPredicate, PredicateContext } from '../../types/effects';
import {
  HEALTH_LOW_THRESHOLD,
  HEALTH_HIGH_THRESHOLD,
} from '../../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Predicate Evaluation
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluate a single condition predicate against the current context.
 * Returns true if the condition is met, false otherwise.
 * Unknown predicates return false (fail-soft).
 */
export function evaluatePredicate(
  predicate: EffectPredicate,
  ctx: PredicateContext,
): boolean {
  // Simple predicates
  switch (predicate) {
    case 'in_combat': return ctx.inCombat;
    case 'in_social': return ctx.inSocial;
    case 'in_exploration': return ctx.inExploration;
    case 'in_mystical': return ctx.inMystical;
    case 'at_home_territory': return ctx.atHomeTerritory;
    case 'in_enemy_territory': return ctx.inEnemyTerritory;
    case 'in_wilderness': return ctx.inWilderness;
    case 'health_low': return ctx.healthLow;
    case 'health_high': return ctx.healthHigh;
    case 'alone': return ctx.alone;
    case 'outnumbered': return ctx.outnumbered;
    case 'near_water': return ctx.nearWater;
  }

  // Parameterized predicates
  if (predicate.startsWith('biome:')) {
    const biomeType = predicate.slice('biome:'.length);
    return ctx.biome === biomeType;
  }
  if (predicate.startsWith('has_trait:')) {
    const tag = predicate.slice('has_trait:'.length);
    return ctx.agentTraits.has(tag);
  }
  if (predicate.startsWith('lacks_trait:')) {
    const tag = predicate.slice('lacks_trait:'.length);
    return !ctx.agentTraits.has(tag);
  }
  if (predicate.startsWith('reach_above:')) {
    const parts = predicate.slice('reach_above:'.length).split(':');
    if (parts.length < 2) return false;
    const reach = parts[0] as ReachDomain;
    const threshold = parseFloat(parts[1]);
    if (isNaN(threshold)) return false;
    return (ctx.reachValues[reach] ?? 0) > threshold;
  }
  if (predicate.startsWith('faction_rank:')) {
    const minRank = parseInt(predicate.slice('faction_rank:'.length), 10);
    if (isNaN(minRank)) return false;
    return ctx.factionRank >= minRank;
  }

  // Unknown predicate — fail-soft: treat as false
  return false;
}

/**
 * Evaluate an optional condition. Returns true if no condition is specified.
 * Fail-soft: if a condition exists but no context is available, returns false
 * (skip the effect rather than crashing on undefined context).
 */
export function evaluateOptionalCondition(
  condition: EffectPredicate | undefined,
  ctx?: PredicateContext,
): boolean {
  if (!condition) return true;
  if (!ctx) return false; // fail-soft: can't evaluate condition without context
  return evaluatePredicate(condition, ctx);
}

// ═══════════════════════════════════════════════════════════════════
// Context Builder
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a PredicateContext from graph state for a given agent.
 * Used by encounter resolution and other systems that need to evaluate
 * conditional effects.
 */
export function buildPredicateContext(
  graph: WorldGraph,
  agentId: string,
  stepReach?: ReachDomain,
  encounterType?: string,
): PredicateContext {
  const agentNode = graph.getNode(agentId);

  // Determine encounter type flags
  const inCombat = stepReach === 'iron' || encounterType === 'combat';
  const inSocial = stepReach === 'heart' || stepReach === 'gold' || encounterType === 'social';
  const inExploration = stepReach === 'eye' || stepReach === 'stone' || encounterType === 'exploration';
  const inMystical = stepReach === 'veil' || stepReach === 'star' || encounterType === 'mystical';

  // Resolve agent hex via located_at → parent location → hex
  let hexCol = -1;
  let hexRow = -1;
  let biome = 'unknown';

  const locatedAtEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locatedAtEdges.length > 0) {
    const locationNode = graph.getNode(locatedAtEdges[0].target);
    if (locationNode) {
      hexCol = (locationNode.properties.hexCol as number) ?? -1;
      hexRow = (locationNode.properties.hexRow as number) ?? -1;
      biome = (locationNode.properties.terrain as string) ?? 'unknown';

      // If sublocation, resolve up to parent location
      if (hexCol === -1 && locationNode.properties.parentLocationId) {
        const parentId = locationNode.properties.parentLocationId as string;
        const parentNode = graph.getNode(parentId);
        if (parentNode) {
          hexCol = (parentNode.properties.hexCol as number) ?? -1;
          hexRow = (parentNode.properties.hexRow as number) ?? -1;
          biome = (parentNode.properties.terrain as string) ?? biome;
        }
      }
    }
  }

  // Territory status
  const agentFaction = agentNode?.properties.factionId as string | undefined;
  let atHomeTerritory = false;
  let inEnemyTerritory = false;
  let inWilderness = true;

  if (agentFaction && hexCol >= 0) {
    const locationEdges = graph.getOutgoingEdges(agentId, 'located_at');
    for (const le of locationEdges) {
      const locNode = graph.getNode(le.target);
      if (!locNode) continue;
      const controllingFaction = locNode.properties.controllingFactionId as string | undefined;
      if (controllingFaction) {
        inWilderness = false;
        if (controllingFaction === agentFaction) {
          atHomeTerritory = true;
        } else {
          inEnemyTerritory = true;
        }
      }
    }
  }

  // Health status
  const doom = (agentNode?.properties.doom as number) ?? 0;
  const maxDoom = (agentNode?.properties.maxDoom as number) ?? 100;
  const doomFraction = maxDoom > 0 ? doom / maxDoom : 0;
  const healthLow = doomFraction >= HEALTH_LOW_THRESHOLD;
  const healthHigh = doomFraction <= HEALTH_HIGH_THRESHOLD;

  // Alone / outnumbered — check co-located agents
  const allyCount = 0;
  const enemyCount = 0;
  const alone = allyCount === 0 && enemyCount === 0;
  const outnumbered = enemyCount > (allyCount + 1);

  // Near water
  const nearWater = biome === 'coastal' || biome === 'river' || biome === 'lake'
    || biome === 'swamp' || biome === 'archipelago';

  // Agent traits
  const agentTraits = new Set<string>();
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const te of traitEdges) {
    const traitNode = graph.getNode(te.target);
    if (!traitNode) continue;
    const tags = traitNode.properties.tags as string[] | undefined;
    if (tags) {
      for (const tag of tags) agentTraits.add(tag);
    }
    const traitName = traitNode.properties.name as string | undefined;
    if (traitName) agentTraits.add(traitName);
  }

  // Reach values
  const reachValues: Partial<Record<ReachDomain, number>> = {};
  const domainCapability = agentNode?.properties.domainCapability as
    Partial<Record<ReachDomain, number>> | undefined;
  if (domainCapability) {
    for (const [key, val] of Object.entries(domainCapability)) {
      reachValues[key as ReachDomain] = val;
    }
  }

  // Faction rank
  const factionRank = (agentNode?.properties.factionRank as number) ?? 0;

  return {
    inCombat,
    inSocial,
    inExploration,
    inMystical,
    atHomeTerritory,
    inEnemyTerritory,
    inWilderness,
    healthLow,
    healthHigh,
    alone,
    outnumbered,
    nearWater,
    biome,
    agentTraits,
    reachValues,
    factionRank,
  };
}

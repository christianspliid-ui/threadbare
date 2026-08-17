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
import type { HiddenMark, IntelligenceRecord } from '../../types/unifiedAction';
import {
  HEALTH_LOW_THRESHOLD,
  HEALTH_HIGH_THRESHOLD,
  OUTNUMBERED_MARGIN,
} from '../../data/effect-constants';
import { DEFAULT_REPUTATION } from '../../types/disposition';
import { collectBearerTraitRefs } from '../traitRefIndex';
import { classifyCoLocatedActor } from './actorClassification';

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
    // THR-1144 — `parseFloat`, not `parseInt`. `member_of.rank` is canonically
    // 0 (recruit) → 1 (leader), so integer parsing left authors exactly two
    // usable thresholds (0 = everyone, 1 = leader only) on a continuous scale.
    // `parseFloat('2')` is still 2, so no previously-authored predicate changes
    // meaning — and none existed, because the gate was dead (see the context
    // builder below).
    const minRank = parseFloat(predicate.slice('faction_rank:'.length));
    if (isNaN(minRank)) return false;
    return ctx.factionRank >= minRank;
  }

  // THR-116: aftermath conditional predicate extensions
  if (predicate.startsWith('has_mark:')) {
    const category = predicate.slice('has_mark:'.length);
    return ctx.hiddenMarkCategories.has(category);
  }
  if (predicate.startsWith('has_intel:')) {
    const category = predicate.slice('has_intel:'.length);
    return ctx.intelCategories.has(category);
  }
  if (predicate.startsWith('reputation_above:')) {
    const threshold = parseFloat(predicate.slice('reputation_above:'.length));
    if (isNaN(threshold)) return false;
    return ctx.reputationScore > threshold;
  }
  if (predicate.startsWith('reputation_below:')) {
    const threshold = parseFloat(predicate.slice('reputation_below:'.length));
    if (isNaN(threshold)) return false;
    return ctx.reputationScore < threshold;
  }
  if (predicate.startsWith('faction_controls:')) {
    const locationId = predicate.slice('faction_controls:'.length);
    return ctx.controlledLocations.has(locationId);
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
 *
 * @param hiddenMarks - Optional GameState.hiddenMarks (needed for has_mark: predicates, THR-116)
 * @param intelligenceRecords - Optional GameState.intelligenceRecords (needed for has_intel: predicates, THR-116)
 */
export function buildPredicateContext(
  graph: WorldGraph,
  agentId: string,
  stepReach?: ReachDomain,
  encounterType?: string,
  hiddenMarks?: readonly HiddenMark[],
  intelligenceRecords?: readonly IntelligenceRecord[],
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

  // Alone / outnumbered — count co-located allies/enemies at the actor's
  // most-specific located_at node (strict same-node equality; see THR-144).
  let allyCount = 0;
  let enemyCount = 0;
  if (locatedAtEdges.length > 0) {
    const locationId = locatedAtEdges[0].target;
    const coLocatedEdges = graph.getIncomingEdges(locationId, 'located_at');
    for (const edge of coLocatedEdges) {
      if (edge.source === agentId) continue;
      const align = classifyCoLocatedActor(graph, agentId, edge.source);
      if (align === 'ally') allyCount++;
      else if (align === 'enemy') enemyCount++;
    }
  }
  const alone = allyCount === 0 && enemyCount === 0;
  const outnumbered = enemyCount > (allyCount + OUTNUMBERED_MARGIN);

  // Near water
  const nearWater = biome === 'coastal' || biome === 'river' || biome === 'lake'
    || biome === 'swamp' || biome === 'archipelago';

  // Agent traits (THR-786). Built from the shared ref walk so `has_trait:`/
  // `lacks_trait:` sugar accepts every ref form the rest of the engine accepts —
  // tag, display name, trait node id, and short id.
  //
  // Additive at set-build time by design: the predicate check downstream stays a
  // plain `Set.has` with no graph access, exactly as before. Two changes in what
  // lands in the set:
  //   - trait node ids and short ids are new (widening; no shipped content names them)
  //   - the display name now resolves. This site read `traitNode.properties.name`,
  //     but every authored trait carries its name at the *node* level with no
  //     `properties.name` — so the display-name union this site always intended has
  //     never fired. Same dead-read family as THR-787's category/subcategory.
  //
  // Item-granted keys are deliberately NOT unioned here. This site never consulted
  // them, the plan asks only for the resolved-id union, and reaching
  // `collectGrantedTraits` from this module would close an import cycle
  // (`effectQueries` already imports this file for `evaluateOptionalCondition`).
  const agentTraits = new Set<string>(collectBearerTraitRefs(graph, agentId).keys());

  // Reach values
  const reachValues: Partial<Record<ReachDomain, number>> = {};
  const domainCapability = agentNode?.properties.domainCapability as
    Partial<Record<ReachDomain, number>> | undefined;
  if (domainCapability) {
    for (const [key, val] of Object.entries(domainCapability)) {
      reachValues[key as ReachDomain] = val;
    }
  }

  // Faction rank (THR-1144 — gate revival).
  //
  // This site read `agentNode.properties.factionRank`, which **nothing in the
  // engine writes**. `ctx.factionRank` was therefore permanently 0 and every
  // `faction_rank:` predicate permanently false — the dead gate THR-805 found
  // and declined to build on. Rank has always lived on the `member_of` *edge*
  // (`MemberOfEdgeProperties.rank`, 0 = recruit → 1 = leader); that is what
  // `tierPromotion`, `socialLeverage` and the faction join/promotion outcomes
  // all write, and now what `membership_change.rank_delta` writes too.
  //
  // Highest rank across all memberships, matching `getHighestFactionRank`'s
  // convention in `socialLeverage` — a captain in one guild is a captain when
  // a scene asks, regardless of which other rolls they are on.
  //
  // Fail-soft on shape: some `member_of` edges (armies, bands) carry a *string*
  // rank like `'war_chief'`, which is not on this scale and contributes 0
  // rather than `NaN`-poisoning the comparison. The node property is kept as a
  // fallback so a future writer of it still resolves, but the edge wins.
  let factionRank = 0;
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    const raw = edge.properties?.rank;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    if (raw > factionRank) factionRank = raw;
  }
  if (factionRank === 0) {
    const nodeRank = agentNode?.properties.factionRank;
    if (typeof nodeRank === 'number' && Number.isFinite(nodeRank)) factionRank = nodeRank;
  }

  // THR-116: hidden mark categories for this agent
  const hiddenMarkCategories = new Set<string>();
  if (hiddenMarks) {
    for (const mark of hiddenMarks) {
      if (mark.targetAgentId === agentId) {
        hiddenMarkCategories.add(mark.category);
      }
    }
  }

  // THR-116: intelligence categories held by this agent
  const intelCategories = new Set<string>();
  if (intelligenceRecords) {
    for (const rec of intelligenceRecords) {
      if (rec.agentId === agentId) {
        intelCategories.add(rec.category);
      }
    }
  }

  // THR-116: agent's reputation score
  const reputationScore = (agentNode?.properties.reputationScore as number | undefined) ?? DEFAULT_REPUTATION;

  // THR-116: location IDs controlled by this agent's faction
  const controlledLocations = new Set<string>();
  if (agentFaction) {
    const controlEdges = graph.getOutgoingEdges(agentFaction, 'controls');
    for (const ce of controlEdges) {
      controlledLocations.add(ce.target);
    }
  }

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
    allyCount,
    enemyCount,
    alone,
    outnumbered,
    nearWater,
    biome,
    agentTraits,
    reachValues,
    factionRank,
    hiddenMarkCategories,
    intelCategories,
    reputationScore,
    controlledLocations,
  };
}

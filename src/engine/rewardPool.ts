/**
 * Reward Pool Assembly, Drawing, and Instantiation.
 *
 * Given a RewardPoolRecipe, queries the graph for matching attachment
 * candidates, applies tier curve weighting, and produces a weighted pool.
 * After drawing, instantiateReward clones the template node and creates
 * the appropriate edge (possesses or has_trait) for the recipient agent.
 */

import type { WorldGraph } from './graph';
import type {
  ResolvedRewardRecipe,
  RewardPoolRecipe,
  AttachmentTier,
  AttachmentCategory,
} from '../types/attachments';
import type { OutcomeType } from '../types/resolution';

export interface PoolEntry {
  nodeId: string;
  weight: number;
}

/**
 * Map category to graph node search.
 */
function getCandidateNodes(
  graph: WorldGraph,
  category: AttachmentCategory,
  tagFilters?: string[],
): Array<{ id: string; tier: number }> {
  let nodeType: 'artifact' | 'artifact_legendary' | 'trait';
  let subcategoryFilter: string | undefined;

  switch (category) {
    case 'possession':
      nodeType = 'artifact';
      break;
    case 'condition':
    case 'blessing':
    case 'curse':
      nodeType = 'trait';
      subcategoryFilter = 'condition';
      break;
    case 'bestowed_power':
      nodeType = 'trait';
      subcategoryFilter = 'bestowed';
      break;
    case 'agreement':
      return []; // agreements are edges, not nodes
    default:
      return [];
  }

  let nodes = graph.getNodesByType(nodeType);

  if (subcategoryFilter) {
    nodes = nodes.filter(n => n.properties.subcategory === subcategoryFilter);
  }

  if (tagFilters && tagFilters.length > 0) {
    nodes = nodes.filter(n => {
      const tags = n.properties.tags as string[] | undefined;
      if (!tags) return false;
      return tagFilters.every(t => tags.includes(t));
    });
  }

  return nodes.map(n => ({
    id: n.id,
    tier: (n.properties.tier as number) ?? 1,
  }));
}

/**
 * Assemble a weighted pool. Each candidate's weight = categoryWeight × tierCurve[tier].
 */
export function assembleRewardPool(
  graph: WorldGraph,
  recipe: ResolvedRewardRecipe,
): PoolEntry[] {
  const pool: PoolEntry[] = [];

  for (const [category, categoryWeight] of Object.entries(recipe.categoryWeights)) {
    if (!categoryWeight || categoryWeight <= 0) continue;

    const candidates = getCandidateNodes(
      graph,
      category as AttachmentCategory,
      recipe.tagFilters,
    );

    for (const candidate of candidates) {
      const tierWeight = recipe.tierCurve[candidate.tier as AttachmentTier] ?? 0;
      const weight = categoryWeight * tierWeight;
      if (weight > 0) {
        pool.push({ nodeId: candidate.id, weight });
      }
    }
  }

  return pool;
}

/**
 * Draw from weighted pool using deterministic roll (0.0–1.0).
 */
export function drawFromPool(
  pool: PoolEntry[],
  roll: number,
): string | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight <= 0) return null;

  const target = roll * totalWeight;
  let cumulative = 0;

  for (const entry of pool) {
    cumulative += entry.weight;
    if (target < cumulative) {
      return entry.nodeId;
    }
  }

  return pool[pool.length - 1].nodeId;
}

// ─── Tier Curves by Resolution Outcome ─────────────────────────────────

export const TIER_CURVE_CRITICAL_SUCCESS: Record<AttachmentTier, number> = { 1: 0.10, 2: 0.40, 3: 0.40, 4: 0.10 };
export const TIER_CURVE_SUCCESS: Record<AttachmentTier, number> = { 1: 0.40, 2: 0.40, 3: 0.15, 4: 0.05 };
export const TIER_CURVE_FAILURE: Record<AttachmentTier, number> = { 1: 0.20, 2: 0.10, 3: 0.05, 4: 0.0 };
export const TIER_CURVE_CRITICAL_FAILURE: Record<AttachmentTier, number> = { 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.0 };

export const BAD_OUTCOME_CHANCE_CRIT_SUCCESS = 0.0;
export const BAD_OUTCOME_CHANCE_SUCCESS = 0.05;
export const BAD_OUTCOME_CHANCE_FAILURE = 0.65;
export const BAD_OUTCOME_CHANCE_CRIT_FAILURE = 0.85;

/** Bad outcome category weights — harmful attachments for failed draws */
export const BAD_OUTCOME_CATEGORY_WEIGHTS: Partial<Record<AttachmentCategory, number>> = {
  condition: 0.60,
  curse: 0.30,
  blessing: 0.10,
};

/** Reward node ID prefix */
export const REWARD_INSTANTIATE_PREFIX = 'reward';

/** Source tag for reward-created edges */
export const REWARD_EDGE_SOURCE = 'encounter_reward';

/** Default ticks for condition duration when not specified on template */
export const REWARD_CONDITION_DEFAULT_TICKS = 15;

/**
 * Map resolution outcome quality to tier curve and bad outcome chance.
 */
export function getTierCurveForOutcome(outcomeType: OutcomeType): {
  tierCurve: Record<AttachmentTier, number>;
  badOutcomeChance: number;
} {
  switch (outcomeType) {
    case 'critical_success':
      return { tierCurve: TIER_CURVE_CRITICAL_SUCCESS, badOutcomeChance: BAD_OUTCOME_CHANCE_CRIT_SUCCESS };
    case 'success':
      return { tierCurve: TIER_CURVE_SUCCESS, badOutcomeChance: BAD_OUTCOME_CHANCE_SUCCESS };
    case 'failure':
      return { tierCurve: TIER_CURVE_FAILURE, badOutcomeChance: BAD_OUTCOME_CHANCE_FAILURE };
    case 'critical_failure':
      return { tierCurve: TIER_CURVE_CRITICAL_FAILURE, badOutcomeChance: BAD_OUTCOME_CHANCE_CRIT_FAILURE };
  }
}

/**
 * Combine a template-level recipe with outcome-determined tier curve and bad outcome chance.
 */
export function resolveRewardRecipe(
  templateRecipe: RewardPoolRecipe,
  outcomeType: OutcomeType,
): ResolvedRewardRecipe {
  const { tierCurve, badOutcomeChance } = getTierCurveForOutcome(outcomeType);
  return {
    ...templateRecipe,
    tierCurve,
    badOutcomeChance,
  };
}

// ─── Reward Instantiation ──────────────────────────────────────────────

export interface InstantiateRewardResult {
  instanceId: string;
  edgeId: string;
  /** 'possession' | 'condition' | 'bestowed' — determines edge type */
  category: 'possession' | 'condition' | 'bestowed';
}

/**
 * Clone a template node and create the appropriate edge to the recipient agent.
 * Returns null if template or agent node is missing.
 *
 * Edge types:
 * - artifact → `possesses` edge with modifiers/grants/tags
 * - trait (subcategory: 'condition') → `has_trait` edge with ticksRemaining
 * - trait (subcategory: 'bestowed') → `has_trait` edge, permanent (no expiry)
 */
export function instantiateReward(
  graph: WorldGraph,
  templateNodeId: string,
  recipientAgentId: string,
  tick: number,
): InstantiateRewardResult | null {
  const template = graph.getNode(templateNodeId);
  if (!template) return null;

  const agent = graph.getNode(recipientAgentId);
  if (!agent) return null;

  const instanceId = `${REWARD_INSTANTIATE_PREFIX}_${recipientAgentId}_${tick}_${templateNodeId}`;

  // Clone node with new ID and reward metadata
  graph.addNode({
    id: instanceId,
    type: template.type,
    name: template.name,
    properties: {
      ...template.properties,
      source: REWARD_EDGE_SOURCE,
      acquiredTick: tick,
    },
  });

  const edgeId = `${instanceId}_edge`;
  const subcategory = template.properties.subcategory as string | undefined;

  if (template.type === 'artifact' || template.type === 'artifact_legendary') {
    // Possession → possesses edge
    const reachBonus = template.properties.reachBonus as Record<string, number> | undefined;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'possesses',
      properties: {
        modifiers: reachBonus ?? {},
        grants: [],
        tags: (template.properties.tags as string[]) ?? [],
      },
    });
    return { instanceId, edgeId, category: 'possession' };
  }

  if (template.type === 'trait' && subcategory === 'bestowed') {
    // Bestowed power → has_trait edge, permanent
    const domainContributions = template.properties.domainContributions as Record<string, number> | undefined;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        ticksRemaining: null,
        source: REWARD_EDGE_SOURCE,
        visibility: template.properties.visibility ?? 'public',
        modifiers: domainContributions ?? {},
      },
    });
    return { instanceId, edgeId, category: 'bestowed' };
  }

  if (template.type === 'trait') {
    // Condition (wound/blessing/curse/disease) → has_trait edge with expiry
    const domainContributions = template.properties.domainContributions as Record<string, number> | undefined;
    const totalTicks = (template.properties.ticksRemaining as number | undefined) ?? REWARD_CONDITION_DEFAULT_TICKS;
    graph.addEdge({
      id: edgeId,
      source: recipientAgentId,
      target: instanceId,
      type: 'has_trait',
      properties: {
        level: 1,
        acquiredTick: tick,
        ticksRemaining: totalTicks,
        totalTicks,
        source: REWARD_EDGE_SOURCE,
        visibility: template.properties.visibility ?? 'public',
        modifiers: domainContributions ?? {},
      },
    });
    return { instanceId, edgeId, category: 'condition' };
  }

  // Unknown node type — skip
  return null;
}

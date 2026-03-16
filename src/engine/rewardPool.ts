/**
 * Reward Pool Assembly and Drawing.
 *
 * Given a RewardPoolRecipe, queries the graph for matching attachment
 * candidates, applies tier curve weighting, and produces a weighted pool.
 */

import type { WorldGraph } from './graph';
import type {
  RewardPoolRecipe,
  AttachmentTier,
  AttachmentCategory,
} from '../types/attachments';

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
  recipe: RewardPoolRecipe,
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

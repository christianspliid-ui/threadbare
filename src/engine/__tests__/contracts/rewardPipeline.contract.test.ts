/**
 * Contract test: Reward Pipeline
 *
 * Verifies the full chain:
 * template recipe → resolveRewardRecipe → assembleRewardPool → drawFromPool → instantiateReward
 *
 * Uses real catalog data and real graph operations — no mocks.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  assembleRewardPool,
  drawFromPool,
  instantiateReward,
  resolveRewardRecipe,
} from '../../rewardPool';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../../../data/reward-attachment-catalog';
import type { RewardPoolRecipe } from '../../../types/attachments';

describe('reward pipeline contract', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Add agent
    graph.addNode({
      id: 'agent_test',
      type: 'actor',
      name: 'Test Agent',
      properties: {},
    });

    // Add real catalog templates
    for (const node of REWARD_POSSESSIONS) graph.addNode(node);
    for (const node of REWARD_CONDITIONS) graph.addNode(node);
    for (const node of REWARD_BESTOWED_POWERS) graph.addNode(node);
  });

  it('full pipeline: template recipe → resolve → assemble → draw → instantiate (success)', () => {
    const templateRecipe: RewardPoolRecipe = {
      categoryWeights: { possession: 0.8, condition: 0.2 },
    };

    // Resolve with success outcome
    const resolved = resolveRewardRecipe(templateRecipe, 'success');
    expect(resolved.tierCurve).toBeDefined();
    expect(resolved.badOutcomeChance).toBe(0.05);

    // Assemble pool from real catalog
    const pool = assembleRewardPool(graph, resolved);
    expect(pool.length).toBeGreaterThan(0);

    // Draw deterministically
    const templateId = drawFromPool(pool, 0.3);
    expect(templateId).not.toBeNull();

    // Instantiate
    const result = instantiateReward(graph, templateId!, 'agent_test', 10);
    expect(result).not.toBeNull();

    // Verify the agent now has an edge to the instantiated node
    const edges = graph.getOutgoingEdges('agent_test');
    const rewardEdge = edges.find(e => e.target === result!.instanceId);
    expect(rewardEdge).toBeDefined();
    expect(['possesses', 'has_trait']).toContain(rewardEdge!.type);
  });

  it('full pipeline: critical failure → bad outcome → condition/curse drawn', () => {
    const templateRecipe: RewardPoolRecipe = {
      categoryWeights: { possession: 0.8, condition: 0.2 },
    };

    const resolved = resolveRewardRecipe(templateRecipe, 'critical_failure');
    expect(resolved.badOutcomeChance).toBe(0.85);

    // Simulate bad outcome by using the bad outcome category weights
    const badRecipe = {
      ...resolved,
      categoryWeights: { condition: 0.60, curse: 0.30, blessing: 0.10 },
    };

    const pool = assembleRewardPool(graph, badRecipe);
    expect(pool.length).toBeGreaterThan(0);

    // All pool entries should be condition traits (from the condition/curse/blessing categories)
    for (const entry of pool) {
      const node = graph.getNode(entry.nodeId);
      expect(node).toBeDefined();
      expect(node!.type).toBe('trait');
    }

    const templateId = drawFromPool(pool, 0.5);
    expect(templateId).not.toBeNull();

    const result = instantiateReward(graph, templateId!, 'agent_test', 20);
    expect(result).not.toBeNull();
    expect(['condition', 'bestowed']).toContain(result!.category);
  });

  it('template node is not consumed — can be drawn again', () => {
    const resolved = resolveRewardRecipe(
      { categoryWeights: { possession: 1.0 } },
      'success',
    );

    const pool = assembleRewardPool(graph, resolved);
    const templateId = drawFromPool(pool, 0.1);
    expect(templateId).not.toBeNull();

    // First instantiation
    const r1 = instantiateReward(graph, templateId!, 'agent_test', 1);
    expect(r1).not.toBeNull();

    // Template still exists and can be used again
    const template = graph.getNode(templateId!);
    expect(template).toBeDefined();

    // Second instantiation at different tick
    const r2 = instantiateReward(graph, templateId!, 'agent_test', 2);
    expect(r2).not.toBeNull();
    expect(r1!.instanceId).not.toBe(r2!.instanceId);
  });

  it('bestowed power category draws from real bestowed templates', () => {
    const resolved = resolveRewardRecipe(
      { categoryWeights: { bestowed_power: 1.0 } },
      'critical_success',
    );

    const pool = assembleRewardPool(graph, resolved);
    expect(pool.length).toBeGreaterThan(0);

    // All entries should be bestowed trait templates
    for (const entry of pool) {
      const node = graph.getNode(entry.nodeId);
      expect(node!.type).toBe('trait');
      expect(node!.properties.subcategory).toBe('bestowed');
    }

    const templateId = drawFromPool(pool, 0.5);
    const result = instantiateReward(graph, templateId!, 'agent_test', 5);
    expect(result!.category).toBe('bestowed');

    // Bestowed powers have null ticksRemaining (permanent)
    const edge = graph.getEdge(result!.edgeId);
    expect(edge!.properties.ticksRemaining).toBeNull();
  });

  it('empty pool when no matching templates exist', () => {
    // Agreements return empty (edges, not nodes)
    const resolved = resolveRewardRecipe(
      { categoryWeights: { agreement: 1.0 } },
      'success',
    );

    const pool = assembleRewardPool(graph, resolved);
    expect(pool.length).toBe(0);

    const drawn = drawFromPool(pool, 0.5);
    expect(drawn).toBeNull();
  });

  it('bad outcome with thematic tagFilters still draws conditions when tagFilters cleared', () => {
    // Regression: orchestrator was spreading tagFilters into bad-outcome recipe,
    // making the pool empty when no conditions matched the thematic tag (e.g. '#ancient').
    // Fix: tagFilters: undefined on bad-outcome branch.
    const templateRecipe: RewardPoolRecipe = {
      categoryWeights: { possession: 0.4, bestowed_power: 0.4, condition: 0.2 },
      tagFilters: ['#ancient'], // thematic filter that no conditions carry
    };
    const resolved = resolveRewardRecipe(templateRecipe, 'failure');

    // Simulate the old (broken) bad-outcome recipe — tagFilters retained
    const brokenBadRecipe = {
      ...resolved,
      categoryWeights: { condition: 0.60, curse: 0.30, blessing: 0.10 },
    };
    const brokenPool = assembleRewardPool(graph, brokenBadRecipe);
    expect(brokenPool.length).toBe(0); // no conditions tagged #ancient → empty

    // Simulate the fixed bad-outcome recipe — tagFilters cleared
    const fixedBadRecipe = {
      ...resolved,
      categoryWeights: { condition: 0.60, curse: 0.30, blessing: 0.10 },
      tagFilters: undefined,
    };
    const fixedPool = assembleRewardPool(graph, fixedBadRecipe);
    expect(fixedPool.length).toBeGreaterThan(0); // full condition catalog available

    // Verify a condition can be drawn and instantiated
    const templateId = drawFromPool(fixedPool, 0.5);
    expect(templateId).not.toBeNull();
    const result = instantiateReward(graph, templateId!, 'agent_test', 31);
    expect(result).not.toBeNull();
    expect(result!.category).toBe('condition');

    // Verify it's attached to the agent with ticksRemaining
    const edge = graph.getEdge(result!.edgeId);
    expect(edge!.type).toBe('has_trait');
    expect(edge!.properties.ticksRemaining).toBeGreaterThan(0);
  });

  it('tag filters narrow the pool to matching templates', () => {
    const resolvedAll = resolveRewardRecipe(
      { categoryWeights: { possession: 1.0 } },
      'success',
    );
    const poolAll = assembleRewardPool(graph, resolvedAll);

    const resolvedFiltered = resolveRewardRecipe(
      { categoryWeights: { possession: 1.0 }, tagFilters: ['#iron', '#weapon'] },
      'success',
    );
    const poolFiltered = assembleRewardPool(graph, resolvedFiltered);

    // Filtered pool should be smaller than unfiltered
    expect(poolFiltered.length).toBeLessThan(poolAll.length);
    expect(poolFiltered.length).toBeGreaterThan(0);
  });
});

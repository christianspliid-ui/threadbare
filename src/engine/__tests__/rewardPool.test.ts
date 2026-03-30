import { describe, it, expect, beforeEach } from 'vitest';
import { assembleRewardPool, drawFromPool } from '../rewardPool';
import { WorldGraph } from '../graph';
import type { ResolvedRewardRecipe } from '../../types/attachments';

describe('rewardPool', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Test fixtures: common artifacts with different tiers and tags
    graph.addNode({
      id: 'sword.iron',
      type: 'artifact',
      name: 'Iron Sword',
      properties: {
        subcategory: 'arms',
        tier: 1,
        tags: ['iron', 'weapon'],
        mechanicalSummary: '+Iron, grants slash',
        lossCondition: 'breakable',
      },
    });

    graph.addNode({
      id: 'shield.oak',
      type: 'artifact',
      name: 'Oak Shield',
      properties: {
        subcategory: 'arms',
        tier: 1,
        tags: ['iron', 'armor'],
        mechanicalSummary: '+Iron, grants parry',
        lossCondition: 'permanent',
      },
    });

    graph.addNode({
      id: 'tome.secrets',
      type: 'artifact',
      name: 'Tome of Secrets',
      properties: {
        subcategory: 'tomes_scrolls',
        tier: 2,
        tags: ['eye', 'tome'],
        mechanicalSummary: '+Eye, grants scry',
        lossCondition: 'stealable',
      },
    });

    // Test fixture: condition trait (subcategory: 'condition')
    graph.addNode({
      id: 'condition.blessed',
      type: 'trait',
      name: 'Blessed',
      properties: {
        subcategory: 'condition',
        tier: 1,
        tags: ['blessing', 'star'],
        mechanicalSummary: '+Star, grants light_aura',
      },
    });
  });

  describe('assembleRewardPool', () => {
    it('assembles pool from possession category matching tier 1', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // Expect sword and shield (both tier 1)
      expect(pool.length).toBe(2);
      const nodeIds = pool.map(e => e.nodeId);
      expect(nodeIds).toContain('sword.iron');
      expect(nodeIds).toContain('shield.oak');

      // Both should have weight 1.0 * 1.0 = 1.0
      for (const entry of pool) {
        expect(entry.weight).toBe(1.0);
      }
    });

    it('filters by tags (#eye) with tier 1 = 1.0, tier 2 = 0 → empty', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        tagFilters: ['eye'],
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // tome.secrets has #eye but tier 2, and tier 2 weight = 0
      expect(pool.length).toBe(0);
    });

    it('includes condition traits when recipe includes condition category', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { condition: 1.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // Should find condition.blessed (tier 1 with weight 1.0)
      expect(pool.length).toBe(1);
      expect(pool[0].nodeId).toBe('condition.blessed');
      expect(pool[0].weight).toBe(1.0);
    });

    it('returns empty when nothing matches (all tier weights = 0)', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0 },
        tierCurve: { 1: 0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);
      expect(pool.length).toBe(0);
    });

    it('applies correct category weight multiplier', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 2.0 },
        tierCurve: { 1: 0.5, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // sword.iron and shield.oak: weight = 2.0 * 0.5 = 1.0
      expect(pool.length).toBe(2);
      for (const entry of pool) {
        expect(entry.weight).toBe(1.0);
      }
    });

    it('combines multiple categories with different weights', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0, condition: 2.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // sword.iron (weight 1.0), shield.oak (weight 1.0), condition.blessed (weight 2.0)
      expect(pool.length).toBe(3);
      const blessedEntry = pool.find(e => e.nodeId === 'condition.blessed');
      expect(blessedEntry?.weight).toBe(2.0);

      const swordEntry = pool.find(e => e.nodeId === 'sword.iron');
      expect(swordEntry?.weight).toBe(1.0);
    });

    it('skips categories with zero or negative weight', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0, condition: 0, blessing: -1.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // Should only include possession items (sword and shield)
      expect(pool.length).toBe(2);
      const nodeIds = pool.map(e => e.nodeId);
      expect(nodeIds).not.toContain('condition.blessed');
    });
  });

  describe('drawFromPool', () => {
    it('draws entry based on deterministic roll: pool [{a, 0.5}, {b, 0.5}], roll 0.2 → a', () => {
      const pool = [
        { nodeId: 'a', weight: 0.5 },
        { nodeId: 'b', weight: 0.5 },
      ];

      const result = drawFromPool(pool, 0.2);
      expect(result).toBe('a');
    });

    it('draws second entry when roll lands in second weight range', () => {
      const pool = [
        { nodeId: 'a', weight: 0.3 },
        { nodeId: 'b', weight: 0.7 },
      ];

      // roll 0.5: target = 0.5 * 1.0 = 0.5
      // cumulative at 'a' = 0.3 (0.5 < 0.3? no, continue)
      // cumulative at 'b' = 1.0 (0.5 < 1.0? yes, return 'b')
      const result = drawFromPool(pool, 0.5);
      expect(result).toBe('b');
    });

    it('returns null for empty pool', () => {
      const pool: typeof import('../rewardPool').PoolEntry[] = [];
      const result = drawFromPool(pool, 0.5);
      expect(result).toBeNull();
    });

    it('returns null when total weight is zero or negative', () => {
      const pool = [
        { nodeId: 'a', weight: 0 },
        { nodeId: 'b', weight: 0 },
      ];
      const result = drawFromPool(pool, 0.5);
      expect(result).toBeNull();
    });

    it('edge case: roll = 0.5 exactly with equal weights → returns second entry', () => {
      const pool = [
        { nodeId: 'a', weight: 0.5 },
        { nodeId: 'b', weight: 0.5 },
      ];

      // roll 0.5: target = 0.5 * 1.0 = 0.5
      // cumulative at 'a' = 0.5 (0.5 < 0.5? no, continue)
      // cumulative at 'b' = 1.0 (0.5 < 1.0? yes, return 'b')
      const result = drawFromPool(pool, 0.5);
      expect(result).toBe('b');
    });

    it('roll = 0.0 returns first entry', () => {
      const pool = [
        { nodeId: 'a', weight: 0.5 },
        { nodeId: 'b', weight: 0.5 },
      ];

      const result = drawFromPool(pool, 0.0);
      expect(result).toBe('a');
    });

    it('roll = 0.99 with equal weights returns last entry', () => {
      const pool = [
        { nodeId: 'a', weight: 0.5 },
        { nodeId: 'b', weight: 0.5 },
      ];

      const result = drawFromPool(pool, 0.99);
      expect(result).toBe('b');
    });

    it('fallback to last entry on floating-point rounding edge case', () => {
      const pool = [
        { nodeId: 'a', weight: 0.3333 },
        { nodeId: 'b', weight: 0.3333 },
        { nodeId: 'c', weight: 0.3334 },
      ];

      // Even with floating-point rounding, should reach one of the entries
      const result = drawFromPool(pool, 0.9999);
      expect(result).not.toBeNull();
      expect(['a', 'b', 'c']).toContain(result!);
    });

    it('handles unequal weights correctly', () => {
      const pool = [
        { nodeId: 'rare', weight: 0.1 },
        { nodeId: 'common', weight: 0.9 },
      ];

      // Target for roll 0.5 = 0.5 * 1.0 = 0.5
      // cumulative at 'rare' = 0.1 (0.5 < 0.1? no)
      // cumulative at 'common' = 1.0 (0.5 < 1.0? yes, return 'common')
      const result = drawFromPool(pool, 0.5);
      expect(result).toBe('common');
    });

    it('single entry pool returns that entry regardless of roll', () => {
      const pool = [{ nodeId: 'only', weight: 1.0 }];

      expect(drawFromPool(pool, 0.0)).toBe('only');
      expect(drawFromPool(pool, 0.5)).toBe('only');
      expect(drawFromPool(pool, 0.99)).toBe('only');
    });
  });

  describe('integration: assembleRewardPool + drawFromPool', () => {
    it('assembles a pool and draws from it deterministically', () => {
      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0 },
        tierCurve: { 1: 1.0, 2: 0, 3: 0, 4: 0 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);
      expect(pool.length).toBe(2);

      // Draw with roll 0.2 should hit first item
      const result1 = drawFromPool(pool, 0.2);
      expect(result1).toBe('sword.iron');

      // Draw with roll 0.6 should hit second item
      const result2 = drawFromPool(pool, 0.6);
      expect(result2).toBe('shield.oak');
    });

    it('weighted pool favors common entries', () => {
      // Add a rare artifact
      graph.addNode({
        id: 'sword.legendary',
        type: 'artifact',
        name: 'Legendary Sword',
        properties: {
          subcategory: 'arms',
          tier: 3,
          tags: ['legendary'],
          mechanicalSummary: '+Legendary',
          lossCondition: 'permanent',
        },
      });

      const recipe: ResolvedRewardRecipe = {
        categoryWeights: { possession: 1.0 },
        tierCurve: { 1: 10.0, 2: 5.0, 3: 1.0, 4: 0.5 },
        badOutcomeChance: 0,
      };

      const pool = assembleRewardPool(graph, recipe);

      // sword.iron and shield.oak (tier 1) should have weight 10.0 each
      // tome.secrets (tier 2) should have weight 5.0
      // sword.legendary (tier 3) should have weight 1.0
      const swordIron = pool.find(e => e.nodeId === 'sword.iron');
      expect(swordIron?.weight).toBe(10.0);

      const shieldOak = pool.find(e => e.nodeId === 'shield.oak');
      expect(shieldOak?.weight).toBe(10.0);

      const tome = pool.find(e => e.nodeId === 'tome.secrets');
      expect(tome?.weight).toBe(5.0);

      const legendary = pool.find(e => e.nodeId === 'sword.legendary');
      expect(legendary?.weight).toBe(1.0);
    });
  });
});

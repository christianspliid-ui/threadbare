/**
 * Tests for ascendant buff consumption (THR-416).
 *
 * Verifies that applyAscendantBuffs reads, applies, and clears
 * nextActionDiscount (Recede) and nextActionTierBoost (Focus) from the
 * ascendant node, returning the effective cost and tier for the next action.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyAscendantBuffs } from '../ascendantBuffs';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGraph(discount?: number, tierBoost?: number): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc-1',
    type: 'actor',
    name: 'The Weaver',
    properties: {
      actorType: 'ascendant',
      ...(discount !== undefined && { nextActionDiscount: discount }),
      ...(tierBoost !== undefined && { nextActionTierBoost: tierBoost }),
    },
  });
  return graph;
}

function makeTemplate(essenceCost = 10, rarityTier: 1 | 2 | 3 | 4 = 2): UnifiedActionTemplate {
  return {
    id: 'test.action.charm',
    name: 'Charm',
    essenceCost,
    rarityTier,
  } as UnifiedActionTemplate;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('applyAscendantBuffs', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
  });

  describe('no buffs active', () => {
    it('returns default result with unchanged cost and tier', () => {
      const graph = makeGraph();
      const template = makeTemplate(10, 2);
      const result = applyAscendantBuffs(template, graph, 'asc-1', 5);

      expect(result.buffsConsumed).toBe(false);
      expect(result.effectiveEssenceCost).toBe(10);
      expect(result.effectiveRarityTier).toBe(2);
      expect(result.discountApplied).toBe(0);
      expect(result.tierBoostApplied).toBe(0);
    });

    it('does not mutate the ascendant node', () => {
      const graph = makeGraph();
      applyAscendantBuffs(makeTemplate(), graph, 'asc-1', 1);
      const props = graph.getNode('asc-1')!.properties;
      expect(props.nextActionDiscount).toBeUndefined();
      expect(props.nextActionTierBoost).toBeUndefined();
    });

    it('emits no trace', () => {
      const graph = makeGraph();
      applyAscendantBuffs(makeTemplate(), graph, 'asc-1', 1);
      const traces = getTraces().filter(t => t.category === 'buff_consumed');
      expect(traces).toHaveLength(0);
    });
  });

  describe('Recede discount', () => {
    it('reduces essence cost by the discount fraction', () => {
      const graph = makeGraph(0.5);
      const result = applyAscendantBuffs(makeTemplate(20, 2), graph, 'asc-1', 1);

      expect(result.effectiveEssenceCost).toBe(10); // floor(20 * 0.5)
      expect(result.discountApplied).toBe(0.5);
      expect(result.buffsConsumed).toBe(true);
    });

    it('clears nextActionDiscount from the ascendant node', () => {
      const graph = makeGraph(0.5);
      applyAscendantBuffs(makeTemplate(), graph, 'asc-1', 1);
      expect(graph.getNode('asc-1')!.properties.nextActionDiscount).toBeUndefined();
    });

    it('does not affect the rarity tier', () => {
      const graph = makeGraph(0.5);
      const result = applyAscendantBuffs(makeTemplate(10, 3), graph, 'asc-1', 1);
      expect(result.effectiveRarityTier).toBe(3);
      expect(result.tierBoostApplied).toBe(0);
    });

    it('emits a buff_consumed trace', () => {
      const graph = makeGraph(0.5);
      applyAscendantBuffs(makeTemplate(10, 2), graph, 'asc-1', 7);
      const traces = getTraces().filter(t => t.category === 'buff_consumed');
      expect(traces).toHaveLength(1);
      expect((traces[0] as any).discountApplied).toBe(0.5);
      expect((traces[0] as any).tick).toBe(7);
    });
  });

  describe('Focus tier boost', () => {
    it('raises the rarity tier by the boost amount', () => {
      const graph = makeGraph(undefined, 1);
      const result = applyAscendantBuffs(makeTemplate(10, 2), graph, 'asc-1', 1);

      expect(result.effectiveRarityTier).toBe(3);
      expect(result.tierBoostApplied).toBe(1);
      expect(result.buffsConsumed).toBe(true);
    });

    it('clamps tier boost at 4', () => {
      const graph = makeGraph(undefined, 2);
      const result = applyAscendantBuffs(makeTemplate(10, 3), graph, 'asc-1', 1);
      expect(result.effectiveRarityTier).toBe(4);
    });

    it('clears nextActionTierBoost from the ascendant node', () => {
      const graph = makeGraph(undefined, 1);
      applyAscendantBuffs(makeTemplate(), graph, 'asc-1', 1);
      expect(graph.getNode('asc-1')!.properties.nextActionTierBoost).toBeUndefined();
    });

    it('does not affect the essence cost', () => {
      const graph = makeGraph(undefined, 1);
      const result = applyAscendantBuffs(makeTemplate(10, 2), graph, 'asc-1', 1);
      expect(result.effectiveEssenceCost).toBe(10);
      expect(result.discountApplied).toBe(0);
    });
  });

  describe('both buffs simultaneously', () => {
    it('applies discount and tier boost together', () => {
      const graph = makeGraph(0.5, 1);
      const result = applyAscendantBuffs(makeTemplate(20, 2), graph, 'asc-1', 1);

      expect(result.effectiveEssenceCost).toBe(10);
      expect(result.effectiveRarityTier).toBe(3);
      expect(result.buffsConsumed).toBe(true);
      expect(result.discountApplied).toBe(0.5);
      expect(result.tierBoostApplied).toBe(1);
    });

    it('clears both fields from the ascendant node', () => {
      const graph = makeGraph(0.5, 1);
      applyAscendantBuffs(makeTemplate(), graph, 'asc-1', 1);
      const props = graph.getNode('asc-1')!.properties;
      expect(props.nextActionDiscount).toBeUndefined();
      expect(props.nextActionTierBoost).toBeUndefined();
    });
  });

  describe('missing ascendant node', () => {
    it('returns default result without throwing', () => {
      const graph = new WorldGraph();
      const result = applyAscendantBuffs(makeTemplate(), graph, 'nonexistent', 1);
      expect(result.buffsConsumed).toBe(false);
      expect(result.effectiveEssenceCost).toBe(10);
    });
  });
});

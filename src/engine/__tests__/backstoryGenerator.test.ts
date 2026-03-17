/**
 * Backstory Generator Tests — TDD for generateTieredBackstory().
 *
 * Verifies tier filtering, stratum ordering, determinism,
 * isNew calculation, and fail-soft behavior.
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import { generateTieredBackstory } from '../backstoryGenerator';

// ─── Graph builders ──────────────────────────────────────────────────────────

function makeFullGraph(): { graph: WorldGraph; agentId: string } {
  const graph = new WorldGraph();

  // Agent
  graph.addNode({
    id: 'agent_0',
    type: 'actor',
    name: 'Mira',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'tragic_hero',
      primarySphere: 'force',
      cooperationStrategy: 'tit-for-tat',
      axiologicalProfile: {
        ambition_contentment: 0.7,
        courage_prudence: 0.05,   // near-zero → contradiction
        cruelty_compassion: -0.5,
        cunning_honesty: 0.05,    // near-zero → contradiction
        devotion_independence: -0.2,
        loyalty_treachery: 0.4,
        tradition_innovation: -0.1,
        dominance_humility: 0.0,
        wrath_patience: 0.3,
        greed_generosity: -0.6,
      },
    },
  } as GraphNode);

  // Culture
  graph.addNode({
    id: 'culture_0',
    type: 'actor',
    name: 'The Ironborn',
    properties: { actorType: 'culture', cultureIdentity: { foundationPair: 'order_light' } },
  } as GraphNode);
  graph.addEdge({
    id: 'edge_belongs',
    source: 'agent_0',
    target: 'culture_0',
    type: 'belongs_to',
    properties: {},
  } as GraphEdge);

  // Bond partner
  graph.addNode({
    id: 'agent_bond',
    type: 'actor',
    name: 'Davan',
    properties: { actorType: 'individual' },
  } as GraphNode);
  graph.addEdge({
    id: 'edge_bond',
    source: 'agent_0',
    target: 'agent_bond',
    type: 'relates_to',
    properties: { sentiment: 0.8, strength: 0.7, basis: 'loyalty' },
  } as GraphEdge);

  // Trait
  graph.addNode({
    id: 'trait_0',
    type: 'trait',
    name: 'Iron Will',
    properties: { subcategory: 'innate' },
  } as GraphNode);
  graph.addEdge({
    id: 'edge_trait',
    source: 'agent_0',
    target: 'trait_0',
    type: 'has_trait',
    properties: { level: 2 },
  } as GraphEdge);

  // Ascendant + worships
  graph.addNode({
    id: 'asc_0',
    type: 'actor',
    name: 'The Flame Watcher',
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'force', secondary: 'matter' },
    },
  } as GraphNode);
  graph.addEdge({
    id: 'edge_worships',
    source: 'agent_0',
    target: 'asc_0',
    type: 'worships',
    properties: {
      tier: 4,
      totalEssenceSpent: 75,
      ticksAtCurrentTier: 50,
      establishedTick: 10,
      maintenanceCurrent: true,
    },
  } as GraphEdge);

  return { graph, agentId: 'agent_0' };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('generateTieredBackstory', () => {
  describe('tier 0 returns empty', () => {
    it('returns empty result for influenceTier 0', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 0);
      expect(result.text).toBe('');
      expect(result.strata).toEqual([]);
      expect(result.maxStratum).toBe(0);
    });
  });

  describe('fail-soft', () => {
    it('returns empty result when agent node does not exist', () => {
      const graph = new WorldGraph();
      const result = generateTieredBackstory('nonexistent', graph, 42, 2);
      expect(result.text).toBe('');
      expect(result.strata).toEqual([]);
      expect(result.maxStratum).toBe(0);
    });
  });

  describe('tier filtering', () => {
    it('tier 1 returns only stratum 1', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 1);
      expect(result.strata.length).toBeGreaterThan(0);
      for (const s of result.strata) {
        expect(s.tier).toBe(1);
      }
      expect(result.maxStratum).toBe(1);
    });

    it('tier 2 returns strata 1 and 2 only', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 2);
      const tiers = result.strata.map(s => s.tier);
      expect(tiers.every(t => t <= 2)).toBe(true);
      expect(result.maxStratum).toBeLessThanOrEqual(2);
    });

    it('tier 4 returns strata 1-4', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      const tiers = result.strata.map(s => s.tier);
      // At minimum strata 1 and 4 should appear (resolvers depend on graph data)
      expect(tiers).toContain(1);
      expect(tiers).toContain(4);
      expect(result.maxStratum).toBe(4);
    });
  });

  describe('stratum ordering', () => {
    it('strata are in ascending order 1→2→3→4', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      const tiers = result.strata.map(s => s.tier);
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i]).toBeGreaterThan(tiers[i - 1]);
      }
    });
  });

  describe('stratum titles', () => {
    it('uses correct titles from design doc', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      const titleByTier: Record<number, string> = {};
      for (const s of result.strata) {
        titleByTier[s.tier] = s.title;
      }
      if (titleByTier[1]) expect(titleByTier[1]).toBe('What They Say');
      if (titleByTier[2]) expect(titleByTier[2]).toBe('What They Lived');
      if (titleByTier[3]) expect(titleByTier[3]).toBe('What They Hide');
      if (titleByTier[4]) expect(titleByTier[4]).toBe('What They Are');
    });

    it('each stratum has a non-empty subtitle', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      for (const s of result.strata) {
        expect(s.subtitle.length).toBeGreaterThan(0);
      }
    });
  });

  describe('text composition', () => {
    it('each stratum has non-empty text', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      for (const s of result.strata) {
        expect(s.text.length).toBeGreaterThan(0);
      }
    });

    it('full text joins strata with separator', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      if (result.strata.length > 1) {
        expect(result.text).toContain('---');
      }
    });

    it('full text contains text from all strata', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4);
      for (const s of result.strata) {
        // First 30 chars of each stratum's text should appear in full text
        expect(result.text).toContain(s.text.slice(0, 30));
      }
    });
  });

  describe('isNew calculation', () => {
    it('all strata are new when readBackstoryTier is 0', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4, 0);
      for (const s of result.strata) {
        expect(s.isNew).toBe(true);
      }
    });

    it('strata at or below readBackstoryTier are not new', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 4, 2);
      for (const s of result.strata) {
        if (s.tier <= 2) {
          expect(s.isNew).toBe(false);
        } else {
          expect(s.isNew).toBe(true);
        }
      }
    });

    it('no strata are new when readBackstoryTier equals influenceTier', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 2, 2);
      for (const s of result.strata) {
        expect(s.isNew).toBe(false);
      }
    });

    it('defaults readBackstoryTier to 0 when not provided', () => {
      const { graph, agentId } = makeFullGraph();
      const result = generateTieredBackstory(agentId, graph, 42, 2);
      for (const s of result.strata) {
        expect(s.isNew).toBe(true);
      }
    });
  });

  describe('determinism', () => {
    it('same seed + same graph produces identical output', () => {
      const { graph, agentId } = makeFullGraph();
      const a = generateTieredBackstory(agentId, graph, 99, 4);
      const b = generateTieredBackstory(agentId, graph, 99, 4);
      expect(a.text).toBe(b.text);
      expect(a.maxStratum).toBe(b.maxStratum);
      expect(a.strata.length).toBe(b.strata.length);
      for (let i = 0; i < a.strata.length; i++) {
        expect(a.strata[i].text).toBe(b.strata[i].text);
      }
    });

    it('different seeds produce different output', () => {
      const { graph, agentId } = makeFullGraph();
      const texts = new Set<string>();
      for (let s = 0; s < 10; s++) {
        const r = generateTieredBackstory(agentId, graph, s, 1);
        if (r.text) texts.add(r.text);
      }
      expect(texts.size).toBeGreaterThanOrEqual(2);
    });
  });
});

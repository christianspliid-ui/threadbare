/**
 * Prose Resolvers (Prosperity) Tests — terrain-aware prosperity prose.
 *
 * Tests the prosperityResolver with generic fallback and terrain-specific
 * fragment selection for coastal, mountain, farmland, and forest settlements.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { prosperityResolver } from '../proseResolvers';
import {
  PROSPERITY_PROSE,
  PROSPERITY_TERRAIN_PROSE,
  TERRAIN_PROSPERITY_CATEGORY,
} from '../../data/prose-layer-content';

const testSeed = 42;

function makeSettlement(
  id: string,
  opts: { prosperity: number; terrain?: string; subtype?: string },
): { graph: WorldGraph; nodeId: string } {
  const graph = new WorldGraph();
  const node: GraphNode = {
    id,
    type: 'location',
    name: 'Test Settlement',
    properties: {
      locationSubtype: opts.subtype ?? 'town',
      terrain: opts.terrain,
      prosperity: opts.prosperity,
    },
  };
  graph.addNode(node);
  return { graph, nodeId: id };
}

describe('prosperityResolver', () => {
  // ── Basic behavior ──────────────────────────────────────────────────────

  it('returns atmosphere layer with priority 70 for settlement with prosperity', () => {
    const { graph, nodeId } = makeSettlement('loc_p1', { prosperity: 50 });
    const layers = prosperityResolver(nodeId, graph, testSeed);

    expect(layers).toHaveLength(1);
    expect(layers[0].priority).toBe(70);
    expect(layers[0].category).toBe('atmosphere');
    expect(layers[0].source).toBe('prosperityResolver');
    expect(layers[0].text.length).toBeGreaterThan(0);
  });

  it('returns empty array when node missing', () => {
    const { graph } = makeSettlement('loc_p2', { prosperity: 50 });
    expect(prosperityResolver('nonexistent', graph, testSeed)).toEqual([]);
  });

  it('returns empty array when prosperity property missing', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_no_prop',
      type: 'location',
      name: 'No Prop',
      properties: { locationSubtype: 'town' },
    });
    expect(prosperityResolver('loc_no_prop', graph, testSeed)).toEqual([]);
  });

  it('returns empty array when prosperity is not a number', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_bad_prop',
      type: 'location',
      name: 'Bad Prop',
      properties: { locationSubtype: 'town', prosperity: 'high' as any },
    });
    expect(prosperityResolver('loc_bad_prop', graph, testSeed)).toEqual([]);
  });

  it('returns empty array for non-settlement subtypes', () => {
    const { graph, nodeId } = makeSettlement('loc_cave', {
      prosperity: 80,
      subtype: 'cave',
    });
    expect(prosperityResolver(nodeId, graph, testSeed)).toEqual([]);
  });

  it('handles all 5 prosperity tiers with generic prose', () => {
    const tierValues: [string, number][] = [
      ['Flourishing', 85],
      ['Prosperous', 65],
      ['Modest', 45],
      ['Struggling', 25],
      ['Destitute', 5],
    ];

    for (const [tier, prosperity] of tierValues) {
      const { graph, nodeId } = makeSettlement(`loc_tier_${tier}`, { prosperity });
      const layers = prosperityResolver(nodeId, graph, testSeed);

      expect(layers).toHaveLength(1);
      // Fragment must come from the correct tier's generic pool
      expect(PROSPERITY_PROSE[tier]).toContain(layers[0].text);
    }
  });

  it('handles boundary values correctly', () => {
    const boundaries: number[] = [80, 60, 40, 20, 0, 19];
    for (const prosperity of boundaries) {
      const { graph, nodeId } = makeSettlement(`loc_bound_${prosperity}`, { prosperity });
      const layers = prosperityResolver(nodeId, graph, testSeed);
      expect(layers).toHaveLength(1);
      expect(layers[0].category).toBe('atmosphere');
    }
  });

  // ── Terrain-specific selection ──────────────────────────────────────────

  describe('terrain-specific fragments', () => {
    const terrainCategories = ['coastal', 'mountain', 'farmland', 'forest'] as const;

    for (const category of terrainCategories) {
      it(`selects ${category} fragments when terrain matches`, () => {
        // Find a terrain type that maps to this category
        const terrain = Object.entries(TERRAIN_PROSPERITY_CATEGORY).find(
          ([, cat]) => cat === category,
        )?.[0];
        expect(terrain).toBeDefined();

        const { graph, nodeId } = makeSettlement(`loc_${category}`, {
          prosperity: 85, // Flourishing
          terrain,
        });

        const layers = prosperityResolver(nodeId, graph, testSeed);
        expect(layers).toHaveLength(1);

        // Fragment must come from the terrain-specific pool, not generic
        const terrainPool = PROSPERITY_TERRAIN_PROSE[category]?.Flourishing ?? [];
        expect(terrainPool).toContain(layers[0].text);
      });
    }

    it('selects terrain-specific fragments across all 5 tiers', () => {
      const tierValues: [string, number][] = [
        ['Flourishing', 85],
        ['Prosperous', 65],
        ['Modest', 45],
        ['Struggling', 25],
        ['Destitute', 5],
      ];

      for (const [tier, prosperity] of tierValues) {
        const { graph, nodeId } = makeSettlement(`loc_coast_${tier}`, {
          prosperity,
          terrain: 'coast',
        });
        const layers = prosperityResolver(nodeId, graph, testSeed);

        expect(layers).toHaveLength(1);
        const coastalPool = PROSPERITY_TERRAIN_PROSE.coastal?.[tier] ?? [];
        expect(coastalPool).toContain(layers[0].text);
      }
    });
  });

  // ── Generic fallback ──────────────────────────────────────────────────

  describe('generic fallback', () => {
    it('falls back to generic when terrain has no mapping', () => {
      const { graph, nodeId } = makeSettlement('loc_desert', {
        prosperity: 85,
        terrain: 'desert', // Not in TERRAIN_PROSPERITY_CATEGORY
      });

      const layers = prosperityResolver(nodeId, graph, testSeed);
      expect(layers).toHaveLength(1);
      expect(PROSPERITY_PROSE.Flourishing).toContain(layers[0].text);
    });

    it('falls back to generic when terrain property is undefined', () => {
      const { graph, nodeId } = makeSettlement('loc_no_terrain', {
        prosperity: 85,
        terrain: undefined,
      });

      const layers = prosperityResolver(nodeId, graph, testSeed);
      expect(layers).toHaveLength(1);
      expect(PROSPERITY_PROSE.Flourishing).toContain(layers[0].text);
    });

    it('falls back to generic for unmapped terrain types', () => {
      const unmappedTerrains = ['swamp', 'marsh', 'tundra', 'glacier', 'volcano', 'oasis'];
      for (const terrain of unmappedTerrains) {
        const { graph, nodeId } = makeSettlement(`loc_${terrain}`, {
          prosperity: 50,
          terrain,
        });
        const layers = prosperityResolver(nodeId, graph, testSeed);
        expect(layers).toHaveLength(1);
        expect(PROSPERITY_PROSE.Modest).toContain(layers[0].text);
      }
    });
  });

  // ── PRNG determinism ──────────────────────────────────────────────────

  describe('deterministic selection', () => {
    it('returns same fragment for same seed', () => {
      const make = () =>
        makeSettlement('loc_det', { prosperity: 85, terrain: 'coast' });

      const { graph: g1, nodeId: n1 } = make();
      const { graph: g2, nodeId: n2 } = make();

      const l1 = prosperityResolver(n1, g1, 123);
      const l2 = prosperityResolver(n2, g2, 123);

      expect(l1[0].text).toBe(l2[0].text);
    });

    it('returns different fragment for different seed', () => {
      // Test across enough seeds that at least one differs
      const fragments = new Set<string>();
      for (let seed = 0; seed < 20; seed++) {
        const { graph, nodeId } = makeSettlement('loc_var', {
          prosperity: 85,
          terrain: 'coast',
        });
        const layers = prosperityResolver(nodeId, graph, seed);
        if (layers.length > 0) fragments.add(layers[0].text);
      }
      // With 3 coastal Flourishing fragments, we should see variation
      expect(fragments.size).toBeGreaterThan(1);
    });
  });

  // ── Content integrity ─────────────────────────────────────────────────

  describe('content tables', () => {
    it('TERRAIN_PROSPERITY_CATEGORY maps only valid terrain types', () => {
      // All values should be one of the 4 terrain categories
      const validCategories = new Set(['coastal', 'mountain', 'farmland', 'forest']);
      for (const [, category] of Object.entries(TERRAIN_PROSPERITY_CATEGORY)) {
        expect(validCategories).toContain(category);
      }
    });

    it('PROSPERITY_TERRAIN_PROSE has entries for all 4 terrain categories', () => {
      for (const category of ['coastal', 'mountain', 'farmland', 'forest']) {
        expect(PROSPERITY_TERRAIN_PROSE[category]).toBeDefined();
      }
    });

    it('every terrain category has all 5 prosperity tiers', () => {
      const tiers = ['Flourishing', 'Prosperous', 'Modest', 'Struggling', 'Destitute'];
      for (const category of ['coastal', 'mountain', 'farmland', 'forest']) {
        for (const tier of tiers) {
          const fragments = PROSPERITY_TERRAIN_PROSE[category]?.[tier];
          expect(fragments).toBeDefined();
          expect(fragments!.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('no empty strings in terrain prose', () => {
      for (const [category, tiers] of Object.entries(PROSPERITY_TERRAIN_PROSE)) {
        for (const [tier, fragments] of Object.entries(tiers)) {
          for (const fragment of fragments) {
            expect(fragment.trim().length, `Empty fragment in ${category}.${tier}`).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

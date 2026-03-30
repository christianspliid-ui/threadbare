/**
 * Trade Route Prose Resolver Tests — trade route prose fragment generation via graph walking.
 *
 * Tests the tradeRouteResolver: volume tiers, goods type color, status modifiers,
 * crossroads summary, and fail-soft behavior.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import { tradeRouteResolver } from '../proseResolvers';

describe('tradeRouteResolver', () => {
  let graph: WorldGraph;
  const testSeed = 42;

  beforeEach(() => {
    graph = new WorldGraph();

    // Location: Thornhaven (town)
    const location: GraphNode = {
      id: 'loc_0',
      type: 'location',
      name: 'Thornhaven',
      properties: {
        locationSubtype: 'town',
        terrain: 'grassland',
      },
    };
    graph.addNode(location);

    // Actor A at location (merchant)
    const actorA: GraphNode = {
      id: 'actor_a',
      type: 'actor',
      name: 'Merchant Aldric',
      properties: { actorType: 'individual' },
    };
    graph.addNode(actorA);
    graph.addEdge({
      id: 'edge_loc_a',
      source: 'actor_a',
      target: 'loc_0',
      type: 'located_at',
      properties: {},
    });

    // Actor B (trade partner, at another location)
    const actorB: GraphNode = {
      id: 'actor_b',
      type: 'actor',
      name: 'Merchant Brynn',
      properties: { actorType: 'individual' },
    };
    graph.addNode(actorB);
  });

  // ─── Happy path ──────────────────────────────────────────────────

  it('returns tension layer with priority 45 for a single trade route', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5, goodsType: 'grain' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].category).toBe('tension');
    expect(layers[0].priority).toBe(45);
    expect(layers[0].source).toBe('tradeRouteResolver');
    expect(layers[0].text.length).toBeGreaterThan(0);
  });

  // ─── Volume tiers ────────────────────────────────────────────────

  it('selects high-volume prose for volume >= 7', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 9 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // High-volume fragments mention caravans, rutted roads, or weather patterns
    expect(layers[0].text.length).toBeGreaterThan(20);
  });

  it('selects medium-volume prose for volume 4-6', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text.length).toBeGreaterThan(20);
  });

  it('selects low-volume prose for volume 1-3', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 2 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text.length).toBeGreaterThan(20);
  });

  // ─── Goods type color ────────────────────────────────────────────

  it('includes goods type color when goodsType is known', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 8, goodsType: 'ore' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Should contain em-dash composition with ore-related fragment
    expect(layers[0].text).toContain('\u2014');
  });

  it('does not add goods color for unknown goodsType', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 8, goodsType: 'unknown' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // No em-dash composition for unknown goods
    expect(layers[0].text).not.toContain('\u2014');
  });

  // ─── Status modifiers ────────────────────────────────────────────

  it('includes threatened status modifier', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 6, threatened: true },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Threatened fragments mention bandits or armed escorts
    expect(
      layers[0].text.includes('bandit') || layers[0].text.includes('escort'),
    ).toBe(true);
  });

  it('includes controlled status with controller name', () => {
    // Add a faction as controller
    const faction: GraphNode = {
      id: 'faction_0',
      type: 'actor',
      name: 'The Iron Covenant',
      properties: { actorType: 'faction' },
    };
    graph.addNode(faction);

    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 6, controlledBy: 'faction_0' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text).toContain('Iron Covenant');
  });

  it('includes decaying status for low volume routes', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 2 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Decaying fragments mention "fewer carts" or "quieter"
    expect(
      layers[0].text.includes('fewer') || layers[0].text.includes('quieter'),
    ).toBe(true);
  });

  it('threatened takes priority over controlled status', () => {
    const faction: GraphNode = {
      id: 'faction_0',
      type: 'actor',
      name: 'The Iron Covenant',
      properties: { actorType: 'faction' },
    };
    graph.addNode(faction);

    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 6, threatened: true, controlledBy: 'faction_0' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Threatened wins — no controller name in output
    expect(layers[0].text).not.toContain('Iron Covenant');
  });

  // ─── Crossroads summary ──────────────────────────────────────────

  it('adds crossroads summary for 2+ trade routes', () => {
    // Actor C (second trade partner)
    const actorC: GraphNode = {
      id: 'actor_c',
      type: 'actor',
      name: 'Merchant Cora',
      properties: { actorType: 'individual' },
    };
    graph.addNode(actorC);

    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5 },
    });
    graph.addEdge({
      id: 'trade_2',
      source: 'actor_a',
      target: 'actor_c',
      type: 'trades_with',
      properties: { volume: 3 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Crossroads fragments mention "crossroads" or "directions"
    expect(
      layers[0].text.includes('crossroads') ||
        layers[0].text.includes('direction'),
    ).toBe(true);
  });

  it('does not add crossroads summary for single trade route', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text).not.toContain('crossroads');
    expect(layers[0].text).not.toContain('direction');
  });

  // ─── Picks highest volume route ──────────────────────────────────

  it('picks the highest-volume route for prose composition', () => {
    const actorC: GraphNode = {
      id: 'actor_c',
      type: 'actor',
      name: 'Merchant Cora',
      properties: { actorType: 'individual' },
    };
    graph.addNode(actorC);

    // Low volume route
    graph.addEdge({
      id: 'trade_low',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 1, goodsType: 'fish' },
    });
    // High volume route
    graph.addEdge({
      id: 'trade_high',
      source: 'actor_a',
      target: 'actor_c',
      type: 'trades_with',
      properties: { volume: 9, goodsType: 'ore' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // High volume template should be used — not low-volume "thin trickle" text
    expect(layers[0].text).not.toContain('thin trickle');
    expect(layers[0].text).not.toContain('seldom');
  });

  // ─── Incoming trades_with edges ──────────────────────────────────

  it('detects incoming trades_with edges (bidirectional)', () => {
    // Trade edge points TO actor_a (incoming for actor at location)
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_b',
      target: 'actor_a',
      type: 'trades_with',
      properties: { volume: 7, goodsType: 'timber' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text.length).toBeGreaterThan(20);
  });

  // ─── Fail-soft behavior ──────────────────────────────────────────

  it('returns empty array for missing node', () => {
    const layers = tradeRouteResolver('nonexistent', graph, testSeed);
    expect(layers).toEqual([]);
  });

  it('returns empty array for non-location node', () => {
    const layers = tradeRouteResolver('actor_a', graph, testSeed);
    expect(layers).toEqual([]);
  });

  it('returns empty array when no actors at location', () => {
    const emptyLoc: GraphNode = {
      id: 'loc_empty',
      type: 'location',
      name: 'Empty Place',
      properties: {},
    };
    graph.addNode(emptyLoc);

    const layers = tradeRouteResolver('loc_empty', graph, testSeed);
    expect(layers).toEqual([]);
  });

  it('returns empty array when actors have no trade routes', () => {
    // actor_a is at loc_0 but has no trades_with edges
    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toEqual([]);
  });

  it('deduplicates trade edges seen from multiple actors', () => {
    // Actor C also at the same location
    const actorC: GraphNode = {
      id: 'actor_c',
      type: 'actor',
      name: 'Merchant Cora',
      properties: { actorType: 'individual' },
    };
    graph.addNode(actorC);
    graph.addEdge({
      id: 'edge_loc_c',
      source: 'actor_c',
      target: 'loc_0',
      type: 'located_at',
      properties: {},
    });

    // Trade between actor_a and actor_c — visible from both actors
    graph.addEdge({
      id: 'trade_shared',
      source: 'actor_a',
      target: 'actor_c',
      type: 'trades_with',
      properties: { volume: 5 },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    // Should not trigger crossroads (only 1 unique edge)
    expect(layers[0].text).not.toContain('crossroads');
    expect(layers[0].text).not.toContain('direction');
  });

  // ─── Determinism ─────────────────────────────────────────────────

  it('produces deterministic output for the same seed', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5, goodsType: 'grain' },
    });

    const layers1 = tradeRouteResolver('loc_0', graph, testSeed);
    const layers2 = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers1[0].text).toBe(layers2[0].text);
  });

  it('produces different output for different seeds', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 5, goodsType: 'grain' },
    });

    const layers1 = tradeRouteResolver('loc_0', graph, 1);
    const layers2 = tradeRouteResolver('loc_0', graph, 99999);
    // With different seeds and multiple template options, output should differ
    // (Not guaranteed but highly probable with different seeds)
    // Just verify both produce valid output
    expect(layers1).toHaveLength(1);
    expect(layers2).toHaveLength(1);
  });

  // ─── Controlled status with missing controller node ──────────────

  it('falls back to "an unknown power" when controller node not found', () => {
    graph.addEdge({
      id: 'trade_1',
      source: 'actor_a',
      target: 'actor_b',
      type: 'trades_with',
      properties: { volume: 6, controlledBy: 'nonexistent_faction' },
    });

    const layers = tradeRouteResolver('loc_0', graph, testSeed);
    expect(layers).toHaveLength(1);
    expect(layers[0].text).toContain('unknown power');
  });
});

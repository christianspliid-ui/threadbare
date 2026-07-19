import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  generateStrategicCandidates,
  getStrategicTemplate,
  getAllStrategicTemplates,
  computeRouteFormationBias,
} from '../strategicActionCandidates';
import { scoreRoutePairBalance, ROUTE_FORMATION_BALANCE_BIAS } from '../tradeRoute';
import { mulberry32 } from '../../lib/prng';
import type { GraphNode } from '../../types/graph';
import type { ResourceInstance } from '../../types/resource';

function buildTestGraph() {
  const graph = new WorldGraph();

  // Actor with merchant-appropriate capabilities
  graph.addNode({
    id: 'actor_merchant',
    name: 'Merchant Kael',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      domainCapabilities: { gold: 0.6, eye: 0.4, heart: 0.3, shadow: 0.1, iron: 0.2, stone: 0.2, star: 0.1, veil: 0.1 },
    },
  });

  // Market location
  graph.addNode({
    id: 'loc_market',
    name: 'The Grand Market',
    type: 'location',
    properties: { locationSubtype: 'market', hexCol: 5, hexRow: 5 },
  });

  // Town
  graph.addNode({
    id: 'loc_town',
    name: 'Millhaven',
    type: 'location',
    properties: { locationSubtype: 'town', hexCol: 7, hexRow: 5 },
  });

  // Port
  graph.addNode({
    id: 'loc_port',
    name: 'Tidegate',
    type: 'location',
    properties: { locationSubtype: 'port', hexCol: 3, hexRow: 8 },
  });

  // Actor located at market
  graph.addEdge({
    id: 'located_merchant',
    source: 'actor_merchant',
    target: 'loc_market',
    type: 'located_at',
    properties: {},
  });

  // Ambition node
  graph.addNode({
    id: 'ambition_dominate_trade_node',
    name: 'Dominate Regional Trade',
    type: 'event',
    properties: { templateId: 'ambition_dominate_trade' },
  });

  // Pursues edge (active)
  graph.addEdge({
    id: 'pursues_merchant_trade',
    source: 'actor_merchant',
    target: 'ambition_dominate_trade_node',
    type: 'pursues',
    properties: { status: 'active', priority: 'primary', assignedTick: 1 },
  });

  return graph;
}

describe('strategicActionCandidates', () => {
  describe('getStrategicTemplate', () => {
    it('returns merchant templates by ID', () => {
      const t = getStrategicTemplate('strategic_survey_market');
      expect(t).toBeDefined();
      expect(t!.displayName).toBe('Survey Market');
    });

    it('returns undefined for unknown IDs', () => {
      expect(getStrategicTemplate('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllStrategicTemplates', () => {
    it('returns all registered templates', () => {
      const all = getAllStrategicTemplates();
      expect(all.length).toBeGreaterThanOrEqual(6); // merchant pack has 6
    });
  });

  describe('generateStrategicCandidates', () => {
    it('generates candidates for merchant ambition with valid targets', () => {
      const graph = buildTestGraph();
      const rng = mulberry32(42);

      const result = generateStrategicCandidates(
        graph,
        'actor_merchant',
        ['ambition_dominate_trade'],
        undefined,
        10,
        rng,
      );

      expect(result.candidates.length).toBeGreaterThan(0);
      // Should find market/town/port targets for survey, negotiate, etc.
      const templateIds = new Set(result.candidates.map(c => c.templateId));
      expect(templateIds.has('strategic_survey_market')).toBe(true);
    });

    it('rejects candidates when reach floors are unmet', () => {
      const graph = buildTestGraph();
      // Nerf the actor's capabilities
      graph.updateNode('actor_merchant', {
        properties: {
          ...graph.getNode('actor_merchant')!.properties,
          domainCapabilities: { gold: 0.1, eye: 0.1, heart: 0.1 },
        },
      });

      const rng = mulberry32(42);
      const result = generateStrategicCandidates(
        graph,
        'actor_merchant',
        ['ambition_dominate_trade'],
        undefined,
        10,
        rng,
      );

      // Most templates require gold >= 0.3-0.5, should be rejected
      expect(result.rejections.length).toBeGreaterThan(0);
      const reachRejections = result.rejections.filter(r => r.reason.startsWith('reach_floor_unmet'));
      expect(reachRejections.length).toBeGreaterThan(0);
    });

    it('returns empty for ambitions without strategic profiles', () => {
      const graph = buildTestGraph();
      const rng = mulberry32(42);

      const result = generateStrategicCandidates(
        graph,
        'actor_merchant',
        ['ambition_escape_cursed_land'], // Has no strategicProfile
        undefined,
        10,
        rng,
      );

      expect(result.candidates).toHaveLength(0);
    });

    it('does not duplicate same template+target combos', () => {
      const graph = buildTestGraph();
      const rng = mulberry32(42);

      const result = generateStrategicCandidates(
        graph,
        'actor_merchant',
        ['ambition_dominate_trade'],
        undefined,
        10,
        rng,
      );

      const idPairs = result.candidates.map(c => `${c.templateId}:${c.targetNodeId}`);
      const uniquePairs = new Set(idPairs);
      expect(uniquePairs.size).toBe(idPairs.length);
    });

    it('skips candidates when actor has no location', () => {
      const graph = new WorldGraph();
      graph.addNode({
        id: 'actor_homeless',
        name: 'Lost Soul',
        type: 'actor',
        properties: { actorType: 'individual', domainCapabilities: { gold: 0.6 } },
      });

      const rng = mulberry32(42);
      const result = generateStrategicCandidates(
        graph,
        'actor_homeless',
        ['ambition_dominate_trade'],
        undefined,
        10,
        rng,
      );

      expect(result.candidates).toHaveLength(0);
    });

    it('respects per-ambition candidate cap', () => {
      const graph = buildTestGraph();
      // Add many more locations to ensure we hit the cap
      for (let i = 0; i < 20; i++) {
        graph.addNode({
          id: `loc_extra_${i}`,
          name: `Town ${i}`,
          type: 'location',
          properties: { locationSubtype: 'town', hexCol: i, hexRow: i },
        });
      }

      const rng = mulberry32(42);
      const result = generateStrategicCandidates(
        graph,
        'actor_merchant',
        ['ambition_dominate_trade'],
        undefined,
        10,
        rng,
      );

      // Should not exceed STRATEGIC_MAX_CANDIDATES_PER_ACTOR (12)
      expect(result.candidates.length).toBeLessThanOrEqual(12);
    });
  });
});

// ─── THR-616 P2: route-formation balance bias ──────────────────────────────

/** Build a minimal location node carrying a `resources` bag for balance scoring. */
function locNode(id: string, resources: Record<string, Partial<ResourceInstance>>): GraphNode {
  const bag: Record<string, ResourceInstance> = {};
  for (const [rid, inst] of Object.entries(resources)) {
    bag[rid] = { quantity: 50, renewable: true, renewalRate: 0.1, ...inst };
  }
  return { id, type: 'location', name: id, properties: { resources: bag } } as GraphNode;
}

const routeTemplate = getStrategicTemplate('strategic_establish_trade_route')!; // mutationHint: create_trade_route
const surveyTemplate = getStrategicTemplate('strategic_survey_market')!;        // mutationHint: record_intelligence

describe('computeRouteFormationBias', () => {
  it('is zero for a non-route template even when the pair is complementary', () => {
    const source = locNode('src', { grain: { stockTier: 'surplus' } });
    const target = locNode('dst', { grain: { stockTier: 'scarce' } });
    expect(computeRouteFormationBias(surveyTemplate, source, target)).toBe(0);
  });

  it('is zero when the source endpoint node is missing (fail-soft)', () => {
    const target = locNode('dst', { grain: { stockTier: 'scarce' } });
    expect(computeRouteFormationBias(routeTemplate, undefined, target)).toBe(0);
  });

  it('rewards a complementary (surplus↔scarce) pair, matching ROUTE_FORMATION_BALANCE_BIAS × balance', () => {
    const source = locNode('src', { grain: { stockTier: 'surplus' } });
    const target = locNode('dst', { grain: { stockTier: 'scarce' } });

    const bias = computeRouteFormationBias(routeTemplate, source, target);
    const expected = ROUTE_FORMATION_BALANCE_BIAS
      * scoreRoutePairBalance(source.properties, target.properties);

    expect(bias).toBeCloseTo(expected, 10);
    expect(bias).toBeGreaterThan(0);
  });

  it('is zero for a matched (surplus↔surplus) pair — neither end wants what the other exports', () => {
    const source = locNode('src', { grain: { stockTier: 'surplus' } });
    const target = locNode('dst', { grain: { stockTier: 'surplus' } });
    expect(computeRouteFormationBias(routeTemplate, source, target)).toBe(0);
  });

  it('never exceeds ROUTE_FORMATION_BALANCE_BIAS (balance is clamped to 1)', () => {
    const source = locNode('src', {
      arcane_crystal: { stockTier: 'surplus' },
      grain: { stockTier: 'scarce' },
    });
    const target = locNode('dst', {
      arcane_crystal: { stockTier: 'scarce' },
      grain: { stockTier: 'surplus' },
    });
    const bias = computeRouteFormationBias(routeTemplate, source, target);
    expect(bias).toBeGreaterThan(0);
    expect(bias).toBeLessThanOrEqual(ROUTE_FORMATION_BALANCE_BIAS);
  });
});

describe('generateStrategicCandidates — route-formation balance bias wiring (THR-616)', () => {
  /**
   * Actor sits at a village (excluded from the establish_trade_route target
   * subtypes), so the sole route target is the complementary town — its
   * candidate's worldImpact must exceed the flat create-verb base (0.8).
   */
  function buildComplementaryGraph() {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor_merchant',
      name: 'Merchant Kael',
      type: 'actor',
      properties: {
        actorType: 'individual',
        spotlightTier: 'spotlight',
        domainCapabilities: { gold: 0.6, eye: 0.4, heart: 0.3, shadow: 0.1, iron: 0.2, stone: 0.2, star: 0.1, veil: 0.1 },
      },
    });
    // Home village (surplus grain) — not a valid trade-route target subtype, so it is not scored as self.
    graph.addNode({
      id: 'loc_village',
      name: 'Home Village',
      type: 'location',
      properties: { locationSubtype: 'village', hexCol: 5, hexRow: 5, resources: { grain: { quantity: 90, renewable: true, renewalRate: 0.1, stockTier: 'surplus' } } },
    });
    // Town that wants grain (scarce) — the complementary partner.
    graph.addNode({
      id: 'loc_town',
      name: 'Millhaven',
      type: 'location',
      properties: { locationSubtype: 'town', hexCol: 6, hexRow: 5, resources: { grain: { quantity: 10, renewable: true, renewalRate: 0.1, stockTier: 'scarce' } } },
    });
    graph.addEdge({ id: 'located_merchant', source: 'actor_merchant', target: 'loc_village', type: 'located_at', properties: {} });
    graph.addNode({ id: 'ambition_node', name: 'Dominate Regional Trade', type: 'event', properties: { templateId: 'ambition_dominate_trade' } });
    graph.addEdge({ id: 'pursues_merchant_trade', source: 'actor_merchant', target: 'ambition_node', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });
    return graph;
  }

  it('lifts the worldImpact of a complementary route candidate above the flat create base', () => {
    const graph = buildComplementaryGraph();
    const result = generateStrategicCandidates(
      graph, 'actor_merchant', ['ambition_dominate_trade'], undefined, 10, mulberry32(42),
    );

    const routeCandidates = result.candidates.filter(c => c.templateId === 'strategic_establish_trade_route');
    expect(routeCandidates.length).toBeGreaterThan(0);
    // The complementary town route carries the bias (create base 0.8 + bias > 0.8).
    expect(Math.max(...routeCandidates.map(c => c.scoreComponents.worldImpact))).toBeGreaterThan(0.8);
  });
});

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateStrategicCandidates, getStrategicTemplate, getAllStrategicTemplates } from '../strategicActionCandidates';
import { mulberry32 } from '../../lib/prng';

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

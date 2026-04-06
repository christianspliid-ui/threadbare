import { describe, it, expect } from 'vitest';
import { runSettlementGenome } from '../settlementGenome';
import { WorldGraph } from '../graph';

function makeSettlementNode(graph: WorldGraph, id: string, subtype: string) {
  graph.addNode({
    id,
    type: 'location',
    name: `Test ${subtype}`,
    properties: { locationSubtype: subtype, hexCol: 5, hexRow: 5 },
  });
}

describe('runSettlementGenome', () => {
  describe('Pass 1: Infrastructure', () => {
    it('hamlet gets inn, well-fountain, market-stall', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'hamlet');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'hamlet', sphereInfluence: {}, position: 'heartland',
        cultureId: null, seed: 42,
      });
      const infraIds = result.sublocations
        .filter(s => s.sourcePass === 'infrastructure').map(s => s.id);
      expect(infraIds).toContain('sublocation-type.inn');
      expect(infraIds).toContain('sublocation-type.well-fountain');
      expect(infraIds).toContain('sublocation-type.market-stall');
    });

    it('town gets hamlet infrastructure plus town-tier sublocations', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'heartland',
        cultureId: null, seed: 42,
      });
      const infraIds = result.sublocations
        .filter(s => s.sourcePass === 'infrastructure').map(s => s.id);
      expect(infraIds).toContain('sublocation-type.inn');
      expect(infraIds).toContain('sublocation-type.gatehouse');
      expect(infraIds).toContain('sublocation-type.town-hall');
    });
  });

  describe('Pass 3: Spheres', () => {
    it('high force sphere adds barracks at town tier', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: { force: 0.7 }, position: 'heartland',
        cultureId: null, seed: 42,
      });
      const sphereIds = result.sublocations
        .filter(s => s.sourcePass === 'sphere').map(s => s.id);
      expect(sphereIds).toContain('sublocation-type.barracks');
    });

    it('sphere below threshold contributes nothing', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: { force: 0.2 }, position: 'heartland',
        cultureId: null, seed: 42,
      });
      const sphereIds = result.sublocations
        .filter(s => s.sourcePass === 'sphere').map(s => s.id);
      expect(sphereIds).not.toContain('sublocation-type.barracks');
    });

    it('borderland position adds city-walls and watchtower', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'borderland',
        cultureId: null, seed: 42,
      });
      const allIds = result.sublocations.map(s => s.id);
      expect(allIds).toContain('sublocation-type.city-walls');
      expect(allIds).toContain('sublocation-type.watchtower');
    });
  });

  describe('Pass 4: Reaches', () => {
    it('high gold reach adds counting-house at town', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'heartland',
        cultureId: null, seed: 42, reachOverrides: { gold: 0.5 },
      });
      const reachIds = result.sublocations
        .filter(s => s.sourcePass === 'reach').map(s => s.id);
      expect(reachIds).toContain('sublocation-type.counting-house');
    });
  });

  describe('Pass 5: Archetype Recognition', () => {
    it('3+ military tags triggers Garrison Town archetype', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'city');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'city',
        sphereInfluence: { force: 0.7, light: 0.5 },
        position: 'borderland',
        cultureId: null, seed: 42,
        reachOverrides: { iron: 0.5 },
      });
      // force sphere → smithy(military), barracks(military), arena(military)
      // light sphere → watchtower(military), beacon-tower(military)
      // borderland → city-walls(military), watchtower(military)
      // iron reach → armory(military), war-council(military+authority)
      // Should have 3+ military tags → Garrison Town or Frontier Bastion
      expect(result.archetypeId).toBeTruthy();
    });
  });

  describe('Pass 2: Culture', () => {
    it('culture contributes sublocations to a town', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      graph.addNode({
        id: 'culture_0', type: 'actor', name: 'Daru',
        properties: {
          actorType: 'culture',
          cultureIdentity: { foundationBias: 'force', demonym: 'Daru' },
        },
      });
      graph.addEdge({
        id: 'e_cult', type: 'belongs_to', source: 'loc_1', target: 'culture_0',
        properties: { culturalStrength: 0.7, cultureLayer: 'current' },
      });

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'heartland',
        cultureId: 'culture_0', seed: 42,
      });

      const cultureSubIds = result.sublocations
        .filter(s => s.sourcePass === 'culture').map(s => s.id);
      expect(cultureSubIds.length).toBeGreaterThan(0);
    });

    it('force culture substitutes temple-quarter with forge-shrine', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      graph.addNode({
        id: 'culture_0', type: 'actor', name: 'Daru',
        properties: {
          actorType: 'culture',
          cultureIdentity: { foundationBias: 'force', demonym: 'Daru' },
        },
      });
      graph.addEdge({
        id: 'e_cult', type: 'belongs_to', source: 'loc_1', target: 'culture_0',
        properties: { culturalStrength: 0.7, cultureLayer: 'current' },
      });

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'heartland',
        cultureId: 'culture_0', seed: 42,
      });

      const allIds = result.sublocations.map(s => s.id);
      // Force culture replaces temple-quarter with forge-shrine
      expect(allIds).toContain('sublocation-type.forge-shrine');
      expect(allIds).not.toContain('sublocation-type.temple-quarter');
    });

    it('low culture strength limits to 1 substitution only, no additions', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'city');
      graph.addNode({
        id: 'culture_0', type: 'actor', name: 'Daru',
        properties: {
          actorType: 'culture',
          cultureIdentity: { foundationBias: 'force', demonym: 'Daru' },
        },
      });
      graph.addEdge({
        id: 'e_cult', type: 'belongs_to', source: 'loc_1', target: 'culture_0',
        properties: { culturalStrength: 0.2, cultureLayer: 'current' },
      });

      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'city', sphereInfluence: {}, position: 'heartland',
        cultureId: 'culture_0', seed: 42,
      });

      const cultureSubs = result.sublocations.filter(s => s.sourcePass === 'culture');
      // Low strength: 1 substitution max, no additions
      expect(cultureSubs.length).toBeLessThanOrEqual(1);
    });

    it('no culture ID means Pass 2 is skipped', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'town');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'town', sphereInfluence: {}, position: 'heartland',
        cultureId: null, seed: 42,
      });
      const cultureSubs = result.sublocations.filter(s => s.sourcePass === 'culture');
      expect(cultureSubs.length).toBe(0);
    });
  });

  describe('Deduplication', () => {
    it('same sublocation from multiple passes is deduplicated', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'city');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'city', sphereInfluence: { order: 0.5 }, position: 'heartland',
        cultureId: null, seed: 42, reachOverrides: { star: 0.5 },
      });
      const allIds = result.sublocations.map(s => s.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('NPC budget', () => {
    it('respects hamlet NPC budget cap', () => {
      const graph = new WorldGraph();
      makeSettlementNode(graph, 'loc_1', 'hamlet');
      const result = runSettlementGenome(graph, 'loc_1', {
        tier: 'hamlet',
        sphereInfluence: { force: 0.9, matter: 0.9, life: 0.9 },
        position: 'borderland',
        cultureId: null, seed: 42,
      });
      expect(result.npcs.length).toBeLessThanOrEqual(
        3 + Math.ceil(result.sublocations.length * 1),
      );
    });
  });
});

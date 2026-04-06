import { describe, it, expect } from 'vitest';
import { computeSettlementReaches } from '../settlementGenome/runGenome';
import { computeVitality } from '../settlementGenome/vitality';
import { WorldGraph } from '../graph';

describe('computeSettlementReaches', () => {
  it('returns non-zero gold reach when merchant faction is present via located_at', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_merchant',
      type: 'actor',
      name: 'Merchant Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { gold: 0.9, iron: 0.1 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'faction_merchant', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(reaches.gold).toBeGreaterThan(0);
  });

  it('returns non-zero gold reach when merchant faction is present via member_of', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_merchant',
      type: 'actor',
      name: 'Merchant Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { gold: 0.9, iron: 0.1 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'member_of', source: 'faction_merchant', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(reaches.gold).toBeGreaterThan(0);
  });

  it('returns empty object when no factions are present', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(Object.keys(reaches)).toHaveLength(0);
  });

  it('normalizes reach values to 0-1 range', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'faction_a',
      type: 'actor',
      name: 'Iron Guild',
      properties: {
        actorType: 'faction',
        reachWeights: { iron: 5.0, gold: 2.0 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'faction_a', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    for (const val of Object.values(reaches)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('ignores non-faction actors', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_1', type: 'location', name: 'Town', properties: {} });
    graph.addNode({
      id: 'agent_1',
      type: 'actor',
      name: 'Some Hero',
      properties: {
        actorType: 'agent',
        reachWeights: { gold: 0.9 },
      },
    });
    graph.addEdge({
      id: 'e1', type: 'located_at', source: 'agent_1', target: 'loc_1',
      properties: {},
    });

    const reaches = computeSettlementReaches(graph, 'loc_1');
    expect(Object.keys(reaches)).toHaveLength(0);
  });
});

describe('computeVitality', () => {
  it('returns value between 0 and 1', () => {
    const vitality = computeVitality({
      prosperity: 50,
      factionHealth: 0.8,
      threatPressure: 0.1,
      tradeActivity: 0.5,
      currentVitality: 0.5,
    });
    expect(vitality).toBeGreaterThanOrEqual(0);
    expect(vitality).toBeLessThanOrEqual(1);
  });

  it('high prosperity drives vitality up', () => {
    const low = computeVitality({
      prosperity: 20, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const high = computeVitality({
      prosperity: 90, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('threat pressure drives vitality down', () => {
    const safe = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0, tradeActivity: 0, currentVitality: 0.5,
    });
    const threatened = computeVitality({
      prosperity: 50, factionHealth: 0.5, threatPressure: 0.8, tradeActivity: 0, currentVitality: 0.5,
    });
    expect(threatened).toBeLessThan(safe);
  });

  it('clamps output to 0 when inputs push below zero', () => {
    const vitality = computeVitality({
      prosperity: 0,
      factionHealth: 0,
      threatPressure: 1,
      tradeActivity: 0,
      currentVitality: 0,
    });
    expect(vitality).toBeGreaterThanOrEqual(0);
  });

  it('clamps output to 1 when inputs push above one', () => {
    const vitality = computeVitality({
      prosperity: 100,
      factionHealth: 1,
      threatPressure: 0,
      tradeActivity: 1,
      currentVitality: 1,
    });
    expect(vitality).toBeLessThanOrEqual(1);
  });
});

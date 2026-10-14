/**
 * THR-1862 — economy reads that never landed. One test per defect: each pins the read
 * against the scale or node shape the economy actually writes.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../data/undertaking-objects';
import { titheMultiplier } from '../holdingIncome';
import { HOLDING_TITHE_PROSPERITY_MULTIPLIER } from '../../data/strategic-action-constants';
import { checkUnderfunded } from '../armyAttrition';
import { computeFactionPresence } from '../phaseProsperity';
import { phaseEconomicChronicle } from '../phaseEconomicChronicle';
import { WEALTH_TIER_COMFORTABLE, WEALTH_TIER_WEALTHY } from '../wealth';
import { computeRouteFormationBias, getStrategicTemplate } from '../strategicActionCandidates';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { ResourceInstance } from '../../types/resource';

function asState(graph: WorldGraph, extra: Partial<GameState> = {}): GameState {
  return { tick: 1, seed: 42, graph, tickEvents: [], chronicleEntries: [], ...extra } as unknown as GameState;
}

function town(graph: WorldGraph, id: string, prosperity: number): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationSubtype: 'town', prosperity } });
}

describe('THR-1862 — undertaking change × location works on the 0–100 prosperity scale', () => {
  const runVerb = (verb: 'change:raise' | 'change:lower', start: number): number => {
    const graph = new WorldGraph();
    town(graph, 'loc_town', start);
    graph.addNode({ id: 'actor', type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
    const semantic = getUndertakingObjectType('location')!.verbs[verb] as ObjectVerbSemantic;
    const ctx = {
      state: asState(graph), graph, actorId: 'actor',
      handle: { kind: 'node', nodeId: 'loc_town' }, tick: 1,
    } as unknown as ObjectVerbContext;
    expect(semantic(ctx).success).toBe(true);
    return graph.getNode('loc_town')!.properties.prosperity as number;
  };

  it('raises a town at 48 to 58 and lowers it to 38', () => {
    expect(runVerb('change:raise', 48)).toBe(58);
    expect(runVerb('change:lower', 48)).toBe(38);
  });

  it('never leaves [0, 100]', () => {
    expect(runVerb('change:raise', 95)).toBe(100);
    expect(runVerb('change:lower', 5)).toBe(0);
  });
});

describe('THR-1862 — the holding tithe bands on the 0–100 scale', () => {
  it('a town at 30, 60 and 80 pays the low, mid and high multiplier', () => {
    expect(titheMultiplier(30)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[0]);
    expect(titheMultiplier(60)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[1]);
    expect(titheMultiplier(80)).toBe(HOLDING_TITHE_PROSPERITY_MULTIPLIER[2]);
  });
});

describe('THR-1862 — army funding reads the derived faction prosperity', () => {
  it('a landed faction whose holdings sum below the threshold is underfunded', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'fac_poor', type: 'actor', name: 'Poor Crown', properties: { actorType: 'faction' } });
    town(graph, 'loc_a', 8);
    town(graph, 'loc_b', 7); // summed 15 → 0.15 < 0.2
    graph.addEdge({ id: 'c1', source: 'fac_poor', target: 'loc_a', type: 'controls', properties: {} });
    graph.addEdge({ id: 'c2', source: 'fac_poor', target: 'loc_b', type: 'controls', properties: {} });
    expect(checkUnderfunded(asState(graph), 'fac_poor', 2)).toBe(true);
  });

  it('a landed faction with prosperous holdings is funded', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'fac_rich', type: 'actor', name: 'Rich Crown', properties: { actorType: 'faction' } });
    town(graph, 'loc_a', 60);
    graph.addEdge({ id: 'c1', source: 'fac_rich', target: 'loc_a', type: 'controls', properties: {} });
    expect(checkUnderfunded(asState(graph), 'fac_rich', 2)).toBe(false);
  });

  it('a holdingless monster faction is never underfunded', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'fac_horde', type: 'actor', name: 'The Horde', properties: { actorType: 'faction' } });
    expect(checkUnderfunded(asState(graph), 'fac_horde', 2)).toBe(false);
  });

  it('a monster faction holding only its lair (the shape monsterFactionSeed writes) is never underfunded', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'fac_horde', type: 'actor', name: 'The Horde', properties: { actorType: 'faction', prosperity: 0.5 } });
    graph.addNode({ id: 'loc_lair', type: 'location', name: 'Lair', properties: { locationSubtype: 'lair' } });
    graph.addEdge({ id: 'c_lair', source: 'fac_horde', target: 'loc_lair', type: 'controls', properties: { establishedTick: 0 } });
    expect(checkUnderfunded(asState(graph), 'fac_horde', 2)).toBe(false);
  });
});

describe('THR-1862 — faction presence counts located members', () => {
  it('two factions with members in the settlement (one inside a place) count as two', () => {
    const graph = new WorldGraph();
    town(graph, 'loc_town', 40);
    graph.addNode({ id: 'loc_inn', type: 'location', name: 'Inn', properties: { parentLocationId: 'loc_town' } });
    graph.addNode({ id: 'fac_a', type: 'actor', name: 'A', properties: { actorType: 'faction' } });
    graph.addNode({ id: 'fac_b', type: 'actor', name: 'B', properties: { actorType: 'faction' } });
    const member = (id: string, at: string, faction: string, extra: Record<string, unknown> = {}) => {
      graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual', ...extra } });
      graph.addEdge({ id: `loc_${id}`, source: id, target: at, type: 'located_at', properties: {} });
      graph.addEdge({ id: `mem_${id}`, source: id, target: faction, type: 'member_of', properties: {} });
    };
    member('m1', 'loc_town', 'fac_a');
    member('m2', 'loc_inn', 'fac_b');
    member('m3', 'loc_town', 'fac_a'); // same faction twice counts once
    expect(computeFactionPresence(graph, 'loc_town')).toBe(2);

    // A dead member is not presence.
    graph.addNode({ id: 'fac_c', type: 'actor', name: 'C', properties: { actorType: 'faction' } });
    member('m4', 'loc_town', 'fac_c', { deceased: true });
    expect(computeFactionPresence(graph, 'loc_town')).toBe(2);
  });
});

describe('THR-1862 — the wealth-tier chronicle reads individuals', () => {
  it('a followed individual crossing a wealth tier produces a chronicle entry', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'mira', type: 'actor', name: 'Mira',
      properties: { actorType: 'individual', spotlightTier: 'spotlight', wealth: WEALTH_TIER_COMFORTABLE },
    });
    // First pass records the tier; nothing to chronicle yet.
    const first = phaseEconomicChronicle(asState(graph, { tick: 1 }));
    expect(first.chronicleEntries ?? []).toHaveLength(0);

    graph.getNode('mira')!.properties.wealth = WEALTH_TIER_WEALTHY;
    const second = phaseEconomicChronicle(asState(graph, { tick: 2 }));
    expect(second.chronicleEntries?.length ?? 0).toBeGreaterThan(0);
  });

  it('an individual with no spotlightTier (The First) reads as spotlight and is chronicled', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'first', type: 'actor', name: 'The First',
      properties: { actorType: 'individual', wealth: WEALTH_TIER_COMFORTABLE },
    });
    phaseEconomicChronicle(asState(graph, { tick: 1 }));
    graph.getNode('first')!.properties.wealth = WEALTH_TIER_WEALTHY;
    const second = phaseEconomicChronicle(asState(graph, { tick: 2 }));
    expect(second.chronicleEntries?.length ?? 0).toBeGreaterThan(0);
  });

  it('an ambient stranger crossing a wealth tier is tracked but not chronicled', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'npc_1', type: 'actor', name: 'Stranger',
      properties: { actorType: 'individual', spotlightTier: 'ambient', wealth: WEALTH_TIER_COMFORTABLE },
    });
    phaseEconomicChronicle(asState(graph, { tick: 1 }));
    graph.getNode('npc_1')!.properties.wealth = WEALTH_TIER_WEALTHY;
    const second = phaseEconomicChronicle(asState(graph, { tick: 2 }));
    expect(second.chronicleEntries ?? []).toHaveLength(0);
    expect(graph.getNode('npc_1')!.properties.previousWealthTier).toBe('Wealthy');
  });
});

describe('THR-1862 — route formation bias reads the create × route cell', () => {
  const locNode = (id: string, tier: 'surplus' | 'scarce'): GraphNode => {
    const grain: ResourceInstance = { quantity: 50, renewable: true, renewalRate: 0.1, stockTier: tier } as ResourceInstance;
    return { id, type: 'location', name: id, properties: { resources: { grain } } } as GraphNode;
  };

  it('a create × route cell between a surplus and a scarce town gets a positive bias', () => {
    const cell = getStrategicTemplate('cell.create.route');
    expect(cell).toBeDefined();
    expect(cell!.mutationHint?.type).not.toBe('create_trade_route'); // the shape the old read missed
    expect(computeRouteFormationBias(cell!, locNode('src', 'surplus'), locNode('dst', 'scarce'))).toBeGreaterThan(0);
  });
});

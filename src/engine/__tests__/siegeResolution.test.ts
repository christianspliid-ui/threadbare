import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createSiegeNode,
  tickSiege,
  getSiegePacingInterval,
  getSiegePhase,
  getFortificationModifier,
} from '../siegeResolution';
import {
  SIEGE_INITIAL_INTERVAL,
  SIEGE_DEFENDER_MOMENTUM_BONUS,
  SIEGE_MAX_DURATION,
  SIEGE_RESOLUTION_THRESHOLD,
  SIEGE_STARVATION_TICK,
  FORTIFICATION_BASIC,
  FORTIFICATION_GRAND,
  PREPARED_DEFENSE_MULTIPLIER,
} from '../../types/battle';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph): GameState {
  return { tick, seed: 42, graph } as unknown as GameState;
}

function addSettlement(graph: WorldGraph, id: string, subtype: string = 'town'): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Settlement ${id}`,
    properties: { terrain: 'plains', locationSubtype: subtype },
  });
}

function addArmy(graph: WorldGraph, id: string, factionId: string, locationId: string, headcount: number = 100): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Army ${id}`,
    properties: {
      actorType: 'group',
      armyState: {
        size: 'warband',
        headcount,
        objective: null,
        quintessence: 30,
        quintessenceMax: 30,
        raisedTick: 0,
        maintenanceCost: 2,
        thresholdsFired: [],
      } as ArmyState,
    },
  });
  graph.addEdge({
    id: `e_member_${id}`,
    source: id,
    target: factionId,
    type: 'member_of',
    properties: { role: 'army', rank: 'army', joinedTick: 0 },
  });
  graph.addEdge({
    id: `e_loc_${id}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function addFaction(graph: WorldGraph, id: string): void {
  graph.addNode({ id, type: 'actor', name: `Faction ${id}`, properties: { actorType: 'faction' } });
}

// ─── Pacing Tests ──────────────────────────────────────────────────────────

describe('getSiegePacingInterval', () => {
  it('starts at SIEGE_INITIAL_INTERVAL', () => {
    expect(getSiegePacingInterval(0)).toBe(SIEGE_INITIAL_INTERVAL);
  });

  it('decreases over time', () => {
    const early = getSiegePacingInterval(5);
    const late = getSiegePacingInterval(25);
    expect(late).toBeLessThan(early);
  });

  it('floors at 1 (every-tick spotlights)', () => {
    expect(getSiegePacingInterval(100)).toBe(1);
  });
});

describe('getSiegePhase', () => {
  it('returns opening for ticks 0-3', () => {
    expect(getSiegePhase(0)).toBe('opening');
    expect(getSiegePhase(3)).toBe('opening');
  });

  it('returns early for ticks 4-10', () => {
    expect(getSiegePhase(4)).toBe('early');
    expect(getSiegePhase(10)).toBe('early');
  });

  it('returns middle for ticks 11-20', () => {
    expect(getSiegePhase(11)).toBe('middle');
    expect(getSiegePhase(20)).toBe('middle');
  });

  it('returns crescendo for ticks 21+', () => {
    expect(getSiegePhase(21)).toBe('crescendo');
    expect(getSiegePhase(100)).toBe('crescendo');
  });
});

describe('getFortificationModifier', () => {
  it('returns FORTIFICATION_GRAND for city and capital', () => {
    expect(getFortificationModifier('city')).toBe(FORTIFICATION_GRAND);
    expect(getFortificationModifier('capital')).toBe(FORTIFICATION_GRAND);
  });

  it('returns FORTIFICATION_BASIC for town', () => {
    expect(getFortificationModifier('town')).toBe(FORTIFICATION_BASIC);
  });

  it('returns PREPARED_DEFENSE_MULTIPLIER for hamlet', () => {
    expect(getFortificationModifier('hamlet')).toBe(PREPARED_DEFENSE_MULTIPLIER);
  });

  it('returns 1 for unknown', () => {
    expect(getFortificationModifier(undefined)).toBe(1);
  });
});

// ─── Siege Creation Tests ──────────────────────────────────────────────────

describe('createSiegeNode', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'town1', 500);
  });

  it('creates siege node with battleType siege', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1');
    expect(siegeId).not.toBeNull();
    const bs = graph.getNode(siegeId!)?.properties.battleState as BattleState;
    expect(bs.battleType).toBe('siege');
    expect(bs.settlementId).toBe('town1');
  });

  it('applies defender momentum bonus', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    // Momentum should be reduced by defender bonus
    expect(bs.momentum).toBeLessThanOrEqual(bs.initialMomentumOffset);
  });

  it('creates participates_in edge for attacker', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const edges = graph.getOutgoingEdges('army1', 'participates_in');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe(siegeId);
  });

  it('creates located_at edge', () => {
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const edges = graph.getOutgoingEdges(siegeId, 'located_at');
    expect(edges).toHaveLength(1);
  });

  it('fortification modifier makes defense much stronger', () => {
    // Town has FORTIFICATION_BASIC (10x) — 200 garrison * 10 = 2000 effective
    // vs 500 attacker — defender should have significant momentum advantage
    const siegeId = createSiegeNode(makeState(5, graph), 'army1', 'town1', 'town1')!;
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    expect(bs.momentum).toBeLessThan(0); // Defender advantage due to walls
  });
});

// ─── Siege Tick Tests ──────────────────────────────────────────────────────

describe('tickSiege', () => {
  let graph: WorldGraph;
  let siegeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    addSettlement(graph, 'town1', 'town');
    addFaction(graph, 'f1');
    addArmy(graph, 'army1', 'f1', 'town1', 500);
    siegeId = createSiegeNode(makeState(0, graph), 'army1', 'town1', 'town1')!;
  });

  it('applies asymmetric attrition (attacker loses more)', () => {
    const qBefore = (graph.getNode('army1')?.properties.armyState as ArmyState).quintessence;
    tickSiege(makeState(1, graph), siegeId);
    const qAfter = (graph.getNode('army1')?.properties.armyState as ArmyState).quintessence;
    expect(qAfter).toBeLessThan(qBefore);
  });

  it('starvation fires at SIEGE_STARVATION_TICK', () => {
    // Tick past starvation threshold
    const state = makeState(SIEGE_STARVATION_TICK + 1, graph);
    // Manually set startedTick so ticksElapsed reaches starvation
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 1 },
      },
    });

    tickSiege(state, siegeId);
    expect(graph.getNode(siegeId)?.properties.starvationFired).toBe(true);
  });

  it('resolves on max duration timeout', () => {
    // Set startedTick to make it time out
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, startedTick: 0 },
      },
    });

    // Tick past max duration
    const state = makeState(SIEGE_MAX_DURATION + 1, graph);
    tickSiege(state, siegeId);
    expect(graph.getNode(siegeId)).toBeUndefined();
  });

  it('resolves when attacker quintessence hits 0', () => {
    // Set attacker Q very low
    const armyNode = graph.getNode('army1')!;
    graph.updateNode('army1', {
      properties: {
        ...armyNode.properties,
        armyState: { ...(armyNode.properties.armyState as ArmyState), quintessence: 0.5 },
      },
    });

    tickSiege(makeState(1, graph), siegeId);
    expect(graph.getNode(siegeId)).toBeUndefined();
  });

  it('resolves when momentum crosses siege threshold', () => {
    // Set momentum near siege threshold
    const bs = graph.getNode(siegeId)?.properties.battleState as BattleState;
    graph.updateNode(siegeId, {
      properties: {
        ...graph.getNode(siegeId)!.properties,
        battleState: { ...bs, momentum: SIEGE_RESOLUTION_THRESHOLD - 1 },
      },
    });

    // Tick multiple times until resolved
    for (let t = 1; t <= 20; t++) {
      if (!graph.getNode(siegeId)) break;
      tickSiege(makeState(t, graph), siegeId);
    }
    expect(graph.getNode(siegeId)).toBeUndefined();
  });
});

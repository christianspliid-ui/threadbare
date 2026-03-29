import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  calculateInitialMomentum,
  createBattleNode,
  tickBattle,
  resolveBattle,
  phaseBattleDetection,
  phaseBattleTick,
} from '../battleResolution';
import { BATTLE_RESOLUTION_THRESHOLD, FIELD_BATTLE_MAX_DURATION, BATTLE_COMBAT_ATTRITION } from '../../types/battle';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph, seed: number = 42): GameState {
  return { tick, seed, graph } as unknown as GameState;
}

function addHex(graph: WorldGraph, id: string, name: string = 'Test Hex'): void {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { terrain: 'plains', locationSubtype: 'hex_center' },
  });
}

function addArmy(
  graph: WorldGraph,
  id: string,
  factionId: string,
  locationId: string,
  opts?: Partial<ArmyState>,
): void {
  const armyState: ArmyState = {
    size: opts?.size ?? 'warband',
    headcount: opts?.headcount ?? 100,
    objective: null,
    quintessence: opts?.quintessence ?? 30,
    quintessenceMax: opts?.quintessenceMax ?? 30,
    raisedTick: opts?.raisedTick ?? 0,
    maintenanceCost: 2,
    thresholdsFired: [],
  };

  graph.addNode({
    id,
    type: 'actor',
    name: `Army ${id}`,
    properties: { actorType: 'group', armyState },
  });

  // member_of → faction
  graph.addEdge({
    id: `e_member_${id}_${factionId}`,
    source: id,
    target: factionId,
    type: 'member_of',
    properties: { role: 'army', rank: 'army', joinedTick: 0 },
  });

  // located_at → hex
  graph.addEdge({
    id: `e_loc_${id}`,
    source: id,
    target: locationId,
    type: 'located_at',
    properties: {},
  });
}

function addFaction(graph: WorldGraph, id: string, name: string = 'Faction'): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: { actorType: 'faction' },
  });
}

function getBattleState(graph: WorldGraph, battleId: string): BattleState | undefined {
  return graph.getNode(battleId)?.properties.battleState as BattleState | undefined;
}

// ─── Momentum Tests ────────────────────────────────────────────────────────

describe('calculateInitialMomentum', () => {
  it('returns 0 for equal armies', () => {
    expect(calculateInitialMomentum(100, 100)).toBe(0);
  });

  it('returns positive for larger attacker', () => {
    const momentum = calculateInitialMomentum(200, 100);
    expect(momentum).toBeGreaterThan(0);
  });

  it('returns negative for larger defender', () => {
    const momentum = calculateInitialMomentum(100, 200);
    expect(momentum).toBeLessThan(0);
  });

  it('clamps to ±(threshold - 2) so spotlights matter', () => {
    const maxAllowed = BATTLE_RESOLUTION_THRESHOLD - 2;
    const momentum = calculateInitialMomentum(100000, 1); // extreme ratio
    expect(momentum).toBeLessThanOrEqual(maxAllowed);
    expect(momentum).toBeGreaterThanOrEqual(-maxAllowed);
  });

  it('applies defender modifier', () => {
    // Defender with 3x modifier (fortification) — 100 vs 100*3=300 effective
    const withMod = calculateInitialMomentum(100, 100, 3);
    expect(withMod).toBeLessThan(0); // defender advantage
  });
});

// ─── Battle Creation Tests ─────────────────────────────────────────────────

describe('createBattleNode', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    addHex(graph, 'hex1', 'Windswept Plains');
    addFaction(graph, 'f1', 'Red Company');
    addFaction(graph, 'f2', 'Blue Order');
    addArmy(graph, 'army_r', 'f1', 'hex1');
    addArmy(graph, 'army_b', 'f2', 'hex1');
  });

  it('creates battle node with correct state', () => {
    const state = makeState(5, graph);
    const battleId = createBattleNode(state, 'army_r', 'army_b', 'hex1');

    expect(battleId).not.toBeNull();
    const bs = getBattleState(graph, battleId!);
    expect(bs).toBeDefined();
    expect(bs!.battleType).toBe('field_battle');
    expect(bs!.startedTick).toBe(5);
    expect(bs!.attackerArmyId).toBe('army_r');
    expect(bs!.defenderArmyId).toBe('army_b');
  });

  it('creates participates_in edges for both armies', () => {
    const state = makeState(5, graph);
    const battleId = createBattleNode(state, 'army_r', 'army_b', 'hex1')!;

    const attackerEdges = graph.getOutgoingEdges('army_r', 'participates_in');
    const defenderEdges = graph.getOutgoingEdges('army_b', 'participates_in');

    expect(attackerEdges).toHaveLength(1);
    expect(attackerEdges[0].target).toBe(battleId);
    expect(attackerEdges[0].properties.role).toBe('attacker');

    expect(defenderEdges).toHaveLength(1);
    expect(defenderEdges[0].target).toBe(battleId);
    expect(defenderEdges[0].properties.role).toBe('defender');
  });

  it('creates located_at edge to hex', () => {
    const state = makeState(5, graph);
    const battleId = createBattleNode(state, 'army_r', 'army_b', 'hex1')!;

    const locEdges = graph.getOutgoingEdges(battleId, 'located_at');
    expect(locEdges).toHaveLength(1);
    expect(locEdges[0].target).toBe('hex1');
  });

  it('returns null for missing armies', () => {
    const state = makeState(5, graph);
    expect(createBattleNode(state, 'nonexistent', 'army_b', 'hex1')).toBeNull();
  });
});

// ─── Battle Tick Tests ─────────────────────────────────────────────────────

describe('tickBattle', () => {
  let graph: WorldGraph;
  let battleId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    addHex(graph, 'hex1');
    addFaction(graph, 'f1');
    addFaction(graph, 'f2');
    addArmy(graph, 'army_a', 'f1', 'hex1', { quintessence: 30, quintessenceMax: 30 });
    addArmy(graph, 'army_d', 'f2', 'hex1', { quintessence: 30, quintessenceMax: 30 });

    const state = makeState(0, graph);
    battleId = createBattleNode(state, 'army_a', 'army_d', 'hex1')!;
  });

  it('applies combat attrition to both armies', () => {
    tickBattle(makeState(1, graph), battleId);

    const aState = graph.getNode('army_a')?.properties.armyState as ArmyState;
    const dState = graph.getNode('army_d')?.properties.armyState as ArmyState;

    expect(aState.quintessence).toBe(30 - BATTLE_COMBAT_ATTRITION);
    expect(dState.quintessence).toBe(30 - BATTLE_COMBAT_ATTRITION);
  });

  it('resolves when momentum crosses threshold', () => {
    // Manually set momentum near threshold
    const bs = getBattleState(graph, battleId)!;
    graph.updateNode(battleId, {
      properties: {
        ...graph.getNode(battleId)!.properties,
        battleState: { ...bs, momentum: BATTLE_RESOLUTION_THRESHOLD - 1 },
      },
    });

    // Multiple ticks should eventually resolve (momentum shifts are seeded)
    for (let tick = 1; tick <= 10; tick++) {
      if (!graph.getNode(battleId)) break;
      tickBattle(makeState(tick, graph), battleId);
    }

    // Battle should be resolved and removed
    expect(graph.getNode(battleId)).toBeUndefined();
  });

  it('resolves on max duration timeout', () => {
    // Tick past max duration
    const startTick = 0;
    for (let t = 1; t <= FIELD_BATTLE_MAX_DURATION + 1; t++) {
      if (!graph.getNode(battleId)) break;
      tickBattle(makeState(startTick + t, graph), battleId);
    }

    expect(graph.getNode(battleId)).toBeUndefined();
  });

  it('resolves as defender_victory when attacker quintessence hits 0', () => {
    // Set attacker Q very low
    const attackerNode = graph.getNode('army_a')!;
    graph.updateNode('army_a', {
      properties: {
        ...attackerNode.properties,
        armyState: { ...(attackerNode.properties.armyState as ArmyState), quintessence: 1 },
      },
    });

    tickBattle(makeState(1, graph), battleId);

    // Battle should be resolved (attacker collapsed)
    expect(graph.getNode(battleId)).toBeUndefined();
  });
});

// ─── Battle Detection Tests ────────────────────────────────────────────────

describe('phaseBattleDetection', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    addHex(graph, 'hex1');
    addFaction(graph, 'f1', 'Faction A');
    addFaction(graph, 'f2', 'Faction B');
  });

  it('creates battle when two hostile armies at same hex', () => {
    addArmy(graph, 'army1', 'f1', 'hex1');
    addArmy(graph, 'army2', 'f2', 'hex1');

    phaseBattleDetection(makeState(1, graph));

    const battles = graph.getNodesByType('actor')
      .filter(n => n.properties.battleState);
    expect(battles).toHaveLength(1);
  });

  it('does not create battle for armies of same faction', () => {
    addArmy(graph, 'army1', 'f1', 'hex1');
    addArmy(graph, 'army2', 'f1', 'hex1'); // same faction

    phaseBattleDetection(makeState(1, graph));

    const battles = graph.getNodesByType('actor')
      .filter(n => n.properties.battleState);
    expect(battles).toHaveLength(0);
  });

  it('skips armies already in battle', () => {
    addArmy(graph, 'army1', 'f1', 'hex1');
    addArmy(graph, 'army2', 'f2', 'hex1');

    // Create a battle first
    const state = makeState(1, graph);
    createBattleNode(state, 'army1', 'army2', 'hex1');

    // Detection should not create a second battle
    phaseBattleDetection(state);

    const battles = graph.getNodesByType('actor')
      .filter(n => n.properties.battleState);
    expect(battles).toHaveLength(1);
  });

  it('handles single army at hex (no battle)', () => {
    addArmy(graph, 'army1', 'f1', 'hex1');

    phaseBattleDetection(makeState(1, graph));

    const battles = graph.getNodesByType('actor')
      .filter(n => n.properties.battleState);
    expect(battles).toHaveLength(0);
  });
});

// ─── Resolution Tests ──────────────────────────────────────────────────────

describe('resolveBattle', () => {
  it('removes battle node from graph', () => {
    const graph = new WorldGraph();
    addHex(graph, 'hex1');
    addFaction(graph, 'f1');
    addFaction(graph, 'f2');
    addArmy(graph, 'army1', 'f1', 'hex1');
    addArmy(graph, 'army2', 'f2', 'hex1');

    const state = makeState(1, graph);
    const battleId = createBattleNode(state, 'army1', 'army2', 'hex1')!;

    expect(graph.getNode(battleId)).toBeDefined();
    resolveBattle(state, battleId, 'attacker_victory');
    expect(graph.getNode(battleId)).toBeUndefined();
  });

  it('cleans up participates_in edges', () => {
    const graph = new WorldGraph();
    addHex(graph, 'hex1');
    addFaction(graph, 'f1');
    addFaction(graph, 'f2');
    addArmy(graph, 'army1', 'f1', 'hex1');
    addArmy(graph, 'army2', 'f2', 'hex1');

    const state = makeState(1, graph);
    const battleId = createBattleNode(state, 'army1', 'army2', 'hex1')!;

    resolveBattle(state, battleId, 'stalemate');

    // participates_in edges should be gone
    expect(graph.getOutgoingEdges('army1', 'participates_in')).toHaveLength(0);
    expect(graph.getOutgoingEdges('army2', 'participates_in')).toHaveLength(0);
  });
});

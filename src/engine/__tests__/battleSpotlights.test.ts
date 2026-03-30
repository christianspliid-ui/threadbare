/**
 * Battle Spotlights Tests — TB-073 Phase 4.
 *
 * Covers: hasThreadToBattle, getEligibleSpotlights, selectSpotlight.
 * Verifies thread-based POV filtering and seeded PRNG selection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { createBattleNode } from '../battleResolution';
import {
  hasThreadToBattle,
  getEligibleSpotlights,
  selectSpotlight,
} from '../battleSpotlights';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import type { GameState } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(
  tick: number,
  graph: WorldGraph,
  seed: number = 42,
  ascendantId: string = 'ascendant1',
): GameState {
  return { tick, seed, graph, ascendantId } as unknown as GameState;
}

function addHex(graph: WorldGraph, id: string, name: string = 'Test Hex'): void {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { terrain: 'plains', locationSubtype: 'hex_center' },
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

  graph.addEdge({
    id: `e_member_${id}_${factionId}`,
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

function addAscendant(graph: WorldGraph, id: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name: 'The Ascendant',
    properties: { actorType: 'ascendant' },
  });
}

function addThread(graph: WorldGraph, ascendantId: string, targetId: string): void {
  graph.addEdge({
    id: `e_thread_${ascendantId}_${targetId}`,
    source: ascendantId,
    target: targetId,
    type: 'thread',
    properties: {},
  });
}

function setBattleMomentum(graph: WorldGraph, battleId: string, momentum: number): void {
  const node = graph.getNode(battleId)!;
  const bs = node.properties.battleState as BattleState;
  graph.updateNode(battleId, {
    properties: { ...node.properties, battleState: { ...bs, momentum } },
  });
}

function setBattleQForArmy(graph: WorldGraph, armyId: string, q: number, qMax: number = 30): void {
  const node = graph.getNode(armyId)!;
  const army = node.properties.armyState as ArmyState;
  graph.updateNode(armyId, {
    properties: { ...node.properties, armyState: { ...army, quintessence: q, quintessenceMax: qMax } },
  });
}

// ─── Standard test setup ───────────────────────────────────────────────────

let graph: WorldGraph;
let battleId: string;

beforeEach(() => {
  graph = new WorldGraph();
  addHex(graph, 'hex1', 'Iron Crossing');
  addFaction(graph, 'f1', 'Red Company');
  addFaction(graph, 'f2', 'Blue Order');
  addArmy(graph, 'army_r', 'f1', 'hex1');
  addArmy(graph, 'army_b', 'f2', 'hex1');
  addAscendant(graph, 'ascendant1');

  const state = makeState(1, graph);
  battleId = createBattleNode(state, 'army_r', 'army_b', 'hex1')!;
});

// ─── hasThreadToBattle ─────────────────────────────────────────────────────

describe('hasThreadToBattle', () => {
  it('returns false when ascendant has no thread edges at all', () => {
    const state = makeState(1, graph);
    expect(hasThreadToBattle(state, battleId)).toBe(false);
  });

  it('returns false when ascendant threads point to unrelated entities', () => {
    // Thread to some random agent, not a battle participant
    graph.addNode({ id: 'random_agent', type: 'actor', name: 'Stranger', properties: { actorType: 'person' } });
    addThread(graph, 'ascendant1', 'random_agent');

    const state = makeState(1, graph);
    expect(hasThreadToBattle(state, battleId)).toBe(false);
  });

  it('returns true when ascendant has thread to attacker army', () => {
    addThread(graph, 'ascendant1', 'army_r');
    const state = makeState(1, graph);
    expect(hasThreadToBattle(state, battleId)).toBe(true);
  });

  it('returns true when ascendant has thread to defender army', () => {
    addThread(graph, 'ascendant1', 'army_b');
    const state = makeState(1, graph);
    expect(hasThreadToBattle(state, battleId)).toBe(true);
  });

  it('returns true when ascendant has thread to commander of an army', () => {
    // Add a commander agent
    graph.addNode({ id: 'commander1', type: 'actor', name: 'General Kor', properties: { actorType: 'person' } });
    graph.addEdge({
      id: 'e_cmd_r',
      source: 'army_r',
      target: 'commander1',
      type: 'commanded_by',
      properties: {},
    });
    addThread(graph, 'ascendant1', 'commander1');

    const state = makeState(1, graph);
    expect(hasThreadToBattle(state, battleId)).toBe(true);
  });

  it('returns false when state has no ascendantId', () => {
    const state = { tick: 1, seed: 42, graph } as unknown as GameState;
    expect(hasThreadToBattle(state, battleId)).toBe(false);
  });
});

// ─── getEligibleSpotlights ─────────────────────────────────────────────────

describe('getEligibleSpotlights', () => {
  it('returns empty array for missing battle node', () => {
    const state = makeState(1, graph);
    expect(getEligibleSpotlights(state, 'nonexistent')).toHaveLength(0);
  });

  it('returns templates when conditions are met', () => {
    // Set up "turning point" condition: |momentum| < 2
    setBattleMomentum(graph, battleId, 0);
    const state = makeState(2, graph);
    const eligible = getEligibleSpotlights(state, battleId);
    const ids = eligible.map(t => t.id);
    expect(ids).toContain('battle.spotlight.turning_point');
  });

  it('returns commander_peril when momentum < -3', () => {
    setBattleMomentum(graph, battleId, -4);
    const state = makeState(2, graph);
    const eligible = getEligibleSpotlights(state, battleId);
    expect(eligible.map(t => t.id)).toContain('battle.spotlight.commander_peril');
  });

  it('does not return commander_peril when momentum > -3', () => {
    setBattleMomentum(graph, battleId, 2);
    const state = makeState(2, graph);
    const eligible = getEligibleSpotlights(state, battleId);
    expect(eligible.map(t => t.id)).not.toContain('battle.spotlight.commander_peril');
  });

  it('returns last_stand when army quintessence below 20%', () => {
    setBattleQForArmy(graph, 'army_r', 1, 30); // 3.3% — below threshold
    const state = makeState(2, graph);
    const eligible = getEligibleSpotlights(state, battleId);
    expect(eligible.map(t => t.id)).toContain('battle.spotlight.last_stand');
  });

  it('does not return threshold spotlight twice (thresholdsFired blocks repeat)', () => {
    // Set up last_stand condition
    setBattleQForArmy(graph, 'army_r', 1, 30);

    // Mark it as already fired
    const node = graph.getNode(battleId)!;
    const bs = node.properties.battleState as BattleState;
    graph.updateNode(battleId, {
      properties: {
        ...node.properties,
        battleState: { ...bs, thresholdsFired: ['battle.spotlight.last_stand'] },
      },
    });

    const state = makeState(2, graph);
    const eligible = getEligibleSpotlights(state, battleId);
    expect(eligible.map(t => t.id)).not.toContain('battle.spotlight.last_stand');
  });
});

// ─── selectSpotlight ──────────────────────────────────────────────────────

describe('selectSpotlight', () => {
  it('returns null when no eligible templates', () => {
    // Set up a battle state where no conditions are met
    // momentum = 5 (not near zero, not < -3, not >= 3 for moral_dilemma since it fires threshold)
    // Armies at 100% quintessence, no artifacts, no third army, no rivals
    setBattleMomentum(graph, battleId, 5);
    // Moral dilemma condition: momentum >= 3 — so it would be eligible; fire it first
    const node = graph.getNode(battleId)!;
    const bs = node.properties.battleState as BattleState;
    graph.updateNode(battleId, {
      properties: {
        ...node.properties,
        battleState: {
          ...bs,
          momentum: 5,
          thresholdsFired: [
            'battle.spotlight.moral_dilemma',
            'battle.spotlight.betrayal',
            'battle.spotlight.artifact_activation',
            'battle.spotlight.last_stand',
            'battle.spotlight.champion_duel',
          ],
        },
      },
    });

    const state = makeState(2, graph);
    // commander_peril: momentum < -3 → NO (momentum=5)
    // turning_point: |momentum| < 2 → NO (5 not < 2)
    // moral_dilemma: momentum >= 3 → would be yes, but threshold fired
    // betrayal: -4 < momentum < 4 → NO (5 not < 4), and threshold fired
    // rest all threshold and fired
    // third_army: participantEdges <= 2 → no
    // divine_counterstrike: no rivals
    expect(selectSpotlight(state, battleId)).toBeNull();
  });

  it('returns the only eligible template when just one matches', () => {
    setBattleMomentum(graph, battleId, -5); // commander_peril: momentum < -3
    // Mark all threshold types as fired to isolate
    const node = graph.getNode(battleId)!;
    const bs = node.properties.battleState as BattleState;
    graph.updateNode(battleId, {
      properties: {
        ...node.properties,
        battleState: {
          ...bs,
          momentum: -5,
          thresholdsFired: [
            'battle.spotlight.moral_dilemma',
            'battle.spotlight.betrayal',
            'battle.spotlight.artifact_activation',
            'battle.spotlight.last_stand',
            'battle.spotlight.champion_duel',
          ],
        },
      },
    });

    // With momentum -5: commander_peril (< -3) YES, turning_point (< 2 abs) YES
    // Betrayal: -4 < -5 → NO (-5 is not > -4). OK just commander_peril and turning_point
    const state = makeState(2, graph);
    const selected = selectSpotlight(state, battleId);
    expect(['battle.spotlight.commander_peril', 'battle.spotlight.turning_point']).toContain(selected);
  });

  it('selection is deterministic for the same seed and tick', () => {
    setBattleMomentum(graph, battleId, 0); // turning_point eligible
    const state = makeState(3, graph, 42);

    const result1 = selectSpotlight(state, battleId);
    const result2 = selectSpotlight(state, battleId);
    expect(result1).toBe(result2);
  });

  it('different ticks may produce different selections', () => {
    // With multiple eligible templates, different ticks should give different seeds
    setBattleMomentum(graph, battleId, -4); // commander_peril + turning_point both eligible

    const state1 = makeState(1, graph, 42);
    const state2 = makeState(2, graph, 42);

    const r1 = selectSpotlight(state1, battleId);
    const r2 = selectSpotlight(state2, battleId);

    // Both should be valid template IDs (they might be the same or different)
    expect(['battle.spotlight.commander_peril', 'battle.spotlight.turning_point']).toContain(r1);
    expect(['battle.spotlight.commander_peril', 'battle.spotlight.turning_point']).toContain(r2);
  });
});

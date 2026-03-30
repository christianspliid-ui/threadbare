/**
 * Thread-based battle visibility — implemented in Phase 13, updated for Phase m2.5 API.
 *
 * hasThreadToBattle: returns true when ascendant has a thread edge to any
 * battle participant (army or commander). Uses getOutgoingEdges('thread')
 * and checks participates_in edges on the battle node.
 *
 * selectSpotlight: deterministically picks from eligible template pool using
 * seeded PRNG. Returns null when no eligible templates.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  hasThreadToBattle,
  selectSpotlight,
  getEligibleSpotlights,
} from '../battleSpotlights';
import type { BattleState } from '../../types/battle';
import type { GameState } from '../../types/gameState';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBattleState(overrides?: Partial<BattleState>): BattleState {
  return {
    battleType: 'field_battle',
    momentum: 0,
    backgroundProse: '',
    spotlightHistory: [],
    ticksSinceLastSpotlight: 0,
    startedTick: 1,
    initialMomentumOffset: 0,
    attackerArmyId: 'army_atk',
    defenderArmyId: 'army_def',
    thresholdsFired: [],
    ...overrides,
  };
}

function makeState(graph: WorldGraph, tick = 1, seed = 42): GameState {
  return { graph, tick, seed, ascendantId: 'asc' } as unknown as GameState;
}

/**
 * Build a minimal graph with a battle node, two armies + commanders, and an ascendant.
 * threadTarget: if provided, adds a thread edge from 'asc' to that node ID.
 * Returns the battle node ID.
 */
function makeGraph(threadTarget?: string, battleStateOverrides?: Partial<BattleState>): { graph: WorldGraph; battleNodeId: string } {
  const graph = new WorldGraph();

  // Ascendant node
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });

  // Attacker army + commander
  graph.addNode({ id: 'army_atk', type: 'actor', name: 'Attacker Army', properties: { actorType: 'group' } });
  graph.addNode({ id: 'cmd_atk', type: 'actor', name: 'Attacker Commander', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e_cmd_atk', source: 'army_atk', target: 'cmd_atk', type: 'commanded_by', properties: {} });

  // Defender army + commander
  graph.addNode({ id: 'army_def', type: 'actor', name: 'Defender Army', properties: { actorType: 'group' } });
  graph.addNode({ id: 'cmd_def', type: 'actor', name: 'Defender Commander', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e_cmd_def', source: 'army_def', target: 'cmd_def', type: 'commanded_by', properties: {} });

  // Battle node with battleState
  const bs = makeBattleState(battleStateOverrides);
  const battleNodeId = 'battle_1';
  graph.addNode({
    id: battleNodeId,
    type: 'actor',
    name: 'Battle',
    properties: { actorType: 'group', battleState: bs },
  });

  // participates_in edges: armies → battle
  graph.addEdge({ id: 'e_part_atk', source: 'army_atk', target: battleNodeId, type: 'participates_in', properties: { role: 'attacker' } });
  graph.addEdge({ id: 'e_part_def', source: 'army_def', target: battleNodeId, type: 'participates_in', properties: { role: 'defender' } });

  // Thread edge from ascendant to threadTarget (if supplied)
  if (threadTarget) {
    graph.addEdge({ id: 'e_thread', source: 'asc', target: threadTarget, type: 'thread', properties: {} });
  }

  return { graph, battleNodeId };
}

// ─── hasThreadToBattle tests ─────────────────────────────────────────────────

describe('hasThreadToBattle — thread-based spotlight visibility', () => {
  it('returns false when ascendant has no thread edges to any battle participant', () => {
    const { graph, battleNodeId } = makeGraph(); // no thread edges
    const state = makeState(graph);
    expect(hasThreadToBattle(state, battleNodeId)).toBe(false);
  });

  it('returns true when ascendant has thread edge to the attacker commander', () => {
    const { graph, battleNodeId } = makeGraph('cmd_atk');
    const state = makeState(graph);
    expect(hasThreadToBattle(state, battleNodeId)).toBe(true);
  });

  it('returns true when ascendant has thread edge to the defender army directly', () => {
    const { graph, battleNodeId } = makeGraph('army_def');
    const state = makeState(graph);
    expect(hasThreadToBattle(state, battleNodeId)).toBe(true);
  });

  it('no threads → no spotlight encounters spawned, battle resolves chronicle-only', () => {
    const { graph, battleNodeId } = makeGraph(); // no thread edges
    const state = makeState(graph);
    // hasThreadToBattle returns false — caller uses this to skip spotlight generation
    expect(hasThreadToBattle(state, battleNodeId)).toBe(false);
    // Note: selectSpotlight itself doesn't check threads — the caller (battle tick)
    // gates on hasThreadToBattle before calling selectSpotlight.
    // This test verifies the thread detection gate, not selectSpotlight behavior.
  });
});

// ─── selectSpotlight tests ───────────────────────────────────────────────────

describe('selectSpotlight — seeded PRNG selection among eligible templates', () => {
  it('returns null when no spotlight templates are eligible for current battle state', () => {
    // Battle node with no battle state → getEligibleSpotlights returns []
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'empty_battle', type: 'actor', name: 'Battle', properties: { actorType: 'group' } });
    const state = makeState(graph);
    // No battleState property → no eligible spotlights
    expect(selectSpotlight(state, 'empty_battle')).toBeNull();
  });

  it('returns a template ID when at least one template is eligible', () => {
    // Create a battle with momentum high enough to trigger some templates
    const { graph, battleNodeId } = makeGraph('cmd_atk', { momentum: 5 });
    const state = makeState(graph, 10, 42);
    const eligible = getEligibleSpotlights(state, battleNodeId);
    // If templates have conditions that pass, we should get a result
    if (eligible.length > 0) {
      const result = selectSpotlight(state, battleNodeId);
      expect(result).not.toBeNull();
      expect(eligible.map(t => t.id)).toContain(result);
    }
  });

  it('selection is deterministic for same seed and battle state', () => {
    const { graph, battleNodeId } = makeGraph('cmd_atk', { momentum: 5 });
    // Same state = same selection
    const state1 = makeState(graph, 10, 99);
    const state2 = makeState(graph, 10, 99);
    const result1 = selectSpotlight(state1, battleNodeId);
    const result2 = selectSpotlight(state2, battleNodeId);
    expect(result1).toBe(result2);
  });
});

/**
 * Thread-based battle visibility — implemented in Phase 13.
 *
 * Plan 13-02: Close 7 deferred .todo tests by implementing battleSpotlights.ts
 * with hasThreadToBattle and selectSpotlight.
 *
 * hasThreadToBattle: returns true when ascendant has a thread edge to any
 * battle participant (army or commander). Uses getOutgoingEdges('thread').
 *
 * selectSpotlight: deterministically picks from eligible template pool using
 * seeded PRNG. Returns null when no thread or no eligible templates.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  hasThreadToBattle,
  selectSpotlight,
  SPOTLIGHT_TEMPLATES,
} from '../battleSpotlights';
import type { BattleState } from '../../types/battle';

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
    ...overrides,
  };
}

/**
 * Mulberry32 seeded PRNG — same algorithm used in production engine.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a minimal graph with two armies, their commanders, and an ascendant.
 * threadTarget: if provided, adds a thread edge from 'asc' to that node ID.
 */
function makeGraph(threadTarget?: string): WorldGraph {
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

  // Thread edge from ascendant to threadTarget (if supplied)
  if (threadTarget) {
    graph.addEdge({ id: 'e_thread', source: 'asc', target: threadTarget, type: 'thread', properties: {} });
  }

  return graph;
}

// ─── hasThreadToBattle tests ─────────────────────────────────────────────────

describe('hasThreadToBattle — thread-based spotlight visibility', () => {
  it('returns false when ascendant has no thread edges to any battle participant', () => {
    const graph = makeGraph(); // no thread edges
    const battleState = makeBattleState();
    expect(hasThreadToBattle('asc', battleState, graph)).toBe(false);
  });

  it('returns true when ascendant has thread edge to the attacker commander', () => {
    const graph = makeGraph('cmd_atk'); // thread to attacker commander
    const battleState = makeBattleState();
    expect(hasThreadToBattle('asc', battleState, graph)).toBe(true);
  });

  it('returns true when ascendant has thread edge to the defender army directly', () => {
    const graph = makeGraph('army_def'); // thread directly to defender army node
    const battleState = makeBattleState();
    expect(hasThreadToBattle('asc', battleState, graph)).toBe(true);
  });

  it('no threads → no spotlight encounters spawned, battle resolves chronicle-only', () => {
    const graph = makeGraph(); // no thread edges
    const battleState = makeBattleState();
    const rng = mulberry32(42);
    // No thread → hasThreadToBattle false → selectSpotlight returns null
    expect(hasThreadToBattle('asc', battleState, graph)).toBe(false);
    expect(selectSpotlight('asc', battleState, graph, rng)).toBeNull();
  });
});

// ─── selectSpotlight tests ───────────────────────────────────────────────────

describe('selectSpotlight — seeded PRNG selection among eligible templates', () => {
  it('returns null when no spotlight templates are eligible for current battle state', () => {
    // Put all template IDs in spotlightHistory so none are eligible
    const allIds = SPOTLIGHT_TEMPLATES.map(t => t.id);
    const graph = makeGraph('cmd_atk'); // has thread so visibility passes
    const battleState = makeBattleState({ spotlightHistory: allIds });
    const rng = mulberry32(42);
    expect(selectSpotlight('asc', battleState, graph, rng)).toBeNull();
  });

  it('returns a template ID when at least one template is eligible', () => {
    const graph = makeGraph('cmd_atk');
    const battleState = makeBattleState(); // empty spotlightHistory
    const rng = mulberry32(42);
    const result = selectSpotlight('asc', battleState, graph, rng);
    expect(result).not.toBeNull();
    expect(SPOTLIGHT_TEMPLATES.map(t => t.id)).toContain(result);
  });

  it('selection is deterministic for same seed and battle state', () => {
    const graph = makeGraph('cmd_atk');
    const battleState = makeBattleState();
    const result1 = selectSpotlight('asc', battleState, graph, mulberry32(99));
    const result2 = selectSpotlight('asc', battleState, graph, mulberry32(99));
    expect(result1).toBe(result2);
  });
});

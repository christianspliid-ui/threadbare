/**
 * plant_trap tests (THR-605 — six no-op ascendant actions, Slice 4).
 *
 * `sub.trap` (spell "Hidden Snare") plants a concealed snare in a sublocation.
 * `applyPlantTrap` resolves the intended victim present at the sublocation (or,
 * failing that, on its hex), then seeds the authored `encounter.trap.sprung` beat
 * against them via `state.pendingEncounterSeeds`. That seed is genuinely consumed —
 * `evaluateEncounterSeeds` spawns it as a real negative encounter for the victim.
 * The op needs full GameState (to mutate the seed queue), so it lives in the
 * resolution-intercept path rather than the graph-executor case. These tests call
 * the helper directly and assert the seed queue and victim selection.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { applyPlantTrap } from '../ascendantExpression';
import {
  TRAP_SPRUNG_TEMPLATE_ID,
  TRAP_SEED_PRIORITY,
  TRAP_SEED_DELAY_TICKS,
} from '../../data/ascendant-expression-constants';
import type { GameState } from '../../types/gameState';

const ascendantId = 'asc.player';
const locId = 'loc.crypt';
const subId = 'sub.altar';
const TICK = 42;

/** Minimal GameState — applyPlantTrap only reads `graph` and mutates `pendingEncounterSeeds`. */
function makeState(graph: WorldGraph): GameState {
  return { graph, pendingEncounterSeeds: [] } as unknown as GameState;
}

/** A crypt at hex (3,4) with an inner altar sublocation. */
function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ascendantId, type: 'actor', name: 'The Trapper', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: locId,
    type: 'location',
    name: 'Sunken Crypt',
    properties: { locationType: 'location', hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: subId,
    type: 'location',
    name: 'Inner Altar',
    properties: { locationType: 'sublocation', parentLocationId: locId },
  });
  return graph;
}

function addAgentAt(graph: WorldGraph, id: string, locationId: string): void {
  graph.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `loc_${id}`, source: id, target: locationId, type: 'located_at', properties: {} });
}

describe('applyPlantTrap', () => {
  it('seeds the trap beat against a victim standing in the sublocation', () => {
    const graph = makeGraph();
    addAgentAt(graph, 'agent.victim', subId);
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.success).toBe(true);
    expect(result.victimId).toBe('agent.victim');
    expect(state.pendingEncounterSeeds).toHaveLength(1);
    const seed = state.pendingEncounterSeeds![0];
    expect(seed.templateId).toBe(TRAP_SPRUNG_TEMPLATE_ID);
    expect(seed.targetAgentId).toBe('agent.victim');
    expect(seed.priority).toBe(TRAP_SEED_PRIORITY);
    expect(seed.eligibleAfterTick).toBe(TICK + TRAP_SEED_DELAY_TICKS);
    expect(seed.plantedTick).toBe(TICK);
  });

  it('picks the victim deterministically (lowest node id) when several are present', () => {
    const graph = makeGraph();
    addAgentAt(graph, 'agent.zed', subId);
    addAgentAt(graph, 'agent.amos', subId);
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.victimId).toBe('agent.amos');
  });

  it('broadens to the hex when the sublocation itself is empty', () => {
    const graph = makeGraph();
    // No agent directly at the altar; one stands at the parent crypt (same hex).
    addAgentAt(graph, 'agent.onhex', locId);
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.success).toBe(true);
    expect(result.victimId).toBe('agent.onhex');
    expect(state.pendingEncounterSeeds).toHaveLength(1);
  });

  it('never targets the acting ascendant', () => {
    const graph = makeGraph();
    // Only the ascendant is at the sublocation — no valid victim.
    graph.addEdge({ id: 'loc_asc', source: ascendantId, target: subId, type: 'located_at', properties: {} });
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.success).toBe(true);
    expect(result.failSoft).toBe('no_target_present');
    expect(state.pendingEncounterSeeds).toHaveLength(0);
  });

  it('does not target agents on a different hex', () => {
    const graph = makeGraph();
    graph.addNode({
      id: 'loc.tower',
      type: 'location',
      name: 'Lonely Tower',
      properties: { locationType: 'location', hexCol: 9, hexRow: 9 },
    });
    addAgentAt(graph, 'agent.far', 'loc.tower');
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.failSoft).toBe('no_target_present');
    expect(state.pendingEncounterSeeds).toHaveLength(0);
  });

  it('fail-softs to success (no seed) when the room and hex are empty', () => {
    const graph = makeGraph();
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, subId, TICK);

    expect(result.success).toBe(true);
    expect(result.seedId).toBeNull();
    expect(state.pendingEncounterSeeds).toHaveLength(0);
  });

  it('fail-softs (success:false, no seed) when the sublocation is missing', () => {
    const graph = makeGraph();
    const state = makeState(graph);

    const result = applyPlantTrap(state, ascendantId, 'sub.nowhere', TICK);

    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_sublocation');
    expect(state.pendingEncounterSeeds).toHaveLength(0);
  });
});

// @vitest-lane heavy — builds a small world and drives it 200 ticks, watching the seeded dead every tick (THR-1631)
/**
 * THR-1631 S1 — the seeded dead stay dead, through the real tick loop.
 *
 * The past pass writes up to ten deceased actors at t0 in the run-time `retain`
 * shape. Every sweep that walks individuals must respect `deceased`; this proves it
 * over 200 ticks on a world worldgen actually mints, not a fixture. The kill line
 * (plan § Kill criteria): if a seeded dead actor is ever a decider, an actor in a
 * unified action, or counted as a resident, fix the reader — never remove the dead.
 *
 * Not asserted here: the THR-1654 notable pick, which does not exist yet. That
 * ticket's census covers this writer (the plan's mutex, recorded on THR-1631).
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { _resetNpcCounter } from '../npcSeeding';
import { isAutonomousDecisionActor } from '../decisionTier';
import { getAgentsAtLocation } from '../graphQueries';
import { buildHexActorIndex } from '../hexActorIndex';
import { isSeededDead } from '../worldPast';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const TICKS = 200;
const TIMEOUT_MS = 240_000;

describe('worldPast — the seeded dead stay dead over 200 ticks (THR-1631 S1)', () => {
  it('no seeded dead is ever alive, a decider, an action’s actor, or a counted resident', { timeout: TIMEOUT_MS }, () => {
    _resetNpcCounter();
    resetEventCounter();
    resetReputationTraitInit();
    const preset = MAP_SIZE_PRESETS.small;
    let state: GameState = initializeGameState(
      generateArchetypes(4, SEED)[0], 'T', createBalancedCosmology(), SEED, preset.cols, preset.rows,
    ).state;
    const runtime = createSimulationRuntime();

    const deadIds = state.graph.getNodesByType('actor').filter(isSeededDead).map(n => n.id);
    // Not vacuous: the pass must have written dead for this to prove anything.
    expect(deadIds.length).toBeGreaterThanOrEqual(5);
    const restsAt = new Map(deadIds.map(id => [id, state.graph.getOutgoingEdges(id, 'located_at')[0]?.target]));

    const leaks: string[] = [];
    for (let i = 0; i < TICKS; i++) {
      state = runTick(state, [], runtime);
      const g = state.graph;
      const dead = new Set(deadIds);
      for (const id of deadIds) {
        const node = g.getNode(id);
        if (!node) { leaks.push(`t${state.tick} ${id} removed`); continue; }
        if (node.properties.deceased !== true) leaks.push(`t${state.tick} ${id} alive`);
        if (isAutonomousDecisionActor(node)) leaks.push(`t${state.tick} ${id} decider`);
        const at = restsAt.get(id);
        if (at && getAgentsAtLocation(g, at).some(n => n.id === id)) leaks.push(`t${state.tick} ${id} resident`);
      }
      for (const action of state.unifiedActions ?? []) {
        if (dead.has(action.actorId)) leaks.push(`t${state.tick} ${action.actorId} acts ${action.templateId}`);
      }
      if (i % 50 === 49) {
        const index = buildHexActorIndex(g);
        for (const ids of index.byHex.values()) {
          for (const id of ids) if (dead.has(id)) leaks.push(`t${state.tick} ${id} in hex index`);
        }
      }
    }
    expect(leaks.slice(0, 10)).toEqual([]);
  });
});

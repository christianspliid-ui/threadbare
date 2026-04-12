/**
 * Resolution → Growth Contract Test
 *
 * Verifies that agents who complete encounters show capability growth:
 *   encounter completion → domainCapability increase (rawScore / tier)
 *
 * This is a cross-boundary contract test, not a unit test. It asserts that
 * the resolution pipeline (phaseEncounterProgressionV2) feeds into capability
 * growth via trait acquisition, artifact rewards, etc. A failure means either:
 *   - encounters aren't completing (upstream), or
 *   - completions aren't producing growth (downstream wiring broken)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import { computeFullProfile } from '../../domainCapability';
import type { GameState } from '../../../types/gameState';
import type { ReachDomain } from '../../../types/traits';

// ─── Constants ────────────────────────────────────────────────────
const SEED = 42;
/** Budget of 100 ticks matches encounter-lifecycle contract — agents must travel
 *  to encounter locations before encounters begin on a full small map. */
const TICK_COUNT = 100;

function createFreshState(): GameState {
  resetDecisionCache();
  resetEventCounter();
  const archetypes = generateArchetypes(4, SEED);
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(
    archetypes[0], 'Growth-Tester', cosmology, SEED, preset.cols, preset.rows,
  );
  return state;
}

describe('resolution → growth contract', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState();
  });

  it('agents who complete encounters show capability growth', { timeout: 30_000 }, () => {
    const runtime = createSimulationRuntime();

    // Snapshot initial capabilities for all individual actors
    const agents = state.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual');
    const initialProfiles = new Map<string, Record<ReachDomain, { rawScore: number; capability: number; tier: number; label: string }>>();
    for (const agent of agents) {
      initialProfiles.set(agent.id, computeFullProfile(state.graph, agent.id));
    }

    // Run TICK_COUNT ticks — enough for agents to travel and complete encounters
    for (let i = 0; i < TICK_COUNT; i++) {
      state = runTick(state, [], runtime);
    }

    // Find agents who completed at least one encounter via encounterProgress
    const completedActors = new Set<string>();
    for (const ep of state.encounterProgress) {
      if (ep.status === 'completed') {
        completedActors.add(ep.actorId);
      }
    }

    // Also check unifiedActions for completed encounters (migration path)
    for (const ua of (state.unifiedActions ?? [])) {
      if (ua.source === 'agent' && ua.resolved) {
        completedActors.add(ua.actorId);
      }
    }

    // At least some agents should have completed encounters
    expect(completedActors.size).toBeGreaterThan(
      0,
      `No agents completed encounters in ${TICK_COUNT} ticks — pipeline may be stalled`,
    );

    // Those agents should show growth in at least one domain (rawScore increase)
    let anyGrowth = false;
    for (const actorId of completedActors) {
      const initial = initialProfiles.get(actorId);
      if (!initial) continue;
      const current = computeFullProfile(state.graph, actorId);
      for (const domain of Object.keys(current) as ReachDomain[]) {
        if (current[domain].rawScore > initial[domain].rawScore) {
          anyGrowth = true;
          break;
        }
      }
      if (anyGrowth) break;
    }
    expect(anyGrowth).toBe(true);
  });

  it('encounter completion emits a resolution event', { timeout: 30_000 }, () => {
    const runtime = createSimulationRuntime();
    let completionSeen = false;

    // Legacy encounters emit 'encounter_completed'; unified actions emit 'agent_action_resolved'.
    // Accept either — the contract is that resolution produces an observable event.
    const resolutionTypes = new Set(['encounter_completed', 'agent_action_resolved']);

    for (let i = 0; i < TICK_COUNT; i++) {
      state = runTick(state, [], runtime);
      if (state.tickEvents.some(e => resolutionTypes.has(e.type))) {
        completionSeen = true;
        break;
      }
    }

    expect(completionSeen).toBe(true);
  });
});

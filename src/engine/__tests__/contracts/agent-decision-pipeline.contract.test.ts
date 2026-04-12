import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import { resetActionCounter } from '../../actionLifecycle';
import { resetLifecycleCounter } from '../../agentLifecycle';
import { resetAmbitionEventCounter } from '../../ambitionTick';
import { resetEffectCounter } from '../../controlEffectSpawn';
import { resetFactionEventSeq } from '../../factionOutcome';
import { resetOpCounter } from '../../graphOpExecutor';
import { resetInfluenceCounter } from '../../interventionEffects';
import { resetNarrativeEventCounter } from '../../narrative';
import { resetColocationEventCounter } from '../../phaseColocationDetection';
import { resetMeetingCounter } from '../../meetingEncounter';
import { resetTugCounter } from '../../phaseAttention';
import { resetEncounterTraitInit } from '../../phaseEncounterTraits';
import { resetControlEffectsCounter } from '../../phaseControlEffects';
import { resetDoomCounter } from '../../phaseDoom';
import { resetMandateCounter } from '../../phaseMandate';
import { resetMovementEventCounter } from '../../phaseMovement';
import { resetReputationTraitInit } from '../../phaseReputationTraits';
import { resetPremonitionCounter } from '../../premonitionActions';
import { resetDiscoveryEventCounter } from '../../revelationResolver';
import { resetRevEventCounter } from '../../revelationEmitter';
import { resetPhaseEventCounter } from '../../unifiedActionPhases';
import { resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import type { GameState } from '../../../types/gameState';

/**
 * Agent Decision Pipeline Contract Test
 *
 * Verifies the full agent decision pipeline: cache → filter → score → select.
 * Uses initializeGameState (full world) rather than hand-built state, so agents
 * need real travel time before encounters begin — hence the higher tick budget.
 */

// Agents on a full initializeGameState world need travel time before encountering.
// The liveness contract (encounter-liveness) uses 100 ticks with seedWorld; we use
// 50 here as a reasonable middle-ground for initializeGameState with a small map.
const PIPELINE_TICK_BUDGET = 50;
const SEED = 42;

/** Reset all module-level counters to ensure a fully clean slate. */
function resetAllModuleCounters(): void {
  resetDecisionCache();
  resetEventCounter();
  resetActionCounter();
  resetLifecycleCounter();
  resetAmbitionEventCounter();
  resetEffectCounter();
  resetFactionEventSeq();
  resetOpCounter();
  resetInfluenceCounter();
  resetNarrativeEventCounter();
  resetColocationEventCounter();
  resetMeetingCounter();
  resetTugCounter();
  resetEncounterTraitInit();
  resetControlEffectsCounter();
  resetDoomCounter();
  resetMandateCounter();
  resetMovementEventCounter();
  resetReputationTraitInit();
  resetPremonitionCounter();
  resetDiscoveryEventCounter();
  resetRevEventCounter();
  resetPhaseEventCounter();
  resetUnifiedActionCounter();
}

/** Create a fresh game state from the standard seed, after resetting all counters. */
function createFreshState(): GameState {
  resetAllModuleCounters();
  const archetypes = generateArchetypes(4, SEED);
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(
    archetypes[0], 'Contract-Tester', cosmology, SEED, preset.cols, preset.rows,
  );
  return state;
}

/** Run N ticks on a state with a fresh runtime. */
function runTicks(initial: GameState, n: number): GameState {
  const runtime = createSimulationRuntime();
  let s = initial;
  for (let i = 0; i < n; i++) {
    s = runTick(s, [], runtime);
  }
  return s;
}

describe('agent decision pipeline contract', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState();
  });

  it('cache → filter → score → select produces encounters within tick budget', { timeout: 15_000 }, () => {
    state = runTicks(state, PIPELINE_TICK_BUDGET);

    // Check both legacy encounterProgress and unifiedActions for encounter activity
    const legacyActiveOrCompleted = state.encounterProgress.filter(
      ep => ep.status === 'active' || ep.status === 'completed',
    );
    const unifiedAgentActions = (state.unifiedActions ?? []).filter(
      a => a.source === 'agent',
    );
    const totalEncounters = legacyActiveOrCompleted.length + unifiedAgentActions.length;

    expect(totalEncounters).toBeGreaterThan(0);

    // Every encounter should reference a real actor in the graph
    for (const ep of legacyActiveOrCompleted) {
      expect(state.graph.getNode(ep.actorId)).toBeDefined();
    }
    for (const ua of unifiedAgentActions) {
      expect(state.graph.getNode(ua.actorId)).toBeDefined();
    }
  });

  it('scoring is deterministic — same seed produces identical encounters', { timeout: 30_000 }, () => {
    // Run 1: fresh state from clean module counters
    const state1 = runTicks(createFreshState(), PIPELINE_TICK_BUDGET);
    const encounters1 = [
      ...state1.encounterProgress.map(ep => `legacy:${ep.actorId}:${ep.encounterId}:${ep.startedTick}`),
      ...(state1.unifiedActions ?? [])
        .filter(a => a.source === 'agent')
        .map(a => `unified:${a.actorId}:${a.templateId}:${a.startTick}`),
    ].sort();

    // Run 2: fresh state from clean module counters (same seed)
    const state2 = runTicks(createFreshState(), PIPELINE_TICK_BUDGET);
    const encounters2 = [
      ...state2.encounterProgress.map(ep => `legacy:${ep.actorId}:${ep.encounterId}:${ep.startedTick}`),
      ...(state2.unifiedActions ?? [])
        .filter(a => a.source === 'agent')
        .map(a => `unified:${a.actorId}:${a.templateId}:${a.startTick}`),
    ].sort();

    expect(encounters1).toEqual(encounters2);
  });

  it('occupied agents are skipped — no double-booking', { timeout: 15_000 }, () => {
    state = runTicks(state, PIPELINE_TICK_BUDGET);

    // Check no agent appears in two active encounters simultaneously (legacy)
    const legacyActiveActors = state.encounterProgress
      .filter(ep => ep.status === 'active')
      .map(ep => ep.actorId);

    // Check no agent appears in two unresolved unified actions simultaneously
    const unifiedActiveActors = (state.unifiedActions ?? [])
      .filter(a => !a.resolved && a.source === 'agent')
      .map(a => a.actorId);

    // Combine — an agent should not be in both an active legacy encounter AND an unresolved unified action
    const allActiveActors = [...legacyActiveActors, ...unifiedActiveActors];
    const uniqueActors = new Set(allActiveActors);
    expect(uniqueActors.size).toBe(allActiveActors.length);
  });
});

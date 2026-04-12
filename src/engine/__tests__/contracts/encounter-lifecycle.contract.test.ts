/**
 * Encounter Lifecycle Contract Test
 *
 * Verifies the full encounter lifecycle: active → completed, step history
 * accumulation, and agent availability after completion.
 *
 * Uses initializeGameState (full world) so agents must travel to encounter
 * locations before encounters begin. Checks both legacy encounterProgress
 * and unifiedActions since the former is deprecated in favor of the latter.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../gameInit';
import { runTick, resetDecisionCache, resetEventCounter } from '../../orchestrator';
import { createBalancedCosmology } from '../../cosmology';
import { generateArchetypes } from '../../ascendant';
import { createSimulationRuntime } from '../../simulationRuntime';
import type { GameState } from '../../../types/gameState';

const SEED = 42;
const LIFECYCLE_TICK_BUDGET = 100;

function createFreshState(): GameState {
  resetDecisionCache();
  resetEventCounter();
  const archetypes = generateArchetypes(4, SEED);
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS.small;
  const { state } = initializeGameState(
    archetypes[0], 'Lifecycle-Tester', cosmology, SEED, preset.cols, preset.rows,
  );
  return state;
}

function runTicks(initial: GameState, n: number): GameState {
  const runtime = createSimulationRuntime();
  let s = initial;
  for (let i = 0; i < n; i++) {
    s = runTick(s, [], runtime);
  }
  return s;
}

describe('encounter lifecycle contract', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState();
  });

  it('encounters progress from active to completed', { timeout: 30_000 }, () => {
    const runtime = createSimulationRuntime();
    let seenActive = false;
    let seenCompleted = false;

    for (let i = 0; i < LIFECYCLE_TICK_BUDGET; i++) {
      state = runTick(state, [], runtime);

      // Check legacy encounterProgress
      if (state.encounterProgress.some(ep => ep.status === 'active')) {
        seenActive = true;
      }
      if (state.encounterProgress.some(ep => ep.status === 'completed')) {
        seenCompleted = true;
      }

      // Check unified actions (encounters have source 'agent' and are not divine actions)
      const unifiedActions = state.unifiedActions ?? [];
      if (unifiedActions.some(a => a.source === 'agent' && !a.resolved)) {
        seenActive = true;
      }
      if (unifiedActions.some(a => a.source === 'agent' && a.resolved)) {
        seenCompleted = true;
      }

      if (seenActive && seenCompleted) break;
    }

    expect(seenActive).toBe(true);
    expect(seenCompleted).toBe(true);
  });

  it('completed encounters have step history', { timeout: 30_000 }, () => {
    state = runTicks(state, LIFECYCLE_TICK_BUDGET);

    // Gather completed encounters from both systems
    const legacyCompleted = state.encounterProgress.filter(ep => ep.status === 'completed');
    const unifiedCompleted = (state.unifiedActions ?? []).filter(
      a => a.source === 'agent' && a.resolved,
    );
    const totalCompleted = legacyCompleted.length + unifiedCompleted.length;

    expect(totalCompleted).toBeGreaterThan(
      0,
      `No encounters completed in ${LIFECYCLE_TICK_BUDGET} ticks — lifecycle pipeline is stalled`,
    );

    // Legacy: completed encounters must have non-empty history with valid ticks
    for (const ep of legacyCompleted) {
      expect(ep.history.length).toBeGreaterThan(0);
      for (const h of ep.history) {
        expect(h.tick).toBeGreaterThan(0);
      }
    }

    // Unified: resolved actions must have step outcomes recording each step's result
    for (const ua of unifiedCompleted) {
      expect(ua.stepOutcomes.length).toBeGreaterThan(0);
    }
  });

  it('agents are freed after encounter completion', { timeout: 30_000 }, () => {
    state = runTicks(state, LIFECYCLE_TICK_BUDGET);

    // Collect actor IDs from completed encounters (both systems)
    const completedActorIds = new Set<string>();

    for (const ep of state.encounterProgress.filter(ep => ep.status === 'completed')) {
      completedActorIds.add(ep.actorId);
    }
    for (const ua of (state.unifiedActions ?? []).filter(a => a.source === 'agent' && a.resolved)) {
      completedActorIds.add(ua.actorId);
    }

    expect(completedActorIds.size).toBeGreaterThan(
      0,
      'No completed encounters found — cannot verify agent freeing',
    );

    // An agent that completed an encounter should NOT still be in an active
    // encounter with the same action/encounter ID. They may have started a
    // new encounter (which is fine — that proves they were freed).
    // Check that no completed encounter's actor+id pair is also active.
    const activeKeys = new Set<string>();
    for (const ep of state.encounterProgress.filter(ep => ep.status === 'active')) {
      activeKeys.add(`${ep.actorId}:${ep.encounterId}`);
    }
    for (const ua of (state.unifiedActions ?? []).filter(a => !a.resolved)) {
      activeKeys.add(`${ua.actorId}:${ua.actionId}`);
    }

    // Completed encounters should not also appear as active with the same key
    for (const ep of state.encounterProgress.filter(ep => ep.status === 'completed')) {
      expect(activeKeys.has(`${ep.actorId}:${ep.encounterId}`)).toBe(false);
    }
    for (const ua of (state.unifiedActions ?? []).filter(a => a.resolved)) {
      expect(activeKeys.has(`${ua.actorId}:${ua.actionId}`)).toBe(false);
    }
  });
});

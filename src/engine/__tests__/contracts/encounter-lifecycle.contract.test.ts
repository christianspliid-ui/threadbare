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
import { describe, it, expect } from 'vitest';
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

describe('encounter lifecycle contract', { timeout: 120_000 }, () => {
  // Shared state — one world gen + tick run for all tests
  const initialState = createFreshState();

  // Run ticks once, tracking lifecycle events as we go
  const runtime = createSimulationRuntime();
  let state = initialState;
  let seenActive = false;
  let seenCompleted = false;

  for (let i = 0; i < LIFECYCLE_TICK_BUDGET; i++) {
    state = runTick(state, [], runtime);

    if (state.encounterProgress.some(ep => ep.status === 'active')) seenActive = true;
    if (state.encounterProgress.some(ep => ep.status === 'completed')) seenCompleted = true;

    const unifiedActions = state.unifiedActions ?? [];
    if (unifiedActions.some(a => a.source === 'agent' && !a.resolved)) seenActive = true;
    if (unifiedActions.some(a => a.source === 'agent' && a.resolved)) seenCompleted = true;
  }

  // Pre-compute shared data for tests
  const legacyCompleted = state.encounterProgress.filter(ep => ep.status === 'completed');
  const unifiedCompleted = (state.unifiedActions ?? []).filter(
    a => a.source === 'agent' && a.resolved,
  );
  const completedActorIds = new Set<string>();
  for (const ep of legacyCompleted) completedActorIds.add(ep.actorId);
  for (const ua of unifiedCompleted) completedActorIds.add(ua.actorId);

  it('encounters progress from active to completed', () => {
    expect(seenActive).toBe(true);
    expect(seenCompleted).toBe(true);
  });

  it('completed encounters have step history', () => {
    const totalCompleted = legacyCompleted.length + unifiedCompleted.length;
    expect(totalCompleted).toBeGreaterThan(
      0,
      `No encounters completed in ${LIFECYCLE_TICK_BUDGET} ticks — lifecycle pipeline is stalled`,
    );

    for (const ep of legacyCompleted) {
      expect(ep.history.length).toBeGreaterThan(0);
      for (const h of ep.history) {
        expect(h.tick).toBeGreaterThan(0);
      }
    }

    for (const ua of unifiedCompleted) {
      expect(ua.stepOutcomes.length).toBeGreaterThan(0);
    }
  });

  it('agents are freed after encounter completion', () => {
    expect(completedActorIds.size).toBeGreaterThan(
      0,
      'No completed encounters found — cannot verify agent freeing',
    );

    const activeKeys = new Set<string>();
    for (const ep of state.encounterProgress.filter(ep => ep.status === 'active')) {
      activeKeys.add(`${ep.actorId}:${ep.encounterId}`);
    }
    for (const ua of (state.unifiedActions ?? []).filter(a => !a.resolved)) {
      activeKeys.add(`${ua.actorId}:${ua.actionId}`);
    }

    for (const ep of legacyCompleted) {
      expect(activeKeys.has(`${ep.actorId}:${ep.encounterId}`)).toBe(false);
    }
    for (const ua of unifiedCompleted) {
      expect(activeKeys.has(`${ua.actorId}:${ua.actionId}`)).toBe(false);
    }
  });
});

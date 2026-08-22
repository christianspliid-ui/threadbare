// src/engine/phaseStrategicProjects.ts
//
// Runtime progression phase for active strategic projects and control upkeep.
// Positioned at Phase 2a.55 — after encounter progression, before visibility/decision.
//
// This is a progression phase, NOT a second planner. It advances existing work
// and degrades neglected control, then hands results to visibility/decision surfaces.

import type { GameState } from '../types/gameState';
import { ENABLE_STRATEGIC_ACTIONS } from '../data/strategic-action-constants';
import { advanceStrategicProjects } from './strategicActionLifecycle';
import { applyEncounterCacheUpdate, type SimulationRuntime } from './simulationRuntime';

/**
 * Advance active strategic projects and tick control stance degradation.
 * No-op when the feature flag is disabled or no strategic state exists.
 */
export function phaseStrategicProjects(
  state: GameState,
  rng: () => number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  if (!ENABLE_STRATEGIC_ACTIONS) return {};
  if (!state.strategicState) return {};

  const { projects, controls } = state.strategicState;
  if (projects.length === 0 && controls.length === 0) return {};

  const result = advanceStrategicProjects(state, state.graph, state.tick, rng);

  // THR-1184: a completing project can mint an edge that changes what its destination
  // location can host (`sacred_route` → pilgrimage encounters). The encounter cache only
  // rebuilds on structural invalidation, so without this refresh the new pool waits for
  // an unrelated system to invalidate — measured as 3 of 4 consecrated destinations
  // staying inert through tick 120 on seed 42. Same mechanism settlement promotion uses.
  if (runtime) {
    for (const locationId of result.poolInvalidatedLocationIds) {
      applyEncounterCacheUpdate(runtime, cache => cache.onLocationTypeChanged(state.graph, locationId));
    }
  }

  return {
    strategicState: result.strategicState,
    tickEvents: [...state.tickEvents, ...result.events],
  };
}

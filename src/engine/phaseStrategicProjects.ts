// src/engine/phaseStrategicProjects.ts
//
// Runtime progression phase for active strategic projects and control upkeep.
// Positioned at Phase 2a.55 — after encounter progression, before visibility/decision.
//
// This is a progression phase, NOT a second planner. It advances existing work
// and degrades neglected control, then hands results to visibility/decision surfaces.

import type { GameState, TickEvent } from '../types/gameState';
import {
  ENABLE_STRATEGIC_ACTIONS,
  EXPIRING_LOCATION_PROPERTIES,
  LOCATION_BOOST_EXPIRY_SUFFIX,
} from '../data/strategic-action-constants';
import { advanceStrategicProjects } from './strategicActionLifecycle';
import { applyEncounterCacheUpdate, type SimulationRuntime } from './simulationRuntime';

/**
 * Expire timed location boosts (THR-1292 §3).
 *
 * Rehomed verbatim in behaviour from the retired `phaseInitiativeProgress`, which
 * owned the **only** expiry for `festivalBoost` — deleting that phase without this
 * would have left the folded festival undertaking's boost permanent. Generalised
 * over `EXPIRING_LOCATION_PROPERTIES` so it is not a festival special case.
 *
 * Runs unconditionally on the location sweep rather than off the project list: a
 * boost outlives the undertaking that placed it, so gating it on active projects
 * would strand the last festival of a run.
 */
function expireLocationBoosts(state: GameState): TickEvent[] {
  const events: TickEvent[] = [];
  for (const node of state.graph.getNodesByType('location')) {
    const props = node.properties as Record<string, unknown>;
    for (const property of EXPIRING_LOCATION_PROPERTIES) {
      const expiryKey = `${property}${LOCATION_BOOST_EXPIRY_SUFFIX}`;
      const expiry = props[expiryKey] as number | undefined;
      if (expiry == null || state.tick < expiry) continue;
      props[property] = undefined;
      props[expiryKey] = undefined;
      events.push({
        id: `boost_expired_${property}_${node.id}_${state.tick}`,
        tick: state.tick,
        // The retired phase emitted `'world_change'`, which has never been a member of
        // `TickEvent['type']` — it type-errored into the red baseline and the chronicle
        // filtered it out. `'narrative'` is the real slot for a world observation.
        type: 'narrative',
        message: `The festival at ${node.name} has ended.`,
        significance: 0.4,
      });
    }
  }
  return events;
}

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

  // Boost expiry runs *before* the project early-returns and independently of them:
  // a boost outlives the undertaking that placed it, so gating it on a non-empty
  // project list would strand the last festival of a run permanently (THR-1292 §3).
  const expiryEvents = expireLocationBoosts(state);

  const projects = state.strategicState?.projects ?? [];
  const controls = state.strategicState?.controls ?? [];
  if (!state.strategicState || (projects.length === 0 && controls.length === 0)) {
    return expiryEvents.length > 0
      ? { tickEvents: [...state.tickEvents, ...expiryEvents] }
      : {};
  }

  // `runtime` carries the binder's reverse index and role census (THR-1296 §3).
  // Passing it is what turns the bind pass on; without it undertakings resolve uncast.
  const result = advanceStrategicProjects(state, state.graph, state.tick, rng, runtime);

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

  const out: Partial<GameState> = {
    strategicState: result.strategicState,
    tickEvents: [...state.tickEvents, ...expiryEvents, ...result.events],
  };
  // The mentorship fold plants the offer, milestone and terminal seeds that the
  // retired phase 2.33 used to plant (THR-1292 §3).
  if (result.pendingEncounterSeeds.length > 0) {
    out.pendingEncounterSeeds = [
      ...(state.pendingEncounterSeeds ?? []),
      ...result.pendingEncounterSeeds,
    ];
  }
  return out;
}

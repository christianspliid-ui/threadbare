/**
 * Phase Movement — Goal-Directed Agent Pathfinding
 *
 * Each tick, agents with existing movement queues advance along their paths.
 * Agents that have arrived re-evaluate their destination by scoring movement candidates
 * against their axiological profiles.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { MovementState } from '../types/movement';
import { DECISION_REEVALUATION_TICKS } from '../types/movement';
import { tickMovement, initMovementState } from './movementExecution';
import { generateMovementCandidates } from './movementCandidates';
import { computeEdgeCost } from './movementCost';
import type { AxiologicalProfile } from '../types/agent';

// ─── Configuration ─────────────────────────────────────────────────

/** Minimum score threshold for movement candidates to be selected */
const MOVEMENT_SCORE_THRESHOLD = 0.1;

// ─── ID Generator (local) ─────────────────────────────────────────

let eventCounterPhaseMovement = 0;

function nextEventId(): string {
  return `evt_movement_${++eventCounterPhaseMovement}`;
}

/**
 * Reset event counter for test isolation.
 * Call this in test beforeEach blocks.
 */
export function resetMovementEventCounter(): void {
  eventCounterPhaseMovement = 0;
}

// ─── Phase Function ──────────────────────────────────────────────────

/**
 * Phase Movement: Process goal-directed pathfinding for all agents.
 *
 * For each individual agent:
 * 1. If they have an active movement queue, tick their movement and emit event on transition
 * 2. If they've arrived or have no queue, re-evaluate their destination using axiological scoring
 * 3. If best candidate score >= threshold, initiate new movement
 * 4. Otherwise, update lastDecisionTick to avoid re-evaluating every single tick
 */
export function phaseMovement(state: GameState): Partial<GameState> {
  const events: TickEvent[] = [];

  // Get all individual agents
  const agents = state.graph.getNodesByType('actor')
    .filter(actor => actor.properties?.actorType === 'individual');

  for (const actor of agents) {
    const actorId = actor.id;

    // Get current movement state (or undefined if not started)
    const movementState = actor.properties?.movementState as MovementState | undefined;

    // --- Case 1: Agent has active movement queue ---
    if (movementState && movementState.movementQueue.length > 0) {
      const result = tickMovement(state.graph, actorId, movementState, state.tick);

      // Update actor's movement state
      state.graph.updateNode(actorId, {
        properties: { ...actor.properties, movementState: result.updatedState },
      });

      // Emit event on movement transition
      if (result.moved) {
        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_movement',
          message: `${actor.name} moves to ${state.graph.getNode(result.newLocationId!)?.name ?? 'a location'}.`,
          significance: 0.3,
        });
      }

      continue; // Skip re-evaluation this tick
    }

    // --- Case 2: Agent arrived or has no movement yet ---
    // Check if it's time to re-evaluate
    const lastDecisionTick = movementState?.lastDecisionTick ?? -Infinity;
    const shouldReevaluate = (state.tick - lastDecisionTick >= DECISION_REEVALUATION_TICKS) || state.tick === 0;

    if (!shouldReevaluate) {
      continue; // Not time to re-evaluate yet
    }

    // Get current location
    const locatedAtEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
    if (locatedAtEdges.length === 0) {
      continue; // Agent has no location, skip
    }

    const currentLocationId = locatedAtEdges[0].target; // Should be exactly one located_at edge

    // Get axiological profile, default to all-zeros
    const axiologicalProfile = (actor.properties?.axiologicalProfile as AxiologicalProfile) || {
      ambition_contentment: 0,
      courage_prudence: 0,
      cruelty_compassion: 0,
      cunning_honesty: 0,
      devotion_independence: 0,
      loyalty_treachery: 0,
      tradition_innovation: 0,
      dominance_humility: 0,
      wrath_patience: 0,
      greed_generosity: 0,
    };

    // Generate candidates
    const candidates = generateMovementCandidates(
      state.graph,
      actorId,
      currentLocationId,
      axiologicalProfile,
    );

    // Find best candidate
    const bestCandidate = candidates.length > 0 ? candidates[0] : null;

    if (bestCandidate && bestCandidate.score >= MOVEMENT_SCORE_THRESHOLD) {
      // --- Start movement to this destination ---
      const path = bestCandidate.path;

      if (path.length > 0) {
        // Compute cost of first edge
        const firstEdgeCost = computeEdgeCost(
          state.graph,
          actorId,
          currentLocationId,
          path[0],
        ).totalCost;

        // Initialize movement state
        const newMovementState = initMovementState(
          bestCandidate.destinationId,
          path,
          firstEdgeCost,
          state.tick,
        );

        // Update actor
        state.graph.updateNode(actorId, {
          properties: { ...actor.properties, movementState: newMovementState },
        });
      }
    } else {
      // --- No good candidate, just update lastDecisionTick ---
      if (movementState) {
        const updatedState: MovementState = {
          ...movementState,
          lastDecisionTick: state.tick,
        };
        state.graph.updateNode(actorId, {
          properties: { ...actor.properties, movementState: updatedState },
        });
      } else {
        // Create a fresh movement state with empty queue
        const freshState: MovementState = {
          destinationId: currentLocationId,
          movementQueue: [],
          ticksAccumulated: 0,
          currentEdgeCost: 0,
          lastDecisionTick: state.tick,
          movementHistory: [],
        };
        state.graph.updateNode(actorId, {
          properties: { ...actor.properties, movementState: freshState },
        });
      }
    }
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
  };
}

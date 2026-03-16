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
import { generateMovementCandidates, scoreMovementCandidate } from './movementCandidates';
import { computeEdgeCost } from './movementCost';
import { MOVEMENT_SCORE_THRESHOLD, MOVEMENT_EVENT_SIGNIFICANCE } from '../data/movement-content';
import type { AxiologicalProfile } from '../types/agent';

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

    // Detect if this actor is the player's avatar (has outgoing avatar_of edge)
    const isAvatar = state.graph.getOutgoingEdges(actorId, 'avatar_of').length > 0;

    // Get current movement state (or undefined if not started)
    const movementState = actor.properties?.movementState as MovementState | undefined;

    // --- Case 1: Agent has active movement queue ---
    if (movementState && movementState.movementQueue.length > 0) {
      const result = tickMovement(state.graph, actorId, movementState, state.tick);

      // Update actor's movement state
      state.graph.updateNode(actorId, {
        properties: { ...actor.properties, movementState: result.updatedState },
      });

      // Emit event on movement transition (skip for avatar — player controls avatar)
      if (result.moved && !isAvatar) {
        const destNode = state.graph.getNode(result.newLocationId!);
        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_movement',
          message: `${actor.name} moves to ${destNode?.name ?? 'a location'}.`,
          significance: MOVEMENT_EVENT_SIGNIFICANCE,
          hexCoords: destNode?.properties?.hexCol != null
            ? { col: destNode.properties.hexCol as number, row: destNode.properties.hexRow as number }
            : undefined,
        });
      }

      // --- Mid-path re-evaluation (skip for avatar — player controls destination) ---
      if (!isAvatar &&
          result.updatedState.movementQueue.length > 0 &&
          (state.tick - (result.updatedState.lastDecisionTick ?? 0) >= DECISION_REEVALUATION_TICKS)) {
        // Get current location for re-evaluation
        const currentLocEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
        if (currentLocEdges.length > 0) {
          const currentLocId = currentLocEdges[0].target;
          const profile = (actor.properties?.axiologicalProfile as AxiologicalProfile) || {
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
          const newCandidates = generateMovementCandidates(state.graph, actorId, currentLocId, profile);

          if (newCandidates.length > 0 && newCandidates[0].destinationId !== result.updatedState.destinationId) {
            // Compare: only switch if new candidate is significantly better (2x)
            const currentRemainingScore = scoreMovementCandidate(
              result.updatedState.motivationPull ?? newCandidates[0].motivationPull,
              result.updatedState.movementQueue.length,
            );

            if (newCandidates[0].score > currentRemainingScore * 2) {
              // Switch to new destination
              const newPath = newCandidates[0].path;
              if (newPath.length > 0) {
                const newEdgeCost = computeEdgeCost(state.graph, actorId, currentLocId, newPath[0]).totalCost;
                const switchedState = initMovementState(
                  newCandidates[0].destinationId,
                  newPath,
                  newEdgeCost,
                  state.tick,
                );
                // Preserve movement history from current state
                switchedState.movementHistory = result.updatedState.movementHistory;
                // Track the original motivation pull for future re-evaluations
                switchedState.motivationPull = newCandidates[0].motivationPull;

                state.graph.updateNode(actorId, {
                  properties: { ...actor.properties, movementState: switchedState },
                });
                continue; // Skip the normal update below
              }
            }
          }

          // Update lastDecisionTick regardless of whether we switched
          result.updatedState.lastDecisionTick = state.tick;
          // Track motivation pull for future re-evaluations
          if (result.updatedState.motivationPull === undefined && newCandidates.length > 0) {
            result.updatedState.motivationPull = newCandidates[0].motivationPull;
          }
        }
      }

      continue; // Skip re-evaluation this tick
    }

    // --- Case 2: Agent arrived or has no movement yet ---
    // Avatar: skip autonomous re-evaluation — player controls destination
    if (isAvatar) continue;

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

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
import { emitTrace } from './traceBuffer';
import type { TraceEntry, RoadHexTransitionTrace } from '../types/trace';

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

      // Emit road hex transition trace (if applicable)
      if (result.roadHexTransition) {
        emitTrace({
          category: 'road_hex_transition',
          tick: state.tick,
          agentId: actorId,
          agentName: actor.name,
          fromHex: result.roadHexTransition.fromHex,
          toHex: result.roadHexTransition.toHex,
          roadType: result.roadHexTransition.roadType,
          hexProgress: result.roadHexTransition.hexProgress,
          hexTotal: result.roadHexTransition.hexTotal,
          ticksAccumulated: 1,
          hexCost: result.updatedState.roadHexCost ?? 0,
          summary: `${actor.name} walks ${result.roadHexTransition.roadType} road (${result.roadHexTransition.hexProgress}/${result.roadHexTransition.hexTotal})`,
        } as RoadHexTransitionTrace & { summary: string });
      }

      // Emit event on movement transition (skip for avatar — player controls avatar)
      if (result.moved && !isAvatar) {
        const destNode = state.graph.getNode(result.newLocationId!);
        const finalDestNode = state.graph.getNode(result.updatedState.destinationId);
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

        // Trace: movement step
        emitTrace({
          category: 'movement',
          tick: state.tick,
          agentId: actorId,
          agentName: actor.name,
          event: result.arrivedAtDestination ? 'arrive' : 'step',
          toLocationId: result.newLocationId!,
          toLocationName: destNode?.name ?? '?',
          destinationId: result.updatedState.destinationId,
          destinationName: finalDestNode?.name ?? '?',
          queueLength: result.updatedState.movementQueue.length,
          encounterId: result.updatedState.targetEncounterId,
          sublocationId: result.updatedState.targetSublocationId,
          summary: result.arrivedAtDestination
            ? `${actor.name} arrives at ${destNode?.name ?? '?'}`
            : `${actor.name} moves to ${destNode?.name ?? '?'} (${result.updatedState.movementQueue.length} hops left)`,
        } as TraceEntry);
      }

      // --- Sublocation entry on arrival ---
      if (result.arrivedAtDestination && result.updatedState.targetSublocationId) {
        const sublocationId = result.updatedState.targetSublocationId;
        const sublocation = state.graph.getNode(sublocationId);
        // Verify sublocation still exists and belongs to the destination
        if (sublocation && sublocation.type === 'location') {
          const subProps = sublocation.properties as Record<string, unknown>;
          if (subProps.parentLocationId === result.updatedState.destinationId) {
            // Move agent's located_at to the sublocation
            const oldEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
            for (const edge of oldEdges) {
              state.graph.removeEdge(edge.id);
            }
            state.graph.addEdge({
              id: `${actorId}_located_at_${sublocationId}`,
              source: actorId,
              target: sublocationId,
              type: 'located_at',
              properties: {},
            });

            // Trace: sublocation entry
            emitTrace({
              category: 'movement',
              tick: state.tick,
              agentId: actorId,
              agentName: actor.name,
              event: 'sublocation_enter',
              toLocationId: sublocationId,
              toLocationName: sublocation.name,
              destinationId: result.updatedState.destinationId,
              encounterId: result.updatedState.targetEncounterId,
              sublocationId,
              sublocationName: sublocation.name,
              summary: `${actor.name} enters ${sublocation.name}`,
            } as TraceEntry);
          }
        }
        // Clear targetSublocationId regardless (fail-soft: if sublocation dissolved, stay at parent)
        result.updatedState.targetSublocationId = undefined;
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
            mercy_ruthlessness: 0,
            asceticism_extravagance: 0,
            honesty_cunning: 0,
            tradition_novelty: 0,
            loyalty_ambition: 0,
            frankness_propriety: 0,
            humility_pride: 0,
            sacrifice_survival: 0,
            stoicism_passion: 0,
            courage_prudence: 0,
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

                // Trace: reroute
                const oldDest = state.graph.getNode(result.updatedState.destinationId);
                const newDest = state.graph.getNode(newCandidates[0].destinationId);
                emitTrace({
                  category: 'movement',
                  tick: state.tick,
                  agentId: actorId,
                  agentName: actor.name,
                  event: 'reroute',
                  oldDestinationId: result.updatedState.destinationId,
                  oldDestinationName: oldDest?.name ?? '?',
                  destinationId: newCandidates[0].destinationId,
                  destinationName: newDest?.name ?? '?',
                  queueLength: newPath.length,
                  summary: `${actor.name} reroutes from ${oldDest?.name ?? '?'} to ${newDest?.name ?? '?'}`,
                } as TraceEntry);

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
    // @deprecated — destination-picking is now handled by phaseAgentDecision.
    // This phase only executes existing movement queues (Case 1 above).
    // Skip agents with no active movement queue.
    {
      continue;
    }

    // Legacy destination-picking (generateMovementCandidates + computeBasePull)
    // removed — replaced by encounter-driven scoring in phaseAgentDecision.
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
  };
}

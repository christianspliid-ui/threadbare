/**
 * Movement Execution
 *
 * Tick-based movement system that accumulates progress toward edge traversal costs.
 * When an agent accumulates enough ticks, they transition to the next node in their path
 * and the located_at edge is updated.
 */

import { WorldGraph } from './graph';
import type { MovementState, MovementHistoryEntry } from '../types/movement';
import { TRAIL_HISTORY_TICKS } from '../types/movement';
import { computeEdgeCost } from './movementCost';

export interface MovementTickResult {
  moved: boolean;
  arrivedAtDestination: boolean;
  newLocationId?: string;
  updatedState: MovementState;
}

/**
 * Initialize a movement state for an agent starting toward a destination.
 *
 * @param destinationId — the final destination node id
 * @param path — array of node ids to traverse (copy will be made)
 * @param firstEdgeCost — the tick cost to traverse the first edge
 * @param currentTick — the current world tick
 * @returns new MovementState
 */
export function initMovementState(
  destinationId: string,
  path: string[],
  firstEdgeCost: number,
  currentTick: number,
): MovementState {
  return {
    destinationId,
    movementQueue: [...path], // Copy, not reference
    ticksAccumulated: 0,
    currentEdgeCost: firstEdgeCost,
    lastDecisionTick: currentTick,
    movementHistory: [],
  };
}

/**
 * Helper: remove all located_at edges for an agent and add a new one.
 *
 * @param graph — the world graph
 * @param agentId — the agent whose location is changing
 * @param newLocationId — the new location node id
 */
function updateLocatedAt(graph: WorldGraph, agentId: string, newLocationId: string): void {
  // Remove all existing located_at edges from this agent
  const oldEdges = graph.getOutgoingEdges(agentId, 'located_at');
  for (const edge of oldEdges) {
    graph.removeEdge(edge.id);
  }

  // Add new located_at edge
  const newEdgeId = `${agentId}_located_at_${newLocationId}`;
  graph.addEdge({
    id: newEdgeId,
    source: agentId,
    target: newLocationId,
    type: 'located_at',
    properties: {},
  });
}

/**
 * Process one tick of movement for an agent.
 *
 * Each tick, the agent accumulates progress toward the current edge cost.
 * When accumulated ticks >= currentEdgeCost, the agent transitions to the next node.
 *
 * @param graph — the world graph
 * @param agentId — the agent moving
 * @param state — the agent's current movement state
 * @param currentTick — the current world tick (recorded in history)
 * @returns MovementTickResult with moved status and updated state
 */
export function tickMovement(
  graph: WorldGraph,
  agentId: string,
  state: MovementState,
  currentTick: number,
): MovementTickResult {
  // Empty queue => already at destination
  if (state.movementQueue.length === 0) {
    return {
      moved: false,
      arrivedAtDestination: true,
      updatedState: state,
    };
  }

  // Accumulate one tick toward current edge cost
  const newAccumulated = state.ticksAccumulated + 1;

  // Check if we've paid the cost for the current edge
  if (newAccumulated >= state.currentEdgeCost) {
    // --- Transition to next node ---
    const nextNodeId = state.movementQueue[0];
    const newQueue = state.movementQueue.slice(1);

    // Update located_at edge
    updateLocatedAt(graph, agentId, nextNodeId);

    // Record history entry (newest first)
    const newHistoryEntry: MovementHistoryEntry = {
      nodeId: nextNodeId,
      tick: currentTick,
    };
    const newHistory = [newHistoryEntry, ...state.movementHistory].slice(
      0,
      TRAIL_HISTORY_TICKS,
    );

    // Compute next edge cost if more nodes in queue
    let nextEdgeCost = state.currentEdgeCost;
    if (newQueue.length > 0) {
      const nextNextNodeId = newQueue[0];
      const costBreakdown = computeEdgeCost(graph, agentId, nextNodeId, nextNextNodeId);
      nextEdgeCost = costBreakdown.totalCost;
    }

    const updatedState: MovementState = {
      destinationId: state.destinationId,
      movementQueue: newQueue,
      ticksAccumulated: 0, // Reset after transition
      currentEdgeCost: nextEdgeCost,
      lastDecisionTick: state.lastDecisionTick,
      movementHistory: newHistory,
    };

    return {
      moved: true,
      arrivedAtDestination: newQueue.length === 0,
      newLocationId: nextNodeId,
      updatedState,
    };
  }

  // Not yet paid => accumulate and wait
  const updatedState: MovementState = {
    ...state,
    ticksAccumulated: newAccumulated,
  };

  return {
    moved: false,
    arrivedAtDestination: false,
    updatedState,
  };
}

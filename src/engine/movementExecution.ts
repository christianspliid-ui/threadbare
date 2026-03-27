/**
 * Movement Execution
 *
 * Tick-based movement system that accumulates progress toward edge traversal costs.
 * When an agent accumulates enough ticks, they transition to the next node in their path
 * and the located_at edge is updated.
 *
 * Road mode: when roadHexQueue is populated, the agent advances one hex at a time
 * along the road's hex path. The located_at edge only updates on arrival at a location
 * node (when the road hex queue is exhausted), not at intermediate road hexes.
 */

import { WorldGraph } from './graph';
import type { MovementState, MovementHistoryEntry } from '../types/movement';
import { TRAIL_HISTORY_TICKS } from '../types/movement';
import { computeEdgeCost } from './movementCost';
import { MIN_ROAD_HEX_COST } from '../data/movement-content';
import type { RoadSegmentInfo } from './pathfinding';

export interface MovementTickResult {
  moved: boolean;
  arrivedAtDestination: boolean;
  newLocationId?: string;
  updatedState: MovementState;
  /** If the agent advanced a hex on a road (for animation/trace) */
  roadHexTransition?: {
    fromHex: { col: number; row: number };
    toHex: { col: number; row: number };
    roadType: 'major' | 'trail';
    hexProgress: number;
    hexTotal: number;
  };
}

/**
 * Initialize a movement state for an agent starting toward a destination.
 *
 * @param destinationId — the final destination node id
 * @param path — array of node ids to traverse (copy will be made)
 * @param firstEdgeCost — the tick cost to traverse the first edge
 * @param currentTick — the current world tick
 * @param roadSegments — optional road segment info from pathfinding
 * @param startLocationId — the agent's starting location (needed to orient road hexPath)
 * @returns new MovementState
 */
export function initMovementState(
  destinationId: string,
  path: string[],
  firstEdgeCost: number,
  currentTick: number,
  roadSegments?: RoadSegmentInfo[],
  startLocationId?: string,
): MovementState {
  const state: MovementState = {
    destinationId,
    movementQueue: [...path], // Copy, not reference
    ticksAccumulated: 0,
    currentEdgeCost: firstEdgeCost,
    lastDecisionTick: currentTick,
    movementHistory: [],
  };

  // Store road segments for multi-leg traversal
  if (roadSegments && roadSegments.length > 0) {
    state.roadSegments = roadSegments.map(s => ({
      fromId: s.fromId,
      toId: s.toId,
      roadType: s.roadType,
      hexPath: s.hexPath.map(h => ({ col: h.col, row: h.row })),
      discountedCost: s.discountedCost,
    }));
  }

  // Populate road fields if the first edge is a road segment
  if (roadSegments && roadSegments.length > 0 && path.length > 0) {
    const firstTarget = path[0];
    const effectiveStart = startLocationId ?? '';
    const firstSegment = roadSegments.find(
      seg => (seg.fromId === effectiveStart && seg.toId === firstTarget) ||
             (seg.toId === effectiveStart && seg.fromId === firstTarget),
    );

    if (firstSegment && firstSegment.hexPath.length > 0) {
      populateRoadFields(state, firstSegment, effectiveStart);
    }
  }

  return state;
}

/**
 * Populate road traversal fields on a MovementState from a RoadSegmentInfo.
 * Handles hexPath direction reversal when the agent is traveling opposite
 * to the stored source→target direction.
 */
function populateRoadFields(
  state: MovementState,
  segment: RoadSegmentInfo | MovementState['roadSegments'][0],
  agentLocationId: string,
): void {
  let hexPath = segment.hexPath.map(h => ({ col: h.col, row: h.row }));

  // If the agent is at the "to" end of the road, reverse the hex path
  if (agentLocationId === segment.toId) {
    hexPath = hexPath.slice().reverse();
  }

  // Remove the starting hex (agent is already there)
  const startHex = hexPath[0];
  if (startHex) {
    state.currentHexPosition = { col: startHex.col, row: startHex.row };
  }
  const queue = hexPath.slice(1);

  if (queue.length === 0) return; // Degenerate road (single hex)

  state.roadHexQueue = queue;
  state.roadHexCost = Math.max(
    MIN_ROAD_HEX_COST,
    segment.discountedCost / queue.length,
  );
  state.currentRoadType = segment.roadType;
  // Override currentEdgeCost to use per-hex road cost
  state.currentEdgeCost = state.roadHexCost;
}

/**
 * Find a road segment matching a from→to leg in the stored segments.
 */
function findRoadSegment(
  segments: MovementState['roadSegments'],
  fromId: string,
  toId: string,
): MovementState['roadSegments'][0] | undefined {
  if (!segments) return undefined;
  return segments.find(
    seg => (seg.fromId === fromId && seg.toId === toId) ||
           (seg.toId === fromId && seg.fromId === toId),
  );
}

/**
 * Helper: remove all located_at edges for an agent and add a new one.
 */
function updateLocatedAt(graph: WorldGraph, agentId: string, newLocationId: string): void {
  const oldEdges = graph.getOutgoingEdges(agentId, 'located_at');
  for (const edge of oldEdges) {
    graph.removeEdge(edge.id);
  }

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
 * Set up the next movement leg (road or standard) on the state.
 * Mutates nextState in place. Returns the edge cost for the next leg.
 */
function setupNextLeg(
  graph: WorldGraph,
  agentId: string,
  fromNodeId: string,
  toNodeId: string,
  nextState: MovementState,
): number {
  const segment = findRoadSegment(nextState.roadSegments, fromNodeId, toNodeId);

  if (segment && segment.hexPath.length > 1) {
    // Next leg is a road — populate road fields
    let hexPath = segment.hexPath.map(h => ({ col: h.col, row: h.row }));
    if (fromNodeId === segment.toId) {
      hexPath = hexPath.slice().reverse();
    }
    nextState.currentHexPosition = { col: hexPath[0].col, row: hexPath[0].row };
    const queue = hexPath.slice(1);
    if (queue.length > 0) {
      nextState.roadHexQueue = queue;
      nextState.roadHexCost = Math.max(MIN_ROAD_HEX_COST, segment.discountedCost / queue.length);
      nextState.currentRoadType = segment.roadType;
      return nextState.roadHexCost;
    }
  }

  // Standard edge cost
  nextState.roadHexQueue = undefined;
  nextState.roadHexCost = undefined;
  nextState.currentRoadType = undefined;
  nextState.currentHexPosition = undefined;
  return computeEdgeCost(graph, agentId, fromNodeId, toNodeId).totalCost;
}

/**
 * Process one tick of movement for an agent.
 *
 * Road mode: when roadHexQueue is non-empty, the agent advances hex-by-hex along
 * the road. located_at only updates when the road hex queue is exhausted (arrival
 * at the destination location node). currentHexPosition updates each hex.
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

  // --- Road hex traversal branch ---
  if (state.roadHexQueue && state.roadHexQueue.length > 0 && state.roadHexCost != null) {
    const effectiveHexCost = Math.max(MIN_ROAD_HEX_COST, state.roadHexCost);

    if (newAccumulated >= effectiveHexCost) {
      // Advance to the next hex on the road
      const fromHex = state.currentHexPosition ?? state.roadHexQueue[0];
      const nextHex = state.roadHexQueue[0];
      const newRoadQueue = state.roadHexQueue.slice(1);

      // Compute progress for tracing
      const totalHexesInSegment = state.roadHexQueue.length + 1; // remaining + current
      const hexProgress = totalHexesInSegment - newRoadQueue.length;

      // Record history entry with hex coords
      const newHistoryEntry: MovementHistoryEntry = {
        nodeId: state.movementQueue[0],
        tick: currentTick,
        hexCol: nextHex.col,
        hexRow: nextHex.row,
      };
      const newHistory = [newHistoryEntry, ...state.movementHistory].slice(0, TRAIL_HISTORY_TICKS);

      const roadTransition = {
        fromHex: { col: fromHex.col, row: fromHex.row },
        toHex: { col: nextHex.col, row: nextHex.row },
        roadType: state.currentRoadType ?? ('major' as const),
        hexProgress,
        hexTotal: totalHexesInSegment,
      };

      if (newRoadQueue.length === 0) {
        // Road segment complete — arrive at the destination location node
        const nextNodeId = state.movementQueue[0];
        const newQueue = state.movementQueue.slice(1);

        updateLocatedAt(graph, agentId, nextNodeId);

        const updatedState: MovementState = {
          destinationId: state.destinationId,
          movementQueue: newQueue,
          ticksAccumulated: 0,
          currentEdgeCost: effectiveHexCost,
          lastDecisionTick: state.lastDecisionTick,
          movementHistory: newHistory,
          targetSublocationId: state.targetSublocationId,
          targetEncounterId: state.targetEncounterId,
          motivationPull: state.motivationPull,
          roadSegments: state.roadSegments,
          currentHexPosition: { col: nextHex.col, row: nextHex.row },
        };

        // Set up next leg if there are more nodes
        if (newQueue.length > 0) {
          updatedState.currentEdgeCost = setupNextLeg(graph, agentId, nextNodeId, newQueue[0], updatedState);
        } else {
          // Clear road fields on arrival
          updatedState.roadHexQueue = undefined;
          updatedState.roadHexCost = undefined;
          updatedState.currentRoadType = undefined;
        }

        return {
          moved: true,
          arrivedAtDestination: newQueue.length === 0,
          newLocationId: nextNodeId,
          updatedState,
          roadHexTransition: roadTransition,
        };
      }

      // Road hex advanced but not yet at destination — continue traversal
      const updatedState: MovementState = {
        ...state,
        ticksAccumulated: 0,
        currentHexPosition: { col: nextHex.col, row: nextHex.row },
        roadHexQueue: newRoadQueue,
        movementHistory: newHistory,
      };

      return {
        moved: true,
        arrivedAtDestination: false,
        updatedState,
        roadHexTransition: roadTransition,
      };
    }

    // Not yet paid for this hex — accumulate and wait
    return {
      moved: false,
      arrivedAtDestination: false,
      updatedState: { ...state, ticksAccumulated: newAccumulated },
    };
  }

  // --- Standard (non-road) movement ---
  if (newAccumulated >= state.currentEdgeCost) {
    const nextNodeId = state.movementQueue[0];
    const newQueue = state.movementQueue.slice(1);

    updateLocatedAt(graph, agentId, nextNodeId);

    const nextNode = graph.getNode(nextNodeId);
    const hexCol = nextNode?.properties?.hexCol as number | undefined;
    const hexRow = nextNode?.properties?.hexRow as number | undefined;
    const newHistoryEntry: MovementHistoryEntry = {
      nodeId: nextNodeId,
      tick: currentTick,
      ...(hexCol != null && hexRow != null ? { hexCol, hexRow } : {}),
    };
    const newHistory = [newHistoryEntry, ...state.movementHistory].slice(0, TRAIL_HISTORY_TICKS);

    const updatedState: MovementState = {
      destinationId: state.destinationId,
      movementQueue: newQueue,
      ticksAccumulated: 0,
      currentEdgeCost: state.currentEdgeCost,
      lastDecisionTick: state.lastDecisionTick,
      movementHistory: newHistory,
      targetSublocationId: state.targetSublocationId,
      targetEncounterId: state.targetEncounterId,
      motivationPull: state.motivationPull,
      roadSegments: state.roadSegments,
    };

    // Set up next leg if there are more nodes
    if (newQueue.length > 0) {
      updatedState.currentEdgeCost = setupNextLeg(graph, agentId, nextNodeId, newQueue[0], updatedState);
    }

    return {
      moved: true,
      arrivedAtDestination: newQueue.length === 0,
      newLocationId: nextNodeId,
      updatedState,
    };
  }

  // Not yet paid => accumulate and wait
  return {
    moved: false,
    arrivedAtDestination: false,
    updatedState: { ...state, ticksAccumulated: newAccumulated },
  };
}

/**
 * Avatar Movement Handler
 *
 * Sets up a MovementState on the avatar node so the tick loop can advance
 * the avatar like any other agent. Does NOT teleport — no edge changes.
 *
 * Uses pathfinding + movementCost to build a proper MovementState, then
 * stores it on the avatar node's properties.
 */

import type { WorldGraph } from './graph';
import type { HexCoord } from '../types';
import type { MovementState } from '../types/movement';
import { findShortestPath } from './pathfinding';
import { initMovementState } from './movementExecution';
import { computeEdgeCost } from './movementCost';

/**
 * Resolve the avatar node ID from an ascendant ID.
 * Returns null if no avatar exists.
 */
function resolveAvatarId(graph: WorldGraph, ascendantId: string): string | null {
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return null;
  return avatarEdges[0].source;
}

/**
 * Find the avatar's current location node ID.
 * Returns null if the avatar has no located_at edge.
 */
function resolveAvatarLocationId(graph: WorldGraph, avatarId: string): string | null {
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return null;
  return locEdges[0].target;
}

/**
 * Find an existing location node at the given hex, or create a transient one.
 * Returns the location node ID.
 */
function findOrCreateLocationAtHex(graph: WorldGraph, targetHex: HexCoord): string {
  // Search existing locations
  const allLocations = graph.getNodesByType('location');
  for (const loc of allLocations) {
    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol === targetHex.col && hexRow === targetHex.row) {
      return loc.id;
    }
  }

  // Create transient location
  const transientId = `loc.transient.${targetHex.col}.${targetHex.row}`;
  if (!graph.getNode(transientId)) {
    graph.addNode({
      id: transientId,
      type: 'location',
      name: `Wilderness (${targetHex.col}, ${targetHex.row})`,
      properties: {
        hexCol: targetHex.col,
        hexRow: targetHex.row,
        locationType: 'wilderness',
      },
    });
  }
  return transientId;
}

/**
 * Set up tick-based movement for the avatar toward a target hex.
 *
 * Finds the path via Dijkstra's algorithm, computes the first edge cost,
 * and stores a MovementState on the avatar node. Does NOT move the avatar
 * (no located_at edge changes).
 *
 * @param graph — the world graph
 * @param ascendantId — the ascendant (god) whose avatar should move
 * @param targetHex — the target hex coordinate
 * @param currentTick — the current world tick
 * @returns true if a path was found and movement was initiated, false otherwise
 */
export function moveAvatarToHex(
  graph: WorldGraph,
  ascendantId: string,
  targetHex: HexCoord,
  currentTick: number,
): boolean {
  const avatarId = resolveAvatarId(graph, ascendantId);
  if (!avatarId) return false;

  const currentLocationId = resolveAvatarLocationId(graph, avatarId);
  if (!currentLocationId) return false;

  // Find or create the target location
  const targetLocId = findOrCreateLocationAtHex(graph, targetHex);

  // Already at destination — no movement planned
  if (currentLocationId === targetLocId) return false;

  // Find path from current location to target
  const pathResult = findShortestPath(graph, avatarId, currentLocationId, targetLocId);
  if (!pathResult || pathResult.path.length === 0) return false;

  // Compute first edge cost
  const firstStepId = pathResult.path[0];
  const firstEdgeCost = computeEdgeCost(graph, avatarId, currentLocationId, firstStepId);

  // Build movement state
  const movementState = initMovementState(
    targetLocId,
    pathResult.path,
    firstEdgeCost.totalCost,
    currentTick,
  );

  // Store on avatar node
  const avatar = graph.getNode(avatarId)!;
  graph.updateNode(avatarId, {
    properties: { ...avatar.properties, movementState },
  });

  return true;
}

/**
 * Read the current MovementState from the avatar node.
 *
 * @param graph — the world graph
 * @param ascendantId — the ascendant whose avatar to check
 * @returns the MovementState if the avatar is moving, null otherwise
 */
export function getAvatarMovementState(
  graph: WorldGraph,
  ascendantId: string,
): MovementState | null {
  const avatarId = resolveAvatarId(graph, ascendantId);
  if (!avatarId) return null;

  const avatar = graph.getNode(avatarId);
  if (!avatar) return null;

  const ms = avatar.properties.movementState as MovementState | undefined;
  return ms ?? null;
}

/**
 * Clear the avatar's movement state (cancel movement).
 *
 * @param graph — the world graph
 * @param ascendantId — the ascendant whose avatar movement to cancel
 */
export function clearAvatarMovement(
  graph: WorldGraph,
  ascendantId: string,
): void {
  const avatarId = resolveAvatarId(graph, ascendantId);
  if (!avatarId) return;

  const avatar = graph.getNode(avatarId);
  if (!avatar) return;

  if (avatar.properties.movementState === undefined) return;

  // updateNode merges via spread: { ...existing.properties, ...updates.properties }.
  // Passing the full properties object (without movementState) as the complete replacement
  // still merges, so we pass movementState: undefined which leaves the key present but
  // with value undefined — functionally equivalent for all consumers that check the value.
  const { movementState: _, ...cleanProperties } = avatar.properties;
  graph.updateNode(avatarId, {
    properties: { ...cleanProperties, movementState: undefined },
  });
}

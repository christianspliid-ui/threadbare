/**
 * Avatar Movement Handler
 *
 * Sets up a MovementState on the avatar node so the tick loop can advance
 * the avatar like any other agent. Does NOT teleport — no edge changes.
 *
 * Uses hex-grid A* pathfinding to find a route through the tile grid,
 * then ensures location nodes exist along the path for the movement system.
 */

import type { WorldGraph } from './graph';
import type { HexCoord, HexTile, TerrainType } from '../types';
import type { MovementState } from '../types/movement';
import { findHexPath } from './pathfinding';
import { initMovementState } from './movementExecution';
import { findOrCreateLocationAtHex } from './hexMovementPath';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';
import { getTerrainTax } from '../data/movement-content';
import { hexKeyFromCoord } from '../lib/hexKey';

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
 * Find the avatar's current hex coordinate from its located_at edge.
 * Returns null if the avatar has no location.
 */
function resolveAvatarHex(graph: WorldGraph, avatarId: string): HexCoord | null {
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return null;
  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;
  const col = locNode.properties.hexCol as number | undefined;
  const row = locNode.properties.hexRow as number | undefined;
  if (col == null || row == null) return null;
  return { col, row };
}

/**
 * Set up tick-based movement for the avatar toward a target hex.
 *
 * Uses hex-grid A* pathfinding to find a route through the tile grid,
 * then creates location nodes along the path for the movement system.
 *
 * @param graph — the world graph
 * @param ascendantId — the ascendant (god) whose avatar should move
 * @param targetHex — the target hex coordinate
 * @param currentTick — the current world tick
 * @param tiles — the hex tile array (for pathfinding terrain lookup)
 * @param cols — grid column count
 * @param rows — grid row count
 * @returns true if a path was found and movement was initiated, false otherwise
 */
export function moveAvatarToHex(
  graph: WorldGraph,
  ascendantId: string,
  targetHex: HexCoord,
  currentTick: number,
  tiles: HexTile[],
  cols: number,
  rows: number,
): boolean {
  const avatarId = resolveAvatarId(graph, ascendantId);
  if (!avatarId) return false;

  const avatarHex = resolveAvatarHex(graph, avatarId);
  if (!avatarHex) return false;

  // Already at destination
  if (avatarHex.col === targetHex.col && avatarHex.row === targetHex.row) return false;

  // Find hex-grid path via A*
  const hexPath = findHexPath(tiles, avatarHex, targetHex, cols, rows);
  if (!hexPath || hexPath.path.length === 0) return false;

  // Build terrain lookup for creating location nodes
  const terrainByHex = new Map<string, TerrainType>();
  for (const tile of tiles) {
    terrainByHex.set(hexKeyFromCoord(tile.coord), tile.terrain);
  }

  // Ensure location nodes exist for each hex in the path
  const locationIds: string[] = [];
  for (const hex of hexPath.path) {
    const terrain = terrainByHex.get(hexKeyFromCoord(hex));
    const locId = findOrCreateLocationAtHex(graph, hex, terrain);
    locationIds.push(locId);
  }

  // Compute first edge cost from avatar's current location
  const firstLocId = locationIds[0];
  const firstLocNode = graph.getNode(firstLocId);
  const firstTerrain = firstLocNode?.properties.terrain as TerrainType | undefined;
  const firstEdgeCost = BASE_EDGE_TRAVERSAL_COST + (firstTerrain ? getTerrainTax(firstTerrain) : 0);

  // Build movement state
  const destinationId = locationIds[locationIds.length - 1];
  const movementState = initMovementState(
    destinationId,
    locationIds,
    firstEdgeCost,
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

  const { movementState: _, ...cleanProperties } = avatar.properties;
  graph.updateNode(avatarId, {
    properties: { ...cleanProperties, movementState: undefined },
  });
}

/**
 * Hex Movement Path Builder
 *
 * Shared utility that converts location-to-location movement into a hex-by-hex
 * path with transient location nodes. Used by both avatar and agent movement
 * so all actors traverse the hex grid one cell at a time.
 */

import type { WorldGraph } from './graph';
import type { HexCoord, HexTile, TerrainType } from '../types';
import { findHexPath } from './pathfinding';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';
import { getTerrainTax } from '../data/movement-content';
import { hexKeyFromCoord } from '../lib/hexKey';

/**
 * Find an existing location node at the given hex, or create a transient one.
 * Sets terrain on transient locations so movementCost can compute taxes.
 */
export function findOrCreateLocationAtHex(
  graph: WorldGraph,
  hex: HexCoord,
  terrain?: TerrainType,
): string {
  // Search existing locations
  const allLocations = graph.getNodesByType('location');
  for (const loc of allLocations) {
    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol === hex.col && hexRow === hex.row) {
      return loc.id;
    }
  }

  // Create transient location
  const transientId = `loc.transient.${hex.col}.${hex.row}`;
  if (!graph.getNode(transientId)) {
    graph.addNode({
      id: transientId,
      type: 'location',
      name: `Wilderness (${hex.col}, ${hex.row})`,
      properties: {
        hexCol: hex.col,
        hexRow: hex.row,
        locationType: 'wilderness',
        ...(terrain ? { terrain } : {}),
      },
    });
  }
  return transientId;
}

export interface HexMovementPathResult {
  /** Location node IDs to traverse (excludes start, one per hex) */
  locationIds: string[];
  /** Cost to traverse the first edge */
  firstEdgeCost: number;
  /** Final destination location ID */
  destinationId: string;
}

/**
 * Build a hex-by-hex movement path between two location nodes.
 *
 * Resolves source and destination hex coordinates from the graph,
 * runs hex-grid A* pathfinding, and creates transient location nodes
 * for any hex that doesn't already have one.
 *
 * @returns HexMovementPathResult or null if no path exists
 */
export function buildHexMovementPath(
  graph: WorldGraph,
  sourceLocationId: string,
  destLocationId: string,
  tiles: HexTile[],
): HexMovementPathResult | null {
  // Resolve source hex
  const srcNode = graph.getNode(sourceLocationId);
  if (!srcNode) return null;
  const srcCol = srcNode.properties.hexCol as number | undefined;
  const srcRow = srcNode.properties.hexRow as number | undefined;
  if (srcCol == null || srcRow == null) return null;
  const srcHex: HexCoord = { col: srcCol, row: srcRow };

  // Resolve destination hex
  const dstNode = graph.getNode(destLocationId);
  if (!dstNode) return null;
  const dstCol = dstNode.properties.hexCol as number | undefined;
  const dstRow = dstNode.properties.hexRow as number | undefined;
  if (dstCol == null || dstRow == null) return null;
  const dstHex: HexCoord = { col: dstCol, row: dstRow };

  // Already at destination
  if (srcHex.col === dstHex.col && srcHex.row === dstHex.row) return null;

  // Derive grid dimensions from tiles
  let cols = 0;
  let rows = 0;
  for (const tile of tiles) {
    if (tile.coord.col >= cols) cols = tile.coord.col + 1;
    if (tile.coord.row >= rows) rows = tile.coord.row + 1;
  }

  // Find hex-grid path via A*
  const hexPath = findHexPath(tiles, srcHex, dstHex, cols, rows);
  if (!hexPath || hexPath.path.length === 0) return null;

  // Build terrain lookup
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

  // Compute first edge cost
  const firstLocId = locationIds[0];
  const firstLocNode = graph.getNode(firstLocId);
  const firstTerrain = firstLocNode?.properties.terrain as TerrainType | undefined;
  const firstEdgeCost = BASE_EDGE_TRAVERSAL_COST + (firstTerrain ? getTerrainTax(firstTerrain) : 0);

  const destinationId = locationIds[locationIds.length - 1];

  return { locationIds, firstEdgeCost, destinationId };
}

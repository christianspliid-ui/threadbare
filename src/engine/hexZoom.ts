/**
 * Hex Zoom Engine Queries — Pure functions for hex-zoom and location views.
 *
 * These extract per-hex and per-location data from the world graph
 * for rendering HexZoomView and LocationView.
 */

import type { WorldGraph } from './graph';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { HexCoord, SphereName } from '../types';
import { SPHERE_NAMES } from '../types';
import { hexDistance } from '../lib/hexMath';

/** Sphere influence totals for a hex. */
export type SphereInfluence = Record<SphereName, number>;

/** Line-of-sight level based on avatar distance. */
export type LineOfSight = 'full' | 'partial' | 'none';

/** Adjacent hex distance threshold for partial sight. */
const PARTIAL_SIGHT_RANGE = 1;

/**
 * All location nodes in the given hex.
 * Filters by node type 'location' and matching hexCol/hexRow properties.
 */
export function getLocationsInHex(graph: WorldGraph, col: number, row: number): GraphNode[] {
  return graph.getNodesByType('location').filter(node => {
    const props = node.properties as Record<string, unknown>;
    return props.hexCol === col && props.hexRow === row;
  });
}

/**
 * All actor nodes with a 'located_at' edge to the given location.
 */
export function getAgentsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  const edges = graph.getIncomingEdges(locationId, 'located_at');
  const agents: GraphNode[] = [];
  for (const edge of edges) {
    const node = graph.getNode(edge.source);
    if (node) agents.push(node);
  }
  return agents;
}

/**
 * Aggregated sphere biases from all locations in the hex.
 * Sums sphereBiases from each location's properties.
 */
export function getHexSphereInfluence(graph: WorldGraph, col: number, row: number): SphereInfluence {
  const influence = {} as SphereInfluence;
  for (const s of SPHERE_NAMES) influence[s] = 0;

  const locations = getLocationsInHex(graph, col, row);
  for (const loc of locations) {
    const biases = (loc.properties as Record<string, unknown>).sphereBiases as Record<string, number> | undefined;
    if (biases) {
      for (const s of SPHERE_NAMES) {
        influence[s] += biases[s] ?? 0;
      }
    }
  }

  return influence;
}

/**
 * Determine line of sight based on avatar position relative to target hex.
 *
 * Finds the ascendant's avatar via 'avatar_of' edge, then the avatar's
 * location via 'located_at' edge, then computes hex distance.
 *
 * - Same hex → 'full'
 * - Adjacent hex (distance 1) → 'partial'
 * - Farther or no avatar → 'none'
 */
export function getLineOfSight(
  graph: WorldGraph,
  ascendantId: string,
  hexCoord: HexCoord,
): LineOfSight {
  // Find avatar: incoming 'avatar_of' edge to ascendant
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return 'none';

  const avatarId = avatarEdges[0].source;
  const avatarNode = graph.getNode(avatarId);
  if (!avatarNode) return 'none';

  // Find avatar's location
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return 'none';

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return 'none';

  const locProps = locNode.properties as Record<string, unknown>;
  const avatarHex: HexCoord = {
    col: locProps.hexCol as number,
    row: locProps.hexRow as number,
  };

  if (avatarHex.col === undefined || avatarHex.row === undefined) return 'none';

  const dist = hexDistance(avatarHex, hexCoord);
  if (dist === 0) return 'full';
  if (dist <= PARTIAL_SIGHT_RANGE) return 'partial';
  return 'none';
}

/**
 * All adjacency edges between locations in the given set.
 * Only returns edges where BOTH source and target are in locationIds.
 */
export function getLocationConnections(graph: WorldGraph, locationIds: string[]): GraphEdge[] {
  const idSet = new Set(locationIds);
  const connections: GraphEdge[] = [];

  for (const locId of locationIds) {
    const outEdges = graph.getOutgoingEdges(locId, 'adjacent');
    for (const edge of outEdges) {
      if (idSet.has(edge.target)) {
        connections.push(edge);
      }
    }
  }

  return connections;
}

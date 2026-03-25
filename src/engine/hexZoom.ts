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
    return Number(props.hexCol) === col && Number(props.hexRow) === row;
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
 * Aggregated sphere influence from all locations in the hex.
 * Reads sphereInfluence (always populated) with sphereBiases as fallback.
 */
export function getHexSphereInfluence(graph: WorldGraph, col: number, row: number): SphereInfluence {
  const influence = {} as SphereInfluence;
  for (const s of SPHERE_NAMES) influence[s] = 0;

  const locations = getLocationsInHex(graph, col, row);
  for (const loc of locations) {
    const props = loc.properties as Record<string, unknown>;
    const sphereData = (props.sphereInfluence ?? props.sphereBiases) as Record<string, number> | undefined;
    if (sphereData) {
      for (const s of SPHERE_NAMES) {
        influence[s] += sphereData[s] ?? 0;
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

/** Culture summary for a hex — derived from belongs_to edges of locations in the hex. */
export interface HexCultureSummary {
  cultureName: string;
  cultureId: string;
  dominantSpheres: SphereName[];
  foundationBias: string;
  strength: number; // average cultural strength across locations
}

/**
 * Dominant cultures influencing locations in a hex.
 * Walks belongs_to edges from each location, aggregates by culture,
 * returns sorted by average strength descending.
 */
export function getHexCultures(graph: WorldGraph, col: number, row: number): HexCultureSummary[] {
  const locations = getLocationsInHex(graph, col, row);
  const cultureMap = new Map<string, { node: GraphNode; strengths: number[] }>();

  for (const loc of locations) {
    const edges = graph.getOutgoingEdges(loc.id, 'belongs_to');
    for (const edge of edges) {
      const props = edge.properties as Record<string, unknown>;
      if (props.cultureLayer !== 'current') continue;
      const cultureNode = graph.getNode(edge.target);
      if (!cultureNode) continue;
      const existing = cultureMap.get(cultureNode.id);
      const strength = (props.culturalStrength as number) ?? 0.5;
      if (existing) {
        existing.strengths.push(strength);
      } else {
        cultureMap.set(cultureNode.id, { node: cultureNode, strengths: [strength] });
      }
    }
  }

  const summaries: HexCultureSummary[] = [];
  for (const [id, { node, strengths }] of cultureMap) {
    const identity = (node.properties as Record<string, unknown>).cultureIdentity as
      { veneratedSpheres?: SphereName[]; foundationBias?: string } | undefined;
    const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length;
    summaries.push({
      cultureName: node.name,
      cultureId: id,
      dominantSpheres: identity?.veneratedSpheres ?? [],
      foundationBias: identity?.foundationBias ?? 'unknown',
      strength: avgStrength,
    });
  }

  return summaries.sort((a, b) => b.strength - a.strength);
}

/** Faction summary for a hex — derived from controls edges to locations. */
export interface HexFactionSummary {
  factionName: string;
  factionId: string;
  locationCount: number;
}

/**
 * Factions controlling locations in this hex.
 * Looks for 'controls' edges pointing at locations in the hex.
 */
export function getHexFactions(graph: WorldGraph, col: number, row: number): HexFactionSummary[] {
  const locations = getLocationsInHex(graph, col, row);
  const factionMap = new Map<string, { name: string; count: number }>();

  for (const loc of locations) {
    const edges = graph.getIncomingEdges(loc.id, 'controls');
    for (const edge of edges) {
      const factionNode = graph.getNode(edge.source);
      if (!factionNode) continue;
      const existing = factionMap.get(factionNode.id);
      if (existing) {
        existing.count++;
      } else {
        factionMap.set(factionNode.id, { name: factionNode.name, count: 1 });
      }
    }
  }

  return Array.from(factionMap.entries())
    .map(([id, { name, count }]) => ({ factionId: id, factionName: name, locationCount: count }))
    .sort((a, b) => b.locationCount - a.locationCount);
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

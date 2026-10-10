/**
 * TargetContext builders — one factory per detail-view node type.
 *
 * All builders are pure functions that return null when the node is not found
 * in the graph (fail-soft per NFP #4). The calling detail view propagates
 * null to useTargetActions, which returns null, leaving the drawer closed.
 */

import type { TargetContext } from '../types/targetContext';
import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';
import { getLocationNodes } from './sublocationShape';

// ─── Actor (agent) ──────────────────────────────────────────────────────────

/**
 * Build a TargetContext for an actor node (agent in the retinue).
 * Includes influenceTier to enable the legacy intervention path.
 */
export function buildActorTargetContext(
  nodeId: string,
  graph: WorldGraph,
  influenceTier?: number,
): TargetContext | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');

  return {
    nodeId,
    nodeType: 'actor',
    displayName: node.name,
    displayLabel: `Tier ${influenceTier ?? 0}`,
    subtype: (node.properties.actorType as string) ?? null,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    influenceTier,
    properties: node.properties,
  };
}

// ─── Location ────────────────────────────────────────────────────────────────

/**
 * Build a TargetContext for a location node (keep, market, shrine, etc.).
 */
export function buildLocationTargetContext(
  nodeId: string,
  graph: WorldGraph,
): TargetContext | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  const subtype =
    (node.properties.locationSubtype as string) ??
    (node.properties.locationType as string) ??
    null;

  return {
    nodeId,
    nodeType: 'location',
    displayName: node.name,
    displayLabel: subtype ?? 'location',
    subtype,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    properties: node.properties,
  };
}

// ─── Sublocation ────────────────────────────────────────────────────────────

/**
 * Build a TargetContext for a sublocation node.
 * Sublocations are location-type nodes with a sublocationCategory property.
 */
export function buildSublocationTargetContext(
  nodeId: string,
  graph: WorldGraph,
): TargetContext | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  const subtype =
    (node.properties.sublocationCategory as string) ??
    (node.properties.locationType as string) ??
    null;

  return {
    nodeId,
    nodeType: 'location',
    displayName: node.name,
    displayLabel: subtype ?? 'sublocation',
    subtype,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    properties: node.properties,
  };
}

// ─── Hex ─────────────────────────────────────────────────────────────────────

/**
 * Build a TargetContext for a hex tile.
 * Hexes are location-type nodes with subtype = terrain type.
 * Pass divineInfluence and corruption to expose mutable state to action filtering.
 * Pass `graph` so the display name can name the settlement on the hex.
 */
export function buildHexTargetContext(params: {
  col: number;
  row: number;
  terrain: string;
  nodeId?: string;
  divineInfluence?: number;
  corruption?: number;
  properties?: Record<string, unknown>;
  graph?: WorldGraph;
}): TargetContext {
  const { col, row, terrain, nodeId, divineInfluence, corruption, properties, graph } = params;
  return {
    nodeId: nodeId ?? `hex_${col}_${row}`,
    nodeType: 'location',
    displayName: hexPlaceName(col, row, terrain, graph),
    displayLabel: terrain,
    subtype: terrain,
    traitIds: [],
    sphereAffinity: null,
    position: { col, row },
    properties: {
      ...properties,
      terrain,
      divineInfluence: divineInfluence ?? 0,
      corruption: corruption ?? 0,
    },
  };
}

/**
 * THR-1804 — the player-facing name of a hex: the discovered place on it (first by
 * name, so the choice is stable), else its terrain ("the deep forest"). Grid
 * coordinates are map plumbing, never a name a player reads.
 */
export function hexPlaceName(col: number, row: number, terrain: string, graph?: WorldGraph): string {
  if (graph) {
    const onHex = getLocationNodes(graph)
      // An undiscovered place (an elder ruin before it is found) is never named.
      .filter(n => n.properties.hexCol === col && n.properties.hexRow === row && n.name
        && n.properties.discovered !== false)
      .map(n => n.name)
      .sort((a, b) => a.localeCompare(b));
    if (onHex.length > 0) return onHex[0];
  }
  return `the ${(terrain || 'wilds').replace(/_/g, ' ')}`;
}

// ─── Artifact / Attachment ───────────────────────────────────────────────────

/**
 * Build a TargetContext for a common artifact node (attachment).
 */
export function buildArtifactTargetContext(
  nodeId: string,
  graph: WorldGraph,
): TargetContext | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');
  const tier = node.properties.tier as number | undefined;

  return {
    nodeId,
    nodeType: 'artifact',
    displayName: node.name,
    displayLabel: tier !== undefined ? `Tier ${tier}` : 'Artifact',
    subtype: (node.properties.subcategory as string) ?? null,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    properties: node.properties,
  };
}

/**
 * Build a TargetContext for a legendary artifact node.
 */
export function buildLegendaryArtifactTargetContext(
  nodeId: string,
  graph: WorldGraph,
): TargetContext | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;

  const traitEdges = graph.getOutgoingEdges(nodeId, 'has_trait');

  return {
    nodeId,
    nodeType: 'artifact_legendary',
    displayName: node.name,
    displayLabel: 'Legendary',
    subtype: (node.properties.subcategory as string) ?? null,
    traitIds: traitEdges.map(e => e.target),
    sphereAffinity: (node.properties.sphereAffinity as SphereName) ?? null,
    position: null,
    properties: node.properties,
  };
}

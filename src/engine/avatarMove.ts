/**
 * Avatar Movement Handler
 *
 * Moves the avatar to a target hex by updating graph edges.
 * Finds or creates a location at the target hex, removes the old
 * located_at edge, and creates a new one.
 */

import type { WorldGraph } from './graph';
import type { HexCoord } from '../types';

/**
 * Move the avatar to a target hex.
 * Finds a location at that hex, or creates a transient one.
 * Updates the avatar's located_at edge.
 */
export function moveAvatarToHex(
  graph: WorldGraph,
  ascendantId: string,
  targetHex: HexCoord,
): void {
  // Find avatar via incoming avatar_of edge
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return;
  const avatarId = avatarEdges[0].source;

  // Remove old located_at edge(s)
  const oldEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  for (const e of oldEdges) {
    graph.removeEdge(e.id);
  }

  // Find a location at the target hex
  let targetLocId: string | null = null;
  const allLocations = graph.getNodesByType('location');
  for (const loc of allLocations) {
    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol === targetHex.col && hexRow === targetHex.row) {
      targetLocId = loc.id;
      break;
    }
  }

  // If no location exists, create a transient one
  if (!targetLocId) {
    targetLocId = `loc.transient.${targetHex.col}.${targetHex.row}`;
    if (!graph.getNode(targetLocId)) {
      graph.addNode({
        id: targetLocId,
        type: 'location',
        name: `Wilderness (${targetHex.col}, ${targetHex.row})`,
        properties: {
          hexCol: targetHex.col,
          hexRow: targetHex.row,
          locationType: 'wilderness',
        },
      });
    }
  }

  // Add new located_at edge
  graph.addEdge({
    id: `edge.located_at.${avatarId}.${Date.now()}`,
    source: avatarId,
    target: targetLocId,
    type: 'located_at',
    properties: {},
  });
}

/**
 * Fog of War Engine — visibility calculation and state transitions.
 *
 * Computes what hexes the ascendant can see based on:
 * - Avatar position (AVATAR_SIGHT_RANGE)
 * - Retinue agents (AGENT_SIGHT_RANGE per agent)
 * - Scry targets (SCRY_SIGHT_RANGE per scry)
 *
 * State machine:
 * - unexplored: never seen
 * - visible: currently in LOS range
 * - remembered: was visible, now out of range (has stale snapshot)
 */

import type { WorldGraph } from './graph';
import { hexDistance } from '../lib/hexMath';
import type { VisibilityMap, LOSSource, HexVisibility, StaleSnapshot } from '../types/visibility';
import {
  visKey,
  AVATAR_SIGHT_RANGE,
  AGENT_SIGHT_RANGE,
  SCRY_SIGHT_RANGE,
} from '../types/visibility';
import type { HexCoord } from '../types';
import type { ScryState } from '../types/scry';
import { getModifiedValue } from './modifiers';

/**
 * Traverse ascendant → avatar_of → located_at → location → hexCol/hexRow.
 * Returns {col, row} or null if path is broken.
 */
export function getAvatarHexPosition(graph: WorldGraph, ascendantId: string): HexCoord | null {
  // Find incoming avatar_of edge (source is avatar)
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  if (avatarEdges.length === 0) return null;

  const avatarId = avatarEdges[0].source;
  const avatar = graph.getNode(avatarId);
  if (!avatar) return null;

  // Find outgoing located_at edge from avatar → location
  const locEdges = graph.getOutgoingEdges(avatarId, 'located_at');
  if (locEdges.length === 0) return null;

  const location = graph.getNode(locEdges[0].target);
  if (!location || location.type !== 'location') return null;

  const hexCol = location.properties.hexCol as number | undefined;
  const hexRow = location.properties.hexRow as number | undefined;

  if (hexCol === undefined || hexRow === undefined) return null;

  return { col: hexCol, row: hexRow };
}

/**
 * Extract hex coordinates of agents assigned to scry court positions.
 * Returns HexCoord[] suitable for passing to collectLOSSources.
 */
export function getScryTargetHexes(scryState: ScryState, graph: WorldGraph): HexCoord[] {
  const targets: HexCoord[] = [];
  if (!scryState.initialized) return targets;

  for (const position of scryState.positions) {
    if (!position.assignedAgentId) continue;

    const agent = graph.getNode(position.assignedAgentId);
    if (!agent) continue;

    // Find agent's location via located_at edge
    const locEdges = graph.getOutgoingEdges(position.assignedAgentId, 'located_at');
    if (locEdges.length === 0) continue;

    const loc = graph.getNode(locEdges[0].target);
    if (!loc || loc.type !== 'location') continue;

    const hexCol = loc.properties.hexCol as number | undefined;
    const hexRow = loc.properties.hexRow as number | undefined;
    if (hexCol !== undefined && hexRow !== undefined) {
      targets.push({ col: hexCol, row: hexRow });
    }
  }

  return targets;
}

/**
 * Collect all LOS sources: avatar + retinue agents + scry targets.
 * Returns array of {hexCol, hexRow, range}.
 */
export function collectLOSSources(
  graph: WorldGraph,
  ascendantId: string,
  scryTargets: HexCoord[],
): LOSSource[] {
  const sources: LOSSource[] = [];

  // Avatar
  const avatarPos = getAvatarHexPosition(graph, ascendantId);
  if (avatarPos) {
    // Find avatar node ID for modifier resolution
    const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
    const avatarId = avatarEdges.length > 0 ? avatarEdges[0].source : null;
    const avatarRange = avatarId
      ? getModifiedValue(graph, avatarId, 'los_range', AVATAR_SIGHT_RANGE)
      : AVATAR_SIGHT_RANGE;

    sources.push({
      hexCol: avatarPos.col,
      hexRow: avatarPos.row,
      range: avatarRange,
    });
  }

  // Retinue agents (worships edges with tier >= 1)
  const worshipEdges = graph.getIncomingEdges(ascendantId, 'worships');
  for (const edge of worshipEdges) {
    const tier = edge.properties.tier as number | undefined;
    if (tier === undefined || tier < 1) continue;

    const agentId = edge.source;
    const agent = graph.getNode(agentId);
    if (!agent) continue;

    // Find location via located_at or contains edge
    let agentHex: HexCoord | null = null;

    // Try located_at
    const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
    if (locEdges.length > 0) {
      const loc = graph.getNode(locEdges[0].target);
      if (loc && loc.type === 'location') {
        const hexCol = loc.properties.hexCol as number | undefined;
        const hexRow = loc.properties.hexRow as number | undefined;
        if (hexCol !== undefined && hexRow !== undefined) {
          agentHex = { col: hexCol, row: hexRow };
        }
      }
    }

    // Try contains if located_at didn't work
    if (!agentHex) {
      const containsEdges = graph.getOutgoingEdges(agentId, 'contains');
      if (containsEdges.length > 0) {
        const loc = graph.getNode(containsEdges[0].target);
        if (loc && loc.type === 'location') {
          const hexCol = loc.properties.hexCol as number | undefined;
          const hexRow = loc.properties.hexRow as number | undefined;
          if (hexCol !== undefined && hexRow !== undefined) {
            agentHex = { col: hexCol, row: hexRow };
          }
        }
      }
    }

    if (agentHex) {
      sources.push({
        hexCol: agentHex.col,
        hexRow: agentHex.row,
        range: getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE),
      });
    }
  }

  // Scry targets
  for (const target of scryTargets) {
    sources.push({
      hexCol: target.col,
      hexRow: target.row,
      range: SCRY_SIGHT_RANGE,
    });
  }

  return sources;
}

/**
 * Build a stale snapshot of what was last seen at a hex.
 * Collects location names and agent names at that location.
 */
function buildSnapshot(graph: WorldGraph, hexCol: number, hexRow: number, tick: number): StaleSnapshot {
  const locationNames: string[] = [];
  const agentNames: string[] = [];

  // Find all locations at this hex
  const allLocations = graph.getNodesByType('location');
  for (const loc of allLocations) {
    const locHexCol = loc.properties.hexCol as number | undefined;
    const locHexRow = loc.properties.hexRow as number | undefined;
    if (locHexCol === hexCol && locHexRow === hexRow) {
      locationNames.push(loc.name);

      // Find agents at this location
      const incomingLocations = graph.getIncomingEdges(loc.id, 'located_at');
      for (const locEdge of incomingLocations) {
        const agent = graph.getNode(locEdge.source);
        if (agent && agent.type === 'actor') {
          agentNames.push(agent.name);
        }
      }
    }
  }

  return {
    terrain: 'unknown',
    locationNames,
    agentNames,
    lastSeenTick: tick - 1,
  };
}

/**
 * Recalculate visibility for the entire grid based on LOS sources.
 *
 * State transitions:
 * - unexplored + in range → visible
 * - unexplored + not in range → unexplored (stays unexplored)
 * - visible + in range → visible (stays visible)
 * - visible + not in range → remembered (capture snapshot with tick - 1)
 * - remembered + in range → visible (discard snapshot)
 * - remembered + not in range → remembered (stays remembered, keep old snapshot)
 */
export function recalcVisibility(
  prev: VisibilityMap,
  sources: LOSSource[],
  graph: WorldGraph,
  tick: number,
  cols: number,
  rows: number,
): VisibilityMap {
  const next: VisibilityMap = new Map();

  // For each hex in the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = visKey(col, row);
      const prevEntry = prev.get(key);
      const prevState = prevEntry?.state ?? 'unexplored';

      // Check if hex is in range of any LOS source
      const inRange = sources.some(source => {
        const dist = hexDistance({ col, row }, { col: source.hexCol, row: source.hexRow });
        return dist <= source.range;
      });

      let nextEntry: HexVisibility;

      if (inRange) {
        // In range: transition to visible (discard any snapshot)
        nextEntry = { state: 'visible' };
      } else {
        // Out of range: stay unexplored, or transition visible → remembered
        if (prevState === 'visible') {
          nextEntry = {
            state: 'remembered',
            snapshot: buildSnapshot(graph, col, row, tick),
          };
        } else {
          // unexplored or remembered: keep the same state
          nextEntry = { state: prevState };
          if (prevEntry?.snapshot) {
            nextEntry.snapshot = prevEntry.snapshot;
          }
        }
      }

      next.set(key, nextEntry);
    }
  }

  return next;
}

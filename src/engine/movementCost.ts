/**
 * Movement Cost Calculator
 *
 * Computes the tick cost to traverse a single edge based on:
 * - Base traversal cost (constant)
 * - Terrain difficulty at the destination
 * - Location entry resistance (if destination is a settlement/structure)
 * - Agent speed modifiers from movement traits
 *
 * All costs are tunable and stored in movement-content.ts.
 */

import { WorldGraph } from './graph';
import type { MovementEdgeCost } from '../types/movement';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';
import {
  getTerrainTax,
  getLocationEntryTax,
  MIN_EDGE_COST,
} from '../data/movement-content';
import type { TerrainType, LocationSubtype } from '../types';

/**
 * Compute the tick cost to traverse from source to destination.
 *
 * @param graph — the world graph
 * @param agentId — the actor traversing
 * @param _sourceId — the starting location (unused in current design, kept for forward compat)
 * @param destId — the destination location
 * @returns MovementEdgeCost breakdown
 */
export function computeEdgeCost(
  graph: WorldGraph,
  agentId: string,
  _sourceId: string,
  destId: string,
): MovementEdgeCost {
  const baseCost = BASE_EDGE_TRAVERSAL_COST;

  // --- Terrain Tax ---
  let terrainTax = 0;
  const destNode = graph.getNode(destId);
  if (destNode) {
    const terrain = destNode.properties.terrain as TerrainType | undefined;
    if (terrain) {
      terrainTax = getTerrainTax(terrain);
    }
  }

  // --- Location Entry Tax ---
  let locationTax = 0;
  if (destNode) {
    // Check for explicit override first
    const explicitTax = destNode.properties.entryTax;
    if (explicitTax !== undefined && typeof explicitTax === 'number') {
      locationTax = explicitTax;
    } else {
      // Fall back to location subtype lookup
      const locationSubtype = destNode.properties
        .locationSubtype as LocationSubtype | undefined;
      if (locationSubtype) {
        locationTax = getLocationEntryTax(locationSubtype);
      }
    }
  }

  // --- Speed Modifiers ---
  // Sum movement_speed from all has_trait edges on the agent
  let speedModifier = 0;
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const movement_speed = edge.properties.movement_speed;
    if (movement_speed !== undefined && typeof movement_speed === 'number') {
      speedModifier += movement_speed;
    }
  }

  // --- Total Cost ---
  // Floor at MIN_EDGE_COST (0.5) to ensure no zero-cost or negative traversals
  const totalCost = Math.max(
    MIN_EDGE_COST,
    baseCost + terrainTax + locationTax + speedModifier,
  );

  return {
    baseCost,
    terrainTax,
    locationTax,
    speedModifier,
    totalCost,
  };
}

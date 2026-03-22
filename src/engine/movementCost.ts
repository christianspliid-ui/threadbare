/**
 * Movement Cost Calculator
 *
 * Implements the 2-edge-per-hex model from the movement design doc:
 * each graph edge between hex centers represents TWO traversals:
 *   [Hex A center] ---(1 tick + departure tax)---> [border]
 *   [border]       ---(1 tick + arrival tax)  ---> [Hex B center]
 *
 * Total = 2 × BASE_EDGE_TRAVERSAL_COST + sourceTerrain + destTerrain
 *       + locationEntryTax + speedModifier
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
 * Each hop between hex centers represents two design edges (departure + arrival).
 * Base cost = 2 × BASE_EDGE_TRAVERSAL_COST (1 per edge).
 * Departure tax = source hex terrain tax.
 * Arrival tax = destination hex terrain tax.
 *
 * @param graph — the world graph
 * @param agentId — the actor traversing
 * @param sourceId — the starting location (used for departure terrain tax)
 * @param destId — the destination location
 * @returns MovementEdgeCost breakdown
 */
export function computeEdgeCost(
  graph: WorldGraph,
  agentId: string,
  sourceId: string,
  destId: string,
): MovementEdgeCost {
  // 2-edge model: each hop = departure edge + arrival edge
  const baseCost = 2 * BASE_EDGE_TRAVERSAL_COST;

  // --- Departure Terrain Tax (source hex) ---
  let departureTax = 0;
  const sourceNode = graph.getNode(sourceId);
  if (sourceNode) {
    const terrain = sourceNode.properties.terrain as TerrainType | undefined;
    if (terrain) {
      departureTax = getTerrainTax(terrain);
    }
  }

  // --- Arrival Terrain Tax (destination hex) ---
  let arrivalTax = 0;
  const destNode = graph.getNode(destId);
  if (destNode) {
    const terrain = destNode.properties.terrain as TerrainType | undefined;
    if (terrain) {
      arrivalTax = getTerrainTax(terrain);
    }
  }

  // Combined terrain tax (departure + arrival)
  const terrainTax = departureTax + arrivalTax;

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

/**
 * Movement Cost Calculator
 *
 * Implements the 2-edge-per-hex model from the movement design doc:
 * each graph edge between hex centers represents TWO traversals:
 *   [Hex A center] ---(1 tick + departure tax)---> [border]
 *   [border]       ---(1 tick + arrival tax)  ---> [Hex B center]
 *
 * Total = (2 × BASE_EDGE_TRAVERSAL_COST + sourceTerrain + destTerrain
 *          + locationEntryTax + speedModifier)
 *         × locationConditionMultiplier × rangeMultiplier
 *
 * All costs are tunable and stored in movement-content.ts; the location-condition
 * multipliers live beside their definitions in condition-trait-content.ts
 * (THR-1143), because the tax is a property of the condition, not of the road.
 */

import { WorldGraph } from './graph';
import type { MovementEdgeCost } from '../types/movement';
import { BASE_EDGE_TRAVERSAL_COST } from '../types/movement';
import {
  getTerrainTax,
  getLocationEntryTax,
  MIN_EDGE_COST,
} from '../data/movement-content';
import { LOCATION_CONDITION_MOVEMENT_TAX } from '../data/condition-trait-content';
import type { TerrainType, LocationSubtype } from '../types';
import type { EffectRuntimeState } from '../types/effects';
import { getRangeModifiers } from './effects/effectQueries';

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
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
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

  // --- Location Condition Tax (THR-1143) ---
  // Reader #2 for location conditions: a place the world has done something to
  // costs more to enter. Reads the destination's own `has_trait` edges — the same
  // edges `decayConditions` counts down — so the tax lifts by itself when the
  // condition expires; there is no second lifecycle to keep in step.
  //
  // Multipliers compound: a blighted town also under a plague scare is worse than
  // either alone, which is the honest reading of two bad seasons at once.
  let conditionMultiplier = 1;
  for (const edge of graph.getOutgoingEdges(destId, 'has_trait')) {
    const tax = LOCATION_CONDITION_MOVEMENT_TAX[edge.target];
    if (typeof tax === 'number' && tax > 0) {
      conditionMultiplier *= tax;
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

  // --- Range Modifier (range_modifier effects on the agent) ---
  const rangeMultiplier = effectStates !== undefined
    ? getRangeModifiers(graph, agentId, effectStates).movementCostMultiplier
    : 1.0;

  // --- Total Cost ---
  // Range and condition multipliers applied to the full pre-floor cost, then
  // floored at MIN_EDGE_COST. Never Infinity and never a hard refusal: a closed
  // pass is a price, not a wall (NFP #4 — a hard block can strand an agent whose
  // only route home runs through it).
  const totalCost = Math.max(
    MIN_EDGE_COST,
    (baseCost + terrainTax + locationTax + speedModifier) * conditionMultiplier * rangeMultiplier,
  );

  return {
    baseCost,
    terrainTax,
    locationTax,
    speedModifier,
    conditionMultiplier,
    totalCost,
  };
}

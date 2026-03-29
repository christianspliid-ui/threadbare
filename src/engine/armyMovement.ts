/**
 * Army Movement — TB-073 Phase 2.
 *
 * Armies move toward their objective using simplified location-to-location
 * pathfinding. They are slower than agents and terrain penalties are amplified.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 2
 * NFP: Tunability (all multipliers named constants), Determinism (no PRNG),
 *       Fail-soft (unknown terrain → plains, no path → stay).
 */

import type { ArmySizeCategory, ArmyState } from '../types/army';
import type { GameState } from '../types/gameState';
import type { MovementState } from '../types/movement';
import { findShortestPath } from './pathfinding';
import { tickMovement } from './movementExecution';
import { emitTrace } from './traceBuffer';

// ─── Constants ───────────────────────────────────────────────────────────

/** Movement cost multipliers for armies (vs. base terrain cost of 1.0) */
export const ARMY_MOVEMENT_COST_MULTIPLIERS: Record<string, number> = {
  plains: 1.5,
  grassland: 1.5,
  forest: 2.5,
  hills: 2.0,
  mountains: 4.0,
  desert: 3.0,
  swamp: 3.5,
  coast: 1.5,
  water: Infinity,
  tundra: 2.5,
  volcanic: 3.0,
  steppe: 1.5,
  savanna: 1.5,
  jungle: 3.0,
  taiga: 2.5,
  glacier: 4.0,
  bog: 3.5,
  badlands: 3.0,
  plateau: 2.0,
  lake: Infinity,
  ocean: Infinity,
  river: 2.0,
};

/** Fallback cost for unknown terrain types */
export const ARMY_UNKNOWN_TERRAIN_COST = 1.5;

/** Road discount for armies (stronger than for agents — roads matter more) */
export const ARMY_ROAD_DISCOUNT = 0.4;

/** Base movement speed by army size (hexes worth of movement budget per tick) */
export const ARMY_SPEED: Record<ArmySizeCategory, number> = {
  warband: 2,
  regiment: 1.5,
  host: 1,
};

// ─── Cost Calculation ───────────────────────────────────────────────────

/**
 * Get the movement cost for an army to traverse a terrain type.
 * Returns Infinity for impassable terrain.
 */
export function getArmyTerrainCost(terrainType: string): number {
  return ARMY_MOVEMENT_COST_MULTIPLIERS[terrainType] ?? ARMY_UNKNOWN_TERRAIN_COST;
}

/**
 * Get the effective movement cost for an army at a hex, accounting for roads.
 */
export function getArmyMovementCost(terrainType: string, isOnRoad: boolean): number {
  const baseCost = getArmyTerrainCost(terrainType);
  if (baseCost === Infinity) return Infinity;
  return isOnRoad ? baseCost * (1 - ARMY_ROAD_DISCOUNT) : baseCost;
}

// ─── Army Movement Phase ────────────────────────────────────────────────

/**
 * Phase Army Movement: Process goal-directed movement for all active armies.
 *
 * Each tick:
 * 1. If army has active movement queue, tick their movement
 * 2. If army has objective but no movement queue, pathfind and initiate movement
 * 3. Fail-soft: if no path found, army stays in place (quintessence still degrades)
 */
export function phaseArmyMovement(state: GameState): void {
  const armyNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null);

  for (const armyNode of armyNodes) {
    try {
      const armyState = armyNode.properties.armyState as ArmyState;
      const armyId = armyNode.id;

      // Case 1: Army has active movement queue — tick it
      const movementState = armyNode.properties.movementState as MovementState | undefined;
      if (movementState && movementState.movementQueue.length > 0) {
        const result = tickMovement(state.graph, armyId, movementState, state.tick);
        state.graph.updateNode(armyId, {
          properties: { ...armyNode.properties, movementState: result.updatedState },
        });

        if (result.moved && result.newLocationId) {
          const destNode = state.graph.getNode(result.newLocationId);
          emitTrace({
            tick: state.tick,
            category: 'faction_ambition',
            summary: `Army "${armyNode.name}" advances to ${destNode?.name ?? result.newLocationId}`,
            armyId,
            event: 'army_moved',
            toLocationId: result.newLocationId,
          });
        }
        continue;
      }

      // Case 2: Army has objective but no movement queue — pathfind to objective
      const objective = armyState.objective;
      if (!objective) continue; // No objective, stay put

      // Get current location
      const locEdges = state.graph.getOutgoingEdges(armyId, 'located_at');
      const currentLocationId = locEdges[0]?.target;
      if (!currentLocationId) continue; // No location, skip

      // Already at objective?
      if (currentLocationId === objective.targetNodeId) continue;

      // Pathfind to objective (army movement costs applied via computeEdgeCost)
      const pathResult = findShortestPath(state.graph, armyId, currentLocationId, objective.targetNodeId);
      if (!pathResult || pathResult.path.length === 0) {
        // No path found — army stays, attrition still applies
        emitTrace({
          tick: state.tick,
          category: 'faction_ambition',
          summary: `Army "${armyNode.name}" has no path to objective (${objective.targetNodeId}) — stays put`,
          armyId,
          event: 'army_no_path',
        });
        continue;
      }

      // Initialize movement state — compute first edge cost using army-specific costs
      const firstHopId = pathResult.path[0];
      const firstHopNode = state.graph.getNode(firstHopId);
      const firstHopTerrain = (firstHopNode?.properties?.terrain as string) ?? 'plains';
      const firstHopOnRoad = (
        state.graph.getOutgoingEdges(firstHopId, 'road').length > 0 ||
        state.graph.getIncomingEdges(firstHopId, 'road').length > 0
      );
      const rawCost = getArmyMovementCost(firstHopTerrain, firstHopOnRoad);
      const speedScale = 1 / ARMY_SPEED[armyState.size];
      const firstCost = rawCost === Infinity ? Infinity : Math.max(0.5, rawCost * speedScale);
      const newMovementState: MovementState = {
        destinationId: objective.targetNodeId,
        movementQueue: pathResult.path,
        ticksAccumulated: 0,
        currentEdgeCost: firstCost,
        lastDecisionTick: state.tick,
        movementHistory: [],
      };

      state.graph.updateNode(armyId, {
        properties: { ...armyNode.properties, movementState: newMovementState },
      });

      emitTrace({
        tick: state.tick,
        category: 'faction_ambition',
        summary: `Army "${armyNode.name}" begins march to ${state.graph.getNode(objective.targetNodeId)?.name ?? objective.targetNodeId} (${pathResult.path.length} hops)`,
        armyId,
        event: 'army_march_initiated',
        targetNodeId: objective.targetNodeId,
        pathLength: pathResult.path.length,
      });
    } catch (err) {
      // Fail-soft: log and skip this army
      emitTrace({
        tick: state.tick,
        category: 'faction_ambition',
        summary: `Army movement error for ${armyNode.id}: ${err instanceof Error ? err.message : 'unknown'}`,
        event: 'army_movement_error',
      });
    }
  }
}

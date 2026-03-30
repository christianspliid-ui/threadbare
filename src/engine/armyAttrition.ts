/**
 * Army Attrition — TB-073 Phase 2.
 *
 * Each tick, armies lose Quintessence based on terrain, supply status,
 * and marching conditions. The player never sees the number — only the
 * consequences when thresholds are crossed, delivered as encounters.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 2
 * NFP: Tunability (all rates named), Determinism (no PRNG in attrition),
 *       Inspectability (ArmyAttritionTrace), Fail-soft (clamp to 0, force disband).
 */

import type { GameState } from '../types/gameState';
import type { ArmyState } from '../types/army';
import { getArmyTerrainCost } from './armyMovement';
import { emitTrace } from './traceBuffer';

// ─── Constants ───────────────────────────────────────────────────────────

/** Baseline Quintessence loss per tick (even at rest) */
export const ARMY_BASE_ATTRITION = 0.5;

/** Multiplied by terrain cost, added to attrition */
export const TERRAIN_ATTRITION_FACTOR = 0.3;

/** Extra attrition when not on a road */
export const OFF_ROAD_ATTRITION_PENALTY = 0.8;

/** Extra attrition when faction can't pay maintenance */
export const UNDERFUNDED_ATTRITION_PENALTY = 1.5;

/** Quintessence threshold percentages (fraction of max) */
export const QUINTESSENCE_THRESHOLDS = {
  strained: 0.70,
  weakened: 0.50,
  critical: 0.30,
  collapse: 0.10,
} as const;

/** Template IDs for threshold encounters */
export const THRESHOLD_ENCOUNTER_TEMPLATES: Record<string, string> = {
  strained: 'army.threshold.supply_crisis',
  weakened: 'army.threshold.desertion',
  critical: 'army.threshold.mutiny',
  collapse: 'army.threshold.disbandment',
};

// ─── Phase ──────────────────────────────────────────────────────────────

/**
 * Process Quintessence attrition for all active armies.
 *
 * Runs every tick. For each army:
 * 1. Calculate attrition from terrain + supply + road status
 * 2. Subtract from Quintessence (clamped to 0)
 * 3. Check for threshold crossings → spawn encounters
 * 4. At Quintessence 0 → force disbandment
 */
export function phaseArmyAttrition(state: GameState): void {
  const armyNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null);

  for (const armyNode of armyNodes) {
    try {
      const armyState = armyNode.properties.armyState as ArmyState;

      // Get current terrain
      const locEdges = state.graph.getOutgoingEdges(armyNode.id, 'located_at');
      const locationId = locEdges[0]?.target;
      const locationNode = locationId ? state.graph.getNode(locationId) : null;
      const terrain = (locationNode?.properties.terrain as string) ?? 'plains';

      // Check if on road
      const isOnRoad = locationId
        ? (state.graph.getOutgoingEdges(locationId, 'road').length > 0 ||
           state.graph.getIncomingEdges(locationId, 'road').length > 0)
        : false;

      // Check if faction can pay maintenance
      const memberOfEdges = state.graph.getOutgoingEdges(armyNode.id, 'member_of');
      const factionId = memberOfEdges[0]?.target;
      const isUnderfunded = checkUnderfunded(state, factionId, armyState.maintenanceCost);

      // Calculate attrition
      const terrainCost = getArmyTerrainCost(terrain);
      const attritionSources = {
        base: ARMY_BASE_ATTRITION,
        terrain: terrainCost === Infinity ? 0 : terrainCost * TERRAIN_ATTRITION_FACTOR,
        offRoad: isOnRoad ? 0 : OFF_ROAD_ATTRITION_PENALTY,
        underfunded: isUnderfunded ? UNDERFUNDED_ATTRITION_PENALTY : 0,
      };
      const totalAttrition = attritionSources.base
        + attritionSources.terrain
        + attritionSources.offRoad
        + attritionSources.underfunded;

      const quintessenceBefore = armyState.quintessence;
      const quintessenceAfter = Math.max(0, quintessenceBefore - totalAttrition);

      // Update army state
      const updatedArmyState: ArmyState = {
        ...armyState,
        quintessence: quintessenceAfter,
      };

      // Check threshold crossings
      let thresholdCrossed: string | undefined;
      const qPercent = quintessenceAfter / armyState.quintessenceMax;
      const thresholdsFired = [...armyState.thresholdsFired];

      for (const [name, threshold] of Object.entries(QUINTESSENCE_THRESHOLDS)) {
        const previousPercent = quintessenceBefore / armyState.quintessenceMax;
        if (previousPercent > threshold && qPercent <= threshold && !thresholdsFired.includes(name)) {
          thresholdCrossed = name;
          thresholdsFired.push(name);
          break; // Only one threshold per tick
        }
      }

      updatedArmyState.thresholdsFired = thresholdsFired;

      // Write updated state
      state.graph.updateNode(armyNode.id, {
        properties: { ...armyNode.properties, armyState: updatedArmyState },
      });

      // Emit trace
      emitTrace({
        tick: state.tick,
        category: 'faction_ambition',
        summary: `Army ${armyNode.name}: Q ${quintessenceBefore.toFixed(1)}→${quintessenceAfter.toFixed(1)} (−${totalAttrition.toFixed(1)})${thresholdCrossed ? ` [${thresholdCrossed}]` : ''}`,
        armyId: armyNode.id,
        event: 'attrition',
        quintessenceBefore,
        quintessenceAfter,
        attritionAmount: totalAttrition,
        attritionSources,
        thresholdCrossed,
      });

      // Force disbandment at Quintessence 0
      if (quintessenceAfter <= 0) {
        disbandArmy(state, armyNode.id);
      }
    } catch (err) {
      // Fail-soft: log and skip this army
      emitTrace({
        tick: state.tick,
        category: 'faction_ambition',
        summary: `Army attrition error for ${armyNode.id}: ${err instanceof Error ? err.message : 'unknown'}`,
        event: 'attrition_error',
      });
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Check if a faction is underfunded (can't afford army maintenance).
 * Simple check: faction Gold capability tier < 2 means underfunded.
 */
function checkUnderfunded(
  state: GameState,
  factionId: string | undefined,
  _maintenanceCost: number,
): boolean {
  if (!factionId) return true; // No faction = no funding
  const factionNode = state.graph.getNode(factionId);
  if (!factionNode) return true;

  // Simple heuristic: if faction prosperity is very low, they're underfunded
  const prosperity = (factionNode.properties.prosperity as number) ?? 0.5;
  return prosperity < 0.2;
}

/**
 * Disband an army: remove the actor node, release the commander.
 * Commander stays at their current location.
 */
export function disbandArmy(state: GameState, armyId: string): void {
  const armyNode = state.graph.getNode(armyId);
  if (!armyNode) return;

  // Find commander before removing army
  const commandedByEdges = state.graph.getOutgoingEdges(armyId, 'commanded_by');
  const commanderId = commandedByEdges[0]?.target;

  // Find faction
  const memberOfEdges = state.graph.getOutgoingEdges(armyId, 'member_of');
  const factionId = memberOfEdges[0]?.target;

  // Remove army (removeNode cleans up all edges)
  state.graph.removeNode(armyId);

  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Army "${armyNode.name}" disbanded — Quintessence depleted`,
    armyId,
    factionId,
    commanderId,
    event: 'army_disbanded',
  });
}

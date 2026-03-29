/**
 * Army Spawning — TB-073 Phase 1.
 *
 * Handles army creation when a faction's ambition requires military force.
 * Armies are actor graph nodes with ArmyState in properties.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 1
 * NFP: Determinism (commander selection deterministic, size from Gold tier),
 *       Fail-soft (missing data → skip spawn), Inspectability (ArmyLifecycleTrace).
 */

import type { GameState } from '../types/gameState';
import type { ArmySizeCategory } from '../types/army';
import {
  ARMY_SPAWN_IRON_TIER_MIN,
  ARMY_SPAWN_GOLD_TIER_MIN,
  MAX_ARMIES_PER_FACTION,
  ARMY_QUINTESSENCE_BASE,
  ARMY_MAINTENANCE_COST,
  ARMY_SIZE_HEADCOUNT,
  determineSizeCategory,
} from '../types/army';
import { requiresMilitaryForce } from '../types/faction';
import type { FactionAmbitionType } from '../types/faction';
import { computeCapability, computeTier } from './domainCapability';
import { emitTrace } from './traceBuffer';

// ─── Eligibility ────────────────────────────────────────────────────────

/**
 * Check if a faction is eligible to spawn an army.
 *
 * Requires:
 * - Active ambition that requires military force
 * - Member agent at Iron capability tier >= ARMY_SPAWN_IRON_TIER_MIN
 * - Faction Gold capability tier >= ARMY_SPAWN_GOLD_TIER_MIN
 * - No existing active army for this faction
 */
export function isEligibleForArmySpawn(
  state: GameState,
  factionId: string,
): boolean {
  const graph = state.graph;

  // Check active ambition requires military force
  const pursuesEdges = graph.getOutgoingEdges(factionId, 'pursues');
  if (pursuesEdges.length === 0) return false;

  const ambitionNode = graph.getNode(pursuesEdges[0].target);
  if (!ambitionNode) return false;

  const ambitionType = ambitionNode.properties.ambitionType as FactionAmbitionType;
  if (!requiresMilitaryForce(ambitionType)) return false;

  // Check faction doesn't already have max armies
  const memberEdges = graph.getIncomingEdges(factionId, 'member_of');
  let existingArmyCount = 0;
  for (const edge of memberEdges) {
    const memberNode = graph.getNode(edge.source);
    if (memberNode?.properties.armyState) {
      existingArmyCount++;
    }
  }
  if (existingArmyCount >= MAX_ARMIES_PER_FACTION) return false;

  // Check for eligible commander (Iron tier >= min)
  const commander = selectCommander(state, factionId);
  if (!commander) return false;

  // Check faction Gold capability
  const goldCap = computeCapability(graph, factionId, 'gold');
  const goldTier = computeTier(goldCap);
  if (goldTier < ARMY_SPAWN_GOLD_TIER_MIN) return false;

  return true;
}

// ─── Commander Selection ────────────────────────────────────────────────

/**
 * Select the best commander for a new army.
 * Deterministic: returns the member with highest Iron capability tier.
 * Returns null if no member qualifies.
 */
export function selectCommander(
  state: GameState,
  factionId: string,
): string | null {
  const graph = state.graph;
  const memberEdges = graph.getIncomingEdges(factionId, 'member_of');

  let bestId: string | null = null;
  let bestTier = 0;

  for (const edge of memberEdges) {
    const memberNode = graph.getNode(edge.source);
    if (!memberNode) continue;
    // Skip non-individual actors (don't pick armies or factions as commanders)
    if (memberNode.properties.actorType !== 'individual') continue;
    // Skip members already commanding an army
    const commandEdges = graph.getOutgoingEdges(edge.source, 'commanded_by');
    // commanded_by goes army → commander, so check incoming
    const commandedByEdges = graph.getIncomingEdges(edge.source, 'commanded_by');
    if (commandedByEdges.length > 0) continue;

    const ironCap = computeCapability(graph, edge.source, 'iron');
    const ironTier = computeTier(ironCap);
    if (ironTier >= ARMY_SPAWN_IRON_TIER_MIN && ironTier > bestTier) {
      bestTier = ironTier;
      bestId = edge.source;
    }
  }

  return bestId;
}

// ─── Army Spawning ──────────────────────────────────────────────────────

/**
 * Spawn an army for a faction.
 *
 * Creates an actor node with armyState, wires edges to commander/faction/location,
 * and emits ArmyLifecycleTrace.
 *
 * Returns the army node ID, or null on failure.
 */
export function spawnArmy(
  state: GameState,
  factionId: string,
  commanderId: string,
  ambitionNodeId: string,
): string | null {
  const graph = state.graph;

  // Determine size from faction Gold tier
  const goldCap = computeCapability(graph, factionId, 'gold');
  const goldTier = computeTier(goldCap);
  const size: ArmySizeCategory = determineSizeCategory(goldTier);

  // Get faction and commander info
  const factionNode = graph.getNode(factionId);
  const commanderNode = graph.getNode(commanderId);
  if (!factionNode || !commanderNode) return null;

  // Get spawn location (commander's current location)
  const commanderLocEdges = graph.getOutgoingEdges(commanderId, 'located_at');
  const locationId = commanderLocEdges[0]?.target;
  if (!locationId) return null;

  const armyId = `army_${factionId}_${state.tick}`;
  const armyName = `${factionNode.name} — ${size === 'warband' ? 'Warband' : size === 'regiment' ? 'Regiment' : 'Host'}`;

  try {
    // Create army actor node
    graph.addNode({
      id: armyId,
      type: 'actor',
      name: armyName,
      properties: {
        actorType: 'group',
        armyState: {
          size,
          headcount: ARMY_SIZE_HEADCOUNT[size],
          objective: null,
          quintessence: ARMY_QUINTESSENCE_BASE[size],
          quintessenceMax: ARMY_QUINTESSENCE_BASE[size],
          raisedTick: state.tick,
          maintenanceCost: ARMY_MAINTENANCE_COST[size],
          thresholdsFired: [],
        },
      },
    });

    // commanded_by: army → commander
    graph.addEdge({
      id: `e_commanded_by_${armyId}`,
      source: armyId,
      target: commanderId,
      type: 'commanded_by',
      properties: { assignedTick: state.tick },
    });

    // member_of: army → faction
    graph.addEdge({
      id: `e_member_of_${armyId}`,
      source: armyId,
      target: factionId,
      type: 'member_of',
      properties: {
        role: 'army',
        rank: 'army',
        joinedTick: state.tick,
      },
    });

    // located_at: army → location
    graph.addEdge({
      id: `e_located_at_${armyId}`,
      source: armyId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    // pursues: army → ambition (from faction's active ambition)
    graph.addEdge({
      id: `e_pursues_${armyId}`,
      source: armyId,
      target: ambitionNodeId,
      type: 'pursues',
      properties: {
        priority: 1.0,
        status: 'active',
        milestones: [],
      },
    });

    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Army "${armyName}" raised at ${graph.getNode(locationId)?.name ?? locationId}, commanded by ${commanderNode.name}`,
      factionId,
      armyId,
      commanderId,
      event: 'army_raised',
      size,
      headcount: ARMY_SIZE_HEADCOUNT[size],
      quintessence: ARMY_QUINTESSENCE_BASE[size],
    });

    return armyId;
  } catch (err) {
    // Fail-soft: if anything goes wrong, clean up and return null
    try { graph.removeNode(armyId); } catch { /* already cleaned up */ }
    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Failed to spawn army for ${factionNode.name}: ${err instanceof Error ? err.message : 'unknown error'}`,
      factionId,
      event: 'army_spawn_failed',
    });
    return null;
  }
}

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
import type { ArmySizeCategory, ArmyObjective, ArmyState } from '../types/army';
import {
  ARMY_SPAWN_IRON_TIER_MIN,
  ARMY_SPAWN_GOLD_TIER_MIN,
  MAX_ARMIES_PER_FACTION,
  ARMY_COHESION_BASE,
  ARMY_MAINTENANCE_COST,
  ARMY_SIZE_HEADCOUNT,
  SETTLEMENT_TARGET_SUBTYPES,
  determineSizeCategory,
} from '../types/army';
import { requiresMilitaryForce } from '../types/faction';
import type { FactionAmbitionType } from '../types/faction';
import { computeCapability, computeTier } from './domainCapability';
import { findShortestPath } from './pathfinding';
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

// ─── Objective Selection ────────────────────────────────────────────────

/**
 * Choose a march objective for a freshly-raised army: the nearest reachable
 * settlement controlled by a hostile (different) faction. Without an objective
 * an army sits at its muster point forever (phaseArmyMovement skips null-objective
 * armies) — this is the link that turns a spawned army into a marching, fighting
 * one (TB-073 / THR-614 activation).
 *
 * Deterministic (NFP #3): candidates ranked by path hop-count, ties broken by
 * lexicographic node id — no PRNG. Fail-soft (NFP #4): returns null when the army
 * has no location, its location is not a pathable location node, or no hostile
 * settlement is reachable; the caller leaves the army idle rather than throwing.
 */
export function selectArmyObjective(
  state: GameState,
  armyId: string,
  factionId: string,
): ArmyObjective | null {
  const graph = state.graph;
  const rawStartId = graph.getOutgoingEdges(armyId, 'located_at')[0]?.target;
  if (!rawStartId) return null;
  // Climb a sublocation start to its parent settlement — only top-level locations
  // carry the adjacency edges pathfinding needs (three-tier model).
  const parentStartId = graph.getNode(rawStartId)?.properties.parentLocationId as string | undefined;
  const startId = parentStartId ?? rawStartId;
  const startNode = graph.getNode(startId);
  if (!startNode || startNode.type !== 'location') return null;

  const candidates: { id: string; hops: number }[] = [];
  for (const loc of graph.getNodesByType('location')) {
    const subtype = loc.properties.locationSubtype as string | undefined;
    if (!subtype || !SETTLEMENT_TARGET_SUBTYPES.includes(subtype)) continue;

    // Controlling faction: a `controls` edge points faction → location (the
    // canonical settlement-control model — see worldSeed.ts).
    const controller = graph.getIncomingEdges(loc.id, 'controls')[0]?.source;
    if (!controller || controller === factionId) continue;

    if (loc.id === startId) {
      // Already garrisoned atop a hostile settlement — besiege in place (0 hops).
      candidates.push({ id: loc.id, hops: 0 });
      continue;
    }
    const path = findShortestPath(graph, armyId, startId, loc.id);
    if (!path) continue;
    candidates.push({ id: loc.id, hops: path.path.length });
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.hops - b.hops || (a.id < b.id ? -1 : 1));
  return { type: 'conquer', targetNodeId: candidates[0].id, estimatedAttrition: 0 };
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

  // Get spawn location (commander's current location), resolved up to the parent
  // settlement when the commander stands in a sublocation (three-tier model). An
  // army musters at the settlement, not inside a gatehouse room — the sublocation
  // isn't in the location adjacency graph, so an army stationed there could neither
  // pick a march target nor path out (THR-614).
  const commanderLocEdges = graph.getOutgoingEdges(commanderId, 'located_at');
  const rawLocationId = commanderLocEdges[0]?.target;
  if (!rawLocationId) return null;
  const parentLocationId = graph.getNode(rawLocationId)?.properties.parentLocationId as string | undefined;
  const locationId = parentLocationId ?? rawLocationId;

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
        // THR-1297: explicit kind tag — see engine/groupShape.ts.
        groupKind: 'army',
        armyState: {
          size,
          headcount: ARMY_SIZE_HEADCOUNT[size],
          objective: null,
          cohesion: ARMY_COHESION_BASE[size],
          cohesionMax: ARMY_COHESION_BASE[size],
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

    // Give the army a march objective (nearest hostile settlement) so it advances
    // and reaches a battle/siege instead of idling at its muster point (THR-614).
    const objective = selectArmyObjective(state, armyId, factionId);
    if (objective) {
      const armyNode = graph.getNode(armyId);
      const armyState = armyNode?.properties.armyState as ArmyState | undefined;
      if (armyNode && armyState) {
        graph.updateNode(armyId, {
          properties: { ...armyNode.properties, armyState: { ...armyState, objective } },
        });
      }
    }

    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Army "${armyName}" raised at ${graph.getNode(locationId)?.name ?? locationId}, commanded by ${commanderNode.name}`
        + (objective ? ` — marching to ${graph.getNode(objective.targetNodeId)?.name ?? objective.targetNodeId}` : ' — no hostile target found, holding'),
      factionId,
      armyId,
      commanderId,
      event: 'army_raised',
      size,
      headcount: ARMY_SIZE_HEADCOUNT[size],
      cohesion: ARMY_COHESION_BASE[size],
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

// ─── Warhost Force (THR-550) ──────────────────────────────────────────────

/**
 * Map a sphere-scaled warhost strength to an army size category, reusing the
 * existing army cohesion-base values as the thresholds (no new size constants).
 */
function warhostSizeForStrength(strength: number): ArmySizeCategory {
  if (strength >= ARMY_COHESION_BASE.host) return 'host';
  if (strength >= ARMY_COHESION_BASE.regiment) return 'regiment';
  return 'warband';
}

/**
 * Raise a warhost force for a faction — the aftermath of Iron's Warhost signature
 * (THR-550, "Call to Arms").
 *
 * Reuses the existing army node form (an `actor` node with `actorType: 'group'` and
 * an `armyState` bag, wired by `commanded_by` / `member_of` / `located_at` edges) —
 * NOT a new node type (load-bearing rule). It differs from {@link spawnArmy} only in
 * that the force is divinely commanded: no faction-ambition coupling (no `pursues`
 * edge), no eligibility/Gold-tier gate, and its cohesion is set from the
 * sphere-scaled warhost strength rather than the faction's Gold tier. The army carries
 * `objective: null` (a supported idle state — `armyMovement` skips null-objective
 * armies) and a `warhost: true` marker for inspection.
 *
 * Determinism (NFP #3): no PRNG — id, size, and cohesion derive only from inputs.
 * Fail-soft (NFP #4): returns null on missing faction/leader, a leader with no
 * location, or any graph error (caller falls back to a faction property + sentiment
 * shift). Never throws.
 *
 * @returns the warhost army node id, or null when no force could be raised.
 */
export function raiseWarhostForce(
  state: GameState,
  factionId: string,
  leaderId: string,
  strength: number,
  tick: number,
): string | null {
  const graph = state.graph;
  const factionNode = graph.getNode(factionId);
  const leaderNode = graph.getNode(leaderId);
  if (!factionNode || !leaderNode) return null;

  // Spawn point: the leader's current location.
  const leaderLocEdges = graph.getOutgoingEdges(leaderId, 'located_at');
  const locationId = leaderLocEdges[0]?.target;
  if (!locationId) return null;

  const size = warhostSizeForStrength(strength);
  const cohesion = Math.max(1, Math.round(strength));
  const armyId = `warhost_${factionId}_${tick}`;
  const armyName = `${factionNode.name} — Warhost`;

  try {
    graph.addNode({
      id: armyId,
      type: 'actor',
      name: armyName,
      properties: {
        actorType: 'group',
        // THR-1297: a warhost is an army — same kind, different scale.
        groupKind: 'army',
        warhost: true,
        armyState: {
          size,
          headcount: ARMY_SIZE_HEADCOUNT[size],
          objective: null,
          cohesion,
          cohesionMax: cohesion,
          raisedTick: tick,
          maintenanceCost: ARMY_MAINTENANCE_COST[size],
          thresholdsFired: [],
        },
      },
    });

    // commanded_by: warhost → leader
    graph.addEdge({
      id: `e_commanded_by_${armyId}`,
      source: armyId,
      target: leaderId,
      type: 'commanded_by',
      properties: { assignedTick: tick },
    });

    // member_of: warhost → faction (faction-owned force)
    graph.addEdge({
      id: `e_member_of_${armyId}`,
      source: armyId,
      target: factionId,
      type: 'member_of',
      properties: { role: 'army', rank: 'army', joinedTick: tick },
    });

    // located_at: warhost → location
    graph.addEdge({
      id: `e_located_at_${armyId}`,
      source: armyId,
      target: locationId,
      type: 'located_at',
      properties: {},
    });

    return armyId;
  } catch {
    // Fail-soft: clean up a partially-created node and let the caller fall back.
    try { graph.removeNode(armyId); } catch { /* already cleaned up */ }
    return null;
  }
}

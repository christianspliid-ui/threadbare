/**
 * Army Spawning — TB-073 Phase 1.
 *
 * Handles army creation when a faction's ambition requires military force.
 * Armies are actor graph nodes with ArmyState in properties.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 1
 * NFP: Determinism (commander selection deterministic, size from Gold tier),
 *       Fail-soft (missing data → skip spawn), Inspectability (ArmyLifecycleTrace).
 *
 * The Gold and Iron tiers are `computeTier(reach share)` — ceil(share × 10), so the
 * Gold gate (tier 3) opens past raw 8, a regiment past raw 16, a host past raw 24, and
 * the commander gate (Iron tier 4) past raw 12 (THR-1580). They read the pre-refit
 * sigmoid, which made every faction a host and tied every commander past raw ~16 at
 * tier 10. Commander choice ranks on the raw Iron score, so the strongest wins even
 * where the tier saturates.
 */

import type { GameState } from '../types/gameState';
import type { ArmySizeCategory, ArmyObjective, ArmyState } from '../types/army';
import {
  ARMY_SPAWN_IRON_TIER_MIN,
  ARMY_SPAWN_GOLD_TIER_MIN,
  ARMY_CREATION_GOLD_COST,
  MAX_ARMIES_PER_FACTION,
  STANDING_ARMY_FACTION_CLASSES,
  STANDING_ARMY_FACTION_DEF_IDS,
  ARMY_COHESION_BASE,
  ARMY_MAINTENANCE_COST,
  ARMY_SIZE_HEADCOUNT,
  SETTLEMENT_TARGET_SUBTYPES,
  determineSizeCategory,
} from '../types/army';
import { requiresMilitaryForce } from '../types/faction';
import type { FactionAmbitionType } from '../types/faction';
import { computeRawScore, computeReachShare, computeTier } from './domainCapability';
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import { findAllShortestPaths } from './pathfinding';
import { emitTrace } from './traceBuffer';
import { reportWar, captureArmySide } from './armyNotifications';
import { readWealth, applyTreasuryDelta } from './wealth';
import { upkeepOf } from './factionPurse/upkeep';
import { isPurseFaction } from './factionPurse/income';
import { FACTION_PURSE_ENABLED } from '../data/faction-purse-constants';
import { isEnemyFaction, commandBarsAttack, commanderFactionOf } from './warAims/enemy';
import { ownFactionOf } from './crown/wages';
import { aimNewArmy } from './warAims';
import { WAR_AIMS_ENABLED } from '../data/war-aims-constants';

// ─── Army tiers ─────────────────────────────────────────────────────────

/**
 * The tier (1–10) an army gate reads: a standing requirement, so the reach share
 * (THR-1580), not the dice. Shared with the campaign hand-off in `notableAgendas`.
 */
export function armyReachTier(graph: WorldGraph, nodeId: string, reach: ReachDomain): number {
  return computeTier(computeReachShare(graph, nodeId, reach));
}

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
  return armyRefusal(state, factionId) === null;
}

/**
 * THR-1973 — whether a faction keeps a standing army whatever its ambition (a realm, a
 * free company): `STANDING_ARMY_FACTION_CLASSES` / `STANDING_ARMY_FACTION_DEF_IDS`.
 */
export function keepsStandingArmy(graph: WorldGraph, factionId: string): boolean {
  const props = graph.getNode(factionId)?.properties;
  if (!props) return false;
  const cls = props.factionClass;
  const defId = props.factionDefId ?? props.factionDefinitionId;
  return (typeof cls === 'string' && STANDING_ARMY_FACTION_CLASSES.includes(cls))
    || (typeof defId === 'string' && STANDING_ARMY_FACTION_DEF_IDS.includes(defId));
}

/**
 * THR-1973 — the gate that refuses a faction a raise, named, or null when it may raise.
 * The gates run in `isEligibleForArmySpawn`'s order; the first that fails is returned.
 */
export type ArmyRefusal = 'no_ambition' | 'not_military' | 'at_cap' | 'no_commander' | 'gold_tier' | 'purse';

export function armyRefusal(state: GameState, factionId: string): ArmyRefusal | null {
  const graph = state.graph;

  // Check active ambition requires military force
  const pursuesEdges = graph.getOutgoingEdges(factionId, 'pursues');
  if (pursuesEdges.length === 0) return 'no_ambition';

  const ambitionNode = graph.getNode(pursuesEdges[0].target);
  if (!ambitionNode) return 'no_ambition';

  const ambitionType = ambitionNode.properties.ambitionType as FactionAmbitionType;
  if (!requiresMilitaryForce(ambitionType) && !keepsStandingArmy(graph, factionId)) return 'not_military';

  // Check faction doesn't already have max armies
  const memberEdges = graph.getIncomingEdges(factionId, 'member_of');
  let existingArmyCount = 0;
  for (const edge of memberEdges) {
    const memberNode = graph.getNode(edge.source);
    if (memberNode?.properties.armyState) {
      existingArmyCount++;
    }
  }
  if (existingArmyCount >= MAX_ARMIES_PER_FACTION) return 'at_cap';

  // Check for eligible commander (Iron tier >= min)
  const commander = selectCommander(state, factionId);
  if (!commander) return 'no_commander';

  // Check faction Gold capability
  const goldTier = armyReachTier(graph, factionId, 'gold');
  if (goldTier < ARMY_SPAWN_GOLD_TIER_MIN) return 'gold_tier';

  // THR-1931 — raising costs coin: the purse must cover the raise and its first day.
  if (!canAffordArmy(graph, factionId, determineSizeCategory(goldTier))) return 'purse';

  return null;
}

/**
 * THR-1974 — the size of army a faction would raise now: its Gold tier's size
 * (`determineSizeCategory`). `spawnArmy` and the oath price (`crown/eligibility.ts`)
 * both read it, so the price of a company that fields nothing and the host it raises
 * cannot drift. Fail-soft: bad data reads as a warband, the cheapest, so a price never
 * inflates on it.
 */
export function wouldRaiseSize(graph: WorldGraph, factionId: string): ArmySizeCategory {
  try {
    const tier = armyReachTier(graph, factionId, 'gold');
    return Number.isFinite(tier) ? determineSizeCategory(tier) : 'warband';
  } catch {
    return 'warband';
  }
}

/**
 * THR-1931 — whether a faction's purse covers `ARMY_CREATION_GOLD_COST` plus the first
 * day's upkeep of an army of this size. Always true with the purse off, and for a
 * faction outside the purse economy (monster lairs).
 */
export function canAffordArmy(graph: WorldGraph, factionId: string, size: ArmySizeCategory): boolean {
  if (!FACTION_PURSE_ENABLED) return true;
  const faction = graph.getNode(factionId);
  if (!isPurseFaction(faction)) return true;
  return readWealth(faction.properties) >= ARMY_CREATION_GOLD_COST + upkeepOf(size);
}

// ─── Commander Selection ────────────────────────────────────────────────

/**
 * Select the best commander for a new army.
 * Deterministic: among members whose Iron tier clears ARMY_SPAWN_IRON_TIER_MIN,
 * returns the one with the highest raw Iron score (first edge on a tie). Ranking on
 * the raw score, not the tier, keeps the strongest from tying at tier 10 (THR-1580).
 * Returns null if no member qualifies.
 */
export function selectCommander(
  state: GameState,
  factionId: string,
): string | null {
  const graph = state.graph;
  const memberEdges = graph.getIncomingEdges(factionId, 'member_of');

  let bestId: string | null = null;
  let bestRaw = -Infinity;

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

    if (armyReachTier(graph, edge.source, 'iron') < ARMY_SPAWN_IRON_TIER_MIN) continue;
    const ironRaw = computeRawScore(graph, edge.source, 'iron');
    if (ironRaw > bestRaw) {
      bestRaw = ironRaw;
      bestId = edge.source;
    }
  }

  return bestId;
}

// ─── Objective Selection ────────────────────────────────────────────────

/**
 * Choose a march objective for a freshly-raised army: the nearest reachable
 * settlement held by an enemy of its faction (`isEnemyFaction`), never one the faction
 * keeps a hall or home in unless it was taken from it (THR-1922 — before it, any other
 * holder counted as hostile). Without an objective
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
  // One single-source run prices every hostile settlement at once (THR-1389).
  const paths = findAllShortestPaths(graph, armyId, startId);
  for (const loc of graph.getNodesByType('location')) {
    const subtype = loc.properties.locationSubtype as string | undefined;
    if (!subtype || !SETTLEMENT_TARGET_SUBTYPES.includes(subtype)) continue;

    // Controlling faction: a `controls` edge points faction → location (the
    // canonical settlement-control model — see worldSeed.ts).
    const controller = graph.getIncomingEdges(loc.id, 'controls')[0]?.source;
    if (!controller || controller === factionId) continue;
    // THR-1922 — only an enemy's town, and never one this faction keeps a hall in
    // (unless the enemy took it from this faction).
    if (!isEnemyFaction(graph, factionId, controller)) continue;
    if (commandBarsAttack(graph, factionId, ownFactionOf(graph, armyId), loc.id)) continue;

    if (loc.id === startId) {
      // Already garrisoned atop a hostile settlement — besiege in place (0 hops).
      candidates.push({ id: loc.id, hops: 0 });
      continue;
    }
    const path = paths.get(loc.id);
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
 * `opts.charge` (THR-1931): an ambition or agenda raise pays `ARMY_CREATION_GOLD_COST`
 * from the faction purse. Worldgen spawns and encounter warhosts pass nothing and pay
 * nothing — a warhost's price was paid in its scene. Every army costs upkeep regardless.
 * `opts.liegePaid` (THR-2020): the crown's liege-paid raise — the army starts paid
 * through today by the liege (`liegePaidTick`), and aims as its liege's army.
 *
 * Returns the army node ID, or null on failure.
 */
export function spawnArmy(
  state: GameState,
  factionId: string,
  commanderId: string,
  ambitionNodeId: string,
  opts: { charge?: boolean; liegePaid?: boolean } = {},
): string | null {
  const graph = state.graph;

  // Determine size from faction Gold tier (THR-1974: the one rule the oath price reads too)
  const size: ArmySizeCategory = wouldRaiseSize(graph, factionId);

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
          // THR-2020 — a liege-paid raise is stamped before it aims, so its first
          // objective is picked for the liege that commands it (`commanderFactionOf`).
          ...(opts.liegePaid ? { paidThroughTick: state.tick, liegePaidTick: state.tick } : {}),
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

    // Give the army a march objective so it advances and reaches a battle/siege instead
    // of idling at its muster point (THR-614). THR-1933: defence first, else the richest
    // enemy town in reach (`aimNewArmy` writes the objective or the hold itself); off,
    // the THR-1922 nearest enemy settlement.
    const objective = WAR_AIMS_ENABLED
      ? aimNewArmy(state, armyId)
      : selectArmyObjective(state, armyId, commanderFactionOf(graph, armyId, state.tick) ?? factionId);
    if (objective && !WAR_AIMS_ENABLED) {
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

    // THR-1931 — the raise cost, charged after the army exists so a failed spawn costs nothing.
    if (opts.charge && FACTION_PURSE_ENABLED && isPurseFaction(factionNode)) {
      const wealthAfter = applyTreasuryDelta(readWealth(factionNode.properties), -ARMY_CREATION_GOLD_COST);
      factionNode.properties.wealth = wealthAfter;
      const raised = graph.getNode(armyId);
      const raisedState = raised?.properties.armyState as ArmyState | undefined;
      // The raise pays its first day: the army starts paid through today.
      if (raised && raisedState) raised.properties.armyState = { ...raisedState, paidThroughTick: state.tick };
      emitTrace({
        tick: state.tick,
        category: 'economy.purse.army_raised',
        summary: `${factionNode.name ?? factionId} paid ${ARMY_CREATION_GOLD_COST} to raise ${armyName}`,
        factionId,
        armyId,
        cost: ARMY_CREATION_GOLD_COST,
        wealthAfter,
      });
    }

    // War news (THR-1564): reported here, where the army is raised, not read back off
    // the trace above — traces are off in normal play. Fail-soft on a bare worldgen state.
    reportWar(state, { kind: 'army_raised', side: captureArmySide(state, armyId), placeId: locationId });

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

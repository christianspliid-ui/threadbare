/**
 * NPC Band Spawner — THR-731
 *
 * Companies (THR-74) travel, delve, and fray, but the world held nothing at their
 * scale to push back: monsters are encounter furniture and hostile factions act
 * through abstract verbs or full armies. A **band** closes that gap — a faction's
 * own people, fielded as an ordinary `faction_band` company.
 *
 * "Ordinary" is the load-bearing word. A band is a company node in every respect:
 * it moves through `phaseGroups`, it frays, it dissolves, its members are real
 * named agents whose deaths are real graph deaths. Nothing here special-cases a
 * band out of the shipped group machinery — the only additions are *who* musters
 * one and *why*, recorded as `bandRole`.
 *
 * NFP #1 Tunability: every number lives in `group-constants.ts` (band section).
 * NFP #2 Inspectability: emits `band_spawned` alongside the usual `group_formed`.
 * NFP #3 Determinism: single injected seeded rng; deterministic id-sorted picks.
 * NFP #4 Fail-soft: per-faction try/catch; a rejected write skips that faction.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import type { BandSpawnedTrace } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { createGroup } from './groupFormation';
import { getAllGroups, isBandNode, isAgentGone, isGrouped, type BandRole } from './groupQueries';
import {
  BAND_SPAWN_INTERVAL,
  BAND_SPAWN_CHANCE,
  MAX_ACTIVE_BANDS_PER_FACTION,
  BAND_SIZE_MIN,
  BAND_SIZE_MAX,
  BAND_FACTION_MEMBER_RESERVE,
  BAND_COHESION_START,
} from '../../data/group-constants';

/**
 * Agents a faction may draw on to field a band.
 *
 * Deliberately **not** `isGroupEligibleAgent`: that predicate additionally requires
 * `spotlightTier === 'spotlight'`, which is an attention budget for *player-facing*
 * company formation. Measured on `--seed 42 --map medium` at tick 0, that gate left
 * exactly one faction in the world able to field a band (the 32-member Iron Wolves
 * contributed a single eligible agent), which would have shipped a spawner that
 * effectively never fires. A guild musters from its roster, not from the subset the
 * camera happens to be following.
 */
function bandEligibleMembers(graph: WorldGraph, factionId: string): GraphNode[] {
  return graph.getIncomingEdges(factionId, 'member_of')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode =>
      !!n
      && n.type === 'actor'
      && n.properties.actorType === 'individual'
      && !isAgentGone(n)
      && !isGrouped(graph, n.id))
    // Deterministic order before any rng touches the list (NFP #3).
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Live bands this faction currently fields. */
function activeBandCount(graph: WorldGraph, factionId: string): number {
  return getAllGroups(graph).filter(g =>
    isBandNode(g)
    && (g.properties as Record<string, unknown>).bandFactionId === factionId
    && (g.properties as Record<string, unknown>).groupStatus === 'active').length;
}

/** An agent's current location node id, or undefined if unplaced. */
function locationOf(graph: WorldGraph, agentId: string): string | undefined {
  return graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
}

/**
 * The largest set of eligible members standing in the same place.
 *
 * A band forms out of people who are actually together — the faction cannot
 * teleport a muster into being. Ties break on location id so the pick is stable.
 */
function largestColocatedCluster(
  graph: WorldGraph,
  members: readonly GraphNode[],
): { locationId: string; members: GraphNode[] } | undefined {
  const byLocation = new Map<string, GraphNode[]>();
  for (const m of members) {
    const locId = locationOf(graph, m.id);
    if (!locId) continue;
    const bucket = byLocation.get(locId) ?? [];
    bucket.push(m);
    byLocation.set(locId, bucket);
  }

  let best: { locationId: string; members: GraphNode[] } | undefined;
  for (const [locationId, bucket] of [...byLocation.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (bucket.length < BAND_SIZE_MIN) continue;
    if (!best || bucket.length > best.members.length) best = { locationId, members: bucket };
  }
  return best;
}

/**
 * True when a faction could field a band right now — the structural preconditions
 * only, with no rng. Shared by the sweep (to gate its roll) and readable on its own
 * as the answer to "why is this guild not mustering?".
 */
export function canFieldBand(graph: WorldGraph, factionId: string): boolean {
  if (activeBandCount(graph, factionId) >= MAX_ACTIVE_BANDS_PER_FACTION) return false;
  const eligible = bandEligibleMembers(graph, factionId);
  if (eligible.length < BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE) return false;
  return largestColocatedCluster(graph, eligible) !== undefined;
}

/**
 * Muster one band for a faction, or return undefined if it cannot.
 *
 * Exported for the CLI/debug `spawn band` path, which skips the interval and roll
 * but keeps every structural precondition — a forced spawn still cannot conjure
 * members a faction does not have.
 */
export function spawnBandForFaction(
  state: GameState,
  faction: GraphNode,
  rng: () => number,
  bandRole: BandRole = 'defender',
): { groupId: string; name: string; memberIds: string[] } | undefined {
  const graph = state.graph;

  if (activeBandCount(graph, faction.id) >= MAX_ACTIVE_BANDS_PER_FACTION) return undefined;

  const eligible = bandEligibleMembers(graph, faction.id);
  // The reserve is what keeps the hall staffed: a faction that sends everyone out
  // stops being a faction and starts being a company.
  if (eligible.length < BAND_SIZE_MIN + BAND_FACTION_MEMBER_RESERVE) return undefined;

  const cluster = largestColocatedCluster(graph, eligible);
  if (!cluster) return undefined;

  // Never draw the reserve down below the floor, however large the cluster is.
  const drawable = Math.min(
    cluster.members.length,
    BAND_SIZE_MAX,
    eligible.length - BAND_FACTION_MEMBER_RESERVE,
  );
  if (drawable < BAND_SIZE_MIN) return undefined;

  const size = BAND_SIZE_MIN + Math.floor(rng() * (drawable - BAND_SIZE_MIN + 1));
  const members = cluster.members.slice(0, size);
  const leader = members[0];

  const created = createGroup(state, {
    members,
    leaderId: leader.id,
    locationId: cluster.locationId,
    cause: 'band_spawn',
    groupType: 'faction_band',
    startingCohesion: BAND_COHESION_START,
    bandRole,
    bandFactionId: faction.id,
  });
  if (!created) return undefined;

  // The band belongs to its faction. `faction_band` movement reads this edge to
  // find the faction's objective (`getFactionObjectiveDestination`), which is what
  // makes a band roam with purpose instead of drifting like a party.
  try {
    graph.addEdge({
      id: `e_member_of_${created.groupId}_${faction.id}`,
      source: created.groupId,
      target: faction.id,
      type: 'member_of',
      properties: { role: 'band', rank: 0, joinedTick: state.tick },
    });
  } catch {
    // Fail-soft: an unattached band still fights and frays; it simply roams as a
    // party would. Better a rootless band than a half-written graph.
  }

  // `id`/`timestamp` are stamped by the buffer, so the annotation must omit them —
  // annotating the full trace type here is what makes `emitTrace` reject the object.
  const trace: Omit<BandSpawnedTrace, 'id' | 'timestamp'> = {
    category: 'band_spawned',
    tick: state.tick,
    groupId: created.groupId,
    groupName: created.name,
    factionId: faction.id,
    factionName: faction.name,
    bandRole,
    memberIds: created.memberIds,
    membersRemaining: eligible.length - created.memberIds.length,
    summary: `${faction.name} fielded ${created.name} (${created.memberIds.length} ${bandRole}s).`,
  };
  emitTrace(trace);

  return { groupId: created.groupId, name: created.name, memberIds: created.memberIds };
}

/**
 * Per-sweep band formation across every mortal faction.
 *
 * Called from `phaseFactionActions` — a band is a deliberate faction act, so it
 * belongs beside the faction's other deliberate acts rather than in its own phase.
 * Monster factions are skipped: they are abstract lair-owners with no `member_of`
 * roster to muster from (a legendary lair mints exactly one named elite, ever), so
 * the outbound raider path needs a monster-population design of its own —
 * TODO(THR-767). Read this skip as a known gap with a ticket, not an oversight.
 *
 * @returns how many bands were fielded this sweep.
 */
export function spawnFactionBands(state: GameState, rng: () => number): number {
  if (state.tick === 0) return 0;
  if (state.tick % BAND_SPAWN_INTERVAL !== 0) return 0;

  const factions = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction' && !n.properties.isMonsterFaction)
    .sort((a, b) => a.id.localeCompare(b.id)); // deterministic sweep order (NFP #3)

  let spawned = 0;
  for (const faction of factions) {
    try {
      // Structural eligibility gates the roll, not the other way round.
      //
      // Rolling first looks tidier (one rng draw per faction per sweep) but spends
      // the probability budget on factions that could never field a band. Measured
      // on `--seed 42 --map medium` at tick 24: of 49 factions only ~10 hold a
      // colocated cluster of three, so a roll-first sweep passed 5 factions and
      // *all five* were barren — 0 bands, and the effective spawn rate silently
      // scaled with how many empty guilds the worldgen happened to mint.
      if (!canFieldBand(state.graph, faction.id)) continue;
      if (rng() >= BAND_SPAWN_CHANCE) continue;
      if (spawnBandForFaction(state, faction, rng)) spawned++;
    } catch {
      // Fail-soft: skip this faction, never crash the tick loop (NFP #4).
    }
  }
  return spawned;
}

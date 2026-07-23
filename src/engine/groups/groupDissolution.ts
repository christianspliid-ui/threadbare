/**
 * Company Dissolution & Leaving — THR-74
 *
 * Companies end; they do not vanish. A dissolved company's node persists with
 * `groupStatus: 'disbanded'`, and every `member_of` edge keeps its `leftAtTick`.
 * That pair is the historical record prose reads from later ("they rode with the
 * Quiet Wardens, once"), which is why nothing here removes nodes or edges.
 *
 * Runs as sub-step 1 of `phaseGroups` — cheap checks first, so most companies exit
 * early and the expensive movement aggregation only runs for survivors.
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import {
  getGroupMemberEdges,
  getGroupMembers,
  getGroupLeader,
  getGroupCohesion,
  isAgentGone,
  isGroupBlessed,
  type DissolutionReason,
} from './groupQueries';
import { reconcileLostMembers, refreshRoster } from './groupCohesion';
import {
  GROUP_MIN_MEMBERS,
  GROUP_DISSOLUTION_THRESHOLD,
  GROUP_FRAY_THRESHOLD,
} from '../../data/group-constants';

export interface DissolutionOutcome {
  groupId: string;
  reason: DissolutionReason;
  finalCohesion: number;
  ticksActive: number;
}

/** What sub-step 1 did for one company. */
export interface GroupUpkeepResult {
  dissolved?: DissolutionOutcome;
  /** Members who evaluated leaving this tick. */
  leaveDecisions: number;
  /** Cohesion deltas applied during upkeep (deaths, departures). */
  cohesionDeltas: number;
}

/**
 * Run dissolution and leave checks for one company.
 *
 * Order matters: losses are reconciled first (a company that just lost half its
 * members should dissolve for `undersize` this tick, not next), then the
 * dissolution triggers, then individual leave decisions for survivors.
 */
export function runGroupUpkeep(
  state: GameState,
  group: GraphNode,
  rng: () => number,
): GroupUpkeepResult {
  const graph = state.graph;
  const result: GroupUpkeepResult = { leaveDecisions: 0, cohesionDeltas: 0 };

  // 1. Reconcile deaths/vanished members (also charges cohesion per loss).
  result.cohesionDeltas += reconcileLostMembers(graph, group, state.tick);

  const cohesion = getGroupCohesion(group);
  const formedAtTick = (group.properties as Record<string, unknown>).formedAtTick as number | undefined;
  const ticksActive = state.tick - (formedAtTick ?? state.tick);

  // 2. Dissolution triggers, cheapest first.
  const leader = getGroupLeader(graph, group.id);
  const members = getGroupMembers(graph, group.id);

  let reason: DissolutionReason | undefined;
  if (members.length < GROUP_MIN_MEMBERS) {
    reason = 'undersize';
  } else if (isAgentGone(leader)) {
    // Fail-soft: promote rather than dissolve when someone can take the reins.
    const promoted = promoteNewLeader(state, group, members);
    if (!promoted) reason = 'leader_death';
  } else if (cohesion < GROUP_DISSOLUTION_THRESHOLD) {
    reason = 'cohesion_floor';
  } else if (isGoalComplete(state, group)) {
    reason = 'goal_complete';
  }

  if (reason) {
    dissolveGroup(state, group, reason);
    return { ...result, dissolved: { groupId: group.id, reason, finalCohesion: cohesion, ticksActive } };
  }

  // 3. Individual leave decisions — only evaluated once the company is fraying,
  //    so a healthy company never spends cycles asking its members to reconsider.
  if (cohesion < GROUP_FRAY_THRESHOLD && !isGroupBlessed(group, state.tick)) {
    for (const member of members) {
      if (member.id === leader?.id) continue; // the leader leaving is a dissolution, not a departure
      result.leaveDecisions++;
      if (shouldMemberLeave(member, cohesion, rng)) {
        removeMember(state, group, member, 'chose_to_leave');
        result.cohesionDeltas++;
      }
    }
  }

  return result;
}

/**
 * Leave probability for one member of a fraying company.
 *
 * An ambitious, cautious agent walks away from a failing company sooner than a
 * loyal, reckless one. The shortfall below the fray threshold sets the base rate;
 * personality scales it.
 */
function shouldMemberLeave(
  member: GraphNode,
  cohesion: number,
  rng: () => number,
): boolean {
  const shortfall = Math.max(0, GROUP_FRAY_THRESHOLD - cohesion) / GROUP_FRAY_THRESHOLD; // 0–1
  const profile = (member.properties as Record<string, unknown>).axiologicalProfile as
    | { loyalty_ambition?: number; courage_prudence?: number }
    | undefined;

  // loyalty_ambition: negative = loyal, positive = ambitious.
  const ambition = profile?.loyalty_ambition ?? 0;
  // courage_prudence: negative = prudent (leaves a sinking company sooner).
  const prudence = -(profile?.courage_prudence ?? 0);

  const rate = shortfall * 0.25 * (1 + ambition * 0.5 + prudence * 0.3);
  return rng() < Math.max(0, Math.min(0.5, rate));
}

/** True when the company's shared ambition has been completed. */
function isGoalComplete(state: GameState, group: GraphNode): boolean {
  for (const edge of state.graph.getOutgoingEdges(group.id, 'pursues')) {
    const status = edge.properties?.status as string | undefined;
    if (status === 'complete' || status === 'completed') return true;
    const ambition = state.graph.getNode(edge.target);
    const ambStatus = (ambition?.properties as Record<string, unknown> | undefined)?.status;
    if (ambStatus === 'complete' || ambStatus === 'completed') return true;
  }
  return false;
}

/**
 * Repoint `commanded_by` at the longest-serving surviving member.
 * Returns false when nobody is left to lead (caller then dissolves).
 */
function promoteNewLeader(state: GameState, group: GraphNode, members: GraphNode[]): boolean {
  const graph = state.graph;
  const candidates = members.filter(m => !isAgentGone(m));
  if (candidates.length === 0) return false;

  const successor = candidates[0]; // getGroupMembers returns join order
  for (const edge of graph.getOutgoingEdges(group.id, 'commanded_by')) {
    graph.removeEdge(edge.id);
  }
  graph.addEdge({
    id: `e_commanded_by_${group.id}_${state.tick}`,
    source: group.id,
    target: successor.id,
    type: 'commanded_by',
    properties: { assignedTick: state.tick, promoted: true },
  });

  // Reflect the new role on the membership edge so UI and prose agree.
  for (const edge of getGroupMemberEdges(graph, group.id)) {
    const isLeader = edge.source === successor.id;
    if ((edge.properties?.role === 'leader') !== isLeader) {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, role: isLeader ? 'leader' : 'member' },
      });
    }
  }
  return true;
}

/** Close one member's `member_of` edge. The edge persists as history. */
export function removeMember(
  state: GameState,
  group: GraphNode,
  member: GraphNode,
  leaveReason: string,
): void {
  for (const edge of getGroupMemberEdges(state.graph, group.id)) {
    if (edge.source !== member.id) continue;
    state.graph.updateEdge(edge.id, {
      properties: { ...edge.properties, leftAtTick: state.tick, leaveReason },
    });
  }
  refreshRoster(state.graph, group.id);
}

/**
 * Mark a company disbanded. The node and every membership edge stay in the graph
 * — this is inertification, not deletion.
 */
export function dissolveGroup(
  state: GameState,
  group: GraphNode,
  reason: DissolutionReason,
): void {
  const graph = state.graph;

  for (const edge of getGroupMemberEdges(graph, group.id)) {
    graph.updateEdge(edge.id, {
      properties: { ...edge.properties, leftAtTick: state.tick, leaveReason: reason },
    });
  }

  const current = graph.getNode(group.id);
  graph.updateNode(group.id, {
    properties: {
      ...(current?.properties ?? group.properties),
      groupStatus: 'disbanded',
      disbandedAtTick: state.tick,
      dissolutionReason: reason,
      groupDestinationId: undefined,
      roster: [],
    },
  });
}

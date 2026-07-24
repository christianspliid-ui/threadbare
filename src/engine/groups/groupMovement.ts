/**
 * Company Movement — THR-74
 *
 * A company travels as one. Rather than inventing a second movement engine, this
 * module *decides* a shared destination and then writes each member's existing
 * `MovementState`. `phaseMovement` — which runs immediately after `phaseGroups` —
 * executes those queues through the normal `tickMovement` path.
 *
 * That ordering is what makes the group "supersede" its members: `phaseAgentDecision`
 * may have picked personal destinations earlier in the tick, and this phase
 * overwrites them before anything is executed. No guard is needed inside the
 * individual movement path, and no existing phase code changes.
 *
 * ## Decision modes (by `groupType`)
 *
 * - `squad`        — the leader's top candidate wins outright.
 * - `party`        — per-destination sum of member candidate scores, with the
 *                    leader's vote weighted; highest sum wins. Consensus, not command.
 * - `faction_band` — the faction's objective is injected as a weighted candidate,
 *                    then scored exactly like `party`.
 *
 * **Dissent:** any member whose own top candidate beat the chosen destination
 * (for them) by more than `GROUP_DISSENT_MARGIN` registers dissent — a cohesion
 * hit and a drama-seed candidate. Disagreement is the point; a company that never
 * argues is a company with nothing at stake.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { MovementState, MovementCandidate } from '../../types/movement';
import { DECISION_REEVALUATION_TICKS } from '../../types/movement';
import type { AxiologicalProfile } from '../../types/agent';
import { generateMovementCandidates } from '../movementCandidates';
import { findShortestPath } from '../pathfinding';
import { getAgentLocationId } from '../graphQueries';
import { getGroupLeader, getGroupMembers, isGroupBlessed } from './groupQueries';
import {
  GROUP_LEADER_VOTE_WEIGHT,
  GROUP_FACTION_OBJECTIVE_WEIGHT,
  GROUP_DISSENT_MARGIN,
} from '../../data/group-constants';

const NEUTRAL_PROFILE: AxiologicalProfile = {
  mercy_ruthlessness: 0,
  asceticism_extravagance: 0,
  honesty_cunning: 0,
  tradition_novelty: 0,
  loyalty_ambition: 0,
  revelation_discretion: 0,
  preservation_transformation: 0,
  sacrifice_survival: 0,
  courage_prudence: 0,
};

/**
 * Resolve an agent's position to a node the movement graph can path from.
 *
 * Companies form in taverns, and a tavern is a *sublocation* — it sits inside a
 * settlement and is not part of the location adjacency graph, so pathfinding from
 * it yields nothing and the company would sit in the inn forever. Resolving up
 * through `parentLocationId` is the same move `armySpawning` makes when an army
 * musters from a commander standing in a gatehouse (three-tier position model).
 */
function resolveTravelAnchor(graph: WorldGraph, agentId: string): string | undefined {
  const raw = getAgentLocationId(graph, agentId);
  if (!raw) return undefined;
  const parent = graph.getNode(raw)?.properties?.parentLocationId as string | undefined;
  return parent ?? raw;
}

export interface GroupMoveResult {
  /** True when the company committed to a destination and wrote member queues. */
  moved: boolean;
  destinationId?: string;
  /** Members who disagreed strongly enough to register dissent. */
  dissenters: string[];
}

/**
 * Decide and apply this tick's movement for one company.
 *
 * Returns `moved: false` when the company is already travelling in agreement,
 * has no viable destination, or has no members with a resolvable position.
 * Never throws.
 */
export function runGroupMovement(state: GameState, group: GraphNode): GroupMoveResult {
  const graph = state.graph;
  const members = getGroupMembers(graph, group.id);
  if (members.length === 0) return { moved: false, dissenters: [] };

  const leader = getGroupLeader(graph, group.id);
  const props = group.properties as Record<string, unknown>;
  const groupType = (props.groupType as string) ?? 'party';
  const anchorId = resolveTravelAnchor(graph, leader?.id ?? members[0].id);
  if (!anchorId) return { moved: false, dissenters: [] };

  // Already en route and everyone is on the same heading → keep walking, and only
  // re-snap the stragglers. This is the desync fail-soft: a member whose queue
  // drifted (edge missing, rerouted elsewhere) is put back on the company's path
  // rather than treated as an error.
  const currentDest = props.groupDestinationId as string | undefined;
  if (currentDest && currentDest !== anchorId) {
    const resnapped = resnapMembers(state, members, currentDest);
    return { moved: resnapped > 0, destinationId: currentDest, dissenters: [] };
  }
  if (currentDest === anchorId) {
    // Arrived. Clear the heading so the company is shown as settled rather than
    // still travelling to where it already stands, then fall through and re-decide.
    graph.updateNode(group.id, {
      properties: { ...graph.getNode(group.id)?.properties, groupDestinationId: undefined },
    });
  }

  // Deciding costs a full pathfinding sweep per member (`generateMovementCandidates`
  // paths to every reachable location), so a settled company must not re-decide
  // every tick — that turns the company layer into the most expensive phase in the
  // loop. Gate it on the same cadence individual agents use (NFP #7).
  const lastDecision = props.lastGroupDecisionTick as number | undefined;
  if (lastDecision != null && state.tick - lastDecision < DECISION_REEVALUATION_TICKS) {
    return { moved: false, dissenters: [] };
  }
  graph.updateNode(group.id, {
    properties: { ...graph.getNode(group.id)?.properties, lastGroupDecisionTick: state.tick },
  });

  // Gather each member's own candidate list from the *existing* generator —
  // the group aggregates personal desires, it does not replace them.
  const perMember = new Map<string, MovementCandidate[]>();
  for (const member of members) {
    const locId = resolveTravelAnchor(graph, member.id);
    if (!locId) continue;
    const profile =
      ((member.properties as Record<string, unknown>).axiologicalProfile as AxiologicalProfile | undefined) ??
      NEUTRAL_PROFILE;
    try {
      perMember.set(member.id, generateMovementCandidates(graph, member.id, locId, profile));
    } catch {
      // One member's candidate generation failing must not strand the company.
      perMember.set(member.id, []);
    }
  }

  const chosen = chooseDestination(state, group, groupType, leader?.id, perMember);
  if (!chosen) return { moved: false, dissenters: [] };

  // Dissent: whose personal best clearly beat the company's choice?
  const dissenters: string[] = [];
  if (!isGroupBlessed(group, state.tick)) {
    for (const [memberId, candidates] of perMember) {
      if (candidates.length === 0) continue;
      const own = candidates[0];
      if (own.destinationId === chosen) continue;
      const chosenScore = candidates.find(c => c.destinationId === chosen)?.score ?? 0;
      if (own.score - chosenScore >= GROUP_DISSENT_MARGIN) dissenters.push(memberId);
    }
  }

  const applied = applyGroupDestination(state, members, chosen);
  if (applied === 0) return { moved: false, dissenters };

  graph.updateNode(group.id, {
    properties: { ...graph.getNode(group.id)?.properties, groupDestinationId: chosen },
  });

  return { moved: true, destinationId: chosen, dissenters };
}

/** Aggregate member candidates into one destination per the company's decision mode. */
function chooseDestination(
  state: GameState,
  group: GraphNode,
  groupType: string,
  leaderId: string | undefined,
  perMember: Map<string, MovementCandidate[]>,
): string | undefined {
  if (groupType === 'squad' && leaderId) {
    return perMember.get(leaderId)?.[0]?.destinationId;
  }

  const totals = new Map<string, number>();
  for (const [memberId, candidates] of perMember) {
    const weight = memberId === leaderId ? GROUP_LEADER_VOTE_WEIGHT : 1;
    for (const cand of candidates) {
      totals.set(cand.destinationId, (totals.get(cand.destinationId) ?? 0) + cand.score * weight);
    }
  }

  if (groupType === 'faction_band') {
    const objective = getFactionObjectiveDestination(state, group);
    if (objective) {
      totals.set(objective, (totals.get(objective) ?? 0) + GROUP_FACTION_OBJECTIVE_WEIGHT);
    }
  }

  if (totals.size === 0) return undefined;
  // Sort by score, then id — deterministic given identical scores (NFP #3).
  return [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

/**
 * The destination implied by the company's faction, for `faction_band` mode.
 * Reads the faction's active ambition target; absent one, there is no objective
 * and the company simply scores as a `party`.
 */
function getFactionObjectiveDestination(state: GameState, group: GraphNode): string | undefined {
  const graph = state.graph;
  for (const edge of graph.getOutgoingEdges(group.id, 'member_of')) {
    const faction = graph.getNode(edge.target);
    if ((faction?.properties as Record<string, unknown> | undefined)?.actorType !== 'faction') continue;
    for (const ambEdge of graph.getOutgoingEdges(faction!.id, 'pursues')) {
      const target = (graph.getNode(ambEdge.target)?.properties as Record<string, unknown> | undefined)
        ?.targetLocationId as string | undefined;
      if (target) return target;
    }
  }
  return undefined;
}

/**
 * Write the shared destination into every member's `MovementState`.
 * Returns how many members were successfully routed.
 */
function applyGroupDestination(state: GameState, members: GraphNode[], destinationId: string): number {
  let routed = 0;
  for (const member of members) {
    if (writeMemberRoute(state, member, destinationId)) routed++;
  }
  return routed;
}

/** Re-route only members who are not already heading to the company's destination. */
function resnapMembers(state: GameState, members: GraphNode[], destinationId: string): number {
  let resnapped = 0;
  for (const member of members) {
    const current = (member.properties as Record<string, unknown>).movementState as MovementState | undefined;
    if (current?.destinationId === destinationId && current.movementQueue.length > 0) continue;
    if (writeMemberRoute(state, member, destinationId)) resnapped++;
  }
  return resnapped;
}

/**
 * Path one member to the destination and write their `MovementState`.
 *
 * Uses the same construction `phaseAgentDecision` uses for a fresh route, so
 * `tickMovement` handles road segments and hex traversal identically. Returns
 * false when the member is already there or unreachable (fail-soft, no throw).
 */
function writeMemberRoute(state: GameState, member: GraphNode, destinationId: string): boolean {
  const graph = state.graph;
  const fromId = resolveTravelAnchor(graph, member.id);
  if (!fromId || fromId === destinationId) return false;

  let path: ReturnType<typeof findShortestPath> = null;
  try {
    path = findShortestPath(graph, member.id, fromId, destinationId);
  } catch {
    return false;
  }
  if (!path || path.path.length === 0) return false;

  const previous = (member.properties as Record<string, unknown>).movementState as MovementState | undefined;
  const next: MovementState = {
    destinationId,
    movementQueue: path.path,
    ticksAccumulated: 0,
    currentEdgeCost: 0,
    lastDecisionTick: state.tick,
    movementHistory: previous?.movementHistory ?? [],
    motivationPull: previous?.motivationPull,
    roadSegments: (path.roadSegments ?? []).map(s => ({
      fromId: s.fromId,
      toId: s.toId,
      roadType: s.roadType,
      hexPath: s.hexPath.map(h => ({ col: h.col, row: h.row })),
      discountedCost: s.discountedCost,
    })),
  };

  const current = graph.getNode(member.id);
  graph.updateNode(member.id, {
    properties: { ...(current?.properties ?? member.properties), movementState: next },
  });
  return true;
}

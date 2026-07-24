/**
 * Group (Company) Queries — THR-74
 *
 * Pure read helpers over the company layer. No mutation, no RNG.
 *
 * ## Graph shape
 *
 * A company is an `actor` node with `actorType: 'group'` carrying a `groupType`
 * property. It reuses existing edges only — no new node or edge types:
 *
 * - `member_of`      agent → company   (`role`, `rank`, `joinedTick`, `leftAtTick?`)
 * - `commanded_by`   company → leader agent
 * - `pursues`        company → ambition (shared goal; completion dissolves)
 *
 * ## The company has NO `located_at` edge
 *
 * This is the single most load-bearing decision in the design (plan §Graph, grill
 * Q10). Position is *derived* from the leader via {@link getGroupPosition}. Members'
 * own `located_at` edges remain the sole spatial source of truth, so every existing
 * consumer of agent position keeps working unmodified. Do not add `located_at` to a
 * company node — it would create a second, silently-diverging position authority.
 *
 * ## Armies also use `actorType: 'group'`
 *
 * `armySpawning.ts` creates army nodes with `actorType: 'group'` and an `armyState`
 * property bag. Armies are a *sibling* system, not companies: faction-scale war
 * machinery with an abstract headcount, versus ≤10 uniquely-named agents. Every
 * company lookup here therefore discriminates on `groupType` being present and
 * `armyState` being absent — see {@link isCompanyNode}. Never widen a company query
 * to "all `actorType: 'group'` nodes".
 */

import type { WorldGraph } from '../graph';
import type { GraphNode, GraphEdge } from '../../types/graph';
import { GROUP_COHESION_START_BASE, GROUP_COHESION_BOUND_THRESHOLD, GROUP_FRAY_THRESHOLD, GROUP_DISSOLUTION_THRESHOLD } from '../../data/group-constants';

/** How a company decides where to go. */
export type GroupType = 'party' | 'squad' | 'faction_band';

/** Lifecycle state. Disbanded companies persist as inert historical nodes. */
export type GroupStatus = 'active' | 'disbanded';

/** Why a company ended. */
export type DissolutionReason =
  | 'cohesion_floor'
  | 'goal_complete'
  | 'leader_death'
  | 'betrayal'
  | 'undersize';

/** Player-facing cohesion ladder. UI renders these words, never the number. */
export type CohesionState = 'bound' | 'holding' | 'frayed' | 'breaking';

/**
 * Documented property bag for company nodes.
 * Runtime type is `Record<string, unknown>`; this interface is the contract.
 */
export interface GroupNodeProperties {
  actorType: 'group';
  groupType: GroupType;
  /** 0–1. Read via {@link getGroupCohesion} so a missing/NaN value fails soft. */
  cohesion: number;
  groupStatus: GroupStatus;
  formedAtTick: number;
  /** Formation cause + location — the name generator's input. */
  formationContext: {
    cause: 'systemic' | 'seeking_companions' | 'draw_together';
    locationId: string;
  };
  /** Shared destination while travelling; undefined when the company is settled. */
  groupDestinationId?: string;
  /**
   * Bookkeeping mirror of live membership ids. `member_of` edges remain the
   * authority; this exists only so a member whose node (and therefore whose edge)
   * was hard-deleted is still detectable as a death. See `reconcileLostMembers`.
   */
  roster?: string[];
  disbandedAtTick?: number;
  dissolutionReason?: DissolutionReason;
  /** Ticks below which Bless this Company suppresses dispute/dissent effects. */
  blessedUntilTick?: number;
  /**
   * Last observed cohesion band (bookkeeping, not truth: {@link getCohesionState}
   * of the live cohesion is authoritative). Persisted so `phaseGroups` can fire the
   * fray moment on the *transition* below the fray line rather than every tick the
   * company sits in `frayed`. Seeded silently on first observation.
   */
  lastCohesionState?: CohesionState;
}

/**
 * True when a node is a *company* — as opposed to an army, which shares
 * `actorType: 'group'` but carries `armyState` instead of `groupType`.
 */
export function isCompanyNode(node: GraphNode | undefined): boolean {
  if (!node || node.type !== 'actor') return false;
  const props = node.properties as Record<string, unknown>;
  if (props.actorType !== 'group') return false;
  if (props.armyState != null) return false; // army, not a company
  return typeof props.groupType === 'string';
}

/** All company nodes in the graph, active and disbanded. */
export function getAllGroups(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('actor').filter(isCompanyNode);
}

/** Active companies only — the working set for the tick phase. */
export function getActiveGroups(graph: WorldGraph): GraphNode[] {
  return getAllGroups(graph).filter(
    n => (n.properties as Record<string, unknown>).groupStatus !== 'disbanded',
  );
}

/**
 * Live `member_of` edges pointing at a company (i.e. members who have not left).
 * A member who left keeps their edge with `leftAtTick` set — that is the historical
 * record prose reads from, and it must never count as current membership.
 */
export function getGroupMemberEdges(graph: WorldGraph, groupId: string): GraphEdge[] {
  return graph
    .getIncomingEdges(groupId, 'member_of')
    .filter(e => e.properties?.leftAtTick == null);
}

/** Current members of a company, in join order. */
export function getGroupMembers(graph: WorldGraph, groupId: string): GraphNode[] {
  return getGroupMemberEdges(graph, groupId)
    .sort(
      (a, b) =>
        ((a.properties?.joinedTick as number) ?? 0) -
        ((b.properties?.joinedTick as number) ?? 0),
    )
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

/**
 * The company an agent currently belongs to, or undefined.
 *
 * An agent may hold several `member_of` edges (factions, cultures, a company);
 * this picks the one whose target is a company node.
 */
export function getGroupOf(graph: WorldGraph, agentId: string): GraphNode | undefined {
  for (const edge of graph.getOutgoingEdges(agentId, 'member_of')) {
    if (edge.properties?.leftAtTick != null) continue;
    const target = graph.getNode(edge.target);
    if (isCompanyNode(target) && (target!.properties as Record<string, unknown>).groupStatus !== 'disbanded') {
      return target;
    }
  }
  return undefined;
}

/** Convenience predicate: is this agent currently in a company? */
export function isGrouped(graph: WorldGraph, agentId: string): boolean {
  return getGroupOf(graph, agentId) !== undefined;
}

/**
 * Living-member count of the company an agent currently belongs to, or 0 when
 * the agent is in no active company.
 *
 * This is the gate for **group-exclusive content** (THR-74): templates authored
 * with `actorAffinities: ['group']` are unreachable through the ordinary
 * decision path — a grouped agent is still `actorType: 'individual'`, so a
 * `['group']`-only affinity never matches their own type. `generateUnifiedCandidates`
 * lets a grouped individual draw such a template only when this count meets the
 * template's `minGroupMembers`. A positionless company node never self-initiates;
 * its members do, on its behalf.
 *
 * "Living" excludes members retained only as a deceased mythic echo
 * ({@link isAgentGone}), mirroring how {@link getGroupMembers} feeds resolution's
 * best-member pick — a party of two whose second member just died can no longer
 * attempt what needed two hands.
 */
export function livingGroupMemberCount(graph: WorldGraph, agentId: string): number {
  const group = getGroupOf(graph, agentId);
  if (!group) return 0;
  return getGroupMembers(graph, group.id).filter(m => !isAgentGone(m)).length;
}

/** The company's leader agent (via `commanded_by`), or undefined if missing/dead. */
export function getGroupLeader(graph: WorldGraph, groupId: string): GraphNode | undefined {
  const edge = graph.getOutgoingEdges(groupId, 'commanded_by')[0];
  if (!edge) return undefined;
  return graph.getNode(edge.target);
}

/**
 * The company's position — derived from the leader, never stored.
 *
 * Returns the leader's `located_at` target id (which may be a sublocation; callers
 * that need hex granularity resolve upward through `parentLocationId` exactly as
 * they do for any agent). Falls back to the first member with a position so a
 * leaderless-but-not-yet-dissolved company still renders (fail-soft).
 */
export function getGroupPosition(graph: WorldGraph, groupId: string): string | undefined {
  const leader = getGroupLeader(graph, groupId);
  if (leader) {
    const locId = graph.getOutgoingEdges(leader.id, 'located_at')[0]?.target;
    if (locId) return locId;
  }
  for (const member of getGroupMembers(graph, groupId)) {
    const locId = graph.getOutgoingEdges(member.id, 'located_at')[0]?.target;
    if (locId) return locId;
  }
  return undefined;
}

/**
 * Cohesion for a company, fail-soft.
 * A missing or NaN value reads as {@link GROUP_COHESION_START_BASE} rather than
 * poisoning every downstream comparison with NaN.
 */
export function getGroupCohesion(node: GraphNode | undefined): number {
  const raw = (node?.properties as Record<string, unknown> | undefined)?.cohesion;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return GROUP_COHESION_START_BASE;
  return raw;
}

/**
 * Map a cohesion number onto the player-facing prose ladder.
 * UI must render this word (woven into a sentence), never the underlying number.
 */
export function getCohesionState(cohesion: number): CohesionState {
  if (cohesion >= GROUP_COHESION_BOUND_THRESHOLD) return 'bound';
  if (cohesion >= GROUP_FRAY_THRESHOLD) return 'holding';
  if (cohesion >= GROUP_DISSOLUTION_THRESHOLD) return 'frayed';
  return 'breaking';
}

/**
 * True when the ascendant threads at least one live member (or the leader) of a
 * company — i.e. the company is "yours" in the player's eyes.
 *
 * This is the gate for **The Parting** (THR-74): a threaded company's dissolution
 * is told as an authored moment, an untethered one's end stays a silent systemic
 * line. Must be read *before* dissolution closes the `member_of` edges, since it
 * relies on live membership. Fail-soft: no ascendant → not threaded.
 */
export function isGroupThreaded(
  graph: WorldGraph,
  groupId: string,
  ascendantId: string | undefined,
): boolean {
  if (!ascendantId) return false;
  const candidates = getGroupMembers(graph, groupId).map(m => m.id);
  const leader = getGroupLeader(graph, groupId);
  if (leader) candidates.push(leader.id);
  for (const id of candidates) {
    if (graph.getIncomingEdges(id, 'thread').some(e => e.source === ascendantId)) return true;
  }
  return false;
}

/** True while a Bless this Company suppression window is open. */
export function isGroupBlessed(node: GraphNode | undefined, tick: number): boolean {
  const until = (node?.properties as Record<string, unknown> | undefined)?.blessedUntilTick;
  return typeof until === 'number' && tick < until;
}

/**
 * Whether an agent may be considered for company formation.
 *
 * Excludes: non-individuals, non-spotlight tiers (ambient/notable NPCs don't run
 * autonomous decision loops), the dead, and agents already in a company.
 */
export function isGroupEligibleAgent(graph: WorldGraph, node: GraphNode): boolean {
  const props = node.properties as Record<string, unknown>;
  if (props.actorType !== 'individual') return false;
  if ((props.spotlightTier ?? 'spotlight') !== 'spotlight') return false;
  if (isAgentGone(node)) return false;
  if (isGrouped(graph, node.id)) return false;
  return true;
}

/**
 * True when an agent node can no longer act — dead, or retained only as a
 * deceased mythic echo (THR-479 keeps those nodes in the graph forever).
 * Death usually removes the node outright, so callers must also treat a
 * missing node as gone.
 */
export function isAgentGone(node: GraphNode | undefined): boolean {
  if (!node) return true;
  const props = node.properties as Record<string, unknown>;
  return props.deceased === true || props.status === 'dead';
}

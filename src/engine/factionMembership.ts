/**
 * Faction Membership — move **one person** in, out, or up a faction.
 *
 * THR-1144. The bulk faction verbs (`faction_splinter` / `faction_absorb` /
 * `faction_dissolve`) already migrate members wholesale, and
 * `processFactionJoinOutcome` admits an agent who completed a *join encounter* —
 * but nothing could move a single person as the authored consequence of an
 * arbitrary encounter. This module is that write path, extracted so the
 * aftermath dispatcher and any future caller share one implementation rather
 * than growing a third inline copy of the `member_of` edge shape.
 *
 * The edge shape written here is deliberately identical to
 * `processFactionJoinOutcome`'s, so a card-made member is byte-identical to a
 * quest-made one and every existing reader (`graphQueries`, `socialLeverage`,
 * `agentDetail`, `factionReputation`) sees no difference.
 *
 * NFP #4 (fail-soft) is the governing priority: every function here returns a
 * typed outcome and never throws. NFP #2 (inspectability): each returns enough
 * detail for the caller to emit one trace naming what actually happened.
 */

import type { WorldGraph } from './graph';
import { getFactionMembershipEdges } from './graphQueries';
import type { GraphNode } from '../types/graph';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { resolveToParentLocation } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { computeRankFromReputation } from '../types/faction';
import {
  FACTION_DEFINITIONS,
  FACTION_JOIN_STARTING_REPUTATION,
} from '../data/faction-definitions';
import { FACTION_RANK_MAX } from '../data/agent-behavior-constants';

/** Why a membership write did nothing. `null` outcome reason means it succeeded. */
export type MembershipFailReason =
  | 'agent_not_found'
  | 'faction_not_found'
  | 'already_member'
  | 'not_a_member'
  | 'no_rank_delta';

export interface MembershipChangeResult {
  readonly changed: boolean;
  readonly reason: MembershipFailReason | null;
  /**
   * The faction **node** id the authored `factionId` resolved to. Callers must use
   * this — not the authored value — for name lookups and traces, or a definition
   * id leaks into player-facing prose as a raw slug.
   */
  readonly factionNodeId?: string;
  /** Rank before the write (`rank_delta` only). */
  readonly oldRank?: number;
  /** Rank after clamping (`rank_delta` only). */
  readonly newRank?: number;
  /** Role string on the edge after the write, when one was written. */
  readonly role?: string;
}

/**
 * Is this node a faction? Accepts both the canonical `faction` node type and the
 * `actor` + `actorType: 'faction'` representation the world seed writes — the
 * same widening `nodeMatchesSceneField` applies, for the same reason.
 */
function isFactionNode(graph: WorldGraph, factionId: string): boolean {
  const node = graph.getNode(factionId);
  if (!node) return false;
  const nodeType = node.type as string;
  return nodeType === 'faction'
    || (nodeType === 'actor' && node.properties?.actorType === 'faction');
}

/**
 * Resolve an authored `factionId` to a real faction **node** id.
 *
 * Authors write the *definition* id (`'mercenary_company'`), because that is what
 * reads naturally and what every faction content file already contains. The graph
 * keys faction nodes as `faction_def_<definitionId><chapterSuffix>` (see
 * `factionSeeding`), so a definition id never resolves as a node id on its own.
 * Accepting only the node id would make this primitive unusable from the content
 * that most wants it.
 *
 * Order: exact node id first (so an explicit node id always wins and nothing
 * existing changes meaning), then a `factionDefId` scan.
 *
 * **Chapters share a `factionDefId`**, so the scan can match several nodes, and the
 * order the preferences are tried in is the whole substance of this function:
 *
 * 1. **A chapter the agent already belongs to.** A promotion or expulsion is about
 *    the branch they are actually in, so an existing `member_of` beats every other
 *    signal — including locality, since a travelling member expelled while abroad is
 *    expelled from their own chapter, not the local one.
 * 2. **The chapter local to where the agent is standing** (THR-1275). Below the
 *    membership preference and above the sort, because a `join` has no membership to
 *    read by definition — which is exactly the case the old code fell straight
 *    through to the sort on. "The settlement takes them in" then enrolled the agent
 *    in whichever chapter happened to sort first, potentially on the far side of the
 *    map. See {@link localChapterNodeId} for what "local" means.
 * 3. **The lowest id**, so the pick is deterministic across runs (NFP #3) rather than
 *    graph-insertion-ordered.
 *
 * Widening only: a single-chapter world (the overwhelmingly common case) returns at
 * the `length === 1` short-circuit and never reaches any of this.
 */
export function resolveFactionNodeId(
  graph: WorldGraph,
  factionIdOrDefId: string,
  agentId?: string,
): string | null {
  if (isFactionNode(graph, factionIdOrDefId)) return factionIdOrDefId;

  const candidates = graph.getNodesByType('actor')
    .filter(n => n.properties?.actorType === 'faction'
      && n.properties?.factionDefId === factionIdOrDefId)
    .map(n => n.id);

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (agentId) {
    const existing = getFactionMembershipEdges(graph, agentId)
      .map(e => e.target)
      .find(t => candidates.includes(t));
    if (existing) return existing;

    const local = localChapterNodeId(graph, candidates, agentId);
    if (local) return local;
  }
  return [...candidates].sort()[0];
}

/**
 * Read a place-tier node's hex, when it has one.
 *
 * Returns `undefined` rather than a `{0, 0}` default: a location with no hex is
 * unplaced, and defaulting it to the map origin would make it look *near* every
 * agent in the north-west corner instead of unrankable (the bug that a `?? 0` here
 * would introduce silently).
 */
function hexOf(node: GraphNode | undefined): { col: number; row: number } | undefined {
  const col = node?.properties?.hexCol;
  const row = node?.properties?.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return undefined;
  return { col, row };
}

/** The place-tier location the agent is standing on, resolving up from a sublocation. */
function agentPlaceLocation(graph: WorldGraph, agentId: string): GraphNode | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  if (edges.length === 0) return undefined;
  // An agent holds exactly one `located_at` (the three-tier position model), so the
  // first edge is the position rather than one of several.
  return resolveToParentLocation(graph, graph.getNode(edges[0].target));
}

/** Every place a faction chapter physically sits — its guild halls plus its home base. */
function chapterSeatIds(graph: WorldGraph, factionNodeId: string): readonly string[] {
  const seats = graph.getOutgoingEdges(factionNodeId, 'located_at').map(e => e.target);
  const home = graph.getNode(factionNodeId)?.properties?.homeLocationId;
  if (typeof home === 'string' && home.length > 0 && !seats.includes(home)) seats.push(home);
  return seats;
}

/**
 * The chapter nearest to where `agentId` is standing, or `null` when locality cannot
 * rank them.
 *
 * "Local" is answered in two steps, because the two are not the same question. A
 * chapter with a **guild hall on the agent's own location** is unambiguously the one
 * that "takes them in" — that is the door they walked through — so it wins outright
 * and no arithmetic is involved. Only when no chapter is present does hex distance
 * decide, measured from the agent's hex to the nearest seat of each chapter.
 *
 * Returns `null` rather than guessing whenever the ranking would be arbitrary: the
 * agent is unplaced, their location has no hex, or no candidate has a placeable seat.
 * The caller then falls through to the deterministic sort, which is the honest answer
 * — a bad locality guess is worse than an admitted arbitrary pick, because it reads
 * as intentional (NFP #4 fail-soft, NFP #2 inspectability).
 *
 * Ties are broken by node id sort, so two equidistant chapters resolve identically on
 * every run from the same seed (NFP #3).
 */
function localChapterNodeId(
  graph: WorldGraph,
  candidates: readonly string[],
  agentId: string,
): string | null {
  const here = agentPlaceLocation(graph, agentId);
  if (!here) return null;

  const present = candidates
    .filter(id => chapterSeatIds(graph, id).includes(here.id))
    .sort();
  if (present.length > 0) return present[0];

  const from = hexOf(here);
  if (!from) return null;

  let best: { id: string; distance: number } | null = null;
  for (const id of [...candidates].sort()) {
    let nearest: number | null = null;
    for (const seatId of chapterSeatIds(graph, id)) {
      const to = hexOf(graph.getNode(seatId));
      if (!to) continue;
      const d = hexDistance(from, to);
      if (nearest === null || d < nearest) nearest = d;
    }
    if (nearest === null) continue;
    // Strictly `<` over an id-sorted walk, so the first of two equidistant chapters
    // wins and the tie-break is the sort rather than iteration order.
    if (best === null || nearest < best.distance) best = { id, distance: nearest };
  }
  return best?.id ?? null;
}

/** The agent's `member_of` edge into this specific faction, if any. */
export function findMembershipEdge(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
) {
  return getFactionMembershipEdges(graph, agentId)
    .find(e => e.target === factionId);
}

/**
 * Resolve the role name for a starting membership. Factions carrying a
 * `FactionDefinition` name their own lowest tier; anything else (an ad-hoc
 * world-seeded faction, a monster warband) gets the generic `member`.
 */
function startingRole(graph: WorldGraph, factionId: string): string {
  const defId = graph.getNode(factionId)?.properties?.factionDefId as string | undefined;
  if (!defId) return 'member';
  const definition = FACTION_DEFINITIONS.get(defId);
  if (!definition) return 'member';
  try {
    return computeRankFromReputation(FACTION_JOIN_STARTING_REPUTATION, definition).id;
  } catch {
    // `computeRankFromReputation` throws on a definition with no rank tiers.
    // A malformed definition must not take the tick down (NFP #4).
    return 'member';
  }
}

/**
 * Admit `agentId` to `factionId`.
 *
 * Idempotent by contract: an existing member is left exactly as they are and
 * reported as `already_member`. This matters because an encounter can be
 * replayed and because two endings can both offer the same guild.
 */
export function joinFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  tick: number,
): MembershipChangeResult {
  if (!graph.getNode(agentId)) return { changed: false, reason: 'agent_not_found' };
  const nodeId = resolveFactionNodeId(graph, factionId, agentId);
  if (!nodeId) return { changed: false, reason: 'faction_not_found' };

  // THR-1177 note: no target guard is added here, deliberately. The audit called the
  // membership helper unguarded, but `resolveFactionNodeId` above already refuses
  // anything that is not faction-shaped — it returns null for an individual, so an
  // individual→individual `member_of` cannot be minted through this path. A guard on
  // `properties.actorType` was written here first and had to be removed: it rejected
  // the bare `type: 'faction'` node shape that `resolveFactionNodeId` deliberately
  // tolerates (several shipped fixtures and the codex build factions that way), so it
  // broke a documented tolerance while adding nothing. The producers the audit meant
  // are the eleven that write `member_of` directly rather than through this helper;
  // the reader-side fix in `getHighestFactionRank` is what covers those.
  if (findMembershipEdge(graph, agentId, nodeId)) {
    return { changed: false, reason: 'already_member' };
  }

  const role = startingRole(graph, nodeId);
  const defId = graph.getNode(nodeId)?.properties?.factionDefId as string | undefined;

  graph.addEdge({
    // Same id shape `processFactionJoinOutcome` uses, so the two paths cannot
    // produce two edges for one membership.
    id: `member_${agentId}_${nodeId}`,
    source: agentId,
    target: nodeId,
    type: 'member_of',
    // `satisfies` rather than an annotation: `GraphEdge.properties` is a
    // `Record<string, unknown>`, which a plain interface is not assignable to,
    // so this is how `processFactionJoinOutcome` states the same contract.
    properties: {
      role,
      rank: 0,
      joinedTick: tick,
      reputation: FACTION_JOIN_STARTING_REPUTATION,
      ...(defId ? { factionDefId: defId } : {}),
      lastFactionActivityTick: tick,
    } satisfies MemberOfEdgeProperties,
  });

  return { changed: true, reason: null, factionNodeId: nodeId, role, oldRank: undefined, newRank: 0 };
}

/**
 * Remove `agentId` from `factionId`. A non-member no-ops rather than erroring —
 * an expulsion aimed at someone who already walked is not a failure worth
 * stopping the tick for.
 */
export function leaveFaction(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
): MembershipChangeResult {
  if (!graph.getNode(agentId)) return { changed: false, reason: 'agent_not_found' };
  const nodeId = resolveFactionNodeId(graph, factionId, agentId);
  if (!nodeId) return { changed: false, reason: 'faction_not_found' };

  const edge = findMembershipEdge(graph, agentId, nodeId);
  if (!edge) return { changed: false, reason: 'not_a_member' };

  const oldRank = typeof edge.properties?.rank === 'number' ? edge.properties.rank as number : 0;
  graph.removeEdge(edge.id);
  return { changed: true, reason: null, factionNodeId: nodeId, oldRank, newRank: undefined };
}

/**
 * Move an existing member's rank by `delta`, clamped to `[0, FACTION_RANK_MAX]`.
 *
 * The scale is the one `MemberOfEdgeProperties.rank` declares — 0 (recruit) to 1
 * (leader) — and is the same scale the revived `faction_rank:` predicate reads,
 * which is the whole point: a rank nobody can gate on is a number, not a rank
 * (UI Law 56).
 *
 * A non-member no-ops: rank is a property *of* a membership, so there is nowhere
 * to write it. A promotion for an outsider should be authored as a `join`.
 */
export function adjustMemberRank(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  delta: number,
): MembershipChangeResult {
  if (!graph.getNode(agentId)) return { changed: false, reason: 'agent_not_found' };
  const nodeId = resolveFactionNodeId(graph, factionId, agentId);
  if (!nodeId) return { changed: false, reason: 'faction_not_found' };
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return { changed: false, reason: 'no_rank_delta' };
  }

  const edge = findMembershipEdge(graph, agentId, nodeId);
  if (!edge) return { changed: false, reason: 'not_a_member' };

  // A string rank ('war_chief' on army edges) is off this scale — treat it as 0
  // rather than producing NaN, matching how the predicate reader coerces it.
  const rawRank = edge.properties?.rank;
  const oldRank = typeof rawRank === 'number' && Number.isFinite(rawRank) ? rawRank : 0;
  const newRank = Math.max(0, Math.min(FACTION_RANK_MAX, oldRank + delta));

  graph.updateEdge(edge.id, {
    properties: { ...edge.properties, rank: newRank },
  });

  return {
    changed: true,
    reason: null,
    factionNodeId: nodeId,
    oldRank,
    newRank,
    role: edge.properties?.role as string | undefined,
  };
}

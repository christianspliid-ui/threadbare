/**
 * Canonical Graph Query Functions
 *
 * Every common graph relationship query should use these functions
 * instead of raw getIncomingEdges/getOutgoingEdges calls. This ensures
 * edge type strings and directions are specified in exactly one place.
 *
 * If you need a query pattern that doesn't exist here, add it — don't
 * inline the edge type string in your module.
 */

import type { WorldGraph } from './graph';
import type { GraphNode, GraphEdge } from '../types/graph';

// ─── Location ────────────────────────────────────────────────────

/** Get all individual agents at a location (via incoming located_at edges).
 *  Pass `spotlightTier` to restrict results to a specific tier.
 *  Missing `spotlightTier` on a node defaults to 'spotlight' for backward compat. */
export function getAgentsAtLocation(
  graph: WorldGraph,
  locationId: string,
  spotlightTier?: 'ambient' | 'notable' | 'spotlight',
): GraphNode[] {
  return graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => {
      if (!n || n.properties.actorType !== 'individual') return false;
      if (spotlightTier === undefined) return true;
      const tier = (n.properties.spotlightTier as string) ?? 'spotlight';
      return tier === spotlightTier;
    });
}

/** Get all actors at a location, including non-individuals (factions, groups, etc.) */
export function getAllActorsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  return graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null && n.type === 'actor');
}

/** Get the location node an agent is at */
export function getAgentLocation(graph: WorldGraph, agentId: string): GraphNode | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  return edges.length > 0 ? graph.getNode(edges[0].target) : undefined;
}

/** Get the location ID an agent is at (avoids full node lookup) */
export function getAgentLocationId(graph: WorldGraph, agentId: string): string | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  return edges.length > 0 ? edges[0].target : undefined;
}

/** Get sub-locations contained within a location */
export function getSublocationsAt(graph: WorldGraph, locationId: string): GraphNode[] {
  return graph.getOutgoingEdges(locationId, 'contains')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null && n.type === 'location');
}

/** Get all locations contained within a region */
export function getLocationsInRegion(graph: WorldGraph, regionId: string): GraphNode[] {
  return graph.getOutgoingEdges(regionId, 'contains')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null && n.type === 'location');
}

// ─── Social ──────────────────────────────────────────────────────

/** Get all members of a faction/group */
export function getFactionMembers(graph: WorldGraph, factionId: string): GraphNode[] {
  return graph.getIncomingEdges(factionId, 'member_of')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

/** Get the faction an agent belongs to (first match) */
export function getAgentFaction(
  graph: WorldGraph,
  agentId: string,
): { faction: GraphNode; rank: number; role: string } | undefined {
  const edges = [...graph.getOutgoingEdges(agentId, 'member_of')].sort((a, b) => {
    const aFaction = graph.getNode(a.target);
    const bFaction = graph.getNode(b.target);
    const aDef = (a.properties.factionDefId as string | undefined) != null;
    const bDef = (b.properties.factionDefId as string | undefined) != null;
    if (aDef !== bDef) return aDef ? -1 : 1;

    const aFactionDef = (aFaction?.properties.factionDefId as string | undefined) != null;
    const bFactionDef = (bFaction?.properties.factionDefId as string | undefined) != null;
    if (aFactionDef !== bFactionDef) return aFactionDef ? -1 : 1;

    const aRep = (a.properties.reputation as number | undefined) ?? 0;
    const bRep = (b.properties.reputation as number | undefined) ?? 0;
    if (aRep !== bRep) return bRep - aRep;

    const aRank = (a.properties.rank as number | undefined) ?? 0;
    const bRank = (b.properties.rank as number | undefined) ?? 0;
    return bRank - aRank;
  });
  if (edges.length === 0) return undefined;
  const edge = edges[0];
  const faction = graph.getNode(edge.target);
  if (!faction) return undefined;
  return {
    faction,
    rank: (edge.properties.rank as number) ?? 0,
    role: (edge.properties.role as string) ?? 'member',
  };
}

/** Get all faction/group memberships for an agent */
export function getAgentMemberships(
  graph: WorldGraph,
  agentId: string,
): Array<{ group: GraphNode; edge: GraphEdge }> {
  return graph.getOutgoingEdges(agentId, 'member_of')
    .map(e => ({ group: graph.getNode(e.target), edge: e }))
    .filter((m): m is { group: GraphNode; edge: GraphEdge } => m.group != null);
}

/** Get the culture(s) an actor belongs to */
export function getActorCultures(
  graph: WorldGraph,
  actorId: string,
): Array<{ culture: GraphNode; strength: number }> {
  return graph.getOutgoingEdges(actorId, 'belongs_to')
    .map(e => ({
      culture: graph.getNode(e.target),
      strength: (e.properties.culturalStrength as number) ?? 1.0,
    }))
    .filter((c): c is { culture: GraphNode; strength: number } => c.culture != null);
}

/** Get all actors belonging to a culture */
export function getCultureMembers(graph: WorldGraph, cultureId: string): GraphNode[] {
  return graph.getIncomingEdges(cultureId, 'belongs_to')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

/** Get relationship bonds for an agent (outgoing relates_to edges) */
export function getAgentBonds(
  graph: WorldGraph,
  agentId: string,
): Array<{ agent: GraphNode; edge: GraphEdge; sentiment: number; trust: number }> {
  return graph.getOutgoingEdges(agentId, 'relates_to')
    .map(e => ({
      agent: graph.getNode(e.target),
      edge: e,
      sentiment: (e.properties.sentiment as number) ?? 0,
      trust: (e.properties.trust as number) ?? 0,
    }))
    .filter((b): b is { agent: GraphNode; edge: GraphEdge; sentiment: number; trust: number } => b.agent != null);
}

/** Get incoming relationship bonds (other agents relating to this one) */
export function getIncomingBonds(
  graph: WorldGraph,
  agentId: string,
): Array<{ agent: GraphNode; edge: GraphEdge; sentiment: number; trust: number }> {
  return graph.getIncomingEdges(agentId, 'relates_to')
    .map(e => ({
      agent: graph.getNode(e.source),
      edge: e,
      sentiment: (e.properties.sentiment as number) ?? 0,
      trust: (e.properties.trust as number) ?? 0,
    }))
    .filter((b): b is { agent: GraphNode; edge: GraphEdge; sentiment: number; trust: number } => b.agent != null);
}

// ─── Mentorship (THR-75) ─────────────────────────────────────────

export type MentorshipRole = 'mentor' | 'apprentice';

export interface MentorshipSummary {
  /** Whether this agent is the mentor or the apprentice in the relationship */
  role: MentorshipRole;
  /** The other party's node id */
  otherId: string;
  /** The other party's display name (or '(unknown)' if missing) */
  otherName: string;
  /** Which Reach is being taught */
  domain: string;
  /** Training completion 0–1 */
  progress: number;
  /** Lifecycle state */
  phase: 'offered' | 'training' | 'graduated' | 'estranged';
  /** Narrative bond health −1..+1 */
  bondQuality: number;
  /** Number of lesson milestones reached */
  lessonsCompleted: number;
}

/**
 * Get all `mentors` edges touching this agent, in both directions.
 * Returns summaries that name the agent's role (mentor / apprentice) and the
 * other party. Includes historical (`graduated` / `estranged`) edges — callers
 * can filter by `phase` if they only want active ones.
 *
 * Distinct from `getAgentBonds`, which reads only `relates_to` edges.
 */
export function getMentorships(
  graph: WorldGraph,
  agentId: string,
): MentorshipSummary[] {
  const summaries: MentorshipSummary[] = [];

  // As mentor (outgoing)
  for (const edge of graph.getOutgoingEdges(agentId, 'mentors')) {
    const other = graph.getNode(edge.target);
    summaries.push({
      role: 'mentor',
      otherId: edge.target,
      otherName: other?.name ?? '(unknown)',
      domain: (edge.properties.domain as string) ?? 'heart',
      progress: (edge.properties.progress as number) ?? 0,
      phase: ((edge.properties.phase as MentorshipSummary['phase']) ?? 'offered'),
      bondQuality: (edge.properties.bondQuality as number) ?? 0,
      lessonsCompleted: (edge.properties.lessonsCompleted as number) ?? 0,
    });
  }

  // As apprentice (incoming)
  for (const edge of graph.getIncomingEdges(agentId, 'mentors')) {
    const other = graph.getNode(edge.source);
    summaries.push({
      role: 'apprentice',
      otherId: edge.source,
      otherName: other?.name ?? '(unknown)',
      domain: (edge.properties.domain as string) ?? 'heart',
      progress: (edge.properties.progress as number) ?? 0,
      phase: ((edge.properties.phase as MentorshipSummary['phase']) ?? 'offered'),
      bondQuality: (edge.properties.bondQuality as number) ?? 0,
      lessonsCompleted: (edge.properties.lessonsCompleted as number) ?? 0,
    });
  }

  return summaries;
}

// ─── Traits ──────────────────────────────────────────────────────

/** Get all traits on an actor */
export function getActorTraits(
  graph: WorldGraph,
  actorId: string,
): Array<{ trait: GraphNode; edge: GraphEdge; level: number }> {
  return graph.getOutgoingEdges(actorId, 'has_trait')
    .map(e => ({
      trait: graph.getNode(e.target),
      edge: e,
      level: (e.properties.level as number) ?? 1,
    }))
    .filter((t): t is { trait: GraphNode; edge: GraphEdge; level: number } => t.trait != null);
}

// ─── Ambition ────────────────────────────────────────────────────

/** Get ambitions an agent is pursuing */
export function getAgentAmbitions(
  graph: WorldGraph,
  agentId: string,
): Array<{ ambition: GraphNode; edge: GraphEdge; priority: number; status: string }> {
  return graph.getOutgoingEdges(agentId, 'pursues')
    .map(e => ({
      ambition: graph.getNode(e.target),
      edge: e,
      priority: (e.properties.priority as number) ?? 0,
      status: (e.properties.status as string) ?? 'active',
    }))
    .filter((a): a is { ambition: GraphNode; edge: GraphEdge; priority: number; status: string } => a.ambition != null);
}

// ─── Cosmology / Divine ──────────────────────────────────────────

/** Get the thread edge from an ascendant to this agent (if any) */
export function getThreadTo(graph: WorldGraph, agentId: string): GraphEdge | undefined {
  const edges = graph.getIncomingEdges(agentId, 'thread');
  return edges.length > 0 ? edges[0] : undefined;
}

/** Get the ascendant that has a thread to this agent */
export function getThreadAscendant(graph: WorldGraph, agentId: string): GraphNode | undefined {
  const edge = getThreadTo(graph, agentId);
  return edge ? graph.getNode(edge.source) : undefined;
}

/** Get all thread edges from an ascendant to their mortals */
export function getThreadsFrom(graph: WorldGraph, ascendantId: string): GraphEdge[] {
  return graph.getOutgoingEdges(ascendantId, 'thread');
}

/** Get all threaded mortal nodes for an ascendant */
export function getThreadedAgents(graph: WorldGraph, ascendantId: string): GraphNode[] {
  return graph.getOutgoingEdges(ascendantId, 'thread')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null);
}

/** @deprecated Use getThreadAscendant instead */
export function getAgentWorships(graph: WorldGraph, agentId: string): GraphNode | undefined {
  return getThreadAscendant(graph, agentId);
}

/** @deprecated Use getThreadedAgents instead */
export function getWorshippers(graph: WorldGraph, deityId: string): GraphNode[] {
  return getThreadedAgents(graph, deityId);
}

/** Get all avatars of an ascendant */
export function getAvatarsOf(graph: WorldGraph, ascendantId: string): GraphNode[] {
  return graph.getIncomingEdges(ascendantId, 'avatar_of')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

/** Get the ascendant an avatar belongs to */
export function getAvatarAscendant(graph: WorldGraph, avatarId: string): GraphNode | undefined {
  const edges = graph.getOutgoingEdges(avatarId, 'avatar_of');
  return edges.length > 0 ? graph.getNode(edges[0].target) : undefined;
}

// ─── Possession ──────────────────────────────────────────────────

/** Get artifacts an agent possesses (common artifacts) */
export function getAgentArtifacts(graph: WorldGraph, agentId: string): GraphNode[] {
  return graph.getOutgoingEdges(agentId, 'possesses')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null);
}

/** Get legendary artifacts an agent is bonded to */
export function getAgentLegendaryArtifacts(graph: WorldGraph, agentId: string): GraphNode[] {
  return graph.getOutgoingEdges(agentId, 'bonded_to')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null);
}

// ─── Infrastructure ──────────────────────────────────────────────

/** Get road edges from a location (outgoing) */
export function getRoadsFrom(graph: WorldGraph, locationId: string): GraphEdge[] {
  return graph.getOutgoingEdges(locationId, 'road');
}

/** Get road edges to a location (incoming) */
export function getRoadsTo(graph: WorldGraph, locationId: string): GraphEdge[] {
  return graph.getIncomingEdges(locationId, 'road');
}

/** Get all road edges connected to a location (both directions) */
export function getAllRoads(graph: WorldGraph, locationId: string): GraphEdge[] {
  return [
    ...graph.getOutgoingEdges(locationId, 'road'),
    ...graph.getIncomingEdges(locationId, 'road'),
  ];
}

// ─── Adjacency ───────────────────────────────────────────────────

/** Get adjacent location IDs (bidirectional — checks both outgoing and incoming) */
export function getAdjacentLocationIds(graph: WorldGraph, locationId: string): string[] {
  const ids = new Set<string>();
  for (const e of graph.getOutgoingEdges(locationId, 'adjacent')) {
    ids.add(e.target);
  }
  for (const e of graph.getIncomingEdges(locationId, 'adjacent')) {
    ids.add(e.source);
  }
  return [...ids];
}

// ─── Economic ────────────────────────────────────────────────────

/** Get trade routes for an actor */
export function getTradeRoutes(
  graph: WorldGraph,
  actorId: string,
): Array<{ partner: GraphNode; edge: GraphEdge }> {
  const routes: Array<{ partner: GraphNode; edge: GraphEdge }> = [];
  for (const e of graph.getOutgoingEdges(actorId, 'trades_with')) {
    const partner = graph.getNode(e.target);
    if (partner) routes.push({ partner, edge: e });
  }
  for (const e of graph.getIncomingEdges(actorId, 'trades_with')) {
    const partner = graph.getNode(e.source);
    if (partner) routes.push({ partner, edge: e });
  }
  return routes;
}

// ─── Action ──────────────────────────────────────────────────────

/** Get the action an agent is currently performing */
export function getAgentCurrentAction(graph: WorldGraph, agentId: string): GraphEdge | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'performing');
  return edges.length > 0 ? edges[0] : undefined;
}

// ─── Control ─────────────────────────────────────────────────────

/** Get resources/locations controlled by an actor */
export function getControlledBy(graph: WorldGraph, actorId: string): GraphNode[] {
  return graph.getOutgoingEdges(actorId, 'controls')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n != null);
}

/** Get actors that control a given resource/location */
export function getControllers(graph: WorldGraph, targetId: string): GraphNode[] {
  return graph.getIncomingEdges(targetId, 'controls')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

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

/** Get all individual agents at a location (via incoming located_at edges) */
export function getAgentsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  return graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null && n.properties.actorType === 'individual');
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
  const edges = graph.getOutgoingEdges(agentId, 'member_of');
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

/** Get the god/ascendant an agent worships */
export function getAgentWorships(graph: WorldGraph, agentId: string): GraphNode | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'worships');
  return edges.length > 0 ? graph.getNode(edges[0].target) : undefined;
}

/** Get all worshippers of a god/ascendant */
export function getWorshippers(graph: WorldGraph, deityId: string): GraphNode[] {
  return graph.getIncomingEdges(deityId, 'worships')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
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

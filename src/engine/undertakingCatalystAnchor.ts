/**
 * Undertaking catalyst anchor — where a completed work's wake is offered (THR-1511).
 *
 * A cell completes wherever its actor stands, and every catalyst family a cell stirs
 * (`UNDERTAKING_CELL_CATALYSTS`) is gated to settlements. Judged at the actor's feet
 * the wake of a route laid from a fort, or an army raised in the field, resolves
 * empty: measured on seed 42 / medium / 200 ticks, 8 of 14 catalyst seeds withered
 * on a family that had eligible members. This module answers "where is the thing the
 * work made?" so the planter can stamp that Location on the seed as
 * `PendingEncounterSeed.resolutionLocationId`, and the seeding site judges the gate
 * there first.
 *
 * The answer is read off the graph the completion just wrote, in this order:
 *
 * 1. every node the completion **created** (`GraphOpResult.createdId`) — a founded
 *    settlement, a route's identity node, a raised army;
 * 2. the **object** the cell acted on (`candidate.objectHandle`) — the settlement a
 *    `change:raise` improved, the route a blockade lowered;
 * 3. the **target** of the work (`candidate.targetNodeId`).
 *
 * Each is resolved to a Location: a Place resolves to its parent, a group or a mortal
 * to where it stands, and a route to the settlement end it reaches — the far end
 * first (the town the road *now reaches*), the near end second, and the far end
 * regardless when neither is a settlement. The first candidate that resolves wins.
 * Nothing resolving is `undefined`, and the seeding site then judges at the actor's
 * feet exactly as it did before this module existed — additive and fail-soft (NFP #4,
 * #6). Pure over the graph (NFP #2): no rng, no writes.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { StrategicActionCandidate } from '../types/strategicAction';
import type { GraphOpResult } from './strategicGraphOps';
import { getAgentLocation } from './graphQueries';
import { isPlaceNode, resolveToParentLocation } from './sublocationShape';
import { LOCATION_CLASSES } from '../data/world-objects';
import { ROUTE_IDENTITY_SUBTYPE } from '../data/strategic-action-constants';

/** The subtype a Location carries, under either of the two property spellings. */
function locationSubtypeOf(node: GraphNode | undefined): string | undefined {
  if (!node) return undefined;
  return (node.properties.locationSubtype ?? node.properties.locationType) as string | undefined;
}

/** Is this Location one of the settlement class — the class every catalyst family is gated to? */
function isSettlement(node: GraphNode | undefined): boolean {
  const subtype = locationSubtypeOf(node);
  return subtype !== undefined && LOCATION_CLASSES.settlement.includes(subtype);
}

/**
 * The Location tier node a location-typed node stands for: itself, or its parent
 * when it is a Place. `undefined` when the parent is dangling.
 */
function locationTierOf(graph: WorldGraph, node: GraphNode): GraphNode | undefined {
  return isPlaceNode(node) ? resolveToParentLocation(graph, node) : node;
}

/**
 * The settlement end of a route — far end first, near end second, and the far end
 * regardless when neither is a settlement (the wake still has somewhere to land, and
 * the seeding site's fallback to the actor's feet covers the rest).
 */
function routeAnchor(graph: WorldGraph, route: GraphNode): GraphNode | undefined {
  const ends = [route.properties.routeTargetId, route.properties.routeSourceId]
    .filter((id): id is string => typeof id === 'string')
    .map(id => graph.getNode(id))
    .filter((n): n is GraphNode => n !== undefined && n.type === 'location')
    .map(n => locationTierOf(graph, n))
    .filter((n): n is GraphNode => n !== undefined);
  return ends.find(isSettlement) ?? ends[0];
}

/**
 * The Location a single node stands at, for the wake: a route's settlement end, a
 * Place's parent, a Location itself, a group's or a mortal's standing place. An
 * artifact, a faction or a trait has no place of its own and resolves to nothing.
 */
export function catalystAnchorOfNode(graph: WorldGraph, nodeId: string): GraphNode | undefined {
  const node = graph.getNode(nodeId);
  if (!node) return undefined;
  if (node.type === 'location') {
    if (locationSubtypeOf(node) === ROUTE_IDENTITY_SUBTYPE) return routeAnchor(graph, node);
    return locationTierOf(graph, node);
  }
  if (node.type === 'actor' && node.properties.actorType !== 'faction') {
    // An army, a ring, a company, a mortal: where it stands, resolved to the Location tier.
    return resolveToParentLocation(graph, getAgentLocation(graph, nodeId));
  }
  return undefined;
}

/**
 * The Location a completed undertaking's catalyst should be judged at, or
 * `undefined` when the work made nothing that stands anywhere (a masterwork, an
 * agreement) — in which case the seeding site judges at the actor's feet.
 */
export function catalystAnchorLocationId(
  graph: WorldGraph,
  candidate: Pick<StrategicActionCandidate, 'objectHandle' | 'targetNodeId'>,
  ops: readonly GraphOpResult[],
): string | undefined {
  const candidates: string[] = [];
  for (const op of ops) {
    if (op.success && op.createdId) candidates.push(op.createdId);
  }
  if (candidate.objectHandle?.kind === 'node') candidates.push(candidate.objectHandle.nodeId);
  if (candidate.targetNodeId) candidates.push(candidate.targetNodeId);

  for (const id of candidates) {
    const anchor = catalystAnchorOfNode(graph, id);
    if (anchor) return anchor.id;
  }
  return undefined;
}

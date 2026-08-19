/**
 * Trade-route GraphOps — the four catalog trade verbs, resolved to real endpoints.
 *
 * THR-1188. The `action.gold.*` trade verbs used to carry generic edge ops bound
 * `$actor` → `$target`. `unifiedCandidates.ts` sets `targetId` to the actor's own
 * location unconditionally ("target is always the location"), so every one of them
 * resolved to `actor → location` — a shape `createTradeRoute` never writes, every
 * location-anchored consumer (`armySupply`, `battleAftermath`, `tradeRouteMarkers`)
 * cannot walk, and the narrowed `trades_with` EDGE_SCHEMA row (THR-830) refuses.
 * The `update_edge` / `remove_edge` variants could never match a live route either,
 * so three of the four were no-ops against the real trade web regardless of schema.
 *
 * The generic ops could not be rebound to a legal `location → location` pair by
 * editing the template alone: `$location` and `$target` are the *same* node here,
 * so there is no partner endpoint for a sentinel to name. These four typed ops
 * resolve the pair themselves instead — the same shape `fortify_location` and the
 * THR-611 essence ops use when a verb needs engine logic a generic op cannot
 * express. They are graph-only, so `unifiedActionResolution` auto-routes them
 * through `graphOnlyOps` → `executeGraphOps` with no interception needed.
 *
 * The anchor is always the caster's durable settlement, never `ctx.targetId`.
 * Partner selection reuses the shipped route-formation scorer (`scoreRoutePairBalance`,
 * THR-616) rather than inventing a second notion of which pairs want to trade.
 *
 * NFP #3 (determinism): no RNG. Every selection breaks ties on node/edge id, so the
 * same graph and tick always pick the same pair.
 * NFP #4 (fail-soft): every path returns an error result rather than throwing — no
 * anchor, no partner, no route are all ordinary outcomes the action layer narrates
 * as a failure.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type { GraphOp, GraphOpContext, GraphOpResult } from '../types/graphOp';
import { resolveRef } from '../types/graphOp';
import { hexDistance } from '../lib/hexMath';
import { resolveLocationToHex } from './encounterAwareness';
import { createTradeRoute } from './strategicGraphOps';
import {
  readTradeRouteProps,
  scoreRoutePairBalance,
  TRADE_ROUTE_MAX_VOLUME,
  TRADE_PARTNER_MAX_HEX_RANGE,
  TRADE_PARTNER_MAX_CANDIDATES,
  TRADE_ROUTE_DEFAULT_TAX_RATE,
} from './tradeRoute';

// ─── Endpoint resolution ──────────────────────────────────────────────────

/**
 * The actor's current location resolved to something a durable edge can anchor
 * on (THR-669): sublocations climb to their parent settlement; transient transit
 * hexes (`loc.transient.*`, garbage-collected after passage) resolve to undefined
 * rather than becoming an edge endpoint that will evaporate.
 *
 * Shared with `strategicActionLifecycle`, which held the original copy — one
 * definition so the catalog verbs and the merchant strategic pack cannot drift
 * apart on what counts as a durable endpoint.
 */
export function resolveDurableActorLocation(
  graph: WorldGraph,
  actorId: string,
): string | undefined {
  const rawId = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  if (!rawId) return undefined;
  const node = graph.getNode(rawId);
  if (!node) return undefined;
  const parentId = node.properties.parentLocationId as string | undefined;
  const resolvedId = parentId ?? rawId;
  if (resolvedId.startsWith('loc.transient.')) return undefined;
  return graph.getNode(resolvedId) ? resolvedId : undefined;
}

/**
 * The settlement a trade verb acts from. The caster's own durable location is
 * authoritative; `ctx.locationId` is a fallback for callers that resolve the
 * actor differently (it climbs to a parent settlement the same way). Returns
 * undefined when neither resolves to a real `location` node.
 */
function resolveTradeAnchor(graph: WorldGraph, ctx: GraphOpContext): string | undefined {
  const fromActor = resolveDurableActorLocation(graph, ctx.actorId);
  if (fromActor) return fromActor;

  const raw = ctx.locationId;
  if (!raw) return undefined;
  const node = graph.getNode(raw);
  if (!node) return undefined;
  const parentId = node.properties.parentLocationId as string | undefined;
  const resolvedId = parentId ?? raw;
  if (resolvedId.startsWith('loc.transient.')) return undefined;
  const resolved = graph.getNode(resolvedId);
  return resolved?.type === 'location' ? resolvedId : undefined;
}

/** Every `trades_with` edge with `anchorId` at either end. */
function collectRoutesAt(graph: WorldGraph, anchorId: string): GraphEdge[] {
  return [
    ...graph.getOutgoingEdges(anchorId, 'trades_with'),
    ...graph.getIncomingEdges(anchorId, 'trades_with'),
  ];
}

/**
 * Pick the settlement most worth opening a route to from `anchorId`: the highest
 * `scoreRoutePairBalance` (surplus at one end meeting scarcity at the other)
 * among locations within `TRADE_PARTNER_MAX_HEX_RANGE` that the anchor does not
 * already trade with. Ties break on node id so the choice is deterministic.
 *
 * Returns undefined when the anchor is landlocked in range, already trades with
 * every neighbour, or has no hex coordinates — all ordinary, all fail-soft.
 */
function selectTradePartner(graph: WorldGraph, anchorId: string): string | undefined {
  const anchor = graph.getNode(anchorId);
  const anchorHex = resolveLocationToHex(graph, anchorId);
  if (!anchor || !anchorHex) return undefined;

  const alreadyTrading = new Set(
    collectRoutesAt(graph, anchorId).map(e => (e.source === anchorId ? e.target : e.source)),
  );

  let bestId: string | undefined;
  let bestScore = -1;
  let scored = 0;

  for (const candidate of graph.getNodesByType('location')) {
    if (scored >= TRADE_PARTNER_MAX_CANDIDATES) break;
    if (candidate.id === anchorId || alreadyTrading.has(candidate.id)) continue;
    if (candidate.id.startsWith('loc.transient.')) continue;

    const hex = resolveLocationToHex(graph, candidate.id);
    if (!hex || hexDistance(anchorHex, hex) > TRADE_PARTNER_MAX_HEX_RANGE) continue;

    scored++;
    const score = scoreRoutePairBalance(
      anchor.properties as Record<string, unknown>,
      candidate.properties as Record<string, unknown>,
    );
    // Strict `>` plus an id tie-break keeps the pick stable across runs; a region
    // of resourceless neighbours all score 0 and the lowest id wins rather than
    // whichever the graph happened to yield first.
    if (score > bestScore || (score === bestScore && bestId !== undefined && candidate.id < bestId)) {
      bestScore = score;
      bestId = candidate.id;
    }
  }

  return bestId;
}

/** The busiest route at the anchor — what a tax or a sabotage is actually about. */
function selectBusiestRoute(routes: GraphEdge[]): GraphEdge | undefined {
  let best: GraphEdge | undefined;
  let bestVolume = -1;
  for (const route of routes) {
    const volume = readTradeRouteProps(route.properties as Record<string, unknown>).volume;
    if (volume > bestVolume || (volume === bestVolume && best !== undefined && route.id < best.id)) {
      bestVolume = volume;
      best = route;
    }
  }
  return best;
}

// ─── The four ops ─────────────────────────────────────────────────────────

/**
 * `establish_trade_route` — open a route from the caster's settlement to the
 * best-matched partner in range. Delegates the write to `createTradeRoute`, so
 * the edge carries the same cargo manifest, `establishedBy` stamp and birth-tick
 * `lastTraded` (THR-669) as one the merchant pack forms.
 */
export function executeEstablishTradeRoute(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const anchorId = resolveTradeAnchor(graph, ctx);
  if (!anchorId) return { op, success: false, error: 'establish_trade_route: no durable anchor location' };

  const partnerId = selectTradePartner(graph, anchorId);
  if (!partnerId) return { op, success: false, error: 'establish_trade_route: no eligible partner in range' };

  const result = createTradeRoute(graph, anchorId, partnerId, ctx.actorId, ctx.tick ?? 0);
  return result.success
    ? { op, success: true, createdId: result.createdId }
    : { op, success: false, error: `establish_trade_route: ${result.error ?? 'create failed'}` };
}

/**
 * `conduct_trade` — run a caravan along an existing route. Bumps `volume` toward
 * `TRADE_ROUTE_MAX_VOLUME` and refreshes `lastTraded`, which is what holds the
 * route open against `phaseTradeRouteDecay`. The stalest route is chosen: it is
 * the one a trade run rescues, and the one the decay phase is about to take.
 */
export function executeConductTrade(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const anchorId = resolveTradeAnchor(graph, ctx);
  if (!anchorId) return { op, success: false, error: 'conduct_trade: no durable anchor location' };

  const routes = collectRoutesAt(graph, anchorId);
  if (routes.length === 0) return { op, success: false, error: 'conduct_trade: no route at anchor' };

  let target = routes[0];
  let stalest = readTradeRouteProps(target.properties as Record<string, unknown>).lastTraded;
  for (const route of routes.slice(1)) {
    const lastTraded = readTradeRouteProps(route.properties as Record<string, unknown>).lastTraded;
    if (lastTraded < stalest || (lastTraded === stalest && route.id < target.id)) {
      stalest = lastTraded;
      target = route;
    }
  }

  const props = readTradeRouteProps(target.properties as Record<string, unknown>);
  graph.updateEdge(target.id, {
    properties: {
      ...target.properties,
      volume: Math.min(TRADE_ROUTE_MAX_VOLUME, props.volume + 1),
      lastTraded: ctx.tick ?? props.lastTraded,
    },
  });
  return { op, success: true, createdId: target.id };
}

/**
 * `disrupt_trade_route` — sever the busiest route at the caster's settlement.
 * Sabotage is about the route that matters, so volume decides, not recency.
 */
export function executeDisruptTradeRoute(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const anchorId = resolveTradeAnchor(graph, ctx);
  if (!anchorId) return { op, success: false, error: 'disrupt_trade_route: no durable anchor location' };

  const target = selectBusiestRoute(collectRoutesAt(graph, anchorId));
  if (!target) return { op, success: false, error: 'disrupt_trade_route: no route at anchor' };

  graph.removeEdge(target.id);
  return { op, success: true, createdId: target.id };
}

/**
 * `tax_trade_route` — station collectors on the busiest route at the caster's
 * settlement. Stamps `controlledBy` (the caster) and `taxRate`, the two fields
 * the toll readers already look for on a `trades_with` edge.
 */
export function executeTaxTradeRoute(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const anchorId = resolveTradeAnchor(graph, ctx);
  if (!anchorId) return { op, success: false, error: 'tax_trade_route: no durable anchor location' };

  // An already-taxed route is not worth re-taking; prefer an untolled one, and
  // fall back to the busiest overall so the verb still lands where every route
  // at the anchor is already controlled.
  const routes = collectRoutesAt(graph, anchorId);
  const untaxed = routes.filter(
    r => !readTradeRouteProps(r.properties as Record<string, unknown>).controlledBy,
  );
  const target = selectBusiestRoute(untaxed.length > 0 ? untaxed : routes);
  if (!target) return { op, success: false, error: 'tax_trade_route: no route at anchor' };

  graph.updateEdge(target.id, {
    properties: {
      ...target.properties,
      controlledBy: resolveRef(op.source ?? '$actor', ctx),
      taxRate: TRADE_ROUTE_DEFAULT_TAX_RATE,
    },
  });
  return { op, success: true, createdId: target.id };
}

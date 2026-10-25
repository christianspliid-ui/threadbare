/**
 * Surplus routes — a surplus with nowhere to go goes looking for a buyer (THR-1923, plan
 * § Resolution logic 6).
 *
 * A surplus route is an ordinary `trades_with` edge from the seller to the buyer, minted
 * through `createTradeRoute` and stamped `establishedBy: 'surplus'`, `carries`,
 * `carriedPerDay` and `surplusFrom`. Each day it carries the seller's exportable amount;
 * carrying sets `lastTraded`. A blockaded lane carries nothing. After `ROUTE_DIE_DAYS` dry
 * days the route ends and its edge is removed here — lane traffic (THR-1636) keeps every
 * lane between standing towns alive, so the decay phase would never retire it.
 *
 * Do not ship goods to even out the map: a route carries only surplus a seller's own sinks
 * could not take.
 */
import type { GraphEdge } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { createTradeRoute } from '../strategicGraphOps';
import { laneTraffic, TRADE_ROUTE_MAX_VOLUME } from '../tradeRoute';
import {
  SURPLUS_ROUTE_ESTABLISHED_BY,
  SURPLUS_ROUTE_VOLUME_PER_UNIT,
} from '../../data/settlement-economy-constants';

export type SurplusGood = 'food' | 'goods';

/** Edge property: dry days counted toward `ROUTE_DIE_DAYS`. */
export const SURPLUS_DRY_DAYS_PROP = 'surplusDryDays';

export function isSurplusRoute(edge: GraphEdge): boolean {
  return edge.type === 'trades_with' && edge.properties?.establishedBy === SURPLUS_ROUTE_ESTABLISHED_BY;
}

/** Every surplus route, in edge-id order. */
export function readSurplusRoutes(graph: WorldGraph): GraphEdge[] {
  return graph.getEdgesByType('trades_with')
    .filter(isSurplusRoute)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function routeCarries(edge: GraphEdge): SurplusGood {
  return edge.properties?.carries === 'goods' ? 'goods' : 'food';
}

/** Whether the lane is suspended by a blockade (the THR-1636 rule) and carries nothing. */
export function isRouteBlockaded(graph: WorldGraph, edge: GraphEdge, tick: number): boolean {
  return laneTraffic(graph, edge, tick) === 'suspended';
}

/** Mint a surplus route. Null when a lane already runs that way, or the write failed. */
export function openSurplusRoute(
  graph: WorldGraph,
  fromId: string,
  toId: string,
  carries: SurplusGood,
  tick: number,
): GraphEdge | null {
  const result = createTradeRoute(graph, fromId, toId, SURPLUS_ROUTE_ESTABLISHED_BY, tick);
  if (!result.success || !result.createdId) return null;
  const edge = graph.getEdge(result.createdId);
  if (!edge) return null;
  edge.properties.carries = carries;
  edge.properties.carriedPerDay = 0;
  edge.properties.surplusFrom = fromId;
  edge.properties[SURPLUS_DRY_DAYS_PROP] = 0;
  return edge;
}

/** Record a day's carrying on the edge. */
export function markCarried(edge: GraphEdge, amount: number, tick: number): void {
  edge.properties.carriedPerDay = amount;
  edge.properties.lastTraded = tick;
  edge.properties[SURPLUS_DRY_DAYS_PROP] = 0;
  edge.properties.volume = Math.max(1, Math.min(TRADE_ROUTE_MAX_VOLUME, Math.round(amount * SURPLUS_ROUTE_VOLUME_PER_UNIT)));
}

/** Record a dry day; returns the dry-day count. */
export function markDry(edge: GraphEdge): number {
  const prev = edge.properties[SURPLUS_DRY_DAYS_PROP];
  const dry = (typeof prev === 'number' ? prev : 0) + 1;
  edge.properties[SURPLUS_DRY_DAYS_PROP] = dry;
  edge.properties.carriedPerDay = 0;
  return dry;
}

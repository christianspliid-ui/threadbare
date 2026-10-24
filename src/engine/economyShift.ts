/**
 * THR-1953 (mortal wealth S3) — `economy_shift` on the world.
 *
 * Plan: `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md` § Content pillar (S3). S1 built
 * the effect for a mortal's Means (`mortalMeans.ts`); this module is its other five
 * quantities, so a money encounter's outcome table can move the town it happened in:
 *
 * - `prosperity` / `unrest` — the settlement's 0–100 scalar, clamped;
 * - `stock` — the quantities of the named goods at the settlement (0–100 abundance);
 *   a gain on a good the town lacks brings it in (the smuggled salt), a loss on an absent
 *   good writes nothing;
 * - `lane_volume` — the settlement's busiest lane, never thinned below
 *   `ENCOUNTER_LANE_VOLUME_FLOOR` (an encounter slows a road, it never closes one);
 * - `purse` — a faction's treasury through `applyTreasuryDelta` (the faction purse's
 *   one funnel, THR-1931).
 *
 * Pure on the graph (mutates the node or edge it writes, as the graph ops do); the
 * caller traces. Deterministic: no PRNG. Fail-soft (NFP #4): a missing node, a town with
 * no lane, a switched-off purse, or a clamp that leaves the value where it was returns
 * null and writes nothing (Law 56: no change for a move that did not happen).
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { resolveToParentLocation, isLocationNode } from './sublocationShape';
import { readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';
import { readTradeRouteProps, TRADE_ROUTE_MAX_VOLUME } from './tradeRoute';
import { busiestRouteAt } from './tradeRouteOps';
import { applyTreasuryDelta, readWealth } from './wealth';
import { FACTION_PURSE_ENABLED } from '../data/faction-purse-constants';
import { isPurseFaction } from './factionPurse/income';
import {
  ENCOUNTER_LANE_VOLUME_FLOOR,
  STOCK_GOOD_DEPOSIT,
  STOCK_GOOD_STAPLE,
  type WorldEconomyQuantity,
} from '../data/economy-shift-constants';
import type { ResourceInstance } from '../types/resource';

export interface WorldShiftResult {
  readonly quantity: WorldEconomyQuantity;
  /** The settlement, the lane's edge id, or the faction written. */
  readonly nodeId: string;
  /** For stock: the goods whose quantity moved. */
  readonly goods?: readonly string[];
  /** The signed amount applied after the clamp (summed over goods for stock). */
  readonly amount: number;
  readonly before: number;
  readonly after: number;
}

function finite(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** The place-tier settlement a location id names (a sublocation walks up). */
export function resolveShiftSettlement(graph: WorldGraph, locationId: string | undefined): GraphNode | undefined {
  if (!locationId || locationId.startsWith('$')) return undefined;
  const node = graph.getNode(locationId);
  if (!node || node.type !== 'location') return undefined;
  const place = resolveToParentLocation(graph, node);
  return place && isLocationNode(place) ? place : undefined;
}

function shiftScalar(
  node: GraphNode,
  property: 'prosperity' | 'unrest',
  amount: number,
): WorldShiftResult | null {
  const before = finite(node.properties[property]) ?? 0;
  const after = Math.max(0, Math.min(100, before + amount));
  if (after === before) return null;
  node.properties[property] = after;
  return { quantity: property, nodeId: node.id, amount: after - before, before, after };
}

/** The resource ids a `good` names at this settlement. */
function goodsFor(resources: Record<string, ResourceInstance>, good: string, amount: number): string[] {
  if (good === STOCK_GOOD_STAPLE || good === STOCK_GOOD_DEPOSIT) {
    const wantStaple = good === STOCK_GOOD_STAPLE;
    return Object.keys(resources)
      .filter(id => (getResourceClass(id).category === 'staple') === wantStaple)
      .sort();
  }
  // A named good: a gain brings it in even where the town lacks it; a loss needs it there.
  return resources[good] || amount > 0 ? [good] : [];
}

function shiftStock(
  graph: WorldGraph,
  settlement: GraphNode,
  good: string | undefined,
  amount: number,
): WorldShiftResult | null {
  if (!good) return null;
  const resources = readResources(settlement.properties as Record<string, unknown>);
  const next: Record<string, ResourceInstance> = { ...resources };
  const moved: string[] = [];
  let before = 0;
  let after = 0;
  for (const id of goodsFor(resources, good, amount)) {
    const current = resources[id];
    const q0 = finite(current?.quantity) ?? 0;
    const q1 = Math.max(0, Math.min(100, q0 + amount));
    if (q1 === q0) continue;
    next[id] = current
      ? { ...current, quantity: q1 }
      : ({ resourceId: id, quantity: q1 } as unknown as ResourceInstance);
    moved.push(id);
    before += q0;
    after += q1;
  }
  if (moved.length === 0) return null;
  graph.updateNode(settlement.id, { properties: { resources: next } });
  return { quantity: 'stock', nodeId: settlement.id, goods: moved, amount: after - before, before, after };
}

function shiftLaneVolume(
  graph: WorldGraph,
  settlement: GraphNode,
  amount: number,
  tick: number,
): WorldShiftResult | null {
  const lane = busiestRouteAt(graph, settlement.id);
  if (!lane) return null;
  const props = readTradeRouteProps(lane.properties as Record<string, unknown>);
  const before = props.volume;
  const floor = Math.min(before, ENCOUNTER_LANE_VOLUME_FLOOR);
  const after = Math.max(floor, Math.min(TRADE_ROUTE_MAX_VOLUME, before + amount));
  if (after === before) return null;
  graph.updateEdge(lane.id, {
    properties: {
      ...lane.properties,
      volume: after,
      // A caravan that got through counts as trade; a thinned lane keeps its clock.
      ...(after > before ? { lastTraded: tick } : {}),
    },
  });
  return { quantity: 'lane_volume', nodeId: lane.id, amount: after - before, before, after };
}

function shiftPurse(graph: WorldGraph, factionId: string | undefined, amount: number): WorldShiftResult | null {
  if (!FACTION_PURSE_ENABLED || !factionId || factionId.startsWith('$')) return null;
  const faction = graph.getNode(factionId);
  // The purse's own predicate: a faction actor outside the excluded types (monster lairs).
  if (!isPurseFaction(faction)) return null;
  const before = readWealth(faction.properties as Record<string, unknown>);
  const after = applyTreasuryDelta(before, amount);
  if (after === before) return null;
  faction.properties.wealth = after;
  return { quantity: 'purse', nodeId: faction.id, amount: after - before, before, after };
}

/**
 * Apply one world `economy_shift`. `settlementId` is the bound `targetLocationId`, or the
 * actor's `$here` when the effect named none; `factionId` the bound `targetFactionId`.
 */
export function applyWorldEconomyShift(
  graph: WorldGraph,
  shift: {
    readonly quantity: WorldEconomyQuantity;
    readonly amount: number;
    readonly good?: string;
    readonly settlementId?: string;
    readonly factionId?: string;
  },
  tick: number,
): WorldShiftResult | null {
  if (!Number.isFinite(shift.amount) || shift.amount === 0) return null;
  if (shift.quantity === 'purse') return shiftPurse(graph, shift.factionId, shift.amount);
  const settlement = resolveShiftSettlement(graph, shift.settlementId);
  if (!settlement) return null;
  switch (shift.quantity) {
    case 'prosperity':
    case 'unrest':
      return shiftScalar(settlement, shift.quantity, shift.amount);
    case 'stock':
      return shiftStock(graph, settlement, shift.good, shift.amount);
    case 'lane_volume':
      return shiftLaneVolume(graph, settlement, shift.amount, tick);
    default:
      return null;
  }
}

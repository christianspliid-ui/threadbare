/**
 * THR-1953 (mortal wealth S3) — `economy_shift` on the world.
 *
 * Plan: `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md` § Content pillar (S3). S1 built
 * the effect for a mortal's Means (`mortalMeans.ts`); this module is its other five
 * quantities, so a money encounter's outcome table can move the town it happened in:
 *
 * - `prosperity` / `unrest` — the settlement's 0–100 scalar, clamped;
 * - `stock` — the quantities of the named goods at the settlement (0–100 abundance;
 *   `deposit` is the mined goods, `STOCK_DEPOSIT_GOODS`);
 *   a gain on a good the town lacks brings it in (the smuggled salt), a loss on an absent
 *   good writes nothing;
 * - `lane_volume` — the encounter's own lane (THR-2046, `resolveLaneAnchor`), else the
 *   settlement's busiest, never thinned below `ENCOUNTER_LANE_VOLUME_FLOOR` (an encounter
 *   slows a road, it never closes one);
 * - `lane_threat` — mark that lane threatened, or clear it (never a blockaded one);
 * - `lane_toll` — strike a toll on it for the town's faction, else the acting mortal;
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
import { readTradeRouteProps, TRADE_ROUTE_DEFAULT_TAX_RATE, TRADE_ROUTE_MAX_VOLUME } from './tradeRoute';
import { busiestRouteAt } from './tradeRouteOps';
import { applyTreasuryDelta, readWealth } from './wealth';
import { FACTION_PURSE_ENABLED } from '../data/faction-purse-constants';
import { isPurseFaction, taxHolderOf } from './factionPurse/income';
import { isMortalHolder } from './holdingIncome';
import type { GraphEdge } from '../types/graph';
import { ROUTE_THREATENED_CLEAR_TICKS } from '../data/route-event-config';
import {
  ENCOUNTER_LANE_VOLUME_FLOOR,
  ENCOUNTER_LANE_WRITES_ENABLED,
  ENCOUNTER_THREAT_CLEAR_TICKS,
  STOCK_DEPOSIT_GOODS,
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
  /** THR-2046 — lane quantities: whether the encounter's bound lane was written, or the fallback. */
  readonly laneSource?: LaneAnchorSource;
  /** THR-2046 — `lane_toll`: the faction or mortal now holding the toll. */
  readonly holderId?: string;
}

/** THR-2046 — why a world write did not move, for the caller's `aftermath_target_invalid`. */
export type WorldShiftNoMoveReason = 'no_move' | 'blockaded' | 'no_holder' | 'target_node_missing';

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
  if (good === STOCK_GOOD_STAPLE) {
    return Object.keys(resources).filter(id => getResourceClass(id).category === 'staple').sort();
  }
  if (good === STOCK_GOOD_DEPOSIT) {
    return Object.keys(resources).filter(id => STOCK_DEPOSIT_GOODS.has(id)).sort();
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

export type LaneAnchorSource = 'seed' | 'fallback';

export interface LaneAnchor {
  /** The encounter's bound lane when it is live; undefined means the caller falls back. */
  readonly lane?: GraphEdge;
  /** The settlement the write is read at: the actor's town, or the bound lane's source end. */
  readonly settlementId?: string;
  readonly source: LaneAnchorSource;
}

/** The lane quantities: the ones `resolveLaneAnchor` places. */
export function isLaneQuantity(quantity: string): quantity is 'lane_volume' | 'lane_threat' | 'lane_toll' {
  return quantity === 'lane_volume' || quantity === 'lane_threat' || quantity === 'lane_toll';
}

/**
 * THR-2046 — the lane and town a lane write lands on. A live bound `trades_with` lane wins
 * (`'seed'`); if the actor's town is not one of its ends (the mortal moved), the lane's
 * `source` end is the town, so the receipt reads the town the road touches. Otherwise the
 * town is the actor's and the lane is the caller's fallback (`'fallback'`). Switched off
 * (`ENCOUNTER_LANE_WRITES_ENABLED`), the bound lane is ignored.
 */
export function resolveLaneAnchor(
  graph: WorldGraph,
  laneEdgeId: string | undefined,
  settlementId: string | undefined,
): LaneAnchor {
  const town = resolveShiftSettlement(graph, settlementId);
  const edge = ENCOUNTER_LANE_WRITES_ENABLED && laneEdgeId ? graph.getEdge(laneEdgeId) : undefined;
  if (!edge || edge.type !== 'trades_with') return { settlementId: town?.id, source: 'fallback' };
  const touches = town !== undefined && (edge.source === town.id || edge.target === town.id);
  return { lane: edge, settlementId: touches ? town.id : edge.source, source: 'seed' };
}

function isBlockaded(lane: GraphEdge): boolean {
  const by = lane.properties.blockadedBy;
  return typeof by === 'string' && by.length > 0;
}

/**
 * The lowest-id threatened lane at a settlement that an encounter may clear: what a clear
 * with no bound lane frees. A blockaded lane is skipped (only the blockade verb lifts it),
 * so a second, ambushed road is still freed (review gate, THR-2046).
 */
function firstThreatenedRouteAt(graph: WorldGraph, settlementId: string): GraphEdge | undefined {
  return [
    ...graph.getOutgoingEdges(settlementId, 'trades_with'),
    ...graph.getIncomingEdges(settlementId, 'trades_with'),
  ]
    .filter(e => e.properties.threatened === true && !isBlockaded(e))
    .sort((a, b) => a.id.localeCompare(b.id))[0];
}

function shiftLaneVolume(
  graph: WorldGraph,
  settlement: GraphNode,
  amount: number,
  tick: number,
  anchor: LaneAnchor,
): WorldShiftResult | null {
  const lane = anchor.lane ?? busiestRouteAt(graph, settlement.id);
  if (!lane) return null;
  const props = readTradeRouteProps(lane.properties as Record<string, unknown>);
  const before = props.volume;
  const floor = Math.min(before, ENCOUNTER_LANE_VOLUME_FLOOR);
  // Whole volumes only: the traffic settle steps by 1 toward an integer level, and a
  // fractional volume would oscillate round it (review gate, THR-1953).
  const after = Math.max(floor, Math.min(TRADE_ROUTE_MAX_VOLUME, Math.round(before + amount)));
  if (after === before) return null;
  graph.updateEdge(lane.id, {
    properties: {
      ...lane.properties,
      volume: after,
      // A caravan that got through counts as trade; a thinned lane keeps its clock.
      ...(after > before ? { lastTraded: tick } : {}),
    },
  });
  return { quantity: 'lane_volume', nodeId: lane.id, amount: after - before, before, after, laneSource: anchor.source };
}

/**
 * THR-2046 — mark a lane threatened (`amount > 0`) or clear it (`< 0`). A mark is
 * back-dated so the route-event sweep clears it `ENCOUNTER_THREAT_CLEAR_TICKS` later.
 * With no bound lane a mark goes on the busiest lane and a clear on the lowest-id
 * threatened one. A blockaded lane is never cleared: only the blockade verb lifts it.
 */
function shiftLaneThreat(
  graph: WorldGraph,
  settlement: GraphNode,
  amount: number,
  tick: number,
  anchor: LaneAnchor,
): WorldShiftResult | WorldShiftNoMoveReason {
  const mark = amount > 0;
  const lane = anchor.lane
    ?? (mark ? busiestRouteAt(graph, settlement.id) : firstThreatenedRouteAt(graph, settlement.id));
  if (!lane) return 'no_move';
  const was = lane.properties.threatened === true;
  if (was === mark) return 'no_move';
  if (!mark && isBlockaded(lane)) return 'blockaded';
  graph.updateEdge(lane.id, {
    properties: mark
      ? {
        ...lane.properties,
        threatened: true,
        threatenedSinceTick: tick - (ROUTE_THREATENED_CLEAR_TICKS - ENCOUNTER_THREAT_CLEAR_TICKS),
      }
      : { ...lane.properties, threatened: false, threatenedSinceTick: undefined },
  });
  return {
    quantity: 'lane_threat', nodeId: lane.id, amount: mark ? 1 : -1,
    before: was ? 1 : 0, after: mark ? 1 : 0, laneSource: anchor.source,
  };
}

/**
 * THR-2046 — who a struck toll goes to (decision 3): the faction that holds the town, by
 * the purse's own tax-holder rule, else the acting mortal through the holding toll.
 */
function tollHolder(graph: WorldGraph, settlement: GraphNode, actorId: string | undefined): string | undefined {
  const faction = taxHolderOf(graph, settlement.id, new Map());
  if (faction && isPurseFaction(graph.getNode(faction))) return faction;
  if (actorId && isMortalHolder(graph.getNode(actorId))) return actorId;
  return undefined;
}

/** THR-2046 — strike a toll: `controlledBy` on the lane. Never strips a mortal holder. */
function shiftLaneToll(
  graph: WorldGraph,
  settlement: GraphNode,
  amount: number,
  anchor: LaneAnchor,
  actorId: string | undefined,
): WorldShiftResult | WorldShiftNoMoveReason {
  // A negative toll is a content error (the content invariant refuses it).
  if (amount < 0) return 'no_move';
  const lane = anchor.lane ?? busiestRouteAt(graph, settlement.id);
  if (!lane) return 'no_move';
  const holder = tollHolder(graph, settlement, actorId);
  if (!holder) return 'no_holder';
  const current = readTradeRouteProps(lane.properties as Record<string, unknown>).controlledBy;
  if (current === holder) return 'no_move';
  if (current && isMortalHolder(graph.getNode(current))) return 'no_move';
  // The rate every other toll writer stamps (`stampToll`), so the purse's and holding
  // income's toll lines pay an encounter's toll exactly as a seized one (review gate).
  graph.updateEdge(lane.id, {
    properties: { ...lane.properties, controlledBy: holder, taxRate: TRADE_ROUTE_DEFAULT_TAX_RATE },
  });
  return {
    quantity: 'lane_toll', nodeId: lane.id, amount: 1, before: current ? 1 : 0, after: 1,
    laneSource: anchor.source, holderId: holder,
  };
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

export interface WorldEconomyShiftInput {
  readonly quantity: WorldEconomyQuantity;
  readonly amount: number;
  readonly good?: string;
  readonly settlementId?: string;
  readonly factionId?: string;
  /** THR-2046 — the encounter's own lane (`UnifiedAction.laneEdgeId`). */
  readonly laneEdgeId?: string;
  /** THR-2046 — the mortal a `lane_toll` falls back to when no faction holds the town. */
  readonly actorId?: string;
}

/**
 * Apply one world `economy_shift`. `settlementId` is the bound `targetLocationId`, or the
 * actor's `$here` when the effect named none; `factionId` the bound `targetFactionId`.
 */
export function applyWorldEconomyShift(
  graph: WorldGraph,
  shift: WorldEconomyShiftInput,
  tick: number,
): WorldShiftResult | null {
  const r = applyWorldEconomyShiftDetailed(graph, shift, tick);
  return typeof r === 'string' ? null : r;
}

/**
 * {@link applyWorldEconomyShift}, but a write that did not move says why (`'blockaded'`,
 * `'no_holder'`, `'no_move'`, `'target_node_missing'`) instead of returning null.
 */
export function applyWorldEconomyShiftDetailed(
  graph: WorldGraph,
  shift: WorldEconomyShiftInput,
  tick: number,
): WorldShiftResult | WorldShiftNoMoveReason {
  if (!Number.isFinite(shift.amount) || shift.amount === 0) return 'no_move';
  if (shift.quantity === 'purse') return shiftPurse(graph, shift.factionId, shift.amount) ?? 'no_move';
  if ((shift.quantity === 'lane_threat' || shift.quantity === 'lane_toll') && !ENCOUNTER_LANE_WRITES_ENABLED) {
    return 'no_move';
  }
  const anchor: LaneAnchor = isLaneQuantity(shift.quantity)
    ? resolveLaneAnchor(graph, shift.laneEdgeId, shift.settlementId)
    : { settlementId: shift.settlementId, source: 'fallback' };
  const settlement = resolveShiftSettlement(graph, anchor.settlementId);
  if (!settlement) return 'target_node_missing';
  switch (shift.quantity) {
    case 'prosperity':
    case 'unrest':
      return shiftScalar(settlement, shift.quantity, shift.amount) ?? 'no_move';
    case 'stock':
      return shiftStock(graph, settlement, shift.good, shift.amount) ?? 'no_move';
    case 'lane_volume':
      return shiftLaneVolume(graph, settlement, shift.amount, tick, anchor) ?? 'no_move';
    case 'lane_threat':
      return shiftLaneThreat(graph, settlement, shift.amount, tick, anchor);
    case 'lane_toll':
      return shiftLaneToll(graph, settlement, shift.amount, anchor, shift.actorId);
    default:
      return 'no_move';
  }
}

// src/engine/godsStake.ts
//
// THR-1969 — the god's stake in the economy, slice S3: the market cards and the two
// promises. Plan: Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md
// § Engine 7.
//
// - Fortune's Favour / Ruin move a mortal exactly one Means band: `meansBandStepAmount`
//   (`mortalMeans.ts`) computes the amount the `economy_shift` writes (`bandStep`).
// - Bless the Holding writes the god's `blessed` edge (kind `holding_yield`) on a held
//   place; `holdingBlessingMult` is what the faction purse's town tax and holding
//   income multiply that place's term by while it is live. Recasting extends, never stacks.
// - Claim Resource pays in the claimed good's sphere × its stock tier
//   (`claimedGoodIncome`), the good fixed at establishment (`claimedGoodAt`).
// - Open the Markets stamps `marketsOpenedTick`; for a while after, a Shadow-led
//   resident of a town still at prosperity 75 leans toward founding a guild
//   (`thievesGuildOfferWant`), which the undertakings plan makes a thieves' guild.
//
// Pure reads apart from the two writers (`blessHolding`, `sweepExpiredHoldingBlessings`)
// and the stamp. Deterministic: no PRNG, ties by id. Fail-soft: a missing input reads
// as no blessing, no boost, or today's static Claim income.

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { ControlEffect } from '../types/controlEffect';
import type { EncounterAftermathChange } from '../types/unifiedAction';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { emitTrace } from './traceBuffer';
import { readResources } from './resourceEconomy';
import { RESOURCE_CLASSES } from '../data/resource-classes';
import { getLocationNodes, resolveToParentLocation, isPlaceNode } from './sublocationShape';
import { getAgentLocationId } from './graphQueries';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  BLESS_HOLDING_DAYS,
  BLESS_HOLDING_YIELD_MULT,
  CLAIM_RESOURCE_BASE_INCOME,
  CLAIM_RESOURCE_PAYS_GOOD,
  CLAIM_RESOURCE_TIER_MULT,
  HOLDING_BLESSING_KIND,
  MARKETS_OPENED_TICK_PROP,
  THIEVES_GUILD_OFFER_DAYS,
  THIEVES_GUILD_OFFER_WANT,
} from '../data/prayer-constants';
import {
  LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS,
  LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD,
} from '../data/location-action-constants';

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

// ─── Fortune's Favour / Ruin ─────────────────────────────────────────────────
//
// `meansBandStepAmount` lives in `mortalMeans.ts`, beside the other Means arithmetic,
// so the aftermath executor reaches it without importing this module.

// ─── Bless the Holding ───────────────────────────────────────────────────────

/** Who holds a place: factions that `control` it and mortals that `own` it, by id. */
export function holdersOf(graph: WorldGraph, placeId: string): GraphNode[] {
  const out = new Map<string, GraphNode>();
  for (const e of graph.getIncomingEdges(placeId, 'controls')) {
    const n = graph.getNode(e.source);
    if (n?.type === 'actor' && n.properties.actorType === 'faction') out.set(n.id, n);
  }
  for (const e of graph.getIncomingEdges(placeId, 'owns')) {
    const n = graph.getNode(e.source);
    if (n?.type === 'actor' && n.properties.actorType !== 'faction') out.set(n.id, n);
  }
  return [...out.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function isLiveHoldingBlessing(props: Record<string, unknown> | undefined, tick: number): boolean {
  if (props?.kind !== HOLDING_BLESSING_KIND) return false;
  const until = num(props.untilTick);
  return until !== undefined && tick < until;
}

/**
 * What a place's tax or holding income is multiplied by today: the largest live
 * holding blessing on it, else 1. Without a tick (an old caller) nothing is live.
 */
export function holdingBlessingMult(graph: WorldGraph, placeId: string, tick: number | undefined): number {
  if (tick === undefined) return 1;
  let mult = 1;
  for (const e of graph.getIncomingEdges(placeId, 'blessed')) {
    const props = e.properties as Record<string, unknown> | undefined;
    if (!isLiveHoldingBlessing(props, tick)) continue;
    const m = num(props?.mult) ?? BLESS_HOLDING_YIELD_MULT;
    if (m > mult) mult = m;
  }
  return mult;
}

/** The god's holding blessing on a place, live or not, if any. */
export function holdingBlessingEdgeId(godId: string, placeId: string): string {
  return `blessed_holding_${godId}_${placeId}`;
}

export type BlessHoldingRefusal = 'place_missing' | 'not_held';

/**
 * Write (or extend) the god's holding blessing on a held place: one `blessed` edge per
 * god and place, so a recast moves `untilTick` and never stacks. Refuses a place no
 * one holds (nothing to multiply).
 */
export function blessHolding(
  graph: WorldGraph,
  godId: string,
  placeId: string,
  tick: number,
): { untilTick: number; holderId: string } | { refused: BlessHoldingRefusal } {
  const place = graph.getNode(placeId);
  if (!place || place.type !== 'location') return { refused: 'place_missing' };
  const holders = holdersOf(graph, placeId);
  if (holders.length === 0) return { refused: 'not_held' };
  const untilTick = tick + BLESS_HOLDING_DAYS * TICKS_PER_DAY;
  const id = holdingBlessingEdgeId(godId, placeId);
  const properties = { kind: HOLDING_BLESSING_KIND, untilTick, mult: BLESS_HOLDING_YIELD_MULT, tick };
  if (graph.getEdge(id)) graph.updateEdge(id, { properties });
  else graph.addEdge({ id, source: godId, target: placeId, type: 'blessed', properties });
  emitTrace({
    category: 'prayer.blessed_holding', tick,
    summary: `${place.name} blessed: its holders draw ×${BLESS_HOLDING_YIELD_MULT} until tick ${untilTick}`,
    targetId: placeId, holderId: holders[0].id, sphere: null, mult: BLESS_HOLDING_YIELD_MULT,
  });
  return { untilTick, holderId: holders[0].id };
}

/** The receipt line's title, and its fade clause (plan § Content S3, card text). */
export const HOLDING_BLESSING_RECEIPT_TITLE = 'Holding blessed';
export const HOLDING_BLESSING_FADE_LINE = 'The blessing fades at the year\'s end.';

/**
 * The receipt line for a Bless the Holding written this tick: "{holder}'s yield from
 * {target} swells this year." plus the fade clause. Null when no blessing was written
 * now (a failed cast, an unheld place), so the receipt says nothing it did not do.
 * The holder and the place route to their pages (Law 21).
 */
export function holdingBlessingReceipt(
  graph: WorldGraph,
  godId: string,
  placeId: string | undefined,
  tick: number,
  actionId: string,
): EncounterAftermathChange | null {
  if (!placeId) return null;
  const edge = graph.getEdge(holdingBlessingEdgeId(godId, placeId));
  const props = edge?.properties as Record<string, unknown> | undefined;
  if (!edge || num(props?.tick) !== tick || !isLiveHoldingBlessing(props, tick)) return null;
  const place = graph.getNode(placeId);
  const holder = holdersOf(graph, placeId)[0];
  if (!place?.name) return null;
  const holderName = holder?.name;
  const lead = holderName ? `${holderName}'s yield` : 'Its holder\'s yield';
  const detail = `${lead} from ${place.name} swells this year. ${HOLDING_BLESSING_FADE_LINE}`;
  const holderKind = holder?.properties.actorType === 'faction' ? 'faction' as const : 'agent' as const;
  return {
    id: `${actionId}:blessed_holding`,
    kind: 'future_hook',
    title: HOLDING_BLESSING_RECEIPT_TITLE,
    detail,
    polarity: 'gain',
    subjectId: placeId,
    stateNoun: { text: place.name, entityId: placeId, visualKind: 'location', visualName: place.name },
    concepts: [
      ...(holder && holderName ? [{ text: holderName, entityId: holder.id, visualKind: holderKind, visualName: holderName }] : []),
      { text: place.name, entityId: placeId, visualKind: 'location' as const, visualName: place.name },
    ],
  };
}

/** Remove holding blessings whose year has run out. Returns how many went. */
export function sweepExpiredHoldingBlessings(graph: WorldGraph, tick: number): number {
  let removed = 0;
  for (const e of graph.getAllEdges()) {
    if (e.type !== 'blessed') continue;
    const props = e.properties as Record<string, unknown> | undefined;
    if (props?.kind !== HOLDING_BLESSING_KIND) continue;
    const until = num(props.untilTick);
    if (until !== undefined && tick < until) continue;
    graph.removeEdge(e.id);
    removed++;
  }
  return removed;
}

// ─── Claim Resource ──────────────────────────────────────────────────────────

/**
 * The good a Claim binds: the most abundant deposit at the claimed place, or — for a
 * bare hex — at any place on that hex. Ties go to the lower resource id, then place id.
 * Null when there is no deposit to claim.
 */
export function claimedGoodAt(
  graph: WorldGraph,
  col: number,
  row: number,
  targetNodeId: string | undefined,
): { resourceId: string; locationId: string } | null {
  let places: GraphNode[];
  const target = targetNodeId ? graph.getNode(targetNodeId) : undefined;
  if (target && (target.type === 'location' || isPlaceNode(target))) {
    places = [target];
  } else {
    places = getLocationNodes(graph).filter(n =>
      n.properties.hexCol === col && n.properties.hexRow === row);
  }
  let best: { resourceId: string; locationId: string; quantity: number } | null = null;
  for (const place of [...places].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    for (const [resourceId, r] of Object.entries(readResources(place.properties))) {
      const q = num(r?.quantity) ?? 0;
      if (q <= 0) continue;
      if (!best || q > best.quantity || (q === best.quantity && resourceId < best.resourceId)) {
        best = { resourceId, locationId: place.id, quantity: q };
      }
    }
  }
  return best ? { resourceId: best.resourceId, locationId: best.locationId } : null;
}

/**
 * A `claimed_good` effect's income this tick: the good's sphere × base × its stock
 * tier's multiplier. A good with no class (or no good, or the switch off) pays the
 * effect's static `perTickIncome`, today's `{ matter: 0.5 }`. An exhausted deposit
 * reads its tier as scarce.
 */
export function claimedGoodIncome(
  graph: WorldGraph,
  effect: Pick<ControlEffect, 'incomeFrom' | 'claimedGoodId' | 'claimedGoodLocationId' | 'perTickIncome'>,
): Partial<Record<SphereName, number>> | undefined {
  const fallback = effect.perTickIncome;
  if (!CLAIM_RESOURCE_PAYS_GOOD || effect.incomeFrom !== 'claimed_good') return fallback;
  const goodId = effect.claimedGoodId;
  const cls = goodId ? RESOURCE_CLASSES[goodId] : undefined;
  if (!goodId || !cls) return fallback;
  const sphere = cls.primarySphere as SphereName;
  if (!SPHERE_NAMES.includes(sphere)) return fallback;
  const place = effect.claimedGoodLocationId ? graph.getNode(effect.claimedGoodLocationId) : undefined;
  const instance = place ? readResources(place.properties)[goodId] : undefined;
  const tier = instance
    ? (instance.quantity <= 0 ? 'scarce' : instance.stockTier ?? 'adequate')
    : 'scarce';
  return { [sphere]: CLAIM_RESOURCE_BASE_INCOME * CLAIM_RESOURCE_TIER_MULT[tier] };
}

// ─── Open the Markets' thieves' guild ────────────────────────────────────────

/** Stamp the tick Open the Markets opened a settlement. */
export function markMarketsOpened(graph: WorldGraph, settlementId: string, tick: number): boolean {
  const node = graph.getNode(settlementId);
  if (!node || node.type !== 'location') return false;
  graph.updateNode(settlementId, { properties: { [MARKETS_OPENED_TICK_PROP]: tick } });
  return true;
}

/**
 * Is this town's thieves' guild offer open? From `LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS`
 * after the markets opened, for `THIEVES_GUILD_OFFER_DAYS`, while prosperity still
 * stands at `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` or above.
 */
export function thievesGuildOfferOpen(town: GraphNode | undefined, tick: number): boolean {
  const opened = num(town?.properties?.[MARKETS_OPENED_TICK_PROP]);
  if (opened === undefined) return false;
  const from = opened + LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS;
  const until = from + THIEVES_GUILD_OFFER_DAYS * TICKS_PER_DAY;
  if (tick < from || tick >= until) return false;
  const prosperity = num(town?.properties?.prosperity) ?? 0;
  return prosperity >= LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD;
}

/**
 * A mortal's leading Reach: the strongest capability, ties in `REACH_DOMAINS` order —
 * the same reading as `leadingReaches(node, 1)` (`undertakingEconomy.ts`), which
 * decides a founded guild's calling. Read here directly because that module imports
 * the faction purse, which imports this one.
 */
function leadingReachOf(node: GraphNode | undefined): ReachDomain | null {
  const caps = node?.properties.domainCapabilities as Partial<Record<string, number>> | undefined;
  if (!caps) return null;
  let best: ReachDomain | null = null;
  let bestValue = 0;
  for (const reach of REACH_DOMAINS) {
    const v = caps[reach];
    if (typeof v === 'number' && Number.isFinite(v) && v > bestValue) { best = reach; bestValue = v; }
  }
  return best;
}

/**
 * The board multiplier on `create × faction` for this decider: the boost when they
 * stand in a town whose offer is open and their leading Reach is Shadow, else 1.
 */
export function thievesGuildOfferWant(graph: WorldGraph, agentId: string, tick: number): number {
  try {
    const agent = graph.getNode(agentId);
    if (!agent) return 1;
    if (leadingReachOf(agent) !== 'shadow') return 1;
    const locId = getAgentLocationId(graph, agentId);
    const here = locId ? graph.getNode(locId) : undefined;
    const town = here && here.properties.parentLocationId !== undefined
      ? resolveToParentLocation(graph, here)
      : here;
    return thievesGuildOfferOpen(town, tick) ? THIEVES_GUILD_OFFER_WANT : 1;
  } catch {
    return 1;
  }
}

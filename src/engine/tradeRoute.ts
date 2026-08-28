/**
 * Trade Route — constants and helpers for the enriched trades_with edge system.
 *
 * Phase 1 (System 2) added these properties to trades_with edges (additive — existing volume stays):
 *   goodsType:    ResourceType   — primary resource being traded
 *   established:  number         — tick when the route was created
 *   lastTraded:   number         — tick of most recent trade action (freshness)
 *   controlledBy: string | null  — nodeId of faction/agent taxing this route
 *   threatened:   boolean        — true when bandits, war, etc. are active
 *
 * Mortal Economy P2 (THR-616) adds a cargo **manifest** — the specific goods a
 * route carries, derived from the two endpoints' stock tiers. `goodsType` stays
 * readable for legacy paths (it becomes the manifest's primary good). The manifest
 * makes routes *about specific scarcities*, which the tooltips read and the
 * route-event seeds (banditry on rich cargo, embargo on staples) score against.
 *
 * Design docs: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md (System 2),
 * Docs/plans/2026-07-04-mortal-economy-resource-web.md (§Flows, P2).
 */

import type { ResourceInstance } from '../types/resource';
import { readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';

// ─── Constants (System 2) ─────────────────────────────────────────────────

/** Maximum volume a single trades_with edge can reach */
export const TRADE_ROUTE_MAX_VOLUME = 10;

/** Volume lost per tick when a route has not been traded on recently */
export const TRADE_ROUTE_DECAY_RATE = 1;

/**
 * Ticks of inactivity (no Trade action) before volume decay begins.
 * A route that hasn't been refreshed in this many ticks starts losing volume.
 */
export const TRADE_ROUTE_FRESHNESS_WINDOW = 5;

/**
 * Ticks a **founded** route stands before the freshness rule applies to it at all
 * (THR-1320). A route carrying an `establishedBy` stamp was made by someone — it is
 * a *work*, in the holdings sense — and this is its founder's warranty.
 *
 * Why it has to exist. A route is minted at `volume: 1`; `TRADE_ROUTE_DECAY_RATE`
 * is also 1; `isRouteStale` fires at `lastTraded + TRADE_ROUTE_FRESHNESS_WINDOW`.
 * Nothing in the strategic path ever refreshes `lastTraded` — the only refreshers
 * are the divine trade verbs in `tradeRouteOps` / `graphOpExecutor`. So a route
 * founded by a **six-tick** undertaking reached volume 0 and was removed **six ticks
 * after it opened**, and measurably: 0 `trades_with` edges standing at tick 150 on
 * seeds 42 and 99, medium map. Every board-level instrument read healthy — the
 * blockade counter-play was offered and pursued 9 and 16 times — while
 * `blockadeRoute` returned `no_route` every single time, because no route was ever
 * standing to blockade.
 *
 * Why 36 rather than a rounder-sounding number. It has to outlast the counter-play's
 * whole detect-and-complete cycle, or the kind is still unreachable: one
 * `UNDERTAKING_CHECKPOINT_INTERVAL_TICKS` (6) for a warlord to notice and select the
 * candidate, plus `strategic_blockade_route`'s `projectDuration` (4) — ~10 ticks —
 * and a warlord is rarely both adjacent and motivated at the first opportunity. 36 is
 * three days (`TICKS_PER_DAY` 12), roughly three of those cycles, which leaves room
 * for the second or third warlord to be the one who comes.
 *
 * Why it is a window and not an exemption. Making a held route immortal would be the
 * larger behaviour change — routes would accumulate for the whole run and inflate
 * prosperity across the map — and it would move the dissolution of every abandoned
 * route onto paths that do not all exist yet. A window keeps the decay economy
 * intact and dying on the same rule as before; it only stops the world deleting a
 * season of work before anything can react to it.
 *
 * Scoped to founded routes deliberately: an unowned route decaying on inactivity is
 * arguably correct behaviour and is not swept up here. In practice every route
 * carries the stamp today (`createTradeRoute` is the sole minter of `trades_with`),
 * but the predicate is written on the stamp rather than on that fact.
 */
export const TRADE_ROUTE_FOUNDING_GRACE_WINDOW = 36;

// ─── Cargo manifest constants (Mortal Economy P2, THR-616) ────────────────

/**
 * Bonus added to route-formation scoring when a candidate pair is
 * complementary (surplus of a good at one end, scarcity of it at the other).
 * A scarce↔surplus pair is a route that wants to exist. Consumed by the
 * merchant route-formation candidate scoring.
 */
export const ROUTE_FORMATION_BALANCE_BIAS = 0.25;

/** Max distinct goods listed on a route manifest (keeps tooltips + events legible). */
export const ROUTE_MANIFEST_MAX_GOODS = 4;

/**
 * Fallback surplus/scarcity quantity boundaries used only when a resource
 * instance has no derived `stockTier` yet (pre-`phaseResourceStockTiers`, or a
 * legacy save). Once tiers are derived they take precedence. Mirror the abundance
 * labels in `types/resource.ts` so pre-derivation reads stay intuitive.
 */
export const ROUTE_EXPORT_QUANTITY_FLOOR = 60;
export const ROUTE_WANT_QUANTITY_CEIL = 30;

/**
 * Divisor that normalizes the summed base-value of complementary goods into the
 * ~0..1 `scoreRoutePairBalance` range. Three high-value complementary goods
 * saturate the bias; one modest good contributes a fraction.
 */
export const ROUTE_BALANCE_SCORE_DIVISOR = 3;

// ─── Catalog trade-verb constants (THR-1188) ──────────────────────────────
//
// The four `action.gold.*` trade verbs resolve their own location pair from the
// caster's anchor settlement (see `tradeRouteOps.ts`). These bound that search.

/**
 * Hex radius searched for a trade partner when `action.gold.establish-trade`
 * resolves. Wide enough that a settlement in ordinary terrain has candidates,
 * tight enough that a route stays a plausible caravan run rather than a line
 * drawn across the map. Routes formed by the merchant strategic pack are not
 * bounded by this — they pick from an ambition's own targeting rule.
 */
export const TRADE_PARTNER_MAX_HEX_RANGE = 6;

/**
 * Cap on partner candidates scored per cast. Bounds the scan on a large map
 * (NFP #7) — locations are visited in graph order and the first N within range
 * are scored, so a dense region is sampled rather than exhaustively ranked.
 */
export const TRADE_PARTNER_MAX_CANDIDATES = 24;

/**
 * Toll stamped on a route by `action.gold.tax-trade-route`. Matches the rate the
 * template carried while its op was being refused, so the verb's effect on a
 * route is unchanged from what the content author wrote — only the endpoints it
 * lands on are corrected.
 */
export const TRADE_ROUTE_DEFAULT_TAX_RATE = 0.1;

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Cargo carried by a trade route (Mortal Economy P2, THR-616).
 *
 * Derived from the two endpoints' stock tiers at formation and refreshable later.
 * Compact + self-describing so tooltips and route-event scoring read it directly
 * without re-walking the endpoints.
 */
export interface CargoManifest {
  /** Resource ids carried, highest base value first. May be empty (legacy / volume-only route). */
  goods: string[];
  /** Sum of carried goods' base values — a route's richness (banditry driver). */
  totalValue: number;
  /** True if any carried good is a staple — an embargo here reads as famine pressure. */
  carriesStaple: boolean;
}

/** An empty manifest — the canonical fail-soft value for a route with no derivable cargo. */
export const EMPTY_CARGO_MANIFEST: Readonly<CargoManifest> = {
  goods: [],
  totalValue: 0,
  carriesStaple: false,
};

/**
 * Enriched properties for a trades_with edge.
 * All fields are optional to remain backward-compatible with pre-Phase-1 edges.
 */
export interface TradeRouteProperties {
  /** Volume scale 1–TRADE_ROUTE_MAX_VOLUME; how much flows through this route */
  volume?: number;
  /** Primary resource type being traded along this route */
  goodsType?: string;
  /** Cargo manifest — the specific goods this route carries (P2, THR-616). */
  manifest?: CargoManifest;
  /**
   * Tick when this route was established.
   *
   * **Read it from here, never from a raw property bag.** Every writer in the tree
   * stamps the birth tick as `establishedTick`, not `established` — so until
   * THR-1320 this field resolved to its `0` fail-soft default on *every* route
   * ever minted. It was load-bearing in exactly one place, the `totalTicksActive`
   * on the dissolved trace, which therefore reported the absolute tick rather than
   * a lifetime. `readTradeRouteProps` now reads the spelling writers actually use
   * and keeps `established` as a legacy fallback.
   */
  established?: number;
  /**
   * NodeId of the actor who founded this route, when one did.
   *
   * Stamped by `createTradeRoute`. This is what makes a route a *work* rather than
   * weather, and it is the sole gate on the founder's grace window — see
   * `TRADE_ROUTE_FOUNDING_GRACE_WINDOW`.
   */
  establishedBy?: string | null;
  /** Tick of the most recent Trade action on this route */
  lastTraded?: number;
  /** NodeId of the faction/agent controlling (taxing) this route; null if uncontrolled */
  controlledBy?: string | null;
  /**
   * Toll levied by `controlledBy`, as a fraction of route value.
   *
   * Written by `tax_trade_route` and documented to the player in
   * `action-technical-effects.ts`, but **no subsystem reads it yet** — the
   * controller's take is not deducted anywhere (THR-1189). Typed here so the
   * field is at least first-class rather than an untyped bag entry; the
   * consumer is the open half. `controlledBy`, the other half of the same
   * stamp, *is* consumed — by `phaseEconomicTraits` (route-control count) and
   * `proseResolvers` (route status prose).
   */
  taxRate?: number;
  /** Whether this route is currently threatened (bandits, war, etc.) */
  threatened?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Read trade route properties from a raw edge properties object.
 * Fail-soft: any missing field gets its canonical default.
 */
export function readTradeRouteProps(raw: Record<string, unknown>): Required<TradeRouteProperties> {
  const goodsType = typeof raw.goodsType === 'string' ? raw.goodsType : 'unknown';
  return {
    volume: typeof raw.volume === 'number' ? raw.volume : 1,
    goodsType,
    manifest: readCargoManifest(raw.manifest, goodsType),
    // `establishedTick` is the spelling every writer uses; `established` is kept as a
    // legacy fallback for saved worlds and fixtures that carry it (THR-1320).
    established:
      typeof raw.establishedTick === 'number' ? raw.establishedTick
      : typeof raw.established === 'number' ? raw.established
      : 0,
    establishedBy: typeof raw.establishedBy === 'string' ? raw.establishedBy : null,
    lastTraded: typeof raw.lastTraded === 'number' ? raw.lastTraded : 0,
    controlledBy: raw.controlledBy != null ? (raw.controlledBy as string) : null,
    taxRate: typeof raw.taxRate === 'number' ? raw.taxRate : 0,
    threatened: typeof raw.threatened === 'boolean' ? raw.threatened : false,
  };
}

/**
 * Read a stored cargo manifest fail-soft. A legacy route with no manifest but a
 * known `goodsType` synthesizes a single-good manifest so downstream readers
 * (tooltips, route events) still see cargo. A route with neither reads empty.
 */
export function readCargoManifest(
  raw: unknown,
  goodsType: string,
): CargoManifest {
  if (raw && typeof raw === 'object' && Array.isArray((raw as CargoManifest).goods)) {
    const m = raw as CargoManifest;
    return {
      goods: m.goods.filter((g): g is string => typeof g === 'string'),
      totalValue: typeof m.totalValue === 'number' ? m.totalValue : 0,
      carriesStaple: typeof m.carriesStaple === 'boolean' ? m.carriesStaple : false,
    };
  }
  // Legacy synthesis from goodsType.
  if (goodsType && goodsType !== 'unknown') {
    const cls = getResourceClass(goodsType);
    return { goods: [goodsType], totalValue: cls.baseValue, carriesStaple: cls.category === 'staple' };
  }
  return { goods: [], totalValue: 0, carriesStaple: false };
}

// ─── Cargo manifest derivation (Mortal Economy P2, THR-616) ───────────────

/** A resource is exportable at an endpoint when it is in surplus there. */
function isExportable(inst: ResourceInstance | undefined): boolean {
  if (!inst) return false;
  if (inst.stockTier) return inst.stockTier === 'surplus';
  return (inst.quantity ?? 0) >= ROUTE_EXPORT_QUANTITY_FLOOR;
}

/** A resource is wanted at an endpoint when it is scarce or absent there. */
function isWanted(inst: ResourceInstance | undefined): boolean {
  if (!inst) return true; // the endpoint has none of this good — it wants it
  if (inst.stockTier) return inst.stockTier === 'scarce';
  return (inst.quantity ?? 0) <= ROUTE_WANT_QUANTITY_CEIL;
}

/**
 * Build a route's cargo manifest from its two endpoints' resource bags.
 *
 * A good is carried when it is in surplus at *either* endpoint (there is stock to
 * export). Goods are ranked by base value and capped at `ROUTE_MANIFEST_MAX_GOODS`,
 * so the manifest highlights the route's most valuable freight.
 *
 * Pure + deterministic (ranking is value-desc, then id-asc). Fail-soft: endpoints
 * with no resources yield the empty manifest — the route reverts to volume-only.
 */
export function buildRouteManifest(
  sourceProps: Record<string, unknown>,
  targetProps: Record<string, unknown>,
  maxGoods: number = ROUTE_MANIFEST_MAX_GOODS,
): CargoManifest {
  const src = readResources(sourceProps);
  const dst = readResources(targetProps);

  const carried = new Set<string>();
  for (const [id, inst] of Object.entries(src)) if (isExportable(inst)) carried.add(id);
  for (const [id, inst] of Object.entries(dst)) if (isExportable(inst)) carried.add(id);
  if (carried.size === 0) return { goods: [], totalValue: 0, carriesStaple: false };

  const ranked = [...carried].sort((a, b) => {
    const va = getResourceClass(a).baseValue;
    const vb = getResourceClass(b).baseValue;
    if (vb !== va) return vb - va;
    return a < b ? -1 : a > b ? 1 : 0;
  }).slice(0, Math.max(0, maxGoods));

  let totalValue = 0;
  let carriesStaple = false;
  for (const id of ranked) {
    const cls = getResourceClass(id);
    totalValue += cls.baseValue;
    if (cls.category === 'staple') carriesStaple = true;
  }
  return { goods: ranked, totalValue: Number(totalValue.toFixed(3)), carriesStaple };
}

/**
 * Complementarity score ∈ [0, 1] for a candidate route between two endpoints:
 * high when one end holds a surplus of a good the other lacks (and vice versa).
 * This is the signal behind `ROUTE_FORMATION_BALANCE_BIAS` — a scarce↔surplus
 * pair is a route that wants to exist. Pure + deterministic.
 */
export function scoreRoutePairBalance(
  sourceProps: Record<string, unknown>,
  targetProps: Record<string, unknown>,
): number {
  const src = readResources(sourceProps);
  const dst = readResources(targetProps);

  let score = 0;
  for (const [id, inst] of Object.entries(src)) {
    if (isExportable(inst) && isWanted(dst[id])) score += getResourceClass(id).baseValue;
  }
  for (const [id, inst] of Object.entries(dst)) {
    if (isExportable(inst) && isWanted(src[id])) score += getResourceClass(id).baseValue;
  }
  const normalized = score / ROUTE_BALANCE_SCORE_DIVISOR;
  return normalized < 0 ? 0 : normalized > 1 ? 1 : normalized;
}

/**
 * Determine whether a trade route should start decaying.
 * Returns true when the current tick exceeds lastTraded + TRADE_ROUTE_FRESHNESS_WINDOW.
 * Fail-soft: if lastTraded is 0 (legacy or unset), treat as established tick.
 */
export function isRouteStale(lastTraded: number, currentTick: number): boolean {
  return currentTick - lastTraded > TRADE_ROUTE_FRESHNESS_WINDOW;
}

/**
 * Whether a route is still inside its founder's warranty and so exempt from the
 * freshness rule (THR-1320). See `TRADE_ROUTE_FOUNDING_GRACE_WINDOW` for why.
 *
 * Two conditions, both required: the route was **founded** (it carries an
 * `establishedBy` stamp), and fewer than `TRADE_ROUTE_FOUNDING_GRACE_WINDOW` ticks
 * have passed since it was established. A route with no founder is weather and gets
 * no grace — which is also why the pre-existing decay tests, whose fixtures carry no
 * `establishedBy`, are untouched by this rule.
 *
 * Deliberately takes the *read* props rather than a raw bag, so the `establishedTick`
 * fallback is applied once, in `readTradeRouteProps`, and cannot be forgotten here.
 * Pure + deterministic.
 */
export function isRouteUnderFoundersGrace(
  props: Pick<Required<TradeRouteProperties>, 'establishedBy' | 'established'>,
  currentTick: number,
): boolean {
  if (!props.establishedBy) return false;
  return currentTick - props.established < TRADE_ROUTE_FOUNDING_GRACE_WINDOW;
}

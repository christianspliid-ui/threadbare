/**
 * The faction purse — income (THR-1931). Pure: reads the graph and a realm projection,
 * never writes. The five sources of the THR-1867 decision:
 *
 *   1. town tax    — one tax holder per settlement (`taxHolderOf`)
 *   2. place yield — held places with a resource bag (read only; stocks are never drained)
 *   3. land rent   — realms only, per hex inside their border
 *   4. tolls       — `trades_with` lanes whose `controlledBy` is the faction
 *   5. guild work  — affinity factions, in every town where they keep a hall or members;
 *                    the town's tax holder takes `LANDHOLDER_TAX_RATE` of it
 *
 * The crown (THR-1932) changes *who* the tax holder is; it replaces `taxHolderOf` alone.
 *
 * PRNG: none. Every tie is broken by a fixed key (influence, establishedTick, id).
 */

import { holdingBlessingMult } from '../godsStake';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { HexCoord } from '../../types';
import { readTradeRouteProps } from '../tradeRoute';
import { readResources } from '../resourceEconomy';
import { getResourceClass } from '../../data/resource-classes';
import { WEALTH_ROUTE_CONTROL_INCOME } from '../wealth';
import { isPlaceNode } from '../sublocationShape';
import { scarcityRentFor } from '../regionalMonopoly';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { RUINED_SETTLEMENT_PROSPERITY_FLOOR } from '../../data/strategic-action-constants';
import {
  TOWN_TAX_BASE,
  TOWN_TAX_PROSPERITY_PIVOT,
  LAWLESS_TOWN_TAX_FACTOR,
  SETTLEMENT_TIER_SUBTYPES,
  YIELD_RATE,
  STOCK_TIER_MULT,
  TERRAIN_RENT_CATEGORY,
  HEX_RENT,
  GUILD_RATE,
  GUILD_SUBLOCATION_UNITS,
  GUILD_LANE_UNITS,
  BANKER_TAX_BASE_SHARE,
  LANDHOLDER_TAX_RATE,
  GUILD_PLACE_AFFINITY,
  DEFINITION_FACTION_AFFINITY,
  PURSE_EXCLUDED_FACTION_TYPES,
  HELD_BUILDING_DUES,
  type GuildAffinity,
} from '../../data/faction-purse-constants';
import { buildingForPlaceType } from '../../data/settlement-buildings';

// ─── Shapes ───────────────────────────────────────────────────────────────

export interface PurseIncome {
  townTax: number;
  placeYield: number;
  landRent: number;
  tolls: number;
  guildWork: number;
  /** Guild work collected from other factions' guilds in towns this faction holds. */
  guildTaxIn: number;
  /** Guild work this faction handed to a town's tax holder. Already netted out of `guildWork`. */
  guildTaxOut: number;
}

export type PurseSourceKind = 'town' | 'place' | 'land' | 'lane' | 'guild';

export interface PurseSource {
  kind: PurseSourceKind;
  /** The settlement, place, lane (edge id), realm (land) or town (guild work) that paid. */
  nodeId: string;
  amount: number;
}

export interface FactionIncomeDay {
  income: PurseIncome;
  sources: PurseSource[];
  /** Settlements this faction collected town tax from today. */
  taxHolderOf: string[];
  /** Tax holder → guild work this faction paid it. */
  guildTaxPaidTo: Map<string, number>;
}

/** What the income pass needs from the world besides the graph. */
export interface PurseWorldContext {
  /** `"col,row"` → realm id (the cached realm projection). */
  hexRealmId: ReadonlyMap<string, string>;
  /** realm id → the hexes inside its border. */
  realmHexes: ReadonlyMap<string, readonly HexCoord[]>;
  /** `"col,row"` → terrain id. */
  tileTerrain: ReadonlyMap<string, string>;
  /**
   * THR-1969 — today's tick, so a place under the god's holding blessing pays its
   * holder ×`BLESS_HOLDING_YIELD_MULT`. Absent → no blessing is live.
   */
  tick?: number;
}

export function emptyIncome(): PurseIncome {
  return { townTax: 0, placeYield: 0, landRent: 0, tolls: 0, guildWork: 0, guildTaxIn: 0, guildTaxOut: 0 };
}

export function totalIncome(i: PurseIncome): number {
  // guildWork is already net of guildTaxOut; guildTaxIn is someone else's gross share.
  return i.townTax + i.placeYield + i.landRent + i.tolls + i.guildWork + i.guildTaxIn;
}

// ─── Small readers ────────────────────────────────────────────────────────

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function isFactionNode(n: GraphNode | undefined): n is GraphNode {
  return n !== undefined && n.type === 'actor' && n.properties.actorType === 'faction';
}

/** Whether a faction earns and pays at all (monster lairs are not an economy). */
export function isPurseFaction(n: GraphNode | undefined): n is GraphNode {
  if (!isFactionNode(n)) return false;
  const t = n.properties.factionType;
  return !(typeof t === 'string' && PURSE_EXCLUDED_FACTION_TYPES.includes(t));
}

function subtypeOf(n: GraphNode): string {
  return String(n.properties.locationSubtype ?? n.properties.locationType ?? '');
}

export function isSettlement(n: GraphNode | undefined): n is GraphNode {
  return n !== undefined && n.type === 'location' && SETTLEMENT_TIER_SUBTYPES.includes(subtypeOf(n));
}

/** The Place-type id with its `sublocation-type.` prefix stripped. */
function placeTypeOf(n: GraphNode): string {
  return String(n.properties.sublocationTypeId ?? n.properties.locationSubtype ?? '').replace('sublocation-type.', '');
}

/** The affinity row a faction earns guild work under, or undefined. */
export function affinityOf(faction: GraphNode): GuildAffinity | undefined {
  const guildType = faction.properties.guildType;
  if (typeof guildType === 'string' && GUILD_PLACE_AFFINITY[guildType]) return GUILD_PLACE_AFFINITY[guildType];
  const defId = faction.properties.factionDefId;
  if (typeof defId === 'string') {
    const key = DEFINITION_FACTION_AFFINITY[defId];
    if (key) return GUILD_PLACE_AFFINITY[key];
  }
  return undefined;
}

/** The affinity key (row name) — for keying same-affinity splits. */
export function affinityKeyOf(faction: GraphNode): string | undefined {
  const guildType = faction.properties.guildType;
  if (typeof guildType === 'string' && GUILD_PLACE_AFFINITY[guildType]) return guildType;
  const defId = faction.properties.factionDefId;
  return typeof defId === 'string' ? DEFINITION_FACTION_AFFINITY[defId] : undefined;
}

function hexKeyOf(n: GraphNode | undefined): string | null {
  const col = num(n?.properties.hexCol);
  const row = num(n?.properties.hexRow);
  return col === null || row === null ? null : `${col},${row}`;
}

/** The place-tier Location a node stands for (a Place resolves to its parent). */
function outerLocationId(graph: WorldGraph, id: string): string | null {
  const n = graph.getNode(id);
  if (!n || n.type !== 'location') return null;
  if (!isPlaceNode(n)) return n.id;
  const parent = n.properties.parentLocationId;
  return typeof parent === 'string' && graph.getNode(parent) ? parent : null;
}

// ─── 1. Tax holder ────────────────────────────────────────────────────────

/**
 * The one faction that collects a held place's tax and yield.
 *
 * The realm whose border holds the place's hex, if that realm has a `controls` edge to
 * it; else the controller with the highest edge `influence` (missing = 0), ties by
 * earliest `establishedTick`, then faction id. Null when no faction controls it.
 */
export function taxHolderOf(
  graph: WorldGraph,
  placeId: string,
  hexRealmId: ReadonlyMap<string, string>,
): string | null {
  const controllers = graph.getIncomingEdges(placeId, 'controls')
    .filter(e => isFactionNode(graph.getNode(e.source)));
  if (controllers.length === 0) return null;
  if (controllers.length === 1) return controllers[0].source;

  const place = graph.getNode(placeId);
  const ground = place && isPlaceNode(place)
    ? graph.getNode(String(place.properties.parentLocationId ?? ''))
    : place;
  const hk = hexKeyOf(ground);
  const borderRealm = hk ? hexRealmId.get(hk) : undefined;
  if (borderRealm && controllers.some(e => e.source === borderRealm)) return borderRealm;

  const ranked = [...controllers].sort((a, b) => {
    const ia = num(a.properties?.influence) ?? 0;
    const ib = num(b.properties?.influence) ?? 0;
    if (ia !== ib) return ib - ia;
    const ta = num(a.properties?.establishedTick) ?? 0;
    const tb = num(b.properties?.establishedTick) ?? 0;
    if (ta !== tb) return ta - tb;
    return a.source < b.source ? -1 : a.source > b.source ? 1 : 0;
  });
  return ranked[0].source;
}

// ─── Per-source formulas ──────────────────────────────────────────────────

/**
 * Town tax a settlement pays its holder today. A ruin pays nothing; no prosperity reads as the pivot.
 * THR-1934 — given the graph, a Lawless town (a `has_trait` edge to the lawless trait) pays
 * `LAWLESS_TOWN_TAX_FACTOR` of it. Without a graph the result is unchanged.
 */
export function townTaxOf(settlement: GraphNode, graph?: WorldGraph): number {
  if (!isSettlement(settlement)) return 0;
  const prosperity = num(settlement.properties.prosperity) ?? TOWN_TAX_PROSPERITY_PIVOT;
  if (prosperity <= RUINED_SETTLEMENT_PROSPERITY_FLOOR) return 0;
  const tax = TOWN_TAX_BASE * prosperity / TOWN_TAX_PROSPERITY_PIVOT;
  const lawless = graph?.getOutgoingEdges(settlement.id, 'has_trait')
    .some(e => e.target === LOCATION_TRAIT_IDS.lawless) ?? false;
  return lawless ? tax * LAWLESS_TOWN_TAX_FACTOR : tax;
}

/**
 * What a held place's resource bag yields today. Read only.
 * THR-1955 — `rentFor` (optional) multiplies one resource's line: the holder's regional
 * monopoly scarcity rent (`MONOPOLY_SCARCITY_RENT`). Omitted = every line × 1.
 */
export function placeYieldOf(place: GraphNode, rentFor?: (resourceId: string) => number): number {
  let sum = 0;
  for (const [rid, r] of Object.entries(readResources(place.properties))) {
    const q = num((r as { quantity?: unknown }).quantity) ?? 0;
    if (q <= 0) continue;
    const rate = YIELD_RATE[getResourceClass(rid).category] ?? 0;
    const tier = (r as { stockTier?: unknown }).stockTier;
    const mult = typeof tier === 'string' ? (STOCK_TIER_MULT[tier] ?? 1) : 1;
    sum += (q / 100) * rate * mult * (rentFor ? rentFor(rid) : 1);
  }
  return sum;
}

/**
 * THR-2077 — the dues a faction-held town building pays (`HELD_BUILDING_DUES`), scaled by
 * its town's prosperity as town tax is. Keyed on the Place type, not the building stamp,
 * so a mill taken up with no free slot pays the same. A ruined or missing town pays 0.
 */
export function heldBuildingDuesOf(graph: WorldGraph, place: GraphNode): number {
  if (!isPlaceNode(place)) return 0;
  const typeId = place.properties.sublocationTypeId;
  const def = typeof typeId === 'string' ? buildingForPlaceType(typeId) : undefined;
  const dues = def ? HELD_BUILDING_DUES[def.id] : undefined;
  if (!dues) return 0;
  const town = graph.getNode(String(place.properties.parentLocationId ?? ''));
  if (!isSettlement(town)) return 0;
  const prosperity = num(town.properties.prosperity) ?? TOWN_TAX_PROSPERITY_PIVOT;
  if (prosperity <= RUINED_SETTLEMENT_PROSPERITY_FLOOR) return 0;
  return dues * prosperity / TOWN_TAX_PROSPERITY_PIVOT;
}

/** Land rent over a realm's border hexes. Unknown terrain rents nothing. */
export function landRentOf(hexes: readonly HexCoord[], tileTerrain: ReadonlyMap<string, string>): number {
  let sum = 0;
  for (const h of hexes) {
    const t = tileTerrain.get(`${h.col},${h.row}`);
    if (!t) continue;
    sum += HEX_RENT[TERRAIN_RENT_CATEGORY[t] ?? 'none'] ?? 0;
  }
  return sum;
}

/** Holding income's toll formula, unchanged (`holdingIncome.ts`). */
export function tollOf(raw: Record<string, unknown>): number {
  const p = readTradeRouteProps(raw);
  if (p.threatened || p.volume <= 0) return 0;
  return WEALTH_ROUTE_CONTROL_INCOME * Math.max(1, Math.round(p.volume * p.taxRate));
}

/** Guild work units an affinity matches at one town. */
export function guildUnitsAt(graph: WorldGraph, aff: GuildAffinity, townId: string): number {
  const town = graph.getNode(townId);
  if (!town) return 0;
  const places = graph.getOutgoingEdges(townId, 'contains')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => n !== undefined && n.type === 'location');
  let units = 0;
  if (aff.resources.length > 0) {
    for (const node of [town, ...places]) {
      const bag = readResources(node.properties);
      for (const rid of aff.resources) units += num((bag[rid] as { quantity?: unknown } | undefined)?.quantity) ?? 0;
    }
  }
  if (aff.sublocationTypes.length > 0) {
    for (const p of places) if (aff.sublocationTypes.includes(placeTypeOf(p))) units += GUILD_SUBLOCATION_UNITS;
  }
  if (aff.lanes) {
    const lanes = [...graph.getOutgoingEdges(townId, 'trades_with'), ...graph.getIncomingEdges(townId, 'trades_with')];
    for (const e of lanes) {
      if (readTradeRouteProps(e.properties as Record<string, unknown>).volume > 0) units += GUILD_LANE_UNITS;
    }
  }
  if (aff.townTaxShare) units += (num(town.properties.prosperity) ?? 0) * BANKER_TAX_BASE_SHARE;
  return units;
}

/**
 * Towns where each affinity faction keeps a hall or members — one pass over the
 * affinity factions' own `located_at` edges, home, and their members' `located_at`.
 * Built once per pay day so guild work never scans every member per faction.
 */
export function guildPresenceIndex(graph: WorldGraph, factions: readonly GraphNode[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const f of factions) {
    if (!affinityOf(f)) continue;
    const towns = new Set<string>();
    const add = (id: unknown) => {
      if (typeof id !== 'string') return;
      const outer = outerLocationId(graph, id);
      if (outer && isSettlement(graph.getNode(outer))) towns.add(outer);
    };
    add(f.properties.homeLocationId);
    for (const e of graph.getOutgoingEdges(f.id, 'located_at')) add(e.target);
    for (const m of graph.getIncomingEdges(f.id, 'member_of')) {
      const member = graph.getNode(m.source);
      if (!member || member.properties.armyState) continue;
      for (const e of graph.getOutgoingEdges(m.source, 'located_at')) add(e.target);
    }
    out.set(f.id, towns);
  }
  return out;
}

// ─── The day ──────────────────────────────────────────────────────────────

/**
 * One day's income for every purse faction. Pure. Factions in id order; every map
 * iteration below is over id-sorted inputs, so the result is deterministic.
 */
export function computePurseIncome(
  graph: WorldGraph,
  factions: readonly GraphNode[],
  ctx: PurseWorldContext,
): Map<string, FactionIncomeDay> {
  const out = new Map<string, FactionIncomeDay>();
  for (const f of factions) {
    out.set(f.id, { income: emptyIncome(), sources: [], taxHolderOf: [], guildTaxPaidTo: new Map() });
  }
  const add = (factionId: string, kind: PurseSourceKind, nodeId: string, amount: number) => {
    if (amount <= 0) return;
    const day = out.get(factionId);
    if (!day) return;
    const existing = day.sources.find(s => s.kind === kind && s.nodeId === nodeId);
    if (existing) existing.amount += amount; else day.sources.push({ kind, nodeId, amount });
  };

  // 1–2. Town tax and place yield: every controlled place, paid once, to its holder.
  const controlled = new Set<string>();
  for (const f of factions) for (const e of graph.getOutgoingEdges(f.id, 'controls')) controlled.add(e.target);
  for (const placeId of [...controlled].sort()) {
    const place = graph.getNode(placeId);
    if (!place || place.type !== 'location') continue;
    const holder = taxHolderOf(graph, placeId, ctx.hexRealmId);
    if (!holder) continue;
    const day = out.get(holder);
    if (!day) continue;
    // THR-1969 — Bless the Holding multiplies this place's tax and yield terms while it lasts.
    const blessing = holdingBlessingMult(graph, placeId, ctx.tick);
    const tax = townTaxOf(place, graph) * blessing;
    if (tax > 0) {
      day.income.townTax += tax;
      day.taxHolderOf.push(placeId);
      add(holder, 'town', placeId, tax);
    }
    // THR-2077 — a held town building (the guild's mill) pays its dues beside the yield.
    const yieldAmount = (placeYieldOf(place, scarcityRentFor(graph, holder, place)) + heldBuildingDuesOf(graph, place)) * blessing;
    if (yieldAmount > 0) {
      day.income.placeYield += yieldAmount;
      add(holder, isSettlement(place) ? 'town' : 'place', placeId, yieldAmount);
    }
  }

  // 3. Land rent: realms only, over the cached projection's border.
  for (const [realmId, hexes] of ctx.realmHexes) {
    const day = out.get(realmId);
    if (!day) continue;
    const rent = landRentOf(hexes, ctx.tileTerrain);
    day.income.landRent += rent;
    add(realmId, 'land', realmId, rent);
  }

  // 4. Tolls.
  for (const e of graph.getAllEdges()) {
    if (e.type !== 'trades_with') continue;
    const by = (e.properties as Record<string, unknown> | undefined)?.controlledBy;
    if (typeof by !== 'string' || !out.has(by)) continue;
    const toll = tollOf(e.properties as Record<string, unknown>);
    out.get(by)!.income.tolls += toll;
    add(by, 'lane', e.id, toll);
  }

  // 5. Guild work — split among same-affinity factions present in the same town (the
  // prototype's rule), then the town's tax holder takes its cut.
  const presence = guildPresenceIndex(graph, factions);
  const byTownAffinity = new Map<string, string[]>();
  for (const f of factions) {
    const key = affinityKeyOf(f);
    if (!key) continue;
    for (const town of presence.get(f.id) ?? []) {
      const k = `${town}|${key}`;
      const list = byTownAffinity.get(k);
      if (list) list.push(f.id); else byTownAffinity.set(k, [f.id]);
    }
  }
  for (const k of [...byTownAffinity.keys()].sort()) {
    const [townId, key] = k.split('|');
    const members = byTownAffinity.get(k)!;
    const gross = guildUnitsAt(graph, GUILD_PLACE_AFFINITY[key], townId) / 100 * GUILD_RATE / members.length;
    if (gross <= 0) continue;
    const holder = taxHolderOf(graph, townId, ctx.hexRealmId);
    for (const fid of members) {
      const day = out.get(fid)!;
      const cut = holder && holder !== fid ? gross * LANDHOLDER_TAX_RATE : 0;
      day.income.guildWork += gross - cut;
      add(fid, 'guild', townId, gross - cut);
      if (cut > 0 && holder) {
        day.income.guildTaxOut += cut;
        day.guildTaxPaidTo.set(holder, (day.guildTaxPaidTo.get(holder) ?? 0) + cut);
        const holderDay = out.get(holder);
        if (holderDay) {
          holderDay.income.guildTaxIn += cut;
          add(holder, 'town', townId, cut);
        }
      }
    }
  }

  return out;
}

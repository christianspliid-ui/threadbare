/**
 * regionalMonopoly.ts — regional monopolies and the embargo they allow (THR-1955).
 *
 * Plan: `Docs/plans/2026-10-15-thr-1933-war-aims.md` § Engine 6–10 (war aims slice S2).
 *
 * **The regional rule (§ 6).** For each resource, the bearing places are the place-tier
 * Locations (`getLocationNodes`) whose resource bag carries it. A faction holds a regional
 * monopoly on the resource when, around some anchor place it holds, at least
 * `MONOPOLY_REGION_MIN_PLACES` bearing places lie within `MONOPOLY_REGION_RADIUS_HEXES`
 * and it holds at least `MONOPOLY_CONTROL_FRACTION` of them. Qualifying anchors are kept
 * by most held places (ties by id); a second anchor within the radius of a kept one is
 * the same region, so a faction may hold one resource in two regions but never twice in
 * one. 60% is exclusive inside a region, so two factions cannot hold the same one.
 *
 * **The embargo (§ 9).** One `activeEmbargo` record on the holder names its target, the
 * good and the region's anchor. Nothing is written on towns or lanes: `embargoedTownsOf`
 * and `embargoedLanesOf` derive them, so the stock pass, the Trade lens and the debug
 * view read one source.
 *
 * **One holder rule.** Every question this subsystem asks about who holds a place — the
 * bearing index's controller, the embargo's target towns, the war-aim break and complete
 * bonuses — goes through `taxHolderOf` with the realm projection's `hexRealmId` (callers get
 * it from `realmBorderMap`), the same rule the purse and the war aims use. A guild-plus-realm
 * town is the border realm's for every reader, so counting, embargo, rent and bonuses agree.
 * Every helper takes the map as an optional last argument; without it (tests, no runtime)
 * `taxHolderOf` falls back to the strongest controller.
 *
 * Pure helpers only — every caller passes the graph; nothing here is cached (the graph is
 * mutated in place, CLAUDE.md load-bearing decisions).
 *
 * NFP #4 Fail-soft: a place with no hex, a malformed record or a missing node is skipped.
 */

import type { WorldGraph } from './graph';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { HexCoord } from '../types';
import { hexDistance } from '../lib/hexMath';
import { getLocationNodes } from './sublocationShape';
import { readResources } from './resourceEconomy';
import { taxHolderOf, isFactionNode, isSettlement } from './factionPurse/income';
import { hexOfLocation } from './warAims/context';
import { MONOPOLY_CONTROL_FRACTION } from '../data/economic-power-config';
import {
  REGIONAL_MONOPOLY_ENABLED,
  MONOPOLY_REGION_RADIUS_HEXES,
  MONOPOLY_REGION_MIN_PLACES,
  MONOPOLY_SCARCITY_RENT,
} from '../data/regional-monopoly-constants';

// ─── Shapes ──────────────────────────────────────────────────────────────────

/** One regional monopoly, stored on the holding faction (`regionalMonopolies`). */
export interface RegionalMonopoly {
  resourceId: string;
  /** The holder's bearing place with the most of its own bearing places in reach. */
  anchorLocationId: string;
  /** Held share of the region's bearing places, 0..1. */
  share: number;
  /** The holder's bearing places in the region, id-sorted. */
  placeIds: string[];
  /** Tick the region was first held (kept across days while it stands). */
  sinceTick: number;
}

/** The holder's one standing embargo (`activeEmbargo`). */
export interface ActiveEmbargo {
  targetFactionId: string;
  resourceId: string;
  anchorLocationId: string;
  untilTick: number;
}

/** A place-tier Location bearing at least one resource. */
export interface BearingPlace {
  id: string;
  hex: HexCoord;
  controllerId: string | null;
}

/** Resource id → its bearing places, id-sorted. */
export type BearingIndex = Map<string, BearingPlace[]>;

const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

// ─── Bearing index ───────────────────────────────────────────────────────────

/**
 * The one faction that holds a bearing place: its tax holder (the `controls` edge with
 * the highest influence), else an action-written `monopolyControlledBy`.
 */
export function controllerOfPlace(graph: WorldGraph, place: GraphNode, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): string | null {
  const holder = taxHolderOf(graph, place.id, hexRealmId);
  if (holder) return holder;
  const by = place.properties.monopolyControlledBy;
  return typeof by === 'string' && isFactionNode(graph.getNode(by)) ? by : null;
}

/** Every resource's place-tier bearing places, with hex and holder. */
export function buildBearingIndex(graph: WorldGraph, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): BearingIndex {
  const index: BearingIndex = new Map();
  for (const loc of getLocationNodes(graph)) {
    const hex = hexOfLocation(graph, loc);
    if (!hex) continue;
    const bag = readResources(loc.properties);
    let place: BearingPlace | null = null;
    for (const [rid, r] of Object.entries(bag)) {
      if ((num((r as { quantity?: unknown }).quantity) ?? 0) <= 0) continue;
      place ??= { id: loc.id, hex, controllerId: controllerOfPlace(graph, loc, hexRealmId) };
      const list = index.get(rid);
      if (list) list.push(place); else index.set(rid, [place]);
    }
  }
  for (const list of index.values()) list.sort(byId);
  return index;
}

// ─── The regional rule ───────────────────────────────────────────────────────

/** Share and held places of `factionId` within the radius of `anchor` among `places`. */
export function regionShare(
  places: readonly BearingPlace[],
  anchor: HexCoord,
  isHeld: (p: BearingPlace) => boolean,
): { total: number; held: BearingPlace[] } {
  const held: BearingPlace[] = [];
  let total = 0;
  for (const p of places) {
    if (hexDistance(p.hex, anchor) > MONOPOLY_REGION_RADIUS_HEXES) continue;
    total++;
    if (isHeld(p)) held.push(p);
  }
  return { total, held };
}

/** Whether a held share of a region of `total` places is a monopoly. */
export function isMonopolyShare(held: number, total: number): boolean {
  return total >= MONOPOLY_REGION_MIN_PLACES && held / total >= MONOPOLY_CONTROL_FRACTION;
}

/**
 * Today's regional monopolies, by holder. `sinceTick` is left at `tick`; the phase carries
 * the earlier value across for a region that still stands.
 */
export function computeRegionalMonopolies(index: BearingIndex, tick: number): Map<string, RegionalMonopoly[]> {
  const out = new Map<string, RegionalMonopoly[]>();
  for (const rid of [...index.keys()].sort()) {
    const places = index.get(rid)!;
    const holders = [...new Set(places.map(p => p.controllerId).filter((x): x is string => x !== null))].sort();
    for (const factionId of holders) {
      const qualifying: { anchor: BearingPlace; held: BearingPlace[]; total: number }[] = [];
      for (const anchor of places) {
        if (anchor.controllerId !== factionId) continue;
        const r = regionShare(places, anchor.hex, p => p.controllerId === factionId);
        if (isMonopolyShare(r.held.length, r.total)) qualifying.push({ anchor, held: r.held, total: r.total });
      }
      qualifying.sort((a, b) => (b.held.length - a.held.length) || byId(a.anchor, b.anchor));
      const kept: typeof qualifying = [];
      for (const q of qualifying) {
        if (kept.some(k => hexDistance(k.anchor.hex, q.anchor.hex) <= MONOPOLY_REGION_RADIUS_HEXES)) continue;
        kept.push(q);
      }
      if (kept.length === 0) continue;
      const list = out.get(factionId) ?? [];
      for (const k of kept) {
        list.push({
          resourceId: rid,
          anchorLocationId: k.anchor.id,
          share: k.held.length / k.total,
          placeIds: k.held.map(p => p.id),
          sinceTick: tick,
        });
      }
      out.set(factionId, list);
    }
  }
  return out;
}

// ─── Readers ─────────────────────────────────────────────────────────────────

/** The faction's stored regional monopolies. Fail-soft: malformed rows are dropped. */
export function readRegionalMonopolies(props: Record<string, unknown> | undefined): RegionalMonopoly[] {
  const raw = props?.regionalMonopolies;
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is RegionalMonopoly =>
    !!m && typeof m === 'object'
    && typeof (m as RegionalMonopoly).resourceId === 'string'
    && typeof (m as RegionalMonopoly).anchorLocationId === 'string'
    && Array.isArray((m as RegionalMonopoly).placeIds));
}

/** The faction's standing embargo, or null. */
export function readActiveEmbargo(props: Record<string, unknown> | undefined): ActiveEmbargo | null {
  const e = props?.activeEmbargo as Partial<ActiveEmbargo> | null | undefined;
  if (!e || typeof e !== 'object') return null;
  if (typeof e.targetFactionId !== 'string' || typeof e.resourceId !== 'string'
    || typeof e.anchorLocationId !== 'string' || typeof e.untilTick !== 'number') return null;
  return e as ActiveEmbargo;
}

/** The hex of a location node by id (a sublocation resolves to its parent's hex). */
export function hexOfLocationId(graph: WorldGraph, id: string): HexCoord | null {
  return hexOfLocation(graph, graph.getNode(id));
}

/**
 * The regional monopoly of `factionId` on `resourceId` whose region holds the hex, or null.
 * Used by the purse's scarcity rent and by the Trade lens's monopoly line.
 */
export function monopolyCovering(
  graph: WorldGraph,
  factionId: string,
  resourceId: string,
  hex: HexCoord,
): RegionalMonopoly | null {
  for (const m of readRegionalMonopolies(graph.getNode(factionId)?.properties)) {
    if (m.resourceId !== resourceId) continue;
    const anchor = hexOfLocationId(graph, m.anchorLocationId);
    if (anchor && hexDistance(anchor, hex) <= MONOPOLY_REGION_RADIUS_HEXES) return m;
  }
  return null;
}

/**
 * The purse's scarcity rent for one held place (plan § Engine 7): a resource the holder
 * monopolises in the region containing the place pays `MONOPOLY_SCARCITY_RENT`. Returns
 * undefined (no multiplier) when the rule is off, the holder holds no monopoly, or the
 * place has no hex.
 */
export function scarcityRentFor(
  graph: WorldGraph,
  holderId: string,
  place: GraphNode,
): ((resourceId: string) => number) | undefined {
  if (!REGIONAL_MONOPOLY_ENABLED) return undefined;
  const monopolies = readRegionalMonopolies(graph.getNode(holderId)?.properties);
  if (monopolies.length === 0) return undefined;
  const hex = hexOfLocation(graph, place);
  if (!hex) return undefined;
  return (rid: string) => (monopolyCovering(graph, holderId, rid, hex) ? MONOPOLY_SCARCITY_RENT : 1);
}

/** Every faction's regional monopolies, holder id-sorted. */
export function allRegionalMonopolies(graph: WorldGraph): { factionId: string; monopoly: RegionalMonopoly }[] {
  const out: { factionId: string; monopoly: RegionalMonopoly }[] = [];
  const factions = graph.getNodesByType('actor').filter(isFactionNode).sort(byId);
  for (const f of factions) for (const m of readRegionalMonopolies(f.properties)) out.push({ factionId: f.id, monopoly: m });
  return out;
}

// ─── Embargo derivation ──────────────────────────────────────────────────────

/** The target's settlements inside the embargo's region, id-sorted. */
export function embargoedTownsOf(graph: WorldGraph, record: ActiveEmbargo, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): GraphNode[] {
  const anchor = hexOfLocationId(graph, record.anchorLocationId);
  if (!anchor) return [];
  const out: GraphNode[] = [];
  for (const loc of getLocationNodes(graph)) {
    if (!isSettlement(loc)) continue;
    const hex = hexOfLocation(graph, loc);
    if (!hex || hexDistance(hex, anchor) > MONOPOLY_REGION_RADIUS_HEXES) continue;
    if (taxHolderOf(graph, loc.id, hexRealmId) !== record.targetFactionId) continue;
    out.push(loc);
  }
  return out.sort(byId);
}

/** The `trades_with` lanes between an embargoed town and another place in the region. */
export function embargoedLanesOf(graph: WorldGraph, record: ActiveEmbargo, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): GraphEdge[] {
  const anchor = hexOfLocationId(graph, record.anchorLocationId);
  if (!anchor) return [];
  const towns = new Set(embargoedTownsOf(graph, record, hexRealmId).map(t => t.id));
  if (towns.size === 0) return [];
  const out: GraphEdge[] = [];
  for (const e of graph.getEdgesByType('trades_with')) {
    const inTown = towns.has(e.source) || towns.has(e.target);
    if (!inTown) continue;
    const other = towns.has(e.source) ? e.target : e.source;
    const hex = hexOfLocationId(graph, other);
    if (!hex || hexDistance(hex, anchor) > MONOPOLY_REGION_RADIUS_HEXES) continue;
    out.push(e);
  }
  return out.sort(byId);
}

/** Every standing embargo in the world, with its holder, holder id-sorted. */
export function allActiveEmbargoes(graph: WorldGraph): { holderId: string; record: ActiveEmbargo }[] {
  const out: { holderId: string; record: ActiveEmbargo }[] = [];
  const factions = graph.getNodesByType('actor').filter(isFactionNode).sort(byId);
  for (const f of factions) {
    const record = readActiveEmbargo(f.properties);
    if (record) out.push({ holderId: f.id, record });
  }
  return out;
}

/** Location id → the resource ids an embargo cuts there (the stock pass's balance term). */
export function embargoCutsByLocation(graph: WorldGraph, hexRealmId: ReadonlyMap<string, string> = NO_REALM_MAP): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const { record } of allActiveEmbargoes(graph)) {
    for (const town of embargoedTownsOf(graph, record, hexRealmId)) {
      const set = out.get(town.id) ?? new Set<string>();
      set.add(record.resourceId);
      out.set(town.id, set);
    }
  }
  return out;
}

/**
 * The land a settlement works (THR-1923, plan § Resolution logic 1).
 *
 * Pure reads over the graph and the tiles: which settlements take part, which hexes each
 * owns, what an owned hex yields, and which special goods lie in reach. Nothing here
 * writes.
 *
 * **Hex ownership.** A hex within `WORK_RADIUS` of one or more settlements goes, in order:
 * to the settlement whose holder is the realm claiming the hex; else to the nearest; ties
 * to the lower location id. It is recomputed once a day from the live `controls` edges —
 * thirty-odd settlements × thirty-seven hexes is cheaper than a cache keyed on structure,
 * and it can never go stale (NFP #7: measured before optimising; the heavy test pins the
 * phase's per-day cost).
 *
 * Deterministic (NFP #3): settlements in id order, ties by id. Fail-soft (NFP #4): a
 * settlement with no hex works only its centre.
 */
import type { HexTile, TerrainType } from '../../types';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { hexDistance } from '../../lib/hexMath';
import { hexKey } from '../../lib/hexKey';
import { getLocationNodes } from '../sublocationShape';
import { readResources } from '../resourceEconomy';
import {
  TERRAIN_YIELDS,
  DEPOSIT_YIELD_CHANNEL,
  UNWORKABLE_TERRAINS,
  YIELD_CHANNELS,
  type YieldTriple,
} from '../../data/terrain-yields';
import {
  WORK_RADIUS,
  DEPOSIT_YIELD_DIVISOR,
  ORE_SPECIAL_MIN,
  SETTLEMENT_TIERS,
  type SettlementTier,
} from '../../data/settlement-economy-constants';
import {
  SPECIAL_GOOD_BY_PLACE_SUBTYPE,
  SPECIAL_GOOD_BY_DEPOSIT,
  type SpecialGood,
} from '../../data/special-goods';

export type Yield = [number, number, number];

const TIER_SET: ReadonlySet<string> = new Set(SETTLEMENT_TIERS);

export function isSettlementTier(subtype: unknown): subtype is SettlementTier {
  return typeof subtype === 'string' && TIER_SET.has(subtype);
}

/** A place-tier Location of subtype hamlet / town / city / capital. */
export function isEconomySettlement(node: GraphNode | undefined): boolean {
  return !!node && node.type === 'location'
    && node.properties?.parentLocationId === undefined
    && isSettlementTier(node.properties?.locationSubtype);
}

/** Every economy settlement, in id order. */
export function getEconomySettlements(graph: WorldGraph): GraphNode[] {
  return getLocationNodes(graph)
    .filter(n => isEconomySettlement(n))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function hexOf(node: GraphNode | undefined): { col: number; row: number } | null {
  const col = node?.properties?.hexCol;
  const row = node?.properties?.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : null;
}

/** A non-settlement place-tier Location standing on a hex: a mine, a gem deposit, a grove. */
export interface LandPlace {
  readonly id: string;
  readonly hex: { col: number; row: number };
  readonly key: string;
  readonly subtype: string | undefined;
  readonly resources: Readonly<Record<string, { quantity?: number }>>;
}

/** The per-day land index: terrain by hex, and the places standing on hexes. */
export interface LandIndex {
  readonly terrainByKey: ReadonlyMap<string, TerrainType>;
  readonly tiles: readonly HexTile[];
  readonly placesByKey: ReadonlyMap<string, readonly LandPlace[]>;
  readonly places: readonly LandPlace[];
}

export function buildLandIndex(graph: WorldGraph, tiles: readonly HexTile[]): LandIndex {
  const terrainByKey = new Map<string, TerrainType>();
  for (const t of tiles) terrainByKey.set(hexKey(t.coord.col, t.coord.row), t.terrain);
  const placesByKey = new Map<string, LandPlace[]>();
  const places: LandPlace[] = [];
  for (const node of getLocationNodes(graph)) {
    if (isEconomySettlement(node)) continue;
    const hex = hexOf(node);
    if (!hex) continue;
    const key = hexKey(hex.col, hex.row);
    const place: LandPlace = {
      id: node.id,
      hex,
      key,
      subtype: typeof node.properties.locationSubtype === 'string' ? node.properties.locationSubtype : undefined,
      resources: readResources(node.properties),
    };
    places.push(place);
    const at = placesByKey.get(key) ?? [];
    at.push(place);
    placesByKey.set(key, at);
  }
  places.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { terrainByKey, tiles, placesByKey, places };
}

/** One hex a settlement owns, with its unshocked daily yield. */
export interface OwnedHex {
  readonly key: string;
  readonly col: number;
  readonly row: number;
  readonly terrain: TerrainType;
  readonly base: YieldTriple;
  /** Distance from the settlement's own hex (0 = the centre). */
  readonly distance: number;
}

/** A hex's daily yield: its terrain plus the deposits of places standing on it. */
export function hexBaseYield(index: LandIndex, key: string): YieldTriple {
  const terrain = index.terrainByKey.get(key);
  const y: Yield = terrain ? [...(TERRAIN_YIELDS[terrain] ?? [0, 0, 0])] as Yield : [0, 0, 0];
  for (const place of index.placesByKey.get(key) ?? []) {
    for (const [rid, r] of Object.entries(place.resources)) {
      const channel = DEPOSIT_YIELD_CHANNEL[rid];
      if (!channel) continue;
      const q = typeof r?.quantity === 'number' ? r.quantity : 0;
      if (q > 0) y[YIELD_CHANNELS.indexOf(channel)] += q / DEPOSIT_YIELD_DIVISOR;
    }
  }
  return y;
}

/**
 * Assign every workable hex within `WORK_RADIUS` to one settlement.
 *
 * `holderOf` names a settlement's holder; `hexRealmId` is the realm projection. A hex the
 * holder's realm claims goes to that settlement first; otherwise nearest wins; ties go to
 * the lower id (settlements arrive in id order, so the first at a distance keeps it).
 */
export function assignHexOwnership(
  settlements: readonly GraphNode[],
  index: LandIndex,
  hexRealmId: ReadonlyMap<string, string>,
  holderOf: (settlementId: string) => string | null,
): Map<string, OwnedHex[]> {
  const best = new Map<string, { id: string; distance: number; realmMatch: boolean }>();
  for (const s of settlements) {
    const centre = hexOf(s);
    if (!centre) continue;
    const holder = holderOf(s.id);
    for (let dc = -WORK_RADIUS; dc <= WORK_RADIUS; dc++) {
      for (let dr = -WORK_RADIUS - 1; dr <= WORK_RADIUS + 1; dr++) {
        const col = centre.col + dc;
        const row = centre.row + dr;
        const key = hexKey(col, row);
        const terrain = index.terrainByKey.get(key);
        if (!terrain || UNWORKABLE_TERRAINS.has(terrain)) continue;
        const distance = hexDistance(centre, { col, row });
        if (distance > WORK_RADIUS) continue;
        const realmMatch = holder !== null && hexRealmId.get(key) === holder;
        const cur = best.get(key);
        if (!cur
          || (realmMatch && !cur.realmMatch)
          || (realmMatch === cur.realmMatch && distance < cur.distance)) {
          best.set(key, { id: s.id, distance, realmMatch });
        }
      }
    }
  }
  const out = new Map<string, OwnedHex[]>();
  for (const s of settlements) out.set(s.id, []);
  for (const [key, owner] of best) {
    const terrain = index.terrainByKey.get(key)!;
    const [col, row] = key.split(',').map(Number);
    out.get(owner.id)!.push({ key, col, row, terrain, base: hexBaseYield(index, key), distance: owner.distance });
  }
  for (const hexes of out.values()) hexes.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return out;
}

/**
 * The special goods in a settlement's reach: a Place of a special subtype, or a rich ore
 * deposit, within `WORK_RADIUS`. When the settlement's holder is a realm, the Place must
 * stand inside that realm's border (Civ realm pooling).
 */
export function specialGoodsInReach(
  settlement: GraphNode,
  index: LandIndex,
  hexRealmId: ReadonlyMap<string, string>,
  realmHolderId: string | null,
): Set<SpecialGood> {
  const goods = new Set<SpecialGood>();
  const centre = hexOf(settlement);
  for (const [rid, good] of Object.entries(SPECIAL_GOOD_BY_DEPOSIT)) {
    const q = readResources(settlement.properties)[rid]?.quantity;
    if (typeof q === 'number' && q >= ORE_SPECIAL_MIN) goods.add(good);
  }
  if (!centre) return goods;
  // Only the hexes in reach, not every place on the map (the phase's per-day budget).
  const inReach: LandPlace[] = [];
  for (let dc = -WORK_RADIUS; dc <= WORK_RADIUS; dc++) {
    for (let dr = -WORK_RADIUS - 1; dr <= WORK_RADIUS + 1; dr++) {
      const at = index.placesByKey.get(hexKey(centre.col + dc, centre.row + dr));
      if (at) inReach.push(...at);
    }
  }
  inReach.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const place of inReach) {
    if (hexDistance(centre, place.hex) > WORK_RADIUS) continue;
    if (realmHolderId !== null && hexRealmId.get(place.key) !== realmHolderId) continue;
    const bySubtype = place.subtype ? SPECIAL_GOOD_BY_PLACE_SUBTYPE[place.subtype] : undefined;
    if (bySubtype) goods.add(bySubtype);
    for (const [rid, good] of Object.entries(SPECIAL_GOOD_BY_DEPOSIT)) {
      const q = place.resources[rid]?.quantity;
      if (typeof q === 'number' && q >= ORE_SPECIAL_MIN) goods.add(good);
    }
  }
  return goods;
}

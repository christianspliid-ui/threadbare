/**
 * realmProjection.ts — the political map, derived from the towns Realms hold (THR-1155).
 *
 * The red border used to be drawn from `RegionData.hexDomainId`: a per-hex political
 * stamp written once at worldgen and never written again. It could not move, because
 * nothing in the simulation could move it — a nation's extent was a picture of a
 * decision taken before tick 0. This module makes the border a **projection** of the
 * `controls` edges a Realm actually holds, so seizing a town moves the line and losing
 * the last one erases it.
 *
 * The rule, in one sentence: a hex belongs to the Realm holding the nearest Location
 * within {@link REALM_FILL_RADIUS} hexes, and to nobody beyond that. Wilderness is
 * real — a hex far from every held town draws no border and answers *unclaimed*.
 *
 * **There is no stored per-hex realm stamp, and there must never be one.** A stamp
 * beside the edges is a second truth, and the first thing that would go stale is the
 * map. If you need to know which Realm claims a hex, read this projection through
 * `ensureRealmProjection` — the runtime owns exactly one of them.
 *
 * NFP #1 Tunability: the reach and the tiebreak are named constants in
 * `src/data/realm-content.ts`.
 * NFP #2 Inspectability: `hexRealmId` is keyed `"col,row"` like every other per-hex
 * map; every entry is traceable to the Location that claimed it.
 * NFP #3 Determinism: pure — same graph and tiles in, same projection out. Ties are
 * broken by held-Location count then by the lower faction id, never by iteration order.
 * NFP #4 Fail-soft: a Realm holding a Location with no resolvable hex contributes that
 * Location no claim rather than throwing; a Realm holding nothing is omitted.
 */

import type { HexTile, HexCoord } from '../types';
import type { WorldGraph } from './graph';
import { hexKeyFromCoord } from '../lib/hexKey';
import { hexDistance } from '../lib/hexMath';
import { resolveToParentLocation } from './sublocationShape';
import { REALM_FACTION_CLASS, REALM_FILL_RADIUS } from '../data/realm-content';

/** One Realm, as the map draws it. */
export interface RealmProjectionEntry {
  /** The faction node id — `faction_N`. The Realm's identity everywhere. */
  id: string;
  /** The name the player reads, from the node. */
  name: string;
  /** The hex of the seated town (`role: 'seat'` on one `controls` edge), or undefined. */
  seatHex: HexCoord | undefined;
  /** The seated Location's id, or null when the Realm holds nothing seatable. */
  seatLocationId: string | null;
  /** The Locations this Realm holds — `controls` targets. Never *holdings* (THR-1314). */
  heldLocationIds: string[];
  /** Every hex this Realm claims, in tile order. */
  hexes: HexCoord[];
}

export interface RealmProjection {
  realms: RealmProjectionEntry[];
  /** `"col,row"` → Realm node id. A hex no Realm claims is absent, not null. */
  hexRealmId: Map<string, string>;
  /**
   * Tiles no Realm claims — reported, because wilderness is a fact rather than a gap.
   *
   * Counts **every** unclaimed tile, water included: the sea is not a Realm's, so a
   * coastal Realm's border runs along its shore, which is correct. Do not read this as
   * "land wilderness" — on a seed-42 medium world it is 393 of 768 tiles, and most of
   * that is ocean. Contrast the Area partition's `unstamped`, which counts *land* hexes
   * with no Area and must be 0.
   */
  unclaimedHexes: number;
}

/** An empty projection — the shape a fail-soft path hands back. */
export function emptyRealmProjection(): RealmProjection {
  return { realms: [], hexRealmId: new Map(), unclaimedHexes: 0 };
}

interface HeldSeed {
  realmIndex: number;
  hex: HexCoord;
}

/**
 * Is this actor node a Realm?
 *
 * The discriminator is `factionClass`, stamped by each minter — not the node type
 * (every faction is an `actor`) and not the name. A guild, order, cult or monster
 * faction holds towns too and must never be projected as a nation.
 */
function isRealmNode(properties: Record<string, unknown>): boolean {
  return properties.actorType === 'faction' && properties.factionClass === REALM_FACTION_CLASS;
}

/**
 * Build the political partition from the Realms' `controls` edges and the tiles.
 *
 * The edges are the authority — what a Realm holds is what it controls — and the
 * tiles supply the ground the claim spreads over. A Location whose hex cannot be
 * resolved (a dangling place-tier parent) seeds no claim, so a broken edge costs one
 * town's worth of border rather than the whole map.
 */
export function buildRealmProjection(graph: WorldGraph, tiles: HexTile[]): RealmProjection {
  // ── Collect the Realms and the hexes of the towns they hold ──
  const realms: RealmProjectionEntry[] = [];
  const seeds: HeldSeed[] = [];

  const factionNodes = graph.getNodesByType('actor')
    .filter(node => isRealmNode(node.properties))
    // Stable order by node id: the tiebreak below reads *lower faction id wins*, and
    // an index comparison only means that if the array is sorted by id.
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const node of factionNodes) {
    const held = graph.getOutgoingEdges(node.id, 'controls');
    const heldLocationIds: string[] = [];
    let seatHex: HexCoord | undefined;
    let seatLocationId: string | null = null;
    const realmIndex = realms.length;

    for (const edge of held) {
      const target = graph.getNode(edge.target);
      if (!target) continue;
      heldLocationIds.push(edge.target);

      // A `controls` edge may point at a Place (the inner tier); its ground is its
      // parent Location's hex. `resolveToParentLocation` returns the node unchanged
      // when it is already place-tier, and undefined when the parent is dangling.
      const ground = resolveToParentLocation(graph, target);
      const col = ground?.properties.hexCol;
      const row = ground?.properties.hexRow;
      if (typeof col !== 'number' || typeof row !== 'number') continue;
      const hex: HexCoord = { col, row };

      seeds.push({ realmIndex, hex });
      if (edge.properties.role === 'seat') {
        seatHex = hex;
        seatLocationId = edge.target;
      }
    }

    // A Realm that holds nothing has no territory and no border. Its node survives —
    // it may reclaim — but it is not on the map, so it is not in the projection.
    if (heldLocationIds.length === 0) continue;

    realms.push({
      id: node.id,
      name: node.name ?? '',
      seatHex,
      seatLocationId,
      heldLocationIds,
      hexes: [],
    });
  }

  if (realms.length === 0) return emptyRealmProjection();

  // ── Spread each claim over the ground within reach ──
  const hexRealmId = new Map<string, string>();
  let unclaimedHexes = 0;

  for (const tile of tiles) {
    let bestRealmIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const seed of seeds) {
      const distance = hexDistance(tile.coord, seed.hex);
      if (distance > REALM_FILL_RADIUS) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRealmIndex = seed.realmIndex;
        continue;
      }
      if (distance > bestDistance || seed.realmIndex === bestRealmIndex) continue;
      // Equidistant from two Realms' towns: REALM_TIEBREAK — the Realm holding more
      // Locations takes it (the larger nation absorbs the contested march), and an
      // exact tie there goes to the lower faction id, which the sort above made the
      // lower index. Deterministic either way; never iteration order.
      const incumbent = realms[bestRealmIndex];
      const challenger = realms[seed.realmIndex];
      const incumbentHeld = incumbent.heldLocationIds.length;
      const challengerHeld = challenger.heldLocationIds.length;
      if (challengerHeld > incumbentHeld
        || (challengerHeld === incumbentHeld && seed.realmIndex < bestRealmIndex)) {
        bestRealmIndex = seed.realmIndex;
      }
    }

    if (bestRealmIndex === -1) {
      unclaimedHexes++;
      continue;
    }
    const realm = realms[bestRealmIndex];
    hexRealmId.set(hexKeyFromCoord(tile.coord), realm.id);
    realm.hexes.push(tile.coord);
  }

  return { realms, hexRealmId, unclaimedHexes };
}

/**
 * A fingerprint of every faction-sourced `controls` edge in the world.
 *
 * The belt behind `ensureRealmProjection`'s version check (THR-1155 § Engine C). A
 * writer that moves a `controls` edge without calling `touchStructure` would leave the
 * projection stale and the map wrong with nothing to show for it; comparing this
 * fingerprint makes the omission *visible in the trace* instead — one rebuild late,
 * and named.
 *
 * Sorted `source→target` pairs of faction-sourced edges only — a mortal's
 * `controlType: 'strategic'` stance is not the political map (THR-1448 owns that
 * question) and must not make the border rebuild every time one is taken.
 */
export function fingerprintFactionControls(graph: WorldGraph): string {
  const pairs: string[] = [];
  for (const edge of graph.getEdgesByType('controls')) {
    const source = graph.getNode(edge.source);
    if (!source || source.properties.actorType !== 'faction') continue;
    pairs.push(`${edge.source}>${edge.target}`);
  }
  pairs.sort();
  return pairs.join(',');
}

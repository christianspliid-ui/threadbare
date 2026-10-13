/**
 * dominionProjection.ts — the god's turf on the hex map (THR-1750).
 *
 * Plan doc: `Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md` § E1.
 *
 * Hexes are not graph nodes, and `dominionBandOfHex` reads a terrain table that never
 * moves — a lens drawn from it would never change as the player Claims and Shifts.
 * So each land hex takes the band of the **nearest top-level place** within
 * {@link DOMINION_HEX_FILL_RADIUS}, the `realmProjection.ts` pattern. Past that radius
 * the terrain read is the fallback. Water carries no band.
 *
 * **Nothing here is stored on a tile or a node.** The projection is a runtime cache
 * (`ensureDominionProjection` in `simulationRuntime.ts`), rebuilt from the graph.
 *
 * Two halves, rebuilt on different signals:
 * - the **assignment** (hex → the equally-nearest places) depends only on structure;
 * - the **bands** depend on the god's points and the places' scores, so they are
 *   re-read on the lens cadence or when a place's band moved.
 *
 * NFP #1: radius, tie order and turf bands are named in `dominion-ui-content.ts`.
 * NFP #2: `hexPlaceId` records which place lent each band.
 * NFP #3: pure; ties by `DOMINION_HEX_TIE_PRIORITY`, then the lower place id.
 * NFP #4: a place with no hex is skipped; a throwing read is Foreign.
 */

import type { HexTile } from '../types';
import type { WorldGraph } from './graph';
import type { DominionBand } from '../data/dominion-content';
import { DOMINION_BAND_RANK, DOMINION_PAR_BAND, DOMINION_CHRONICLE_TEMPLATES, DOMINION_BAND_WORDS } from '../data/dominion-content';
import {
  DOMINION_HEX_FILL_RADIUS,
  DOMINION_HEX_TIE_PRIORITY,
  DOMINION_TURF_BANDS,
  DOMINION_DROP_BADGE_TICKS,
} from '../data/dominion-ui-content';
import { hexDistance, hexNeighbors } from '../lib/hexMath';
import { hexKey, hexKeyFromCoord } from '../lib/hexKey';
import { isWaterTerrain } from './coastline';
import { getLocationNodes } from './sublocationShape';
import { dominionOf, dominionBandOfHex } from './dominion';
import type { DominionLedger } from './phaseDominion';

export type HexKey = string;

/** Hex → the places that lend it a band. Structure-only; rebuilt on a structure bump. */
export interface DominionHexAssignment {
  /**
   * Every land hex → the equally-nearest top-level places within the radius, sorted
   * by id. An empty list means no place in reach: the terrain read decides.
   */
  candidates: Map<HexKey, string[]>;
  /** Land hex → its terrain, for the fallback read. */
  terrain: Map<HexKey, string>;
  /** Every place that lends a band to at least one hex. */
  placeIds: string[];
  builtAtStructure: number;
}

export interface DominionHexProjection {
  /** Land hexes only. */
  hexBand: Map<HexKey, DominionBand>;
  /** The place that lent the band; null = terrain fallback. */
  hexPlaceId: Map<HexKey, string | null>;
  /** Each lending place's band at build time. */
  placeBand: Map<string, DominionBand>;
  builtAtStructure: number;
  builtAtTick: number;
  /** The place bands the build read, as a string — a change means the lens is stale. */
  placeBandFingerprint: string;
  terrainFallbackHexes: number;
}

export interface DominionFrontierEdge {
  /** The turf hex. */
  a: HexKey;
  /** The land hex beyond it that is not turf. */
  b: HexKey;
  /** Neighbour direction from `a` (the `hexNeighbors` order) — the mesh draws that edge. */
  dir: number;
  /** The thicker line: turf meets Hostile. */
  meetsHostile: boolean;
}

export function emptyDominionProjection(tick = -1, structure = -1): DominionHexProjection {
  return {
    hexBand: new Map(),
    hexPlaceId: new Map(),
    placeBand: new Map(),
    builtAtStructure: structure,
    builtAtTick: tick,
    placeBandFingerprint: '',
    terrainFallbackHexes: 0,
  };
}

/** True for Touched, Held and Sovereign. */
export function isTurfBand(band: DominionBand | undefined): boolean {
  return band !== undefined && DOMINION_TURF_BANDS.includes(band);
}

interface PlaceSeed { id: string; col: number; row: number }

/**
 * Hex → the nearest top-level places within {@link DOMINION_HEX_FILL_RADIUS}.
 * Uses `getLocationNodes` (the place tier) — never a bare `getNodesByType('location')`,
 * which returns sublocations too.
 */
export function buildDominionHexAssignment(
  graph: WorldGraph,
  tiles: readonly HexTile[],
  structure = -1,
): DominionHexAssignment {
  const seeds: PlaceSeed[] = [];
  for (const place of getLocationNodes(graph)) {
    const col = place.properties.hexCol;
    const row = place.properties.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue; // fail-soft: no hex, no claim
    seeds.push({ id: place.id, col, row });
  }
  seeds.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const candidates = new Map<HexKey, string[]>();
  const terrain = new Map<HexKey, string>();
  const used = new Set<string>();
  for (const tile of tiles) {
    if (isWaterTerrain(tile.terrain)) continue;
    const key = hexKeyFromCoord(tile.coord);
    terrain.set(key, tile.terrain);
    let best = Number.POSITIVE_INFINITY;
    let near: string[] = [];
    for (const seed of seeds) {
      const d = hexDistance(tile.coord, seed);
      if (d > DOMINION_HEX_FILL_RADIUS) continue;
      if (d < best) { best = d; near = [seed.id]; }
      else if (d === best) near.push(seed.id);
    }
    candidates.set(key, near);
    for (const id of near) used.add(id);
  }
  return { candidates, terrain, placeIds: [...used].sort(), builtAtStructure: structure };
}

/** Fingerprint of a set of place bands — order-independent. */
export function fingerprintPlaceBands(bands: ReadonlyMap<string, DominionBand> | Readonly<Record<string, DominionBand>>): string {
  const entries = bands instanceof Map ? [...bands.entries()] : Object.entries(bands);
  return entries.sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([id, b]) => `${id}:${b}`).join('|');
}

const TIE_INDEX: ReadonlyMap<DominionBand, number> = new Map(DOMINION_HEX_TIE_PRIORITY.map((b, i) => [b, i]));

/**
 * Apply the bands: one `dominionOf` per lending place, fanned out to its hexes.
 * Equidistant places: the earlier band in `DOMINION_HEX_TIE_PRIORITY`, then the
 * lower place id (the candidate list is already sorted by id).
 */
export function buildDominionHexProjection(
  graph: WorldGraph,
  ascendantId: string,
  assignment: DominionHexAssignment,
  tick = -1,
): DominionHexProjection {
  const placeBand = new Map<string, DominionBand>();
  for (const id of assignment.placeIds) {
    let band: DominionBand = DOMINION_PAR_BAND;
    try { band = dominionOf(graph, ascendantId, id).band; } catch { /* Foreign */ }
    placeBand.set(id, band);
  }

  const hexBand = new Map<HexKey, DominionBand>();
  const hexPlaceId = new Map<HexKey, string | null>();
  const terrainBand = new Map<string, DominionBand>();
  let terrainFallbackHexes = 0;
  for (const [key, near] of assignment.candidates) {
    if (near.length === 0) {
      const terrain = assignment.terrain.get(key) ?? '';
      let band = terrainBand.get(terrain);
      if (band === undefined) {
        try { band = dominionBandOfHex(graph, ascendantId, terrain); } catch { band = DOMINION_PAR_BAND; }
        terrainBand.set(terrain, band);
      }
      hexBand.set(key, band);
      hexPlaceId.set(key, null);
      terrainFallbackHexes++;
      continue;
    }
    let pick = near[0];
    let pickBand = placeBand.get(pick) ?? DOMINION_PAR_BAND;
    for (let i = 1; i < near.length; i++) {
      const band = placeBand.get(near[i]) ?? DOMINION_PAR_BAND;
      if ((TIE_INDEX.get(band) ?? 99) < (TIE_INDEX.get(pickBand) ?? 99)) { pick = near[i]; pickBand = band; }
    }
    hexBand.set(key, pickBand);
    hexPlaceId.set(key, pick);
  }

  return {
    hexBand,
    hexPlaceId,
    placeBand,
    builtAtStructure: assignment.builtAtStructure,
    builtAtTick: tick,
    placeBandFingerprint: fingerprintPlaceBands(placeBand),
    terrainFallbackHexes,
  };
}

/**
 * The frontier: every edge from a turf hex to a land hex that is not turf. Edges to
 * water or off the map are not frontier. Each edge is listed once, from its turf side.
 */
export function frontierEdges(projection: DominionHexProjection): DominionFrontierEdge[] {
  const out: DominionFrontierEdge[] = [];
  for (const [key, band] of projection.hexBand) {
    if (!isTurfBand(band)) continue;
    const [col, row] = key.split(',').map(Number);
    const neighbours = hexNeighbors({ col, row });
    for (let dir = 0; dir < neighbours.length; dir++) {
      const nKey = hexKey(neighbours[dir].col, neighbours[dir].row);
      const nBand = projection.hexBand.get(nKey);
      if (nBand === undefined || isTurfBand(nBand)) continue; // water, rim, or more turf
      out.push({ a: key, b: nKey, dir, meetsHostile: nBand === 'hostile' });
    }
  }
  return out;
}

/** Land hexes per band — for the trace and the debug read. */
export function countHexBands(projection: DominionHexProjection): Record<DominionBand, number> {
  const out: Record<DominionBand, number> = { hostile: 0, foreign: 0, touched: 0, held: 0, sovereign: 0 };
  for (const band of projection.hexBand.values()) out[band]++;
  return out;
}

// ─── Band-drop badges (§ Decided 6) ─────────────────────────────────

export interface DominionDropBadge {
  placeId: string;
  hexKey: HexKey;
  untilTick: number;
  /** The core's chronicle line for this drop, word for word. */
  line: string;
}

/**
 * New drops since the last read, from the ledger's end-of-tick bands. Traces are off
 * in normal play, so the badge reads the ledger `phaseDominion` writes every tick,
 * not the `dominion.band_change` trace. A drop counts only from Touched or better —
 * the same rule the core's chronicle line uses — and a second drop at a place
 * refreshes its badge rather than stacking one.
 */
export function diffDominionDrops(
  graph: WorldGraph,
  prevBands: Readonly<Record<string, DominionBand>> | null,
  ledger: Pick<DominionLedger, 'bands' | 'dayDrops' | 'lastDayDrops'>,
  tick: number,
  existing: readonly DominionDropBadge[],
): DominionDropBadge[] {
  const live = existing.filter(d => d.untilTick > tick);
  if (!prevBands) return live;
  const byPlace = new Map(live.map(d => [d.placeId, d]));
  for (const [placeId, to] of Object.entries(ledger.bands)) {
    const from = prevBands[placeId];
    if (!from || from === to) continue;
    if (DOMINION_BAND_RANK[to] >= DOMINION_BAND_RANK[from] || !isTurfBand(from)) continue;
    const place = graph.getNode(placeId);
    const col = place?.properties.hexCol;
    const row = place?.properties.hexRow;
    if (!place || typeof col !== 'number' || typeof row !== 'number') continue; // gone from the map: no badge
    byPlace.set(placeId, {
      placeId,
      hexKey: hexKey(col, row),
      untilTick: tick + DOMINION_DROP_BADGE_TICKS,
      // Today's drops first; on a day-boundary tick the chronicle has already moved
      // them to `lastDayDrops`.
      line: dropLine(graph, placeId, from, to, [...(ledger.lastDayDrops ?? []), ...ledger.dayDrops]),
    });
  }
  return [...byPlace.values()].sort((a, b) => (a.placeId < b.placeId ? -1 : 1));
}

function dropLine(
  graph: WorldGraph,
  placeId: string,
  from: DominionBand,
  to: DominionBand,
  dayDrops: DominionLedger['dayDrops'],
): string {
  const name = graph.getNode(placeId)?.name || 'A place of yours';
  const drop = [...dayDrops].reverse().find(d => d.placeId === placeId);
  const rivalName = drop?.cause === 'rival' && drop.rivalId ? graph.getNode(drop.rivalId)?.name : undefined;
  if (rivalName) {
    return DOMINION_CHRONICLE_TEMPLATES.dropRaid
      .replace('{rival}', rivalName).replace('{place}', name).replace('{to}', DOMINION_BAND_WORDS[to]);
  }
  return DOMINION_CHRONICLE_TEMPLATES.dropUntended
    .replace('{place}', name).replace('{from}', DOMINION_BAND_WORDS[from]).replace('{to}', DOMINION_BAND_WORDS[to]);
}

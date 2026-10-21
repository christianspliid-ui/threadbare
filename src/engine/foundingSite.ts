/**
 * Where a founding lands (THR-1308; moved here in THR-1937 so the `create × location`
 * cell and the strategic lifecycle share one helper without an import cycle).
 */
import type { WorldGraph } from './graph';
import { getLocationNodes } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS } from '../data/strategic-action-constants';
import { isWaterTerrain } from './coastline';
import type { HexTile } from '../types';

/**
 * The foundable-ground predicate over the world's tiles: a hex that exists on the map
 * and is not water. With no tiles at all (a graph-only fixture) every hex qualifies.
 */
export function landHexPredicate(tiles: readonly HexTile[] | undefined): ((hex: { col: number; row: number }) => boolean) | undefined {
  if (!tiles || tiles.length === 0) return undefined;
  const land = new Set<string>();
  for (const t of tiles) if (!isWaterTerrain(t.terrain)) land.add(`${t.coord.col},${t.coord.row}`);
  return hex => land.has(`${hex.col},${hex.row}`);
}

/**
 * An unclaimed hex to found a place-tier location on (THR-1308).
 *
 * Starts at `origin` and, if something already stands there, spirals outward through
 * whole rings up to `FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS`. Returns `null` when the
 * whole neighbourhood is built up — a refusal, not a fallback: founding a settlement
 * on top of one that exists is not founding anything, and the *right* answer when
 * there is no room is that the undertaking fails.
 *
 * Only **place-tier** locations occupy a hex. Sublocations sit inside a parent and
 * share its hex by construction, so counting them would make every settled hex look
 * doubly occupied and change nothing but the arithmetic (`sublocationShape.ts`,
 * THR-1183).
 *
 * NFP #3 (Determinism): candidates are ordered by ring distance, then by column, then
 * by row — no PRNG, so the same world founds on the same hex.
 */
export function findUnclaimedSite(
  graph: WorldGraph,
  origin: { col: number; row: number },
  radius: number = FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS,
  /**
   * Whether a hex can carry a town at all (THR-1937): on the map, and land. Absent,
   * every hex qualifies (the legacy hint path and graph-only fixtures).
   */
  isFoundable?: (hex: { col: number; row: number }) => boolean,
): { col: number; row: number } | null {
  const occupied = new Set<string>();
  for (const node of getLocationNodes(graph)) {
    const col = node.properties.hexCol;
    const row = node.properties.hexRow;
    if (typeof col === 'number' && typeof row === 'number') occupied.add(`${col},${row}`);
  }

  const candidates: { col: number; row: number }[] = [];
  for (let col = origin.col - radius; col <= origin.col + radius; col++) {
    for (let row = origin.row - radius; row <= origin.row + radius; row++) {
      const hex = { col, row };
      if (hexDistance(origin, hex) > radius) continue;
      if (occupied.has(`${col},${row}`)) continue;
      if (isFoundable && !isFoundable(hex)) continue;
      candidates.push(hex);
    }
  }

  candidates.sort((a, b) => {
    const da = hexDistance(origin, a);
    const db = hexDistance(origin, b);
    if (da !== db) return da - db;
    if (a.col !== b.col) return a.col - b.col;
    return a.row - b.row;
  });

  return candidates[0] ?? null;
}

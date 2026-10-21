/**
 * Where a founding lands (THR-1308; moved here in THR-1937 so the `create × location`
 * cell and the strategic lifecycle share one helper without an import cycle).
 */
import type { WorldGraph } from './graph';
import { getLocationNodes } from './sublocationShape';
import { hexDistance } from '../lib/hexMath';
import { FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS } from '../data/strategic-action-constants';

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

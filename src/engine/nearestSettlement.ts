/**
 * Nearest settlement to a hex (THR-1792) — one shared rule, lifted from the fight
 * ending's grateful-settlement lookup (THR-1549) so the god's seat placement does not
 * grow a second copy (Law 27 / NFP 1).
 *
 * A settlement is a place-tier location whose `locationSubtype` is in the `settlement`
 * class of `LOCATION_CLASSES` (world-objects registry). A lair, ruin, shrine or a
 * movement Waypoint is never one.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { LOCATION_CLASSES } from '../data/world-objects';
import { hexDistance } from './delivery';
import { getLocationNodes } from './sublocationShape';

/** The settlement-class subtypes (`LOCATION_CLASSES.settlement`). */
export const SETTLEMENT_SUBTYPES: ReadonlySet<string> = new Set(LOCATION_CLASSES.settlement ?? []);

/** True when a node is a settlement-class location. */
export function isSettlementNode(node: GraphNode | undefined): boolean {
  return !!node && node.type === 'location' && SETTLEMENT_SUBTYPES.has(node.properties.locationSubtype as string);
}

/**
 * The nearest settlement-class place within `maxRadiusHexes` of `hex` — one on the same
 * hex wins at distance 0 — ties broken by node id so the answer is deterministic.
 * Undefined when `hex` is missing or none is in reach.
 */
export function nearestSettlement(
  graph: WorldGraph,
  hex: { col: number; row: number } | undefined,
  maxRadiusHexes: number,
): GraphNode | undefined {
  if (!hex) return undefined;
  let best: GraphNode | undefined;
  let bestDist = Infinity;
  for (const loc of getLocationNodes(graph)) {
    if (!SETTLEMENT_SUBTYPES.has(loc.properties.locationSubtype as string)) continue;
    const col = loc.properties.hexCol;
    const row = loc.properties.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    const dist = hexDistance(hex, { col, row });
    if (dist > maxRadiusHexes) continue;
    if (dist < bestDist || (dist === bestDist && best && loc.id < best.id)) {
      best = loc;
      bestDist = dist;
    }
  }
  return best;
}

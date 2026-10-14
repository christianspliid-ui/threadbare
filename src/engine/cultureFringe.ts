/**
 * Fringe culture — the one rule for which people a settlement outside every heartland
 * belongs to (THR-1632 S1d, THR-1839).
 *
 * Worldgen links every settlement within `cultureFringeMaxHexes` of a heartland to the
 * nearest culture as its **fringe**: a current `belongs_to` at `CULTURE_FRINGE_STRENGTH`,
 * flagged `fringe`, with no historical link. Places founded during play (a hamlet an
 * agent raises at tick 200) used to skip that pass and belong to no people. Both now
 * go through `pickNearestHeartland`, so the two writers cannot drift on the rule.
 *
 * Draw-free (NFP #3): nearest by hex distance, ties by culture id, then location id.
 * Fail-soft (NFP #4): a missing node, a non-fringe subtype, an existing culture link,
 * or no heartland in reach is a quiet no-op — never a throw.
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import { hexDistance } from '../lib/hexMath';
import { assignCultureToLocation } from './cultureGenerator';
import { isLocationNode } from './sublocationShape';
import {
  CULTURE_FRINGE_STRENGTH,
  CULTURE_FRINGE_SUBTYPES,
  resolveWorldScenario,
} from '../data/world-scenario';

/** A Location inside a culture's heartland — a fringe link's anchor. */
export interface HeartlandSite {
  readonly id: string;
  readonly cultureId: string;
  readonly col: number;
  readonly row: number;
}

/**
 * The nearest heartland to `here`, or null when none lies within `maxHexes`.
 * Ties break by culture id, then by location id, so the same world picks the same people.
 */
export function pickNearestHeartland(
  here: { col: number; row: number },
  heartlands: readonly HeartlandSite[],
  maxHexes: number,
): { cultureId: string; id: string; dist: number } | null {
  let best: { cultureId: string; id: string; dist: number } | null = null;
  for (const h of heartlands) {
    const dist = hexDistance(here, h);
    if (!best || dist < best.dist
      || (dist === best.dist && (h.cultureId < best.cultureId
        || (h.cultureId === best.cultureId && h.id < best.id)))) {
      best = { cultureId: h.cultureId, id: h.id, dist };
    }
  }
  return best && best.dist <= maxHexes ? best : null;
}

/**
 * Every heartland in the live world: a place-tier Location carrying a current,
 * non-fringe `belongs_to`. A fringe town is never an anchor, so a fringe cannot chain
 * outward settlement by settlement.
 */
export function collectHeartlands(graph: WorldGraph): HeartlandSite[] {
  const out: HeartlandSite[] = [];
  for (const node of graph.getNodesByType('location')) {
    if (!isLocationNode(node)) continue;
    const col = node.properties.hexCol;
    const row = node.properties.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    for (const edge of graph.getOutgoingEdges(node.id, 'belongs_to')) {
      if (edge.properties?.cultureLayer !== 'current' || edge.properties?.fringe === true) continue;
      out.push({ id: node.id, cultureId: edge.target, col, row });
    }
  }
  return out;
}

/**
 * The fringe reach this world was made with. `state.worldScenario` is stamped at game
 * start; a state without one (an older save, a hand-built test state) takes the default
 * scenario's reach, the same value a fresh world would have used.
 */
export function fringeReachOf(state: Pick<GameState, 'worldScenario'>): number {
  return (state.worldScenario ?? resolveWorldScenario()).cultureFringeMaxHexes;
}

/**
 * Give a place founded during play the nearest heartland's culture as its fringe, by
 * the same rule worldgen uses. Returns the culture id it took, or null when it took none.
 */
export function takeFringeCulture(
  graph: WorldGraph,
  locationId: string,
  maxHexes: number,
): string | null {
  if (maxHexes <= 0) return null;
  const node = graph.getNode(locationId);
  if (!node || !isLocationNode(node)) return null;
  if (!CULTURE_FRINGE_SUBTYPES.has(node.properties.locationSubtype as string)) return null;
  if (graph.getOutgoingEdges(locationId, 'belongs_to').length > 0) return null;
  const col = node.properties.hexCol;
  const row = node.properties.hexRow;
  if (typeof col !== 'number' || typeof row !== 'number') return null;
  const best = pickNearestHeartland({ col, row }, collectHeartlands(graph), maxHexes);
  if (!best) return null;
  assignCultureToLocation(graph, locationId, best.cultureId, 'current', {
    strength: CULTURE_FRINGE_STRENGTH,
    fringe: true,
  });
  return best.cultureId;
}

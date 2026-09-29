/**
 * Cast relocation — where a `teleport` or `forced_move` lands a mortal (THR-1571 S1.3).
 *
 * Until THR-1571 both executors returned `mutations: []`: a Veilwalk paid its price and
 * went nowhere. They now resolve a destination here and return the same `remove_edge`
 * + `add_edge` pair `rebindLocatedAt` writes, which `applyExecutionResult` applies.
 *
 * Destinations are always place-tier Locations (never a bare hex, never a
 * sublocation): position is one `located_at` edge (the three-tier rule), and a mortal
 * set down on a Location is a mortal every system can resolve. Candidates are sorted
 * by id before any pick, so the result never depends on graph insertion order (NFP #3).
 *
 * Pure apart from the `rng` draw. Returns `null` when nothing resolves (NFP #4) — the
 * executor then reports `success: false` and the mortal stays put.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getLocationNodes } from '../sublocationShape';
import { hexDistance } from '../../lib/hexMath';
import { readResidence } from '../agentResidence';

export interface HexPos { readonly col: number; readonly row: number }

/** A resolved landing place. */
export interface CastLanding {
  readonly locationId: string;
  readonly hex: HexPos;
}

/** Settlement subtypes a `home` fallback may land on (mirrors the relocation intent's list). */
const HOME_FALLBACK_SETTLEMENT_SUBTYPES: readonly string[] = ['hamlet', 'town', 'city', 'capital', 'camp'];

/** A location's own hex, or its parent's for a sublocation. */
export function locationHex(graph: WorldGraph, locationId: string): HexPos | null {
  let node = graph.getNode(locationId);
  if (!node) return null;
  if (typeof node.properties.hexCol !== 'number' && typeof node.properties.parentLocationId === 'string') {
    node = graph.getNode(node.properties.parentLocationId);
    if (!node) return null;
  }
  const col = node.properties.hexCol;
  const row = node.properties.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : null;
}

/** The agent's current location id and hex (via its single `located_at` edge). */
export function agentPosition(graph: WorldGraph, agentId: string): { locationId: string; hex: HexPos } | null {
  const edge = graph.getOutgoingEdges(agentId, 'located_at')[0];
  if (!edge) return null;
  const hex = locationHex(graph, edge.target);
  return hex ? { locationId: edge.target, hex } : null;
}

interface PlacedLocation { readonly node: GraphNode; readonly hex: HexPos }

/** Every place-tier location with a hex, sorted by id. */
function placedLocations(graph: WorldGraph): PlacedLocation[] {
  const out: PlacedLocation[] = [];
  for (const node of getLocationNodes(graph)) {
    const col = node.properties.hexCol;
    const row = node.properties.hexRow;
    if (typeof col === 'number' && typeof row === 'number') out.push({ node, hex: { col, row } });
  }
  return out.sort((a, b) => a.node.id.localeCompare(b.node.id));
}

/** The location nearest `hex` (ties by id), optionally within `maxFrom` of `origin`. */
function nearestLocationTo(
  locations: readonly PlacedLocation[],
  hex: HexPos,
  exclude: string | undefined,
  within?: { origin: HexPos; range: number },
): PlacedLocation | null {
  let best: { loc: PlacedLocation; dist: number } | null = null;
  for (const loc of locations) {
    if (loc.node.id === exclude) continue;
    if (within && hexDistance(within.origin, loc.hex) > within.range) continue;
    const dist = hexDistance(hex, loc.hex);
    if (!best || dist < best.dist) best = { loc, dist };
  }
  return best?.loc ?? null;
}

/**
 * Resolve a `teleport` landing for `agentId`.
 *
 * - `target_hex` — the location on or nearest `targetHex`, within `range` of the agent.
 * - `random` — a seeded pick among the *other* locations within `range`.
 * - `home` — the agent's first-observed residence, falling back to the nearest
 *   settlement that is not where they stand.
 * - `nearest_ally` — the location of the nearest same-faction mortal elsewhere.
 */
export function resolveTeleportLanding(
  graph: WorldGraph,
  agentId: string,
  destination: 'random' | 'target_hex' | 'home' | 'nearest_ally',
  range: number | 'unlimited',
  targetHex: HexPos | undefined,
  rng: () => number,
): CastLanding | null {
  const from = agentPosition(graph, agentId);
  if (!from) return null;
  const maxRange = range === 'unlimited' ? Number.POSITIVE_INFINITY : range;
  const locations = placedLocations(graph);
  const within = { origin: from.hex, range: maxRange };

  switch (destination) {
    case 'target_hex': {
      if (!targetHex) return null;
      const pick = nearestLocationTo(locations, targetHex, from.locationId, within);
      return pick ? { locationId: pick.node.id, hex: pick.hex } : null;
    }
    case 'random': {
      const candidates = locations.filter(l =>
        l.node.id !== from.locationId && hexDistance(from.hex, l.hex) <= maxRange);
      if (candidates.length === 0) return null;
      const pick = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
      return { locationId: pick.node.id, hex: pick.hex };
    }
    case 'home': {
      const origin = readResidence(graph, agentId).originLocationId;
      if (origin && origin !== from.locationId) {
        const hex = locationHex(graph, origin);
        if (hex && hexDistance(from.hex, hex) <= maxRange) return { locationId: origin, hex };
      }
      const settlements = locations.filter(l =>
        HOME_FALLBACK_SETTLEMENT_SUBTYPES.includes(String(l.node.properties.locationSubtype ?? '')));
      const pick = nearestLocationTo(settlements, from.hex, from.locationId, within);
      return pick ? { locationId: pick.node.id, hex: pick.hex } : null;
    }
    case 'nearest_ally': {
      const faction = graph.getOutgoingEdges(agentId, 'member_of')[0]?.target;
      if (!faction) return null;
      let best: { landing: CastLanding; dist: number; id: string } | null = null;
      for (const e of graph.getIncomingEdges(faction, 'member_of')) {
        if (e.source === agentId) continue;
        const pos = agentPosition(graph, e.source);
        if (!pos || pos.locationId === from.locationId) continue;
        const dist = hexDistance(from.hex, pos.hex);
        if (dist > maxRange) continue;
        if (!best || dist < best.dist || (dist === best.dist && e.source < best.id)) {
          best = { landing: { locationId: pos.locationId, hex: pos.hex }, dist, id: e.source };
        }
      }
      return best?.landing ?? null;
    }
  }
}

/**
 * Resolve a `forced_move` landing: `hexes` steps `away` from / `toward` the caster, or
 * a seeded `random` push, landing on the nearest location to where the push ends.
 */
export function resolveForcedMoveLanding(
  graph: WorldGraph,
  casterId: string,
  targetId: string,
  direction: 'away' | 'toward' | 'random',
  hexes: number,
  rng: () => number,
): CastLanding | null {
  const target = agentPosition(graph, targetId);
  if (!target) return null;
  const caster = agentPosition(graph, casterId) ?? target;
  const reach = Math.max(1, hexes);
  const candidates = placedLocations(graph).filter(l =>
    l.node.id !== target.locationId && hexDistance(target.hex, l.hex) <= reach);
  if (candidates.length === 0) return null;

  if (direction === 'random') {
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
    return { locationId: pick.node.id, hex: pick.hex };
  }
  // away: the farthest from the caster; toward: the nearest. Ties by id (already sorted).
  let best: { loc: PlacedLocation; score: number } | null = null;
  for (const loc of candidates) {
    const d = hexDistance(caster.hex, loc.hex);
    const score = direction === 'away' ? d : -d;
    if (!best || score > best.score) best = { loc, score };
  }
  return best ? { locationId: best.loc.node.id, hex: best.loc.hex } : null;
}

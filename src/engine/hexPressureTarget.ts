/**
 * Hex-aimed sphere pressure → a place (THR-2087).
 *
 * A hex card's target id is the synthetic `hex_COL_ROW`, which no graph node carries,
 * so `phaseSpherePressure` used to drop every push aimed at one as an unknown entity.
 * This resolver rewrites each such push onto one place-tier location, at full strength:
 * the lowest-id place on that hex, else the nearest place within
 * `HEX_PRESSURE_FALLBACK_RADIUS` (ties by id), else the push is dropped with a trace.
 *
 * Pure: reads the graph, writes nothing. Deterministic (id sort, no PRNG).
 *
 * Plan doc: Docs/plans/2026-10-28-thr-2087-hex-sphere-pressure.md
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { HEX_PRESSURE_FALLBACK_RADIUS } from '../types/sphereAffinity';
import type { HexPressureTrace } from '../types/traces/sphere-traces';
import { isHexTargetId, parseHexTargetId } from './hexActionBridge';
import { getLocationNodes } from './sublocationShape';
import { hexDistance } from './delivery';

/** A hex-pressure trace before the buffer stamps `id` and `timestamp`. */
export type HexPressureTraceInput = Omit<HexPressureTrace, 'id' | 'timestamp'>;

interface PlacedNode {
  id: string;
  name: string;
  col: number;
  row: number;
}

function placesWithCoords(graph: WorldGraph): PlacedNode[] {
  const out: PlacedNode[] = [];
  for (const node of getLocationNodes(graph) as GraphNode[]) {
    const col = node.properties?.hexCol;
    const row = node.properties?.hexRow;
    if (typeof col !== 'number' || typeof row !== 'number') continue;
    out.push({ id: node.id, name: node.name ?? node.id, col, row });
  }
  return out;
}

/** The place a push on (col,row) lands on, with its distance; null when none is in range. */
export function findHexPressurePlace(
  places: PlacedNode[],
  hex: { col: number; row: number },
  radius: number = HEX_PRESSURE_FALLBACK_RADIUS,
): { place: PlacedNode; distance: number } | null {
  let best: { place: PlacedNode; distance: number } | null = null;
  for (const place of places) {
    const distance = hexDistance(hex, place);
    if (distance > radius) continue;
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && place.id < best.place.id)
    ) {
      best = { place, distance };
    }
  }
  return best;
}

/** Rewrite every pressure aimed at a hex id onto a place-tier location; drop the unanchored. */
export function resolveHexPressureTargets(
  graph: WorldGraph,
  pressures: SpherePressureEvent[],
  tick: number,
): { pressures: SpherePressureEvent[]; traces: HexPressureTraceInput[] } {
  if (!pressures.some(p => isHexTargetId(p.targetEntityId))) {
    return { pressures, traces: [] };
  }

  let places: PlacedNode[] | null = null;
  const out: SpherePressureEvent[] = [];
  const traces: HexPressureTraceInput[] = [];

  for (const p of pressures) {
    if (!isHexTargetId(p.targetEntityId)) {
      out.push(p);
      continue;
    }
    const hex = parseHexTargetId(p.targetEntityId);
    if (!hex) {
      out.push(p); // unparseable: the phase skips it as before
      continue;
    }
    places ??= placesWithCoords(graph);
    const found = findHexPressurePlace(places, hex);
    const base = {
      tick,
      hexId: p.targetEntityId,
      sphere: p.sphere,
      source: p.source,
      sourceId: p.sourceId,
    };
    if (found) {
      out.push({ ...p, targetEntityId: found.place.id });
      traces.push({
        ...base,
        category: 'sphere_pressure.hex_resolved',
        resolvedTo: found.place.id,
        distance: found.distance,
        summary: `${p.sphere} push on ${p.targetEntityId} lands on ${found.place.name}` +
          (found.distance === 0 ? ' (on the hex)' : ` (${found.distance} hex${found.distance === 1 ? '' : 'es'} away)`),
      });
    } else {
      traces.push({
        ...base,
        category: 'sphere_pressure.hex_unanchored',
        summary: `${p.sphere} push on ${p.targetEntityId} dropped: no place within ${HEX_PRESSURE_FALLBACK_RADIUS} hexes`,
      });
    }
  }

  return { pressures: out, traces };
}

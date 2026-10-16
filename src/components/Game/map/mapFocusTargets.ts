/**
 * mapFocusTargets.ts — the hexes the map camera centres on (THR-1900, plan THR-1878 D6, D8).
 *
 * - `resolvePlaceHex` — a place's hex, climbing `parentLocationId` so a sublocation finds its
 *   settlement's hex (THR-1792; the one climb the eye icons, the seat button and debug
 *   `gotoAgent` share).
 * - `resolveFirstHex` — where the First is drawn on the map (its marker's hex), else null.
 * - `resolveSeatHex` — the god's seat (`homeSeatLocationId`), else null.
 *
 * Fail-soft: a missing node, a missing hex or no god returns null — the caller falls back.
 */
import type { HexCoord } from '../../../types';
import type { WorldGraph } from '../../../engine/graph';
import { getFirstId } from '../../../engine/meetingEncounter';

/** How far up `parentLocationId` a place may climb to find a hex (sublocation → settlement). */
const PLACE_HEX_MAX_DEPTH = 3;

export function resolvePlaceHex(graph: WorldGraph, locationId: string): HexCoord | null {
  let node = graph.getNode(locationId);
  for (let depth = 0; depth < PLACE_HEX_MAX_DEPTH && node; depth++) {
    const props = (node.properties ?? {}) as Record<string, unknown>;
    if (typeof props.hexCol === 'number' && typeof props.hexRow === 'number') {
      return { col: props.hexCol, row: props.hexRow };
    }
    const parentId = props.parentLocationId as string | undefined;
    node = parentId ? graph.getNode(parentId) : undefined;
  }
  return null;
}

/** The First's hex as the map draws it, or null before the bond / with no god. */
export function resolveFirstHex(
  graph: WorldGraph,
  ascendantId: string | null | undefined,
  agents: readonly { id: string; hexCol: number; hexRow: number }[] | undefined,
): HexCoord | null {
  if (!ascendantId) return null;
  const firstId = getFirstId(graph, ascendantId);
  if (!firstId) return null;
  const marker = agents?.find(a => a.id === firstId);
  return marker ? { col: marker.hexCol, row: marker.hexRow } : null;
}

/** The god's seat hex, or null before the Seat beat / with no god. */
export function resolveSeatHex(graph: WorldGraph, ascendantId: string | null | undefined): HexCoord | null {
  if (!ascendantId) return null;
  const seatId = graph.getNode(ascendantId)?.properties.homeSeatLocationId as string | undefined;
  return seatId ? resolvePlaceHex(graph, seatId) : null;
}

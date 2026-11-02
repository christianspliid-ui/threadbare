// src/engine/hexActorIndex.ts
// Per-tick hex→actor index for phase-scoped iteration (THR-188).
// Pure function, no module-level state, no runtime dependency.

import type { WorldGraph } from './graph';
import { resolveToParentLocation } from './sublocationShape';

export type HexKey = string; // `${col},${row}`

export interface HexActorIndex {
  /** Map from hex key to actor ids present on that hex. */
  readonly byHex: ReadonlyMap<HexKey, readonly string[]>;
  /** Total actors indexed (matches totalActors in the caller's trace). */
  readonly totalActors: number;
  /** Actors whose location could not be resolved to a hex (for fail-soft trace). */
  readonly unresolvedCount: number;
}

export function hexKey(col: number, row: number): HexKey {
  return `${col},${row}`;
}

/**
 * The hex a location id stands on: a Place resolves up to its Location (THR-1183, via
 * the shared discriminator so both mint shapes resolve the same way), then the
 * Location's hexCol/hexRow. Null when any rung is missing.
 */
function hexOfLocationId(graph: WorldGraph, locationId: string | undefined): HexKey | null {
  if (typeof locationId !== 'string' || locationId.length === 0) return null;
  const raw = graph.getNode(locationId);
  if (!raw) return null;
  const locNode = resolveToParentLocation(graph, raw);
  if (!locNode || locNode.type !== 'location') return null;
  const col = locNode.properties?.hexCol as number | undefined;
  const row = locNode.properties?.hexRow as number | undefined;
  if (col === undefined || row === undefined) return null;
  return hexKey(col, row);
}

/**
 * Builds a per-tick index mapping each hex to the individual actor ids on it.
 *
 * Resolution order (THR-2137): the actor's `located_at` edge — the model of record,
 * the one movement rewrites — then the denormalized `properties.locationId` mirror,
 * which is only stamped at birth and goes stale once a mortal walks. The same order as
 * `binder.candidateHex`. Ambient NPCs (`seedNpcsAtLocations`) carry only the edge.
 * Sublocations resolve up to their parent location before hex coordinates are read.
 * Actors that can't be resolved go to unresolvedCount and are excluded from buckets.
 *
 * Iteration order matches graph.getNodesByType('actor') (stable insertion order),
 * preserving determinism.
 */
export function buildHexActorIndex(graph: WorldGraph): HexActorIndex {
  // The living only (THR-1631): a retained dead mortal keeps its `locationId`.
  const actors = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual' && a.properties?.deceased !== true);

  const byHex = new Map<HexKey, string[]>();
  let unresolvedCount = 0;

  for (const actor of actors) {
    const key = hexOfLocationId(graph, graph.getOutgoingEdges(actor.id, 'located_at')[0]?.target)
      ?? hexOfLocationId(graph, actor.properties?.locationId as string | undefined);
    if (key === null) {
      unresolvedCount++;
      continue;
    }

    const bucket = byHex.get(key);
    if (bucket) {
      bucket.push(actor.id);
    } else {
      byHex.set(key, [actor.id]);
    }
  }

  return {
    byHex,
    totalActors: actors.length,
    unresolvedCount,
  };
}

/**
 * Returns actor ids on the given hex, or an empty array if none.
 */
export function getActorsOnHex(
  index: HexActorIndex,
  col: number,
  row: number,
): readonly string[] {
  return index.byHex.get(hexKey(col, row)) ?? [];
}

// src/engine/hexActorIndex.ts
// Per-tick hex→actor index for phase-scoped iteration (THR-188).
// Pure function, no module-level state, no runtime dependency.

import type { WorldGraph } from './graph';

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
 * Builds a per-tick index mapping each hex to the individual actor ids on it.
 *
 * Resolution order: actor.properties.locationId → location node (hexCol/hexRow).
 * If locationId points to a sublocation (type 'sublocation'), resolves up to
 * parentLocationId before reading hex coordinates. Actors that can't be resolved
 * go to unresolvedCount and are excluded from buckets.
 *
 * Iteration order matches graph.getNodesByType('actor') (stable insertion order),
 * preserving determinism.
 */
export function buildHexActorIndex(graph: WorldGraph): HexActorIndex {
  const actors = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  const byHex = new Map<HexKey, string[]>();
  let unresolvedCount = 0;

  for (const actor of actors) {
    const locationId = actor.properties?.locationId as string | undefined;
    if (!locationId) {
      unresolvedCount++;
      continue;
    }

    let locNode = graph.getNode(locationId);
    if (!locNode) {
      unresolvedCount++;
      continue;
    }

    // Resolve sublocation up to parent location
    if (locNode.type === 'sublocation') {
      const parentId = locNode.properties?.parentLocationId as string | undefined;
      if (!parentId) {
        unresolvedCount++;
        continue;
      }
      locNode = graph.getNode(parentId);
      if (!locNode) {
        unresolvedCount++;
        continue;
      }
    }

    if (locNode.type !== 'location') {
      unresolvedCount++;
      continue;
    }

    const col = locNode.properties?.hexCol as number | undefined;
    const row = locNode.properties?.hexRow as number | undefined;
    if (col === undefined || row === undefined) {
      unresolvedCount++;
      continue;
    }

    const key = hexKey(col, row);
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

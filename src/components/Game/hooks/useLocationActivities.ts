/**
 * useLocationActivities.ts — React hook for location activity summaries (THR-22).
 *
 * Wraps deriveLocationActivities() in a worldVersion-gated useMemo.
 * Only recomputes when the game state changes (worldVersion bump).
 *
 * Visible hex set is derived from the fog visibility map — only processes
 * hexes the player can currently see (performance budget NFP #7).
 */

import { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { UnifiedAction } from '../../../types/unifiedAction';
import type { FamiliarityMap } from '../../../types/familiarity';
import type { OmenState } from '../../../types/omen';
import type { VisibilityMap } from '../../../types/visibility';
import {
  deriveLocationActivities,
  type DeriveLocationActivitiesResult,
} from '../../../engine/deriveLocationActivities';

export interface UseLocationActivitiesParams {
  graph: WorldGraph;
  unifiedActions: UnifiedAction[];
  familiarityMap: FamiliarityMap;
  visibilityMap: VisibilityMap | undefined;
  fogDisabled: boolean;
  tick: number;
  omenState?: OmenState;
  /** TB-086: Version counter for change detection */
  worldVersion: number;
}

/**
 * Returns derived location activity summaries, recomputed only when worldVersion changes.
 *
 * When fog is disabled, all hexes are treated as visible.
 * When fog is enabled, only 'visible' hex keys are included.
 */
export function useLocationActivities({
  graph,
  unifiedActions,
  familiarityMap,
  visibilityMap,
  fogDisabled,
  tick,
  omenState,
  worldVersion,
}: UseLocationActivitiesParams): DeriveLocationActivitiesResult {
  const visibleHexKeys = useMemo((): ReadonlySet<string> => {
    if (fogDisabled || !visibilityMap) {
      // All hexes visible — return a sentinel Set that always returns true
      // We represent this by using a special all-visible set.
      // Since we can't enumerate all hexes here, we return a special proxy.
      return ALL_HEXES_VISIBLE;
    }

    const keys = new Set<string>();
    for (const [key, entry] of visibilityMap) {
      if (entry.state === 'visible') keys.add(key);
    }
    return keys;
  }, [visibilityMap, fogDisabled]);

  return useMemo(
    () =>
      deriveLocationActivities({
        graph,
        unifiedActions,
        familiarityMap,
        visibleHexKeys,
        tick,
        omenState,
      }),
    // worldVersion is the change-detection key — graph is mutated in place
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, unifiedActions, familiarityMap, visibleHexKeys, tick, omenState, worldVersion],
  );
}

/**
 * Sentinel Set that reports every hex key as visible.
 * Used when fog is disabled — avoids iterating all map tiles.
 *
 * Overrides `has()` to always return true.
 */
const ALL_HEXES_VISIBLE: ReadonlySet<string> = new Proxy(new Set<string>(), {
  get(target, prop) {
    if (prop === 'has') return () => true;
    return Reflect.get(target, prop);
  },
}) as ReadonlySet<string>;

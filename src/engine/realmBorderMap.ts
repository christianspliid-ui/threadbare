/**
 * realmBorderMap.ts — the hex → realm map a holder question needs (THR-1955).
 *
 * `taxHolderOf` gives a place with two controllers to the realm whose border holds it,
 * but only when it is handed the realm projection's `hexRealmId`. The purse and the war
 * aims pass it; the regional monopoly readers (the phase, the stock pass's embargo cut,
 * the embargo action, the Trade lens, the debug views) pass it through this helper, so
 * every reader names the same holder for a guild-plus-realm town.
 *
 * Reads the session's cached projection (`ensureRealmProjection`). Fail-soft (NFP #4):
 * with no runtime, or if the projection throws, the map is empty and `taxHolderOf` falls
 * back to the strongest controller — the same answer every reader then shares.
 */

import type { WorldGraph } from './graph';
import type { HexTile } from '../types';
import { ensureRealmProjection, type SimulationRuntime } from './simulationRuntime';

const EMPTY: ReadonlyMap<string, string> = new Map();

export function realmBorderMap(
  runtime: SimulationRuntime | null | undefined,
  graph: WorldGraph,
  tiles: readonly HexTile[] | undefined,
  tick: number,
): ReadonlyMap<string, string> {
  if (!runtime) return EMPTY;
  try {
    return ensureRealmProjection(runtime, graph, (tiles ?? []) as HexTile[], tick).hexRealmId;
  } catch {
    return EMPTY;
  }
}

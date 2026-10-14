/**
 * ViewContext — what every selector reads, built once per `readView` call (THR-1822 § D2).
 *
 * The runtime counters ride along so a selector can report the versions it was
 * built at; selectors never key on graph identity (the graph is mutated in place).
 */
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types';
import type { WorldGraph } from '../graph';
import type { SimulationRuntime } from '../simulationRuntime';

export interface ViewContext {
  readonly state: GameState;
  readonly graph: WorldGraph;
  /** Null in tests and the style guide; a selector that needs it falls back. */
  readonly runtime: SimulationRuntime | null;
  /** The map's tiles (stable for a session). Empty when the caller has none. */
  readonly tiles: readonly HexTile[];
  readonly ascendantId: string;
  readonly tick: number;
  readonly worldVersion: number;
  readonly structureVersion: number;
}

export function buildViewContext(
  runtime: SimulationRuntime | null,
  state: GameState,
  tiles: readonly HexTile[] = [],
): ViewContext {
  return {
    state,
    graph: state.graph,
    runtime,
    tiles,
    ascendantId: state.ascendantId,
    tick: state.tick,
    worldVersion: runtime?.worldVersion ?? 0,
    structureVersion: runtime?.structuralCacheVersion ?? 0,
  };
}

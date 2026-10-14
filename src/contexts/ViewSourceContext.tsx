/**
 * ViewSourceContext — where `useView` finds the session's runtime and state
 * (THR-1822 § D2, § D4). Provided once, at GameView's root.
 *
 * Components below GameView read view models through `useView` instead of
 * receiving the raw graph as a prop.
 */
import { createContext } from 'react';
import type { GameState } from '../types/gameState';
import type { HexTile } from '../types';
import type { SimulationRuntime } from '../engine/simulationRuntime';

export interface ViewSource {
  runtime: SimulationRuntime | null;
  state: GameState;
  tiles: readonly HexTile[];
}

export const ViewSourceContext = createContext<ViewSource | null>(null);

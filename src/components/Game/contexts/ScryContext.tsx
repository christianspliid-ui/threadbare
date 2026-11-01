/**
 * ScryContext — Provides scry state and handlers to ScryOverlay without prop drilling.
 *
 * Eliminates 9+ props being passed from GameView → ScryOverlay by wrapping
 * scry state, handlers, and dependencies in a context provider.
 */

import { createContext, useContext, ReactNode } from 'react';
import type { ScryState, Title } from '../../../types/scry';
import type { RetinueAgent } from '../../../engine/retinue';
import type { EssencePool } from '../../../types/influence';
import type { SphereName } from '../../../types';
import type { EntityVisualDescriptor } from '../../../engine/views/entityVisualResolver';

interface ScryContextValue {
  // State
  scryState: ScryState;
  retinueAgents: RetinueAgent[];
  essencePool: EssencePool;
  primarySphere: SphereName;
  secondarySphere: SphereName;
  tick: number;
  seed: number;
  /**
   * THR-2101 (decision 3) — every seat's face, keyed by mortal id, built by the dialog host
   * through the one face path (`courtFaces`). A missing entry draws no face.
   */
  faces?: Readonly<Record<string, EntityVisualDescriptor>>;

  // Handlers
  onAssign: (positionId: string, agentId: string, title: Title, cost: number) => void;
  onDemote: (positionId: string) => void;
  onClose: () => void;
  /** Select a court member agent — opens ActionDrawer with their action cards */
  onAgentSelect?: (agentId: string) => void;
}

const ScryContext = createContext<ScryContextValue | undefined>(undefined);

interface ScryProviderProps {
  value: ScryContextValue;
  children: ReactNode;
}

export function ScryProvider({ value, children }: ScryProviderProps) {
  return (
    <ScryContext.Provider value={value}>
      {children}
    </ScryContext.Provider>
  );
}

export function useScryContext(): ScryContextValue {
  const context = useContext(ScryContext);
  if (!context) {
    throw new Error('useScryContext must be used within ScryProvider');
  }
  return context;
}

import { useState, useCallback } from 'react';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { ScryState, Title } from '../../../types/scry';
import {
  initializeCourt,
  assignAgentToPosition,
  demoteAgent,
} from '../../../engine/scry';

interface UseScryParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  archetype: AscendantArchetype;
  scryState: ScryState;
  setScryState: React.Dispatch<React.SetStateAction<ScryState>>;
}

export function useScry({ gameState, setGameState, archetype, scryState, setScryState }: UseScryParams) {
  const [scryVisible, setScryVisible] = useState(false);

  // Open scry callback (shared with hook and avatar HUD)
  const handleOpenScry = useCallback(() => {
    // Auto-initialize with high_house if not initialized
    if (!scryState.initialized) {
      setScryState(prev => initializeCourt(prev, 'high_house'));
    }
    setScryVisible(true);
  }, [scryState.initialized, setScryState]);

  const handleScryAssign = useCallback((positionId: string, agentId: string, title: Title, cost: number) => {
    // Spend essence from primary sphere
    const primarySphere = archetype.sphereAlignment.primary;
    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      if (newPool[primarySphere] >= cost) {
        newPool[primarySphere] -= cost;
      }
      return { ...prev, essencePool: newPool };
    });

    setScryState(prev => assignAgentToPosition(prev, positionId, agentId, title, cost, gameState.tick));
  }, [archetype, gameState.tick, setGameState, setScryState]);

  const handleScryDemote = useCallback((positionId: string) => {
    setScryState(prev => demoteAgent(prev, positionId, gameState.tick));
  }, [gameState.tick, setScryState]);

  const handleCloseScry = useCallback(() => {
    setScryVisible(false);
  }, []);

  const handleAvatarScryClick = useCallback(() => {
    handleOpenScry();
  }, [handleOpenScry]);

  return {
    scryState,
    scryVisible,
    handleOpenScry,
    handleScryAssign,
    handleScryDemote,
    handleCloseScry,
    handleAvatarScryClick,
  };
}

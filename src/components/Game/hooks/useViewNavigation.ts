import { useState, useRef, useCallback } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import { moveAvatarToHex } from '../../../engine/avatarMove';
import { recordPlayerAct } from '../../../engine/playerActs';
import type { ScryState } from '../../../types/scry';
import { visKey } from '../../../types/visibility';
import { useEscapeLayer } from '../../shared/useEscapeLayer';
import { Z_BAND } from '../../shared/zBands';

/**
 * The map's view level. Only `'world'` remains: the `'hex-zoom'` and `'location'` views
 * retired with the Inspector (THR-1911 re-routed their callers, THR-1912 deleted them), so
 * a hex or a place opens its page in the Inspector and the map never leaves the world.
 */
export type ViewLevel = 'world';

interface UseViewNavigationParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  avatarPixelPos: { x: number; y: number } | null;
  tiles: HexTile[];
  COLS: number;
  ROWS: number;
  scryState: ScryState;
  /** When true, fog-of-war checks are bypassed (all hexes clickable) */
  fogDisabled?: boolean;
  /** Simulation running state setter — used to auto-pause on move initiation and auto-unpause on target selection */
  setRunning?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseViewNavigationReturn {
  hoveredHex: { col: number; row: number } | null;
  setHoveredHex: React.Dispatch<React.SetStateAction<{ col: number; row: number } | null>>;
  selectedHex: { col: number; row: number } | null;
  viewLevel: ViewLevel;
  moveMode: boolean;
  hexMapRef: React.RefObject<HexMapV2Handle>;
  handleCenterOnAvatar: () => void;
  handleAvatarMoveClick: () => void;
  handleHexClickMove: (coord: { col: number; row: number }) => void;
}

export function useViewNavigation({
  gameState,
  setGameState,
  avatarPixelPos,
  tiles,
  COLS,
  ROWS,
  scryState: _scryState,
  fogDisabled,
  setRunning,
}: UseViewNavigationParams): UseViewNavigationReturn {
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);
  const viewLevel: ViewLevel = 'world';
  const [moveMode, setMoveMode] = useState(false);
  const hexMapRef = useRef<HexMapV2Handle>(null);

  const handleCenterOnAvatar = useCallback(() => {
    if (avatarPixelPos && hexMapRef.current) {
      hexMapRef.current.centerOn(avatarPixelPos.x, avatarPixelPos.y, 20);
    }
  }, [avatarPixelPos]);

  const handleAvatarMoveClick = useCallback(() => {
    setMoveMode(true);
    // Auto-pause so the player can plan their route without the game advancing
    setRunning?.(false);
  }, [setRunning]);

  // IX-009: Escape key cancels move mode (no timeout — player needs time to plan route).
  // Through the one registry at the map band (Law 23, THR-1884): a dialog open over
  // the map takes Escape first, and move mode waits for the next one.
  const cancelMoveMode = useCallback(() => setMoveMode(false), []);
  useEscapeLayer(moveMode, cancelMoveMode, Z_BAND.mapOverlay, 'move mode');

  const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
    if (moveMode) {
      const pathFound = moveAvatarToHex(
        gameState.graph, gameState.ascendantId, coord, gameState.tick,
        tiles, COLS, ROWS,
      );
      if (pathFound) {
        // Force re-render so route visualization appears — visibility recalc
        // happens later when the avatar actually moves during tick processing.
        // A move command is a player act — it paces the spine gifts (THR-1647).
        setGameState(prev => ({ ...prev, ...recordPlayerAct(prev) }));
        // Auto-unpause so the game runs while the ascendant travels to the target
        setRunning?.(true);
      }
      setMoveMode(false);
    } else {
      // A plain click selects a visible hex; the caller opens its land page (THR-1911, § D10).
      if (!fogDisabled) {
        const hexVis = gameState.visibilityMap.get(visKey(coord.col, coord.row));
        if (!hexVis || hexVis.state !== 'visible') return;
      }
      setSelectedHex(coord);
    }
  }, [moveMode, gameState.graph, gameState.ascendantId, gameState.tick, gameState.visibilityMap, fogDisabled, tiles, COLS, ROWS, setGameState, setRunning]);

  return {
    hoveredHex,
    setHoveredHex,
    selectedHex,
    viewLevel,
    moveMode,
    hexMapRef,
    handleCenterOnAvatar,
    handleAvatarMoveClick,
    handleHexClickMove,
  };
}

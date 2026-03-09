import { useState, useRef, useCallback, useEffect } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexMapHandle } from '../../HexMap/HexMap';
import { moveAvatarToHex } from '../../../engine/avatarMove';
import { recalcVisibility, collectLOSSources, getScryTargetHexes } from '../../../engine/visibility';
import type { ScryState } from '../../../types/scry';
import { visKey } from '../../../types/visibility';

export type ViewLevel = 'world' | 'hex-zoom' | 'location';

interface UseViewNavigationParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  avatarPixelPos: { x: number; y: number } | null;
  COLS: number;
  ROWS: number;
  scryState: ScryState;
}

interface UseViewNavigationReturn {
  hoveredHex: { col: number; row: number } | null;
  setHoveredHex: React.Dispatch<React.SetStateAction<{ col: number; row: number } | null>>;
  selectedHex: { col: number; row: number } | null;
  viewLevel: ViewLevel;
  focusedHex: { col: number; row: number } | null;
  focusedLocationId: string | null;
  moveMode: boolean;
  hexMapRef: React.RefObject<HexMapHandle>;
  handleHexClick: (coord: { col: number; row: number }) => void;
  handleLocationDoubleClick: (locationId: string) => void;
  handleBackToWorld: () => void;
  handleBackToHex: () => void;
  handleLocationClick: (locationId: string) => void;
  handleCenterOnAvatar: () => void;
  handleAvatarMoveClick: () => void;
  handleHexClickMove: (coord: { col: number; row: number }) => void;
}

export function useViewNavigation({
  gameState,
  setGameState,
  avatarPixelPos,
  COLS,
  ROWS,
  scryState,
}: UseViewNavigationParams): UseViewNavigationReturn {
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const hexMapRef = useRef<HexMapHandle>(null);

  const handleHexClick = useCallback((coord: { col: number; row: number }) => {
    // Only allow hex zoom into fully visible hexes — not unexplored or remembered (fog of war)
    const hexVis = gameState.visibilityMap.get(visKey(coord.col, coord.row));
    if (!hexVis || hexVis.state !== 'visible') return;

    setSelectedHex(coord);
    setViewLevel('hex-zoom');
    setFocusedHex(coord);
  }, [gameState.visibilityMap]);

  const handleLocationDoubleClick = useCallback((locationId: string) => {
    setViewLevel('location');
    setFocusedLocationId(locationId);
    // IX-013: View transition is handled; drawer close is done at GameView level
  }, []);

  const handleBackToWorld = useCallback(() => {
    setViewLevel('world');
    setFocusedHex(null);
    setFocusedLocationId(null);
    setSelectedHex(null); // IX-006: clear selection state on back navigation
  }, []);

  const handleBackToHex = useCallback(() => {
    setViewLevel('hex-zoom');
    setFocusedLocationId(null);
  }, []);

  const handleLocationClick = useCallback((_locationId: string) => {
    // Future: show info tooltip
  }, []);

  const handleCenterOnAvatar = useCallback(() => {
    if (avatarPixelPos && hexMapRef.current) {
      hexMapRef.current.centerOn(avatarPixelPos.x, avatarPixelPos.y, 3.0);
    }
  }, [avatarPixelPos]);

  const handleAvatarMoveClick = useCallback(() => {
    setMoveMode(true);
  }, []);

  // IX-009: Escape key cancels move mode; auto-timeout after 10s
  useEffect(() => {
    if (!moveMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoveMode(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const timeout = setTimeout(() => setMoveMode(false), 10_000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [moveMode]);

  const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
    if (moveMode) {
      moveAvatarToHex(gameState.graph, gameState.ascendantId, coord);
      const scryTargets = getScryTargetHexes(scryState, gameState.graph);
      const losSources = collectLOSSources(gameState.graph, gameState.ascendantId, scryTargets);
      const newVisibilityMap = recalcVisibility(gameState.visibilityMap, losSources, gameState.graph, gameState.tick, COLS, ROWS);
      setGameState(prev => ({
        ...prev,
        visibilityMap: newVisibilityMap,
      }));
      setMoveMode(false);
    } else {
      handleHexClick(coord);
    }
  }, [moveMode, gameState.graph, gameState.ascendantId, gameState.visibilityMap, gameState.tick, handleHexClick, COLS, ROWS, setGameState, scryState]);

  return {
    hoveredHex,
    setHoveredHex,
    selectedHex,
    viewLevel,
    focusedHex,
    focusedLocationId,
    moveMode,
    hexMapRef,
    handleHexClick,
    handleLocationDoubleClick,
    handleBackToWorld,
    handleBackToHex,
    handleLocationClick,
    handleCenterOnAvatar,
    handleAvatarMoveClick,
    handleHexClickMove,
  };
}

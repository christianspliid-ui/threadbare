import { useState, useRef, useCallback, useEffect } from 'react';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import type { HexMapV2Handle } from '../../HexMapV2/HexMapV2';
import { moveAvatarToHex } from '../../../engine/avatarMove';
import type { ScryState } from '../../../types/scry';
import { visKey } from '../../../types/visibility';

/**
 * View level state machine:
 *
 *   world  ──(hex click)──▶  hex-zoom  ──(location click)──▶  location
 *     ▲                         ▲                                │
 *     └──(back to world)────────┴──────(back to hex)─────────────┘
 *
 * **Direct jump:** The retinue panel eye icon calls handleLocationClick from
 * 'world' view, skipping 'hex-zoom'. handleLocationClick MUST derive and set
 * focusedHex from the location node — otherwise LocationView's guard
 * (viewLevel === 'location' && focusedHex) fails and nothing renders.
 *
 * State invariants:
 * - 'hex-zoom' and 'location' require focusedHex to be set
 * - 'location' additionally requires focusedLocationId to be set
 * - 'world' clears both focusedHex and focusedLocationId
 */
export type ViewLevel = 'world' | 'hex-zoom' | 'location';

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
}

interface UseViewNavigationReturn {
  hoveredHex: { col: number; row: number } | null;
  setHoveredHex: React.Dispatch<React.SetStateAction<{ col: number; row: number } | null>>;
  selectedHex: { col: number; row: number } | null;
  viewLevel: ViewLevel;
  focusedHex: { col: number; row: number } | null;
  focusedLocationId: string | null;
  moveMode: boolean;
  hexMapRef: React.RefObject<HexMapV2Handle>;
  handleHexClick: (coord: { col: number; row: number }) => void;
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
  tiles,
  COLS,
  ROWS,
  scryState: _scryState,
  fogDisabled,
}: UseViewNavigationParams): UseViewNavigationReturn {
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const hexMapRef = useRef<HexMapV2Handle>(null);

  const handleHexClick = useCallback((coord: { col: number; row: number }) => {
    // Only allow hex zoom into fully visible hexes — not unexplored or remembered (fog of war)
    if (!fogDisabled) {
      const hexVis = gameState.visibilityMap.get(visKey(coord.col, coord.row));
      if (!hexVis || hexVis.state !== 'visible') return;
    }

    setSelectedHex(coord);
    setViewLevel('hex-zoom');
    setFocusedHex(coord);
  }, [gameState.visibilityMap, fogDisabled]);

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

  const handleLocationClick = useCallback((locationId: string) => {
    // Derive the hex coordinates from the location node so that
    // focusedHex is always set — even when jumping directly from
    // the world view (e.g. retinue eye icon) without going through hex-zoom first.
    const node = gameState.graph.getNode(locationId);
    if (node) {
      const props = (node.properties ?? {}) as Record<string, unknown>;
      const col = props.hexCol as number | undefined;
      const row = props.hexRow as number | undefined;
      if (col != null && row != null) {
        setFocusedHex({ col, row });
        setSelectedHex({ col, row });
      }
    }
    setViewLevel('location');
    setFocusedLocationId(locationId);
  }, [gameState.graph]);

  const handleCenterOnAvatar = useCallback(() => {
    if (avatarPixelPos && hexMapRef.current) {
      hexMapRef.current.centerOn(avatarPixelPos.x, avatarPixelPos.y, 20);
    }
  }, [avatarPixelPos]);

  const handleAvatarMoveClick = useCallback(() => {
    setMoveMode(true);
  }, []);

  // IX-009: Escape key cancels move mode (no timeout — player needs time to plan route)
  useEffect(() => {
    if (!moveMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoveMode(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveMode]);

  const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
    if (moveMode) {
      const pathFound = moveAvatarToHex(
        gameState.graph, gameState.ascendantId, coord, gameState.tick,
        tiles, COLS, ROWS,
      );
      if (pathFound) {
        // Force re-render so route visualization appears — visibility recalc
        // happens later when the avatar actually moves during tick processing.
        setGameState(prev => ({ ...prev }));
      }
      setMoveMode(false);
    } else {
      handleHexClick(coord);
    }
  }, [moveMode, gameState.graph, gameState.ascendantId, gameState.tick, tiles, COLS, ROWS, handleHexClick, setGameState]);

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
    handleBackToWorld,
    handleBackToHex,
    handleLocationClick,
    handleCenterOnAvatar,
    handleAvatarMoveClick,
    handleHexClickMove,
  };
}

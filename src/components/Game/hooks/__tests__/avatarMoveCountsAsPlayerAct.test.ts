// @vitest-environment jsdom
/**
 * THR-1647 (S4) — an avatar move command is a player act: it bumps
 * `GameState.playerActCount`, which spaces the opening's spine gifts. A click
 * that finds no path is not a move and counts nothing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GameState } from '../../../../types/gameState';

const moveAvatarToHex = vi.fn();
vi.mock('../../../../engine/avatarMove', () => ({
  moveAvatarToHex: (...args: unknown[]) => moveAvatarToHex(...args),
}));

import { useViewNavigation } from '../useViewNavigation';

function harness(playerActCount?: number) {
  let state = {
    tick: 3,
    ascendantId: 'asc-1',
    graph: {},
    visibilityMap: new Map(),
    ...(playerActCount === undefined ? {} : { playerActCount }),
  } as unknown as GameState;
  const setGameState = vi.fn((u: GameState | ((p: GameState) => GameState)) => {
    state = typeof u === 'function' ? u(state) : u;
  });
  const { result } = renderHook(() => useViewNavigation({
    gameState: state,
    setGameState,
    avatarPixelPos: null,
    tiles: [],
    COLS: 1,
    ROWS: 1,
    scryState: {} as never,
    fogDisabled: true,
    setRunning: vi.fn(),
  }));
  return { result, setGameState, read: () => state };
}

describe('avatar move command counts as a player act (THR-1647)', () => {
  beforeEach(() => moveAvatarToHex.mockReset());

  it('a move with a path bumps playerActCount by one', () => {
    moveAvatarToHex.mockReturnValue(true);
    const h = harness(2);
    act(() => h.result.current.handleAvatarMoveClick());
    act(() => h.result.current.handleHexClickMove({ col: 0, row: 0 }));
    expect(moveAvatarToHex).toHaveBeenCalledTimes(1);
    expect(h.read().playerActCount).toBe(3);
  });

  it('reads a missing count as 0', () => {
    moveAvatarToHex.mockReturnValue(true);
    const h = harness();
    act(() => h.result.current.handleAvatarMoveClick());
    act(() => h.result.current.handleHexClickMove({ col: 0, row: 0 }));
    expect(h.read().playerActCount).toBe(1);
  });

  it('a click with no path is not a move and counts nothing', () => {
    moveAvatarToHex.mockReturnValue(false);
    const h = harness(2);
    act(() => h.result.current.handleAvatarMoveClick());
    act(() => h.result.current.handleHexClickMove({ col: 0, row: 0 }));
    expect(h.read().playerActCount).toBe(2);
    expect(h.setGameState).not.toHaveBeenCalled();
  });
});

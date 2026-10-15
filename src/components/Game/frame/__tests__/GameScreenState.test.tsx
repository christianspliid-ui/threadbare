// @vitest-environment jsdom
/**
 * THR-1881 step e — the game screen's shared dialog flags.
 *
 * The setters must keep `useState`'s contract (value or updater), because every
 * caller that used to hold a `useState` setter now holds one of these.
 */
import { describe, it, expect } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import {
  gameScreenReducer,
  GameScreenStateProvider,
  INITIAL_GAME_SCREEN_FLAGS,
  useGameScreenState,
  useGameScreenStore,
} from '../GameScreenState';

describe('gameScreenReducer', () => {
  it('sets a flag from a value and from an updater', () => {
    const opened = gameScreenReducer(INITIAL_GAME_SCREEN_FLAGS, { type: 'set', key: 'codexOpen', value: true });
    expect(opened.codexOpen).toBe(true);
    const counted = gameScreenReducer(opened, { type: 'set', key: 'chapterLedgerSeenCount', value: (n) => n + 3 });
    expect(counted.chapterLedgerSeenCount).toBe(3);
    expect(counted.codexOpen).toBe(true);
  });

  it('returns the same state object when nothing changes', () => {
    const same = gameScreenReducer(INITIAL_GAME_SCREEN_FLAGS, { type: 'set', key: 'doomDetailOpen', value: false });
    expect(same).toBe(INITIAL_GAME_SCREEN_FLAGS);
  });
});

describe('useGameScreenStore', () => {
  it('keeps setters stable across renders', () => {
    const { result } = renderHook(() => useGameScreenStore());
    const before = result.current.setReadThreadsOpen;
    act(() => result.current.setReadThreadsOpen(true));
    expect(result.current.state.readThreadsOpen).toBe(true);
    expect(result.current.setReadThreadsOpen).toBe(before);
    act(() => result.current.setReadThreadsOpen(open => !open));
    expect(result.current.state.readThreadsOpen).toBe(false);
  });

  it('hands the store to readers through the provider', () => {
    let seen: boolean | null = null;
    function Reader() {
      seen = useGameScreenState().state.mandateDetailOpen;
      return null;
    }
    function Owner() {
      const store = useGameScreenStore();
      if (!store.state.mandateDetailOpen) store.setMandateDetailOpen(true);
      return <GameScreenStateProvider value={store}><Reader /></GameScreenStateProvider>;
    }
    render(<Owner />);
    expect(seen).toBe(true);
  });
});

describe('useGameScreenState without a provider', () => {
  it('fails soft: every flag closed, setters do nothing', () => {
    const { result } = renderHook(() => useGameScreenState());
    expect(result.current.state).toEqual(INITIAL_GAME_SCREEN_FLAGS);
    expect(() => result.current.setChapterLedgerOpen(true)).not.toThrow();
  });
});

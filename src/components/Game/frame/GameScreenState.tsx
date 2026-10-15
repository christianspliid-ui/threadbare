/**
 * GameScreenState — the game screen's shared open/close flags (THR-1881 step e).
 *
 * The flags here are written by one part of the screen and read by another: the
 * top bar and the rails open a dialog, DialogHost renders it, and GameView's
 * interrupt registry and `getOpenModals()` read whether it is open. State read by
 * one host lives in that host; state read by more than one lives here, in one
 * reducer, instead of being prop-drilled through GameView.
 *
 * GameView owns the store (`useGameScreenStore`) because its interrupt registry
 * and debug levers read the flags in the same render; it hands the store down
 * through `GameScreenStateProvider`. Hosts and rails read it with
 * `useGameScreenState()`.
 *
 * Setters keep `useState`'s contract (a value or an updater function), so moving
 * a flag here changes no caller.
 */
import { createContext, useContext, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export interface GameScreenFlags {
  /** Read the Threads panel (THR-603 family). */
  readThreadsOpen: boolean;
  /** Chapter Ledger overlay (THR-603). */
  chapterLedgerOpen: boolean;
  /** Threaded chapters counted when the ledger was last opened (THR-1648 S5). */
  chapterLedgerSeenCount: number;
  /** Codex overlay (THR-613). */
  codexOpen: boolean;
  /** Doom clock detail. */
  doomDetailOpen: boolean;
  /** Mandate detail. */
  mandateDetailOpen: boolean;
}

export const INITIAL_GAME_SCREEN_FLAGS: GameScreenFlags = {
  readThreadsOpen: false,
  chapterLedgerOpen: false,
  chapterLedgerSeenCount: 0,
  codexOpen: false,
  doomDetailOpen: false,
  mandateDetailOpen: false,
};

type FlagKey = keyof GameScreenFlags;

type GameScreenAction = {
  [K in FlagKey]: { type: 'set'; key: K; value: SetStateAction<GameScreenFlags[K]> };
}[FlagKey];

export function gameScreenReducer(state: GameScreenFlags, action: GameScreenAction): GameScreenFlags {
  if (action.type !== 'set') return state;
  const prev = state[action.key];
  const next = typeof action.value === 'function'
    ? (action.value as (p: typeof prev) => typeof prev)(prev)
    : action.value;
  if (Object.is(prev, next)) return state;
  return { ...state, [action.key]: next };
}

export interface GameScreenStore {
  state: GameScreenFlags;
  setReadThreadsOpen: Dispatch<SetStateAction<boolean>>;
  setChapterLedgerOpen: Dispatch<SetStateAction<boolean>>;
  setChapterLedgerSeenCount: Dispatch<SetStateAction<number>>;
  setCodexOpen: Dispatch<SetStateAction<boolean>>;
  setDoomDetailOpen: Dispatch<SetStateAction<boolean>>;
  setMandateDetailOpen: Dispatch<SetStateAction<boolean>>;
}

/** Owned by GameView: one reducer, setters stable for the session. */
export function useGameScreenStore(): GameScreenStore {
  const [state, dispatch] = useReducer(gameScreenReducer, INITIAL_GAME_SCREEN_FLAGS);
  const setters = useMemo(() => ({
    setReadThreadsOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'readThreadsOpen', value }),
    setChapterLedgerOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'chapterLedgerOpen', value }),
    setChapterLedgerSeenCount: (value: SetStateAction<number>) => dispatch({ type: 'set', key: 'chapterLedgerSeenCount', value }),
    setCodexOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'codexOpen', value }),
    setDoomDetailOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'doomDetailOpen', value }),
    setMandateDetailOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'mandateDetailOpen', value }),
  }), []);
  return useMemo(() => ({ state, ...setters }), [state, setters]);
}

const noop = () => {};

/**
 * Fail-soft default: a host rendered without a provider (a unit test, a lab
 * view) sees every flag closed and its setters do nothing, rather than throwing.
 */
const INERT_STORE: GameScreenStore = {
  state: INITIAL_GAME_SCREEN_FLAGS,
  setReadThreadsOpen: noop,
  setChapterLedgerOpen: noop,
  setChapterLedgerSeenCount: noop,
  setCodexOpen: noop,
  setDoomDetailOpen: noop,
  setMandateDetailOpen: noop,
};

const GameScreenStateContext = createContext<GameScreenStore>(INERT_STORE);

export function GameScreenStateProvider({ value, children }: { value: GameScreenStore; children: ReactNode }) {
  return <GameScreenStateContext.Provider value={value}>{children}</GameScreenStateContext.Provider>;
}

export function useGameScreenState(): GameScreenStore {
  return useContext(GameScreenStateContext);
}

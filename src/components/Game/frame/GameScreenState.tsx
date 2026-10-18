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
import type { MapLensId } from '../../../data/map-lenses';
import type { LedgerSectionId } from '../../../data/frame-registry';
import { readLedgerFoldedPref } from './ledgerFold';

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
  /**
   * THR-1878 (plan § D2) — the map lens that is on, or none. Null at the start of
   * every run, kept across view changes. Radio, not stack: `toggleLens` turns one
   * on and any other off. The key hook, the lens bar and the debug bridge write it;
   * GameMap reads it.
   */
  activeLens: MapLensId | null;
  /**
   * THR-1878 (D2) — two dims never stack. Set by the Stage (THR-1877) while a moment
   * dims the map, and by the arming flow (THR-1876) if arming lights the map. While
   * true the lens layer is not drawn; the bar keeps the lens pressed and says why.
   */
  lensSuppressed: boolean;
  /**
   * THR-1893 (frame plan § F8) — the Ledger rail folded to its strip by the player
   * (`L`, the Fold control). Mirrors `LEDGER_FOLDED_KEY` (Law 51); the rail writes it back.
   */
  ledgerFoldPref: boolean;
  /**
   * THR-1893 (§ F8) — the Ledger flyout, open over the Inspector's edge on this section,
   * or closed. Only opens while the Inspector folds the rail.
   */
  ledgerFlyout: LedgerSectionId | null;
  /** THR-1893 — the section `L` opens the flyout on: the last one used, Threads first. */
  ledgerLastSection: LedgerSectionId;
  /**
   * THR-1893 (§ F8, § F12) — the docked Inspector is open, so the Ledger rail folds.
   * THR-1876 writes it when the Inspector lands; until then it stays false (and the
   * debug lever `setFrameInspectorOpen` forces it for the fold check).
   */
  inspectorOpen: boolean;
  /**
   * THR-1893 (§ F7) — open the Chapter Ledger at this chapter (a Ledger tab row's key);
   * null opens it at the newest.
   */
  chapterLedgerInitialKey: string | null;
}

export const INITIAL_GAME_SCREEN_FLAGS: GameScreenFlags = {
  readThreadsOpen: false,
  chapterLedgerOpen: false,
  chapterLedgerSeenCount: 0,
  codexOpen: false,
  doomDetailOpen: false,
  mandateDetailOpen: false,
  activeLens: null,
  lensSuppressed: false,
  ledgerFoldPref: false,
  ledgerFlyout: null,
  ledgerLastSection: 'threads',
  inspectorOpen: false,
  chapterLedgerInitialKey: null,
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
  setActiveLens: Dispatch<SetStateAction<MapLensId | null>>;
  setLensSuppressed: Dispatch<SetStateAction<boolean>>;
  setLedgerFoldPref: Dispatch<SetStateAction<boolean>>;
  setLedgerFlyout: Dispatch<SetStateAction<LedgerSectionId | null>>;
  setLedgerLastSection: Dispatch<SetStateAction<LedgerSectionId>>;
  setInspectorOpen: Dispatch<SetStateAction<boolean>>;
  setChapterLedgerInitialKey: Dispatch<SetStateAction<string | null>>;
}

/** The one-at-a-time rule: pressing the lens that is on turns it off; any other replaces it. */
export function toggleLensValue(prev: MapLensId | null, id: MapLensId): MapLensId | null {
  return prev === id ? null : id;
}

function initialFlags(base: GameScreenFlags): GameScreenFlags {
  return { ...base, ledgerFoldPref: readLedgerFoldedPref() };
}

/** Owned by GameView: one reducer, setters stable for the session. */
export function useGameScreenStore(): GameScreenStore {
  // THR-1893: the Ledger fold is a remembered preference (Law 51), read once at mount.
  const [state, dispatch] = useReducer(gameScreenReducer, INITIAL_GAME_SCREEN_FLAGS, initialFlags);
  const setters = useMemo(() => ({
    setReadThreadsOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'readThreadsOpen', value }),
    setChapterLedgerOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'chapterLedgerOpen', value }),
    setChapterLedgerSeenCount: (value: SetStateAction<number>) => dispatch({ type: 'set', key: 'chapterLedgerSeenCount', value }),
    setCodexOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'codexOpen', value }),
    setDoomDetailOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'doomDetailOpen', value }),
    setMandateDetailOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'mandateDetailOpen', value }),
    setActiveLens: (value: SetStateAction<MapLensId | null>) => dispatch({ type: 'set', key: 'activeLens', value }),
    setLensSuppressed: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'lensSuppressed', value }),
    setLedgerFoldPref: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'ledgerFoldPref', value }),
    setLedgerFlyout: (value: SetStateAction<LedgerSectionId | null>) => dispatch({ type: 'set', key: 'ledgerFlyout', value }),
    setLedgerLastSection: (value: SetStateAction<LedgerSectionId>) => dispatch({ type: 'set', key: 'ledgerLastSection', value }),
    setInspectorOpen: (value: SetStateAction<boolean>) => dispatch({ type: 'set', key: 'inspectorOpen', value }),
    setChapterLedgerInitialKey: (value: SetStateAction<string | null>) => dispatch({ type: 'set', key: 'chapterLedgerInitialKey', value }),
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
  setActiveLens: noop,
  setLensSuppressed: noop,
  setLedgerFoldPref: noop,
  setLedgerFlyout: noop,
  setLedgerLastSection: noop,
  setInspectorOpen: noop,
  setChapterLedgerInitialKey: noop,
};

const GameScreenStateContext = createContext<GameScreenStore>(INERT_STORE);

export function GameScreenStateProvider({ value, children }: { value: GameScreenStore; children: ReactNode }) {
  return <GameScreenStateContext.Provider value={value}>{children}</GameScreenStateContext.Provider>;
}

export function useGameScreenState(): GameScreenStore {
  return useContext(GameScreenStateContext);
}

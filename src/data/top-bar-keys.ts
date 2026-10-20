/**
 * top-bar-keys.ts — the keys the top bar's hotkey hook answers (THR-1900, plan THR-1878 D9).
 *
 * Lifted out of `useTopBarHotkeys.ts`, which reads this list, so the key-overlap test
 * (`mapKeys.coverage.test.ts`) checks the real keys against `MAP_COMMANDS` and the lens keys.
 * Space toggles time, `+` / `=` / `-` change speed, `.` steps one day, `m` / `M` opens Move.
 * The frame's keys come from its list entries (`FRAME_HOTKEYS`, THR-1893 — `L` folds the
 * Ledger rail), never typed here a second time.
 */
import { FRAME_HOTKEYS } from './frame-registry';

/**
 * THR-1911 (Inspector plan § D3) — `W` cycles the Inspector's size (docked → wide → full).
 * Free because map panning moved to the arrow keys (THR-1900).
 */
export const INSPECTOR_HOTKEYS: readonly string[] = ['w', 'W'];

/**
 * THR-1911 — Alt+← / Alt+→ walk the Inspector's history. Modifier-qualified, so they are
 * not in `TOP_BAR_KEYS` (which compares bare keys): the map's pan keys ignore Alt.
 */
export const INSPECTOR_HISTORY_KEYS = { back: 'ArrowLeft', forward: 'ArrowRight' } as const;

/**
 * THR-1915 (Inspector plan § D3, § D11) — `/` opens Find when no input has focus. A bare
 * key, so it joins `TOP_BAR_KEYS` and the overlap test.
 */
export const FIND_HOTKEYS: readonly string[] = ['/'];

/**
 * THR-1915 — Ctrl+K / Cmd+K opens Find from anywhere, an input included. Modifier-qualified,
 * so it is not in `TOP_BAR_KEYS` (which compares bare keys), like the Inspector's Alt+arrows.
 */
export const FIND_CTRL_KEY = 'k';

export const TOP_BAR_KEYS: readonly string[] = [' ', '+', '=', '-', '.', 'm', 'M', ...FRAME_HOTKEYS, ...INSPECTOR_HOTKEYS, ...FIND_HOTKEYS];

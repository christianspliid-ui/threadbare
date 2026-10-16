/**
 * top-bar-keys.ts — the keys the top bar's hotkey hook answers (THR-1900, plan THR-1878 D9).
 *
 * Lifted out of `useTopBarHotkeys.ts`, which reads this list, so the key-overlap test
 * (`mapKeys.coverage.test.ts`) checks the real keys against `MAP_COMMANDS` and the lens keys.
 * Space toggles time, `+` / `=` / `-` change speed, `.` steps one day, `m` / `M` opens Move.
 * The frame build (THR-1875) adds its keys here.
 */
export const TOP_BAR_KEYS: readonly string[] = [' ', '+', '=', '-', '.', 'm', 'M'];

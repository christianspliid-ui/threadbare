/**
 * frame-content.ts — the screen frame's words (THR-1875 plan; slice 1 THR-1893).
 *
 * Every player-facing string the frame draws that is not a tooltip registry entry:
 * the Ledger rail's headers, the Chronicle's tab labels and groups, the Ledger tab's
 * rows, the strip's counts, the World-Soul line's mood sentences. Slices 2 and 3 add
 * the god rail's and Needs you's words here.
 *
 * **Counts read right at one (PC-3).** Every string with a count is a `{ one, other }`
 * pair rendered through `countWords`, never `n + ' things'`. `frameCountWords.test.ts`
 * renders every pair at 1 and 2.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | CHRONICLE_NOW_SEASONS | 4 | The Now tab's window, in seasons (one rolling year) |
 */
import { countWord } from '../engine/aftermathWords';

/** A count's two forms; `{n}` is the number. */
export interface CountPair {
  readonly one: string;
  readonly other: string;
}

/** The one plural helper for frame counts: picks the form and fills `{n}` (and any extra slots). */
export function countWords(n: number, pair: CountPair, slots: Record<string, string | number> = {}): string {
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  let out = (count === 1 ? pair.one : pair.other).replace(/\{n\}/g, String(count));
  for (const [k, v] of Object.entries(slots)) out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  return out;
}

// ─── The Chronicle ──────────────────────────────────────────────────

/** The Now tab's window, in seasons: the current season and the three before it. */
export const CHRONICLE_NOW_SEASONS = 4;

/** `ui.chronicle`'s description, built at render so a retune of the window never makes it false. */
export const CHRONICLE_TOOLTIP =
  'The story of the world so far, newest first. Now holds the last {now} seasons; Years keeps every year; Ledger lists your mortals\' chapters.';

export function chronicleTooltipDesc(nowSeasons: number = CHRONICLE_NOW_SEASONS): string {
  return CHRONICLE_TOOLTIP.replace('{now}', countWord(nowSeasons));
}

export const CHRONICLE_LABEL = 'Chronicle';
export const CHRONICLE_EMPTY_LINE = 'The world awaits...';
export const CHRONICLE_TAB_LABELS = { now: 'Now', years: 'Years', ledger: 'Ledger' } as const;
/** "Year 2 · 14 entries" — `{year}` is the calendar year as the top bar shows it. */
export const CHRONICLE_YEAR_GROUP: CountPair = { one: 'Year {year} · {n} entry', other: 'Year {year} · {n} entries' };
export const CHRONICLE_VOICE_LABEL = 'Voice';

// ─── The World-Soul line ────────────────────────────────────────────

export const WORLD_SOUL_LABEL = 'World-Soul';

/**
 * The world's mood for each doom stage, three lines each — World Pulse's lines,
 * moved unchanged (THR-1893). The World-Soul line picks one per season, never per tick.
 */
export const WORLD_MOOD_LINES: Readonly<Record<number, readonly string[]>> = {
  0: ['The world stirs quietly.', 'All seems well and ordered.', 'Peace reigns, at least for now.'],
  1: ['Tension rises beneath the surface.', 'Whispers of change drift through the lands.', 'The balance begins to shift.'],
  2: ['Conflict brews in distant places.', 'Cracks appear in the foundations.', 'Unrest spreads like wildfire.'],
  3: ['War consumes the world in darkness.', 'All bonds shatter under strain.', 'The end comes ever closer.'],
  4: ['The Unmaking begins.', 'All races toward oblivion.', 'Only echoes remain.'],
};

// ─── The Ledger tab ─────────────────────────────────────────────────

export const LEDGER_TAB_NEW = 'new';
export const LEDGER_TAB_OPEN_BUTTON = 'Open the Chapter Ledger';
export const LEDGER_TAB_EMPTY = 'No chapters yet. They arrive as your threaded mortals live them.';
/** The Ledger tab's spoken unread count ("Ledger · 2"). */
export const LEDGER_TAB_UNREAD: CountPair = { one: '{n} new chapter', other: '{n} new chapters' };

// ─── The rail's header, fold and strip ──────────────────────────────

export const THREADS_LABEL = 'Threads';
export const LEDGER_FOLD_LABEL = 'Fold';
export const LEDGER_RAIL_ARIA = 'Threads and the Chronicle';
export const LEDGER_FLYOUT_ARIA = 'Threads and the Chronicle, over the Inspector';
export const STRIP_UNFOLD_LABEL = 'Unfold the rail · L';
/** The strip's counts; the tooltip reads "{section} · {count}". */
export const STRIP_COUNT_LABELS: Readonly<Record<'threads' | 'chronicle' | 'ledger', CountPair>> = {
  threads: { one: '{n} chapter waits', other: '{n} chapters wait' },
  chronicle: { one: '{n} new', other: '{n} new' },
  ledger: { one: '{n} new chapter', other: '{n} new chapters' },
};

/** The thread row's pip — the same words the strip's Threads count uses. */
export const THREAD_PIP_LABEL = 'A chapter waits';

// ─── The speed stepper (moved from World Pulse) ─────────────────────

export const SPEED_DOWN_ARIA = 'Decrease speed';
export const SPEED_UP_ARIA = 'Increase speed';

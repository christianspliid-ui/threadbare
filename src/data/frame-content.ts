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

// ─── The god rail (slice 2, THR-1894) ───────────────────────────────

export const GOD_RAIL_ARIA = 'Ascendant status';
export const ESSENCE_LABEL = 'Essence';
export const ESSENCE_PRIMARY_LABEL = 'Primary';
export const ATTENTION_LABEL = 'Attention';
/** "Your First: Kael Thorne" — after the bond only (Law 56). */
export const YOUR_FIRST_LABEL = 'Your First';

/** The hand's header on screen. "Your cards", never "Your hand" (UL: a hand is a step's dealt cards). */
export const HAND_HEADER = 'Your cards';
export const HAND_EMPTY_LINE = "No cards yet. Your story's gifts bring them.";
/** The rest lines while a moment is open (§ F6). */
export const HAND_REST_LINES = {
  encounter: 'Your cards wait. This encounter deals its own hand.',
  moment: 'Your cards wait while this moment is open.',
} as const;
/** A grouped hand's header: "Spirit · 4". */
export const HAND_GROUP_HEADER = '{sphere} · {n}';
/** A card the pool cannot pay even on sovereign ground. */
export const HAND_UNPAYABLE_REASON = 'Not enough {sphere} essence';
/** The two core verbs that head the hand. */
export const HAND_CORE_VERBS = {
  move: { label: 'Move', desc: 'Navigate through the world' },
  investiture: { label: 'Investiture', desc: 'Manage your divine court' },
} as const;

/** The longest folded-row summary; longer falls back to the shorter form. */
export const GOD_RAIL_SUMMARY_MAX_CH = 24;
/** Folded-row summaries. Reaches is "{reach} · {tier}", falling back to "{tier}". */
export const GOD_RAIL_ROW_SUMMARIES = {
  reaches: '{reach} · {tier}',
  covenants: { one: '{n} held', other: '{n} held' } as CountPair,
  signatures: { one: '{n} yours', other: '{n} yours' } as CountPair,
  hooks: { one: '{n} on you', other: '{n} on you' } as CountPair,
} as const;
/** The god rail's section labels. */
export const GOD_RAIL_LABELS = {
  identity: 'Identity',
  essence: ESSENCE_LABEL,
  hand: HAND_HEADER,
  reaches: 'Reaches',
  mandate: 'Mandate',
  covenants: 'Covenants',
  signatures: 'Signatures',
  hooks: 'Hooks',
} as const;

/** The par price's tooltip (`ui.hand_price`): the Foreign band's line, then the cast clause. */
export const HAND_PRICE_TOOLTIP = 'The price on {par} ground: {parLine} {sovereign}. {hostile}. A target\'s own price shows when you choose it.';
/** Added for the two cards whose price follows the target's tier. */
export const HAND_PRICE_TIER_SCALED = 'A rarer target costs more.';

// ─── The top bar and Needs you (slice 3, THR-1875; plan § F3–F5) ──────

/** The pill's word, always shown before its count (THR-1834 § 5). */
export const NEEDS_YOU_LABEL = 'Needs you';
/** The pill's aria and tooltip label: "1 thing needs you" / "3 things need you". */
export const NEEDS_YOU_PILL_LABEL: CountPair = { one: '{n} thing needs you', other: '{n} things need you' };
/** The list's group headers, followed by " · {n}". */
export const NEEDS_YOU_GROUP_TITLES = {
  waiting: 'Waiting for you',
  held: 'Held behind this chapter',
  news: 'News',
} as const;
/** The fold row at the end of a group it shortens. */
export const NEEDS_YOU_FOLD_ROW: CountPair = { one: 'and {n} more', other: 'and {n} more' };
export const NEEDS_YOU_LIST_ARIA = 'Things that need you';

/**
 * `ui.needs_you_news`'s description, built at render from `NEEDS_YOU_NEWS_KEEP_DAYS` so a
 * retune can never make it false. `{keep}` is a duration in words ("three days").
 */
export const NEEDS_YOU_NEWS_TOOLTIP =
  'What changed in the world that touches you. A row leaves when you open it, or after {keep}.';

export function needsYouNewsTooltipDesc(keepWords: string): string {
  return NEEDS_YOU_NEWS_TOOLTIP.replace('{keep}', keepWords);
}

/** The named pause on the time status line (§ F4): "paused · {line}". */
export const NAMED_PAUSE_STATUS = 'paused · {line}';

/** Top-bar words (§ F3). Every control keeps its word; only reveal gates hide an item. */
export const TOP_BAR_WORDS = {
  doom: 'Doom',
  doomUnmade: 'Unmade',
  omen: 'Omen',
  rivals: 'Rivals',
  notables: 'Notables',
  readThreads: 'Read the Threads',
  settings: 'Settings',
} as const;

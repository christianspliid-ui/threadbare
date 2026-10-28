/**
 * The opening reveal table (THR-1837, plan `2026-10-12-thr-1808-post-bond-reveal.md` C1).
 *
 * After the bond the god's screen shows The First, her chapter, the essence and
 * the hand; every other panel arrives with the gift whose words introduce it.
 * (THR-1893: World Pulse retired, so its row went; the a_path_opens toast now reads
 * "New beside the map: your Reaches, the World-Soul and Omens.")
 * (THR-1986: Attention waits for the first chapter, the first moment that draws
 * on it; Dominion arrives with the Reaches it is read with.)
 * Each row keys one dashboard surface (by id, never by screen position) to the
 * thing that brings it: the bond, The First's first chapter, or one opening gift.
 * (THR-2060, plan `2026-10-26-thr-2058-one-thing-at-a-time.md` E1–E2: a fired
 * trigger makes a labelled row *ready*; ready rows then arrive one per closed First
 * chapter, in table order. Rivals and the map lenses joined the table.)
 *
 * Moving a row is a one-line change (NFP #1). Every gift `beatId` must be an
 * `ASCENDANT_SPINE` id — a test asserts it; at runtime an unknown id reveals at
 * the bond (`unknown_beat`).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | OPENING_REVEAL_TABLE         | 21 rows   | Which surface waits for which trigger |
 * | OPENING_REVEAL_CEILING_TICKS | 200       | Ticks after the bond when every row is ready (THR-2060: they still arrive one at a time) |
 * | OPENING_REVEAL_CHAPTERS_PER_ARRIVAL | 1   | Closed First chapters between two arrivals (THR-2060) |
 * | OPENING_REVEAL_ARRIVAL_IDLE_TICKS   | 36  | Running ticks after which the next arrival comes without a chapter |
 * | ATTENTION_GAUGE_SHOWN        | false     | The Attention gauge shows only once something spends Attention |
 * | OPENING_REVEAL_HIGHLIGHT_MS  | 6000      | Gold ring on a newly revealed panel (0 = off) |
 * | OPENING_REVEAL_SHOW_ALL_KEY  | localStorage key for "Show every panel" |
 */

import { SPINE_IDLE_FALLBACK_TICKS } from './ascendant-beat-content';

export type OpeningRevealSurfaceId =
  | 'time_controls'
  | 'identity'
  | 'essence'
  | 'attention'
  | 'hand'
  | 'threads'
  | 'chapter_ledger'
  | 'investiture'
  | 'chronicle'
  | 'settings'
  | 'read_threads'
  | 'doom'
  | 'mandate'
  | 'notables'
  | 'reaches'
  | 'world_soul'
  | 'omen'
  | 'dominion'
  | 'rivals'
  | 'lens_threads'
  | 'lens_trade';

export type OpeningRevealTrigger =
  | { readonly kind: 'bond' }
  | { readonly kind: 'first_chapter' }
  | { readonly kind: 'gift'; readonly beatId: string }
  /** THR-2060: once any rival has acted (an intervention landed or a scheme launched). */
  | { readonly kind: 'rival_acted' }
  /** THR-2060: only the ceiling brings it. */
  | { readonly kind: 'ceiling' };

export interface OpeningRevealRow {
  readonly surface: OpeningRevealSurfaceId;
  readonly trigger: OpeningRevealTrigger;
  /** The noun the "New beside the map" line uses. Absent for rows shown at the bond. */
  readonly newLabel?: string;
  /**
   * THR-2060: arrives in the same step as this surface (Reaches and Dominion, THR-1986).
   * An unknown id is ignored: the row arrives on its own.
   */
  readonly arrivesWith?: OpeningRevealSurfaceId;
}

/**
 * Master switch for the Attention gauge (THR-2060 U4). THR-2062: answering a Thread
 * Tug spends Attention (`attendThreadTug`), and the gauge renders only while
 * `attentionCanBeSpent` holds — a mortal on *Lives on* is in the court.
 */
export const ATTENTION_GAUGE_SHOWN = true;

const BOND = { kind: 'bond' } as const;
const gift = (beatId: string): OpeningRevealTrigger => ({ kind: 'gift', beatId });

/**
 * Table order is queue order (THR-2060): ready rows arrive first to last, one per
 * closed First chapter. Rows with no `newLabel` never queue (they show when ready).
 */
export const OPENING_REVEAL_TABLE: readonly OpeningRevealRow[] = [
  { surface: 'time_controls', trigger: BOND },
  { surface: 'identity', trigger: BOND },
  { surface: 'essence', trigger: BOND },
  { surface: 'hand', trigger: BOND },
  { surface: 'threads', trigger: BOND },
  { surface: 'chronicle', trigger: BOND },
  { surface: 'settings', trigger: BOND },
  { surface: 'read_threads', trigger: BOND },
  // While the gauge is hidden it has nothing to announce, so it does not queue.
  { surface: 'attention', trigger: { kind: 'first_chapter' }, ...(ATTENTION_GAUGE_SHOWN ? { newLabel: 'Attention' } : {}) },
  { surface: 'chapter_ledger', trigger: { kind: 'first_chapter' }, newLabel: 'the Chapter Ledger' },
  { surface: 'notables', trigger: gift('beat.spine.the_first_word'), newLabel: 'Notables' },
  { surface: 'reaches', trigger: gift('beat.spine.a_path_opens'), newLabel: 'your Reaches' },
  { surface: 'dominion', trigger: gift('beat.spine.a_path_opens'), newLabel: 'Dominion', arrivesWith: 'reaches' },
  { surface: 'doom', trigger: gift('beat.spine.the_seat'), newLabel: 'Doom' },
  { surface: 'rivals', trigger: { kind: 'rival_acted' }, newLabel: 'Rivals' },
  { surface: 'mandate', trigger: gift('beat.spine.the_seat'), newLabel: 'Mandates' },
  { surface: 'investiture', trigger: gift('beat.spine.the_seat'), newLabel: 'Investiture' },
  { surface: 'lens_threads', trigger: gift('beat.spine.the_seat'), newLabel: 'the Threads lens' },
  { surface: 'world_soul', trigger: gift('beat.spine.a_path_opens'), newLabel: 'the World-Soul' },
  { surface: 'omen', trigger: gift('beat.spine.a_path_opens'), newLabel: 'Omens' },
  { surface: 'lens_trade', trigger: { kind: 'ceiling' }, newLabel: 'the Trade lens' },
];

/**
 * Ticks after the bond when every staged row is ready regardless (spine worst case ≈ 4 × 36).
 * THR-2060: ready, not shown — the rows still arrive one at a time.
 */
export const OPENING_REVEAL_CEILING_TICKS = 200;

/** Closed First chapters between two arrivals (THR-2060). */
export const OPENING_REVEAL_CHAPTERS_PER_ARRIVAL = 1;

/**
 * Running ticks after the last arrival when the next ready row arrives without a
 * chapter (THR-2060). Mirrors `SPINE_IDLE_FALLBACK_TICKS` (36), the spine's own idle pace.
 */
export const OPENING_REVEAL_ARRIVAL_IDLE_TICKS = SPINE_IDLE_FALLBACK_TICKS;

/** How long a newly revealed panel keeps its gold ring. 0 disables the ring. */
export const OPENING_REVEAL_HIGHLIGHT_MS = 6000;

/** localStorage key for the "Show every panel" setting. */
export const OPENING_REVEAL_SHOW_ALL_KEY = 'tb.openingReveal.showAll';

/** THR-2060 — which queued surfaces have arrived, and when the last one did. Held by the screen. */
export interface OpeningArrivalLedger {
  /** Surface → tick it arrived. */
  readonly arrived: Readonly<Partial<Record<OpeningRevealSurfaceId, number>>>;
  readonly lastArrivalTick: number | null;
}

// The screen's live arrival ledger, for readers outside its reveal hook (the
// inspector's Dominion row). A UI snapshot like the setting below, not an engine
// cache: the hook republishes it every render and clears it on unmount, so a new
// session never reads the last one's. Null → no screen → readers see readiness.
let publishedArrivalLedger: OpeningArrivalLedger | null = null;

/** THR-2060 — the screen publishes its ledger (null on unmount). */
export function publishOpeningArrivalLedger(ledger: OpeningArrivalLedger | null): void {
  publishedArrivalLedger = ledger;
}

/** THR-2060 — the screen's arrival ledger, or null when no screen holds one. */
export function readPublishedOpeningArrivalLedger(): OpeningArrivalLedger | null {
  return publishedArrivalLedger;
}

/**
 * The "Show every panel" setting, for readers outside the screen's reveal hook
 * (THR-1986: the inspector's Dominion row). Fail-soft: unreadable storage is off.
 */
export function readOpeningRevealShowAllSetting(): boolean {
  try {
    return globalThis.localStorage?.getItem(OPENING_REVEAL_SHOW_ALL_KEY) === '1';
  } catch {
    return false;
  }
}

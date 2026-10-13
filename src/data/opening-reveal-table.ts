/**
 * The opening reveal table (THR-1837, plan `2026-10-12-thr-1808-post-bond-reveal.md` C1).
 *
 * After the bond the god's screen shows The First, her chapter, the essence and
 * the hand; every other panel arrives with the gift whose words introduce it.
 * Each row keys one dashboard surface (by id, never by screen position) to the
 * thing that brings it: the bond, The First's first chapter, or one opening gift.
 *
 * Moving a row is a one-line change (NFP #1). Every gift `beatId` must be an
 * `ASCENDANT_SPINE` id — a test asserts it; at runtime an unknown id reveals at
 * the bond (`unknown_beat`).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | OPENING_REVEAL_TABLE         | 18 rows   | Which surface waits for which trigger |
 * | OPENING_REVEAL_CEILING_TICKS | 200       | Ticks after the bond when every row reveals |
 * | OPENING_REVEAL_HIGHLIGHT_MS  | 6000      | Gold ring on a newly revealed panel (0 = off) |
 * | OPENING_REVEAL_SHOW_ALL_KEY  | localStorage key for "Show every panel" |
 */

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
  | 'world_pulse'
  | 'world_soul'
  | 'omen';

export type OpeningRevealTrigger =
  | { readonly kind: 'bond' }
  | { readonly kind: 'first_chapter' }
  | { readonly kind: 'gift'; readonly beatId: string };

export interface OpeningRevealRow {
  readonly surface: OpeningRevealSurfaceId;
  readonly trigger: OpeningRevealTrigger;
  /** The noun the "New beside the map" line uses. Absent for rows shown at the bond. */
  readonly newLabel?: string;
}

const BOND = { kind: 'bond' } as const;
const gift = (beatId: string): OpeningRevealTrigger => ({ kind: 'gift', beatId });

/** Table order is the order labels are joined in the reveal toast. */
export const OPENING_REVEAL_TABLE: readonly OpeningRevealRow[] = [
  { surface: 'time_controls', trigger: BOND },
  { surface: 'identity', trigger: BOND },
  { surface: 'essence', trigger: BOND },
  { surface: 'attention', trigger: BOND },
  { surface: 'hand', trigger: BOND },
  { surface: 'threads', trigger: BOND },
  { surface: 'chapter_ledger', trigger: { kind: 'first_chapter' }, newLabel: 'the Chapter Ledger' },
  { surface: 'chronicle', trigger: BOND },
  { surface: 'settings', trigger: BOND },
  { surface: 'read_threads', trigger: BOND },
  { surface: 'doom', trigger: gift('beat.spine.the_seat'), newLabel: 'Doom' },
  { surface: 'mandate', trigger: gift('beat.spine.the_seat'), newLabel: 'Mandates' },
  { surface: 'investiture', trigger: gift('beat.spine.the_seat'), newLabel: 'Investiture' },
  { surface: 'notables', trigger: gift('beat.spine.the_first_word'), newLabel: 'Notables' },
  { surface: 'reaches', trigger: gift('beat.spine.a_path_opens'), newLabel: 'your Reaches' },
  { surface: 'world_pulse', trigger: gift('beat.spine.a_path_opens'), newLabel: 'World Pulse' },
  { surface: 'world_soul', trigger: gift('beat.spine.a_path_opens'), newLabel: 'the World-Soul' },
  { surface: 'omen', trigger: gift('beat.spine.a_path_opens'), newLabel: 'Omens' },
];

/** Ticks after the bond when every staged row reveals regardless (spine worst case ≈ 4 × 36). */
export const OPENING_REVEAL_CEILING_TICKS = 200;

/** How long a newly revealed panel keeps its gold ring. 0 disables the ring. */
export const OPENING_REVEAL_HIGHLIGHT_MS = 6000;

/** localStorage key for the "Show every panel" setting. */
export const OPENING_REVEAL_SHOW_ALL_KEY = 'tb.openingReveal.showAll';

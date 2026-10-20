/**
 * needsYou — the Needs-you queue as a view model (THR-1875, frame plan § F5; THR-1822 D13
 * amended: no count cap, `opens: 'place'`). The Chronicle promise holds since THR-1896: every
 * alert that reaches News also writes a Chronicle line (`alertChronicle.ts`).
 *
 * Needs you lists what waits on the god without stopping time: offers and receipts to
 * open, the named pause, moments held behind the one on screen, and the alert channel's
 * news. It **presents** those sources and produces nothing.
 *
 * **One list (Law 58).** `NEEDS_YOU_PRODUCERS` holds one producer per kind of ask. A new
 * ask is one entry here; `needsYou.test.ts` fails, naming the group, when a group has no
 * producer, an alert kind has no news icon, or an interrupt surface yields no held line.
 *
 * Pure: the sources are passed in (the interrupt registry's held list, the alert channel,
 * the named pause and the pending offer are React-held), so the build reads nothing else
 * and never throws past `readView`'s fallback.
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | NEEDS_YOU_NEWS_KEEP_DAYS (viewConstants) | 3 | News rows lapse after this many attention days |
 * | NEEDS_YOU_HELD_FALLBACK | 'Something waits' | A held surface with no line or holder words |
 */
import type { AlertIcon, AlertItem, NavigationTarget } from '../../types/notification';
import type { IconName } from '../../data/icons/iconRegistry';
import { ICON_FOR_ALERT } from '../../data/icons/conceptIcons';
import { heldLineFor } from '../../data/homed-surfaces';
import { TICKS_PER_DAY } from '../../data/attention-constants';
import { NEEDS_YOU_NEWS_KEEP_DAYS } from './viewConstants';
import { elapsedLabel } from '../aftermathWords';
import type { ViewSelector } from './readView';
import type { GameState } from '../../types/gameState';

export type NeedsYouGroup = 'waiting' | 'held' | 'news';
export type NeedsYouProducerId = 'beat_offer' | 'receipt_unacked' | 'named_pause' | 'held_moment' | 'alert';
/** What a row's press opens. `none` rows are not buttons. */
export type NeedsYouOpens = 'beatOffer' | 'receipt' | 'place' | 'subject' | 'none';

/** The three groups, in the order the list draws them. */
export const NEEDS_YOU_GROUP_ORDER: readonly NeedsYouGroup[] = ['waiting', 'held', 'news'];

/** A held surface with no line and no holder words (never expected; the holder-name test fails first). */
export const NEEDS_YOU_HELD_FALLBACK = 'Something waits';

/** Ticks a News row stays, the alert router's own window (`ALERT_KEEP_TICKS`). */
export const NEEDS_YOU_NEWS_KEEP_TICKS = NEEDS_YOU_NEWS_KEEP_DAYS * TICKS_PER_DAY;

/** The burst suffix: "· and {n} more like it". */
export function burstSuffix(more: number): string {
  return ` · and ${more} more like it`;
}

export interface NeedsYouRowVM {
  /** Stable per row: `${producer}:${source id}`. */
  id: string;
  producer: NeedsYouProducerId;
  group: NeedsYouGroup;
  icon: IconName;
  /** The one line the row shows. */
  line: string;
  /** The full line, for the row's tooltip when the line ellipsizes. */
  tooltip: string;
  opens: NeedsYouOpens;
  /** The right-aligned word: "Open", "Show", "after this", or an elapsed word for news. */
  action: string | null;
  /** A held row: it opens when the moment on screen closes. */
  after: boolean;
  /** The tick the row's source landed, for fold order. */
  tick: number;
  /** `opens: 'receipt'` — the receipt to open. */
  receiptId?: string;
  /** `opens: 'subject'` — where the alert routes. */
  navigationTarget?: NavigationTarget;
  /** `opens: 'place'` — the hex to centre on. */
  hex?: { col: number; row: number };
  /** The alert ids this row stands for (a burst carries several; the pill counts it once). */
  alertIds?: string[];
  /** A burst's members, one row each, newest first (opened in place). */
  burst?: NeedsYouRowVM[];
}

export interface NeedsYouVM {
  /** Rows in all three groups, folded rows included; a burst counts once. */
  count: number;
  groups: Record<NeedsYouGroup, NeedsYouRowVM[]>;
}

/** The pending ascendant beat, already resolved to its display words by the host. */
export interface NeedsYouBeatOffer {
  /** `gift`: a spine gift waits; `offering`: three powers stir; `beat`: a pool beat. */
  kind: 'gift' | 'offering' | 'beat';
  beatId: string;
  /** The beat's authored eyebrow ("The Seat", "A Path Opens"…). */
  eyebrow: string | null;
  /** A pool beat's run-specific title; null when none resolves. */
  title: string | null;
  tick: number;
}

export interface NeedsYouReceipt {
  id: string;
  /** The receipt's own toast sentence, unchanged. */
  headline: string;
  tick: number;
}

export interface NeedsYouHeld {
  /** A homed-surface kind (`HOMED_SURFACES`). */
  kind: string;
  surfaceId: string;
  subject?: string | null;
  title?: string | null;
}

export interface NeedsYouNamedPause {
  line: string;
  hex: { col: number; row: number } | null;
  tick: number;
}

export interface NeedsYouSources {
  currentTick: number;
  beatOffer: NeedsYouBeatOffer | null;
  receipts: readonly NeedsYouReceipt[];
  namedPause: NeedsYouNamedPause | null;
  /** Held surfaces, in the order they will open (the registry's `held`). */
  held: readonly NeedsYouHeld[];
  alerts: readonly AlertItem[];
}

export interface NeedsYouProducer {
  id: NeedsYouProducerId;
  group: NeedsYouGroup;
  /** Order inside its group. */
  order: number;
  rows(src: NeedsYouSources): NeedsYouRowVM[];
}

// ─── Words ────────────────────────────────────────────────────────

export const NEEDS_YOU_WORDS = {
  open: 'Open',
  show: 'Show',
  after: 'after this',
  giftWaits: 'A gift waits',
  offering: 'Three powers stir',
  beatFallback: 'A beat of your story',
  receiptLead: 'What your act bought',
} as const;

/** The pending beat's line — the beat's authored words, never its id (PC-3). */
export function beatOfferLine(offer: NeedsYouBeatOffer): string {
  if (offer.kind === 'offering') return NEEDS_YOU_WORDS.offering;
  if (offer.kind === 'gift') return offer.eyebrow ? `${NEEDS_YOU_WORDS.giftWaits}: ${offer.eyebrow}` : NEEDS_YOU_WORDS.giftWaits;
  if (offer.eyebrow && offer.title) return `${offer.eyebrow}: ${offer.title}`;
  return offer.title ?? offer.eyebrow ?? NEEDS_YOU_WORDS.beatFallback;
}

/** A held row's line: the home list's held line, its slots filled, never a raw id. */
export function heldRowLine(held: NeedsYouHeld): string {
  const line = heldLineFor(held.kind, { subject: held.subject ?? null, title: held.title ?? null });
  return line && line !== 'A moment' ? line : NEEDS_YOU_HELD_FALLBACK;
}

const warnedAlertIcons = new Set<string>();
/** The news icon for an alert kind; an unknown kind draws the fallback and warns once in dev. */
export function newsIconFor(icon: AlertIcon | string): IconName {
  const known = (ICON_FOR_ALERT as Record<string, IconName>)[icon];
  if (known) return known;
  if (!warnedAlertIcons.has(icon) && import.meta.env?.DEV) {
    warnedAlertIcons.add(icon);
    console.warn(`[needsYou] alert icon '${icon}' has no news icon — drawn with the fallback shape`);
  }
  return 'fallback';
}

// ─── Producers ────────────────────────────────────────────────────

function alertRow(a: AlertItem, currentTick: number): NeedsYouRowVM {
  return {
    id: `alert:${a.id}`,
    producer: 'alert',
    group: 'news',
    icon: newsIconFor(a.icon),
    line: a.message,
    tooltip: a.message,
    opens: a.navigationTarget ? 'subject' : 'none',
    action: `${elapsedLabel(currentTick - a.tick)} ago`,
    after: false,
    tick: a.tick,
    ...(a.navigationTarget ? { navigationTarget: a.navigationTarget } : {}),
    alertIds: [a.id],
  };
}

/**
 * News: the alert channel inside the keep window, newest first. Alerts of one kind in one
 * tick are one row — the newest's line, then "· and {n} more like it" — opening in place
 * to one row each (§ F5, Law 49: never ten rows, never one row hiding nine).
 */
function newsRows(src: NeedsYouSources): NeedsYouRowVM[] {
  const fresh = src.alerts.filter(a => src.currentTick - a.tick < NEEDS_YOU_NEWS_KEEP_TICKS);
  const bursts = new Map<string, AlertItem[]>();
  for (const a of fresh) {
    const key = `${a.icon}|${a.tick}`;
    const list = bursts.get(key);
    if (list) list.push(a);
    else bursts.set(key, [a]);
  }
  const rows: NeedsYouRowVM[] = [];
  for (const members of bursts.values()) {
    // Newest first inside the burst: the channel appends, so the last is the newest.
    const ordered = [...members].reverse();
    const head = alertRow(ordered[0], src.currentTick);
    if (ordered.length === 1) {
      rows.push(head);
      continue;
    }
    const line = `${head.line}${burstSuffix(ordered.length - 1)}`;
    rows.push({
      ...head,
      id: `alert-burst:${ordered[0].icon}:${ordered[0].tick}`,
      line,
      tooltip: line,
      alertIds: ordered.map(a => a.id),
      burst: ordered.map(a => alertRow(a, src.currentTick)),
    });
  }
  // Newest first; ties keep channel order (later appended = newer).
  return rows
    .map((r, i) => ({ r, i }))
    .sort((x, y) => y.r.tick - x.r.tick || y.i - x.i)
    .map(x => x.r);
}

export const NEEDS_YOU_PRODUCERS: readonly NeedsYouProducer[] = [
  {
    id: 'beat_offer',
    group: 'waiting',
    order: 1,
    rows: (src) => {
      const offer = src.beatOffer;
      if (!offer) return [];
      const line = beatOfferLine(offer);
      return [{
        id: `beat_offer:${offer.beatId}`, producer: 'beat_offer', group: 'waiting', icon: 'needs-you',
        line, tooltip: line, opens: 'beatOffer', action: NEEDS_YOU_WORDS.open, after: false, tick: offer.tick,
      }];
    },
  },
  {
    id: 'receipt_unacked',
    group: 'waiting',
    order: 2,
    rows: (src) =>
      [...src.receipts]
        .sort((a, b) => a.tick - b.tick)
        .map((r) => {
          const line = `${NEEDS_YOU_WORDS.receiptLead}: ${r.headline}`;
          return {
            id: `receipt_unacked:${r.id}`, producer: 'receipt_unacked' as const, group: 'waiting' as const, icon: 'essence' as IconName,
            line, tooltip: line, opens: 'receipt' as const, action: NEEDS_YOU_WORDS.open, after: false, tick: r.tick, receiptId: r.id,
          };
        }),
  },
  {
    id: 'named_pause',
    group: 'waiting',
    order: 3,
    rows: (src) => {
      const p = src.namedPause;
      if (!p) return [];
      return [{
        id: 'named_pause', producer: 'named_pause', group: 'waiting', icon: 'pause',
        line: p.line, tooltip: p.line,
        // No hex: the row still names the pause, but has nothing to show (Law 25).
        opens: p.hex ? 'place' : 'none', action: p.hex ? NEEDS_YOU_WORDS.show : null, after: false, tick: p.tick,
        ...(p.hex ? { hex: p.hex } : {}),
      }];
    },
  },
  {
    id: 'held_moment',
    group: 'held',
    order: 1,
    rows: (src) =>
      src.held.map((h, i) => {
        const line = heldRowLine(h);
        return {
          id: `held_moment:${h.kind}:${i}`, producer: 'held_moment' as const, group: 'held' as const, icon: 'held' as IconName,
          line, tooltip: line, opens: 'none' as const, action: NEEDS_YOU_WORDS.after, after: true, tick: src.currentTick,
        };
      }),
  },
  { id: 'alert', group: 'news', order: 1, rows: newsRows },
];

/** Build the queue. Pure; a producer that throws contributes nothing (fail-soft). */
export function buildNeedsYou(src: NeedsYouSources): NeedsYouVM {
  const groups: Record<NeedsYouGroup, NeedsYouRowVM[]> = { waiting: [], held: [], news: [] };
  const producers = [...NEEDS_YOU_PRODUCERS].sort((a, b) =>
    NEEDS_YOU_GROUP_ORDER.indexOf(a.group) - NEEDS_YOU_GROUP_ORDER.indexOf(b.group) || a.order - b.order);
  for (const p of producers) {
    try {
      groups[p.group].push(...p.rows(src));
    } catch {
      // fail-soft: one producer's fault never empties the list
    }
  }
  return { count: groups.waiting.length + groups.held.length + groups.news.length, groups };
}

export function emptyNeedsYou(): NeedsYouVM {
  return { count: 0, groups: { waiting: [], held: [], news: [] } };
}

// ─── Grow, then fold (Law 57; § F4) ───────────────────────────────

/** The list's geometry in rem and vh (plan § Constants table). */
export const NEEDS_YOU_LIST_W_REM = 30;
export const NEEDS_YOU_LIST_MAX_VH = 60;
export const NEEDS_YOU_ROW_H_REM = 2.5;
export const NEEDS_YOU_GROUP_HEAD_H_REM = 2;
export const NEEDS_YOU_LIST_PAD_REM = 0.75;

/**
 * Rows the list fits under its limit at this viewport (§ F4): 13 at 1920×1080 (16 px root)
 * and 16 at 2560×1440 (18 px root) with three groups. Fold rows count as rows.
 */
export function needsYouCapacityRows(innerHeight: number, rootPx: number, groupsShown: number): number {
  const avail = (NEEDS_YOU_LIST_MAX_VH / 100) * innerHeight
    - 2 * NEEDS_YOU_LIST_PAD_REM * rootPx
    - groupsShown * NEEDS_YOU_GROUP_HEAD_H_REM * rootPx;
  return Math.max(1, Math.floor(avail / (NEEDS_YOU_ROW_H_REM * rootPx)));
}

export interface NeedsYouFolded {
  /** Per group: the rows shown and how many folded into its "and {n} more" row. */
  groups: Record<NeedsYouGroup, { rows: NeedsYouRowVM[]; folded: number }>;
  /** Row lines drawn, fold rows included. */
  linesShown: number;
  foldedRows: number;
}

/**
 * Fold the queue to `capacity` row lines. What folds first: News (oldest first), then
 * Held (from the back of the queue), then Waiting (oldest first) — the god acts on
 * Waiting, so it folds last. Each folded group keeps one fold row.
 */
export function foldNeedsYou(vm: NeedsYouVM, capacity: number, expanded: ReadonlySet<NeedsYouGroup> = new Set()): NeedsYouFolded {
  const keep: Record<NeedsYouGroup, number> = {
    waiting: vm.groups.waiting.length,
    held: vm.groups.held.length,
    news: vm.groups.news.length,
  };
  const lines = () => NEEDS_YOU_GROUP_ORDER.reduce(
    (n, g) => n + keep[g] + (keep[g] < vm.groups[g].length ? 1 : 0), 0);
  for (const g of ['news', 'held', 'waiting'] as const) {
    if (expanded.has(g)) continue;
    while (lines() > capacity && keep[g] > 0) keep[g]--;
  }
  const out = {} as NeedsYouFolded['groups'];
  let foldedRows = 0;
  for (const g of NEEDS_YOU_GROUP_ORDER) {
    const all = vm.groups[g];
    // News and Waiting drop their oldest; Held drops from the back of its queue.
    const rows = g === 'waiting'
      ? all.slice(all.length - keep[g])
      : all.slice(0, keep[g]);
    const folded = all.length - rows.length;
    foldedRows += folded;
    out[g] = { rows, folded };
  }
  return { groups: out, linesShown: lines(), foldedRows };
}

// ─── The seam (THR-1822) ──────────────────────────────────────────

export interface NeedsYouArgs {
  sources?: NeedsYouSources;
  /** A primitive stamp of the sources (the host computes it), so the cache keys on them. */
  stamp?: string;
  /** The screen's superset args name them apart from other selectors' `stamp` (debug bridge). */
  needsYouSources?: NeedsYouSources;
  needsYouStamp?: string;
}

/** A primitive key for a set of sources: changes whenever a row would. */
export function needsYouStamp(src: NeedsYouSources): string {
  return [
    src.currentTick,
    src.beatOffer ? `${src.beatOffer.kind}:${src.beatOffer.beatId}:${src.beatOffer.title ?? ''}` : '',
    src.receipts.map(r => r.id).join(','),
    src.namedPause ? `${src.namedPause.tick}:${src.namedPause.line}` : '',
    src.held.map(h => `${h.kind}:${h.subject ?? ''}:${h.title ?? ''}`).join(','),
    src.alerts.map(a => a.id).join(','),
  ].join('|');
}

/** `__DEBUG.getView('needsYou')` and `useView`: sources are passed in (D13). */
export const needsYouSelector: ViewSelector<NeedsYouArgs, NeedsYouVM> = {
  id: 'needsYou',
  invalidation: 'world',
  key: (a) => {
    const src = a?.sources ?? a?.needsYouSources;
    return a?.stamp ?? a?.needsYouStamp ?? (src ? needsYouStamp(src) : '');
  },
  build: (_ctx, a) => {
    const src = a?.sources ?? a?.needsYouSources;
    return src ? buildNeedsYou(src) : emptyNeedsYou();
  },
  fallback: () => emptyNeedsYou(),
};

/**
 * `__DEBUG.pushNeedsYouFixture` names a real mortal: the first actor the god threads (The
 * First at the start of a run). Read here so the UI never queries the graph (NFP #2).
 */
export function needsYouFixtureSubject(state: GameState): { id: string; name: string } | null {
  try {
    if (!state.ascendantId) return null;
    for (const e of state.graph.getOutgoingEdges(state.ascendantId, 'thread')) {
      const node = state.graph.getNode(e.target);
      if (node?.type === 'actor') return { id: node.id, name: node.name };
    }
  } catch {
    // fail-soft: a fixture without a subject still renders
  }
  return null;
}

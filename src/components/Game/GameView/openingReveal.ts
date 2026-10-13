/**
 * The god's screen fills one gift at a time — the UI half (THR-1837, plan
 * `2026-10-12-thr-1808-post-bond-reveal.md` U1, U4, U5, U6).
 *
 * `useOpeningReveal` wraps the pure engine selector `selectOpeningReveal`:
 * - **Latch.** A surface that has shown never hides again this session (a First
 *   who dies does not re-quiet the screen), like `useFirstScreenReveal`.
 * - **Highlight.** A surface whose row flips to revealed is listed in `newly`
 *   for `OPENING_REVEAL_HIGHLIGHT_MS`; mount sites draw the gold ring from it.
 * - **Toast.** Every row that flips on one render shares one "New beside the
 *   map" line, keyed by its trigger set so a re-render cannot repeat it.
 * - **Setting.** "Show every panel" lives in localStorage (try/catch; a throw
 *   reads as off and the toggle still works for the session). Turning it on
 *   reveals every row with no toast and no ring.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../../../types/gameState';
import { selectOpeningReveal, type OpeningReveal } from '../../../engine/openingReveal';
import {
  OPENING_REVEAL_TABLE,
  OPENING_REVEAL_HIGHLIGHT_MS,
  OPENING_REVEAL_SHOW_ALL_KEY,
  type OpeningRevealSurfaceId,
} from '../../../data/opening-reveal-table';
import { formatOpeningRevealToast } from '../../../data/ui-content';

export type OpeningRevealShow = Readonly<Record<OpeningRevealSurfaceId, boolean>>;

export interface OpeningRevealView {
  /** Live selector output (reasons, direction line). */
  readonly reveal: OpeningReveal;
  /** Latched: true once the surface has shown this session. */
  readonly show: OpeningRevealShow;
  /** Surfaces inside their highlight window. */
  readonly newly: ReadonlySet<OpeningRevealSurfaceId>;
  readonly showAll: boolean;
  readonly setShowAll: (on: boolean) => void;
}

export function readOpeningRevealShowAll(): boolean {
  try {
    return globalThis.localStorage?.getItem(OPENING_REVEAL_SHOW_ALL_KEY) === '1';
  } catch {
    return false;
  }
}

function writeOpeningRevealShowAll(on: boolean): void {
  try {
    globalThis.localStorage?.setItem(OPENING_REVEAL_SHOW_ALL_KEY, on ? '1' : '0');
  } catch {
    // Fail-soft: the setting still holds for this session.
  }
}

/** The labels and ceiling flag of the rows that flipped, in table order. */
export function revealToastFor(
  flipped: ReadonlySet<OpeningRevealSurfaceId>,
  reveal: OpeningReveal,
): string | null {
  const labels: string[] = [];
  let byCeiling = false;
  for (const row of OPENING_REVEAL_TABLE) {
    if (!flipped.has(row.surface) || !row.newLabel) continue;
    labels.push(row.newLabel);
    if (reveal.rows[row.surface].reason === 'ceiling') byCeiling = true;
  }
  return formatOpeningRevealToast(labels, byCeiling);
}

export function useOpeningReveal(
  gameState: GameState,
  worldVersion: number,
  onRevealToast?: (message: string, key: string) => void,
): OpeningRevealView {
  const [showAll, setShowAllState] = useState<boolean>(readOpeningRevealShowAll);
  const setShowAll = useCallback((on: boolean) => {
    writeOpeningRevealShowAll(on);
    setShowAllState(on);
  }, []);

  const reveal = useMemo(
    () => selectOpeningReveal(gameState, { showAll }),
    // The graph mutates in place; worldVersion covers the bond edge. The rest are
    // the arrays the selector reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState.openingRevealStaged, gameState.tick, gameState.ascendantBeats, gameState.chapterArchive,
      gameState.unifiedActions, gameState.doomClock, worldVersion, showAll],
  );

  // Latch, and note what flipped on this render.
  const latch = useRef<Partial<Record<OpeningRevealSurfaceId, boolean>> | null>(null);
  const flippedRef = useRef<Set<OpeningRevealSurfaceId>>(new Set());
  const first = latch.current === null;
  if (first) latch.current = {};
  const l = latch.current!;
  for (const row of OPENING_REVEAL_TABLE) {
    const state = reveal.rows[row.surface];
    if (state.revealed && !l[row.surface]) {
      l[row.surface] = true;
      // The first render records the starting screen, and "Show every panel" is
      // the player's own ask: neither announces itself.
      if (!first && state.reason !== 'not_staged') flippedRef.current.add(row.surface);
    }
  }
  const show = { ...l } as Record<OpeningRevealSurfaceId, boolean>;
  for (const row of OPENING_REVEAL_TABLE) show[row.surface] = l[row.surface] === true;

  const [newly, setNewly] = useState<ReadonlySet<OpeningRevealSurfaceId>>(() => new Set());
  const toastedKeys = useRef<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const flipCount = flippedRef.current.size;

  useEffect(() => {
    const flipped = flippedRef.current;
    if (flipped.size === 0) return;
    flippedRef.current = new Set();
    const key = [...flipped].sort().join('|');
    if (!toastedKeys.current.has(key)) {
      toastedKeys.current.add(key);
      const message = revealToastFor(flipped, reveal);
      if (message) onRevealToast?.(message, key);
    }
    if (OPENING_REVEAL_HIGHLIGHT_MS <= 0) return;
    setNewly(prev => new Set([...prev, ...flipped]));
    // Not tied to this effect's cleanup: the effect re-runs every tick, and the
    // ring must still drop on time. Timers are cleared on unmount only.
    timers.current.push(setTimeout(() => {
      setNewly(prev => {
        const next = new Set(prev);
        for (const s of flipped) next.delete(s);
        return next;
      });
    }, OPENING_REVEAL_HIGHLIGHT_MS));
    // Runs when a render recorded flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipCount, reveal]);

  useEffect(() => () => { for (const t of timers.current) clearTimeout(t); }, []);

  return { reveal, show, newly, showAll, setShowAll };
}

/** Inline style for a newly revealed panel: a 1px gold ring, the one gold emphasis it carries. */
export const NEWLY_REVEALED_STYLE = {
  boxShadow: '0 0 0 1px var(--accent-gold)',
  borderRadius: '6px',
  transition: 'box-shadow 0.6s ease',
} as const;

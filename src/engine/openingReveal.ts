/**
 * The god's screen fills one gift at a time (THR-1837, plan
 * `Docs/plans/2026-10-12-thr-1808-post-bond-reveal.md` E1).
 *
 * A pure selector over state that already exists: the `the_first` thread edge
 * (the bond), the doom wake tick (the anchor), `ascendantBeats.history` (which
 * opening gifts resolved) and `chapterArchive` / live encounters (The First's
 * first chapter). It returns, for every row of `OPENING_REVEAL_TABLE`, whether
 * the surface shows and why, plus the one standing direction line.
 *
 * Only a session whose UI arrival staged it (`GameState.openingRevealStaged`)
 * is staged; every other state — the CLI, fixtures, pre-bonded dev routes —
 * reads `not_staged` and shows the full screen.
 *
 * Executor decision (THR-1837): before the bond, rows triggered `bond` stay on
 * screen (reason `pre_bond`, revealed). The hand carries the card that makes the
 * bond and the clock moves the meeting forward, so hiding them would stall the
 * opening; the pre-bond screen is exactly THR-1648's. Every later row is hidden
 * with reason `pre_bond`.
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None. No graph writes. Derived on read; nothing runs per tick.
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * Any throw yields every row revealed (`not_staged`) and the direction line
 * hidden — today's full screen.
 */

import type { GameState } from '../types/gameState';
import {
  OPENING_REVEAL_TABLE,
  OPENING_REVEAL_CEILING_TICKS,
  type OpeningRevealRow,
  type OpeningRevealSurfaceId,
} from '../data/opening-reveal-table';
import { ASCENDANT_SPINE } from '../data/ascendant-beat-content';
import { getFirstId } from './meetingEncounter';
import { resolveDoomWokeAtTick } from './doomClock';
import { isEncounterAction, isRoutineChapter } from './chapterArchive';
import { isRoutineTemplate } from './attentionCadence';

export type OpeningRevealReason =
  | 'not_staged'
  | 'pre_bond'
  | 'at_bond'
  | 'ceiling'
  | 'spine_done'
  | 'first_chapter'
  | 'no_beat_state'
  | 'unknown_beat'
  | `gift:${string}`
  | `waiting:${string}`;

export interface OpeningRevealRowState {
  readonly revealed: boolean;
  readonly reason: OpeningRevealReason;
}

export type OpeningDirectionMode = 'chapter_waiting' | 'let_time_run';

export interface OpeningDirection {
  readonly show: boolean;
  readonly mode: OpeningDirectionMode;
  readonly firstId: string | null;
  /** The First's open, non-routine chapter (the arrow's target) when `mode` is `chapter_waiting`. */
  readonly chapterActionId: string | null;
}

export interface OpeningReveal {
  readonly staged: boolean;
  readonly showAll: boolean;
  readonly rows: Readonly<Record<OpeningRevealSurfaceId, OpeningRevealRowState>>;
  readonly direction: OpeningDirection;
}

export interface SelectOpeningRevealOptions {
  /** The player's "Show every panel" setting. */
  readonly showAll?: boolean;
}

const SPINE_IDS: ReadonlySet<string> = new Set(ASCENDANT_SPINE.map(b => b.beatId));

const HIDDEN_DIRECTION: OpeningDirection = { show: false, mode: 'let_time_run', firstId: null, chapterActionId: null };

function allRows(state: OpeningRevealRowState): Record<OpeningRevealSurfaceId, OpeningRevealRowState> {
  const rows = {} as Record<OpeningRevealSurfaceId, OpeningRevealRowState>;
  for (const row of OPENING_REVEAL_TABLE) rows[row.surface] = state;
  return rows;
}

function fullScreen(staged: boolean, showAll: boolean): OpeningReveal {
  return {
    staged,
    showAll,
    rows: allRows({ revealed: true, reason: 'not_staged' }),
    direction: HIDDEN_DIRECTION,
  };
}

/** The First's live, non-routine chapter (an unresolved encounter she acts in), if any. */
function findOpenFirstChapter(state: GameState, firstId: string): string | null {
  for (const a of state.unifiedActions ?? []) {
    if (a.resolved || a.actorId !== firstId) continue;
    if (!isEncounterAction(a.templateId) || isRoutineTemplate(a.templateId)) continue;
    return a.actionId;
  }
  return null;
}

/** True once The First has a non-routine chapter resolved at or after the bond. */
function hasResolvedFirstChapter(state: GameState, firstId: string, bondTick: number): boolean {
  return (state.chapterArchive ?? []).some(rec =>
    rec.resolved && rec.actorId === firstId && !isRoutineChapter(rec) && rec.resolvedTick >= bondTick,
  );
}

function rowState(
  row: OpeningRevealRow,
  state: GameState,
  ctx: { ceilingPassed: boolean; firstChapter: boolean; resolvedBeats: ReadonlySet<string> | null; spineDone: boolean },
): OpeningRevealRowState {
  const t = row.trigger;
  if (t.kind === 'bond') return { revealed: true, reason: 'at_bond' };
  if (ctx.ceilingPassed) return { revealed: true, reason: 'ceiling' };
  if (t.kind === 'first_chapter') {
    return ctx.firstChapter
      ? { revealed: true, reason: 'first_chapter' }
      : { revealed: false, reason: 'waiting:first_chapter' };
  }
  if (!SPINE_IDS.has(t.beatId)) return { revealed: true, reason: 'unknown_beat' };
  if (!state.ascendantBeats || ctx.resolvedBeats === null) return { revealed: true, reason: 'no_beat_state' };
  if (ctx.resolvedBeats.has(t.beatId)) return { revealed: true, reason: `gift:${t.beatId}` };
  if (ctx.spineDone) return { revealed: true, reason: 'spine_done' };
  return { revealed: false, reason: `waiting:${t.beatId}` };
}

export function selectOpeningReveal(state: GameState, opts: SelectOpeningRevealOptions = {}): OpeningReveal {
  const showAll = opts.showAll === true;
  const staged = state.openingRevealStaged === true;
  try {
    if (!staged) return fullScreen(false, showAll);

    const firstId = state.ascendantId ? getFirstId(state.graph, state.ascendantId) : null;

    if (firstId === null) {
      // Pre-bond: THR-1648's quiet screen. Bond rows stay; everything later waits.
      const rows = {} as Record<OpeningRevealSurfaceId, OpeningRevealRowState>;
      for (const row of OPENING_REVEAL_TABLE) {
        rows[row.surface] = { revealed: showAll || row.trigger.kind === 'bond', reason: showAll ? 'not_staged' : 'pre_bond' };
      }
      return { staged, showAll, rows, direction: HIDDEN_DIRECTION };
    }

    // The bond is read from the edge; the doom wake only anchors the tick. For the
    // one render between the bond and the wake, count from now.
    const woke = resolveDoomWokeAtTick(state.doomClock);
    const bondTick = woke ?? state.tick;
    const ceilingPassed = state.tick - bondTick >= OPENING_REVEAL_CEILING_TICKS;

    const openChapterId = findOpenFirstChapter(state, firstId);
    const chapterResolved = hasResolvedFirstChapter(state, firstId, bondTick);
    const firstChapter = openChapterId !== null || chapterResolved;

    const beats = state.ascendantBeats;
    const resolvedBeats = beats ? new Set(beats.history.map(h => h.beatId)) : null;
    const spineDone = beats?.spineCursor === -1;

    const rows = {} as Record<OpeningRevealSurfaceId, OpeningRevealRowState>;
    for (const row of OPENING_REVEAL_TABLE) {
      rows[row.surface] = showAll
        ? { revealed: true, reason: 'not_staged' }
        : rowState(row, state, { ceilingPassed, firstChapter, resolvedBeats, spineDone });
    }

    const direction: OpeningDirection = {
      show: !chapterResolved && !ceilingPassed,
      mode: openChapterId ? 'chapter_waiting' : 'let_time_run',
      firstId,
      chapterActionId: openChapterId,
    };
    return { staged, showAll, rows, direction };
  } catch {
    // Fail-soft (NFP #4): an unreadable state shows today's full screen.
    return fullScreen(staged, showAll);
  }
}

/**
 * The toast key of a row that revealed: which trigger brought it. Rows that flip
 * on one render share one "New beside the map" line whatever their keys.
 */
export function revealTriggerKey(reason: OpeningRevealReason): string {
  if (reason.startsWith('gift:')) return reason.slice('gift:'.length);
  return reason;
}

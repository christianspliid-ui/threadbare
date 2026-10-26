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
 * THR-2060 (plan `2026-10-26-thr-2058-one-thing-at-a-time.md` E1–E2): a fired
 * trigger makes a labelled row *ready*, not shown. With an arrival ledger
 * (`opts.ledger`, held by the screen), a ready row shows once it has *arrived*:
 * {@link releaseOpeningArrivals} lets one through per closed First chapter (or
 * per `OPENING_REVEAL_ARRIVAL_IDLE_TICKS` running ticks), in table order. Without
 * a ledger (CLI, fixtures) every ready row shows, as before.
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
  OPENING_REVEAL_CHAPTERS_PER_ARRIVAL,
  OPENING_REVEAL_ARRIVAL_IDLE_TICKS,
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
  | 'rival_acted'
  /** THR-2060: ready and released by the arrival ledger. */
  | 'queued'
  | 'no_beat_state'
  | 'unknown_beat'
  | `gift:${string}`
  | `waiting:${string}`;

export interface OpeningRevealRowState {
  readonly revealed: boolean;
  readonly reason: OpeningRevealReason;
  /** THR-2060: for a row the ledger holds or released, why it became ready. */
  readonly readyReason?: OpeningRevealReason;
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
  /** THR-2060: ready rows still waiting for their arrival, in table order (empty without a ledger). */
  readonly queued: readonly OpeningRevealSurfaceId[];
  /** THR-2060: the arrival ledger the rows were read against, when one was given. */
  readonly ledger?: OpeningArrivalLedger;
}

/** THR-2060 — which queued surfaces have arrived, and when the last one did. Held by the screen. */
export interface OpeningArrivalLedger {
  /** Surface → tick it arrived. */
  readonly arrived: Readonly<Partial<Record<OpeningRevealSurfaceId, number>>>;
  readonly lastArrivalTick: number | null;
}

export const EMPTY_ARRIVAL_LEDGER: OpeningArrivalLedger = { arrived: {}, lastArrivalTick: null };

export interface SelectOpeningRevealOptions {
  /** The player's "Show every panel" setting. */
  readonly showAll?: boolean;
  /** THR-2060: the screen's arrival ledger. Absent → every ready row shows (today's rule). */
  readonly ledger?: OpeningArrivalLedger;
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
    queued: [],
  };
}

/** True once any rival has acted — an intervention landed or a scheme launched (moved from `firstScreenReveal.ts`, THR-2060). */
export function hasRivalActed(state: GameState): boolean {
  const states = state.rivalStates ?? [];
  return states.some(
    s => (s.interventionCount ?? 0) > 0 || (s.schemes?.length ?? 0) > 0 || s.lastSchemeLaunchTick != null,
  );
}

/** A row that waits in the arrival queue: it has a label to announce and a trigger past the bond. */
export function isQueuedRow(row: OpeningRevealRow): boolean {
  return row.trigger.kind !== 'bond' && !!row.newLabel;
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
  return firstChaptersClosedSince(state, firstId, bondTick - 1) > 0;
}

/**
 * THR-2060 — The First's non-routine chapters resolved after `sinceTick` (the
 * `hasResolvedFirstChapter` read, generalised). Fail-soft: no archive reads 0.
 */
export function firstChaptersClosedSince(state: GameState, firstId: string | null, sinceTick: number): number {
  if (!firstId) return 0;
  let n = 0;
  for (const rec of state.chapterArchive ?? []) {
    if (rec.resolved && rec.actorId === firstId && !isRoutineChapter(rec) && rec.resolvedTick > sinceTick) n++;
  }
  return n;
}

function rowState(
  row: OpeningRevealRow,
  state: GameState,
  ctx: { ceilingPassed: boolean; firstChapter: boolean; resolvedBeats: ReadonlySet<string> | null; spineDone: boolean },
): OpeningRevealRowState {
  const t = row.trigger;
  if (t.kind === 'bond') return { revealed: true, reason: 'at_bond' };
  // Rivals wait for a real act even past the ceiling: the top bar's Rivals item is
  // gated on the same act (`useFirstScreenReveal`), so an earlier arrival would
  // announce a panel that cannot show.
  if (t.kind === 'rival_acted') {
    return hasRivalActed(state)
      ? { revealed: true, reason: 'rival_acted' }
      : { revealed: false, reason: 'waiting:rival_acted' };
  }
  if (ctx.ceilingPassed) return { revealed: true, reason: 'ceiling' };
  if (t.kind === 'ceiling') return { revealed: false, reason: 'waiting:ceiling' };
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
    // The doom wakes on the first tick after the bond and never sleeps again, so a
    // First who dies (her thread edge removed) does not send the screen back to
    // pre-bond: the waiting rows keep their gifts and the ceiling still runs.
    const rawWoke = state.doomClock?.wokeAtTick;
    const everBonded = firstId !== null || typeof rawWoke === 'number';

    if (!everBonded) {
      // Pre-bond: THR-1648's quiet screen. Bond rows stay; everything later waits.
      const rows = {} as Record<OpeningRevealSurfaceId, OpeningRevealRowState>;
      for (const row of OPENING_REVEAL_TABLE) {
        rows[row.surface] = { revealed: showAll || row.trigger.kind === 'bond', reason: showAll ? 'not_staged' : 'pre_bond' };
      }
      return { staged, showAll, rows, direction: HIDDEN_DIRECTION, queued: [] };
    }

    // The bond is read from the edge; the doom wake only anchors the tick. For the
    // one render between the bond and the wake, count from now.
    const woke = resolveDoomWokeAtTick(state.doomClock);
    const bondTick = woke ?? state.tick;
    const ceilingPassed = state.tick - bondTick >= OPENING_REVEAL_CEILING_TICKS;

    const openChapterId = firstId ? findOpenFirstChapter(state, firstId) : null;
    const chapterResolved = firstId ? hasResolvedFirstChapter(state, firstId, bondTick) : false;
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
      // No First, no one to watch over: the line hides (fail-soft table).
      show: firstId !== null && !chapterResolved && !ceilingPassed,
      mode: openChapterId ? 'chapter_waiting' : 'let_time_run',
      firstId,
      chapterActionId: openChapterId,
    };
    const ready: OpeningReveal = { staged, showAll, rows, direction, queued: [] };
    return opts.ledger && !showAll ? applyArrivalLedger(ready, opts.ledger) : ready;
  } catch {
    // Fail-soft (NFP #4): an unreadable state shows today's full screen.
    return fullScreen(staged, showAll);
  }
}

/**
 * The toast key of a row that revealed: which trigger brought it. Rows that flip
 * on one render share one "New beside the map" line whatever their keys.
 * THR-2060: a queued row's key is its own surface, so each arrival is its own toast.
 */
export function revealTriggerKey(reason: OpeningRevealReason, surface?: OpeningRevealSurfaceId): string {
  if (reason === 'queued' && surface) return `queued:${surface}`;
  if (reason.startsWith('gift:')) return reason.slice('gift:'.length);
  return reason;
}

// ─── THR-2060: the arrival queue ────────────────────────────────────

/** The queued rows that are ready on this reveal (read without a ledger), in table order. */
export function readyQueuedSurfaces(reveal: OpeningReveal): OpeningRevealSurfaceId[] {
  if (!reveal.staged || reveal.showAll) return [];
  const out: OpeningRevealSurfaceId[] = [];
  for (const row of OPENING_REVEAL_TABLE) {
    if (!isQueuedRow(row)) continue;
    const r = reveal.rows[row.surface];
    if (r.revealed && r.reason !== 'not_staged' && r.reason !== 'pre_bond') out.push(row.surface);
  }
  return out;
}

/**
 * A ready reveal read against the ledger: a queued row shows only once it has
 * arrived (reason `queued`); a ready row still waiting reads `waiting:queue`.
 * Rows that do not queue are untouched. Pure.
 */
export function applyArrivalLedger(reveal: OpeningReveal, ledger: OpeningArrivalLedger): OpeningReveal {
  if (!reveal.staged || reveal.showAll) return { ...reveal, ledger };
  const ready = new Set(readyQueuedSurfaces(reveal));
  const rows = { ...reveal.rows } as Record<OpeningRevealSurfaceId, OpeningRevealRowState>;
  const queued: OpeningRevealSurfaceId[] = [];
  for (const row of OPENING_REVEAL_TABLE) {
    if (!ready.has(row.surface)) continue;
    const readyReason = rows[row.surface].reason;
    if (ledger.arrived[row.surface] !== undefined) {
      rows[row.surface] = { revealed: true, reason: 'queued', readyReason };
    } else {
      rows[row.surface] = { revealed: false, reason: 'waiting:queue', readyReason };
      queued.push(row.surface);
    }
  }
  return { ...reveal, rows, queued, ledger };
}

/**
 * Release at most one waiting row (plus any ready row that `arrivesWith` it). Pure;
 * same inputs, same ledger. A row arrives when nothing has arrived yet, when
 * `OPENING_REVEAL_CHAPTERS_PER_ARRIVAL` First chapters have closed since the last
 * arrival, or when `OPENING_REVEAL_ARRIVAL_IDLE_TICKS` ticks have run since it.
 */
export function releaseOpeningArrivals(
  ledger: OpeningArrivalLedger,
  ready: readonly OpeningRevealSurfaceId[],
  ctx: { tick: number; chaptersClosedSince: (tick: number) => number },
): OpeningArrivalLedger {
  const waiting = ready.filter(s => ledger.arrived[s] === undefined);
  if (waiting.length === 0) return ledger;
  const last = ledger.lastArrivalTick;
  const due = last === null
    || ctx.chaptersClosedSince(last) >= OPENING_REVEAL_CHAPTERS_PER_ARRIVAL
    || ctx.tick - last >= OPENING_REVEAL_ARRIVAL_IDLE_TICKS;
  if (!due) return ledger;

  const partnerOf = new Map<OpeningRevealSurfaceId, OpeningRevealSurfaceId>();
  for (const row of OPENING_REVEAL_TABLE) if (row.arrivesWith) partnerOf.set(row.surface, row.arrivesWith);
  const waitingSet = new Set(waiting);
  // A row whose partner is also waiting never leads: the partner brings it.
  const head = waiting.find(s => {
    const partner = partnerOf.get(s);
    return !(partner && waitingSet.has(partner));
  }) ?? waiting[0];
  const arriving = [head, ...waiting.filter(s => s !== head && partnerOf.get(s) === head)];

  const arrived = { ...ledger.arrived };
  for (const s of arriving) arrived[s] = ctx.tick;
  return { arrived, lastArrivalTick: ctx.tick };
}

/**
 * The ledger the screen starts from: every row ready at its first render has
 * already arrived (a reload is not an arrival — no toast, no ring).
 */
export function seedArrivalLedger(ready: readonly OpeningRevealSurfaceId[], tick: number): OpeningArrivalLedger {
  if (ready.length === 0) return EMPTY_ARRIVAL_LEDGER;
  const arrived: Partial<Record<OpeningRevealSurfaceId, number>> = {};
  for (const s of ready) arrived[s] = tick;
  return { arrived, lastArrivalTick: tick };
}

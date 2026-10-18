/**
 * The Chapter Ledger's rows, built in one place (THR-603, THR-1604, THR-1715; THR-1893).
 *
 * The ledger reader (`components/Game/ChapterLedger.tsx`), the Ledger tab of the
 * Chronicle and the strip's unread count all read the same rows. Before THR-1893 the
 * reader built its rows inline and the launcher counted with a separate predicate;
 * the tab would have been a third copy. Now `buildLedgerRows` builds every row once
 * and `selectThreadedChapters` is the default view's filter (threaded, not routine,
 * newest first), so the tab, the reader's default view and the count never disagree.
 *
 * Pure: reads the world, never writes it. Fail-soft: a row whose name or stakes line
 * cannot be read keeps its fallback words.
 */
import type { GameState } from '../types/gameState';
import type { UnifiedAction } from '../types/unifiedAction';
import { isEncounterAction, isRoutineChapter, getChapterTemplateName } from './chapterArchive';
import { outcomePhrase } from './aftermathWords';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { stakesLineForAction } from './encounters/stakesLine';
import { isRoutineTemplate } from './attentionCadence';

export interface LedgerRow {
  key: string;
  source: 'archived' | 'active';
  actorId: string;
  actorName: string;
  templateName: string;
  /** THR-1727 — the chapter's stakes line (opening while live, result once resolved). */
  stakesLine?: string;
  statusLabel: string;
  sortTick: number;
  threaded: boolean;
  /** THR-1715 — daily life: shown only under the Daily-life filter. */
  routine: boolean;
  /** The actor and every bound participant, for the per-agent filter. */
  participantIds: readonly string[];
}

/**
 * THR-1035 — the status label for a resolved chapter.
 *
 * The band is routed through the shared aftermath vocabulary rather than
 * interpolated, which is what put `success_at_cost` on a player surface (Law
 * 14). A chapter archived without an outcome says only "resolved": the absence
 * is a real state, and the old `?? 'unknown'` answered a question nobody asked.
 */
export function resolvedStatusLabel(outcome?: string | null): string {
  const phrase = outcomePhrase(outcome);
  return phrase ? `resolved · ${phrase}` : 'resolved';
}

/** THR-1727 — a live encounter's opening stakes line, or undefined when it has none. */
function liveStakesLine(gameState: GameState, action: UnifiedAction): string | undefined {
  try {
    const template = getUnifiedTemplateById(action.templateId);
    if (!template) return undefined;
    return stakesLineForAction(action, template, gameState.graph)?.text;
  } catch {
    return undefined;
  }
}

function isThreaded(gameState: GameState, actorId: string): boolean {
  const asc = gameState.ascendantId;
  if (!asc) return false;
  try {
    return gameState.graph.getIncomingEdges(actorId, 'thread').some(e => e.source === asc);
  } catch {
    return false;
  }
}

/** Live (unresolved) encounters, the ledger's second source. */
export function activeLedgerEncounters(gameState: GameState): UnifiedAction[] {
  return (gameState.unifiedActions as UnifiedAction[]).filter(a => !a.resolved && isEncounterAction(a.templateId));
}

/**
 * Every row the ledger can list, live first then archived, unsorted and unfiltered.
 * The reader filters by view (story or daily life, threaded or all, one agent).
 */
export function buildLedgerRows(gameState: GameState, opts: { withStakes?: boolean } = {}): LedgerRow[] {
  const withStakes = opts.withStakes ?? true;
  const archivedRows: LedgerRow[] = (gameState.chapterArchive ?? []).map(r => ({
    key: r.actionId,
    source: 'archived' as const,
    actorId: r.actorId,
    actorName: r.actorName,
    templateName: r.templateName,
    stakesLine: r.stakesLine,
    statusLabel: resolvedStatusLabel(r.outcome),
    sortTick: r.resolvedTick,
    threaded: r.threaded,
    routine: isRoutineChapter(r),
    participantIds: [r.actorId, ...r.participants.map(p => p.id)],
  }));

  const activeRows: LedgerRow[] = activeLedgerEncounters(gameState).map(a => ({
    key: a.actionId,
    source: 'active' as const,
    actorId: a.actorId,
    actorName: gameState.graph.getNode(a.actorId)?.name ?? 'a mortal',
    templateName: getChapterTemplateName(a.templateId),
    stakesLine: withStakes ? liveStakesLine(gameState, a) : undefined,
    statusLabel: `active · step ${a.currentStep + 1}`,
    sortTick: gameState.tick,
    threaded: isThreaded(gameState, a.actorId),
    routine: isRoutineTemplate(a.templateId),
    participantIds: [a.actorId, ...(a.supportBindings ?? []).map(b => b.nodeId)],
  }));

  // Live chapters all sort at the current tick, and `unifiedActions` is appended in
  // start order, so the newest start is listed first: the rows the Ledger tab marks
  // "new" by position are then the chapters that arrived last (review gate, THR-1893).
  return [...activeRows.reverse(), ...archivedRows];
}

/** Newest first. Stable: rows with the same tick keep their build order (live first). */
export function sortLedgerRowsNewestFirst(rows: LedgerRow[]): LedgerRow[] {
  return [...rows].sort((a, b) => b.sortTick - a.sortTick);
}

/** The default view's predicate: a threaded chapter that is not daily life. */
export function isDefaultLedgerRow(row: Pick<LedgerRow, 'threaded' | 'routine'>): boolean {
  return row.threaded && !row.routine;
}

/**
 * The rows the ledger's default view lists, newest first: the Ledger tab's rows and
 * the reader's default index are this list.
 */
export function selectThreadedChapters(gameState: GameState, opts: { withStakes?: boolean } = {}): LedgerRow[] {
  return sortLedgerRowsNewestFirst(buildLedgerRows(gameState, opts).filter(isDefaultLedgerRow));
}

/**
 * THR-1604 — how many rows the default view lists. The unread counts (the Ledger
 * tab, the strip) read this, never `chapterArchive.length`, so they never promise
 * chapters the ledger then says it does not have.
 */
export function countThreadedChapters(gameState: GameState): number {
  const archived = (gameState.chapterArchive ?? []).filter(r => r.threaded && !isRoutineChapter(r)).length;
  const active = activeLedgerEncounters(gameState).filter(
    a => !isRoutineTemplate(a.templateId) && isThreaded(gameState, a.actorId),
  ).length;
  return archived + active;
}

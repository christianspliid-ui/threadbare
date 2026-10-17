/**
 * ChapterLedger (THR-603) — the always-readable list of encounter chapters.
 *
 * One list, two sources merged newest-first: active encounters (live
 * `gameState.unifiedActions`) and resolved chapters (`gameState.chapterArchive`).
 * Clicking a row shows its full {@link ChapterView}. This is the
 * load-management answer to player-authored density: many chapters, all readable.
 *
 * Reused two ways:
 *  - As a dialog from GameView (`embedded={false}`): an L dialog in `SheetColumns`,
 *    the index left and the selected chapter right (THR-1820). The newest row whose
 *    record builds is selected on open — reading only, nothing is opened or resumed.
 *    The selection is the row's key, never a snapshot: the chapter re-derives from
 *    the current row whenever the rows recompute, so a live row's "active · step N"
 *    and its chapter agree, and a resolved encounter keeps its key. A click always
 *    answers: the highlight moves, and a row whose record does not build shows
 *    `CHAPTER_LEDGER_NO_RECORD` instead of keeping the previous chapter.
 *  - Embedded in the agent profile's Chapters tab (`embedded`, `filterAgentId` set):
 *    one column, the list or one chapter with Back.
 *
 * THR-1715 — daily life: routine chapters (chores, authored `threatRating: 'trivial'`)
 * never appear in the default view or the launcher badge. A **Daily life** chip lists
 * them instead (Law 55: nothing is lost, only demoted), globally and per agent.
 *
 * Memoization keys on the archive/action array identities + `runtime.worldVersion`,
 * never on graph object identity (the graph is mutated in place).
 */

import { useMemo, useState } from 'react';
import { Modal } from '../shared/Modal';
import { SheetColumns } from '../shared/SheetColumns';
import { Button } from '../shared/Button';
import { CHAPTER_LEDGER_NO_RECORD } from '../../data/ui-content';
import { Tooltip } from '../shared/Tooltip';
import { Icon } from '../shared/Icon';
import { ChapterView } from './ChapterView';
import type { ChapterRecord } from '../../types/chapterRecord';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { SimulationRuntime } from '../../engine/simulationRuntime';
import {
  buildChapterRecord,
  isEncounterAction,
  isRoutineChapter,
  getChapterTemplateName,
  CHAPTER_LEDGER_PAGE_SIZE,
} from '../../engine/chapterArchive';
import { outcomePhrase } from '../../engine/aftermathWords';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { stakesLineForAction } from '../../engine/encounters/stakesLine';
import { isRoutineTemplate } from '../../engine/attentionCadence';

/** C3 (THR-1715): the Daily-life filter's empty state. Plain register, no second person (Law 42). */
export const DAILY_LIFE_EMPTY_STATE = 'Nothing ordinary has happened yet.';

interface ChapterLedgerProps {
  gameState: GameState;
  runtime?: SimulationRuntime;
  /** Close the full-screen ledger (modal mode only). */
  onClose?: () => void;
  /** Restrict to chapters where this entity is the actor or a bound participant. */
  filterAgentId?: string;
  /** Render inline (no Modal chrome) — used inside the agent profile Chapters tab. */
  embedded?: boolean;
  /** Open the profile for a named participant/actor/place. */
  onOpenEntity?: (id: string) => void;
}

interface LedgerRow {
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

/**
 * THR-1604 — the number of rows the global ledger's default view lists:
 * threaded chapters, archived and in progress. The launcher's badge reads this,
 * not `chapterArchive.length`, so it never promises chapters the ledger then
 * says it does not have (the cold playtest saw "416" beside "No chapters yet").
 *
 * THR-1715: routine (daily-life) chapters are excluded — the default view does not
 * list them, so the badge must not count them.
 */
export function countThreadedChapters(gameState: GameState): number {
  const archived = (gameState.chapterArchive ?? []).filter(r => r.threaded && !isRoutineChapter(r)).length;
  const active = gameState.unifiedActions.filter(
    a => !a.resolved && isEncounterAction(a.templateId) && !isRoutineTemplate(a.templateId)
      && isThreaded(gameState, a.actorId),
  ).length;
  return archived + active;
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

function matchesAgent(
  filterAgentId: string,
  actorId: string,
  participantIds: readonly string[],
): boolean {
  return actorId === filterAgentId || participantIds.includes(filterAgentId);
}

export function ChapterLedger({
  gameState,
  runtime,
  onClose,
  filterAgentId,
  embedded = false,
  onOpenEntity,
}: ChapterLedgerProps) {
  /** The row the player clicked, by key (THR-1820). Null until a click. */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const twoColumn = !embedded;
  const [showAll, setShowAll] = useState(false);
  const [dailyLife, setDailyLife] = useState(false);
  const [page, setPage] = useState(0);

  const archive = gameState.chapterArchive ?? [];
  const activeEncounters = useMemo(
    () => gameState.unifiedActions.filter(a => !a.resolved && isEncounterAction(a.templateId)),
    [gameState.unifiedActions],
  );

  const rows = useMemo<LedgerRow[]>(() => {
    const archivedRows: LedgerRow[] = archive
      .filter(r => !filterAgentId || matchesAgent(filterAgentId, r.actorId, r.participants.map(p => p.id)))
      .map(r => ({
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
      }));

    const activeRows: LedgerRow[] = activeEncounters
      .filter(
        a =>
          !filterAgentId ||
          matchesAgent(filterAgentId, a.actorId, (a.supportBindings ?? []).map(b => b.nodeId)),
      )
      .map(a => ({
        key: a.actionId,
        source: 'active' as const,
        actorId: a.actorId,
        actorName: gameState.graph.getNode(a.actorId)?.name ?? 'a mortal',
        templateName: getChapterTemplateName(a.templateId),
        stakesLine: liveStakesLine(gameState, a as UnifiedAction),
        statusLabel: `active · step ${a.currentStep + 1}`,
        sortTick: gameState.tick,
        threaded: isThreaded(gameState, a.actorId),
        routine: isRoutineTemplate(a.templateId),
      }));

    let merged = [...activeRows, ...archivedRows];
    // THR-1715: story by default; the Daily-life chip lists the chores instead.
    merged = merged.filter(r => r.routine === dailyLife);
    // Default view (global ledger): threaded chapters only, unless "show all".
    if (!filterAgentId && !showAll) merged = merged.filter(r => r.threaded);
    merged.sort((a, b) => b.sortTick - a.sortTick);
    return merged;
    // worldVersion covers graph-derived name/threaded reads; array identities cover data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive, activeEncounters, filterAgentId, showAll, dailyLife, gameState.tick, runtime?.worldVersion]);

  const pageCount = Math.max(1, Math.ceil(rows.length / CHAPTER_LEDGER_PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    clampedPage * CHAPTER_LEDGER_PAGE_SIZE,
    (clampedPage + 1) * CHAPTER_LEDGER_PAGE_SIZE,
  );

  /** The record behind a row, built from the current data; null when it does not build. */
  function recordForRow(row: LedgerRow | undefined): ChapterRecord | null {
    if (!row) return null;
    try {
      if (row.source === 'archived') return archive.find(r => r.actionId === row.key) ?? null;
      const action = activeEncounters.find(a => a.actionId === row.key);
      return action ? buildChapterRecord(action as UnifiedAction, gameState, runtime) : null;
    } catch {
      return null; // fail-soft: a broken record reads as "no record yet"
    }
  }

  /** The first row (newest first) whose record builds — the open-time selection. */
  function firstBuildableKey(list: readonly LedgerRow[]): string | null {
    for (const row of list) if (recordForRow(row)) return row.key;
    return null;
  }

  // Pinned at open: the newest buildable row, so the selection does not jump as new
  // encounters start while the ledger is open.
  const [openKey] = useState<string | null>(() => (twoColumn ? firstBuildableKey(rows) : null));

  const shownKey = useMemo<string | null>(() => {
    const present = (key: string | null): key is string => key !== null && rows.some(r => r.key === key);
    if (present(selectedKey)) return selectedKey;
    if (!twoColumn) return null;
    if (present(openKey)) return openKey;
    return firstBuildableKey(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, selectedKey, openKey, twoColumn]);

  // Re-derived from the current row on every recompute — never a stored snapshot.
  const shownRecord = useMemo<ChapterRecord | null>(
    () => (shownKey ? recordForRow(rows.find(r => r.key === shownKey)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, shownKey],
  );

  const noRecord = (
    <div
      data-testid="chapter-ledger-no-record"
      style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: 'var(--space-2, 8px) 0' }}
    >
      {CHAPTER_LEDGER_NO_RECORD}
    </div>
  );

  const index = (
    <div data-testid="chapter-ledger-index" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2, 8px)' }}>
        {!filterAgentId && (
          <>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)' }}>
              {dailyLife ? 'Daily life' : showAll ? 'All chapters' : 'Threaded chapters'} · {rows.length}
            </span>
            <button
              type="button"
              onClick={() => { setShowAll(v => !v); setPage(0); }}
              style={chipStyle(false)}
            >
              {showAll ? 'Show threaded only' : 'Show all'}
            </button>
          </>
        )}
        <Tooltip id="ui.ledger.daily_life" focusable={false}>
          <button
            type="button"
            data-testid="chapter-ledger-daily-life"
            aria-pressed={dailyLife}
            onClick={() => { setDailyLife(v => !v); setPage(0); }}
            style={chipStyle(dailyLife)}
          >
            Daily life
          </button>
        </Tooltip>
      </div>

      {rows.length === 0 && (
        <div style={{ color: 'var(--text-tertiary, #6a6255)', fontStyle: 'italic', padding: 'var(--space-2, 8px) 0' }}>
          {dailyLife ? DAILY_LIFE_EMPTY_STATE : 'No chapters yet. Weave threads and the world will start writing them.'}
        </div>
      )}

      {pageRows.map(row => {
        const isSelected = twoColumn && row.key === shownKey;
        return (
        <button
          key={row.key}
          type="button"
          data-testid="chapter-ledger-row"
          data-selected={isSelected ? 'true' : undefined}
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => setSelectedKey(row.key)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px',
            width: '100%',
            textAlign: 'left',
            background: isSelected ? 'var(--bg-hover)' : 'var(--bg-panel, rgba(255,255,255,0.02))',
            border: `1px solid ${isSelected ? 'var(--accent-gold-dim)' : 'var(--border-subtle, #40382c)'}`,
            borderRadius: '8px',
            transition: 'background var(--anim-fast), border-color var(--anim-fast)',
            padding: 'var(--space-2, 8px)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            font: 'inherit',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)' }}>
            {row.threaded && <Icon name="threads" size="floor" label="Threaded" style={{ color: 'var(--accent-gold, #d4af37)', marginRight: 4 }} />}
            {row.templateName}
          </span>
          {row.stakesLine && (
            <span
              data-testid="chapter-ledger-stakes-line"
              style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--text-primary)' }}
            >
              {row.stakesLine}
            </span>
          )}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {row.actorName} · {row.statusLabel}
          </span>
        </button>
        );
      })}

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2, 8px)', paddingTop: 'var(--space-1, 4px)' }}>
          <button
            type="button"
            disabled={clampedPage === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            style={pagerStyle(clampedPage === 0)}
          >
            ‹
          </button>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)' }}>
            {clampedPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={clampedPage >= pageCount - 1}
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            style={pagerStyle(clampedPage >= pageCount - 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    if (selectedKey !== null && shownKey !== null) {
      const back = () => setSelectedKey(null);
      return (
        <div>
          {shownRecord
            ? <ChapterView chapter={shownRecord} onOpenEntity={onOpenEntity} onBack={back} />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
                <Button variant="ghost" size="sm" onClick={back} style={{ alignSelf: 'flex-start' }}>Back</Button>
                {noRecord}
              </div>
            )}
        </div>
      );
    }
    return <div>{index}</div>;
  }

  return (
    <Modal open onClose={onClose ?? (() => {})} size="l" aria-label="Chapter Ledger">
      <Modal.Header onClose={onClose}>Chapter Ledger</Modal.Header>
      {shownKey !== null ? (
        <SheetColumns aside={index} asideLabel="Chapters" mainLabel="Chapter">
          <div data-testid="chapter-ledger-chapter">
            {shownRecord ? <ChapterView chapter={shownRecord} onOpenEntity={onOpenEntity} /> : noRecord}
          </div>
        </SheetColumns>
      ) : (
        <Modal.Body>{index}</Modal.Body>
      )}
    </Modal>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--bg-hover, rgba(255,255,255,0.06))' : 'none',
    border: `1px solid ${active ? 'var(--accent-gold-dim, #8a7330)' : 'var(--border-subtle, #40382c)'}`,
    borderRadius: '6px',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    padding: '2px 8px',
  };
}

function pagerStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'none',
    border: '1px solid var(--border-subtle, #40382c)',
    borderRadius: '6px',
    color: disabled ? 'var(--text-tertiary, #6a6255)' : 'var(--text-secondary)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 'var(--text-sm)',
    padding: '2px 10px',
    opacity: disabled ? 0.5 : 1,
  };
}

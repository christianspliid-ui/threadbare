/**
 * ChapterLedger (THR-603) — the always-readable list of encounter chapters.
 *
 * One list, two sources merged newest-first: active encounters (live
 * `gameState.unifiedActions`) and resolved chapters (`gameState.chapterArchive`).
 * Clicking a row drills into the full {@link ChapterView}. This is the
 * load-management answer to player-authored density: many chapters, all readable.
 *
 * Reused two ways:
 *  - Full-screen from GameView (`embedded={false}`, wrapped in a Modal).
 *  - Embedded in the agent profile's Chapters tab (`embedded`, `filterAgentId` set).
 *
 * Memoization keys on the archive/action array identities + `runtime.worldVersion`,
 * never on graph object identity (the graph is mutated in place).
 */

import { useMemo, useState } from 'react';
import { Modal } from '../shared/Modal';
import { ChapterView } from './ChapterView';
import type { ChapterRecord } from '../../types/chapterRecord';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { SimulationRuntime } from '../../engine/simulationRuntime';
import {
  buildChapterRecord,
  isEncounterAction,
  getChapterTemplateName,
  CHAPTER_LEDGER_PAGE_SIZE,
} from '../../engine/chapterArchive';
import { outcomePhrase } from '../../engine/aftermathWords';

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
  statusLabel: string;
  sortTick: number;
  threaded: boolean;
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
  const [selected, setSelected] = useState<ChapterRecord | null>(null);
  const [showAll, setShowAll] = useState(false);
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
        statusLabel: resolvedStatusLabel(r.outcome),
        sortTick: r.resolvedTick,
        threaded: r.threaded,
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
        statusLabel: `active · step ${a.currentStep + 1}`,
        sortTick: gameState.tick,
        threaded: isThreaded(gameState, a.actorId),
      }));

    let merged = [...activeRows, ...archivedRows];
    // Default view (global ledger): threaded chapters only, unless "show all".
    if (!filterAgentId && !showAll) merged = merged.filter(r => r.threaded);
    merged.sort((a, b) => b.sortTick - a.sortTick);
    return merged;
    // worldVersion covers graph-derived name/threaded reads; array identities cover data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive, activeEncounters, filterAgentId, showAll, gameState.tick, runtime?.worldVersion]);

  const pageCount = Math.max(1, Math.ceil(rows.length / CHAPTER_LEDGER_PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    clampedPage * CHAPTER_LEDGER_PAGE_SIZE,
    (clampedPage + 1) * CHAPTER_LEDGER_PAGE_SIZE,
  );

  function openRow(row: LedgerRow) {
    if (row.source === 'archived') {
      const rec = archive.find(r => r.actionId === row.key);
      if (rec) setSelected(rec);
      return;
    }
    const action = activeEncounters.find(a => a.actionId === row.key);
    if (action) {
      const rec = buildChapterRecord(action as UnifiedAction, gameState, runtime);
      if (rec) setSelected(rec);
    }
  }

  const body = selected ? (
    <ChapterView chapter={selected} onOpenEntity={onOpenEntity} onBack={() => setSelected(null)} />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)' }}>
      {!filterAgentId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2, 8px)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)' }}>
            {showAll ? 'All chapters' : 'Threaded chapters'} · {rows.length}
          </span>
          <button
            type="button"
            onClick={() => { setShowAll(v => !v); setPage(0); }}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle, #40382c)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              padding: '2px 8px',
            }}
          >
            {showAll ? 'Show threaded only' : 'Show all'}
          </button>
        </div>
      )}

      {rows.length === 0 && (
        <div style={{ color: 'var(--text-tertiary, #6a6255)', fontStyle: 'italic', padding: 'var(--space-2, 8px) 0' }}>
          No chapters yet. Weave threads and the world will start writing them.
        </div>
      )}

      {pageRows.map(row => (
        <button
          key={row.key}
          type="button"
          onClick={() => openRow(row)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '2px',
            width: '100%',
            textAlign: 'left',
            background: 'var(--bg-panel, rgba(255,255,255,0.02))',
            border: '1px solid var(--border-subtle, #40382c)',
            borderRadius: '8px',
            padding: 'var(--space-2, 8px)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            font: 'inherit',
          }}
        >
          <span style={{ fontSize: 'var(--text-sm)' }}>
            {row.threaded && <span style={{ color: 'var(--accent-gold, #d4af37)' }}>✦ </span>}
            {row.templateName}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {row.actorName} · {row.statusLabel}
          </span>
        </button>
      ))}

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
    return <div>{body}</div>;
  }

  return (
    <Modal open onClose={onClose ?? (() => {})} maxWidth={720} aria-label="Chapter Ledger">
      <Modal.Header onClose={onClose}>Chapter Ledger</Modal.Header>
      <Modal.Body>{body}</Modal.Body>
    </Modal>
  );
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

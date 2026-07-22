/**
 * Notables intent panel (THR-630) — what the world's prominent figures are
 * pursuing. Mirrors the RivalPanel scheme-card pattern (THR-66): one row per
 * active agenda with a phase-chip progress strip, contested/done states, and
 * a Tug-gated badge when the player's thread has frozen the sponsor's agenda.
 */
import React from 'react';
import type { GameState } from '../../types/gameState';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';
import {
  AGENDA_FAMILY_COLORS,
  AGENDA_FAMILY_COLOR_DEFAULT,
} from '../../data/uiColorPalette';
import { getNotableAgendaFamily } from '../../data/notable-agendas';
import { agendaFlags } from '../../engine/notableAgendas';

interface NotablesPanelProps {
  gameState: GameState;
}

export interface NotableAgendaRow {
  compositionId: string;
  notableName: string;
  familyId: string;
  familyLabel: string;
  targetName: string | null;
  phaseIndex: number;
  totalPhases: number;
  status: 'active' | 'completed' | 'failed';
  contested: boolean;
  tugGated: boolean;
}

/** Derive panel rows from live state (exported for tests). */
export function buildNotableAgendaRows(gameState: GameState): NotableAgendaRow[] {
  const graph = gameState.graph;
  const worldFlags = (gameState.worldFlags ?? {}) as Record<string, unknown>;
  const ascendantId = gameState.ascendantId;
  return (gameState.activeCompositions ?? [])
    .filter((c) => c.sponsorNotableId && c.agendaFamily)
    .map((c) => {
      const family = getNotableAgendaFamily(c.agendaFamily!);
      const notable = graph.getNode(c.sponsorNotableId!);
      const targetId = c.resolvedNodes.target;
      const target = targetId ? graph.getNode(targetId) : null;
      const counters = worldFlags[agendaFlags.counters(c.compositionId)];
      const stallUntil = worldFlags[agendaFlags.stallUntil(c.compositionId)];
      const contested =
        (typeof counters === 'number' && counters > 0) ||
        (typeof stallUntil === 'number' && stallUntil > gameState.tick);
      const tugGated = Boolean(
        ascendantId &&
          graph
            .getIncomingEdges(c.sponsorNotableId!, 'thread')
            .some((e) => e.source === ascendantId),
      );
      return {
        compositionId: c.compositionId,
        notableName: notable?.name ?? c.sponsorNotableId!,
        familyId: c.agendaFamily!,
        familyLabel: family?.label ?? c.agendaFamily!,
        targetName: target?.name ?? null,
        phaseIndex: c.activatedPhaseIds.length,
        totalPhases: family?.beats.length ?? 4,
        status: c.status,
        contested,
        tugGated,
      };
    });
}

export const NotablesPanel = React.memo(function NotablesPanel({ gameState }: NotablesPanelProps) {
  const rows = buildNotableAgendaRows(gameState);

  if (rows.length === 0) {
    return (
      <p
        className="italic text-center py-2 animate-breathe"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
      >
        The great and the restless bide their time.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <SectionHeading as="h2" count={rows.length}>Notable Intents</SectionHeading>
      <div role="list" aria-label="Notable agendas">
        {rows.map((row) => {
          const color = AGENDA_FAMILY_COLORS[row.familyId] ?? AGENDA_FAMILY_COLOR_DEFAULT;
          const failed = row.status === 'failed';
          const done = row.status === 'completed';
          return (
            <div
              key={row.compositionId}
              role="listitem"
              aria-label={`${row.notableName}, ${row.familyLabel}, phase ${row.phaseIndex} of ${row.totalPhases}, ${row.status}`}
            >
              <ListRow
                accentColor={color}
                trailing={
                  <span className="uppercase tracking-wider" style={{ fontSize: 'var(--text-xs)', color }}>
                    {row.familyLabel}
                  </span>
                }
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <ListRow.Title>{row.notableName}</ListRow.Title>
                  {row.targetName && (
                    <ListRow.Subtitle>
                      {failed ? 'Abandoned designs on ' : done ? 'Settled the matter of ' : 'Eyes on '}
                      {row.targetName}
                    </ListRow.Subtitle>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex gap-1" aria-hidden="true">
                      {Array.from({ length: row.totalPhases }).map((_, idx) => (
                        <span
                          key={idx}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: '0.4rem',
                            height: '0.4rem',
                            backgroundColor:
                              idx < row.phaseIndex ? color : 'var(--bg-raised, #2a2a2a)',
                            border:
                              idx === row.phaseIndex && !done && !failed
                                ? `1px solid ${color}`
                                : '1px solid transparent',
                          }}
                        />
                      ))}
                    </div>
                    {row.tugGated && !done && !failed && (
                      <span
                        className="uppercase tracking-wider"
                        style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}
                      >
                        Tug-gated
                      </span>
                    )}
                    {row.contested && !done && !failed && (
                      <span
                        className="uppercase tracking-wider"
                        style={{ fontSize: '0.6rem', color: 'var(--color-warning, #d9a441)' }}
                      >
                        Contested
                      </span>
                    )}
                    {done && (
                      <span className="uppercase tracking-wider" style={{ fontSize: '0.6rem', color }}>
                        Done
                      </span>
                    )}
                    {failed && (
                      <span
                        className="uppercase tracking-wider"
                        style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}
                      >
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              </ListRow>
            </div>
          );
        })}
      </div>
    </div>
  );
});

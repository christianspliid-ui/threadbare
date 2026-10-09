/**
 * Notables intent panel (THR-630) — what the world's prominent figures are
 * pursuing. Mirrors the RivalPanel scheme-card pattern (THR-66): a phase-chip
 * progress strip, contested/done states, and a Tug-gated badge when the
 * player's thread has frozen the sponsor's agenda.
 *
 * THR-1780: one row per *notable*, not per agenda — a ruler with two agendas
 * was listed twice ("Rulers (19), with Scorvin in it twice") while the top-bar
 * badge counted active agendas only. The badge now reads {@link countShownNotables},
 * the same set the panel draws, and every notable and target name is a link
 * through the one ref router (Law 21).
 */
import React from 'react';
import type { GameState } from '../../types/gameState';
import type { WorldRef } from '../../types/worldRef';
import { SectionHeading } from '../shared/SectionHeading';
import { ListRow } from '../shared/ListRow';
import { EntityLink } from '../shared/EntityLink';
import {
  AGENDA_FAMILY_COLORS,
  AGENDA_FAMILY_COLOR_DEFAULT,
} from '../../data/uiColorPalette';
import { getNotableAgendaFamily } from '../../data/notable-agendas';
import { agendaFlags } from '../../engine/notableAgendas';
import { worldRefKindOf } from '../../engine/undertakingDeed';

/** THR-1655: the panel scrolls inside the dropdown past this height, so it never leaves the viewport. */
const NOTABLES_PANEL_MAX_HEIGHT = '70vh';

interface NotablesPanelProps {
  gameState: GameState;
}

export interface NotableAgendaRow {
  compositionId: string;
  /** THR-1780: the sponsor's node id — the key rows group on, and what the name opens. */
  notableId: string;
  notableName: string;
  familyId: string;
  familyLabel: string;
  targetName: string | null;
  /** THR-1780: the target as a routable reference, or null when no page exists for it. */
  targetRef: WorldRef | null;
  phaseIndex: number;
  totalPhases: number;
  status: 'active' | 'completed' | 'failed';
  contested: boolean;
  tugGated: boolean;
  /** THR-1655: a seeded settlement notable's agenda (the Local group), not a ruler's. */
  local: boolean;
}

/** One notable and every agenda they sponsor — one panel row (THR-1780). */
export interface NotableEntry {
  notableId: string;
  notableName: string;
  /** Null when the sponsor node is missing or is not a kind with a page — the name renders as text. */
  notableRef: WorldRef | null;
  /** True when every agenda is a settlement notable's (the Local group). */
  local: boolean;
  agendas: NotableAgendaRow[];
}

/** Derive one row per agenda from live state (exported for tests). */
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
      const targetKind = target ? worldRefKindOf(target) : null;
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
        notableId: c.sponsorNotableId!,
        notableName: notable?.name ?? c.sponsorNotableId!,
        familyId: c.agendaFamily!,
        familyLabel: family?.label ?? c.agendaFamily!,
        targetName: target?.name ?? null,
        targetRef: target && targetKind ? { kind: targetKind, id: target.id, name: target.name } : null,
        phaseIndex: c.activatedPhaseIds.length,
        totalPhases: family?.beats.length ?? 4,
        status: c.status,
        contested,
        tugGated,
        local: worldFlags[agendaFlags.local(c.compositionId)] === true,
      };
    });
}

/**
 * Group agenda rows per notable, in first-seen order (exported for tests).
 *
 * Within a notable, active agendas lead and settled ones follow, so the row reads what
 * they are doing now before what they have done.
 */
export function buildNotableEntries(gameState: GameState): NotableEntry[] {
  const graph = gameState.graph;
  const byId = new Map<string, NotableEntry>();
  for (const row of buildNotableAgendaRows(gameState)) {
    let entry = byId.get(row.notableId);
    if (!entry) {
      const node = graph.getNode(row.notableId);
      const kind = node ? worldRefKindOf(node) : null;
      entry = {
        notableId: row.notableId,
        notableName: row.notableName,
        notableRef: node && kind ? { kind, id: node.id, name: node.name } : null,
        local: true,
        agendas: [],
      };
      byId.set(row.notableId, entry);
    }
    entry.agendas.push(row);
    entry.local = entry.local && row.local;
  }
  const statusRank = (s: NotableAgendaRow['status']) => (s === 'active' ? 0 : 1);
  for (const entry of byId.values()) {
    entry.agendas.sort((a, b) => statusRank(a.status) - statusRank(b.status));
  }
  return [...byId.values()];
}

/** The number of notables the panel shows — what the top-bar badge reads (THR-1780). */
export function countShownNotables(gameState: GameState): number {
  return buildNotableEntries(gameState).length;
}

export const NotablesPanel = React.memo(function NotablesPanel({ gameState }: NotablesPanelProps) {
  const entries = buildNotableEntries(gameState);

  if (entries.length === 0) {
    return (
      <p
        className="italic text-center py-2 animate-breathe"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
      >
        The great and the restless bide their time.
      </p>
    );
  }

  // THR-1655: two groups — the realm's rulers and the settlements' own figures (Law 36).
  const groups = [
    { key: 'rulers', title: 'Rulers', entries: entries.filter((e) => !e.local) },
    { key: 'local', title: 'Local', entries: entries.filter((e) => e.local) },
  ].filter((g) => g.entries.length > 0);

  // The dropdown has no scroll of its own; a busy world's rows ran past the fold (Law 33).
  return (
    <div className="space-y-3 overflow-y-auto overflow-x-hidden pr-1" style={{ maxHeight: NOTABLES_PANEL_MAX_HEIGHT }}>
      {groups.map((group) => (
        <section key={group.key} className="space-y-2" data-testid={`notables-group-${group.key}`}>
          <SectionHeading as="h2" count={group.entries.length}>{group.title}</SectionHeading>
          <NotableList entries={group.entries} label={group.title} />
        </section>
      ))}
    </div>
  );
});

function agendaVerb(row: NotableAgendaRow): string {
  if (row.status === 'failed') return 'Abandoned designs on ';
  if (row.status === 'completed') return 'Settled the matter of ';
  return 'Eyes on ';
}

function NotableList({ entries, label }: { entries: NotableEntry[]; label: string }) {
  return (
    <div role="list" aria-label={label}>
      {entries.map((entry) => {
        const lead = entry.agendas[0];
        const color = AGENDA_FAMILY_COLORS[lead.familyId] ?? AGENDA_FAMILY_COLOR_DEFAULT;
        // Law 13 binds aria prose too (THR-1451) — name the agendas rather than count them.
        const agendaWords = entry.agendas.map((a) => a.familyLabel).join(', ');
        return (
          <div
            key={entry.notableId}
            role="listitem"
            data-notable-id={entry.notableId}
            aria-label={`${entry.notableName}, ${agendaWords}`}
          >
            <ListRow accentColor={color}>
              <div style={{ minWidth: 0, flex: 1 }}>
                {/* THR-1655: each on its own truncating line — the primitives are inline
                    spans, so side by side they ran together and under the family label. */}
                <div className="truncate">
                  <ListRow.Title>
                    {entry.notableRef ? (
                      <EntityLink id={entry.notableId} name={entry.notableName} entityRef={entry.notableRef} />
                    ) : (
                      entry.notableName
                    )}
                  </ListRow.Title>
                </div>
                {entry.agendas.map((row) => (
                  <AgendaLine key={row.compositionId} row={row} />
                ))}
              </div>
            </ListRow>
          </div>
        );
      })}
    </div>
  );
}

function AgendaLine({ row }: { row: NotableAgendaRow }) {
  const color = AGENDA_FAMILY_COLORS[row.familyId] ?? AGENDA_FAMILY_COLOR_DEFAULT;
  const failed = row.status === 'failed';
  const done = row.status === 'completed';
  return (
    <div
      className="mt-1"
      role="group"
      data-testid="notable-agenda"
      aria-label={`${row.familyLabel}, phase ${row.phaseIndex} of ${row.totalPhases}, ${row.status}`}
    >
      {/* The family label rides the progress strip so the target line keeps the full
          width — beside it, a long place name truncated to "Eyes on …" (THR-1780). */}
      {row.targetName && (
        <div className="truncate">
          <ListRow.Subtitle>
            {agendaVerb(row)}
            {row.targetRef ? (
              <EntityLink id={row.targetRef.id} name={row.targetName} entityRef={row.targetRef} />
            ) : (
              row.targetName
            )}
          </ListRow.Subtitle>
        </div>
      )}
      <div className="mt-0.5 flex items-center gap-2">
        <span className="uppercase tracking-wider" style={{ fontSize: '0.6rem', color }}>
          {row.familyLabel}
        </span>
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
  );
}

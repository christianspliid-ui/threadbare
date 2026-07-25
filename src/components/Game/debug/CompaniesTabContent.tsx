import React from 'react';
import type { WorldGraph } from '../../../engine/graph';
import {
  getAllGroups,
  getGroupLeader,
  getGroupMembers,
  getGroupPosition,
  getGroupCohesion,
  getCohesionState,
  isGroupBlessed,
  isGroupSundered,
  isGroupReuniting,
  type CohesionState,
} from '../../../engine/groups/groupQueries';

/**
 * DebugPanel "Companies" tab (THR-74). Ground-truth graph readout of the company
 * layer, mirroring {@link ArmiesTabContent}. Debug is the one place numbers belong,
 * so cohesion is shown numerically here (with the prose-state ladder alongside);
 * player-facing surfaces render the state word instead.
 */

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: 'var(--text-xs)',
};

const DETAIL_ROW_STYLE: React.CSSProperties = {
  marginBottom: '6px',
  display: 'flex',
  gap: '8px',
};

const DETAIL_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
  minWidth: '120px',
  fontWeight: 500,
};

const DETAIL_VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  flex: 1,
};

/** Ladder → color, brightest when bound, red at breaking. */
const COHESION_STATE_COLOR: Record<CohesionState, string> = {
  bound: '#4ade80',
  holding: '#fbbf24',
  frayed: '#f59e0b',
  breaking: '#b85450',
};

export interface CompaniesTabContentProps {
  graph?: WorldGraph;
  currentTick: number;
  onZoomToLocation?: (locationId: string) => void;
}

export function CompaniesTabContent({ graph, currentTick, onZoomToLocation }: CompaniesTabContentProps) {
  if (!graph) {
    return <div style={EMPTY_STATE_STYLE}>No graph available.</div>;
  }

  const all = getAllGroups(graph);
  const active = all.filter(g => (g.properties as Record<string, unknown>).groupStatus !== 'disbanded');
  const disbanded = all.filter(g => (g.properties as Record<string, unknown>).groupStatus === 'disbanded');

  if (all.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No companies yet. Spotlight agents band together when enough share a location; formation is
        threshold-gated (GROUP_FORMATION_MIN_COLOCATED).
      </div>
    );
  }

  return (
    <div className="p-3 text-xs font-mono">
      {active.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2" style={{ color: '#D4A574' }}>
            Active Companies ({active.length})
          </div>
          {active.map((group) => {
            const props = group.properties as Record<string, unknown>;
            const leader = getGroupLeader(graph, group.id);
            const members = getGroupMembers(graph, group.id);
            const cohesion = getGroupCohesion(group);
            const state = getCohesionState(cohesion);
            const positionId = getGroupPosition(graph, group.id);
            const position = positionId ? (graph.getNode(positionId)?.name ?? positionId) : null;
            const destId = props.groupDestinationId as string | undefined;
            const destination = destId ? (graph.getNode(destId)?.name ?? destId) : null;
            const blessed = isGroupBlessed(group, currentTick);
            const sundered = isGroupSundered(group, currentTick);
            const reuniting = isGroupReuniting(group, currentTick);
            const ticksActive = currentTick - ((props.formedAtTick as number | undefined) ?? currentTick);

            return (
              <div key={group.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
                <div className="font-semibold mb-1">
                  {group.name}
                  {positionId && onZoomToLocation && (
                    <button
                      onClick={() => onZoomToLocation(positionId)}
                      title={`Zoom to ${position ?? positionId}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '6px', fontSize: 'var(--text-xs)', lineHeight: 1 }}
                    >&#x1F441;</button>
                  )}
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Type:</span>
                  <span style={DETAIL_VALUE_STYLE}>{String(props.groupType)}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Cohesion:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, color: COHESION_STATE_COLOR[state] }}>
                    {cohesion.toFixed(2)} ({state})
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Leader:</span>
                  <span style={DETAIL_VALUE_STYLE}>{leader?.name ?? '—'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Members ({members.length}):</span>
                  <span style={DETAIL_VALUE_STYLE}>
                    {members.length === 0
                      ? '—'
                      : members.map(m => (m.id === leader?.id ? `${m.name} (leader)` : m.name)).join(', ')}
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Position:</span>
                  <span style={DETAIL_VALUE_STYLE}>{position ?? '—'}</span>
                </div>
                {destination && (
                  <div style={DETAIL_ROW_STYLE}>
                    <span style={DETAIL_LABEL_STYLE}>Travelling to:</span>
                    <span style={DETAIL_VALUE_STYLE}>{destination}</span>
                  </div>
                )}
                {blessed && (
                  <div style={DETAIL_ROW_STYLE}>
                    <span style={DETAIL_LABEL_STYLE}>Blessed until:</span>
                    <span style={{ ...DETAIL_VALUE_STYLE, color: '#a78bfa' }}>
                      tick {String(props.blessedUntilTick)}
                    </span>
                  </div>
                )}
                {/* THR-732 — rendered independently of Blessed above, never as an
                    either/or: a company under both windows must show both, because
                    "blessed and sundered at once" is a real state the two verbs are
                    designed to produce and the panel is where an operator checks it. */}
                {sundered && (
                  <div style={DETAIL_ROW_STYLE}>
                    <span style={DETAIL_LABEL_STYLE}>Sundered until:</span>
                    <span style={{ ...DETAIL_VALUE_STYLE, color: '#f87171' }}>
                      tick {String(props.sunderedUntilTick)}
                    </span>
                  </div>
                )}
                {reuniting && (
                  <div style={DETAIL_ROW_STYLE}>
                    <span style={DETAIL_LABEL_STYLE}>Reunion called until:</span>
                    <span style={{ ...DETAIL_VALUE_STYLE, color: '#fbbf24' }}>
                      tick {String(props.reuniteUntilTick)}
                    </span>
                  </div>
                )}
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Active:</span>
                  <span style={DETAIL_VALUE_STYLE}>{ticksActive} ticks</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {disbanded.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2 mt-3" style={{ color: '#b85450' }}>
            Disbanded ({disbanded.length})
          </div>
          {disbanded.map((group) => {
            const props = group.properties as Record<string, unknown>;
            return (
              <div key={group.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px] opacity-70">
                <div className="font-semibold mb-1">{group.name}</div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Ended:</span>
                  <span style={DETAIL_VALUE_STYLE}>
                    tick {String(props.disbandedAtTick ?? '?')} — {String(props.dissolutionReason ?? 'unknown')}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/**
 * DelveProgressPanel — shows active delves for bonded agents (THR-152).
 *
 * Renders as a compact overlay card above the timeline. Only shows when
 * there is at least one active non-aborted delve for an agent bonded to the
 * player's ascendant.
 *
 * Per the dual-voice chronicle pattern:
 *   Poet's Voice  — display serif, italic, narrative prose
 *   Witness's Voice — body sans-serif, muted, bulleted mechanics
 */

import React, { useMemo, useCallback } from 'react';
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../../engine/graph';
import type { ActiveDelve } from '../../engine/ruins/delveTypes';
import { abortDelve } from '../../engine/ruins/delveVariant';
import { EMERGENCE_DECISION_HINT_TICKS, EMERGENCE_DECISION_TIMEOUT_TICKS } from '../../engine/ruins/constants';

// ── Styles (inline — consistent with existing overlay panels) ─────────────────

const PANEL: React.CSSProperties = {
  position: 'absolute',
  bottom: '64px',   // sits above the timeline bar
  right: '12px',
  width: '320px',
  maxHeight: '420px',
  overflowY: 'auto',
  background: 'var(--bg-overlay, rgba(12,10,8,0.95))',
  border: '1px solid var(--border-gold, #8b7355)',
  borderRadius: '4px',
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: 'var(--text-xs, 11px)',
  color: 'var(--text-primary, #e8dcc8)',
  zIndex: 200,
  pointerEvents: 'auto',
};

const HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px 4px',
  borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
};

const HEADER_TITLE: React.CSSProperties = {
  font: 'var(--type-section-label, 700 10px/1.2 var(--font-display, serif))',
  letterSpacing: '0.08em',
  color: 'var(--accent-gold, #c9a227)',
  textTransform: 'uppercase',
};

const CARD: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
};

const BEAT_PIPS = (filled: number, total: number): React.CSSProperties => ({ display: 'inline-block' });

const POET: React.CSSProperties = {
  fontFamily: 'var(--font-display, serif)',
  fontStyle: 'italic',
  fontSize: 'var(--text-xs, 11px)',
  color: 'var(--text-primary, #e8dcc8)',
  lineHeight: 1.45,
  margin: '4px 0',
};

const WITNESS_LIST: React.CSSProperties = {
  margin: '3px 0 0',
  paddingLeft: '14px',
  color: 'var(--text-muted, #7d7060)',
  lineHeight: 1.4,
};

const ABORT_BTN: React.CSSProperties = {
  marginTop: '6px',
  padding: '2px 8px',
  background: 'transparent',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
  borderRadius: '3px',
  color: 'var(--text-muted, #7d7060)',
  cursor: 'pointer',
  fontSize: 'var(--text-xs, 11px)',
};

const SCALE_COLOR: Record<string, string> = {
  minor: '#6b7280',
  major: '#d97706',
  saga:  '#7c3aed',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  gameState: GameState;
  graph: WorldGraph;
  ascendantId: string;
  onStateUpdate: (patch: Partial<GameState>) => void;
}

export function DelveProgressPanel({ gameState, graph, ascendantId, onStateUpdate }: Props) {
  // Only show delves for bonded agents (thread edges from ascendant)
  const bondedIds = useMemo(() => {
    return new Set(
      graph.getOutgoingEdges(ascendantId, 'thread').map(e => e.target),
    );
  }, [graph, ascendantId]);

  const visibleDelves = useMemo((): ActiveDelve[] => {
    const active = gameState.activeDelves ?? [];
    return active.filter(d =>
      !d.aborted &&
      d.beatIndex <= d.totalBeats &&
      (bondedIds.has(d.agentId) || d.agentId === ascendantId),
    );
  }, [gameState.activeDelves, bondedIds, ascendantId]);

  const pendingEmergence = gameState.pendingEmergenceDecision;

  const handleAbort = useCallback((delveId: string) => {
    const patch = abortDelve(delveId, gameState);
    onStateUpdate(patch);
  }, [gameState, onStateUpdate]);

  if (visibleDelves.length === 0 && !pendingEmergence) return null;

  return (
    <div style={PANEL} aria-label="Active delves panel">
      <div style={HEADER}>
        <span style={HEADER_TITLE}>Active Delves</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{visibleDelves.length} in progress</span>
      </div>

      {/* Pending emergence decision banner */}
      {pendingEmergence && (
        <div style={{ ...CARD, background: 'rgba(124,58,237,0.12)', borderLeft: '3px solid #7c3aed' }}>
          <div style={{ color: '#a78bfa', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '3px' }}>
            Emergence — awaiting your choice
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
            {pendingEmergence.agentId.slice(0, 14)} · {pendingEmergence.ruinId.slice(0, 14)}
            {' '}· auto-resolves as <em>Let</em> in {Math.max(0, pendingEmergence.autoFiresTick - gameState.tick)} ticks
          </div>
        </div>
      )}

      {visibleDelves.map(delve => (
        <DelveCard
          key={delve.delveId}
          delve={delve}
          graph={graph}
          currentTick={gameState.tick}
          onAbort={handleAbort}
        />
      ))}
    </div>
  );
}

// ── DelveCard ─────────────────────────────────────────────────────────────────

function DelveCard({
  delve,
  graph,
  currentTick,
  onAbort,
}: {
  delve: ActiveDelve;
  graph: WorldGraph;
  currentTick: number;
  onAbort: (id: string) => void;
}) {
  const agentNode = graph.getNode(delve.agentId);
  const agentName = agentNode?.name ?? delve.agentId;
  const ruinNode  = graph.getNode(delve.ruinId);
  const ruinName  = ruinNode?.name ?? delve.ruinId;

  const lastBeat = delve.beatHistory[delve.beatHistory.length - 1];
  const ticksUntilNext = Math.max(0, delve.nextBeatTick - currentTick);

  const scaleColor = SCALE_COLOR[delve.delveScale] ?? '#6b7280';

  return (
    <div style={CARD}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{
          background: scaleColor, color: '#fff',
          borderRadius: '3px', padding: '1px 5px',
          fontSize: '10px', fontWeight: 600,
        }}>
          {delve.delveScale}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 600, flex: 1 }}>
          {agentName} → {ruinName}
        </span>
      </div>

      {/* Beat progress pips */}
      <BeatPips beatIndex={delve.beatIndex} totalBeats={delve.totalBeats} />

      {/* Next beat countdown */}
      {delve.beatIndex < delve.totalBeats && (
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '3px' }}>
          {ticksUntilNext === 0 ? 'Resolving…' : `Next beat in ${ticksUntilNext} tick${ticksUntilNext !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* Last beat prose */}
      {lastBeat && (
        <>
          <div style={POET}>{lastBeat.poetProse}</div>
          <ul style={WITNESS_LIST}>
            {lastBeat.witnessFacts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </>
      )}

      {/* Capability odds indicator */}
      {lastBeat && (
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>
          Roll {lastBeat.capabilityRoll.toFixed(2)} vs {lastBeat.threshold.toFixed(2)} — {lastBeat.outcome}
        </div>
      )}

      {/* Abort control */}
      {delve.beatIndex < delve.totalBeats && (
        <button
          style={ABORT_BTN}
          onClick={() => onAbort(delve.delveId)}
          title="Abort this delve — refunds partial essence"
        >
          Abort delve
        </button>
      )}
    </div>
  );
}

function BeatPips({ beatIndex, totalBeats }: { beatIndex: number; totalBeats: number }) {
  return (
    <div style={{ display: 'flex', gap: '3px', margin: '2px 0' }}>
      {Array.from({ length: totalBeats }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '10px', height: '4px', borderRadius: '2px',
            background: i < beatIndex
              ? 'var(--accent-gold, #c9a227)'
              : 'var(--border-subtle, rgba(255,255,255,0.15))',
          }}
        />
      ))}
    </div>
  );
}

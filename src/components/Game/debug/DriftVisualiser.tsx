import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type { RetinueAgent } from '../../../engine/retinue';
import type {
  DriftThresholdCrossedTrace,
  DriftThresholdBand,
} from '../../../types/traces/encounter-traces';
import type { ArchetypeDrift } from '../../../types/gameState';
import {
  DRIFT_THRESHOLD_SOFT,
  DRIFT_THRESHOLD_BANNER,
  DRIFT_THRESHOLD_BECOMING,
} from '../../../data/encounter-experience-constants';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const RECENT_CROSSING_LIMIT = 12;

const THRESHOLD_COLOR: Record<DriftThresholdBand, string> = {
  soft: '#a08a4a',
  banner: '#d97706',
  becoming: '#b85450',
};

function isDriftCrossing(t: TraceEntry): t is TraceEntry & DriftThresholdCrossedTrace {
  return t.category === 'drift_threshold_crossed';
}

function resolveAgentName(id: string, retinueAgents?: readonly RetinueAgent[]): string {
  return retinueAgents?.find((a) => a.id === id)?.name ?? id.slice(-8);
}

function describeBand(position: number): DriftThresholdBand | 'baseline' {
  const abs = Math.abs(position);
  if (abs >= DRIFT_THRESHOLD_BECOMING) return 'becoming';
  if (abs >= DRIFT_THRESHOLD_BANNER) return 'banner';
  if (abs >= DRIFT_THRESHOLD_SOFT) return 'soft';
  return 'baseline';
}

interface DriftVisualiserProps {
  archetypeDrift?: readonly ArchetypeDrift[];
  traces: readonly TraceEntry[];
  retinueAgents?: readonly RetinueAgent[];
}

export function DriftVisualiser({ archetypeDrift, traces, retinueAgents }: DriftVisualiserProps) {
  const drifts = archetypeDrift ?? [];

  const recentCrossings = useMemo(() => {
    const out: Array<TraceEntry & DriftThresholdCrossedTrace> = [];
    for (let i = traces.length - 1; i >= 0 && out.length < RECENT_CROSSING_LIMIT; i--) {
      const t = traces[i];
      if (isDriftCrossing(t)) out.push(t);
    }
    return out;
  }, [traces]);

  const SECTION_HEADER: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--accent-gold)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '12px 0 4px',
    borderBottom: '1px solid var(--border-subtle)',
    paddingBottom: '3px',
  };
  const MUTED: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 'var(--text-xs)' };
  const BAR_TRACK: React.CSSProperties = {
    position: 'relative',
    height: '6px',
    background: 'var(--bg-raised)',
    borderRadius: '3px',
    overflow: 'hidden',
  };
  const ROW: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '160px 1fr 60px 30px',
    gap: '8px',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: 'var(--text-xs)',
  };
  const BADGE = (color: string): React.CSSProperties => ({
    background: `color-mix(in srgb, ${color} 14%, transparent)`,
    color,
    borderRadius: '3px',
    padding: '1px 5px',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textAlign: 'center',
  });

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={{ ...MUTED, marginBottom: '6px' }}>
        Threshold reference: ±{DRIFT_THRESHOLD_SOFT.toFixed(2)} soft · ±{DRIFT_THRESHOLD_BANNER.toFixed(2)} banner · ±{DRIFT_THRESHOLD_BECOMING.toFixed(2)} becoming
      </div>

      <div style={SECTION_HEADER}>Per-axis position ({drifts.length})</div>
      {drifts.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No drift recorded yet.</div>
      ) : (
        drifts
          .slice()
          .sort((a, b) => Math.abs(b.toPosition) - Math.abs(a.toPosition))
          .map((d) => {
            const pos = d.toPosition;
            const band = describeBand(pos);
            const bandColor = band === 'baseline' ? 'var(--text-muted)' : THRESHOLD_COLOR[band];
            const fillPercent = Math.min(1, Math.abs(pos)) * 50; // half the track per side
            const fillSide = pos >= 0 ? '50%' : `${50 - fillPercent}%`;
            return (
              <div key={`${d.agentId}:${d.axisId}`} style={ROW}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{resolveAgentName(d.agentId, retinueAgents)}</strong>
                  <span style={{ ...MUTED, marginLeft: '4px' }}>{d.axisId}</span>
                </span>
                <div style={BAR_TRACK} title={`${pos >= 0 ? 'virtue' : 'flaw'} ${pos.toFixed(3)}`}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: fillSide,
                      width: `${fillPercent}%`,
                      height: '100%',
                      background: bandColor,
                    }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', background: 'var(--border-subtle)' }} />
                </div>
                <span style={{ color: bandColor, textAlign: 'right' }}>{pos >= 0 ? '+' : ''}{pos.toFixed(2)}</span>
                <span style={band === 'baseline' ? MUTED : BADGE(bandColor)}>{band === 'baseline' ? '—' : band[0]}</span>
              </div>
            );
          })
      )}

      <div style={SECTION_HEADER}>Recent crossings ({recentCrossings.length})</div>
      {recentCrossings.length === 0 ? (
        <div style={MUTED}>No threshold crossings yet.</div>
      ) : (
        recentCrossings.map((crossing) => {
          const color = THRESHOLD_COLOR[crossing.thresholdCrossed];
          return (
            <div key={crossing.id} style={{ ...ROW, gridTemplateColumns: '40px 1fr 80px 70px' }} title={crossing.summary}>
              <span style={MUTED}>t{crossing.tick}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{resolveAgentName(crossing.agentId, retinueAgents)}</strong>
                <span style={{ ...MUTED, marginLeft: '4px' }}>{crossing.axisId} ({crossing.pole})</span>
              </span>
              <span style={MUTED}>{crossing.fromPosition.toFixed(2)} → {crossing.toPosition.toFixed(2)}</span>
              <span style={BADGE(color)}>{crossing.thresholdCrossed}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

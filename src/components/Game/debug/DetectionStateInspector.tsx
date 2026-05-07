import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type {
  DetectionThresholdCrossedTrace,
  DetectionThresholdBand,
} from '../../../types/traces/encounter-traces';
import type { RegionDetectionState } from '../../../types/gameState';
import {
  DETECTION_THRESHOLD_NOTICE,
  DETECTION_THRESHOLD_TURN,
  DETECTION_THRESHOLD_ENCOUNTER,
  DETECTION_DECAY_RATE_PER_TICK,
} from '../../../data/encounter-experience-constants';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const RECENT_CROSSING_LIMIT = 12;

const THRESHOLD_COLOR: Record<DetectionThresholdBand, string> = {
  notice: '#a08a4a',
  turn: '#d97706',
  encounter: '#b85450',
};

function isDetectionCrossing(t: TraceEntry): t is TraceEntry & DetectionThresholdCrossedTrace {
  return t.category === 'detection_threshold_crossed';
}

function describeBand(pressure: number): DetectionThresholdBand | 'quiet' {
  if (pressure >= DETECTION_THRESHOLD_ENCOUNTER) return 'encounter';
  if (pressure >= DETECTION_THRESHOLD_TURN) return 'turn';
  if (pressure >= DETECTION_THRESHOLD_NOTICE) return 'notice';
  return 'quiet';
}

interface DetectionStateInspectorProps {
  regionalDetectionPressure?: readonly RegionDetectionState[];
  traces: readonly TraceEntry[];
  currentTick: number;
}

export function DetectionStateInspector({
  regionalDetectionPressure,
  traces,
  currentTick,
}: DetectionStateInspectorProps) {
  const regions = regionalDetectionPressure ?? [];

  const recentCrossings = useMemo(() => {
    const out: Array<TraceEntry & DetectionThresholdCrossedTrace> = [];
    for (let i = traces.length - 1; i >= 0 && out.length < RECENT_CROSSING_LIMIT; i--) {
      const t = traces[i];
      if (isDetectionCrossing(t)) out.push(t);
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
  const ROW: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 60px 70px 60px',
    gap: '8px',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: 'var(--text-xs)',
  };
  const BAR_TRACK: React.CSSProperties = {
    position: 'relative',
    height: '5px',
    background: 'var(--bg-raised)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '2px',
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

  const sortedRegions = regions
    .slice()
    .sort((a, b) => b.pressure - a.pressure || a.regionId.localeCompare(b.regionId));

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={{ ...MUTED, marginBottom: '6px' }}>
        Bands: {DETECTION_THRESHOLD_NOTICE.toFixed(2)} notice · {DETECTION_THRESHOLD_TURN.toFixed(2)} turn · {DETECTION_THRESHOLD_ENCOUNTER.toFixed(2)} encounter · decay {DETECTION_DECAY_RATE_PER_TICK.toFixed(3)}/t
      </div>

      <div style={SECTION_HEADER}>Per-region pressure ({sortedRegions.length})</div>
      {sortedRegions.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No regional pressure registered yet.</div>
      ) : (
        sortedRegions.map((region) => {
          const band = describeBand(region.pressure);
          const bandColor = band === 'quiet' ? 'var(--text-muted)' : THRESHOLD_COLOR[band];
          const fillPercent = Math.min(1, region.pressure / DETECTION_THRESHOLD_ENCOUNTER) * 100;
          const ticksAgo = currentTick - region.lastUpdatedTick;
          return (
            <div key={region.regionId}>
              <div style={ROW}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                  {region.regionId}
                </span>
                <span style={{ color: bandColor, textAlign: 'right' }}>{region.pressure.toFixed(3)}</span>
                <span style={MUTED}>updated {ticksAgo}t ago</span>
                <span style={band === 'quiet' ? MUTED : BADGE(bandColor)}>{band}</span>
              </div>
              <div style={BAR_TRACK}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: `${fillPercent}%`, height: '100%', background: bandColor }} />
              </div>
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
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                {crossing.regionId}
              </span>
              <span style={MUTED}>{crossing.fromPressure.toFixed(2)} → {crossing.toPressure.toFixed(2)}</span>
              <span style={BADGE(color)}>{crossing.thresholdCrossed}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

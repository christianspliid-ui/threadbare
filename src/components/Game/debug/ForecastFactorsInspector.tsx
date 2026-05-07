import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type {
  ForecastComputedTrace,
  ForecastTier,
} from '../../../types/traces/encounter-traces';
import {
  FORECAST_TIER_DOOMED_MAX,
  FORECAST_TIER_PERILOUS_MAX,
  FORECAST_TIER_UNCERTAIN_MAX,
  FORECAST_TIER_FAVORABLE_MAX,
  FORECAST_FACTORS_VISIBLE_HOVER_MAX,
} from '../../../data/encounter-experience-constants';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const RECENT_LIMIT = 12;

const TIER_COLOR: Record<ForecastTier, string> = {
  doomed: '#7f1d1d',
  perilous: '#b85450',
  uncertain: '#a08a4a',
  favorable: '#6a9a6e',
  fated: '#10b981',
};

function isForecastComputed(t: TraceEntry): t is TraceEntry & ForecastComputedTrace {
  return t.category === 'forecast_computed';
}

interface ForecastFactorsInspectorProps {
  traces: readonly TraceEntry[];
}

export function ForecastFactorsInspector({ traces }: ForecastFactorsInspectorProps) {
  const recent = useMemo(() => {
    const out: Array<TraceEntry & ForecastComputedTrace> = [];
    for (let i = traces.length - 1; i >= 0 && out.length < RECENT_LIMIT; i--) {
      const t = traces[i];
      if (isForecastComputed(t)) out.push(t);
    }
    return out;
  }, [traces]);

  const latest = recent[0];

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
  const TIER_BADGE = (color: string): React.CSSProperties => ({
    background: `color-mix(in srgb, ${color} 18%, transparent)`,
    color,
    borderRadius: '3px',
    padding: '2px 8px',
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  });
  const FACTOR_PILL = (sign: 'pos' | 'neg' | 'neutral'): React.CSSProperties => {
    const color = sign === 'pos' ? '#6a9a6e' : sign === 'neg' ? '#b85450' : 'var(--text-muted)';
    return {
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      color,
      borderRadius: '3px',
      padding: '1px 5px',
      fontSize: 'var(--text-xs)',
      marginRight: '4px',
      marginBottom: '3px',
      display: 'inline-block',
    };
  };
  const ROW: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 80px 70px',
    gap: '8px',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: 'var(--text-xs)',
  };

  if (!latest) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No forecast_computed traces yet. The current beat&apos;s forecast factors will appear once an encounter beat advances.
        <div style={{ ...MUTED, marginTop: '6px' }}>
          Tier boundaries: {FORECAST_TIER_DOOMED_MAX.toFixed(2)} doomed · {FORECAST_TIER_PERILOUS_MAX.toFixed(2)} perilous · {FORECAST_TIER_UNCERTAIN_MAX.toFixed(2)} uncertain · {FORECAST_TIER_FAVORABLE_MAX.toFixed(2)} favorable · &gt; favorable.max → fated.
        </div>
      </div>
    );
  }

  const visibleModifiers = latest.modifiers.slice(0, FORECAST_FACTORS_VISIBLE_HOVER_MAX);
  const hiddenCount = latest.modifiers.length - visibleModifiers.length;

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={SECTION_HEADER}>Latest forecast · t{latest.tick}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
        <span style={TIER_BADGE(TIER_COLOR[latest.finalTier])}>{latest.finalTier}</span>
        <span style={MUTED}>{latest.encounterId} #{latest.beatIndex}</span>
        <span style={MUTED}>base {latest.baseProbability.toFixed(2)}</span>
      </div>

      <div style={SECTION_HEADER}>Factor strings</div>
      {latest.factors.length === 0 ? (
        <div style={MUTED}>(no narrative factors emitted)</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {latest.factors.map((factor, i) => (
            <span key={`${factor}-${i}`} style={FACTOR_PILL('neutral')}>{factor}</span>
          ))}
        </div>
      )}

      <div style={SECTION_HEADER}>Modifiers ({latest.modifiers.length})</div>
      {visibleModifiers.length === 0 ? (
        <div style={MUTED}>(no modifiers stacked)</div>
      ) : (
        visibleModifiers.map((mod, i) => {
          const sign = mod.delta > 0 ? 'pos' : mod.delta < 0 ? 'neg' : 'neutral';
          return (
            <div key={`${mod.source}-${i}`} style={{ ...ROW, gridTemplateColumns: '1fr 80px' }}>
              <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.source}</span>
              <span style={FACTOR_PILL(sign)}>
                {mod.delta > 0 ? '+' : ''}{mod.delta.toFixed(2)}
              </span>
            </div>
          );
        })
      )}
      {hiddenCount > 0 && <div style={MUTED}>+{hiddenCount} more (cap {FORECAST_FACTORS_VISIBLE_HOVER_MAX})</div>}

      <div style={SECTION_HEADER}>Recent forecasts ({recent.length})</div>
      <div style={{ ...ROW, color: 'var(--accent-gold)', fontWeight: 600, borderBottom: '1px dotted var(--border-subtle)', paddingBottom: '4px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>tick</span>
        <span>encounter / beat</span>
        <span>base</span>
        <span>tier</span>
      </div>
      {recent.map((trace) => (
        <div key={trace.id} style={ROW} title={trace.summary}>
          <span style={MUTED}>t{trace.tick}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trace.encounterId} <span style={MUTED}>#{trace.beatIndex}</span>
          </span>
          <span style={MUTED}>{trace.baseProbability.toFixed(2)}</span>
          <span style={TIER_BADGE(TIER_COLOR[trace.finalTier])}>{trace.finalTier}</span>
        </div>
      ))}
    </div>
  );
}

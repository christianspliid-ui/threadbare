import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type { RetinueAgent } from '../../../engine/retinue';
import type {
  ChoiceResolvedTrace,
  EncounterOutcomeBand,
  EncounterChoiceCost,
} from '../../../types/traces/encounter-traces';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const RECENT_LIMIT = 25;

const COST_LABEL: Record<EncounterChoiceCost, string> = {
  small_breath: 'small',
  fuller_breath: 'fuller',
  deep_draught: 'deep',
};

const OUTCOME_COLOR: Record<EncounterOutcomeBand, string> = {
  critical_fail: '#b85450',
  fail: '#d97706',
  fail_forward: '#a08a4a',
  success: '#6a9a6e',
  critical_success: '#10b981',
};

function isChoiceResolved(t: TraceEntry): t is TraceEntry & ChoiceResolvedTrace {
  return t.category === 'choice_resolved';
}

function resolveAgentName(id: string, retinueAgents?: readonly RetinueAgent[]): string {
  return retinueAgents?.find((a) => a.id === id)?.name ?? id.slice(-8);
}

interface EncounterChoiceInspectorProps {
  traces: readonly TraceEntry[];
  retinueAgents?: readonly RetinueAgent[];
}

export function EncounterChoiceInspector({ traces, retinueAgents }: EncounterChoiceInspectorProps) {
  const recent = useMemo(() => {
    const out: Array<TraceEntry & ChoiceResolvedTrace> = [];
    for (let i = traces.length - 1; i >= 0 && out.length < RECENT_LIMIT; i--) {
      const t = traces[i];
      if (isChoiceResolved(t)) out.push(t);
    }
    return out;
  }, [traces]);

  if (recent.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No choices resolved yet. Commit a divine choice in an encounter to populate this view.</div>;
  }

  const ROW: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 60px 70px 60px',
    gap: '6px',
    padding: '3px 0',
    fontSize: 'var(--text-xs)',
    alignItems: 'center',
  };
  const HEADER_ROW: React.CSSProperties = {
    ...ROW,
    color: 'var(--accent-gold)',
    fontWeight: 600,
    borderBottom: '1px dotted var(--border-subtle)',
    paddingBottom: '4px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };
  const MUTED: React.CSSProperties = { color: 'var(--text-muted)' };
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
      <div style={{ ...MUTED, marginBottom: '8px', fontSize: 'var(--text-xs)' }}>
        {recent.length} recent commit{recent.length === 1 ? '' : 's'} · choice_resolved trace
      </div>
      <div style={HEADER_ROW}>
        <span>tick</span>
        <span>agent / encounter</span>
        <span>cost</span>
        <span>outcome</span>
        <span>roll</span>
      </div>
      {recent.map((trace) => (
        <div key={trace.id} style={ROW} title={trace.summary}>
          <span style={MUTED}>t{trace.tick}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{resolveAgentName(trace.agentId, retinueAgents)}</strong>
            <span style={{ ...MUTED, marginLeft: '4px' }}>· {trace.encounterId} #{trace.beatIndex}</span>
            <span style={{ ...MUTED, marginLeft: '4px' }}>({trace.reach}/{trace.moralAxisPole === 'virtue' ? '+' : '−'}{trace.driftMagnitude.toFixed(2)})</span>
          </span>
          <span style={BADGE('var(--text-secondary)')}>{COST_LABEL[trace.cost]}</span>
          <span style={BADGE(OUTCOME_COLOR[trace.outcomeBand])}>{trace.outcomeBand.replace('_', ' ')}</span>
          <span style={MUTED}>
            {trace.rolledD100}/{Math.round(trace.effectiveProbability * 100)}
          </span>
        </div>
      ))}
    </div>
  );
}

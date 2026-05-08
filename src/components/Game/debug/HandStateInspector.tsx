import React, { useMemo } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type { HandFilteredTrace } from '../../../types/traces/encounter-traces';
import { HAND_VISIBLE_CARDS_DEFAULT } from '../../../data/encounter-experience-constants';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const RECENT_LIMIT = 20;

function isHandFiltered(t: TraceEntry): t is TraceEntry & HandFilteredTrace {
  return t.category === 'hand_filtered';
}

interface HandStateInspectorProps {
  traces: readonly TraceEntry[];
}

export function HandStateInspector({ traces }: HandStateInspectorProps) {
  const recent = useMemo(() => {
    const out: Array<TraceEntry & HandFilteredTrace> = [];
    for (let i = traces.length - 1; i >= 0 && out.length < RECENT_LIMIT; i--) {
      const t = traces[i];
      if (isHandFiltered(t)) out.push(t);
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
  const PARTITION_BAR: React.CSSProperties = {
    display: 'flex',
    height: '8px',
    borderRadius: '3px',
    overflow: 'hidden',
    background: 'var(--bg-raised)',
    marginBottom: '6px',
  };
  const ROW: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 50px 50px 50px 60px',
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

  if (!latest) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No hand_filtered traces yet. Open an encounter to populate this view.
        <div style={{ ...MUTED, marginTop: '6px' }}>
          Default visible cards: {HAND_VISIBLE_CARDS_DEFAULT}.
        </div>
      </div>
    );
  }

  const total = latest.totalDeckSize;
  const playablePct = total > 0 ? (latest.playableCount / total) * 100 : 0;
  const dimmedPct = total > 0 ? (latest.dimmedCount / total) * 100 : 0;
  const hiddenPct = total > 0 ? (latest.hiddenCount / total) * 100 : 0;

  return (
    <div style={{ padding: '8px 12px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={SECTION_HEADER}>Latest partition · t{latest.tick} · {latest.encounterId}</div>
      <div style={PARTITION_BAR} title={`playable ${latest.playableCount} / dimmed ${latest.dimmedCount} / hidden ${latest.hiddenCount}`}>
        <div style={{ flexBasis: `${playablePct}%`, background: '#6a9a6e' }} />
        <div style={{ flexBasis: `${dimmedPct}%`, background: '#a08a4a' }} />
        <div style={{ flexBasis: `${hiddenPct}%`, background: 'var(--bg-raised)' }} />
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span><strong style={{ color: '#6a9a6e' }}>{latest.playableCount}</strong> <span style={MUTED}>playable</span></span>
        <span><strong style={{ color: '#a08a4a' }}>{latest.dimmedCount}</strong> <span style={MUTED}>dimmed</span></span>
        <span><strong style={{ color: 'var(--text-muted)' }}>{latest.hiddenCount}</strong> <span style={MUTED}>hidden</span></span>
        <span><strong>{total}</strong> <span style={MUTED}>deck</span></span>
        {latest.rarePulses.length > 0 && (
          <span><strong style={{ color: 'var(--accent-gold)' }}>{latest.rarePulses.length}</strong> <span style={MUTED}>rare pulses</span></span>
        )}
      </div>
      {latest.rarePulses.length > 0 && (
        <div style={{ ...MUTED, marginBottom: '10px' }}>
          rare pulses: {latest.rarePulses.join(', ')}
        </div>
      )}

      <div style={SECTION_HEADER}>Recent filter ticks ({recent.length})</div>
      <div style={HEADER_ROW}>
        <span>tick</span>
        <span>encounter</span>
        <span>play</span>
        <span>dim</span>
        <span>hide</span>
        <span>deck</span>
      </div>
      {recent.map((trace) => (
        <div key={trace.id} style={ROW} title={trace.summary}>
          <span style={MUTED}>t{trace.tick}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trace.encounterId}
            {trace.rarePulses.length > 0 && (
              <span style={{ color: 'var(--accent-gold)', marginLeft: '6px' }}>★{trace.rarePulses.length}</span>
            )}
          </span>
          <span style={{ color: '#6a9a6e' }}>{trace.playableCount}</span>
          <span style={{ color: '#a08a4a' }}>{trace.dimmedCount}</span>
          <span style={MUTED}>{trace.hiddenCount}</span>
          <span style={MUTED}>{trace.totalDeckSize}</span>
        </div>
      ))}
    </div>
  );
}

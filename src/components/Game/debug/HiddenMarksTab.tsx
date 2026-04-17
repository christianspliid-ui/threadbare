import React from 'react';
import type { HiddenMark } from '../../../types/unifiedAction';
import type { RetinueAgent } from '../../../engine/retinue';
import { MARK_DECAY_FLOOR } from '../../../engine/hiddenMarks';
import { TRACE_CATEGORY_COLORS } from '../../../data/uiColorPalette';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface HiddenMarksTabProps {
  marks: readonly HiddenMark[];
  currentTick: number;
  focusedAgentId?: string;
  retinueAgents?: readonly RetinueAgent[];
}

function resolveAgentName(id: string, retinueAgents?: readonly RetinueAgent[]): string {
  return retinueAgents?.find(a => a.id === id)?.name ?? `${id.slice(-8)} (unresolved)`;
}

function truncateId(id: string): string {
  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

const SH: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '4px', marginTop: '10px',
};

const ROW: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-primary)',
  borderLeft: '2px solid var(--border-subtle)',
  paddingLeft: '6px', marginBottom: '6px',
};

const MONO: React.CSSProperties = { fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '11px' };

function MarkRow({ mark, currentTick }: { mark: HiddenMark; currentTick: number }) {
  const clampedSeverity = Math.max(0, Math.min(1, isNaN(mark.severity) ? 0 : mark.severity));
  const nearDecay = clampedSeverity < MARK_DECAY_FLOOR * 3; // warn when approaching floor
  const ticksAgo = currentTick - mark.placedTick;
  const categoryColor = TRACE_CATEGORY_COLORS['hidden_mark_placed'] ?? '#f97316';

  return (
    <div style={{ ...ROW, borderLeftColor: nearDecay ? '#f97316' : 'var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11px', color: categoryColor,
            background: `color-mix(in srgb, ${categoryColor} 10%, transparent)`,
            padding: '1px 4px', borderRadius: '2px', flexShrink: 0,
          }}
        >
          {mark.category}
        </span>
        <span style={{ flex: 1, fontWeight: 500 }}>{mark.label}</span>
        {nearDecay && <span style={{ color: '#f97316', fontSize: '10px' }}>⚠ near decay</span>}
      </div>

      {/* Severity bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
        <div style={{ flex: 1, height: '4px', background: 'var(--bg-raised)', borderRadius: '2px' }}>
          <div style={{
            width: `${clampedSeverity * 100}%`, height: '100%',
            background: nearDecay ? '#f97316' : '#d4a574', borderRadius: '2px',
          }} />
        </div>
        <span style={{ ...MONO, flexShrink: 0 }}>{clampedSeverity.toFixed(2)}</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
        <span style={MONO} title={mark.markId}>{truncateId(mark.markId)}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          tick {mark.placedTick} ({ticksAgo}t ago)
        </span>
        <span style={MONO} title={mark.sourceEncounterId}>src: {truncateId(mark.sourceEncounterId)}</span>
      </div>

      {mark.revealFamilies && mark.revealFamilies.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
          {mark.revealFamilies.map(f => (
            <span key={f} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-raised)', padding: '1px 4px', borderRadius: '2px' }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function HiddenMarksTab({ marks, currentTick, focusedAgentId, retinueAgents }: HiddenMarksTabProps) {
  if (marks.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No hidden marks placed yet.</div>;
  }

  const focused = focusedAgentId ? marks.filter(m => m.targetAgentId === focusedAgentId) : [];
  const others = focusedAgentId ? marks.filter(m => m.targetAgentId !== focusedAgentId) : marks;

  // Group non-focused marks by targetAgentId
  const byAgent = new Map<string, HiddenMark[]>();
  for (const m of others) {
    const group = byAgent.get(m.targetAgentId) ?? [];
    group.push(m);
    byAgent.set(m.targetAgentId, group);
  }

  return (
    <div style={{ padding: '8px 10px' }}>
      {focusedAgentId && (
        <>
          <div style={SH}>
            {resolveAgentName(focusedAgentId, retinueAgents)} — {focused.length} mark{focused.length !== 1 ? 's' : ''}
          </div>
          {focused.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>No marks on this agent.</div>
          ) : (
            focused
              .slice()
              .sort((a, b) => b.placedTick - a.placedTick)
              .map(m => <MarkRow key={m.markId} mark={m} currentTick={currentTick} />)
          )}
          {byAgent.size > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
              {marks.length - focused.length} mark{marks.length - focused.length !== 1 ? 's' : ''} on other agents
            </div>
          )}
        </>
      )}

      {!focusedAgentId && Array.from(byAgent.entries()).map(([agentId, agentMarks]) => (
        <div key={agentId}>
          <div style={SH}>
            {resolveAgentName(agentId, retinueAgents)} — {agentMarks.length} mark{agentMarks.length !== 1 ? 's' : ''}
          </div>
          {agentMarks
            .slice()
            .sort((a, b) => b.placedTick - a.placedTick)
            .map(m => <MarkRow key={m.markId} mark={m} currentTick={currentTick} />)}
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import type { FlipTableRuntimeState } from '../../../types/contentShells';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface ShellsDebugTabProps {
  flipTableStates?: ReadonlyMap<string, FlipTableRuntimeState>;
  currentTick: number;
  focusedAgentId?: string;
}

const SH: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '4px', marginTop: '10px',
};

const ROW: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
  borderLeft: '2px solid var(--border-subtle)',
  paddingLeft: '6px', marginBottom: '6px',
};

const MONO: React.CSSProperties = { fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' };

const STATE_COLORS: Record<string, string> = {
  front: '#94a3b8',
  flipped: '#f59e0b',
  revealed: '#22c55e',
};

function FlipTableRow({ entry, currentTick }: { entry: FlipTableRuntimeState; currentTick: number }) {
  const stateColor = STATE_COLORS[entry.state] ?? '#94a3b8';
  const ticksAgo = currentTick - entry.lastUpdatedTick;

  return (
    <div style={{ ...ROW, borderLeftColor: stateColor }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 'var(--text-xs)', color: stateColor,
          background: `color-mix(in srgb, ${stateColor} 15%, transparent)`,
          padding: '1px 4px', borderRadius: '2px', flexShrink: 0,
        }}>
          {entry.state}
        </span>
        <span style={{ flex: 1, fontWeight: 500 }}>
          {entry.flipId}
        </span>
        {entry.revealedVariantKey && (
          <span style={{ color: '#a3e635', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            → {entry.revealedVariantKey}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
        <span style={MONO} title={entry.templateId}>tpl: {entry.templateId.slice(-16)}</span>
        <span style={MONO} title={entry.ownerActorId}>actor: {entry.ownerActorId.slice(-8)}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          t{entry.lastUpdatedTick} ({ticksAgo}t ago)
        </span>
      </div>
    </div>
  );
}

export function ShellsDebugTab({ flipTableStates, currentTick, focusedAgentId }: ShellsDebugTabProps) {
  const allEntries = Array.from(flipTableStates?.values() ?? []);

  const focused = focusedAgentId
    ? allEntries.filter(e => e.ownerActorId === focusedAgentId)
    : allEntries;
  const others = focusedAgentId
    ? allEntries.filter(e => e.ownerActorId !== focusedAgentId)
    : [];

  if (allEntries.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No active flip table shells. Trigger a step_outcome on a template with flipTables to populate.</div>;
  }

  const stateCount = { front: 0, flipped: 0, revealed: 0 };
  for (const e of allEntries) {
    if (e.state in stateCount) stateCount[e.state as keyof typeof stateCount]++;
  }

  return (
    <div style={{ padding: '8px 10px' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {Object.entries(stateCount).map(([state, count]) => (
          <span key={state} style={{
            fontSize: 'var(--text-xs)', padding: '2px 6px', borderRadius: '3px',
            color: STATE_COLORS[state] ?? '#94a3b8',
            background: `color-mix(in srgb, ${STATE_COLORS[state] ?? '#94a3b8'} 12%, transparent)`,
          }}>
            {state}: {count}
          </span>
        ))}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {allEntries.length} total
        </span>
      </div>

      {focusedAgentId && (
        <>
          <div style={SH}>Focused agent — {focused.length} shell{focused.length !== 1 ? 's' : ''}</div>
          {focused.length === 0
            ? <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>No shells for this agent.</div>
            : focused.sort((a, b) => b.lastUpdatedTick - a.lastUpdatedTick).map(e => (
              <FlipTableRow key={e.runtimeId} entry={e} currentTick={currentTick} />
            ))
          }
          {others.length > 0 && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
              {others.length} shell{others.length !== 1 ? 's' : ''} on other actors
            </div>
          )}
        </>
      )}

      {!focusedAgentId && (
        <>
          <div style={SH}>All flip table shells</div>
          {allEntries
            .slice()
            .sort((a, b) => b.lastUpdatedTick - a.lastUpdatedTick)
            .map(e => <FlipTableRow key={e.runtimeId} entry={e} currentTick={currentTick} />)
          }
        </>
      )}
    </div>
  );
}

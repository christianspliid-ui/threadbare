/**
 * RevelationLogTab — debug panel sub-tab showing chronological revelation events.
 *
 * Displays agent_revelation and interaction_depth trace entries in reverse
 * chronological order so the most recent revelations appear at the top.
 * Each entry shows: tick, agent ID (truncated), facet type, facet ID, and source.
 *
 * Lazy-renders: only processes traces when the tab is visible (mounted).
 */

import React, { useMemo } from 'react';
import type { TraceEntry, RevelationTrace, InteractionDepthTrace } from '../../../types/trace';
import type { AgentKnowledge } from '../../../types/agentKnowledge';

// ─── Props ────────────────────────────────────────────────────────

interface RevelationLogTabProps {
  traces: TraceEntry[];
  agentKnowledge: Map<string, AgentKnowledge>;
}

// ─── Styles ───────────────────────────────────────────────────────

const CONTAINER_STYLE: React.CSSProperties = {
  padding: '8px',
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const SCROLL_AREA_STYLE: React.CSSProperties = {
  maxHeight: '100%',
  overflowY: 'auto',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '12px',
  opacity: 0.6,
};

const ENTRY_STYLE: React.CSSProperties = {
  marginBottom: '4px',
  padding: '6px 8px',
  borderRadius: '3px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
};

const TICK_STYLE: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '10px',
  color: 'var(--text-muted)',
  marginRight: '6px',
};

const FACET_TYPE_COLORS: Record<string, string> = {
  domain:        '#60a5fa',  // blue
  value:         '#c084fc',  // purple
  bond:          '#4ade80',  // green
  ambition:      '#fb923c',  // orange
  disposition:   '#f87171',  // red
  possession:    '#fbbf24',  // amber
  power:         '#e879f9',  // fuchsia
  condition:     '#f43f5e',  // rose
  agreement:     '#34d399',  // emerald
  threat:        '#ef4444',  // red-500
  chronicle_event: '#94a3b8', // slate
};

const SOURCE_ABBREV: Record<string, string> = {
  encounter_observation: 'enc',
  divine_action:         'divine',
  social_gossip:         'gossip',
  faction_intel:         'faction',
  co_location:           'coloc',
  public_event:          'pub',
  dilemma_witness:       'dilemma',
  first_sighting:        'first',
  power_use_witnessed:   'power',
  agreement_witnessed:   'agree',
};

// ─── Component ────────────────────────────────────────────────────

export function RevelationLogTab({ traces, agentKnowledge: _agentKnowledge }: RevelationLogTabProps) {
  // Filter to revelation and interaction_depth categories, reverse chrono
  const revelationTraces = useMemo(() => {
    return [...traces]
      .filter(t => t.category === 'agent_revelation' || t.category === 'interaction_depth')
      .reverse();
  }, [traces]);

  if (revelationTraces.length === 0) {
    return (
      <div style={CONTAINER_STYLE}>
        <div style={EMPTY_STYLE}>No revelations recorded yet.</div>
      </div>
    );
  }

  return (
    <div style={CONTAINER_STYLE}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {revelationTraces.length} revelation entries
      </div>
      <div style={SCROLL_AREA_STYLE}>
        {revelationTraces.map(trace => (
          <div key={trace.id} style={ENTRY_STYLE}>
            {trace.category === 'agent_revelation' ? (
              <RevelationEntry trace={trace as RevelationTrace} />
            ) : (
              <DepthEntry trace={trace as InteractionDepthTrace} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function RevelationEntry({ trace }: { trace: RevelationTrace }) {
  const facetColor = FACET_TYPE_COLORS[trace.facetType] ?? '#94a3b8';
  const agentShort = trace.agentId.length > 12
    ? `${trace.agentId.slice(0, 12)}…`
    : trace.agentId;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)' }}>
      <span style={TICK_STYLE}>t{trace.tick}</span>
      <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{agentShort}</span>
      <span style={{ color: facetColor, fontWeight: 600, marginRight: '4px' }}>
        [{trace.facetType}]
      </span>
      <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>
        {trace.facetId.length > 20 ? `${trace.facetId.slice(0, 20)}…` : trace.facetId}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
        via {SOURCE_ABBREV[trace.source] ?? trace.source}
      </span>
    </div>
  );
}

function DepthEntry({ trace }: { trace: InteractionDepthTrace }) {
  const agentShort = trace.agentId.length > 12
    ? `${trace.agentId.slice(0, 12)}…`
    : trace.agentId;
  const delta = trace.depthAfter - trace.depthBefore;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
      <span style={TICK_STYLE}>t{trace.tick}</span>
      <span style={{ marginRight: '4px' }}>{agentShort}</span>
      <span style={{ color: '#60a5fa' }}>depth +{delta.toFixed(2)}</span>
      <span style={{ marginLeft: '4px', fontSize: '10px' }}>
        ({trace.source})
      </span>
    </div>
  );
}

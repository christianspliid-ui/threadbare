import React, { useState, useCallback } from 'react';
import type { TraceEntry } from '../../../types/trace';
import type { WorldGraph } from '../../../engine/graph';
import { DecisionBreakdown } from './DecisionBreakdown';
import { RelationshipGraph } from './RelationshipGraph';

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: '13px',
};

const OVERLAY_TOGGLE_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  fontSize: '11px',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  userSelect: 'none',
};

const SOCIAL_SECTION_HEADER_STYLE: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--accent-gold)',
  padding: '8px 0 4px',
  borderBottom: '1px solid var(--border-subtle)',
  marginBottom: '8px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export interface SocialTabContentProps {
  followAgentId?: string;
  graph?: WorldGraph;
  traces: TraceEntry[];
  showBonds: boolean;
  showDecisionVectors: boolean;
  onToggleBonds: (enabled: boolean) => void;
  onToggleDecisionVectors: (enabled: boolean) => void;
}

export const SocialTabContent = React.memo(function SocialTabContent({
  followAgentId,
  graph,
  traces,
  showBonds,
  showDecisionVectors,
  onToggleBonds,
  onToggleDecisionVectors,
}: SocialTabContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['decision', 'relationships', 'overlays']));

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  if (!followAgentId) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        Select an agent to view social debug info.
      </div>
    );
  }

  return (
    <div data-testid="social-tab-content">
      <div style={SOCIAL_SECTION_HEADER_STYLE} onClick={() => toggleSection('overlays')}>
        <span>Map Overlays</span>
        <span>{expandedSections.has('overlays') ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expandedSections.has('overlays') && (
        <div style={{ marginBottom: '12px' }}>
          <label style={OVERLAY_TOGGLE_STYLE}>
            <input
              type="checkbox"
              checked={showBonds}
              onChange={(e) => onToggleBonds(e.target.checked)}
            />
            Bond Lines (relates_to edges)
          </label>
          <label style={OVERLAY_TOGGLE_STYLE}>
            <input
              type="checkbox"
              checked={showDecisionVectors}
              onChange={(e) => onToggleDecisionVectors(e.target.checked)}
            />
            Decision Vectors (movement targets)
          </label>
        </div>
      )}

      <div style={SOCIAL_SECTION_HEADER_STYLE} onClick={() => toggleSection('decision')}>
        <span>Decision Breakdown</span>
        <span>{expandedSections.has('decision') ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expandedSections.has('decision') && (
        <DecisionBreakdown agentId={followAgentId} traces={traces} />
      )}

      <div style={SOCIAL_SECTION_HEADER_STYLE} onClick={() => toggleSection('relationships')}>
        <span>Relationships</span>
        <span>{expandedSections.has('relationships') ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expandedSections.has('relationships') && graph && (
        <RelationshipGraph agentId={followAgentId} graph={graph} />
      )}
      {expandedSections.has('relationships') && !graph && (
        <div style={EMPTY_STATE_STYLE}>No graph available.</div>
      )}
    </div>
  );
});

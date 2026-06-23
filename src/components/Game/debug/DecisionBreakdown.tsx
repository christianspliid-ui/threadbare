import React, { useMemo } from 'react';
import type { TraceEntry, FilterPipelineTrace, ScoringTrace, EncounterAwarenessTrace } from '../../../types/trace';

// ─── Constants ──────────────────────────────────────────────────
const DECISION_STATES = ['idle', 'moving', 'in-encounter', 'occupied'] as const;

/** Maximum number of top candidates displayed in the scoring breakdown */
const MAX_TOP_CANDIDATES = 5;

// ─── Styles ─────────────────────────────────────────────────────
const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '12px',
  padding: '8px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  fontSize: 'var(--text-xs)',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
};

const HEADING_STYLE: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--accent-gold)',
  marginBottom: '6px',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
  gap: '8px',
};

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
  minWidth: '100px',
};

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  textAlign: 'right' as const,
  flex: 1,
};

const SURFACE_AXIS_LABELS: Record<'reachPrimary' | 'socialRole' | 'sublocationTypeId', string> = {
  reachPrimary: 'Reach',
  socialRole: 'Role',
  sublocationTypeId: 'Sublocation',
};

const BAR_BG_STYLE: React.CSSProperties = {
  width: '100%',
  height: '4px',
  background: 'var(--border-subtle)',
  borderRadius: '2px',
  overflow: 'hidden',
  marginTop: '2px',
};

// ─── Props ──────────────────────────────────────────────────────

export interface DecisionBreakdownProps {
  agentId: string;
  traces: TraceEntry[];
}

// ─── Component ──────────────────────────────────────────────────

export const DecisionBreakdown = React.memo(function DecisionBreakdown({
  agentId,
  traces,
}: DecisionBreakdownProps) {
  // Filter traces for this agent
  const { latestFilter, latestScoring, awarenessTraces } = useMemo(() => {
    let filter: FilterPipelineTrace | null = null;
    let scoring: ScoringTrace | null = null;
    const awareness: EncounterAwarenessTrace[] = [];

    // Walk backwards to find latest of each type
    for (let i = traces.length - 1; i >= 0; i--) {
      const t = traces[i];
      if (t.agentId !== agentId) continue;

      if (!filter && t.category === 'encounter_filter') {
        filter = t as FilterPipelineTrace;
      }
      if (!scoring && t.category === 'encounter_scoring') {
        scoring = t as ScoringTrace;
      }
      if (t.category === 'encounter_awareness') {
        awareness.push(t as EncounterAwarenessTrace);
      }

      // Stop once we have all three types
      if (filter && scoring && awareness.length > 0) break;
    }

    return {
      latestFilter: filter,
      latestScoring: scoring,
      awarenessTraces: awareness,
    };
  }, [agentId, traces]);

  // Determine decision state from latest scoring trace
  const decisionState = useMemo(() => {
    if (!latestScoring) return 'idle';
    return latestScoring.action ?? 'idle';
  }, [latestScoring]);

  if (!latestFilter && !latestScoring && awarenessTraces.length === 0) {
    return (
      <div data-testid="decision-breakdown" style={{ ...SECTION_STYLE, opacity: 0.5, textAlign: 'center' }}>
        No decision traces for this agent yet.
      </div>
    );
  }

  return (
    <div data-testid="decision-breakdown">
      {/* Decision State */}
      <div style={SECTION_STYLE}>
        <div style={HEADING_STYLE}>Decision State</div>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Status</span>
          <span style={VALUE_STYLE} data-testid="decision-state">{decisionState}</span>
        </div>
        {latestScoring?.selectedTemplateId && (
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>Selected</span>
            <span style={VALUE_STYLE}>{latestScoring.selectedTemplateId}</span>
          </div>
        )}
        {latestScoring?.selectedLocationId && (
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>Target</span>
            <span style={VALUE_STYLE}>{latestScoring.selectedLocationId}</span>
          </div>
        )}
        {latestScoring?.selectedSurfaceKey && (
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>Surface key</span>
            <span style={{ ...VALUE_STYLE, wordBreak: 'break-all', fontSize: 'var(--text-xs)' }} data-testid="surface-key">{latestScoring.selectedSurfaceKey}</span>
          </div>
        )}
        {latestScoring?.selectedSurfaceAxes && Object.keys(latestScoring.selectedSurfaceAxes).length > 0 && (
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>Surface axes</span>
            <span style={{ ...VALUE_STYLE, fontSize: 'var(--text-xs)' }} data-testid="surface-axes">
              {formatSurfaceAxes(latestScoring.selectedSurfaceAxes)}
            </span>
          </div>
        )}
        {latestScoring?.selectedNoveltyMultiplier !== undefined && latestScoring.selectedNoveltyMultiplier !== null && (
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>Novelty ×</span>
            <span style={VALUE_STYLE}>{latestScoring.selectedNoveltyMultiplier.toFixed(3)}</span>
          </div>
        )}
      </div>

      {/* Filter Pipeline Breakdown */}
      {latestFilter && (
        <div style={SECTION_STYLE}>
          <div style={HEADING_STYLE}>Filter Pipeline (tick {latestFilter.tick})</div>
          <FilterPipelineRow label="Cache size" value={latestFilter.cacheSize} max={latestFilter.cacheSize} />
          <FilterPipelineRow label="After awareness" value={latestFilter.afterAwareness} max={latestFilter.cacheSize} />
          <FilterPipelineRow label="After visibility" value={latestFilter.afterVisibility} max={latestFilter.cacheSize} />
          <FilterPipelineRow label="After prereqs" value={latestFilter.afterPrerequisites} max={latestFilter.cacheSize} />
          <FilterPipelineRow label="After threat" value={latestFilter.afterThreat} max={latestFilter.cacheSize} />
          <FilterPipelineRow label="After cap" value={latestFilter.afterCap} max={latestFilter.cacheSize} />
        </div>
      )}

      {/* Top Candidates */}
      {latestScoring && latestScoring.topCandidates.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={HEADING_STYLE}>Top {Math.min(latestScoring.topCandidates.length, MAX_TOP_CANDIDATES)} Candidates</div>
          {latestScoring.topCandidates.slice(0, MAX_TOP_CANDIDATES).map((c, idx) => (
            <div key={idx} style={{ marginBottom: '6px', padding: '4px', background: idx === 0 ? 'var(--bg-hover)' : 'transparent', borderRadius: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ fontWeight: idx === 0 ? 600 : 400 }}>
                  {idx + 1}. {c.templateId}
                </span>
                <span style={{ color: 'var(--accent-gold)' }}>
                  {c.finalScore.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                {c.isLocal ? 'local' : `${c.travelCost} hops`}
                {' | '}val/t: {c.valuePerTick.toFixed(2)}
                {' | '}desire: {c.desireMultiplier.toFixed(1)}
                {' | '}prob: {c.completionProb.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Awareness Range per Reach */}
      {awarenessTraces.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={HEADING_STYLE}>Awareness Range</div>
          {awarenessTraces.map((a, idx) => (
            <div key={idx} style={ROW_STYLE}>
              <span style={LABEL_STYLE}>{a.reach}</span>
              <span style={VALUE_STYLE}>
                {a.hopsGranted} hops ({a.encountersVisible} visible)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Sub-components ─────────────────────────────────────────────

function FilterPipelineRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={ROW_STYLE}>
        <span style={LABEL_STYLE}>{label}</span>
        <span style={VALUE_STYLE}>{value}</span>
      </div>
      <div style={BAR_BG_STYLE}>
        <div
          data-testid={`pipeline-bar-${label.replace(/\s+/g, '-').toLowerCase()}`}
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--accent-gold)',
            borderRadius: '2px',
            transition: 'width 300ms ease-out',
          }}
        />
      </div>
    </div>
  );
}

function formatSurfaceAxes(axes: Partial<Record<'reachPrimary' | 'socialRole' | 'sublocationTypeId', string>>) {
  return Object.entries(axes)
    .map(([axis, value]) => `${SURFACE_AXIS_LABELS[axis as keyof typeof SURFACE_AXIS_LABELS]}=${value}`)
    .join(' | ');
}

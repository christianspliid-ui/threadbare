import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TraceEntry, TraceCategory, ActionSelectionTrace, NarrativeGenerationTrace, ContextHarvestTrace, DilemmaResolutionTrace, TickSummaryTrace, EncounterResolutionTrace, FamiliarityChangeTrace, InterventionEffectTrace } from '../../types/trace';
import { TRACE_CATEGORIES } from '../../types/trace';
import { getTraces, getTracesForAgent } from '../../engine/traceBuffer';
import { TRACE_CATEGORY_COLORS } from '../../data/uiColorPalette';

interface DebugPanelProps {
  currentTick: number;
  followAgentId?: string;
  onClose?: () => void;
}

type ViewMode = 'feed' | 'agent-follow' | 'tick-inspector';

const PANEL_STYLES = {
  background: 'var(--bg-deep)',
  borderColor: 'var(--border-subtle)',
  textColor: 'var(--text-primary)',
  tickColor: 'var(--text-muted)',
  detailBg: 'var(--bg-raised)',
  detailBorder: 'var(--border-subtle)',
  width: 480,
  zIndex: 45,
} as const;

const CONTAINER_STYLE: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  bottom: 0,
  width: PANEL_STYLES.width,
  background: PANEL_STYLES.background,
  borderLeft: `1px solid ${PANEL_STYLES.borderColor}`,
  zIndex: PANEL_STYLES.zIndex,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, sans-serif',
};

const HEADER_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  color: PANEL_STYLES.textColor,
  fontSize: '13px',
};

const TAB_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  padding: '8px 12px',
  background: 'var(--bg-abyss)',
};

const TAB_BUTTON_BASE: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  background: 'transparent',
  color: PANEL_STYLES.textColor,
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 500,
  transition: 'all 200ms ease-out',
};

const getTabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  ...TAB_BUTTON_BASE,
  borderBottom: isActive ? `2px solid ${TRACE_CATEGORY_COLORS.action_selection}` : 'none',
  color: isActive ? 'var(--accent-gold)' : PANEL_STYLES.textColor,
  opacity: isActive ? 1 : 0.6,
});

const FILTER_AREA_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${PANEL_STYLES.borderColor}`,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  fontSize: '11px',
};

const CHECKBOX_LABEL_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: PANEL_STYLES.textColor,
  cursor: 'pointer',
  userSelect: 'none',
};

const SCROLL_AREA_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '8px',
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: PANEL_STYLES.textColor,
  opacity: 0.4,
  fontSize: '13px',
};

const TRACE_ENTRY_STYLE: React.CSSProperties = {
  marginBottom: '8px',
  border: `1px solid ${PANEL_STYLES.detailBorder}`,
  borderRadius: '4px',
  background: PANEL_STYLES.detailBg,
  cursor: 'pointer',
  transition: 'all 200ms ease-out',
};

const TRACE_ENTRY_HOVER_STYLE: React.CSSProperties = {
  ...TRACE_ENTRY_STYLE,
  background: 'var(--bg-hover)',
  borderColor: 'var(--border-medium)',
};

const TRACE_HEADER_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
};

const BADGE_BASE_STYLE: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

const getBadgeStyle = (category: string): React.CSSProperties => ({
  ...BADGE_BASE_STYLE,
  background: TRACE_CATEGORY_COLORS[category] || '#666',
  color: '#000',
});

const TICK_NUMBER_STYLE: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '12px',
  color: PANEL_STYLES.tickColor,
  marginLeft: 'auto',
};

const DETAIL_AREA_STYLE: React.CSSProperties = {
  padding: '12px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: PANEL_STYLES.textColor,
  lineHeight: 1.5,
};

const DETAIL_ROW_STYLE: React.CSSProperties = {
  marginBottom: '6px',
  display: 'flex',
  gap: '8px',
};

const DETAIL_LABEL_STYLE: React.CSSProperties = {
  color: TRACE_CATEGORY_COLORS.narrative_generation,
  minWidth: '120px',
  fontWeight: 500,
};

const DETAIL_VALUE_STYLE: React.CSSProperties = {
  color: PANEL_STYLES.textColor,
  flex: 1,
};

interface TraceEntryItemProps {
  trace: TraceEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

const TraceEntryItem = React.memo(function TraceEntryItem({ trace, isExpanded, onToggle }: TraceEntryItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const badgeStyle = useMemo(() => getBadgeStyle(trace.category), [trace.category]);

  return (
    <div
      data-testid="trace-entry"
      style={isHovered ? TRACE_ENTRY_HOVER_STYLE : TRACE_ENTRY_STYLE}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onToggle}
    >
      <div style={TRACE_HEADER_STYLE}>
        <div style={badgeStyle}>{trace.category}</div>
        <div style={{ flex: 1, color: PANEL_STYLES.textColor, fontSize: '13px' }}>{trace.summary}</div>
        <div style={TICK_NUMBER_STYLE}>#{trace.tick}</div>
      </div>
      {isExpanded && <TraceDetailRenderer trace={trace} />}
    </div>
  );
});

interface TraceDetailRendererProps {
  trace: TraceEntry;
}

const TraceDetailRenderer = React.memo(function TraceDetailRenderer({ trace }: TraceDetailRendererProps) {
  switch (trace.category) {
    case 'action_selection':
      return <ActionSelectionDetail trace={trace as ActionSelectionTrace} />;
    case 'narrative_generation':
      return <NarrativeGenerationDetail trace={trace as NarrativeGenerationTrace} />;
    case 'context_harvest':
      return <ContextHarvestDetail trace={trace as ContextHarvestTrace} />;
    case 'dilemma_resolution':
      return <DilemmaResolutionDetail trace={trace as DilemmaResolutionTrace} />;
    case 'tick_summary':
      return <TickSummaryDetail trace={trace as TickSummaryTrace} />;
    case 'encounter_resolution':
      return <EncounterResolutionDetail trace={trace as EncounterResolutionTrace} />;
    case 'familiarity_change':
      return <FamiliarityChangeDetail trace={trace as FamiliarityChangeTrace} />;
    case 'intervention_effect':
      return <InterventionEffectDetail trace={trace as InterventionEffectTrace} />;
    default:
      return <FallbackDetail trace={trace} />;
  }
});

const ActionSelectionDetail = React.memo(function ActionSelectionDetail({ trace }: { trace: ActionSelectionTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      {trace.stages.map((stage, idx) => (
        <div key={idx}>
          <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>{stage.stageName}</div>
            <div style={DETAIL_VALUE_STYLE}>
              {stage.candidateIds.map((id, i) => (
                <div key={i}>
                  {id}: {(stage.scores[i] ?? 0).toFixed(2)} {'▓'.repeat(Math.round((stage.scores[i] ?? 0) * 8))}{'░'.repeat(8 - Math.round((stage.scores[i] ?? 0) * 8))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Final Pick</div>
        <div style={DETAIL_VALUE_STYLE}>
          {trace.finalPick.actionName}
          {trace.finalPick.targetName && ` → ${trace.finalPick.targetName}`}
          <div>Score: {trace.finalPick.score.toFixed(2)}, Prob: {trace.finalPick.probability.toFixed(2)}, Roll: {trace.finalPick.roll.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
});

const NarrativeGenerationDetail = React.memo(function NarrativeGenerationDetail({ trace }: { trace: NarrativeGenerationTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Tier</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.tier}</div>
      </div>
      {trace.templateId && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Template</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.templateId}</div>
        </div>
      )}
      {trace.sphereWords && trace.sphereWords.length > 0 && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Spheres</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.sphereWords.join(', ')}</div>
        </div>
      )}
      {trace.personalityClause && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Personality</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.personalityClause}</div>
        </div>
      )}
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Prose</div>
      </div>
      <div style={{ ...DETAIL_AREA_STYLE, background: PANEL_STYLES.detailBg, padding: '8px', borderRadius: '3px', fontStyle: 'italic', color: PANEL_STYLES.textColor, fontFamily: 'sans-serif' }}>
        "{trace.finalProse}"
      </div>
    </div>
  );
});

const ContextHarvestDetail = React.memo(function ContextHarvestDetail({ trace }: { trace: ContextHarvestTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Harvested</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.harvestedCount} objects</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Selected</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.selectedIds.length} objects</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Opposition</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.oppositionTension.toFixed(2)}</div>
      </div>
      {trace.rankedTop.length > 0 && (
        <>
          <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>Top Objects</div>
          </div>
          {trace.rankedTop.map((obj) => (
            <div key={obj.nodeId} style={DETAIL_ROW_STYLE}>
              <div style={DETAIL_VALUE_STYLE}>
                {obj.name}: {obj.score.toFixed(2)}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
});

const DilemmaResolutionDetail = React.memo(function DilemmaResolutionDetail({ trace }: { trace: DilemmaResolutionTrace }) {
  const cooperateColor = TRACE_CATEGORY_COLORS.narrative_generation;
  const defectColor = TRACE_CATEGORY_COLORS.dilemma_resolution;

  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Strategies</div>
        <div style={DETAIL_VALUE_STYLE}>
          {trace.actorStrategy} vs {trace.targetStrategy}
        </div>
      </div>
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px', marginBottom: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Payoff</div>
      </div>
      <table style={{ width: '100%', marginBottom: '8px', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ borderBottom: `1px solid ${PANEL_STYLES.borderColor}` }}>
            <td style={{ padding: '4px', color: PANEL_STYLES.tickColor }}>Actor</td>
            <td style={{ padding: '4px', textAlign: 'center', color: PANEL_STYLES.textColor }}>Cooperate</td>
            <td style={{ padding: '4px', textAlign: 'center', color: PANEL_STYLES.textColor }}>Defect</td>
          </tr>
          <tr style={{ borderBottom: `1px solid ${PANEL_STYLES.borderColor}` }}>
            <td style={{ padding: '4px', color: PANEL_STYLES.tickColor }}>Target Cooperate</td>
            <td style={{ padding: '4px', textAlign: 'center', background: trace.actorMove === 'cooperate' && trace.targetMove === 'cooperate' ? `${cooperateColor}33` : 'transparent', color: trace.actorMove === 'cooperate' && trace.targetMove === 'cooperate' ? cooperateColor : PANEL_STYLES.textColor }}>
              (3, 3)
            </td>
            <td style={{ padding: '4px', textAlign: 'center', background: trace.actorMove === 'defect' && trace.targetMove === 'cooperate' ? `${defectColor}33` : 'transparent', color: trace.actorMove === 'defect' && trace.targetMove === 'cooperate' ? defectColor : PANEL_STYLES.textColor }}>
              (5, 0)
            </td>
          </tr>
          <tr>
            <td style={{ padding: '4px', color: PANEL_STYLES.tickColor }}>Target Defect</td>
            <td style={{ padding: '4px', textAlign: 'center', background: trace.actorMove === 'cooperate' && trace.targetMove === 'defect' ? `${defectColor}33` : 'transparent', color: trace.actorMove === 'cooperate' && trace.targetMove === 'defect' ? defectColor : PANEL_STYLES.textColor }}>
              (0, 5)
            </td>
            <td style={{ padding: '4px', textAlign: 'center', background: trace.actorMove === 'defect' && trace.targetMove === 'defect' ? `${cooperateColor}33` : 'transparent', color: trace.actorMove === 'defect' && trace.targetMove === 'defect' ? cooperateColor : PANEL_STYLES.textColor }}>
              (1, 1)
            </td>
          </tr>
        </tbody>
      </table>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Outcome</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.outcome}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Stakes</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.stakes.toFixed(2)}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Sentiment Δ</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.sentimentDelta.toFixed(2)}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Rep Δ</div>
        <div style={DETAIL_VALUE_STYLE}>
          Actor: {trace.reputationDeltas.actor.toFixed(2)}, Target: {trace.reputationDeltas.target.toFixed(2)}
        </div>
      </div>
    </div>
  );
});

const TickSummaryDetail = React.memo(function TickSummaryDetail({ trace }: { trace: TickSummaryTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Agents Processed</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.agentsProcessed}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Doom Stage</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.doomStage}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Essence Total</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.essenceTotal}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Mandate Progress</div>
        <div style={DETAIL_VALUE_STYLE}>{(trace.mandateProgress * 100).toFixed(1)}%</div>
      </div>
      {Object.keys(trace.phaseEventCounts).length > 0 && (
        <>
          <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>Phase Events</div>
          </div>
          {Object.entries(trace.phaseEventCounts).map(([phase, count]) => (
            <div key={phase} style={DETAIL_ROW_STYLE}>
              <div style={DETAIL_VALUE_STYLE}>
                {phase}: {count}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
});

const EncounterResolutionDetail = React.memo(function EncounterResolutionDetail({ trace }: { trace: EncounterResolutionTrace }) {
  const successColor = TRACE_CATEGORY_COLORS.encounter_resolution;
  const failColor = TRACE_CATEGORY_COLORS.dilemma_resolution;

  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Encounter</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.encounterId}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Actor</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.actorId}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Step</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.stepName}</div>
      </div>
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Capability</div>
        <div style={DETAIL_VALUE_STYLE}>
          {trace.capability.toFixed(2)} / {trace.difficulty.toFixed(2)} (prob: {trace.probability.toFixed(2)})
        </div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Roll Result</div>
        <div style={{ ...DETAIL_VALUE_STYLE, color: trace.success ? successColor : failColor, fontWeight: 600 }}>
          {trace.roll.toFixed(2)} — {trace.success ? 'SUCCESS' : 'FAILURE'}
        </div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Status</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.status}</div>
      </div>
      {trace.traitChanges.length > 0 && (
        <>
          <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>Traits</div>
          </div>
          {trace.traitChanges.map((change, idx) => (
            <div key={idx} style={DETAIL_ROW_STYLE}>
              <div style={DETAIL_VALUE_STYLE}>{change}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
});

const FamiliarityChangeDetail = React.memo(function FamiliarityChangeDetail({ trace }: { trace: FamiliarityChangeTrace }) {
  const thresholdColor = TRACE_CATEGORY_COLORS.familiarity_change;

  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Actor</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.actorName}</div>
      </div>
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Level</div>
        <div
          style={{
            ...DETAIL_VALUE_STYLE,
            fontWeight: trace.levelChanged ? 600 : 400,
            color: trace.levelChanged ? thresholdColor : PANEL_STYLES.textColor,
          }}
        >
          {trace.newLevel ? `${trace.newLevel} (changed)` : 'No change'}
        </div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Familiarity</div>
        <div style={DETAIL_VALUE_STYLE}>
          {trace.oldFamiliarity.toFixed(2)} → {trace.newFamiliarity.toFixed(2)}
        </div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Source</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.source}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Amount</div>
        <div style={DETAIL_VALUE_STYLE}>
          +{trace.amount.toFixed(2)} (×{trace.multiplier.toFixed(1)})
        </div>
      </div>
    </div>
  );
});

const InterventionEffectDetail = React.memo(function InterventionEffectDetail({ trace }: { trace: InterventionEffectTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Intervention</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.interventionType}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Target</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.targetAgentName} ({trace.targetAgentId})</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Sphere</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.sphere}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Max Duration</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.maxDuration}</div>
      </div>
      {trace.effects.length > 0 && (
        <>
          <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>Effects</div>
          </div>
          {trace.effects.map((effect, idx) => (
            <div key={idx} style={DETAIL_ROW_STYLE}>
              <div style={DETAIL_VALUE_STYLE}>• {effect}</div>
            </div>
          ))}
        </>
      )}
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Consequence</div>
      </div>
      <div style={{ ...DETAIL_AREA_STYLE, background: PANEL_STYLES.detailBg, padding: '8px', borderRadius: '3px', fontStyle: 'italic', color: PANEL_STYLES.textColor, fontFamily: 'sans-serif' }}>
        "{trace.consequenceMessage}"
      </div>
    </div>
  );
});

const FallbackDetail = React.memo(function FallbackDetail({ trace }: { trace: TraceEntry }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      {Object.entries(trace)
        .filter(([key]) => !['id', 'timestamp', 'category', 'summary', 'tick'].includes(key))
        .map(([key, value]) => (
          <div key={key} style={DETAIL_ROW_STYLE}>
            <div style={DETAIL_LABEL_STYLE}>{key}</div>
            <div style={DETAIL_VALUE_STYLE}>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
          </div>
        ))}
    </div>
  );
});

export const DebugPanel = React.memo(function DebugPanel({ currentTick, followAgentId, onClose }: DebugPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [enabledCategories, setEnabledCategories] = useState<Set<TraceCategory>>(new Set(TRACE_CATEGORIES));
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const [selectedTick, setSelectedTick] = useState(currentTick);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  // Auto-switch to agent-follow mode when followAgentId changes
  useEffect(() => {
    if (followAgentId) {
      setViewMode('agent-follow');
    } else if (viewMode === 'agent-follow') {
      setViewMode('feed');
    }
  }, [followAgentId, viewMode]);

  const allTraces = useMemo(() => getTraces(), []);

  const displayTraces = useMemo(() => {
    let traces = Array.from(allTraces).reverse(); // Newest first

    // Filter by enabled categories
    traces = traces.filter((t) => enabledCategories.has(t.category as TraceCategory));

    // Filter by view mode
    if (viewMode === 'agent-follow' && followAgentId) {
      traces = traces.filter((t) => t.agentId === followAgentId);
    } else if (viewMode === 'tick-inspector') {
      traces = traces.filter((t) => t.tick === selectedTick);
    }

    return traces;
  }, [allTraces, enabledCategories, viewMode, followAgentId, selectedTick]);

  const tickGroups = useMemo(() => {
    const groups = new Map<number, TraceEntry[]>();
    for (const trace of allTraces) {
      if (!groups.has(trace.tick)) {
        groups.set(trace.tick, []);
      }
      groups.get(trace.tick)!.push(trace);
    }
    return groups;
  }, [allTraces]);

  const toggleCategory = useCallback((category: TraceCategory) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setIsScrolledUp(scrollRef.current.scrollTop > 50);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  const tickOptions = useMemo(() => {
    return Array.from(tickGroups.keys()).sort((a, b) => b - a);
  }, [tickGroups]);

  return (
    <div data-testid="debug-panel" style={CONTAINER_STYLE}>
      {/* Header */}
      <div style={HEADER_STYLE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '14px' }}>Debug Trace</span>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close Debug Panel"
              title="Close (Esc)"
              style={{
                background: 'transparent',
                border: 'none',
                color: PANEL_STYLES.textColor,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={TAB_BAR_STYLE}>
        <button style={getTabButtonStyle(viewMode === 'feed')} onClick={() => setViewMode('feed')}>
          Feed
        </button>
        <button style={getTabButtonStyle(viewMode === 'agent-follow')} onClick={() => setViewMode('agent-follow')}>
          Agent
        </button>
        <button style={getTabButtonStyle(viewMode === 'tick-inspector')} onClick={() => setViewMode('tick-inspector')}>
          Tick
        </button>
      </div>

      {/* Agent Follow Header */}
      {viewMode === 'agent-follow' && followAgentId && (
        <div style={{ ...HEADER_STYLE, background: `${TRACE_CATEGORY_COLORS.narrative_generation}1a` }}>
          Following: <span style={{ color: TRACE_CATEGORY_COLORS.narrative_generation, fontWeight: 600 }}>{followAgentId}</span>
        </div>
      )}

      {/* Tick Inspector Selector */}
      {viewMode === 'tick-inspector' && (
        <div style={HEADER_STYLE}>
          <select
            value={selectedTick}
            onChange={(e) => setSelectedTick(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: 'var(--bg-raised)',
              border: `1px solid var(--border-subtle)`,
              color: 'var(--text-primary)',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {tickOptions.map((tick) => (
              <option key={tick} value={tick}>
                Tick {tick} ({tickGroups.get(tick)?.length ?? 0} traces)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Filters */}
      {viewMode === 'feed' && (
        <div style={FILTER_AREA_STYLE}>
          {TRACE_CATEGORIES.map((category) => (
            <label key={category} style={CHECKBOX_LABEL_STYLE}>
              <input
                type="checkbox"
                checked={enabledCategories.has(category)}
                onChange={() => toggleCategory(category)}
                style={{ cursor: 'pointer' }}
              />
              {category}
            </label>
          ))}
        </div>
      )}

      {/* Scroll Area */}
      <div ref={scrollRef} style={SCROLL_AREA_STYLE} onScroll={handleScroll}>
        {displayTraces.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>No traces yet. Enable tracing in code.</div>
        ) : (
          displayTraces.map((trace) => (
            <TraceEntryItem
              key={trace.id}
              trace={trace}
              isExpanded={expandedTraceId === trace.id}
              onToggle={() => setExpandedTraceId(expandedTraceId === trace.id ? null : trace.id)}
            />
          ))
        )}
      </div>

      {/* New Traces Pill */}
      {isScrolledUp && displayTraces.length > 0 && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 12px',
            background: TRACE_CATEGORY_COLORS.action_selection,
            border: 'none',
            borderRadius: '12px',
            color: '#000',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            zIndex: 50,
          }}
        >
          ↑ New traces
        </button>
      )}
    </div>
  );
});

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TraceEntry, TraceCategory, ActionSelectionTrace, NarrativeGenerationTrace, ContextHarvestTrace, DilemmaResolutionTrace, TickSummaryTrace, EncounterResolutionTrace, FamiliarityChangeTrace, InterventionEffectTrace, ActionExecutionTrace, MovementTrace } from '../../types/trace';
import type { ModifierResolutionTrace } from '../../types/modifiers';
import type { WorldGraph } from '../../engine/graph';
import type { SphereAggregate } from '../../types/worldSoul';
import { TRACE_CATEGORIES } from '../../types/trace';
import { getTraces } from '../../engine/traceBuffer';
import { TRACE_CATEGORY_COLORS } from '../../data/uiColorPalette';
import { DecisionBreakdown } from './debug/DecisionBreakdown';
import { RelationshipGraph } from './debug/RelationshipGraph';
import { EncounterCacheView } from './debug/EncounterCacheView';
import type { EncounterCacheEntry } from '../../engine/encounterCache';
import type { EncounterProgress } from '../../types/encounter';
import type { WebGLDiagnosticsSnapshot } from '../HexMapV2/diagnostics/WebGLDiagnostics';
import { WebGLDebugTab } from './debug/WebGLDebugTab';
import { RevelationLogTab } from './debug/RevelationLogTab';
import { KnowledgeComparisonTab } from './debug/KnowledgeComparisonTab';
import type { AgentKnowledge } from '../../types/agentKnowledge';
import type { RetinueAgent } from '../../engine/retinue';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import type { MemberOfEdgeProperties } from '../../types/disposition';
import { computeRankFromReputation } from '../../types/faction';
import { SPHERE_ICONS } from '../../data/sphereIcons';
import { SPHERE_TOOLTIPS } from '../../data/sphereTooltips';
import { MAX_SPHERE_SCORE } from '../../types/sphereAffinity';
import { FIELD_BATTLE_COLOR, SIEGE_COLOR } from '../HexMapV2/scene/BattleIndicatorLayer';

interface DebugPanelProps {
  currentTick: number;
  followAgentId?: string;
  graph?: WorldGraph;
  /** All retinue agents for the agent-follow dropdown selector */
  retinueAgents?: readonly RetinueAgent[];
  onClose?: () => void;
  /** Callback to toggle bond overlay on the hex map */
  onToggleBonds?: (enabled: boolean) => void;
  /** Callback to toggle decision vector overlay on the hex map */
  onToggleDecisionVectors?: (enabled: boolean) => void;
  /** Pre-computed encounter cache entries for the encounters tab */
  cacheEntries?: readonly EncounterCacheEntry[];
  /** Current encounter progress records */
  encounterProgress?: readonly EncounterProgress[];
  /** Callback to zoom the map to a location's hex */
  onZoomToLocation?: (locationId: string) => void;
  /** Getter for WebGL diagnostics snapshot from HexMapV2 */
  getWebGLDiagnostics?: () => WebGLDiagnosticsSnapshot | null;
  /** Getter for current d3-zoom scale (k value) from HexMapV2 */
  getZoomLevel?: () => number;
  /** Whether organic shore rendering is enabled */
  showOrganicShore?: boolean;
  /** Callback to toggle organic shore rendering */
  onToggleOrganicShore?: (enabled: boolean) => void;
  /** Active encounter notifications (TB-040) */
  encounterNotifications?: readonly import('../../types/encounterVisibility').EncounterNotification[];
  /** Pending journey vignettes (TB-040) */
  pendingVignettes?: readonly import('../../types/journeyEngine').PendingVignette[];
  /** World seed for encounter log export */
  seed?: number;
  /** Global sphere aggregate for the Sphere State debug tab */
  sphereAggregate?: SphereAggregate;
  /** Per-agent knowledge state for revelation debug tabs */
  agentKnowledge?: Map<string, AgentKnowledge>;
}

type ViewMode = 'feed' | 'agent-follow' | 'tick-inspector' | 'social' | 'encounters' | 'journey' | 'webgl' | 'factions' | 'spheres' | 'revelation-log' | 'knowledge-gaps' | 'armies';

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

// RC-019: Pre-computed tab styles to avoid object allocation per render
const TAB_BUTTON_ACTIVE: React.CSSProperties = {
  ...TAB_BUTTON_BASE,
  borderBottom: `2px solid ${TRACE_CATEGORY_COLORS.action_selection}`,
  color: 'var(--accent-gold)',
  opacity: 1,
};
const TAB_BUTTON_INACTIVE: React.CSSProperties = {
  ...TAB_BUTTON_BASE,
  borderBottom: 'none',
  color: PANEL_STYLES.textColor,
  opacity: 0.6,
};
const getTabButtonStyle = (isActive: boolean): React.CSSProperties =>
  isActive ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE;

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
    case 'action_execution':
      return <ActionExecutionDetail trace={trace as ActionExecutionTrace} />;
    case 'modifier_resolution':
      return <ModifierResolutionDetail trace={trace as ModifierResolutionTrace} />;
    case 'movement':
      return <MovementDetail trace={trace as MovementTrace} />;
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

const ActionExecutionDetail = React.memo(function ActionExecutionDetail({ trace }: { trace: ActionExecutionTrace }) {
  const successColor = TRACE_CATEGORY_COLORS.action_selection;
  const failColor = TRACE_CATEGORY_COLORS.dilemma_resolution;
  const isSuccess = trace.outcome === 'success';

  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Template</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.templateId}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Actor</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.actorId}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Duration</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.duration} ticks</div>
      </div>
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Outcome</div>
        <div style={{ ...DETAIL_VALUE_STYLE, color: isSuccess ? successColor : failColor, fontWeight: 600 }}>
          {trace.outcome.toUpperCase()}
        </div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Graph Ops</div>
        <div style={DETAIL_VALUE_STYLE}>
          Applied: {trace.opsApplied}, Failed: {trace.opsFailed}
        </div>
      </div>
    </div>
  );
});

const ModifierResolutionDetail = React.memo(function ModifierResolutionDetail({ trace }: { trace: ModifierResolutionTrace }) {
  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Attribute</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.attribute}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Node</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.nodeId}</div>
      </div>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Base Value</div>
        <div style={DETAIL_VALUE_STYLE}>{trace.baseValue.toFixed(2)}</div>
      </div>
      {trace.modifiers.length > 0 && (
        <>
          <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
            <div style={DETAIL_LABEL_STYLE}>Modifiers</div>
          </div>
          {trace.modifiers.map((mod, idx) => (
            <div key={idx} style={DETAIL_ROW_STYLE}>
              <div style={DETAIL_VALUE_STYLE}>
                <span>{mod.sourceName}</span>
                <span style={{ color: PANEL_STYLES.tickColor, marginLeft: '4px' }}>({mod.edgeType})</span>
                <span style={{ color: mod.delta >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginLeft: '8px' }}>
                  {mod.delta >= 0 ? '+' : ''}{mod.delta.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
      <div style={{ ...DETAIL_ROW_STYLE, borderTop: `1px solid ${PANEL_STYLES.borderColor}`, paddingTop: '8px', marginTop: '8px' }}>
        <div style={DETAIL_LABEL_STYLE}>Final Value</div>
        <div style={{ ...DETAIL_VALUE_STYLE, fontWeight: 600 }}>{trace.finalValue.toFixed(2)}</div>
      </div>
    </div>
  );
});

const MOVEMENT_EVENT_ICONS: Record<string, string> = {
  depart: '->',
  step: '>>',
  arrive: '!!',
  sublocation_enter: 'v',
  sublocation_return: '^',
  reroute: '~>',
};

const MovementDetail = React.memo(function MovementDetail({ trace }: { trace: MovementTrace }) {
  const eventColor = TRACE_CATEGORY_COLORS.movement ?? '#38bdf8';
  const icon = MOVEMENT_EVENT_ICONS[trace.event] ?? '?';

  return (
    <div style={DETAIL_AREA_STYLE}>
      <div style={DETAIL_ROW_STYLE}>
        <div style={DETAIL_LABEL_STYLE}>Event</div>
        <div style={{ ...DETAIL_VALUE_STYLE, color: eventColor, fontWeight: 600 }}>
          {icon} {trace.event}
        </div>
      </div>
      {trace.fromLocationName && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>From</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.fromLocationName}</div>
        </div>
      )}
      {trace.toLocationName && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>To</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.toLocationName}</div>
        </div>
      )}
      {trace.destinationName && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Destination</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.destinationName}</div>
        </div>
      )}
      {trace.event === 'reroute' && trace.oldDestinationName && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Old Dest</div>
          <div style={{ ...DETAIL_VALUE_STYLE, textDecoration: 'line-through', opacity: 0.6 }}>
            {trace.oldDestinationName}
          </div>
        </div>
      )}
      {trace.sublocationName && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Sublocation</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.sublocationName}</div>
        </div>
      )}
      {trace.encounterId && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Encounter</div>
          <div style={{ ...DETAIL_VALUE_STYLE, fontSize: '10px', opacity: 0.8 }}>{trace.encounterId}</div>
        </div>
      )}
      {trace.queueLength != null && (
        <div style={DETAIL_ROW_STYLE}>
          <div style={DETAIL_LABEL_STYLE}>Hops Left</div>
          <div style={DETAIL_VALUE_STYLE}>{trace.queueLength}</div>
        </div>
      )}
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

// ─── Social Tab (inline sub-component for the Social debug view) ──────────

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

interface SocialTabContentProps {
  followAgentId?: string;
  graph?: WorldGraph;
  traces: TraceEntry[];
  showBonds: boolean;
  showDecisionVectors: boolean;
  onToggleBonds: (enabled: boolean) => void;
  onToggleDecisionVectors: (enabled: boolean) => void;
}

const SocialTabContent = React.memo(function SocialTabContent({
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
      {/* Map Overlay Toggles */}
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

      {/* Decision Breakdown */}
      <div style={SOCIAL_SECTION_HEADER_STYLE} onClick={() => toggleSection('decision')}>
        <span>Decision Breakdown</span>
        <span>{expandedSections.has('decision') ? '\u25BC' : '\u25B6'}</span>
      </div>
      {expandedSections.has('decision') && (
        <DecisionBreakdown agentId={followAgentId} traces={traces} />
      )}

      {/* Relationship Graph */}
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

// ─── Journey Debug Tab (TB-040) ─────────────────────────────────────

function JourneyDebugContent({
  encounterNotifications,
  pendingVignettes,
  currentTick: _currentTick,
}: {
  encounterNotifications?: readonly import('../../types/encounterVisibility').EncounterNotification[];
  pendingVignettes?: readonly import('../../types/journeyEngine').PendingVignette[];
  currentTick: number;
}) {
  const notifications = encounterNotifications ?? [];
  const vignettes = pendingVignettes ?? [];

  return (
    <div style={{ fontSize: '12px', color: PANEL_STYLES.textColor }}>
      {/* Pending Vignettes */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-gold)' }}>
          Pending Vignettes ({vignettes.length})
        </div>
        {vignettes.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No pending vignettes.</div>
        ) : (
          vignettes.map(v => (
            <div
              key={v.id}
              style={{
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--bg-raised)',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 500 }}>{v.data.agentName} — {v.data.phase}</div>
              <div style={{ opacity: 0.7, fontSize: '11px' }}>
                Beat {v.data.beatIndex + 1} | Template: {v.data.templateId}
                {v.data.isOrdeal && <span style={{ color: '#ffd700', marginLeft: '6px' }}>ORDEAL</span>}
              </div>
              <div style={{ opacity: 0.6, fontSize: '11px', marginTop: '2px' }}>
                {v.data.choices.length} choice{v.data.choices.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Encounter Notifications */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-gold)' }}>
          Encounter Notifications ({notifications.length})
        </div>
        {notifications.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No active encounter notifications.</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              style={{
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--bg-raised)',
                borderRadius: '4px',
                border: `1px solid ${n.resolved ? 'var(--border-subtle)' : 'var(--accent-gold)'}`,
                opacity: n.resolved ? 0.5 : 1,
              }}
            >
              <div style={{ fontWeight: 500 }}>
                {n.agentName} — {n.encounterName}
                {n.courtPosition && (
                  <span style={{ opacity: 0.6, marginLeft: '6px', fontSize: '11px' }}>
                    [{n.courtPosition}]
                  </span>
                )}
              </div>
              <div style={{ opacity: 0.7, fontSize: '11px' }}>{n.prose}</div>
              <div style={{ opacity: 0.5, fontSize: '11px', marginTop: '2px' }}>
                Created tick {n.createdTick}
                {n.autoResolveTick != null && ` | Auto-resolve tick ${n.autoResolveTick}`}
                {n.viewed && ' | Viewed'}
                {n.resolved && ' | Resolved'}
                {` | ${n.choices.length} choices`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Armies Debug Tab (TB-073) ──────────────────────────────────────────

function ArmiesTabContent({ graph, currentTick, onZoomToLocation }: { graph?: WorldGraph; currentTick: number; onZoomToLocation?: (locationId: string) => void }) {
  if (!graph) {
    return <div style={EMPTY_STATE_STYLE}>No graph available.</div>;
  }

  // Find all armies — exclude monster faction armies from the player-facing panel
  const armies = graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null)
    .filter(n => {
      // isMonsterFaction: check via member_of edge to faction node
      const memEdges = graph.getOutgoingEdges(n.id, 'member_of');
      if (memEdges.length === 0) return true; // no faction — include (defensive)
      const faction = graph.getNode(memEdges[0].target);
      return !faction?.properties.isMonsterFaction;
    });

  // Find all active battles/sieges
  const battles = graph.getNodesByType('actor')
    .filter(n => n.properties.battleState != null);

  if (armies.length === 0 && battles.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No armies or battles yet. Factions need military ambitions and sufficient Iron+Gold capability.
      </div>
    );
  }

  return (
    <div className="p-3 text-xs font-mono">
      {/* Active Armies */}
      {armies.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2" style={{ color: '#D4A574' }}>
            Active Armies ({armies.length})
          </div>
          {armies.map((army) => {
            const as = army.properties.armyState as Record<string, unknown>;
            const cmdEdges = graph.getOutgoingEdges(army.id, 'commanded_by');
            const commander = cmdEdges[0] ? graph.getNode(cmdEdges[0].target) : null;
            const memEdges = graph.getOutgoingEdges(army.id, 'member_of');
            const faction = memEdges[0] ? graph.getNode(memEdges[0].target) : null;
            const locEdges = graph.getOutgoingEdges(army.id, 'located_at');
            const location = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
            const qPct = ((as.quintessence as number) / Math.max(1, as.quintessenceMax as number) * 100);
            const ticksActive = currentTick - (as.raisedTick as number);

            return (
              <div key={army.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
                <div className="font-semibold mb-1">{army.name}</div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Faction:</span>
                  <span style={DETAIL_VALUE_STYLE}>{faction?.name ?? '—'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Commander:</span>
                  <span style={DETAIL_VALUE_STYLE}>{commander?.name ?? '—'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Size:</span>
                  <span style={DETAIL_VALUE_STYLE}>{String(as.size)} ({as.headcount})</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Quintessence:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, color: qPct < 30 ? FIELD_BATTLE_COLOR : qPct < 70 ? '#fbbf24' : '#4ade80' }}>
                    {/* health: danger / warning / good */}
                    {(as.quintessence as number).toFixed(1)} / {as.quintessenceMax as number} ({qPct.toFixed(0)}%)
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Location:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {location?.name ?? '—'}
                    {onZoomToLocation && location && (
                      <button
                        onClick={() => onZoomToLocation(location.id)}
                        title={`Zoom to ${location.name}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                      >&#x1F441;</button>
                    )}
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Active:</span>
                  <span style={DETAIL_VALUE_STYLE}>{ticksActive} ticks</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Maintenance:</span>
                  <span style={DETAIL_VALUE_STYLE}>{as.maintenanceCost}/tick</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Active Battles/Sieges */}
      {battles.length > 0 && (
        <>
          <div className="text-sm font-medium mb-2 mt-3" style={{ color: FIELD_BATTLE_COLOR }}>
            Active Battles ({battles.length})
          </div>
          {battles.map((battle) => {
            const bs = battle.properties.battleState as Record<string, unknown>;
            const ticksElapsed = currentTick - (bs.startedTick as number);
            const isSiege = bs.battleType === 'siege';
            const momentum = bs.momentum as number;
            const threshold = isSiege ? 12 : 8;

            return (
              <div key={battle.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
                <div className="font-semibold mb-1">{battle.name}</div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Type:</span>
                  <span style={DETAIL_VALUE_STYLE}>{isSiege ? 'Siege' : 'Field Battle'}</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Momentum:</span>
                  <span style={{ ...DETAIL_VALUE_STYLE, color: momentum > 0 ? FIELD_BATTLE_COLOR : momentum < 0 ? '#60a5fa' : '#888' }}>
                    {momentum.toFixed(1)} / {'\u00B1'}{threshold} ({momentum > 0 ? 'Attacker' : momentum < 0 ? 'Defender' : 'Even'})
                  </span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Elapsed:</span>
                  <span style={DETAIL_VALUE_STYLE}>{ticksElapsed} ticks</span>
                </div>
                <div style={DETAIL_ROW_STYLE}>
                  <span style={DETAIL_LABEL_STYLE}>Spotlights:</span>
                  <span style={DETAIL_VALUE_STYLE}>{(bs.spotlightHistory as string[]).length}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Destruction Log — locations downgraded to ruins by battle aftermath */}
      <div className="text-sm font-medium mb-2 mt-3" style={{ color: SIEGE_COLOR }}>
        Destruction Log
      </div>
      {(() => {
        const destroyed = graph.getNodesByType('location')
          .filter(n => n.properties.locationSubtype === 'ruins');
        if (destroyed.length === 0) {
          return <div className="text-[11px] opacity-60 italic">No destruction events yet.</div>;
        }
        return destroyed.map(loc => (
          <div key={loc.id} className="p-2 bg-[var(--bg-raised)] rounded mb-1.5 text-[11px]">
            <div className="font-semibold mb-1">{loc.name}</div>
            <div style={DETAIL_ROW_STYLE}>
              <span style={DETAIL_LABEL_STYLE}>Status:</span>
              <span style={DETAIL_VALUE_STYLE}>Ruins</span>
            </div>
            {loc.properties.prosperity != null && (
              <div style={DETAIL_ROW_STYLE}>
                <span style={DETAIL_LABEL_STYLE}>Prosperity:</span>
                <span style={DETAIL_VALUE_STYLE}>{(loc.properties.prosperity as number).toFixed(2)}</span>
              </div>
            )}
          </div>
        ));
      })()}
    </div>
  );
}

// ─── Sphere State Debug Tab ──────────────────────────────────────────

function SphereStateTabContent({ aggregate }: { aggregate?: SphereAggregate }) {
  if (!aggregate) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No sphere aggregate yet. Run a tick to compute.
      </div>
    );
  }

  const spheres = Object.keys(SPHERE_ICONS) as Array<keyof typeof SPHERE_ICONS>;
  const sortedSpheres = [...spheres].sort(
    (a, b) => (aggregate.totalBySphere[b] ?? 0) - (aggregate.totalBySphere[a] ?? 0),
  );

  return (
    <div style={{ ...DETAIL_AREA_STYLE, padding: '16px' }}>
      {/* Global aggregate summary */}
      <div style={{ marginBottom: '16px', padding: '10px', background: 'var(--bg-raised)', borderRadius: '4px' }}>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Dominant:</span>
          <span style={{
            ...DETAIL_VALUE_STYLE,
            color: aggregate.dominantSphere
              ? SPHERE_ICONS[aggregate.dominantSphere]?.color ?? DETAIL_VALUE_STYLE.color
              : DETAIL_VALUE_STYLE.color,
            fontWeight: 600,
          }}>
            {aggregate.dominantSphere ?? '—'}
          </span>
        </div>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Entity count:</span>
          <span style={DETAIL_VALUE_STYLE}>{aggregate.entityCount}</span>
        </div>
      </div>

      {/* Per-sphere breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedSpheres.map(sphere => {
          const total = aggregate.totalBySphere[sphere] ?? 0;
          const avgScore = aggregate.entityCount > 0 ? total / aggregate.entityCount : 0;
          const color = SPHERE_ICONS[sphere]?.color ?? '#888';
          const tooltip = SPHERE_TOOLTIPS[sphere];
          const barPct = Math.min(100, (avgScore / MAX_SPHERE_SCORE) * 100);
          const isDominant = aggregate.dominantSphere === sphere;

          return (
            <div key={sphere} title={tooltip}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color,
                  fontWeight: isDominant ? 700 : 400,
                  textTransform: 'capitalize',
                }}>
                  {isDominant ? '★ ' : ''}{sphere}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}>
                  total: {total} | avg: {avgScore.toFixed(2)}
                </span>
              </div>
              <div style={{
                height: '6px',
                background: 'var(--bg-raised)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                  opacity: isDominant ? 1 : 0.65,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Faction Debug Tab ──────────────────────────────────────────────

function FactionDebugContent({ graph, onZoomToLocation }: { graph?: WorldGraph; onZoomToLocation?: (locationId: string) => void }) {
  if (!graph) return <div style={EMPTY_STATE_STYLE}>No graph loaded.</div>;

  const factionData = useMemo(() => {
    const results: Array<{
      defId: string;
      name: string;
      factionNodeId: string;
      members: Array<{ id: string; name: string; rank: string; reputation: number; locationId: string | null; locationName: string | null }>;
      armies: Array<{ id: string; name: string; locationId: string | null; locationName: string | null }>;
    }> = [];

    for (const [defId, def] of FACTION_DEFINITIONS) {
      // Find faction node(s) — multi-instance factions (e.g. mercenary companies) produce multiple nodes
      const factionNodes = graph.getNodesByType('actor')
        .filter(n => n.properties.factionDefId === defId);
      if (factionNodes.length === 0) continue;

      for (const factionNode of factionNodes) {

      // Find all member_of edges pointing to this faction
      const memberEdges = graph.getIncomingEdges(factionNode.id, 'member_of');
      const members = memberEdges
        .filter(edge => {
          const node = graph.getNode(edge.source);
          return node && !node.properties.armyState;
        })
        .map(edge => {
        const agentNode = graph.getNode(edge.source);
        const props = edge.properties as Partial<MemberOfEdgeProperties>;
        const rep = props.reputation ?? 0;
        const rank = computeRankFromReputation(rep, def);
        const locEdges = graph.getOutgoingEdges(edge.source, 'located_at');
        const locNode = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
        return {
          id: edge.source,
          name: agentNode?.name ?? '?',
          rank: rank.name,
          reputation: rep,
          locationId: locNode?.id ?? null,
          locationName: locNode?.name ?? null,
        };
      }).sort((a, b) => b.reputation - a.reputation);

      // Find armies belonging to this faction
      const armyMembers = memberEdges
        .filter(edge => {
          const node = graph.getNode(edge.source);
          return node && node.properties.armyState != null;
        })
        .map(edge => {
          const armyNode = graph.getNode(edge.source)!;
          const locEdges = graph.getOutgoingEdges(edge.source, 'located_at');
          const locNode = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
          return {
            id: armyNode.id,
            name: armyNode.name,
            locationId: locNode?.id ?? null,
            locationName: locNode?.name ?? null,
          };
        });

      results.push({
        defId,
        name: factionNode.name,
        factionNodeId: factionNode.id,
        members,
        armies: armyMembers,
      });
      } // end for factionNode
    }
    return results;
  }, [graph]);

  if (factionData.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No factions found in graph.</div>;
  }

  return (
    <div data-testid="factions-tab-content">
      {factionData.map(faction => (
        <div key={faction.factionNodeId} style={{ marginBottom: '16px' }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-raised)', borderRadius: '4px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '13px' }}>
              {faction.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {faction.members.length} member{faction.members.length !== 1 ? 's' : ''}
            </div>
          </div>
          {/* Armies */}
          {faction.armies.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '2px 12px', fontWeight: 600 }}>Armies</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {faction.armies.map(army => (
                  <div
                    key={army.id}
                    style={{
                      padding: '6px 12px',
                      background: PANEL_STYLES.detailBg,
                      border: `1px solid ${PANEL_STYLES.detailBorder}`,
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{army.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{army.locationName ?? '—'}</span>
                      {onZoomToLocation && army.locationId && (
                        <button
                          onClick={() => onZoomToLocation(army.locationId!)}
                          title={`Zoom to ${army.locationName}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                        >&#x1F441;</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {faction.members.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No members
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '2px 12px', fontWeight: 600 }}>Members</div>
              {faction.members.map(member => (
                <div
                  key={member.id}
                  style={{
                    padding: '6px 12px',
                    background: PANEL_STYLES.detailBg,
                    border: `1px solid ${PANEL_STYLES.detailBorder}`,
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>{member.rank}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {member.locationName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{member.locationName}</span>
                        {onZoomToLocation && member.locationId && (
                          <button
                            onClick={() => onZoomToLocation(member.locationId!)}
                            title={`Zoom to ${member.locationName}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                          >&#x1F441;</button>
                        )}
                      </div>
                    )}
                    <div style={{ width: '60px', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(member.reputation * 100)}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontVariantNumeric: 'tabular-nums' }}>
                      {(member.reputation * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export const DebugPanel = React.memo(function DebugPanel({ currentTick, followAgentId, graph, retinueAgents, onClose, onToggleBonds, onToggleDecisionVectors, cacheEntries, encounterProgress, onZoomToLocation, getWebGLDiagnostics, getZoomLevel, showOrganicShore = true, onToggleOrganicShore, encounterNotifications, pendingVignettes, seed, sphereAggregate, agentKnowledge }: DebugPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [enabledCategories, setEnabledCategories] = useState<Set<TraceCategory>>(new Set(TRACE_CATEGORIES));
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const [selectedTick, setSelectedTick] = useState(currentTick);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [showDecisionVectors, setShowDecisionVectors] = useState(false);
  // Local override for agent selection within the debug panel dropdown.
  // null = follow external selection (from RetinuePanel click).
  const [overrideAgentId, setOverrideAgentId] = useState<string | null>(null);

  // The effective agent ID: local override wins, then external followAgentId
  const effectiveAgentId = overrideAgentId ?? followAgentId;

  // FE-17: Auto-switch to agent-follow only when followAgentId itself changes,
  // not when the user manually switches tabs. Previous version had viewMode in deps,
  // creating a feedback loop that snapped back to agent-follow on every tab switch.
  const prevFollowAgentId = useRef(followAgentId);
  useEffect(() => {
    if (followAgentId !== prevFollowAgentId.current) {
      prevFollowAgentId.current = followAgentId;
      if (followAgentId) {
        setOverrideAgentId(null); // Reset override when external selection changes
        setViewMode('agent-follow');
      } else {
        setViewMode((prev) => prev === 'agent-follow' ? 'feed' : prev);
      }
    }
  }, [followAgentId]);

  // DEF-008: Deduplicate traces by id — React StrictMode double-executes effects,
  // causing duplicate entries in the trace buffer during development.
  const allTraces = useMemo(() => {
    const raw = getTraces();
    const seen = new Set<number>();
    const deduped: TraceEntry[] = [];
    for (const t of raw) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        deduped.push(t);
      }
    }
    return deduped;
  }, [currentTick]);

  const displayTraces = useMemo(() => {
    let traces = Array.from(allTraces).reverse(); // Newest first

    // Filter by enabled categories
    traces = traces.filter((t) => enabledCategories.has(t.category as TraceCategory));

    // Filter by view mode
    if (viewMode === 'agent-follow' && effectiveAgentId) {
      traces = traces.filter((t) => t.agentId === effectiveAgentId);
    } else if (viewMode === 'tick-inspector') {
      traces = traces.filter((t) => t.tick === selectedTick);
    }

    return traces;
  }, [allTraces, enabledCategories, viewMode, effectiveAgentId, selectedTick]);

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
          <span style={{ fontSize: '12px', color: PANEL_STYLES.tickColor, marginLeft: '8px' }}>tick = {currentTick}</span>
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
        <button style={getTabButtonStyle(viewMode === 'social')} onClick={() => setViewMode('social')}>
          Social
        </button>
        <button style={getTabButtonStyle(viewMode === 'encounters')} onClick={() => setViewMode('encounters')}>
          Encounters
        </button>
        <button style={getTabButtonStyle(viewMode === 'journey')} onClick={() => setViewMode('journey')}>
          Journey
        </button>
        <button style={getTabButtonStyle(viewMode === 'webgl')} onClick={() => setViewMode('webgl')}>
          WebGL
        </button>
        <button style={getTabButtonStyle(viewMode === 'factions')} onClick={() => setViewMode('factions')}>
          Factions
        </button>
        <button style={getTabButtonStyle(viewMode === 'spheres')} onClick={() => setViewMode('spheres')}>
          Sphere State
        </button>
        <button style={getTabButtonStyle(viewMode === 'revelation-log')} onClick={() => setViewMode('revelation-log')}>
          Revelations
        </button>
        <button style={getTabButtonStyle(viewMode === 'knowledge-gaps')} onClick={() => setViewMode('knowledge-gaps')}>
          Knowledge
        </button>
        <button style={getTabButtonStyle(viewMode === 'armies')} onClick={() => setViewMode('armies')}>
          Armies
        </button>
      </div>

      {/* Agent Follow Header with dropdown selector */}
      {viewMode === 'agent-follow' && (
        <div style={HEADER_STYLE}>
          <select
            value={effectiveAgentId ?? ''}
            onChange={(e) => setOverrideAgentId(e.target.value || null)}
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
            <option value="">— Select a hero —</option>
            {(retinueAgents ?? []).map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.tierName}) — {agent.locationName}
              </option>
            ))}
          </select>
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
          <button
            onClick={() => setEnabledCategories(prev => prev.size === 0 ? new Set(TRACE_CATEGORIES) : new Set())}
            style={{ fontSize: '10px', padding: '2px 6px', marginBottom: '4px', cursor: 'pointer', background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '3px' }}
          >
            {enabledCategories.size === 0 ? 'Enable All' : 'Disable All'}
          </button>
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
        {viewMode === 'journey' ? (
          <JourneyDebugContent
            encounterNotifications={encounterNotifications}
            pendingVignettes={pendingVignettes}
            currentTick={currentTick}
          />
        ) : viewMode === 'webgl' ? (
          getWebGLDiagnostics ? (
            <WebGLDebugTab getDiagnostics={getWebGLDiagnostics} getZoomLevel={getZoomLevel} showOrganicShore={showOrganicShore} onToggleOrganicShore={(v) => onToggleOrganicShore?.(v)} />
          ) : (
            <div style={EMPTY_STATE_STYLE}>No renderer connected.</div>
          )
        ) : viewMode === 'encounters' ? (
          <EncounterCacheView
            cacheEntries={cacheEntries ?? []}
            encounterProgress={encounterProgress ?? []}
            currentTick={currentTick}
            followAgentId={effectiveAgentId}
            onZoomToLocation={onZoomToLocation}
            graph={graph}
            seed={seed != null ? String(seed) : undefined}
          />
        ) : viewMode === 'factions' ? (
          <FactionDebugContent graph={graph} onZoomToLocation={onZoomToLocation} />
        ) : viewMode === 'spheres' ? (
          <SphereStateTabContent aggregate={sphereAggregate} />
        ) : viewMode === 'revelation-log' ? (
          <RevelationLogTab
            traces={allTraces as TraceEntry[]}
            agentKnowledge={agentKnowledge ?? new Map()}
          />
        ) : viewMode === 'knowledge-gaps' ? (
          <KnowledgeComparisonTab
            agentKnowledge={agentKnowledge ?? new Map()}
            graph={graph}
          />
        ) : viewMode === 'armies' ? (
          <ArmiesTabContent graph={graph} currentTick={currentTick} onZoomToLocation={onZoomToLocation} />
        ) : viewMode === 'social' ? (
          <SocialTabContent
            followAgentId={effectiveAgentId}
            graph={graph}
            traces={allTraces as TraceEntry[]}
            showBonds={showBonds}
            showDecisionVectors={showDecisionVectors}
            onToggleBonds={(v) => { setShowBonds(v); onToggleBonds?.(v); }}
            onToggleDecisionVectors={(v) => { setShowDecisionVectors(v); onToggleDecisionVectors?.(v); }}
          />
        ) : displayTraces.length === 0 ? (
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

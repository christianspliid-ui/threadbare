import React from 'react';
import type { TraceEntry } from '../../../types/trace';
import type { WorldGraph } from '../../../engine/graph';
import type { SphereAggregate } from '../../../types/worldSoul';
import type { RetinueAgent } from '../../../engine/retinue';
import type { EncounterCacheEntry } from '../../../engine/encounterCache';
import type { EncounterProgress } from '../../../types/encounter';
import type { WebGLDiagnosticsSnapshot } from '../../HexMapV2/diagnostics/WebGLDiagnostics';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { PendingVignette } from '../../../types/journeyEngine';
import type { StrategicRuntimeState, BehaviorFamily } from '../../../types/strategicAction';
import {
  BEHAVIOR_FAMILY_PRESENTATION,
  getBehaviorFamilyPresentation,
  getAgentStrategicSummary,
  getAgentStrategicHistory,
  getProgressLabel,
  getHealthLabel,
} from '../../../engine/strategicPresentation';
import { EncounterCacheView } from './EncounterCacheView';
import { WebGLDebugTab } from './WebGLDebugTab';
import { RevelationLogTab } from './RevelationLogTab';
import { KnowledgeComparisonTab } from './KnowledgeComparisonTab';
import { TraceEntryItem } from './TraceFeed';
import { SocialTabContent } from './SocialTabContent';
import { JourneyDebugContent } from './JourneyDebugContent';
import { ArmiesTabContent } from './ArmiesTabContent';
import { FactionDebugContent } from './FactionDebugContent';
import { SphereStateTabContent } from './SphereStateTabContent';
import { CommandTab } from './CommandTab';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

export type ViewMode = 'feed' | 'agent-follow' | 'tick-inspector' | 'social' | 'encounters' | 'journey' | 'webgl' | 'factions' | 'spheres' | 'revelation-log' | 'knowledge-gaps' | 'armies' | 'cli' | 'strategic';

export const TABS: { id: ViewMode; label: string }[] = [
  { id: 'feed', label: 'Feed' }, { id: 'agent-follow', label: 'Agent' },
  { id: 'tick-inspector', label: 'Tick' }, { id: 'social', label: 'Social' },
  { id: 'encounters', label: 'Encounters' }, { id: 'journey', label: 'Journey' },
  { id: 'webgl', label: 'WebGL' }, { id: 'factions', label: 'Factions' },
  { id: 'spheres', label: 'Sphere State' }, { id: 'revelation-log', label: 'Revelations' },
  { id: 'knowledge-gaps', label: 'Knowledge' }, { id: 'armies', label: 'Armies' },
  { id: 'strategic', label: 'Strategic' }, { id: 'cli', label: 'CLI' },
];

export interface DebugTabContentProps {
  viewMode: ViewMode;
  currentTick: number;
  graph?: WorldGraph;
  allTraces: TraceEntry[];
  displayTraces: TraceEntry[];
  expandedTraceId: number | null;
  onToggleTrace: (id: number) => void;
  effectiveAgentId?: string;
  showBonds: boolean;
  showDecisionVectors: boolean;
  onToggleBonds: (v: boolean) => void;
  onToggleDecisionVectors: (v: boolean) => void;
  cacheEntries?: readonly EncounterCacheEntry[];
  encounterProgress?: readonly EncounterProgress[];
  onZoomToLocation?: (locationId: string) => void;
  getWebGLDiagnostics?: () => WebGLDiagnosticsSnapshot | null;
  getZoomLevel?: () => number;
  showOrganicShore: boolean;
  onToggleOrganicShore?: (enabled: boolean) => void;
  encounterNotifications?: readonly EncounterNotification[];
  pendingVignettes?: readonly PendingVignette[];
  seed?: number;
  sphereAggregate?: SphereAggregate;
  agentKnowledge?: Map<string, AgentKnowledge>;
  retinueAgents?: readonly RetinueAgent[];
  /** Strategic runtime state for the strategic debug tab. */
  strategicState?: StrategicRuntimeState;
}

export function DebugTabContent({
  viewMode, currentTick, graph, allTraces, displayTraces,
  expandedTraceId, onToggleTrace, effectiveAgentId,
  showBonds, showDecisionVectors, onToggleBonds, onToggleDecisionVectors,
  cacheEntries, encounterProgress, onZoomToLocation,
  getWebGLDiagnostics, getZoomLevel, showOrganicShore, onToggleOrganicShore,
  encounterNotifications, pendingVignettes, seed, sphereAggregate, agentKnowledge,
  retinueAgents, strategicState,
}: DebugTabContentProps) {
  if (viewMode === 'journey') {
    return <JourneyDebugContent encounterNotifications={encounterNotifications} pendingVignettes={pendingVignettes} currentTick={currentTick} />;
  }
  if (viewMode === 'webgl') {
    return getWebGLDiagnostics
      ? <WebGLDebugTab getDiagnostics={getWebGLDiagnostics} getZoomLevel={getZoomLevel} showOrganicShore={showOrganicShore} onToggleOrganicShore={(v) => onToggleOrganicShore?.(v)} />
      : <div style={EMPTY_STATE_STYLE}>No renderer connected.</div>;
  }
  if (viewMode === 'encounters') {
    return <EncounterCacheView cacheEntries={cacheEntries ?? []} encounterProgress={encounterProgress ?? []} currentTick={currentTick} followAgentId={effectiveAgentId} onZoomToLocation={onZoomToLocation} graph={graph} seed={seed != null ? String(seed) : undefined} />;
  }
  if (viewMode === 'factions') return <FactionDebugContent graph={graph} onZoomToLocation={onZoomToLocation} />;
  if (viewMode === 'spheres') return <SphereStateTabContent aggregate={sphereAggregate} />;
  if (viewMode === 'revelation-log') return <RevelationLogTab traces={allTraces as TraceEntry[]} agentKnowledge={agentKnowledge ?? new Map()} />;
  if (viewMode === 'knowledge-gaps') return <KnowledgeComparisonTab agentKnowledge={agentKnowledge ?? new Map()} graph={graph} />;
  if (viewMode === 'armies') return <ArmiesTabContent graph={graph} currentTick={currentTick} onZoomToLocation={onZoomToLocation} />;
  if (viewMode === 'cli') return <CommandTab retinueAgents={retinueAgents} followAgentId={effectiveAgentId} />;
  if (viewMode === 'strategic') return <StrategicDebugTab strategicState={strategicState} graph={graph} effectiveAgentId={effectiveAgentId} currentTick={currentTick} />;
  if (viewMode === 'social') {
    return (
      <SocialTabContent
        followAgentId={effectiveAgentId} graph={graph} traces={allTraces as TraceEntry[]}
        showBonds={showBonds} showDecisionVectors={showDecisionVectors}
        onToggleBonds={onToggleBonds} onToggleDecisionVectors={onToggleDecisionVectors}
      />
    );
  }
  if (displayTraces.length === 0) return <div style={EMPTY_STATE_STYLE}>No traces yet. Enable tracing in code.</div>;
  return (
    <>
      {displayTraces.map((trace) => (
        <TraceEntryItem key={trace.id} trace={trace} isExpanded={expandedTraceId === trace.id} onToggle={() => onToggleTrace(trace.id)} />
      ))}
    </>
  );
}

// ── Strategic Debug Tab ────────────────────────────────────────────────────────

function StrategicDebugTab({
  strategicState,
  graph,
  effectiveAgentId,
  currentTick,
}: {
  strategicState?: StrategicRuntimeState;
  graph?: WorldGraph;
  effectiveAgentId?: string;
  currentTick: number;
}) {
  if (!strategicState) {
    return <div style={EMPTY_STATE_STYLE}>No strategic state available.</div>;
  }

  const activeProjects = strategicState.projects.filter(p => p.status === 'active');
  const activeControls = strategicState.controls.filter(c => c.active);

  // Per-family breakdown across active projects and controls
  const familyCounts = new Map<string, { projects: number; controls: number }>();
  for (const proj of activeProjects) {
    const e = familyCounts.get(proj.behaviorFamily) ?? { projects: 0, controls: 0 };
    e.projects++;
    familyCounts.set(proj.behaviorFamily, e);
  }
  for (const ctrl of activeControls) {
    const e = familyCounts.get(ctrl.behaviorFamily) ?? { projects: 0, controls: 0 };
    e.controls++;
    familyCounts.set(ctrl.behaviorFamily, e);
  }

  // Followed agent detail
  const agentSummary = (effectiveAgentId && graph)
    ? getAgentStrategicSummary(strategicState, effectiveAgentId, graph, currentTick)
    : null;
  const agentHistory = effectiveAgentId
    ? getAgentStrategicHistory(strategicState, effectiveAgentId, currentTick)
    : [];

  const sH: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
  };
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '2px 0', fontSize: '12px', color: 'var(--text-primary)',
  };
  const sec: React.CSSProperties = { marginBottom: '14px' };
  const pill = (color: string): React.CSSProperties => ({
    fontSize: '11px', color,
    background: `color-mix(in srgb, ${color} 10%, transparent)`,
    padding: '1px 4px', borderRadius: '2px',
  });
  const indented: React.CSSProperties = {
    ...row, flexDirection: 'column', alignItems: 'flex-start', gap: '1px',
    borderLeft: '2px solid var(--border-subtle)', paddingLeft: '6px', marginTop: '4px',
  };

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* Global stats */}
      <div style={sec}>
        <div style={sH}>Strategic Activity</div>
        <div style={{ ...row, gap: '14px', flexWrap: 'wrap' }}>
          <span><strong>{activeProjects.length}</strong> <span style={{ color: 'var(--text-muted)' }}>projects</span></span>
          <span><strong>{activeControls.length}</strong> <span style={{ color: 'var(--text-muted)' }}>controls</span></span>
          <span><strong>{strategicState.history.length}</strong> <span style={{ color: 'var(--text-muted)' }}>history</span></span>
        </div>
      </div>

      {/* Per-family breakdown */}
      {familyCounts.size > 0 && (
        <div style={sec}>
          <div style={sH}>By Family</div>
          {Array.from(familyCounts.entries()).map(([family, counts]) => {
            const pres = getBehaviorFamilyPresentation(family as BehaviorFamily);
            return (
              <div key={family} style={row}>
                <span style={{ color: pres.color, width: '16px', textAlign: 'center' }}>{pres.glyph}</span>
                <span style={{ flex: 1 }}>{pres.label}</span>
                {counts.projects > 0 && <span style={pill(pres.color)}>{counts.projects}p</span>}
                {counts.controls > 0 && <span style={pill(pres.color)}>{counts.controls}c</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Followed agent detail */}
      {effectiveAgentId && (
        <div style={sec}>
          <div style={sH}>Followed Agent</div>
          {!agentSummary ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No strategic activity.</div>
          ) : (
            <>
              {agentSummary.behaviorFamily && (() => {
                const pres = getBehaviorFamilyPresentation(agentSummary.behaviorFamily);
                return (
                  <div style={row}>
                    <span style={{ color: pres.color }}>{pres.glyph}</span>
                    <span style={{ color: pres.color, fontWeight: 500 }}>{pres.label}</span>
                  </div>
                );
              })()}
              {agentSummary.activeProject && (
                <div style={indented}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Active project</span>
                  <span>{agentSummary.activeProject.displayName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{agentSummary.activeProject.progressLabel}</span>
                </div>
              )}
              {agentSummary.primaryControl && (
                <div style={indented}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Primary control{agentSummary.controlCount > 1 ? ` (${agentSummary.controlCount} total)` : ''}
                  </span>
                  <span>{agentSummary.primaryControl.targetName} — {agentSummary.primaryControl.healthLabel}</span>
                </div>
              )}
              {agentHistory.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ ...sH }}>Recent History</div>
                  {agentHistory.map((entry, i) => (
                    <div key={i} style={row}>
                      <span style={{
                        color: entry.outcome === 'completed' ? '#6a9a6e' : entry.outcome === 'failed' ? '#b85450' : 'var(--text-muted)',
                        width: '12px',
                      }}>
                        {entry.outcome === 'completed' ? '✓' : entry.outcome === 'failed' ? '✕' : '—'}
                      </span>
                      <span style={{ flex: 1 }}>{entry.displayName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{entry.ticksAgo}t ago</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* All active projects */}
      {activeProjects.length > 0 && (
        <div style={sec}>
          <div style={sH}>Active Projects ({activeProjects.length})</div>
          {activeProjects.map(proj => {
            const pres = getBehaviorFamilyPresentation(proj.behaviorFamily);
            const fraction = proj.progressRequired > 0 ? proj.progress / proj.progressRequired : 1;
            return (
              <div key={proj.projectId} style={{ ...row, borderLeft: `2px solid ${pres.color}`, paddingLeft: '6px', marginBottom: '1px' }}>
                <span style={{ color: pres.color, fontSize: '10px' }}>{pres.glyph}</span>
                <span style={{ flex: 1, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {proj.actorId.slice(-8)} — {proj.templateId}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                  {getProgressLabel(fraction)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* All active controls */}
      {activeControls.length > 0 && (
        <div style={sec}>
          <div style={sH}>Active Controls ({activeControls.length})</div>
          {activeControls.map(ctrl => {
            const pres = getBehaviorFamilyPresentation(ctrl.behaviorFamily);
            const targetNode = graph?.getNode(ctrl.targetNodeId);
            return (
              <div key={ctrl.controlId} style={{ ...row, borderLeft: `2px solid ${pres.color}`, paddingLeft: '6px', marginBottom: '1px' }}>
                <span style={{ color: pres.color, fontSize: '10px' }}>{pres.glyph}</span>
                <span style={{ flex: 1, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ctrl.actorId.slice(-8)} → {targetNode?.name ?? ctrl.targetNodeId.slice(-8)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                  {getHealthLabel(ctrl.degradation)}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

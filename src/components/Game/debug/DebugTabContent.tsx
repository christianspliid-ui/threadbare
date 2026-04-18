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
import type { OmenState } from '../../../types/omen';
import type { DoomIdentityMatrix } from '../../../types/doomIdentity';
import type { HiddenMark, PendingEncounterSeed } from '../../../types/unifiedAction';
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
import { HiddenMarksTab } from './HiddenMarksTab';
import { EncounterSeedsTab } from './EncounterSeedsTab';
import { CulturePhoneticsInspector } from './CulturePhoneticsInspector';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';
import type { KnowsClueOfEdgeProperties } from '../../../types/knowledge';

export type ViewMode = 'feed' | 'agent-follow' | 'tick-inspector' | 'social' | 'encounters' | 'encounter-seeds' | 'hidden-marks' | 'journey' | 'webgl' | 'factions' | 'spheres' | 'revelation-log' | 'knowledge-gaps' | 'armies' | 'cli' | 'strategic' | 'omens' | 'cultures' | 'secrets-favors' | 'clues';

export const TABS: { id: ViewMode; label: string }[] = [
  { id: 'feed', label: 'Feed' }, { id: 'agent-follow', label: 'Agent' },
  { id: 'tick-inspector', label: 'Tick' }, { id: 'social', label: 'Social' },
  { id: 'encounters', label: 'Encounters' }, { id: 'encounter-seeds', label: 'Seeds' }, { id: 'hidden-marks', label: 'Marks' },
  { id: 'journey', label: 'Journey' },
  { id: 'webgl', label: 'WebGL' }, { id: 'factions', label: 'Factions' },
  { id: 'spheres', label: 'Sphere State' }, { id: 'revelation-log', label: 'Revelations' },
  { id: 'knowledge-gaps', label: 'Knowledge' }, { id: 'armies', label: 'Armies' },
  { id: 'strategic', label: 'Strategic' }, { id: 'omens', label: 'Omens' },
  { id: 'cultures', label: 'Cultures' }, { id: 'secrets-favors', label: 'Secrets' }, { id: 'clues', label: 'Clues' }, { id: 'cli', label: 'CLI' },
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
  /** Omen state for the omens debug tab (THR-19). */
  omenState?: OmenState;
  /** Doom identity matrix for milestone display in omens tab (THR-21). */
  doomIdentityMatrix?: DoomIdentityMatrix | null;
  /** Hidden marks on agents — inspected in the Marks tab (THR-136). */
  hiddenMarks?: readonly HiddenMark[];
  /** Pending encounter seeds — inspected in the Seeds tab (THR-136). */
  pendingEncounterSeeds?: readonly PendingEncounterSeed[];
}

export function DebugTabContent({
  viewMode, currentTick, graph, allTraces, displayTraces,
  expandedTraceId, onToggleTrace, effectiveAgentId,
  showBonds, showDecisionVectors, onToggleBonds, onToggleDecisionVectors,
  cacheEntries, encounterProgress, onZoomToLocation,
  getWebGLDiagnostics, getZoomLevel, showOrganicShore, onToggleOrganicShore,
  encounterNotifications, pendingVignettes, seed, sphereAggregate, agentKnowledge,
  retinueAgents, strategicState, omenState, doomIdentityMatrix,
  hiddenMarks, pendingEncounterSeeds,
}: DebugTabContentProps) {
  if (viewMode === 'omens') return <OmenDebugTab omenState={omenState} currentTick={currentTick} doomIdentityMatrix={doomIdentityMatrix} />;
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
  if (viewMode === 'hidden-marks') {
    return <HiddenMarksTab marks={hiddenMarks ?? []} currentTick={currentTick} focusedAgentId={effectiveAgentId} retinueAgents={retinueAgents} />;
  }
  if (viewMode === 'encounter-seeds') {
    return <EncounterSeedsTab seeds={pendingEncounterSeeds ?? []} currentTick={currentTick} retinueAgents={retinueAgents} />;
  }
  if (viewMode === 'factions') return <FactionDebugContent graph={graph} onZoomToLocation={onZoomToLocation} />;
  if (viewMode === 'spheres') return <SphereStateTabContent aggregate={sphereAggregate} />;
  if (viewMode === 'revelation-log') return <RevelationLogTab traces={allTraces as TraceEntry[]} agentKnowledge={agentKnowledge ?? new Map()} />;
  if (viewMode === 'knowledge-gaps') return <KnowledgeComparisonTab agentKnowledge={agentKnowledge ?? new Map()} graph={graph} />;
  if (viewMode === 'armies') return <ArmiesTabContent graph={graph} currentTick={currentTick} onZoomToLocation={onZoomToLocation} />;
  if (viewMode === 'cultures') return <CulturePhoneticsInspector graph={graph} />;
  if (viewMode === 'secrets-favors') return <SecretsFavorsDebugTab graph={graph} focusedAgentId={effectiveAgentId} />;
  if (viewMode === 'clues') return <CluesDebugTab graph={graph} focusedAgentId={effectiveAgentId} currentTick={currentTick} />;
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

// ─── Omen Debug Tab (THR-19) ────────────────────────────────────

function OmenDebugTab({ omenState, currentTick, doomIdentityMatrix }: { omenState?: OmenState; currentTick: number; doomIdentityMatrix?: DoomIdentityMatrix | null }) {
  if (!omenState) {
    return <div style={EMPTY_STATE_STYLE}>No omen state initialized yet. Omens activate at tick {3}.</div>;
  }

  const { primary, secondary, history } = omenState;
  const recentHistory = [...history].reverse().slice(0, 10);

  return (
    <div style={{ padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
      <div style={{ color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '8px' }}>World Omens — Tick {currentTick}</div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Active</div>
        {primary ? (
          <div style={{ background: 'rgba(160,149,107,0.08)', border: '1px solid rgba(160,149,107,0.2)', borderRadius: '4px', padding: '6px', marginBottom: '4px' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>⊘ {primary.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>[primary]</span></div>
            <div style={{ color: 'var(--text-muted)' }}>ID: {primary.templateId}</div>
            <div style={{ color: 'var(--text-muted)' }}>Duration: t{primary.startTick}–t{primary.startTick + primary.duration} ({primary.startTick + primary.duration - currentTick} left)</div>
            <div style={{ color: 'var(--text-muted)' }}>Category: {primary.category} | Last beat: t{primary.lastBeatTick}</div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No primary omen active</div>
        )}
        {secondary ? (
          <div style={{ background: 'rgba(160,149,107,0.04)', border: '1px solid rgba(160,149,107,0.12)', borderRadius: '4px', padding: '6px' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>◈ {secondary.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>[secondary]</span></div>
            <div style={{ color: 'var(--text-muted)' }}>ID: {secondary.templateId}</div>
            <div style={{ color: 'var(--text-muted)' }}>Duration: t{secondary.startTick}–t{secondary.startTick + secondary.duration} ({secondary.startTick + secondary.duration - currentTick} left)</div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>No secondary omen active</div>
        )}
      </div>

      {recentHistory.length > 0 && (
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>History (last {recentHistory.length})</div>
          {recentHistory.map((h, i) => (
            <div key={i} style={{ color: 'var(--text-tertiary)', marginBottom: '2px' }}>
              t{h.startTick}–{h.endTick} · {h.templateId}
            </div>
          ))}
        </div>
      )}

      {doomIdentityMatrix && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Doom Identity — {doomIdentityMatrix.archetype}
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontStyle: 'italic', fontSize: '10px' }}>
            {doomIdentityMatrix.proseTone.atmospheres[0] ?? '—'}
          </div>
          {doomIdentityMatrix.identityMilestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '3px', color: m.triggered ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
              <span style={{ flexShrink: 0 }}>{m.triggered ? '✓' : '○'}</span>
              <span>
                <strong>{m.label}</strong> ({Math.round(m.progressThreshold * 100)}%)
                {' '}<span style={{ color: 'var(--text-tertiary)' }}>{m.description}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Clues Debug Tab (THR-150) ────────────────────────────────────────────────

function CluesDebugTab({ graph, focusedAgentId, currentTick }: { graph?: WorldGraph; focusedAgentId?: string; currentTick: number }) {
  if (!graph) return <div style={EMPTY_STATE_STYLE}>No graph connected.</div>;

  const clueEdges  = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
  const knewEdges  = graph.getAllEdges().filter(e => e.type === 'knows_of');

  const focused = focusedAgentId
    ? {
        held:  clueEdges.filter(e => e.source === focusedAgentId),
        about: clueEdges.filter(e => e.target === focusedAgentId),
      }
    : null;

  const ROW    = { display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '2px 0', fontSize: '11px' };
  const BADGE  = (color: string) => ({ background: color, color: '#fff', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', flexShrink: 0 });
  const MUTED  = { color: 'var(--text-muted)', fontSize: '10px' };
  const SECTION = { marginBottom: '12px' };
  const HEADER = { color: 'var(--accent-gold)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  const precisionColor: Record<string, string> = { vague: '#6b7280', narrowed: '#d97706', located: '#10b981' };

  function ClueRow({ edge }: { edge: ReturnType<WorldGraph['getAllEdges']>[number] }) {
    const knower = graph!.getNode(edge.source)?.name ?? edge.source.slice(0, 8);
    const ruin   = graph!.getNode(edge.target)?.name ?? edge.target.slice(0, 8);
    const p = edge.properties as KnowsClueOfEdgeProperties;
    const age = currentTick - p.discoveredTick;
    return (
      <div style={ROW}>
        <span style={BADGE(p.consumed ? '#6b7280' : precisionColor[p.precision] ?? '#6b7280')}>{p.consumed ? 'consumed' : p.precision}</span>
        <span style={{ color: 'var(--text-primary)', flex: 1 }}>
          {knower} → {ruin}
          <span style={MUTED}> via {p.source} · age {age}t · mag {((p.magnitude) ?? 0).toFixed(2)}</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={{ ...MUTED, marginBottom: '8px' }}>
        {clueEdges.length} clue edge(s) · {knewEdges.length} knows_of familiarity edge(s) world-wide
        {focusedAgentId && <span style={{ color: 'var(--accent-gold)', marginLeft: '8px' }}>Focused: {graph.getNode(focusedAgentId)?.name ?? focusedAgentId}</span>}
      </div>

      {focused ? (
        <>
          <div style={SECTION}>
            <div style={HEADER}>Clues held by agent ({focused.held.length})</div>
            {focused.held.length === 0 ? <div style={MUTED}>none</div> : focused.held.map(e => <ClueRow key={e.id} edge={e} />)}
          </div>
          <div style={SECTION}>
            <div style={HEADER}>Clues pointing at agent's ruins ({focused.about.length})</div>
            {focused.about.length === 0 ? <div style={MUTED}>none</div> : focused.about.map(e => <ClueRow key={e.id} edge={e} />)}
          </div>
        </>
      ) : (
        <div style={SECTION}>
          <div style={HEADER}>All clues ({clueEdges.length})</div>
          {clueEdges.length === 0
            ? <div style={MUTED}>No clues yet. Clues form when encounter aftermath spawn_clue effects fire or ruin worldgen seeds them.</div>
            : clueEdges.map(e => <ClueRow key={e.id} edge={e} />)}
        </div>
      )}
    </div>
  );
}

// ── Secrets & Favors Debug Tab (THR-30) ──────────────────────────────────────

function SecretsFavorsDebugTab({ graph, focusedAgentId }: { graph?: WorldGraph; focusedAgentId?: string }) {
  if (!graph) return <div style={EMPTY_STATE_STYLE}>No graph connected.</div>;

  const secretEdges = graph.getAllEdges().filter(e => e.type === 'knows_secret_of');
  const favorEdges  = graph.getAllEdges().filter(e => e.type === 'owes_favor');

  const focused = focusedAgentId
    ? {
        secretsHeld:  secretEdges.filter(e => e.source === focusedAgentId),
        secretsAbout: secretEdges.filter(e => e.target === focusedAgentId),
        favorsOwed:   favorEdges.filter(e => e.source === focusedAgentId),
        favorsCredit: favorEdges.filter(e => e.target === focusedAgentId),
      }
    : null;

  const ROW = { display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '2px 0', fontSize: '11px' };
  const BADGE = (color: string) => ({ background: color, color: '#fff', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', flexShrink: 0 });
  const MUTED = { color: 'var(--text-muted)', fontSize: '10px' };
  const SECTION = { marginBottom: '12px' };
  const HEADER = { color: 'var(--accent-gold)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

  function SecretRow({ edge }: { edge: ReturnType<WorldGraph['getAllEdges']>[number] }) {
    const holder = graph!.getNode(edge.source)?.name ?? edge.source.slice(0, 8);
    const subject = graph!.getNode(edge.target)?.name ?? edge.target.slice(0, 8);
    const p = edge.properties as Record<string, unknown>;
    return (
      <div style={ROW}>
        <span style={BADGE(p.revealed ? '#6b7280' : '#d97706')}>{p.revealed ? 'revealed' : 'hidden'}</span>
        <span style={{ color: 'var(--text-primary)', flex: 1 }}>
          {holder} → {subject}
          <span style={MUTED}> [{p.secretType as string}] mag {((p.magnitude as number) ?? 0).toFixed(2)} via {p.source as string}</span>
        </span>
      </div>
    );
  }

  function FavorRow({ edge }: { edge: ReturnType<WorldGraph['getAllEdges']>[number] }) {
    const debtor   = graph!.getNode(edge.source)?.name ?? edge.source.slice(0, 8);
    const creditor = graph!.getNode(edge.target)?.name ?? edge.target.slice(0, 8);
    const p = edge.properties as Record<string, unknown>;
    const status = p.redeemed ? 'redeemed' : p.broken ? 'broken' : 'active';
    const statusColor = p.redeemed ? '#10b981' : p.broken ? '#ef4444' : '#f59e0b';
    return (
      <div style={ROW}>
        <span style={BADGE(statusColor)}>{status}</span>
        <span style={{ color: 'var(--text-primary)', flex: 1 }}>
          {debtor} owes {creditor}
          <span style={MUTED}> [{p.context as string}] mag {((p.magnitude as number) ?? 0).toFixed(2)}</span>
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontFamily: 'monospace', overflowY: 'auto', height: '100%' }}>
      <div style={{ ...MUTED, marginBottom: '8px' }}>
        {secretEdges.length} secret edge(s) · {favorEdges.length} favor edge(s) world-wide
        {focusedAgentId && <span style={{ color: 'var(--accent-gold)', marginLeft: '8px' }}>Focused: {graph.getNode(focusedAgentId)?.name ?? focusedAgentId}</span>}
      </div>

      {focused ? (
        <>
          <div style={SECTION}>
            <div style={HEADER}>Secrets held by agent ({focused.secretsHeld.length})</div>
            {focused.secretsHeld.length === 0 ? <div style={MUTED}>none</div> : focused.secretsHeld.map(e => <SecretRow key={e.id} edge={e} />)}
          </div>
          <div style={SECTION}>
            <div style={HEADER}>Secrets about agent ({focused.secretsAbout.length})</div>
            {focused.secretsAbout.length === 0 ? <div style={MUTED}>none</div> : focused.secretsAbout.map(e => <SecretRow key={e.id} edge={e} />)}
          </div>
          <div style={SECTION}>
            <div style={HEADER}>Favors agent owes ({focused.favorsOwed.length})</div>
            {focused.favorsOwed.length === 0 ? <div style={MUTED}>none</div> : focused.favorsOwed.map(e => <FavorRow key={e.id} edge={e} />)}
          </div>
          <div style={SECTION}>
            <div style={HEADER}>Favors owed to agent ({focused.favorsCredit.length})</div>
            {focused.favorsCredit.length === 0 ? <div style={MUTED}>none</div> : focused.favorsCredit.map(e => <FavorRow key={e.id} edge={e} />)}
          </div>
        </>
      ) : (
        <>
          <div style={SECTION}>
            <div style={HEADER}>All secrets ({secretEdges.length})</div>
            {secretEdges.length === 0 ? <div style={MUTED}>No secrets yet. Secrets form via encounter outcomes.</div> : secretEdges.map(e => <SecretRow key={e.id} edge={e} />)}
          </div>
          <div style={SECTION}>
            <div style={HEADER}>All favors ({favorEdges.length})</div>
            {favorEdges.length === 0 ? <div style={MUTED}>No favors yet. Favors form via assist encounters.</div> : favorEdges.map(e => <FavorRow key={e.id} edge={e} />)}
          </div>
        </>
      )}
    </div>
  );
}

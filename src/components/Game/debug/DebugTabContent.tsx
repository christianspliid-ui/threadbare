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

export type ViewMode = 'feed' | 'agent-follow' | 'tick-inspector' | 'social' | 'encounters' | 'journey' | 'webgl' | 'factions' | 'spheres' | 'revelation-log' | 'knowledge-gaps' | 'armies' | 'cli';

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
}

export function DebugTabContent({
  viewMode, currentTick, graph, allTraces, displayTraces,
  expandedTraceId, onToggleTrace, effectiveAgentId,
  showBonds, showDecisionVectors, onToggleBonds, onToggleDecisionVectors,
  cacheEntries, encounterProgress, onZoomToLocation,
  getWebGLDiagnostics, getZoomLevel, showOrganicShore, onToggleOrganicShore,
  encounterNotifications, pendingVignettes, seed, sphereAggregate, agentKnowledge,
  retinueAgents,
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

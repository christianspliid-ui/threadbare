import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TraceEntry, TraceCategory } from '../../types/trace';
import { TRACE_CATEGORIES } from '../../types/trace';
import { getTraces } from '../../engine/traceBuffer';
import { TRACE_CATEGORY_COLORS } from '../../data/uiColorPalette';
import type { EncounterCacheEntry } from '../../engine/encounterCache';
import type { EncounterProgress } from '../../types/encounter';
import type { WebGLDiagnosticsSnapshot } from '../HexMapV2/diagnostics/WebGLDiagnostics';
import type { AgentKnowledge } from '../../types/agentKnowledge';
import type { RetinueAgent } from '../../engine/retinue';
import type { SphereAggregate } from '../../types/worldSoul';
import type { WorldGraph } from '../../engine/graph';
import type { EncounterNotification } from '../../types/encounterVisibility';
import type { PendingVignette } from '../../types/journeyEngine';
import type { StrategicRuntimeState } from '../../types/strategicAction';
import type { OmenState } from '../../types/omen';
import type { DoomIdentityMatrix } from '../../types/doomIdentity';
import type { HiddenMark, PendingEncounterSeed } from '../../types/unifiedAction';
import type { TickEvent, ActiveComposition, RegionDetectionState } from '../../types/gameState';
import { DebugTabContent, TABS, type ViewMode } from './debug/DebugTabContent';
import {
  PANEL_STYLES, CONTAINER_STYLE, HEADER_STYLE, TAB_BAR_STYLE,
  TAB_BUTTON_ACTIVE, TAB_BUTTON_INACTIVE, FILTER_AREA_STYLE,
  CHECKBOX_LABEL_STYLE, SCROLL_AREA_STYLE, SELECT_STYLE,
} from './debug/debugPanelStyles';

export interface DebugPanelProps {
  currentTick: number;
  followAgentId?: string;
  graph?: WorldGraph;
  retinueAgents?: readonly RetinueAgent[];
  onClose?: () => void;
  onToggleBonds?: (enabled: boolean) => void;
  onToggleDecisionVectors?: (enabled: boolean) => void;
  cacheEntries?: readonly EncounterCacheEntry[];
  encounterProgress?: readonly EncounterProgress[];
  onZoomToLocation?: (locationId: string) => void;
  getWebGLDiagnostics?: () => WebGLDiagnosticsSnapshot | null;
  getZoomLevel?: () => number;
  showOrganicShore?: boolean;
  onToggleOrganicShore?: (enabled: boolean) => void;
  encounterNotifications?: readonly EncounterNotification[];
  pendingVignettes?: readonly PendingVignette[];
  seed?: number;
  sphereAggregate?: SphereAggregate;
  agentKnowledge?: Map<string, AgentKnowledge>;
  preferredViewMode?: string;
  preferredViewNonce?: number;
  strategicState?: StrategicRuntimeState;
  omenState?: OmenState;
  doomIdentityMatrix?: DoomIdentityMatrix | null;
  /** Hidden marks for the Marks inspector tab (THR-136). */
  hiddenMarks?: readonly HiddenMark[];
  /** Pending encounter seeds for the Seeds inspector tab (THR-136). */
  pendingEncounterSeeds?: readonly PendingEncounterSeed[];
  /** Per-region encounter detection pressure state (THR-326). */
  regionalDetectionPressure?: readonly RegionDetectionState[];
  /** Active delves for the Ruins inspector tab (THR-152). */
  activeDelves?: readonly import('../../engine/ruins/delveTypes').ActiveDelve[];
  /** Lazy getter for recent events (debug tab opt-in stream). */
  getRecentEvents?: () => readonly TickEvent[];
  /** Flip table runtime states for the Shells inspector tab (THR-53). */
  flipTableStates?: ReadonlyMap<string, import('../../types/contentShells').FlipTableRuntimeState>;
  /** Active compositions for the Compositions inspector tab (THR-225). */
  activeCompositions?: readonly ActiveComposition[];
  /** Current doom clock stage for the Compositions inspector tab (THR-225). */
  doomClockStage?: number;
}

export const DebugPanel = React.memo(function DebugPanel({
  currentTick, followAgentId, graph, retinueAgents, onClose,
  onToggleBonds, onToggleDecisionVectors, cacheEntries, encounterProgress,
  onZoomToLocation, getWebGLDiagnostics, getZoomLevel, showOrganicShore = true,
  onToggleOrganicShore, encounterNotifications, pendingVignettes, seed,
  sphereAggregate, agentKnowledge, preferredViewMode, preferredViewNonce,
  strategicState, omenState, doomIdentityMatrix, hiddenMarks, pendingEncounterSeeds,
  regionalDetectionPressure,
  activeDelves, getRecentEvents, flipTableStates, activeCompositions, doomClockStage,
}: DebugPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [enabledCategories, setEnabledCategories] = useState<Set<TraceCategory>>(new Set(TRACE_CATEGORIES));
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const [selectedTick, setSelectedTick] = useState(currentTick);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [showDecisionVectors, setShowDecisionVectors] = useState(false);
  const [overrideAgentId, setOverrideAgentId] = useState<string | null>(null);
  const effectiveAgentId = overrideAgentId ?? followAgentId;

  // Switch to preferred view mode when requested (e.g., F1 → CLI tab)
  useEffect(() => {
    if (preferredViewMode && preferredViewNonce) {
      setViewMode(preferredViewMode as ViewMode);
    }
  }, [preferredViewNonce, preferredViewMode]);

  // FE-17: Auto-switch to agent-follow only when followAgentId itself changes
  const prevFollowAgentId = useRef(followAgentId);
  useEffect(() => {
    if (followAgentId !== prevFollowAgentId.current) {
      prevFollowAgentId.current = followAgentId;
      if (followAgentId) { setOverrideAgentId(null); setViewMode('agent-follow'); }
      else setViewMode((prev) => prev === 'agent-follow' ? 'feed' : prev);
    }
  }, [followAgentId]);

  // DEF-008: Deduplicate traces by id
  const allTraces = useMemo(() => {
    const raw = getTraces();
    const seen = new Set<number>();
    const deduped: TraceEntry[] = [];
    for (const t of raw) { if (!seen.has(t.id)) { seen.add(t.id); deduped.push(t); } }
    return deduped;
  }, [currentTick]);

  const displayTraces = useMemo(() => {
    let traces = Array.from(allTraces).reverse();
    traces = traces.filter((t) => enabledCategories.has(t.category as TraceCategory));
    if (viewMode === 'agent-follow' && effectiveAgentId) traces = traces.filter((t) => t.agentId === effectiveAgentId);
    else if (viewMode === 'tick-inspector') traces = traces.filter((t) => t.tick === selectedTick);
    return traces;
  }, [allTraces, enabledCategories, viewMode, effectiveAgentId, selectedTick]);

  const tickGroups = useMemo(() => {
    const groups = new Map<number, TraceEntry[]>();
    for (const trace of allTraces) {
      if (!groups.has(trace.tick)) groups.set(trace.tick, []);
      groups.get(trace.tick)!.push(trace);
    }
    return groups;
  }, [allTraces]);

  const toggleCategory = useCallback((category: TraceCategory) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setIsScrolledUp(scrollRef.current.scrollTop > 50);
  }, []);

  const tickOptions = useMemo(() => Array.from(tickGroups.keys()).sort((a, b) => b - a), [tickGroups]);

  return (
    <div data-testid="debug-panel" style={CONTAINER_STYLE}>
      <div style={HEADER_STYLE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: 'var(--text-sm)' }}>Debug Trace</span>
          <span style={{ fontSize: 'var(--text-xs)', color: PANEL_STYLES.tickColor, marginLeft: '8px' }}>tick = {currentTick}</span>
          {onClose && <button onClick={onClose} aria-label="Close Debug Panel" title="Close (Esc)" style={{ background: 'transparent', border: 'none', color: PANEL_STYLES.textColor, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>✕</button>}
        </div>
      </div>

      <div style={TAB_BAR_STYLE}>
        {TABS.map(({ id, label }) => (
          <button key={id} style={viewMode === id ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE} onClick={() => setViewMode(id)}>{label}</button>
        ))}
      </div>

      {viewMode === 'agent-follow' && (
        <div style={HEADER_STYLE}>
          <select value={effectiveAgentId ?? ''} onChange={(e) => setOverrideAgentId(e.target.value || null)} style={SELECT_STYLE}>
            <option value="">— Select a hero —</option>
            {(retinueAgents ?? []).map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.name} ({agent.tierName}) — {agent.locationName}</option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'tick-inspector' && (
        <div style={HEADER_STYLE}>
          <select value={selectedTick} onChange={(e) => setSelectedTick(parseInt(e.target.value, 10))} style={SELECT_STYLE}>
            {tickOptions.map((tick) => <option key={tick} value={tick}>Tick {tick} ({tickGroups.get(tick)?.length ?? 0} traces)</option>)}
          </select>
        </div>
      )}

      {viewMode === 'feed' && (
        <div style={FILTER_AREA_STYLE}>
          <button onClick={() => setEnabledCategories(prev => prev.size === 0 ? new Set(TRACE_CATEGORIES) : new Set())} style={{ fontSize: 'var(--text-xs)', padding: '2px 6px', marginBottom: '4px', cursor: 'pointer', background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '3px' }}>
            {enabledCategories.size === 0 ? 'Enable All' : 'Disable All'}
          </button>
          {TRACE_CATEGORIES.map((category) => (
            <label key={category} style={CHECKBOX_LABEL_STYLE}>
              <input type="checkbox" checked={enabledCategories.has(category)} onChange={() => toggleCategory(category)} style={{ cursor: 'pointer' }} />{category}
            </label>
          ))}
        </div>
      )}

      <div ref={scrollRef} style={SCROLL_AREA_STYLE} onScroll={handleScroll}>
        <DebugTabContent
          viewMode={viewMode} currentTick={currentTick} graph={graph}
          allTraces={allTraces} displayTraces={displayTraces}
          expandedTraceId={expandedTraceId} onToggleTrace={(id) => setExpandedTraceId(expandedTraceId === id ? null : id)}
          effectiveAgentId={effectiveAgentId} showBonds={showBonds} showDecisionVectors={showDecisionVectors}
          onToggleBonds={(v) => { setShowBonds(v); onToggleBonds?.(v); }}
          onToggleDecisionVectors={(v) => { setShowDecisionVectors(v); onToggleDecisionVectors?.(v); }}
          cacheEntries={cacheEntries} encounterProgress={encounterProgress}
          onZoomToLocation={onZoomToLocation} getWebGLDiagnostics={getWebGLDiagnostics}
          getZoomLevel={getZoomLevel} showOrganicShore={showOrganicShore}
          onToggleOrganicShore={onToggleOrganicShore} encounterNotifications={encounterNotifications}
          pendingVignettes={pendingVignettes} seed={seed} sphereAggregate={sphereAggregate}
          agentKnowledge={agentKnowledge}
          retinueAgents={retinueAgents}
          strategicState={strategicState}
          omenState={omenState}
          doomIdentityMatrix={doomIdentityMatrix}
          hiddenMarks={hiddenMarks}
          pendingEncounterSeeds={pendingEncounterSeeds}
          regionalDetectionPressure={regionalDetectionPressure}
          activeDelves={activeDelves}
          getRecentEvents={getRecentEvents}
          flipTableStates={flipTableStates}
          activeCompositions={activeCompositions}
          doomClockStage={doomClockStage}
        />
      </div>

      {isScrolledUp && displayTraces.length > 0 && (
        <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }} style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', background: TRACE_CATEGORY_COLORS.action_selection, border: 'none', borderRadius: '12px', color: '#000', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', zIndex: 50 }}>
          ↑ New traces
        </button>
      )}
    </div>
  );
});

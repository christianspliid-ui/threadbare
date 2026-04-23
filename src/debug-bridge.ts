/**
 * Dev-only debug bridge — exposes engine internals on window.__DEBUG
 * for Playwright-driven QA and interactive debugging.
 *
 * Tree-shaken in production: import.meta.env.DEV is statically replaced
 * by Vite, so the entire module becomes dead code in prod builds.
 */
if (import.meta.env.DEV) {
  interface SceneSnapshot {
    hexCount: number;
    agentsVisible: number;
    locationsVisible: number;
    armiesVisible: number;
    battlesVisible: number;
    siegesVisible: number;
    threadLines: number;
    activityIcons: number;
    fogEnabled: boolean;
    layersActive: string[];
  }

  interface ViewportHexProjection {
    x: number;
    y: number;
    visible: boolean;
  }

  interface ActiveUIState {
    view: string;
    selectedAgentId: string | null;
    selectedLocationId: string | null;
    selectedFactionId: string | null;
    selectedHex: { col: number; row: number } | null;
    openModals: string[];
    actionDrawerOpen: boolean;
    scryActive: boolean;
    cameraFocusHex: { col: number; row: number } | null;
  }

  const getEmptySceneSnapshot = (): SceneSnapshot => ({
    hexCount: 0,
    agentsVisible: 0,
    locationsVisible: 0,
    armiesVisible: 0,
    battlesVisible: 0,
    siegesVisible: 0,
    threadLines: 0,
    activityIcons: 0,
    fogEnabled: false,
    layersActive: [],
  });

  const getEmptyActiveUIState = (): ActiveUIState => ({
    view: 'game',
    selectedAgentId: null,
    selectedLocationId: null,
    selectedFactionId: null,
    selectedHex: null,
    openModals: [],
    actionDrawerOpen: false,
    scryActive: false,
    cameraFocusHex: null,
  });

  // React components register their debug-panel toggle here
  let _debugPanelToggle: ((open?: boolean) => void) | null = null;
  // GameView registers this to zoom + select an agent by id/name
  let _gotoAgent: ((id: string) => boolean) | null = null;
  // GameView registers these to list and fire actions
  interface ActionBridge {
    listActions: (agentId?: string) => import('./debug-bridge.d').DebugActionInfo[];
    fireAction: (agentId: string, templateId: string) => import('./debug-bridge.d').DebugFireResult;
  }
  let _actionBridge: ActionBridge | null = null;
  // GameView registers a provider for the live WorldGraph
  let _graphProvider: (() => import('./engine/graph').WorldGraph | null) | null = null;
  // GameView registers a provider for the live GameState
  let _gameStateProvider: (() => import('./types/gameState').GameState | null) | null = null;
  // GameView registers a provider for the live SimulationRuntime (for balance telemetry)
  let _runtimeProvider: (() => import('./engine/simulationRuntime').SimulationRuntime | null) | null = null;
  // GameView registers encounter spawn/world-spawn callbacks here
  let _encounterBridge: Record<string, (...args: unknown[]) => unknown> | null = null;
  // GameView registers its fog toggle callback here
  let _fogToggle: ((enabled?: boolean) => boolean) | null = null;
  // GameView registers scene and viewport projection callbacks here
  let _sceneSnapshot: (() => SceneSnapshot) | null = null;
  let _viewportForHex: ((col: number, row: number) => ViewportHexProjection | null) | null = null;
  let _hexAtViewport: ((x: number, y: number) => { col: number; row: number } | null) | null = null;
  // GameView registers modal + UI state providers for playtest assertions
  let _openModalsProvider: (() => string[]) | null = null;
  let _activeUIStateProvider: (() => ActiveUIState) | null = null;
  // GameView registers its omniscience toggle callback here
  let _omniscienceToggle: ((enabled?: boolean) => boolean) | null = null;
  // AscendantBar debug: GameView registers a callback to set ascendant quintessence
  let _setQuintessenceCb: ((ratio: number) => void) | null = null;

  window.__DEBUG = {
    // Debug panel control — called from browser console or Playwright
    openDebugPanel: () => { _debugPanelToggle?.(true); },
    closeDebugPanel: () => { _debugPanelToggle?.(false); },
    toggleDebugPanel: () => { _debugPanelToggle?.(); },
    /** @internal React registers its toggle callback here */
    _registerDebugPanelToggle: (fn: (open?: boolean) => void) => { _debugPanelToggle = fn; },
    /** Find an agent by id or partial name, zoom the camera to their hex, and select them. Returns true if found. */
    gotoAgent: (id: string) => _gotoAgent?.(id) ?? false,
    /** @internal GameView registers its gotoAgent handler here */
    _registerGotoAgent: (fn: (id: string) => boolean) => { _gotoAgent = fn; },
    listActions: (agentId?: string) => _actionBridge?.listActions(agentId) ?? [],
    fireAction: (agentId: string, templateId: string) =>
      _actionBridge?.fireAction(agentId, templateId) ?? { success: false, message: 'Game not loaded' },
    _registerActionBridge: (cb) => { _actionBridge = cb as ActionBridge; },
    /** @internal GameView registers its graph provider here */
    _registerGraphProvider: (fn: () => import('./engine/graph').WorldGraph | null) => { _graphProvider = fn; },
    /** @internal GameView registers a provider for the live GameState here */
    _registerGameStateProvider: (fn: () => import('./types/gameState').GameState | null) => { _gameStateProvider = fn; },
    /** @internal GameView registers the SimulationRuntime provider for balance telemetry access */
    _registerRuntimeProvider: (fn: () => import('./engine/simulationRuntime').SimulationRuntime | null) => { _runtimeProvider = fn; },
    /** @internal GameView registers encounter spawn / world-spawn callbacks here */
    _registerEncounterBridge: (cb: Record<string, (...args: unknown[]) => unknown>) => { _encounterBridge = cb; },
    toggleFog: () => _fogToggle?.() ?? false,
    setFog: (enabled: boolean) => { _fogToggle?.(enabled); },
    _registerFogToggle: (fn: (enabled?: boolean) => boolean) => { _fogToggle = fn; },

    // ── Scene snapshot + coordinate conversion for interface playtests ───────
    snapshotScene: async () => _sceneSnapshot?.() ?? getEmptySceneSnapshot(),
    getViewportForHex: (col: number, row: number) => _viewportForHex?.(col, row) ?? null,
    getHexAtViewport: (x: number, y: number) => _hexAtViewport?.(x, y) ?? null,
    getOpenModals: async () => _openModalsProvider?.() ?? [],
    getActiveUIState: async () => {
      const openModals = _openModalsProvider?.() ?? [];
      const uiState = _activeUIStateProvider?.() ?? getEmptyActiveUIState();
      return { ...uiState, openModals };
    },
    getEventsSince: async (tick: number) => {
      const state = _gameStateProvider?.();
      const recentEvents = state?.recentEvents ?? [];
      return recentEvents.filter((event) => event.tick > tick);
    },
    _registerSceneSnapshot: (fn: () => SceneSnapshot) => { _sceneSnapshot = fn; },
    _registerViewportForHex: (fn: (col: number, row: number) => ViewportHexProjection | null) => { _viewportForHex = fn; },
    _registerHexAtViewport: (fn: (x: number, y: number) => { col: number; row: number } | null) => { _hexAtViewport = fn; },
    _registerOpenModalsProvider: (fn: () => string[]) => { _openModalsProvider = fn; },
    _registerActiveUIStateProvider: (fn: () => ActiveUIState) => { _activeUIStateProvider = fn; },

    // ── Omniscience mode: bypass familiarity gating on agent character sheets ──
    toggleOmniscience: () => _omniscienceToggle?.() ?? false,
    setOmniscience: (enabled: boolean) => { _omniscienceToggle?.(enabled); },
    _registerOmniscienceToggle: (fn: (enabled?: boolean) => boolean) => { _omniscienceToggle = fn; },

    // ── Ascendant Bar: quintessence debug helpers (THR-184) ───────────────
    setQuintessence: (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      _setQuintessenceCb?.(clamped);
    },
    setBand: (band: string) => {
      const BAND_MIDPOINTS: Record<string, number> = {
        transcendent: 1.0, healthy: 0.75, strained: 0.4,
        weakened: 0.175, critical: 0.05, dissolving: 0.0,
      };
      const ratio = BAND_MIDPOINTS[band] ?? 0.75;
      _setQuintessenceCb?.(ratio);
    },
    _registerSetQuintessence: (fn: (ratio: number) => void) => { _setQuintessenceCb = fn; },

    // ── Spawn / world-spawn commands (delegated to encounter bridge) ──────
    spawnEncounter: (agentQuery: string, templateId: string, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnEncounter as ((...a: unknown[]) => unknown) | undefined)?.(agentQuery, templateId, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    spawnEncounterContext: (templateId: string, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnEncounterContext as ((...a: unknown[]) => unknown) | undefined)?.(templateId, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    spawnAttachment: (agentQuery: string, templateQuery: string, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnAttachment as ((...a: unknown[]) => unknown) | undefined)?.(agentQuery, templateQuery, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    spawnLocation: (subtype: string, col: number, row: number, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnLocation as ((...a: unknown[]) => unknown) | undefined)?.(subtype, col, row, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    spawnSublocation: (typeId: string, target: Record<string, unknown>, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnSublocation as ((...a: unknown[]) => unknown) | undefined)?.(typeId, target, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    spawnNpc: (role: string, target: Record<string, unknown>, options?: Record<string, unknown>) =>
      (_encounterBridge?.spawnNpc as ((...a: unknown[]) => unknown) | undefined)?.(role, target, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    moveAgent: (agentQuery: string, target: Record<string, unknown>, options?: Record<string, unknown>) =>
      (_encounterBridge?.moveAgent as ((...a: unknown[]) => unknown) | undefined)?.(agentQuery, target, options)
      ?? { success: false, message: 'Encounter bridge not registered' },

    pinAgent: (agentQuery: string) =>
      (_encounterBridge?.pinAgent as ((...a: unknown[]) => unknown) | undefined)?.(agentQuery)
      ?? { success: false, message: 'Encounter bridge not registered', pinnedCount: 0 },

    unpinAgent: (agentQuery: string) =>
      (_encounterBridge?.unpinAgent as ((...a: unknown[]) => unknown) | undefined)?.(agentQuery)
      ?? { success: false, message: 'Encounter bridge not registered', pinnedCount: 0 },

    /**
     * Inspect the encounter notification pipeline for a threaded agent.
     * Pass an agent name/id fragment to filter, or omit to see all threaded agents.
     * Returns thread edges, active encounterProgress entries, and pending encounterNotifications.
     * Use this to diagnose why encounter modals are not appearing.
     */
    inspectEncounterPipeline: (agentFilter?: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'Game state not available — is the game loaded?' };

      const { graph, ascendantId, encounterProgress, encounterNotifications } = state;
      const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');

      const threads = threadEdges.map(e => {
        const agent = graph.getNode(e.target);
        const props = e.properties as Record<string, unknown>;
        return {
          agentId: e.target,
          agentName: agent?.name ?? '(unknown)',
          courtPosition: props['courtPosition'] ?? null,
          attentionMode: props['attentionMode'] ?? null,
          tier: props['tier'] ?? null,
        };
      }).filter(t =>
        !agentFilter ||
        t.agentId.includes(agentFilter) ||
        t.agentName.toLowerCase().includes(agentFilter.toLowerCase()),
      );

      const threadedIds = new Set(threads.map(t => t.agentId));

      const activeEncounters = (encounterProgress ?? [])
        .filter(ep =>
          !agentFilter ||
          threadedIds.has(ep.actorId) ||
          ep.actorId.includes(agentFilter) ||
          (graph.getNode(ep.actorId)?.name ?? '').toLowerCase().includes(agentFilter.toLowerCase()),
        )
        .map(ep => ({
          actorId: ep.actorId,
          agentName: graph.getNode(ep.actorId)?.name ?? '(unknown)',
          encounterId: ep.encounterId,
          status: ep.status,
          startedTick: ep.startedTick,
          isThreaded: threadedIds.has(ep.actorId),
        }));

      const notifications = (encounterNotifications ?? [])
        .filter(n =>
          !agentFilter ||
          n.agentId.includes(agentFilter) ||
          n.agentName.toLowerCase().includes(agentFilter.toLowerCase()),
        )
        .map(n => ({
          agentId: n.agentId,
          agentName: n.agentName,
          encounterId: n.encounterId,
          courtPosition: n.courtPosition,
          viewed: n.viewed,
          resolved: n.resolved,
          autoResolveTick: n.autoResolveTick,
        }));

      return { threads, activeEncounters, notifications, tick: state.tick };
    },
    /** Returns rarity info for a node by id. Fail-soft: returns tier 1 defaults if node not found. */
    getRarityInfo: async (nodeId: string) => {
      const [rarityMod, constantsMod] = await Promise.all([
        import('./engine/rarity'),
        import('./data/rarity-constants'),
      ]);
      const graph = _graphProvider?.();
      const node = graph?.getNode(nodeId) ?? null;
      if (!node) {
        return {
          tier: 1,
          tierName: 'Mundane',
          importance: 0,
          graduationThreshold: constantsMod.RARITY_GRADUATION_THRESHOLDS[2],
        };
      }
      const tier = rarityMod.getRarityTier(node);
      const importance = typeof node.properties['importance'] === 'number'
        ? (node.properties['importance'] as number)
        : 0;
      const nextTier = (tier < 4 ? tier + 1 : null) as 2 | 3 | 4 | null;
      const graduationThreshold = nextTier !== null
        ? (constantsMod.RARITY_GRADUATION_THRESHOLDS[nextTier] ?? null)
        : null;
      const { RARITY_TIER_NAMES } = await import('./types/rarity');
      return {
        tier,
        tierName: RARITY_TIER_NAMES[tier],
        importance,
        graduationThreshold,
      };
    },
    /** Forces a node to graduate to the specified rarity tier. Fail-soft: returns failure if node not found. */
    forceGraduate: async (nodeId: string, tier: number) => {
      const [rarityMod, rarityTypes] = await Promise.all([
        import('./engine/rarity'),
        import('./types/rarity'),
      ]);
      const graph = _graphProvider?.();
      const node = graph?.getNode(nodeId) ?? null;
      if (!node) {
        return { success: false, message: `Node '${nodeId}' not found` };
      }
      const previousTier = rarityMod.getRarityTier(node);
      const clampedTier = rarityTypes.clampRarityTier(tier);
      const changed = rarityMod.graduateRarity(node, clampedTier);
      if (!changed) {
        return {
          success: false,
          message: `Node '${nodeId}' is already at tier ${previousTier} — no change (graduation never demotes)`,
          previousTier,
          newTier: previousTier,
        };
      }
      return {
        success: true,
        message: `Node '${nodeId}' graduated from tier ${previousTier} to tier ${clampedTier}`,
        previousTier,
        newTier: clampedTier,
      };
    },
    /**
     * Returns all attachments (possessions, conditions, powers, agreements) for an agent.
     * Accepts an agent id, id prefix, or partial name (case-insensitive). Returns null if not found.
     */
    getAgentAttachments: async (agentIdOrName: string) => {
      const graph = _graphProvider?.();
      if (!graph) return null;

      const actors = graph.getNodesByType('actor');
      const match =
        actors.find(n => n.id === agentIdOrName) ??
        actors.find(n => n.id.startsWith(agentIdOrName)) ??
        actors.find(n =>
          typeof n.name === 'string' && n.name.toLowerCase().includes(agentIdOrName.toLowerCase()),
        );

      if (!match) return null;

      const { getAgentAttachments: getAttachments } = await import('./engine/agentAttachments');
      return getAttachments(graph, match.id);
    },

    /** Returns the last n reward events (successful draws and empty-pool misses). Default: all retained. */
    getRecentRewards: (n?: number) =>
      import('./engine/rewardHistory').then((m) => m.getRecentRewards(n)),

    getTraces: () => import('./engine/traceBuffer').then((m) => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then((m) => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then((m) => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then((m) => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then((m) => m.clearTraces()),
    getCrashLog: () => import('./engine/tickHealthMonitor').then((m) => m.getCrashLog()),
    clearCrashLog: () => import('./engine/tickHealthMonitor').then((m) => m.clearCrashLog()),
    getHealthReport: () => import('./engine/tickHealthMonitor').then((m) => m.getLatestReport()),
    exportDiagnostics: () => import('./engine/tickHealthMonitor').then((m) => m.exportDiagnostics()),

    // Balance telemetry accessors
    /** Returns a BalanceRunSummary for the current session. endTick defaults to the current game tick. */
    getBalanceSummary: async (endTick?: number) => {
      const runtime = _runtimeProvider?.();
      if (!runtime?.balanceTelemetry) return null;
      const tick = endTick ?? (_gameStateProvider?.()?.tick ?? 0);
      const { buildBalanceRunSummary } = await import('./engine/balanceSummary');
      return buildBalanceRunSummary(runtime, tick);
    },
    /** Returns just the encounter-decision funnel summary for the current session. */
    getEncounterDecisionSummary: async (endTick?: number) => {
      const runtime = _runtimeProvider?.();
      if (!runtime?.balanceTelemetry) return null;
      const tick = endTick ?? (_gameStateProvider?.()?.tick ?? 0);
      const { buildBalanceRunSummary } = await import('./engine/balanceSummary');
      return buildBalanceRunSummary(runtime, tick)?.encounterDecisions ?? null;
    },
    /** Returns the current balance targets (versioned bands). */
    getBalanceTargets: async () => {
      const { getDefaultBalanceTargets } = await import('./engine/balanceTargets');
      return getDefaultBalanceTargets();
    },
    /** Evaluates the current session telemetry against balance targets. */
    getBalanceEvaluation: async (endTick?: number) => {
      const runtime = _runtimeProvider?.();
      if (!runtime?.balanceTelemetry) return null;
      const tick = endTick ?? (_gameStateProvider?.()?.tick ?? 0);
      const [summaryMod, evalMod, targetsMod] = await Promise.all([
        import('./engine/balanceSummary'),
        import('./engine/balanceEvaluator'),
        import('./engine/balanceTargets'),
      ]);
      const summary = summaryMod.buildBalanceRunSummary(runtime, tick);
      if (!summary) return null;
      const result = evalMod.evaluateBalanceSummary(summary, targetsMod.getDefaultBalanceTargets());
      return { summary, result };
    },
    /** Exports raw balance telemetry as a JSON-serializable snapshot. */
    exportBalanceTelemetry: async () => {
      const runtime = _runtimeProvider?.();
      if (!runtime) return null;
      const { exportBalanceTelemetry: exportFn } = await import('./engine/balanceTelemetry');
      return exportFn(runtime);
    },

    // Encounter log exports — returns TSV strings for writing to disk
    getEncounterLogAll: () =>
      Promise.all([
        import('./engine/encounterTimeline'),
        import('./engine/encounterLogExporter'),
      ]).then(([timeline, exporter]) => {
        const ids = timeline.getTrackedAgentIds();
        const agents = ids.map(id => ({
          id,
          name: id, // graph not available here — caller can enrich
          timeline: timeline.getTimeline(id),
        }));
        return {
          trackedAgentCount: ids.length,
          totalEvents: agents.reduce((sum, a) => sum + a.timeline.length, 0),
          agentIds: ids,
        };
      }),
    exportEncounterLogAll: (agentNames?: Record<string, string>, seed?: string) =>
      Promise.all([
        import('./engine/encounterTimeline'),
        import('./engine/encounterLogExporter'),
      ]).then(([timeline, exporter]) => {
        const ids = timeline.getTrackedAgentIds();
        const seedStr = seed ?? 'unknown';
        const agents = ids.map(id => ({
          id,
          name: agentNames?.[id] ?? id,
          timeline: timeline.getTimeline(id),
        }));
        return {
          allAgentsTsv: exporter.formatAllAgentsLog(agents, seedStr),
          allAgentsFilename: exporter.makeAllAgentsFilename(seedStr),
          perAgent: agents.map(a => ({
            id: a.id,
            name: a.name,
            tsv: exporter.formatEncounterLog(a.timeline, {
              agentId: a.id,
              agentName: a.name,
              seed: seedStr,
              tickRange: a.timeline.length > 0
                ? [a.timeline[0].tick, a.timeline[a.timeline.length - 1].tick] as [number, number]
                : [0, 0] as [number, number],
            }),
            filename: exporter.makeFilename(seedStr, a.name),
          })),
        };
      }),

    // Encounter cache diagnostics (THR-187)
    getEncounterCacheRebuildCount: () => {
      const runtime = _runtimeProvider?.();
      return runtime?.encounterCacheRebuildCount ?? 0;
    },
    getEncounterCacheRebuildTraces: async () => {
      const { getTraces } = await import('./engine/traceBuffer');
      const traces = getTraces();
      return traces.filter(t => t.category === 'encounter_cache_rebuild');
    },

    // Strategic action inspection
    getStrategicDecisionSummary: async (agentId?: string) => {
      const state = _gameStateProvider?.();
      if (!state) return null;
      const { getStrategicDecisionSummary } = await import('./engine/strategicTelemetry');
      return getStrategicDecisionSummary(state.strategicState, agentId);
    },
    getStrategicProjects: async () => {
      const state = _gameStateProvider?.();
      if (!state?.strategicState) return [];
      return state.strategicState.projects;
    },
    getStrategicHistory: async (agentId?: string) => {
      const state = _gameStateProvider?.();
      if (!state?.strategicState) return [];
      const history = state.strategicState.history;
      return agentId ? history.filter(h => h.actorId === agentId) : history;
    },

    // Composition phase runner inspection (THR-225)
    getActiveCompositions: () => {
      const state = _gameStateProvider?.();
      if (!state) return [];
      return state.activeCompositions ?? [];
    },
  };
}

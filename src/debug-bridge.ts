/**
 * Dev-only debug bridge — exposes engine internals on window.__DEBUG
 * for Playwright-driven QA and interactive debugging.
 *
 * Tree-shaken in production: import.meta.env.DEV is statically replaced
 * by Vite, so the entire module becomes dead code in prod builds.
 */
if (import.meta.env.DEV) {
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
    getTraces: () => import('./engine/traceBuffer').then((m) => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then((m) => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then((m) => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then((m) => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then((m) => m.clearTraces()),
    getCrashLog: () => import('./engine/tickHealthMonitor').then((m) => m.getCrashLog()),
    clearCrashLog: () => import('./engine/tickHealthMonitor').then((m) => m.clearCrashLog()),
    getHealthReport: () => import('./engine/tickHealthMonitor').then((m) => m.getLatestReport()),
    exportDiagnostics: () => import('./engine/tickHealthMonitor').then((m) => m.exportDiagnostics()),

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
  };
}

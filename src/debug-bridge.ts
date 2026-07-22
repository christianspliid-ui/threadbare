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
    /** Whether the sim run loop is active (THR-668 interrupt auto-pause verification). */
    simRunning: boolean;
  }

  interface ForeshadowingDebugResult {
    templateId: string;
    templateName: string;
    locationId: string;
    locationName: string;
    prose: string;
    /** Single-sentence tooltip render (THR-631); null on the authored path. */
    tooltipProse: string | null;
    variantId: string | null;
    resolvedAtTick: number;
    signals: import('./types/foreshadowing').ForeshadowingSignals;
    /** The Motive Receipt driving this foreshadowing (THR-631), or null. */
    receipt: import('./types/foreshadowing').MotiveReceipt | null;
    interventionAttribution: import('./types/foreshadowing').ForeshadowingInterventionAttribution | null;
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
    simRunning: false,
  });

  // React components register their debug-panel toggle here
  let _debugPanelToggle: ((open?: boolean) => void) | null = null;
  // GameView registers this to zoom + select an agent by id/name
  let _gotoAgent: ((id: string) => boolean) | null = null;
  // GameView registers these to list and fire actions
  interface ActionBridge {
    listActions: (agentId?: string) => import('./debug-bridge.d').DebugActionInfo[];
    fireAction: (agentId: string, templateId: string) => import('./debug-bridge.d').DebugFireResult;
    grantAction?: (actionId: string) => import('./debug-bridge.d').DebugGrantActionResult;
  }
  interface AftermathBridge {
    listAftermathReactions: (agentId: string) => import('./debug-bridge.d').DebugAftermathListResult;
    pickAftermathReaction: (agentId: string, reactionId?: string) => import('./debug-bridge.d').DebugAftermathPickResult;
  }
  interface BeatBridge {
    fireBeat: (beatId: string) => import('./debug-bridge.d').DebugFireBeatResult;
    grantUnlock: (actionId: string) => import('./debug-bridge.d').DebugGrantUnlockResult;
    resolveBeat: (chosenActionId?: string) => import('./debug-bridge.d').DebugResolveBeatResult;
  }
  // GameView registers the synchronous tick batch here (THR-689)
  let _tickBridge: ((n: number) => import('./debug-bridge.d').DebugTickResult) | null = null;
  let _actionBridge: ActionBridge | null = null;
  let _aftermathBridge: AftermathBridge | null = null;
  // GameView registers beat-director mutation callbacks here (THR-507)
  let _beatBridge: BeatBridge | null = null;
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
  // Thread story provider (THR-455)
  let _threadStoryProvider: ((agentRef: string) => import('./engine/threadDigest').ThreadStoryComposition | null) | null = null;

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
    /**
     * THR-689: advance the sim n ticks synchronously through the real runTick pipeline.
     * Bypasses the interval loop, which `document.hidden` throttles to ~1 tick per
     * interaction in an automated tab — making "run N ticks and observe X" checks
     * otherwise unreachable. Auto-pauses the run loop. Clamped to DEBUG_TICK_MAX (200).
     */
    tick: (n = 1) => {
      if (!_tickBridge) return { error: 'Game not loaded' };
      if (typeof n !== 'number' || !Number.isFinite(n) || Math.floor(n) < 1) {
        return { error: `tick(n): n must be a finite number >= 1, got ${String(n)}` };
      }
      return _tickBridge(n);
    },
    /** @internal GameView registers its synchronous tick batch here */
    _registerTickBridge: (fn: (n: number) => import('./debug-bridge.d').DebugTickResult) => { _tickBridge = fn; },
    listActions: (agentId?: string) => _actionBridge?.listActions(agentId) ?? [],
    fireAction: (agentId: string, templateId: string) =>
      _actionBridge?.fireAction(agentId, templateId) ?? { success: false, message: 'Game not loaded' },
    listStarterActions: async () => {
      const { STARTER_ACTION_IDS } = await import('./engine/actionUnlock');
      return [...STARTER_ACTION_IDS];
    },
    listLockedActions: async () => {
      const [{ UNIFIED_ACTION_TEMPLATES }, { STARTER_ACTION_IDS }] = await Promise.all([
        import('./data/unified-action-templates'),
        import('./engine/actionUnlock'),
      ]);
      const state = _gameStateProvider?.();
      const unlocked = new Set(state?.unlockedActionIds ?? []);
      const starters = new Set(STARTER_ACTION_IDS);
      return UNIFIED_ACTION_TEMPLATES
        .filter((template) => !starters.has(template.id) && !unlocked.has(template.id))
        .map((template) => ({
          id: template.id,
          name: template.name,
          rarityTier: template.rarityTier,
        }));
    },
    grantAction: async (actionId: string) =>
      _actionBridge?.grantAction?.(actionId) ?? { success: false, message: 'Game not loaded' },
    _registerActionBridge: (cb) => { _actionBridge = cb as ActionBridge; },
    listAftermathReactions: (agentId: string) =>
      _aftermathBridge?.listAftermathReactions(agentId) ?? { reactions: [], error: 'Game not loaded' },
    pickAftermathReaction: (agentId: string, reactionId?: string) =>
      _aftermathBridge?.pickAftermathReaction(agentId, reactionId) ?? { success: false, message: 'Game not loaded' },
    _registerAftermathBridge: (cb) => { _aftermathBridge = cb as AftermathBridge; },
    /** @internal GameView registers its graph provider here */
    _registerGraphProvider: (fn: () => import('./engine/graph').WorldGraph | null) => { _graphProvider = fn; },
    /** @internal GameView registers a provider for the live GameState here */
    _registerGameStateProvider: (fn: () => import('./types/gameState').GameState | null) => { _gameStateProvider = fn; },
    /** @internal GameView registers the SimulationRuntime provider for balance telemetry access */
    _registerRuntimeProvider: (fn: () => import('./engine/simulationRuntime').SimulationRuntime | null) => { _runtimeProvider = fn; },
    /** Compose and return the story-so-far for an agent by id, id prefix, or partial name (THR-455). Returns null if not available. */
    getThreadStory: (agentRef: string) => _threadStoryProvider?.(agentRef) ?? null,
    /** @internal GameView registers the thread story provider here */
    _registerThreadStoryProvider: (fn: (agentRef: string) => import('./engine/threadDigest').ThreadStoryComposition | null) => { _threadStoryProvider = fn; },
    /** @internal GameView registers encounter spawn / world-spawn callbacks here */
    _registerEncounterBridge: (cb: Record<string, (...args: unknown[]) => unknown>) => { _encounterBridge = cb; },
    toggleFog: () => _fogToggle?.() ?? false,
    setFog: (enabled: boolean) => { _fogToggle?.(enabled); },
    _registerFogToggle: (fn: (enabled?: boolean) => boolean) => { _fogToggle = fn; },

    // ── Schism inspection (THR-430) ──────────────────────────────────────
    schism: {
      list: () => {
        const state = _gameStateProvider?.();
        if (!state) return [];
        return state.graph.getNodesByType('actor')
          .filter(n =>
            n.properties?.actorType === 'faction' &&
            typeof n.properties?.schismPendingResolutionTick === 'number'
          )
          .map(n => ({
            factionId: n.id,
            factionName: n.name ?? 'faction',
            plantedTick: n.properties?.schismPlantedTick as number | undefined,
            resolutionTick: n.properties?.schismPendingResolutionTick as number,
            ticksRemaining: Math.max(
              0,
              (n.properties?.schismPendingResolutionTick as number) - state.tick,
            ),
            actorAgentId: n.properties?.schismActorAgentId as string | undefined,
            baselineCohesion: n.properties?.schismBaselineCohesion as number | undefined,
          }));
      },
    },

    // ── Essence Sources — Divine Economy (THR-611) ─────────────────────────
    /**
     * List the ascendant's controlled essence sources with their tier, kind,
     * sphere typing, and private sanctity — plus the typed per-sphere income
     * breakdown. Read-only; returns { sources, sourceIncome } or { error }.
     */
    getEssenceSources: async () => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const { readEssenceSource, computeSourceIncome } = await import('./engine/essenceSources');
      const graph = state.graph;
      const ascId = state.ascendantId;
      const sources = graph
        .getOutgoingEdges(ascId, 'controls')
        .map((edge) => {
          const host = graph.getNode(edge.target);
          const src = readEssenceSource(host?.properties);
          if (!host || !src) return null;
          return {
            hostId: host.id,
            hostName: host.name ?? host.id,
            kind: src.kind,
            tier: src.tier,
            sphereAffinity: src.sphereAffinity ?? null,
            sanctity: src.sanctity,
            contestedBy: src.contestedBy ?? null,
            desecrated: !!src.desecrated,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      return { sources, sourceIncome: computeSourceIncome(graph, ascId) };
    },

    /**
     * Player action progression readout (THR-613 §3.6): per permanent reach, the
     * ascendant's accrued reach practice, live Domain Capability + tier, last-fired
     * tier snapshot, and whether a Deepening beat is pending. Read-only; returns
     * { reaches, pendingBeatId } or { error }.
     */
    getAscendantProgression: async () => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const { getAscendantProgress } = await import('./engine/phaseAscendantProgression');
      const progress = getAscendantProgress(state);
      if (!progress) return { error: 'no ascendant found' };
      return progress;
    },

    /**
     * Entity Visual resolver readout (THR-637): given a node id or name (exact →
     * partial-id → case-insensitive partial-name), return the resolver's decision
     * — tier, chosen source, gradient index, kind. Answers "why is this showing a
     * fallback?" in one call. For location nodes, terrain is read from the hex tile
     * so the concept-art landscape resolves exactly as it does on screen. Read-only.
     */
    resolveEntityVisual: async (ref: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const graph = state.graph;
      const candidates = [
        ...graph.getNodesByType('actor'),
        ...graph.getNodesByType('location'),
        ...graph.getNodesByType('artifact'),
        ...graph.getNodesByType('artifact_legendary'),
      ];
      const lower = ref.toLowerCase();
      const node =
        graph.getNode(ref) ??
        candidates.find((n) => n.id.startsWith(ref)) ??
        candidates.find((n) => n.name?.toLowerCase().includes(lower));
      if (!node) return { error: `no node matching "${ref}"` };
      const { resolveEntityVisual } = await import('./components/shared/entityVisualResolver');
      // Best-effort terrain for location nodes so the landscape resolves on-screen.
      let terrain: import('./types').TerrainType | undefined;
      const col = node.properties?.hexCol;
      const row = node.properties?.hexRow;
      if (typeof col === 'number' && typeof row === 'number') {
        terrain = state.tiles.find((t) => t.coord.col === col && t.coord.row === row)?.terrain;
      }
      const descriptor = resolveEntityVisual({ id: node.id, name: node.name }, graph, { terrain });
      return { matchedId: node.id, matchedName: node.name, descriptor };
    },

    /**
     * List the god's active sustained controls ("covenants", THR-613 §5.A): the
     * effectIds, target, and per-tick cost/income the Covenants panel renders. Includes
     * any ids already queued for release this tick (`pendingReleases`). Read-only.
     */
    listControlEffects: () => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const owner = state.ascendantId;
      const covenants = (state.controlEffects ?? [])
        .filter((e) => e.active && e.ownerId === owner)
        .map((e) => ({
          effectId: e.effectId,
          templateId: e.templateId,
          targetNodeId: e.targetNodeId,
          contested: !!e.encounterNodeId,
          hasCost: Object.values(e.perTickCost).some((v) => (v ?? 0) > 0),
        }));
      return { covenants, pendingReleases: state.pendingControlReleases ?? [] };
    },

    /**
     * Queue a voluntary release of a sustained control (THR-613 §3.4). Mirrors the
     * Covenants panel's Release button headlessly: enqueues the effectId; the next
     * tick's phaseControlEffects lapses it as 'voluntarily_released'. Advance one tick
     * to see the panel row disappear (the queue is consumed there). Returns the queue.
     */
    releaseControl: (effectId: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const exists = (state.controlEffects ?? []).some((e) => e.effectId === effectId && e.active);
      state.pendingControlReleases = [...(state.pendingControlReleases ?? []), effectId];
      return { success: true, effectId, matchedActiveEffect: exists, pendingReleases: state.pendingControlReleases };
    },

    // ── Encounter step-prose replay records (THR-636) ───────────────────────
    /**
     * Return the captured per-step replay records for an agent's active (or
     * most-recent) unified-action encounter. Resolves the agent by exact id,
     * id prefix, then case-insensitive partial name — same notes as gotoAgent.
     */
    getStepProse: (agentRef: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const graph = state.graph;
      const ref = agentRef.trim();
      const lc = ref.toLowerCase();
      const actors = graph.getNodesByType('actor');
      const actor =
        actors.find(n => n.id === ref) ??
        actors.find(n => n.id.startsWith(ref)) ??
        actors.find(n => (n.name ?? '').toLowerCase().includes(lc));
      if (!actor) return { error: `no actor matched "${agentRef}"` };
      const actions = state.unifiedActions ?? [];
      const action =
        actions.find(a => a.actorId === actor.id && !a.resolved) ??
        actions.find(a => a.actorId === actor.id);
      if (!action) return { error: `no unified action for ${actor.name ?? actor.id}` };
      const records = (action.stepProseHistory ?? []) as import('./types/stepProseRecord').StepProseRecord[];
      return { actionId: action.actionId, actorName: actor.name ?? actor.id, records };
    },

    /**
     * THR-694 — scene-context readout for an agent's active (or most-recent) unified
     * action: the resolved scene target (id / name / kind / actor→target relation) and
     * the bound support cast. The DoD state-assertion hook for the Scene Integration
     * slices ("is the scene wired?"). Resolves the agent by exact id, id prefix, then
     * case-insensitive partial name — same notes as gotoAgent. Read-only.
     */
    inspectSceneContext: async (agentRef: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { error: 'no live game state' };
      const graph = state.graph;
      const ref = agentRef.trim();
      const lc = ref.toLowerCase();
      const actors = graph.getNodesByType('actor');
      const actor =
        actors.find(n => n.id === ref) ??
        actors.find(n => n.id.startsWith(ref)) ??
        actors.find(n => (n.name ?? '').toLowerCase().includes(lc));
      if (!actor) return { error: `no actor matched "${agentRef}"` };
      const actions = state.unifiedActions ?? [];
      const action =
        actions.find(a => a.actorId === actor.id && !a.resolved) ??
        actions.find(a => a.actorId === actor.id);
      if (!action) return { error: `no unified action for ${actor.name ?? actor.id}` };
      const { resolveSceneTargetContext, resolveSceneCastContext } =
        await import('./engine/proseEnrichment');
      const target = resolveSceneTargetContext(graph, actor.id, action.targetId);
      const bindings = (action.supportBindings ?? []).map(b => ({
        key: b.key,
        nodeId: b.nodeId,
        name: graph.getNode(b.nodeId)?.name ?? null,
        reused: b.reused,
      }));
      // THR-696 — the cast block prose actually sees: every declared key, resolved to the
      // bound entity's live name or the spec's authored fallback. `bindings` above is the
      // raw binding list; `cast` is what `{cast:<key>}` renders.
      const { getUnifiedTemplateById } = await import('./data/unified-action-templates');
      const template = getUnifiedTemplateById(action.templateId);
      const cast = resolveSceneCastContext(graph, template?.supportBundle, action.supportBindings);
      return {
        actionId: action.actionId,
        templateId: action.templateId,
        targetId: action.targetId,
        targetName: target?.name ?? null,
        targetKind: target?.kind ?? null,
        relation: target?.relation ?? null,
        bindings,
        cast: cast ?? null,
      };
    },

    // ── Ascendant Beats — Divine Cadence (THR-507) ──────────────────────────
    listBeats: async () => {
      const { ASCENDANT_SPINE, ASCENDANT_BEAT_POOL } = await import('./data/ascendant-beat-content');
      const { ALL_DELIVERY_BEATS } = await import('./engine/deliveryBeatAdapter');
      const map = (
        defs: readonly import('./types/ascendantBeat').BeatDefinition[],
        source: 'spine' | 'pool' | 'delivery',
      ) =>
        defs.map((d) => ({
          beatId: d.beatId,
          kind: d.kind,
          source,
          triggerKind: d.trigger.kind,
          minTurn: d.trigger.minTurn ?? null,
          templateId: d.templateId ?? null,
          grantsActionIds: [...(d.grantsActionIds ?? [])],
          weight: d.weight ?? null,
        }));
      return [
        ...map(ASCENDANT_SPINE, 'spine'),
        ...map(ASCENDANT_BEAT_POOL, 'pool'),
        ...map(ALL_DELIVERY_BEATS, 'delivery'),
      ];
    },
    beatSchedule: async () => {
      const { ASCENDANT_SPINE, ASCENDANT_BEAT_POOL } = await import('./data/ascendant-beat-content');
      const { eligibleDeliveryBeats } = await import('./engine/deliveryBeatAdapter');
      const state = _gameStateProvider?.();
      const beats = state?.ascendantBeats;
      if (!state || !beats) {
        return {
          available: false,
          turn: state?.tick ?? 0,
          spineCursor: -1,
          spineLength: ASCENDANT_SPINE.length,
          nextSpineBeatId: null,
          lastBeatTurn: 0,
          pending: null,
          eligiblePool: ASCENDANT_BEAT_POOL.map((b) => b.beatId),
          poolSize: ASCENDANT_BEAT_POOL.length,
          runUnlockedActionIds: [...(state?.unlockedActionIds ?? [])],
          history: [],
        };
      }
      const nextSpineBeatId =
        beats.spineCursor >= 0 && beats.spineCursor < ASCENDANT_SPINE.length
          ? ASCENDANT_SPINE[beats.spineCursor].beatId
          : null;
      // The Director draws from the base pool merged with delivery beats not yet
      // delivered this run (THR-506) — reflect that combined set honestly.
      const eligiblePoolIds = [
        ...ASCENDANT_BEAT_POOL.map((b) => b.beatId),
        ...eligibleDeliveryBeats(beats.history.map((h) => h.beatId)).map((b) => b.beatId),
      ];
      return {
        available: true,
        turn: state.tick,
        spineCursor: beats.spineCursor,
        spineLength: ASCENDANT_SPINE.length,
        nextSpineBeatId,
        lastBeatTurn: beats.lastBeatTurn,
        pending: beats.pending
          ? {
            beatId: beats.pending.beatId,
            kind: beats.pending.kind,
            offeredTurn: beats.pending.offeredTurn,
            triggerKind: beats.pending.trigger.kind,
            // THR-522: the Director-bound subject(s) (e.g. the introduced culture/faction),
            // with resolved names so the inspector can show what the beat will name.
            boundNodeIds: [...beats.pending.boundNodeIds],
            boundNames: beats.pending.boundNodeIds.map((id) => state.graph.getNode(id)?.name ?? id),
          }
          : null,
        eligiblePool: eligiblePoolIds,
        poolSize: eligiblePoolIds.length,
        runUnlockedActionIds: [...(state.unlockedActionIds ?? [])],
        history: beats.history.map((h) => ({
          beatId: h.beatId,
          kind: h.kind,
          resolvedTurn: h.resolvedTurn,
          outcome: h.outcome,
          grantedActionIds: [...h.grantedActionIds],
        })),
      };
    },
    fireBeat: (beatId: string) =>
      _beatBridge?.fireBeat(beatId) ?? { success: false, message: 'Game not loaded' },
    grantUnlock: (actionId: string) =>
      _beatBridge?.grantUnlock(actionId) ?? { success: false, message: 'Game not loaded' },
    resolveBeat: (chosenActionId?: string) =>
      _beatBridge?.resolveBeat(chosenActionId) ?? { success: false, message: 'Game not loaded' },
    /** @internal GameView registers its beat bridge here */
    _registerBeatBridge: (cb) => { _beatBridge = cb as BeatBridge; },

    // ── Reach signatures — map signifiers + surfacing (THR-554) ─────────────
    /**
     * List the eight reach signatures with their run-unlock status and the
     * ascendant's primary-sphere power multiplier. The three engine-backed
     * signatures (iron/warhost, veil/rift, stone/wonder) leave an on-map
     * footprint rendered by the reach-signature signifier layer.
     */
    listSignatures: async () => {
      const [{ REACH_SIGNATURE_CONTENT_TEMPLATES }, { spherePowerMultiplier }, { getAscendantPrimarySphere }] =
        await Promise.all([
          import('./data/reach-signature-content'),
          import('./engine/sphereScaling'),
          import('./engine/ascendantExpression'),
        ]);
      const state = _gameStateProvider?.();
      const graph = _graphProvider?.();
      const unlocked = new Set(state?.unlockedActionIds ?? []);
      const ENGINE_BACKED = new Set(['iron', 'veil', 'stone']);
      const primarySphere = state && graph ? getAscendantPrimarySphere(graph, state.ascendantId) : undefined;
      const scores = state && graph
        ? (graph.getNode(state.ascendantId)?.properties.sphereAffinity as { scores?: Record<string, number> } | undefined)?.scores
        : undefined;
      const sphereScore = (primarySphere && scores?.[primarySphere]) ?? 0;
      const primaryMultiplier = spherePowerMultiplier(sphereScore);
      return {
        primarySphere: primarySphere ?? null,
        sphereScore,
        primaryMultiplier,
        runUnlockedActionIds: [...unlocked],
        signatures: REACH_SIGNATURE_CONTENT_TEMPLATES.map((t) => ({
          reach: t.reach,
          templateId: t.id,
          name: t.name,
          unlocked: unlocked.has(t.id),
          engineBacked: ENGINE_BACKED.has(t.reach),
        })),
      };
    },
    /**
     * Fire a reach signature (dev/QA): grant its unlock so it enters
     * runUnlockedActionIds, and — for the three engine-backed reaches — mint a
     * minimal on-map footprint (warhost actor / rift control effect / unique
     * location) matching the reach-signature marker detection contract, so the
     * signifier renders for visual verification. Returns the sphere-scaled
     * magnitude the signature would resolve with. Advance one tick to force a
     * re-render if the sim is paused.
     */
    fireSignature: async (reach: string) => {
      const state = _gameStateProvider?.();
      const graph = _graphProvider?.();
      const runtime = _runtimeProvider?.();
      if (!state || !graph) return { success: false, message: 'Game not loaded' };

      const [
        { REACH_SIGNATURE_CONTENT_TEMPLATES, SIGNATURE_BESPOKE_BASE_VALUE, GREAT_WORK_UNIQUE_TAG },
        { spherePowerMultiplier },
        { getAscendantPrimarySphere },
        { touchWorld, touchStructure },
        { UNIQUE_LOCATION_GENERATOR },
      ] = await Promise.all([
        import('./data/reach-signature-content'),
        import('./engine/sphereScaling'),
        import('./engine/ascendantExpression'),
        import('./engine/simulationRuntime'),
        import('./engine/reachSignatureMarkers'),
      ]);

      const template = REACH_SIGNATURE_CONTENT_TEMPLATES.find((t) => t.reach === reach);
      if (!template) return { success: false, message: `No reach signature for reach '${reach}'` };

      // 1. Grant the unlock → runUnlockedActionIds. The grant applies via a
      //    React state update, so `state.unlockedActionIds` read synchronously
      //    below is stale — trust the grant result for the `unlocked` field.
      const grant = _beatBridge?.grantUnlock(template.id);

      // 2. Sphere-scaled magnitude (real scaling).
      const primarySphere = getAscendantPrimarySphere(graph, state.ascendantId);
      const scores = (graph.getNode(state.ascendantId)?.properties.sphereAffinity as { scores?: Record<string, number> } | undefined)?.scores;
      const sphereScore = (primarySphere && scores?.[primarySphere]) ?? 0;
      const multiplier = spherePowerMultiplier(sphereScore);
      const scaledMagnitude = multiplier * SIGNATURE_BESPOKE_BASE_VALUE;

      // 3. Materialize a minimal footprint for the engine-backed reaches (DEV only).
      const baseLoc = graph.getNodesByType('location').find(
        (n) => typeof n.properties.hexCol === 'number' && typeof n.properties.hexRow === 'number',
      );
      let materialized: { kind: string; id: string; hexCol: number; hexRow: number } | null = null;
      if (baseLoc && (reach === 'iron' || reach === 'veil' || reach === 'stone')) {
        const baseCol = baseLoc.properties.hexCol as number;
        const baseRow = baseLoc.properties.hexRow as number;
        if (reach === 'iron') {
          const armyId = `debug_warhost_${state.tick}`;
          if (!graph.getNode(armyId)) {
            graph.addNode({ id: armyId, type: 'actor', name: 'Debug Warhost', properties: { actorType: 'group', warhost: true } });
            graph.addEdge({ id: `located_at_${armyId}`, source: armyId, target: baseLoc.id, type: 'located_at', properties: {} });
          }
          materialized = { kind: 'warhost', id: armyId, hexCol: baseCol, hexRow: baseRow };
        } else if (reach === 'veil') {
          const effectId = `debug_rift_${state.tick}`;
          const riftEffect = {
            effectId, templateId: template.id, ownerId: state.ascendantId,
            targetHexCol: baseCol, targetHexRow: baseRow + 2, targetNodeId: baseLoc.id,
            establishedTick: state.tick, ritualEssenceInvested: 0,
            perTickCost: {}, perTickMutations: [], perTickGraphOps: [],
            perTickSphereInfluence: { sphere: primarySphere ?? 'mind', magnitude: scaledMagnitude, cap: 100 },
            active: true, ticksActive: 0,
            narrativeTemplates: { established: 'Debug rift.', active: 'Debug rift.', lapsed: 'Debug rift.' },
          } as import('./types/controlEffect').ControlEffect;
          state.controlEffects = [...(state.controlEffects ?? []).filter((e) => e.effectId !== effectId), riftEffect];
          materialized = { kind: 'rift', id: effectId, hexCol: baseCol, hexRow: baseRow + 2 };
        } else {
          const wonderId = `debug_wonder_${state.tick}`;
          if (!graph.getNode(wonderId)) {
            graph.addNode({
              id: wonderId, type: 'location', name: 'The Great Work (debug)',
              properties: {
                hexCol: baseCol + 2, hexRow: baseRow, locationSubtype: 'master_forge', locationType: 'master_forge',
                unique: true, uniqueTag: GREAT_WORK_UNIQUE_TAG, generatedBy: UNIQUE_LOCATION_GENERATOR,
              },
            });
          }
          materialized = { kind: 'wonder', id: wonderId, hexCol: baseCol + 2, hexRow: baseRow };
        }
        if (runtime) { touchWorld(runtime); touchStructure(runtime); }
      }

      return {
        success: true,
        reach,
        templateId: template.id,
        unlocked: grant?.success === true || (state.unlockedActionIds ?? []).includes(template.id),
        primarySphere: primarySphere ?? null,
        sphereScore,
        multiplier,
        scaledMagnitude,
        materialized,
      };
    },

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

    setHomeSeat: (locationRef?: string): import('./engine/influence').SetHomeSeatResult =>
      (_encounterBridge?.setHomeSeat as ((...a: unknown[]) => import('./engine/influence').SetHomeSeatResult) | undefined)?.(locationRef)
      ?? { success: false, locationId: null, locationName: null, message: 'Encounter bridge not registered' },

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

    /**
     * THR-479: list the ascendant's Aspects (apex milestone beyond the five
     * tiers). Returns living Aspects and mythic echoes (dead Aspects whose bond
     * endures). Empty array if the game isn't loaded or there are none.
     */
    getAspects: () => {
      const graph = _graphProvider?.();
      const state = _gameStateProvider?.();
      if (!graph || !state) return [];
      return graph.getOutgoingEdges(state.ascendantId, 'aspect_of').map(edge => {
        const mortal = graph.getNode(edge.target);
        const props = edge.properties as Record<string, unknown>;
        return {
          ascendantId: edge.source,
          mortalId: edge.target,
          mortalName: mortal?.name ?? '(removed)',
          attainedTick: (props.attainedTick as number) ?? null,
          sourceTier: (props.sourceTier as number) ?? null,
          mythicEcho: props.mythicEcho === true,
          echoedTick: (props.echoedTick as number) ?? null,
        };
      });
    },

    /**
     * THR-479 (dev/QA only): grant the Aspect apex to a threaded mortal without
     * waiting for the natural apotheosis. Accepts an agent id, id prefix, or
     * partial name. Touches the world so the UI badge refreshes. Returns the
     * grant result, or null if the game isn't loaded / mortal not found.
     */
    grantAspectDebug: async (mortalIdOrName: string) => {
      const graph = _graphProvider?.();
      const state = _gameStateProvider?.();
      const runtime = _runtimeProvider?.();
      if (!graph || !state) return null;
      const actors = graph.getNodesByType('actor');
      const match =
        actors.find(n => n.id === mortalIdOrName) ??
        actors.find(n => n.id.startsWith(mortalIdOrName)) ??
        actors.find(n => typeof n.name === 'string' && n.name.toLowerCase().includes(mortalIdOrName.toLowerCase()));
      if (!match) return null;
      const { grantAspect } = await import('./engine/aspects');
      return grantAspect(graph, { mortalId: match.id, tick: state.tick, originEncounterId: 'debug.grant' }, runtime ?? undefined);
    },

    /**
     * THR-401: inspect a location's THR-401 properties (population health,
     * divine presence, active time-bounded flags). Accepts a location id,
     * id prefix, or partial name. Returns null if not found.
     */
    inspectLocation: (idOrName: string) => {
      const graph = _graphProvider?.();
      const state = _gameStateProvider?.();
      if (!graph) return null;
      const locations = graph.getNodesByType('location');
      const match =
        locations.find(n => n.id === idOrName) ??
        locations.find(n => n.id.startsWith(idOrName)) ??
        locations.find(n =>
          typeof n.name === 'string' && n.name.toLowerCase().includes(idOrName.toLowerCase()),
        );
      if (!match) return null;
      const props = match.properties;
      const tick = state?.tick ?? 0;
      const numericOrNull = (v: unknown): number | null =>
        typeof v === 'number' ? v : null;
      return {
        id: match.id,
        name: match.name,
        subtype: typeof props.locationSubtype === 'string' ? props.locationSubtype : null,
        prosperity: numericOrNull(props.prosperity),
        unrest: numericOrNull(props.unrest),
        populationHealth: numericOrNull(props.populationHealth),
        divinePresence: numericOrNull(props.divinePresence),
        magicalSaturation: numericOrNull(props.magicalSaturation),
        routesCursedUntilTick: numericOrNull(props.routesCursedUntilTick),
        wellsSickenedUntilTick: numericOrNull(props.wellsSickenedUntilTick),
        migrationPullUntilTick: numericOrNull(props.migrationPullUntilTick),
        placeSpiritAwakenedAtTick: numericOrNull(props.placeSpiritAwakenedAtTick),
        routesCursedActive: typeof props.routesCursedUntilTick === 'number' && tick < (props.routesCursedUntilTick as number),
        wellsSickenedActive: typeof props.wellsSickenedUntilTick === 'number' && tick < (props.wellsSickenedUntilTick as number),
        currentTick: tick,
      };
    },

    /**
     * THR-401: force a location countdown property to expire immediately
     * (deletes the property). Used by tests and browser-verify to assert
     * the consuming phase clears the flag.
     */
    forceLocationCountdownExpire: (
      idOrName: string,
      property: 'routesCursedUntilTick' | 'wellsSickenedUntilTick' | 'migrationPullUntilTick',
    ): boolean => {
      const graph = _graphProvider?.();
      if (!graph) return false;
      const locations = graph.getNodesByType('location');
      const match =
        locations.find(n => n.id === idOrName) ??
        locations.find(n => n.id.startsWith(idOrName)) ??
        locations.find(n =>
          typeof n.name === 'string' && n.name.toLowerCase().includes(idOrName.toLowerCase()),
        );
      if (!match) return false;
      if (match.properties[property] === undefined) return false;
      delete match.properties[property];
      return true;
    },

    /** Returns the last n reward events (successful draws and empty-pool misses). Default: all retained. */
    getRecentRewards: (n?: number) =>
      import('./engine/rewardHistory').then((m) => m.getRecentRewards(n)),
    /** Resolve encounter foreshadowing prose for an agent's latest ranked encounter candidate. */
    getForeshadowing: async (agentQuery: string, templateQuery?: string) => {
      const state = _gameStateProvider?.();
      const runtime = _runtimeProvider?.();
      if (!state || !runtime?.balanceTelemetry) return null;

      const actors = state.graph.getNodesByType('actor');
      const agent = actors.find(n =>
        n.id === agentQuery
        || n.id.startsWith(agentQuery)
        || n.name.toLowerCase().includes(agentQuery.toLowerCase())
      );
      if (!agent) return null;

      const decision = runtime.balanceTelemetry.latestEncounterDecisionByAgent.get(agent.id);
      if (!decision) return null;

      const pool = decision.rankedEncounterPool ?? [];
      if (pool.length === 0) return null;

      const candidate = templateQuery
        ? (pool.find(item =>
          item.templateId === templateQuery
          || item.templateId.includes(templateQuery)
          || item.templateName.toLowerCase().includes(templateQuery.toLowerCase())
        ) ?? null)
        : pool[0];
      if (!candidate) return null;

      const { getEncounterForeshadowing } = await import('./engine/foreshadowing/encounterForeshadowing');
      const { readMotiveReceipt } = await import('./engine/foreshadowing/receiptRead');
      const result = getEncounterForeshadowing({
        runtime,
        graph: state.graph,
        tick: state.tick,
        agentId: agent.id,
        decision,
        candidate,
      });
      const receipt = readMotiveReceipt(agent, candidate.templateId, candidate.locationId);

      return {
        templateId: candidate.templateId,
        templateName: candidate.templateName,
        locationId: candidate.locationId,
        locationName: candidate.locationName,
        prose: result.prose,
        tooltipProse: result.tooltipProse ?? null,
        variantId: result.variantId,
        resolvedAtTick: result.resolvedAtTick,
        signals: result.signals,
        receipt,
        interventionAttribution: result.interventionAttribution,
      } satisfies ForeshadowingDebugResult;
    },

    /**
     * THR-631: return the raw Motive Receipt an agent's most recent encounter
     * selection emitted — the ranked decision-causality contributions the scorer
     * computed. Accepts an actor id, id prefix, or partial name. Returns null if
     * no agent matches or the agent has not selected an encounter yet.
     */
    getMotiveReceipt: (agentQuery: string) => {
      const state = _gameStateProvider?.();
      if (!state) return null;
      const actors = state.graph.getNodesByType('actor');
      const agent = actors.find(n =>
        n.id === agentQuery
        || n.id.startsWith(agentQuery)
        || n.name.toLowerCase().includes(agentQuery.toLowerCase())
      );
      if (!agent) return null;
      return (agent.properties?.motiveReceipt as import('./types/foreshadowing').MotiveReceipt | undefined) ?? null;
    },

    /** Returns the current encounter novelty record (surface-keyed since THR-475). Keys are surfaceKeys; values are last-selected tick. */
    getEncounterNoveltyRecord: () => {
      const state = _gameStateProvider?.();
      return state?.encounterNoveltyRecord ?? null;
    },

    getTraces: () => import('./engine/traceBuffer').then((m) => m.getTraces()),
    enableTracing: () => import('./engine/traceBuffer').then((m) => m.enableTracing()),
    disableTracing: () => import('./engine/traceBuffer').then((m) => m.disableTracing()),
    isTracingEnabled: () => import('./engine/traceBuffer').then((m) => m.isTracingEnabled()),
    clearTraces: () => import('./engine/traceBuffer').then((m) => m.clearTraces()),
    // Tick-loop profiling (THR-580): timing ring + per-phase aggregate.
    enableProfiling: () => import('./engine/traceBuffer').then((m) => m.enableProfiling()),
    disableProfiling: () => import('./engine/traceBuffer').then((m) => m.disableProfiling()),
    getPhaseTimings: (windowTicks?: number) =>
      import('./engine/traceBuffer').then((m) => m.aggregatePhaseTimings(m.getTimingTraces(), windowTicks)),
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

    // Chapter archive (THR-603) — resolved encounter chapters, always readable.
    // Optional filter matches actor id/name, template id, or a participant id/name.
    getChapterArchive: (filter?: string) => {
      const state = _gameStateProvider?.();
      const archive = state?.chapterArchive ?? [];
      const needle = filter?.toLowerCase();
      const records = needle
        ? archive.filter(
            r =>
              r.actorId === filter ||
              r.actorId.includes(filter!) ||
              r.actorName.toLowerCase().includes(needle) ||
              r.templateId.toLowerCase().includes(needle) ||
              r.participants.some(
                p => p.id === filter || p.name.toLowerCase().includes(needle),
              ),
          )
        : archive;
      return { count: records.length, records };
    },

    /**
     * THR-571 U1: live outcome-ladder distribution + KPI threshold verdicts.
     * The instrument for the outcome-ladder design call — see the live clean/at-cost/
     * crit split and each band's green/amber/red status without a screenshot.
     *
     * `windowTicks` (optional) restricts the resolved-action histogram to actions
     * completed within the last N ticks (via `completedAtTick`). Cumulative-counter rows
     * (branching fires, failure→story rate) stay lifetime — mirroring computeGameplayKpiReport,
     * which already prefers the runtime's session counters over the pruned action window.
     */
    getOutcomeDistribution: async (windowTicks?: number) => {
      const state = _gameStateProvider?.();
      if (!state) return null;
      const runtime = _runtimeProvider?.() ?? null;
      const { computeGameplayKpiReport } = await import('./engine/kpi/gameplayKpi');
      let view = state;
      if (windowTicks !== undefined && windowTicks > 0) {
        const cutoff = (state.tick ?? 0) - windowTicks;
        view = {
          ...state,
          unifiedActions: (state.unifiedActions ?? []).filter(
            a => !a.resolved || (a.completedAtTick ?? a.startTick) >= cutoff,
          ),
        };
      }
      const report = computeGameplayKpiReport(view, runtime);
      return {
        tick: report.tick,
        seed: report.seed,
        outcomes: report.outcomes,
        thresholds: report.thresholds,
      };
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
    /** Returns all foreshadowing traces (optionally narrowed to one agent query). */
    listForeshadowingTraces: async (agentQuery?: string) => {
      const { getTraces } = await import('./engine/traceBuffer');
      const traces = getTraces().filter(t => t.category === 'foreshadowing');
      if (!agentQuery) return traces;

      const state = _gameStateProvider?.();
      if (!state) return traces.filter(t => t.agentId === agentQuery || t.agentId?.startsWith(agentQuery));
      const actors = state.graph.getNodesByType('actor');
      const agent = actors.find(n =>
        n.id === agentQuery
        || n.id.startsWith(agentQuery)
        || n.name.toLowerCase().includes(agentQuery.toLowerCase())
      );
      if (!agent) return [];
      return traces.filter(t => t.agentId === agent.id);
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

    // Gameplay KPI report (THR-457)
    getKpiReport: async () => {
      const state = _gameStateProvider?.();
      const runtime = _runtimeProvider?.();
      if (!state) return null;
      const { computeGameplayKpiReport } = await import('./engine/kpi/gameplayKpi');
      return computeGameplayKpiReport(state, runtime ?? null);
    },

    // THR-460: outcome band phrase usage inspection
    bandPhraseUsage: (actorId?: string) => {
      const runtime = _runtimeProvider?.();
      if (!runtime) return null;
      if (actorId) return runtime.outcomeBandPhraseHistory.get(actorId) ?? null;
      return runtime.outcomeBandPhraseHistory;
    },

    // Phase 6: consequence inspection (THR-63)
    consequencesFor: async (actorRef: string, last = 10) => {
      const { getTraces } = await import('./engine/traceBuffer');
      const state = _gameStateProvider?.();
      const allTraces = getTraces();
      // Resolve actorRef: exact id or partial name match
      let actorId = actorRef;
      if (state) {
        const node = state.graph.getNode(actorRef) ?? state.graph.getAllNodes()
          .filter(n => n.type === 'actor')
          .find(n => n.name?.toLowerCase().includes(actorRef.toLowerCase()));
        if (node) actorId = node.id;
      }
      return allTraces
        .filter(t => t.category === 'consequence_applied' && t.actorId === actorId)
        .slice(-last)
        .map(t => ({
          tick: (t as Record<string, unknown>).tick,
          templateId: (t as Record<string, unknown>).templateId,
          band: (t as Record<string, unknown>).band,
          qDelta: (t as Record<string, unknown>).qDelta,
          growthMultiplier: (t as Record<string, unknown>).growthMultiplier,
          progressCounterDelta: (t as Record<string, unknown>).progressCounterDelta,
          dropIntent: (t as Record<string, unknown>).dropIntent,
          complicationId: (t as Record<string, unknown>).complicationId,
        }));
    },

    // THR-490: prose-quality audit over the static authored-content library.
    // Pure + deterministic — no GameState, no runtime. Mirrors the DebugPanel
    // "Prose QA" tab so the same report is scriptable from preview_eval / CLI.
    proseQualityReport: async () => {
      const [{ collectAuthoredProse }, { scoreProseBatch }] = await Promise.all([
        import('./engine/content-eval/collectAuthoredProse'),
        import('./engine/content-eval/proseQualityScore'),
      ]);
      return scoreProseBatch(collectAuthoredProse());
    },
    scoreProseEntry: async (entryId: string) => {
      const [{ collectAuthoredProse }, { scoreProseEntry: scoreOne }] = await Promise.all([
        import('./engine/content-eval/collectAuthoredProse'),
        import('./engine/content-eval/proseQualityScore'),
      ]);
      const corpus = collectAuthoredProse();
      const match = corpus.find((e) => e.entryId === entryId)
        ?? corpus.find((e) => e.entryId.toLowerCase().includes(entryId.toLowerCase()));
      if (!match) return { error: `no authored entry matching "${entryId}"` };
      return scoreOne(match);
    },

    // THR-659: orphaned action-card inspector. Player-castable templates that no run
    // can ever surface — neither a starter, a static beat grant, nor a dynamic reach
    // signature. Pure + deterministic; independent of any live session. Mirrors the
    // DebugPanel "Orphaned Cards" tab so the same report is scriptable from CLI.
    listUnreachableActions: async () => {
      const { reportUnreachableActions } = await import('./engine/content-eval/unreachableActions');
      return reportUnreachableActions();
    },

    // THR-66: rival scheme inspection — reads the denormalized RivalState.schemes summaries.
    getRivalSchemes: () => {
      const state = _gameStateProvider?.();
      if (!state) return [];
      const out: Array<{
        rivalId: string;
        compositionId: string;
        family: string;
        phase: string;
        escalationTier: number;
        status: 'active' | 'completed' | 'failed';
      }> = [];
      for (const rs of state.rivalStates ?? []) {
        for (const s of rs.schemes ?? []) {
          out.push({
            rivalId: rs.rivalId,
            compositionId: s.compositionId,
            family: s.family,
            phase: s.phase,
            escalationTier: s.escalationTier,
            status: s.status,
          });
        }
      }
      return out;
    },

    // THR-66: force-launch a rival scheme (dev/QA). Mutates live state in place;
    // the engine picks it up next tick.
    forceRivalScheme: async (rivalName: string, family: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { success: false, message: 'Game not loaded' };
      const rival = state.rivalDefinitions.find(
        (r) =>
          r.id === rivalName ||
          r.id.startsWith(rivalName) ||
          r.name.toLowerCase().includes(rivalName.toLowerCase()),
      );
      if (!rival) return { success: false, message: `Rival "${rivalName}" not found` };
      const [{ buildRivalScheme, computeRivalEscalationTier }, { getRivalSchemeFamily }] =
        await Promise.all([import('./engine/rival'), import('./data/rival-schemes')]);
      const fam = getRivalSchemeFamily(family);
      if (!fam) return { success: false, message: `Unknown scheme family "${family}"` };
      const rsIdx = state.rivalStates.findIndex((s) => s.rivalId === rival.id);
      if (rsIdx < 0) return { success: false, message: 'Rival has no runtime state' };
      const tier = computeRivalEscalationTier(state);
      let target: { id: string; name: string } | undefined;
      if (fam.requiresTarget) {
        const loc = state.graph
          .getNodesByType('location')
          .find(
            (l) => l.properties.parentLocationId === undefined && l.properties.hexCol !== undefined,
          );
        if (!loc) return { success: false, message: 'No target location available' };
        target = { id: loc.id, name: (loc.properties.name as string | undefined) ?? loc.id };
      }
      // Simple LCG rng — dev-only tool, determinism not required here.
      let seed = (state.tick + 1) | 0;
      const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const plan = buildRivalScheme(
        rival,
        state.rivalStates[rsIdx],
        fam,
        tier,
        state.tick,
        target?.id,
        target?.name,
        rng,
      );
      state.activeCompositions = [...(state.activeCompositions ?? []), plan.composition];
      state.worldFlags = { ...(state.worldFlags ?? {}), ...plan.worldFlagUpdates };
      state.rivalStates[rsIdx] = plan.updatedRivalState;
      return {
        success: true,
        message: `Launched ${fam.label} for ${rival.name}${target ? ` against ${target.name}` : ''}`,
        rivalId: rival.id,
        rivalName: rival.name,
        family: fam.id,
        compositionId: plan.composition.compositionId,
      };
    },

    // THR-630: notable-agenda inspection — reads agenda compositions off state.
    getNotableAgendas: () => {
      const state = _gameStateProvider?.();
      if (!state) return [];
      return (state.activeCompositions ?? [])
        .filter((c) => c.sponsorNotableId && c.agendaFamily)
        .map((c) => {
          const notable = state.graph.getNode(c.sponsorNotableId!);
          const targetId = c.resolvedNodes.target;
          const target = targetId ? state.graph.getNode(targetId) : null;
          return {
            compositionId: c.compositionId,
            notableId: c.sponsorNotableId!,
            notableName: notable?.name ?? c.sponsorNotableId!,
            family: c.agendaFamily!,
            phase:
              c.activatedPhaseIds[c.activatedPhaseIds.length - 1] ?? 'pending',
            phaseIndex: c.activatedPhaseIds.length,
            status: c.status,
            targetId,
            targetName: target?.name,
            firedAtTick: c.firedAtTick,
          };
        });
    },

    // THR-630: force-launch a notable agenda (dev/QA). Mutates live state in
    // place; the engine picks it up next tick.
    forceNotableAgenda: async (notableName: string, family: string) => {
      const state = _gameStateProvider?.();
      if (!state) return { success: false, message: 'Game not loaded' };
      const [agendas, families] = await Promise.all([
        import('./engine/notableAgendas'),
        import('./data/notable-agendas'),
      ]);
      const fam = families.getNotableAgendaFamily(family);
      if (!fam) return { success: false, message: `Unknown agenda family "${family}"` };
      const notables = agendas.listNotables(state.graph);
      const match = notables.find((n) => {
        const node = state.graph.getNode(n.notableId);
        return (
          n.notableId === notableName ||
          n.notableId.startsWith(notableName) ||
          (node?.name ?? '').toLowerCase().includes(notableName.toLowerCase())
        );
      });
      if (!match) return { success: false, message: `Notable "${notableName}" not found (must hold a leads edge)` };
      let target: { targetId: string; targetName: string } | undefined;
      const picked = agendas.selectAgendaTarget(
        state, fam, match.notableId, match.factionId, notables, new Set(),
      );
      if (picked === undefined) return { success: false, message: `No valid ${fam.targetKind} target found` };
      if (picked !== 'none') target = picked;
      const notableNode = state.graph.getNode(match.notableId);
      const factionNode = state.graph.getNode(match.factionId);
      // Simple LCG rng — dev-only tool, determinism not required here.
      let seed = (state.tick + 1) | 0;
      const rng = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const plan = agendas.buildNotableAgenda(
        match.notableId,
        notableNode?.name ?? match.notableId,
        factionNode?.name ?? match.factionId,
        fam,
        state.tick,
        target?.targetId,
        target?.targetName,
        rng,
      );
      state.activeCompositions = [...(state.activeCompositions ?? []), plan.composition];
      state.worldFlags = { ...(state.worldFlags ?? {}), ...plan.worldFlagUpdates };
      return {
        success: true,
        message: `Launched ${fam.label} for ${notableNode?.name ?? match.notableId}${target ? ` against ${target.targetName}` : ''}`,
        notableId: match.notableId,
        family: fam.id,
        compositionId: plan.composition.compositionId,
      };
    },

    // THR-614 (war seam 3) — headless army/battle readout for CLI/automated
    // verification. The DebugPanel "Armies" tab renders the same graph state
    // visually; these return plain data so a headless run can assert war fired
    // without a browser. Ground-truth read: no monster-faction filter (unlike
    // the tab's display choice) — headless inspection wants the full picture.
    getArmies: () => {
      const state = _gameStateProvider?.();
      if (!state) return [];
      const graph = state.graph;
      const tick = state.tick ?? 0;
      return graph
        .getNodesByType('actor')
        .filter((n) => n.properties.armyState != null)
        .map((army) => {
          const as = army.properties.armyState as import('./types/army').ArmyState;
          const cmdEdge = graph.getOutgoingEdges(army.id, 'commanded_by')[0];
          const commander = cmdEdge ? graph.getNode(cmdEdge.target) : null;
          const facEdge = graph.getOutgoingEdges(army.id, 'member_of')[0];
          const faction = facEdge ? graph.getNode(facEdge.target) : null;
          const locEdge = graph.getOutgoingEdges(army.id, 'located_at')[0];
          const location = locEdge ? graph.getNode(locEdge.target) : null;
          const objTarget = as.objective ? graph.getNode(as.objective.targetNodeId) : null;
          return {
            id: army.id,
            name: army.name,
            faction: faction?.name ?? null,
            factionId: faction?.id ?? null,
            commander: commander?.name ?? null,
            location: location?.name ?? null,
            locationId: location?.id ?? null,
            size: as.size,
            headcount: as.headcount,
            cohesion: as.cohesion,
            cohesionMax: as.cohesionMax,
            cohesionPct:
              as.cohesionMax > 0
                ? Math.round((as.cohesion / as.cohesionMax) * 100)
                : 0,
            objective: as.objective
              ? {
                  type: as.objective.type,
                  targetNodeId: as.objective.targetNodeId,
                  targetName: objTarget?.name ?? null,
                }
              : null,
            raisedTick: as.raisedTick,
            ticksActive: tick - as.raisedTick,
            maintenanceCost: as.maintenanceCost,
          };
        });
    },

    // THR-614 (war seam 3) — headless battle readout. Companion to getArmies.
    getBattles: () => {
      const state = _gameStateProvider?.();
      if (!state) return [];
      const graph = state.graph;
      const tick = state.tick ?? 0;
      return graph
        .getNodesByType('actor')
        .filter((n) => n.properties.battleState != null)
        .map((battle) => {
          const bs = battle.properties.battleState as import('./types/battle').BattleState;
          // Mirrors BATTLE_RESOLUTION_THRESHOLD (8) / SIEGE_RESOLUTION_THRESHOLD (12)
          // in types/battle.ts — kept inline to keep this reader sync + import-free.
          const resolutionThreshold = bs.battleType === 'siege' ? 12 : 8;
          return {
            id: battle.id,
            name: battle.name,
            battleType: bs.battleType,
            momentum: bs.momentum,
            resolutionThreshold,
            leader:
              bs.momentum > 0 ? 'attacker' : bs.momentum < 0 ? 'defender' : 'even',
            startedTick: bs.startedTick,
            ticksElapsed: tick - bs.startedTick,
            attackerArmyId: bs.attackerArmyId,
            defenderArmyId: bs.defenderArmyId,
            settlementId: bs.settlementId ?? null,
            spotlightCount: bs.spotlightHistory.length,
          };
        });
    },
  };
}

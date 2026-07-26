import type { TraceEntry } from './types/trace';
import type { AgentAttachments } from './engine/agentAttachments';
import type { RewardHistoryEntry } from './engine/rewardHistory';
import type { BalanceRunSummary, BalanceTargets, BalanceEvaluationResult } from './types/balanceEval';
import type { TickEvent } from './types/gameState';
import type { DebugSpawnEncounterResult, DebugSpawnEncounterContextResult, DebugSpawnEncounterOptions, DebugSpawnEncounterContextOptions } from './engine/debugEncounterTools';
import type { DebugWorldSpawnResult, DebugSpawnLocationOptions, DebugSpawnSublocationOptions, DebugSpawnNpcOptions, DebugMoveAgentOptions, DebugSpawnAttachmentOptions, DebugSpawnBandOptions } from './engine/debugWorldSpawnTools';
import type { PortfolioPinResult } from './engine/portfolioManager';
import type { SetHomeSeatResult } from './engine/influence';

export interface EncounterLogExportResult {
  allAgentsTsv: string;
  allAgentsFilename: string;
  perAgent: {
    id: string;
    name: string;
    tsv: string;
    filename: string;
  }[];
}

export interface EncounterLogSummary {
  trackedAgentCount: number;
  totalEvents: number;
  agentIds: string[];
}

export interface DebugActionInfo {
  id: string;
  name: string;
  sphere: string | null;
  reach: string | null;
  essenceCost: number;
  steps: number;
  scale: string;
}

/**
 * Result of `__DEBUG.tick(n)` (THR-689).
 * `error` is set — and the tick fields absent — when the call was rejected
 * (no game loaded, or n was not a finite number >= 1).
 */
export interface DebugTickResult {
  /** Ticks actually advanced (may be < requested when capped or interrupted). */
  ticksRun?: number;
  /** Tick counter after the batch. */
  tick?: number;
  durationMs?: number;
  /** What was asked for, before clamping to DEBUG_TICK_MAX. */
  requested?: number;
  /** True when `requested` exceeded DEBUG_TICK_MAX (200) and was clamped. */
  capped?: boolean;
  stoppedReason?: 'completed' | 'capped' | 'phase_left_playing' | 'error';
  error?: string;
}

export interface DebugFireResult {
  success: boolean;
  actionId?: string;
  templateName?: string;
  message: string;
}

export interface DebugLockedActionInfo {
  id: string;
  name: string;
  rarityTier: number;
}

export interface DebugGrantActionResult {
  success: boolean;
  actionId?: string;
  message: string;
}

export interface DebugAftermathReaction {
  id: string;
  label: string;
}

export interface DebugAftermathListResult {
  reactions: DebugAftermathReaction[];
  error?: string;
}

export interface DebugAftermathPickResult {
  success: boolean;
  reactionId?: string;
  touchedWorld?: boolean;
  touchedStructure?: boolean;
  message: string;
}

export interface DebugPlayerReceiptInfo {
  id: string;
  templateId: string;
  presentation: 'modal' | 'toast';
  band: string;
  acknowledged: boolean;
  changeCount: number;
}

export interface DebugPlayerReceiptsResult {
  receipts: DebugPlayerReceiptInfo[];
}

export interface DebugRarityInfo {
  tier: number;
  tierName: string;
  importance: number;
  graduationThreshold: number | null;
}

export interface DebugForceGraduateResult {
  success: boolean;
  message: string;
  previousTier?: number;
  newTier?: number;
}

export interface DebugSceneSnapshot {
  hexCount: number;
  agentsVisible: number;
  locationsVisible: number;
  armiesVisible: number;
  battlesVisible: number;
  siegesVisible: number;
  threadLines: number;
  /** Company (party) cluster marks currently rendered — ring + bond glyph (THR-74). */
  companyClusters: number;
  activityIcons: number;
  fogEnabled: boolean;
  layersActive: string[];
}

export interface DebugViewportProjection {
  x: number;
  y: number;
  visible: boolean;
}

export interface DebugActiveUIState {
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

export interface DebugForeshadowingResult {
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

// ── Ascendant Beats — Divine Cadence debug surface (THR-507) ────────────────

import type { BeatKind } from './types/ascendantBeat';

/** One catalogue entry returned by `listBeats()` — a beat the Director can schedule. */
export interface DebugBeatCatalogueEntry {
  beatId: string;
  kind: BeatKind;
  /** Which catalogue the beat lives in. */
  source: 'spine' | 'pool' | 'delivery';
  /** Trigger discriminant (turn / first_bonded / settlement_visited / cadence). */
  triggerKind: string;
  /** Earliest turn the trigger may fire, or null if unbounded. */
  minTurn: number | null;
  /** Source template the beat resolves into (delivery beats: the branching encounter). THR-506 */
  templateId?: string | null;
  /** Action ids the beat is expected to unlock on resolution. */
  grantsActionIds: string[];
  /** Per-beat draw weight (pool beats only); null for spine beats. */
  weight: number | null;
}

/** One resolved beat as recorded in the Director history. */
export interface DebugBeatHistoryEntry {
  beatId: string;
  kind: BeatKind;
  resolvedTurn: number;
  outcome: string;
  grantedActionIds: string[];
}

/** Live Director snapshot returned by `beatSchedule()`. */
export interface DebugBeatScheduleResult {
  /** False when the game / beat state is not loaded; all other fields are zeroed. */
  available: boolean;
  turn: number;
  spineCursor: number;
  spineLength: number;
  /** beatId the spine cursor points at, or null once the spine is exhausted. */
  nextSpineBeatId: string | null;
  lastBeatTurn: number;
  /** The currently-offered beat, or null. */
  pending: {
    beatId: string;
    kind: BeatKind;
    offeredTurn: number;
    triggerKind: string;
    /** Subject node ids the Director bound at offer time (THR-522), e.g. the introduced group. */
    boundNodeIds: string[];
    /** Resolved display names for `boundNodeIds` (id used as fallback when the node is gone). */
    boundNames: string[];
  } | null;
  /** Pool beat ids the Director may currently draw from. */
  eligiblePool: string[];
  poolSize: number;
  /** The within-run action unlock set the beats push into. */
  runUnlockedActionIds: string[];
  history: DebugBeatHistoryEntry[];
}

export interface DebugFireBeatResult {
  success: boolean;
  beatId?: string;
  kind?: BeatKind;
  message: string;
}

export interface DebugGrantUnlockResult {
  success: boolean;
  actionId?: string;
  message: string;
}

/** Result of resolving the currently-pending beat via `resolveBeat()`. THR-517 */
export interface DebugResolveBeatResult {
  /** True only when a beat actually resolved (grants applied, pending cleared). */
  success: boolean;
  /** The beat id acted on (resolved or skipped), if any. */
  beatId?: string;
  /** Action ids unlocked by this resolution. */
  grantedActionIds?: string[];
  message: string;
}

/** One reach-signature entry returned by `listSignatures()`. THR-554 */
export interface DebugSignatureInfo {
  reach: string;
  templateId: string;
  name: string;
  /** True when the signature's action id is in the run-scoped unlock set. */
  unlocked: boolean;
  /** True for the three engine-backed signatures that leave an on-map footprint. */
  engineBacked: boolean;
}

/** Result of `listSignatures()`. THR-554 */
export interface DebugListSignaturesResult {
  /** The ascendant's primary Creation Sphere, or null if unresolved. */
  primarySphere: string | null;
  sphereScore: number;
  /** spherePowerMultiplier(sphereScore) — the primary-sphere effect/cost multiplier. */
  primaryMultiplier: number;
  runUnlockedActionIds: string[];
  signatures: DebugSignatureInfo[];
}

/** Result of `fireSignature()`. THR-554 */
export interface DebugFireSignatureResult {
  success: boolean;
  message?: string;
  reach?: string;
  templateId?: string;
  /** True once the signature's action id is in the run-scoped unlock set. */
  unlocked?: boolean;
  primarySphere?: string | null;
  sphereScore?: number;
  multiplier?: number;
  /** multiplier × the signature reach base — the sphere-scaled magnitude it resolves with. */
  scaledMagnitude?: number;
  /** The on-map footprint minted for engine-backed reaches (null otherwise). */
  materialized?: { kind: string; id: string; hexCol: number; hexRow: number } | null;
}

export interface DebugBridge {
  openDebugPanel: () => void;
  closeDebugPanel: () => void;
  toggleDebugPanel: () => void;
  /** @internal React registers its toggle callback here */
  _registerDebugPanelToggle: (fn: (open?: boolean) => void) => void;
  /** Find an agent by id or partial name, zoom the camera to their hex, and select them. Returns true if found. */
  gotoAgent: (id: string) => boolean;
  /** @internal GameView registers its gotoAgent handler here */
  _registerGotoAgent: (fn: (id: string) => boolean) => void;
  /**
   * THR-689: advance the sim n ticks synchronously through the real runTick pipeline,
   * bypassing the `document.hidden`-throttled interval loop. Auto-pauses the run loop.
   * Clamped to DEBUG_TICK_MAX (200) per call.
   */
  tick: (n?: number) => DebugTickResult;
  /** @internal GameView registers its synchronous tick batch here */
  _registerTickBridge: (fn: (n: number) => DebugTickResult) => void;
  /**
   * List action templates available to fire on agents. Omit `agentId` to list every
   * actor-targeting template; pass an agent id/name to filter by that agent's context.
   * Doubles as an existence check — returns `[]` when the agent query matches nothing.
   */
  listActions: (agentId?: string) => DebugActionInfo[];
  /** Fire an action template on a target agent immediately, bypassing UI animations. agentId and templateId both accept partial matches. */
  fireAction: (agentId: string, templateId: string) => DebugFireResult;
  /** List canonical Starter 12 action IDs. */
  listStarterActions: () => Promise<string[]>;
  /** List actions currently hidden by the starter/unlock gate. */
  listLockedActions: () => Promise<DebugLockedActionInfo[]>;
  /** Grant a non-starter action into unlockedActionIds for the current session. */
  grantAction: (actionId: string) => Promise<DebugGrantActionResult>;
  /** @internal GameView registers action bridge callbacks here */
  _registerActionBridge: (callbacks: {
    listActions: (agentId?: string) => DebugActionInfo[];
    fireAction: (agentId: string, templateId: string) => DebugFireResult;
    grantAction?: (actionId: string) => DebugGrantActionResult;
  }) => void;
  /** List pending aftermath reactions for the agent query (id, id prefix, or partial name). */
  listAftermathReactions: (agentId: string) => DebugAftermathListResult;
  /** Apply a pending aftermath reaction for the agent query. Omitting reactionId picks the first authored reaction. */
  pickAftermathReaction: (agentId: string, reactionId?: string) => DebugAftermathPickResult;
  /** @internal GameView registers aftermath bridge callbacks here */
  _registerAftermathBridge: (callbacks: {
    listAftermathReactions: (agentId: string) => DebugAftermathListResult;
    pickAftermathReaction: (agentId: string, reactionId?: string) => DebugAftermathPickResult;
  }) => void;
  /** List queued Divine Receipts for player actions (THR-727). Reads live GameState. */
  listPlayerReceipts: () => DebugPlayerReceiptsResult;
  /** @internal GameView registers a provider for the live WorldGraph here */
  _registerGraphProvider: (fn: () => import('./engine/graph').WorldGraph | null) => void;
  /** @internal GameView registers a provider for the live GameState here */
  _registerGameStateProvider: (fn: () => import('./types/gameState').GameState | null) => void;
  /**
   * Inspect the encounter notification pipeline.
   * Pass an agent name/id fragment to filter, or omit to see all threaded agents.
   * Returns thread edges, active encounterProgress entries, and pending encounterNotifications.
   */
  inspectEncounterPipeline: (agentFilter?: string) => unknown;
  /** Returns rarity info for a node by id. Returns tier 1 defaults if node not found. */
  getRarityInfo: (nodeId: string) => Promise<DebugRarityInfo>;
  /** Forces a node to graduate to the specified rarity tier. Never demotes. */
  forceGraduate: (nodeId: string, tier: number) => Promise<DebugForceGraduateResult>;
  /**
   * Returns all attachments for an agent (possessions, conditions, powers, agreements).
   * Accepts an agent id, id prefix, or partial name (case-insensitive). Returns null if not found.
   */
  getAgentAttachments: (agentIdOrName: string) => Promise<AgentAttachments | null>;

  /**
   * THR-479: list the ascendant's Aspects (apex milestone beyond the five tiers),
   * including living Aspects and mythic echoes. Empty array if none / not loaded.
   */
  getAspects: () => Array<{
    ascendantId: string;
    mortalId: string;
    mortalName: string;
    attainedTick: number | null;
    sourceTier: number | null;
    mythicEcho: boolean;
    echoedTick: number | null;
  }>;

  /**
   * THR-479 (dev/QA only): grant the Aspect apex to a threaded mortal by id,
   * id prefix, or partial name. Returns the grant result, or null if not found.
   */
  grantAspectDebug: (mortalIdOrName: string) => Promise<{
    granted: boolean;
    reason: string;
    ascendantId?: string;
    mortalId: string;
    edgeId?: string;
  } | null>;

  /**
   * THR-401: inspect a location's THR-401 properties (health, presence,
   * countdown flags). Accepts id, id prefix, or partial name. Returns null
   * if not found.
   */
  inspectLocation: (idOrName: string) => null | {
    id: string;
    name: string;
    subtype: string | null;
    prosperity: number | null;
    unrest: number | null;
    populationHealth: number | null;
    divinePresence: number | null;
    magicalSaturation: number | null;
    routesCursedUntilTick: number | null;
    wellsSickenedUntilTick: number | null;
    migrationPullUntilTick: number | null;
    placeSpiritAwakenedAtTick: number | null;
    routesCursedActive: boolean;
    wellsSickenedActive: boolean;
    currentTick: number;
  };

  /**
   * THR-401: force a location countdown property to expire immediately.
   * Returns true if the property was present and was cleared.
   */
  forceLocationCountdownExpire: (
    idOrName: string,
    property: 'routesCursedUntilTick' | 'wellsSickenedUntilTick' | 'migrationPullUntilTick',
  ) => boolean;
  /** Returns the last n reward events (draws and empty-pool misses). Default: all retained (up to 200). */
  getRecentRewards: (n?: number) => Promise<readonly RewardHistoryEntry[]>;
  /** Resolve encounter foreshadowing prose for an agent's latest ranked encounter candidate. */
  getForeshadowing: (agentQuery: string, templateQuery?: string) => Promise<DebugForeshadowingResult | null>;
  /** THR-631: raw Motive Receipt from an agent's most recent encounter selection (ranked decision-causality contributions). Accepts id, id prefix, or partial name. Null if no match or no selection yet. */
  getMotiveReceipt: (agentQuery: string) => import('./types/foreshadowing').MotiveReceipt | null;
  /** Returns the current encounter novelty record (surface-keyed since THR-475). Keys are surfaceKeys; values are last-selected tick. Null if no game state. */
  getEncounterNoveltyRecord: () => Record<string, number> | null;
  /** Snapshot of the trace ring buffer. Empty unless tracing was enabled first. */
  getTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  /** Start recording traces into the ring buffer. `openDebugPanel()` enables this implicitly. */
  enableTracing: () => Promise<void>;
  disableTracing: () => Promise<void>;
  isTracingEnabled: () => Promise<boolean>;
  /** Drop every buffered trace. Use before a measured run so the buffer holds only that run. */
  clearTraces: () => Promise<void>;
  /** Enable the tick-loop profiling/timing stream (THR-580). Independent of tracing. */
  enableProfiling: () => Promise<void>;
  /** Disable the profiling/timing stream (THR-580). */
  disableProfiling: () => Promise<void>;
  /** Per-phase avg/max/p95 timing aggregate over the last `windowTicks` (default 30) of profiling (THR-580). */
  getPhaseTimings: (windowTicks?: number) => Promise<import('./engine/traceBuffer').PhaseTimingAggregate[]>;
  /** Captured tick-loop exceptions (NFP #4 swallows them at runtime; they surface here). */
  getCrashLog: () => Promise<unknown>;
  clearCrashLog: () => Promise<void>;
  /** Aggregate session-health readout — the first stop when the sim "looks wrong" but does not throw. */
  getHealthReport: () => Promise<unknown>;
  /** Full diagnostic bundle (health + crash log + counters) as one JSON-serializable blob for attaching to an issue. */
  exportDiagnostics: () => Promise<unknown>;
  /** Returns a BalanceRunSummary for the current session. Pass endTick to override the current tick. */
  getBalanceSummary: (endTick?: number) => Promise<BalanceRunSummary | null>;
  /** Returns the encounter-decision funnel summary for the current session. */
  getEncounterDecisionSummary: (endTick?: number) => Promise<BalanceRunSummary['encounterDecisions'] | null>;
  /** Returns the current versioned balance targets. */
  getBalanceTargets: () => Promise<BalanceTargets>;
  /** Evaluates the current session telemetry against balance targets. Returns summary + evaluation result. */
  getBalanceEvaluation: (endTick?: number) => Promise<{ summary: BalanceRunSummary; result: BalanceEvaluationResult } | null>;
  /** Exports raw balance telemetry as a JSON-serializable snapshot. */
  exportBalanceTelemetry: () => Promise<Record<string, unknown> | null>;
  /**
   * THR-571 U1: live outcome-ladder distribution + KPI threshold verdicts.
   * `windowTicks` (optional) restricts the histogram to actions completed within the last
   * N ticks; cumulative rows (branching fires, failure→story) stay lifetime.
   */
  getOutcomeDistribution: (windowTicks?: number) => Promise<{
    tick: number;
    seed: number;
    outcomes: import('./engine/kpi/gameplayKpi').OutcomeDistribution;
    thresholds: import('./engine/kpi/gameplayKpi').KpiThresholdEvaluation[];
  } | null>;
  /**
   * Player action progression readout (THR-613): per permanent reach, accrued reach
   * practice, live Domain Capability + tier, tier snapshot, and pending-Deepening flag.
   */
  getAscendantProgression: () => Promise<
    | {
        reaches: import('./engine/phaseAscendantProgression').AscendantReachProgress[];
        pendingBeatId: string | null;
      }
    | { error: string }
  >;
  /** Entity Visual resolver readout (THR-637): tier/source/gradient/kind for a node id or name. Read-only. */
  resolveEntityVisual: (ref: string) => Promise<
    | {
        matchedId: string;
        matchedName: string;
        descriptor: import('./components/shared/entityVisualResolver').EntityVisualDescriptor;
      }
    | { error: string }
  >;
  /**
   * Context-fragment bindings for an agent's current scene (THR-573). Read-only.
   * With no `ref`, returns the static authored inventory instead (no session needed).
   */
  resolveSurfaceFragments: (ref?: string) => Promise<
    | import('./engine/content-eval/surfaceFragmentReport').SurfaceFragmentReport
    | {
        matchedId: string;
        matchedName: string;
        templateId: string;
        axes: { place: string | null; counterpartRole: string | null };
        declaresFragments: boolean;
        bindings: readonly import('./engine/fragmentResolution').FragmentBinding[];
      }
    | { matchedId: string; matchedName: string; error: string }
    | { error: string }
  >;
  /** List the god's active sustained controls ("covenants", THR-613 §5.A). Read-only. */
  listControlEffects: () =>
    | {
        covenants: Array<{
          effectId: string;
          templateId: string;
          targetNodeId?: string;
          contested: boolean;
          hasCost: boolean;
        }>;
        pendingReleases: string[];
      }
    | { error: string };
  /** Queue a voluntary release of a sustained control (THR-613 §3.4), mirroring the Covenants panel. */
  releaseControl: (effectId: string) =>
    | { success: true; effectId: string; matchedActiveEffect: boolean; pendingReleases: string[] }
    | { error: string };
  /** @internal GameView registers the SimulationRuntime provider for balance telemetry access */
  _registerRuntimeProvider: (fn: () => import('./engine/simulationRuntime').SimulationRuntime | null) => void;
  /** @internal GameView registers encounter spawn / world-spawn callbacks here */
  _registerEncounterBridge: (callbacks: Record<string, (...args: unknown[]) => unknown>) => void;
  /** Toggle fog of war on/off. Returns the new enabled state. */
  toggleFog(): boolean;
  /** Explicitly set fog of war enabled state. */
  setFog(enabled: boolean): void;
  /** @internal GameView registers its fog toggle callback here */
  _registerFogToggle(fn: (enabled?: boolean) => boolean): void;
  /** Structural scene snapshot for test/audit assertions without screenshots. */
  snapshotScene(): Promise<DebugSceneSnapshot>;
  /** Convert a hex coordinate to viewport pixels. Returns null when off-canvas. */
  getViewportForHex(col: number, row: number): DebugViewportProjection | null;
  /** Inverse conversion from viewport pixel coordinate to hex. */
  getHexAtViewport(x: number, y: number): { col: number; row: number } | null;
  /** Names of currently-open modal/overlay components in GameView. */
  getOpenModals(): Promise<string[]>;
  /** Snapshot of current high-level UI state for test assertions. */
  getActiveUIState(): Promise<DebugActiveUIState>;
  /** Returns recent UI tick-events where event.tick > provided tick. */
  getEventsSince(tick: number): Promise<TickEvent[]>;
  /** @internal GameView registers scene snapshot provider here */
  _registerSceneSnapshot(fn: () => DebugSceneSnapshot): void;
  /** @internal GameView registers hex -> viewport projection callback here */
  _registerViewportForHex(fn: (col: number, row: number) => DebugViewportProjection | null): void;
  /** @internal GameView registers viewport -> hex projection callback here */
  _registerHexAtViewport(fn: (x: number, y: number) => { col: number; row: number } | null): void;
  /** @internal GameView registers open-modal provider here */
  _registerOpenModalsProvider(fn: () => string[]): void;
  /** @internal GameView registers active UI state provider here */
  _registerActiveUIStateProvider(fn: () => DebugActiveUIState): void;

  /** Toggle omniscience mode — bypasses familiarity gating, shows all agent character sheet data. Returns the new enabled state. */
  toggleOmniscience(): boolean;
  /** Explicitly set omniscience mode enabled state. */
  setOmniscience(enabled: boolean): void;
  /** @internal GameView registers its omniscience toggle callback here */
  _registerOmniscienceToggle(fn: (enabled?: boolean) => boolean): void;

  // ── Ascendant Bar: quintessence band visualisation (THR-184) ────────────
  /** Set the ascendant's quintessence to the given ratio (0–1). Triggers a re-render. */
  setQuintessence(ratio: number): void;
  /** Set the ascendant's quintessence to the midpoint of the named band. */
  setBand(band: 'transcendent' | 'healthy' | 'strained' | 'weakened' | 'critical' | 'dissolving'): void;
  /** @internal AscendantBar / GameView registers its setQuintessence callback here */
  _registerSetQuintessence(fn: (ratio: number) => void): void;

  // ── Spawn / world-spawn commands ────────────────────────────────────────
  /** Spawn an encounter on an agent. Opens the encounter modal by default. */
  spawnEncounter: (agentQuery: string, templateId: string, options?: DebugSpawnEncounterOptions & { open?: boolean }) => DebugSpawnEncounterResult & { notificationId?: string };
  /** Prepare encounter context (support bundle, anchor location) without spawning. */
  spawnEncounterContext: (templateId: string, options?: DebugSpawnEncounterContextOptions) => DebugSpawnEncounterContextResult;
  /** Spawn an attachment (artifact, trait, etc.) on an agent. */
  spawnAttachment: (agentQuery: string, templateQuery: string, options?: DebugSpawnAttachmentOptions) => DebugWorldSpawnResult;
  /** Spawn a location at the specified hex coordinates. */
  spawnLocation: (subtype: string, col: number, row: number, options?: DebugSpawnLocationOptions) => DebugWorldSpawnResult;
  /** Spawn a sublocation under a location at the specified target. */
  spawnSublocation: (typeId: string, target: { locationQuery?: string; col?: number; row?: number }, options?: DebugSpawnSublocationOptions) => DebugWorldSpawnResult;
  /** Spawn an NPC at the specified target location. */
  spawnNpc: (role: string, target: { locationQuery?: string; col?: number; row?: number }, options?: DebugSpawnNpcOptions) => DebugWorldSpawnResult;
  /**
   * Force a faction to field one NPC band (THR-731). Skips the interval gate and the
   * spawn roll; every structural precondition still applies, so a faction without an
   * unbanded colocated cluster is refused with the reason.
   */
  spawnBand: (factionQuery: string, options?: DebugSpawnBandOptions) => DebugWorldSpawnResult;
  /** Move an agent to a target location or hex. */
  moveAgent: (agentQuery: string, target: { locationQuery?: string; col?: number; row?: number }, options?: DebugMoveAgentOptions) => DebugWorldSpawnResult;
  /** Add an agent to the player's protagonist portfolio. */
  pinAgent: (agentQuery: string) => PortfolioPinResult;
  /** Remove an agent from the player's protagonist portfolio. */
  unpinAgent: (agentQuery: string) => PortfolioPinResult;
  /**
   * Designate a location as the ascendant's home seat (throne) — THR-502.
   * Sets `homeSeatLocationId` + a `controls` edge; the seat then yields one
   * ESSENCE_PER_SEAT term and renders a seat signifier. `locationRef` resolves
   * by id / id-prefix / name; omit to auto-pick the top settlement.
   */
  setHomeSeat: (locationRef?: string) => SetHomeSeatResult;

  /**
   * Resolved encounter Chapter Records (THR-603), always readable for the whole run.
   * Optional `filter` matches actor id/name, template id, or a participant id/name.
   */
  getChapterArchive: (filter?: string) => {
    count: number;
    records: ReadonlyArray<import('./types/chapterRecord').ChapterRecord>;
  };

  /** Counts only — how many agents are tracked and how many encounter events exist. Cheap pre-check before exporting. */
  getEncounterLogAll: () => Promise<EncounterLogSummary>;
  /** Encounter log as TSV strings (one combined sheet plus one per agent), ready to feed the `agent-analyser` skill. */
  exportEncounterLogAll: (agentNames?: Record<string, string>, seed?: string) => Promise<EncounterLogExportResult>;
  /** Returns total encounter cache full-rebuild count for this session (THR-187). */
  getEncounterCacheRebuildCount: () => number;
  /** Returns all encounter_cache_rebuild traces (THR-187). */
  getEncounterCacheRebuildTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  /** Returns foreshadowing traces, optionally filtered by agent query. */
  listForeshadowingTraces: (agentQuery?: string) => Promise<ReadonlyArray<TraceEntry>>;
  /** Returns all active compositions from the current game state (THR-225). */
  getActiveCompositions: () => import('./types/gameState').ActiveComposition[];
  /** Resolve encounter foreshadowing prose for an agent + encounter pair (THR-389). Returns null if state/runtime unavailable. */
  getForeshadowing: (agentId: string, encounterId: string) => Promise<import('./engine/foreshadowing/types').ForeshadowingResult | null>;
  /** Returns all foreshadowing resolution traces, optionally filtered to a specific agent id (THR-389). */
  listForeshadowingTraces: (agentId?: string) => Promise<ReadonlyArray<import('./types/trace').TraceEntry>>;

  /** Returns a KPI report for the current game state (THR-457). Returns null if state is unavailable. */
  getKpiReport: () => Promise<import('./engine/kpi/gameplayKpi').GameplayKpiReport | null>;

  /**
   * THR-460: Returns outcome-band phrase usage history from the runtime.
   * - With actorId: returns the Set<phraseId> for that actor (key format: actorId or actorId+'__q').
   * - Without actorId: returns the full Map<actorId, Set<phraseId>> for all actors.
   * Returns null when no runtime is available.
   */
  bandPhraseUsage: (actorId?: string) => Map<string, Set<string>> | Set<string> | null;

  /** Phase 6: Returns the last N consequence_applied traces for an actor (THR-63).
   *  @param actorRef - exact actor id or partial name match
   *  @param last - number of records to return (default 10)
   */
  consequencesFor: (actorRef: string, last?: number) => Promise<Array<{
    tick: unknown;
    templateId: unknown;
    band: unknown;
    qDelta: unknown;
    growthMultiplier: unknown;
    progressCounterDelta: unknown;
    dropIntent: unknown;
    complicationId: unknown;
  }>>;

  /** Compose and return the story-so-far for an agent by id, id prefix, or partial name (THR-455). Returns null if not available. */
  getThreadStory(agentRef: string): import('./engine/threadDigest').ThreadStoryComposition | null;

  /** THR-636 — captured per-step replay records for an agent's active/most-recent unified-action encounter.
   *  Resolves the agent by exact id, id prefix, then case-insensitive partial name. */
  getStepProse(agentRef: string):
    | { actionId: string; actorName: string; records: import('./types/stepProseRecord').StepProseRecord[] }
    | { error: string };

  /** THR-694 — scene-context readout for an agent's active/most-recent unified action:
   *  the resolved scene target (id/name/kind/relation) and the bound support cast.
   *  DoD state-assertion hook for the Scene Integration slices. Resolves the agent by
   *  exact id, id prefix, then case-insensitive partial name. */
  inspectSceneContext(agentRef: string): Promise<
    | {
        actionId: string;
        templateId: string;
        targetId: string;
        targetName: string | null;
        targetKind: 'agent' | 'location' | null;
        relation: 'ally' | 'rival' | 'stranger' | null;
        bindings: Array<{ key: string; nodeId: string; name: string | null; reused: boolean }>;
        /** THR-696 — the cast block `{cast:<key>}` renders: every declared bundle key
         *  resolved to its bound entity's live name, or the spec's authored fallback. */
        cast: Record<string, { name: string; role: string; reused: boolean }> | null;
      }
    | { error: string }
  >;
  /** @internal GameView registers the thread story provider here */
  _registerThreadStoryProvider(fn: (agentRef: string) => import('./engine/threadDigest').ThreadStoryComposition | null): void;

  // ── Ascendant Beats — Divine Cadence (THR-507) ──────────────────────────
  /** List the Director's beat catalogue (scripted spine + cadence pool). */
  listBeats: () => Promise<DebugBeatCatalogueEntry[]>;
  /** Live snapshot of the Director: spine cursor, pending beat, eligible pool, run-unlock set. */
  beatSchedule: () => Promise<DebugBeatScheduleResult>;
  /** Force-offer a beat by id (exact or partial match), bypassing cadence/spine gates. Replaces any pending beat. */
  fireBeat: (beatId: string) => DebugFireBeatResult;
  /** Push an action id into the run-scoped unlock set (the path beats use), emitting an `action.unlock.granted` (via: 'debug') trace. */
  grantUnlock: (actionId: string) => DebugGrantUnlockResult;
  /** Resolve the currently-pending beat: apply its grants to the unlock set + clear `pending`. For selection beats pass the chosen action id. THR-517 */
  resolveBeat: (chosenActionId?: string) => DebugResolveBeatResult;
  /** @internal GameView registers beat bridge callbacks here */
  _registerBeatBridge: (callbacks: {
    fireBeat: (beatId: string) => DebugFireBeatResult;
    grantUnlock: (actionId: string) => DebugGrantUnlockResult;
    resolveBeat: (chosenActionId?: string) => DebugResolveBeatResult;
  }) => void;

  /** THR-554 — list the eight reach signatures, their run-unlock status, and the ascendant's primary-sphere multiplier. */
  listSignatures: () => Promise<DebugListSignaturesResult>;
  /** THR-554 — grant a reach signature's unlock + materialize a minimal on-map footprint (engine-backed reaches only). */
  fireSignature: (reach: string) => Promise<DebugFireSignatureResult>;

  /** THR-490 — Prose-quality audit over the static authored-content library.
   *  Returns the full batch report ({ entries, summary, bottomTail, marqueeEntries }).
   *  Pure + deterministic; independent of any live session. */
  proseQualityReport: () => Promise<import('./engine/content-eval/proseQualityScore').ProseQualityBatchResult>;
  /** THR-490 — Score a single authored entry by exact id or partial-id match.
   *  Returns the entry's ProseQualityResult, or { error } if no entry matches. */
  scoreProseEntry: (entryId: string) => Promise<import('./engine/content-eval/proseQualityScore').ProseQualityResult | { error: string }>;

  /** THR-659 — Orphaned action-card inspector. Reports player-castable templates that no
   *  run can ever surface (neither starter, static beat grant, nor dynamic reach signature).
   *  Pure + deterministic; independent of any live session. */
  listUnreachableActions: () => Promise<import('./engine/content-eval/unreachableActions').UnreachableActionReport>;

  /** THR-66 — List active/terminal rival schemes across all rivals. */
  getRivalSchemes: () => Array<{
    rivalId: string;
    compositionId: string;
    family: string;
    phase: string;
    escalationTier: number;
    status: 'active' | 'completed' | 'failed';
  }>;
  /** THR-66 — Force-launch a rival scheme for QA. Accepts rival id, id prefix, or partial name,
   *  and a family id (`corruptive` | `territorial`). Mutates live state; engine picks it up next tick. */
  forceRivalScheme: (rivalName: string, family: string) => Promise<{
    success: boolean;
    message: string;
    rivalId?: string;
    rivalName?: string;
    family?: string;
    compositionId?: string;
  }>;

  /** THR-430 — Schism inspection: list pending schisms in the live game state. */
  schism: {
    list: () => ReadonlyArray<{
      factionId: string;
      factionName: string;
      plantedTick?: number;
      resolutionTick: number;
      ticksRemaining: number;
      actorAgentId?: string;
      baselineCohesion?: number;
    }>;
  };

  /** THR-614 (war seam 3) — Headless readout of active armies (ground-truth graph
   *  read; no monster-faction filter). Companion to the DebugPanel "Armies" tab. */
  getArmies: () => Array<{
    id: string;
    name: string;
    faction: string | null;
    factionId: string | null;
    commander: string | null;
    location: string | null;
    locationId: string | null;
    size: 'warband' | 'regiment' | 'host';
    headcount: number;
    cohesion: number;
    cohesionMax: number;
    cohesionPct: number;
    objective: {
      type: 'raid' | 'conquer' | 'defend' | 'intercept' | 'reinforce_siege';
      targetNodeId: string;
      targetName: string | null;
    } | null;
    raisedTick: number;
    ticksActive: number;
    maintenanceCost: number;
  }>;

  /**
   * THR-74 — Headless readout of companies (the group layer). Ground-truth graph
   * read, mirroring `getArmies()`. Includes **disbanded** companies so dissolution
   * is inspectable; filter on `groupStatus` for the live set.
   *
   * `cohesion` is the raw number (debug is where numbers belong); `cohesionState`
   * is the ladder player-facing surfaces render instead.
   */
  getGroups: () => Promise<Array<{
    id: string;
    name: string;
    groupType: string;
    groupStatus: string;
    cohesion: number;
    cohesionState: 'bound' | 'holding' | 'frayed' | 'breaking';
    leader: string | null;
    leaderId: string | null;
    members: Array<{ id: string; name: string; role: string }>;
    /** Derived from the leader — companies carry no `located_at` edge of their own. */
    position: string | null;
    positionId: string | null;
    destinationId: string | null;
    blessedUntilTick: number | null;
    /** THR-732 — Reunite window; set only on disbanded companies. */
    reuniteUntilTick: number | null;
    reuniteSphereFlavor: string | null;
    /** THR-732 — Sunder window; set only on active companies. Independent of blessed. */
    sunderedUntilTick: number | null;
    formedAtTick: number | null;
    ticksActive: number;
    disbandedAtTick: number | null;
    dissolutionReason: string | null;
    /** THR-731 — set only on NPC bands; null on player-facing companies. */
    bandRole: 'raider' | 'defender' | null;
    bandFactionId: string | null;
  }>>;

  /** THR-614 (war seam 3) — Headless readout of active battles/sieges. */
  getBattles: () => Array<{
    id: string;
    name: string;
    battleType: 'field_battle' | 'siege';
    momentum: number;
    resolutionThreshold: number;
    leader: 'attacker' | 'defender' | 'even';
    startedTick: number;
    ticksElapsed: number;
    attackerArmyId: string;
    defenderArmyId: string;
    settlementId: string | null;
    spotlightCount: number;
  }>;
}

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}

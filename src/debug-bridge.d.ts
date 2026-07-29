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
   * THR-822: where an agent originated and how long it has held its current position.
   *
   * Residence is *observed* every `MILESTONE_CHECK_INTERVAL` (15) ticks from
   * `phaseAmbitionProgress`, not written by movement code — so `positionId` may lag
   * `livePositionId` by up to one interval right after a move. Both are returned so the
   * lag is visible rather than confusing.
   *
   * `dwellTicks` is total ticks at the current position. An ambition's settledness
   * trigger measures from `max(arrivedTick, assignedTick)` instead and will therefore
   * read shorter; that window is what stops such a trigger firing on its first tick.
   *
   * Accepts an agent id, id prefix, or partial name (case-insensitive). `null` if no
   * agent matches or the game is not loaded. Fields are `null` before first observation.
   */
  getAgentResidence: (agentIdOrName: string) => Promise<{
    agentId: string;
    agentName: string;
    originLocationId: string | null;
    originLocationName: string | null;
    positionId: string | null;
    positionName: string | null;
    livePositionId: string | null;
    arrivedTick: number | null;
    dwellTicks: number | null;
    awayFromOrigin: boolean;
  } | null>;

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
  /**
   * Sweep every authored trait ref against the trait definitions in the live graph
   * (THR-786). `null` when no game state is loaded.
   *
   * A ref in `dead[]` is an authored trait hook that can never fire — it names no
   * trait id, short id, display name or tag. `perSurface` counts refs *seen* per
   * surface, so a surface reading 0 means either nothing authored there yet or a
   * broken sweep; check it before concluding a surface is clean. `highFanout` is
   * informational only: ANY-match makes a ref shared by several definitions legal.
   *
   * `phantomGrants` is the lesser severity: a `trait_grant` key with no trait
   * definition still satisfies a gate (the grant returns the bare key), but the trait
   * has no name, visibility or contributions to display.
   *
   * Verified baseline 2026-07-26 (64 static trait definitions): **62 dead gates** — 43
   * ambition `boostingTraits`/`blockingTraits`/`requiredTraits`, 15 ambition
   * `agent_has_trait`/`agent_lacks_trait` conditions, 4 `has_trait:` choice-set
   * predicates (`negotiator`, `dauntless`, `leader`, `interrogator`) — plus 21 phantom
   * grants. Authored refs are bare snake_case keys; every trait definition uses
   * `trait.<category>.<kebab>` ids, Title Case names and `#tag` tags, so the two
   * vocabularies have never intersected. Filed as a defect, not fixed by THR-786.
   */
  validateTraitRefs: () => Promise<import('./engine/traitRefValidation').TraitRefValidationReport | null>;
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
  /**
   * Divine-economy source portfolio (THR-611) with its mortal-economy coupling
   * (THR-618, the essence bridge). Lists every source the ascendant `controls` —
   * kind, derived tier, sphere typing, private sanctity, contested/desecrated
   * state — plus, per source, the `sustenance` the land under it provides: the
   * host location's goods that share the source's sphere, the weighted
   * `affinityScore` in [-1, 1] those goods' stock tiers produce, and the signed
   * sanctity `drift` the next tick will apply.
   *
   * `sustenance.reason` is non-null exactly when `drift` is 0 for a structural
   * reason: `untyped` (no sphereAffinity — still on the legacy alignment-distributed
   * income path), `no-host` (host resolves to no location carrying resources),
   * `no-matching-goods` (the land grows nothing of that sphere), or `ceiling`
   * (sanctity already at `ECON_SANCTITY_NURTURE_CEILING` — the land cannot flower a
   * source, only the god's hand can). A zero drift with a null reason just means a
   * neutral larder.
   *
   * Read-only; does not mutate sanctity. Returns `{ error }` with no live session.
   */
  getEssenceSources: () => Promise<
    | {
        sources: Array<{
          hostId: string;
          hostName: string;
          kind: import('./types/essenceSource').SourceKind;
          tier: import('./types/essenceSource').SourceTier;
          sphereAffinity: import('./types').SphereName | null;
          sanctity: number;
          contestedBy: string | null;
          desecrated: boolean;
          sustenance: {
            drift: number;
            affinityScore: number;
            polarity: import('./data/essence-sources').SustenancePolarity;
            economicHostId: string | null;
            matchedResourceIds: string[];
            reason: import('./engine/essenceEconomyBridge').SustenanceBlockReason | null;
          };
        }>;
        sourceIncome: Partial<Record<import('./types').SphereName, number>>;
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
  /** THR-775 — Stage the nudge golden exemplar (`The Darkhollow Vault`) on an agent at
   *  the attended tier, so the nudge hand is actually in play.
   *
   *  The exemplar is a fixture deliberately absent from every pool, so this registers it
   *  into the lookup index first (index only — never `UNIFIED_ACTION_TEMPLATES`, so no
   *  scoring pass can draw it afterwards). The sanctioned browser-verify path for the
   *  nudge stage until WS5 converts shipped templates. */
  spawnNudgeExemplar: (agentQuery: string) => Promise<DebugSpawnEncounterResult & { notificationId?: string }>;
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

  /** THR-773 — The nudge hand for an agent's active (or most-recent) unified action step.
   *  Returns every authored card partitioned playable / dimmed / hidden, the committed
   *  ids, the single active rider, the trait variants in force, and the named forecast
   *  modifiers (`nudge:<id>` / `trait:<id>`) the committed hand contributes.
   *
   *  `attended` reports whether the action sits at the `story_beat` tier — the scope rule
   *  is that nudges exist ONLY in the attended encounter, so an authored hand on a
   *  background action is inert by design, not by bug.
   *
   *  Agent matching: exact id, then id prefix, then case-insensitive partial name.
   *  Read-only. `{ error }` when no live state / no matching actor / no action / no template. */
  getEncounterNudges: (agentRef: string) => Promise<
    | { error: string }
    | {
      actionId: string;
      templateId: string;
      stepIndex: number;
      attended: boolean;
      playable: Array<{ id: string; name: string; cost: number; rider: string | null }>;
      dimmed: Array<{ id: string; name: string; blocked: string | null }>;
      hidden: string[];
      activeNudges: string[];
      activeRider?: string | null;
      committedCost?: number;
      traitVariants?: Array<{ traitId: string; factorLine: string }>;
      modifiers: Array<{ source: string; delta: number }>;
      modifierTotal: number;
    }
  >;

  /** THR-775 — Toggle the nudge stage's **designer view**.
   *
   *  Off (the default) the encounter stage is the player surface: words only, and the
   *  `sphere_locked` / `unlock_missing` / `trait_missing` cards are withheld. On, the
   *  same stage additionally renders the difficulty value, the forecast probability,
   *  each card's forecast delta and rider, and the withheld list with its reasons.
   *
   *  Same store the DebugPanel's Nudges tab writes — flipping either moves both.
   *  Returns the state actually in force after the write. */
  setNudgeDesignerView: (enabled: boolean) => Promise<boolean>;

  /** THR-775 — Current designer-view state, without changing it. */
  isNudgeDesignerView: () => Promise<boolean>;

  /** THR-773 — Every mortal currently in the broken state, with ticks-broken each.
   *
   *  The measurement hook for the plan's pacing falsifier (">5% of living mortals
   *  simultaneously broken, or median ticks-broken outside 84–168"): read `brokenShare`
   *  and the `ticksBroken` distribution off a long headless run.
   *
   *  `gateEnabled` mirrors `BROKEN_GATE_ENABLED`. It ships **false**, and the state
   *  accrues regardless — so a populated `agents` list does NOT mean the candidacy
   *  exclusion and drift pull are live. Read the flag, not the list length. */
  getBrokenAgents: () => Promise<
    | { error: string }
    | {
      tick: number;
      gateEnabled: boolean;
      brokenCount: number;
      livingActorCount: number;
      brokenShare: number;
      agents: Array<{
        id: string;
        name: string;
        ratio: number;
        state: import('./types/resolution').QuintessenceThresholdState;
        ticksBroken: number;
      }>;
    }
  >;

  /** THR-66 — List active/terminal rival schemes across all rivals. */
  getRivalSchemes: () => Array<{
    rivalId: string;
    compositionId: string;
    family: string;
    phase: string;
    escalationTier: number;
    status: 'active' | 'completed' | 'failed';
  }>;
  /**
   * THR-621 — What each rival is bleeding out of the player's essence sources.
   *
   * One row per rival (including rivals draining nothing, so absence is visible).
   * `drainedEssence` is the cumulative essence redirected off the player's
   * portfolio to that rival — the ledger behind "income redirects to the rival",
   * since rivals are not graph nodes and hold no pool of their own. `sources`
   * lists the host nodes it currently contests or has desecrated; a row with
   * `desecrated: true` yields the player nothing until reclaimed.
   *
   * Synchronous — safe to read directly, no `await`.
   */
  getRivalSourceDrains: () => Array<{
    rivalId: string;
    rivalName: string;
    drainedEssence: number;
    sources: Array<{
      hostId: string;
      hostName: string;
      kind: string;
      tier: string;
      desecrated: boolean;
    }>;
  }>;
  /** THR-66 — Force-launch a rival scheme for QA. Accepts rival id, id prefix, or partial name,
   *  and a family id (`corruptive` | `territorial` | `economic` | `profane`). Mutates live state; engine picks it up next tick. */
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

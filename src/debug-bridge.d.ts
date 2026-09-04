import type { TraceEntry } from './types/trace';
import type { AgentAttachments } from './engine/agentAttachments';
import type { RewardHistoryEntry } from './engine/rewardHistory';
import type { BalanceRunSummary, BalanceTargets, BalanceEvaluationResult } from './types/balanceEval';
import type { TickEvent } from './types/gameState';
import type { DebugSpawnEncounterResult, DebugSpawnEncounterContextResult, DebugSpawnEncounterOptions, DebugSpawnEncounterContextOptions } from './engine/debugEncounterTools';
import type { DebugWorldSpawnResult, DebugSpawnLocationOptions, DebugSpawnSublocationOptions, DebugSpawnNpcOptions, DebugMoveAgentOptions, DebugSpawnAttachmentOptions, DebugSpawnCompanionOptions, DebugSpawnBandOptions } from './engine/debugWorldSpawnTools';
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

/** Narrative interrupt surfaces `dismissBeats()` may clear. THR-1019 */
export type DebugBeatInterruptSurface =
  | 'AscendantBeatModal'
  | 'AscendantBeatOfferBanner'
  | 'JourneyVignetteModal'
  | 'StoryBeatModal'
  | 'PremonitionModal';

/** One surface's outcome within a single `dismissBeats()` pass. THR-1019 */
export interface DebugBeatDismissalRecord {
  surface: DebugBeatInterruptSurface;
  /** True when the surface's handler ran without throwing. */
  dismissed: boolean;
  /** Present when the handler threw — the drain continues regardless (NFP #4). */
  error?: string;
}

/** Result of `dismissBeats()`. THR-1019 */
export interface DebugBeatDismissalResult {
  /** How many interrupt surfaces were cleared across every pass. */
  dismissed: number;
  /** Surfaces cleared, in order, with repeats across passes. */
  surfaces: DebugBeatInterruptSurface[];
  /** How many drain passes ran. */
  passes: number;
  /** True when the drain stopped at the pass bound with beats still open. */
  exhausted: boolean;
  /** Dismissable interrupt surfaces still open when the drain stopped. */
  remaining: string[];
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
   * THR-1142: read an agent's live travel intent — where an `agent_relocation`
   * aftermath effect sent them, and how far along they are.
   *
   * An intent is a *lean*, not a route: it adds a distance-decayed weight to the
   * agent's encounter-movement scoring (`RELOCATION_INTENT_SCORE_WEIGHT`), so a
   * mortal with a better reason to stay may never arrive — and `ticksRemaining`
   * going negative is that story ending, not a bug. The intent is cleared on the
   * agent's next decision tick after arrival or expiry.
   *
   * Accepts an agent id, id prefix, or partial name (case-insensitive). `null` when
   * no agent matches, the game is not loaded, or the agent carries no intent.
   */
  getRelocationIntent: (agentIdOrName: string) => Promise<{
    agentId: string;
    agentName: string;
    destinationNodeId: string | null;
    destinationName: string | null;
    destinationHex: { col: number; row: number };
    /** Live hex distance still to cover; 0 means the arrival sweep fires next decision phase. */
    hexesRemaining: number | null;
    setAtTick: number;
    expiresAtTick: number;
    /** Negative once lapsed but not yet swept. */
    ticksRemaining: number | null;
    source: 'aftermath';
    templateId: string | null;
    stampResidenceOnArrival: boolean;
  } | null>;

  /**
   * THR-1298: the reactive loop's readout — active vendettas and the standing grudges
   * cooled ones left behind.
   *
   * `grievances` reads `pursues` edges carrying `grievance: true`; `grudges` reads
   * agent→agent `hostile_to` edges. Both are edge state, not node state: two agents
   * avenging two different harms pursue the *same* ambition node, so only the edge knows
   * whose harm it was.
   *
   * **Scope.** Called with no argument, sweeps every actor. Called with a selector (id,
   * id prefix, partial name, or `@hero`), scopes to that one agent — and a selector that
   * matches nobody returns empty rather than widening back to the world, so a typo reads
   * as "no match" and never as "the world has no grievances".
   *
   * `grudges` reads **outgoing edges only**. `writeGrudge` writes both directions, so a
   * world sweep would otherwise report every pair twice; a one-sided edge written by
   * another producer still appears on the side that holds it.
   *
   * `heat` is the engine's raw number and `heatWord` is the same value as the player
   * reads it on the sheet — assert against `heatWord` when checking what a surface
   * shows, and against `heat` when checking the decay curve.
   */
  getGrievances: (agentIdOrName?: string) => Promise<{
    grievances: Array<{
      agentId: string;
      agentName: string;
      /** The shared ambition node — not unique per grievance. */
      ambitionId: string;
      status: string | null;
      /** `null` when the harm resolved no culprit (fail-soft path), not an error. */
      culpritAgentId: string | null;
      culpritName: string | null;
      heat: number | null;
      heatWord: 'burning' | 'hot' | 'cooling';
      harmMagnitude: number | null;
      chainDepth: number | null;
      mintedByEventId: string | null;
      mintedByLabel: string | null;
    }>;
    grudges: Array<{
      agentId: string;
      agentName: string;
      targetId: string;
      targetName: string;
      /** Raw provenance value, read across the `cause`/`reason`/`basis` key divergence. */
      provenance: string | null;
      causeClause: string;
      since: number | null;
      sourceEventId: string | null;
    }>;
  }>;

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
  /** THR-631: raw Motive Receipt from an agent's most recent encounter selection (ranked decision-causality contributions). Accepts `@hero`, id, id prefix, or partial name. Null if no match or no selection yet.
   *  THR-1032: became async when it moved onto the shared agent resolver — `await` it. */
  getMotiveReceipt: (agentQuery: string) => Promise<import('./types/foreshadowing').MotiveReceipt | null>;
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
  /**
   * The Repertoire (THR-1180) — every nudge card this god holds, why it is held,
   * and how far along each sphere's attunement stands.
   *
   * `entries` lists held cards only: a locked card is absent, never listed with
   * `access: 'locked'`. What a card is *waiting on* is read off `attunement`,
   * which reports each sphere's lifetime earned total against
   * `SPHERE_ATTUNEMENT_THRESHOLDS` — so a member that has not arrived reads as
   * "12 earned, next mark 20" rather than as silence.
   *
   * `entries` is empty (not an error) for a legacy archetype run with no
   * `ascendantIdentity`: no sphere identity, no repertoire to build. `attunement`
   * is still populated there, because the counter runs regardless of identity.
   *
   * `lastDeal` (THR-1247) reports the most recent dealt hand — every candidate
   * the dealer weighed, its score broken into the three terms, why each one was
   * or was not taken, and the ids finally minted. It is `null` until something
   * has been dealt this session, and it is **diagnostic only**: no gameplay path
   * reads it, and dealing deliberately emits no trace (it is pure and replayable,
   * and hand assembly runs on the render path where a trace would double-fire),
   * so this readout is the inspectability surface for "why did I get this hand".
   *
   * `dealable.profiled` is how many library members carry a play profile at all
   * — the gauge that separates "the dealer had nothing to offer" from "the
   * dealer chose nothing". It climbs toward the library size as THR-1248's
   * corpus lands.
   *
   * Returns `{ error }` with no live session. **Async — `await` it** (the usual
   * forgotten-await trap reads as an empty object, impediment #405).
   */
  getRepertoire: () => Promise<
    | {
        entries: Array<{
          cardId: string;
          title: string;
          typeId: string;
          sphere: import('./types').SphereName | null;
          access: 'full' | 'discounted';
          source:
            | 'core'
            | 'signature'
            | 'hunger'
            | 'milestone'
            | 'god_trait'
            | 'sphere_attunement'
            | 'echo';
          unlockKind: 'starting' | 'milestone' | 'god_trait' | 'sphere_attunement';
        }>;
        essenceEarnedBySphere: Partial<Record<import('./types').SphereName, number>>;
        attunement: Array<{
          sphere: import('./types').SphereName;
          earned: number;
          /** Marks already reached, ascending. */
          marksReached: readonly number[];
          /** The next mark, or `null` when every mark is reached. */
          nextMark: number | null;
        }>;
        /** THR-1247 — the most recent deal, or `null` if nothing has been dealt. */
        lastDeal: {
          templateId: string;
          /** Every member weighed, best score first. */
          candidates: ReadonlyArray<{
            cardId: string;
            title: string;
            score: number;
            sphereTerm: number;
            tagTerm: number;
            provenanceTerm: number;
            /** Absent ⇒ this one was dealt. Present ⇒ why it was not. */
            eliminated?:
              | 'no_profile'
              | 'no_band_fragments'
              | 'type_already_authored'
              | 'type_excluded'
              | 'hand_full'
              | 'delta_budget'
              | 'not_selected';
          }>;
          /** Minted ids, in hand order. */
          dealt: readonly string[];
          /** Cards asked for, after clamping to the room the hand had. */
          requested: number;
          /** Cards the encounter authored on that step. */
          authored: number;
        } | null;
        /** THR-1247 — how much of the library the dealer can currently draw on. */
        dealable: { profiled: number };
      }
    | { error: string }
  >;

  /**
   * THR-1206 — `a`'s reputation with `b`, and which of the four stores answered.
   *
   * The single read behind every standing surface. `a` takes the bridge's usual fuzzy
   * agent query (`@hero`, an id, a partial name); `b` must be a **node id**, since the
   * counterparty may be a place or a faction and no agent resolver would find it.
   *
   * `source` is the diagnostic: `membership` → `member_of.reputation`; `edge` →
   * a `reputation_with` edge; `bond` → `relates_to.trust` remapped to [0,1];
   * `default` → nothing has happened between them. A `default` where you expected a
   * write means the effect did not land — the `reputation_with_changed` /
   * `encounter_aftermath_effect` traces carry the refusal reason.
   *
   * `band` is the player-facing word, from the one vocabulary every reputation
   * surface shares (`REPUTATION_WORDS`). `allStandings` lists every edge-leg standing
   * the actor holds (up to 20, strongest first), so a write that landed on the wrong
   * counterparty is visible rather than merely absent.
   *
   * **Async — `await` it.** An unawaited call logs a Promise, not the reading.
   */
  getReputationWith: (a: string, b: string) => Promise<
    | {
        score: number;
        band: string;
        source: 'membership' | 'edge' | 'bond' | 'default';
        actorId: string;
        actorName: string;
        targetId: string;
        targetName: string;
        allStandings: Array<{
          targetId: string;
          targetName: string;
          score: number;
          band: string;
        }>;
      }
    | { error: string }
  >;

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

  // ── Follow affordance (THR-1299) ──────────────────────────────────────────
  /**
   * Who the player is watching, as the three terms that decide it.
   *
   * `explicit` is the affordance's list. `threaded` is derived from **live**
   * `thread` edges filtered to the default-followed court positions
   * (`the_first` / `retinue`; an unstamped edge reads as `retinue`) — so
   * `dormant` and `watched` agents are absent here even though their edge
   * exists. `muted` names default-followed agents whose interrupt upgrade the
   * player dropped; their moments still queue and still badge.
   *
   * Async — `await` it. A forgotten `await` reads as an empty object rather
   * than as a missing await.
   */
  getFollowedAgents(): Promise<{
    explicit: readonly string[];
    threaded: readonly string[];
    muted: readonly string[];
  }>;
  /**
   * The moment queue — `state.pendingUndertakingMoments` (THR-1299 slice 2).
   *
   * Every record the checkpoints have produced and the cap (`MOMENT_QUEUE_MAX`)
   * has not evicted, **acknowledged ones included** — the badge model decides
   * what it counts, this does not pre-decide. Each carries the `presentation`
   * stamped at emission (`interrupt` / `badge` / `none`), so a constructed proof
   * can assert the interrupt arm without a card on screen. Pass an id, id
   * prefix, partial name or `@hero` to narrow to one actor; an unknown ref
   * returns `[]`, never throws.
   *
   * In a CLI or unfollowed world every record reads `badge` or `none` — the
   * interrupt arm needs `followAgent()` first. Async — `await` it.
   */
  getUndertakingMoments(agentRef?: string): Promise<readonly import('./types/strategicAction').UndertakingMomentRecord[]>;
  /**
   * The calling (THR-1299 slice 5) — the stored title on the agent node and the
   * tick it was set, plus `derived`: what a fresh derivation says right now.
   * When `derived.titleKey` differs from `titleKey`, the hysteresis gate is
   * holding a challenger back (hold floor or margin); the trace buffer's
   * `calling_change` rows carry both scores. `null` for an unknown ref or no
   * game. Async — `await` it.
   */
  getCalling(agentRef: string): Promise<{
    agentId: string;
    title: string | null;
    titleKey: string | null;
    sinceTick: number | null;
    derived: { title: string; titleKey: string; score: number };
  } | null>;
  /**
   * Follow an agent by id, id prefix, partial name, or `@hero`.
   *
   * The sanctioned route for the constructed interrupt proof: CLI worlds carry
   * no thread edges, so nothing is default-followed there and a moment can
   * never resolve `interrupt` without this. Clears any mute as well as adding
   * the explicit entry. Synchronous; the write lands in React state, so read it
   * back with `getFollowedAgents()` on the next frame.
   */
  followAgent(agentRef: string): { success: boolean; agentId?: string; message?: string };
  /**
   * Un-follow an agent. Removes the explicit entry; if the agent is still
   * default-followed by court position afterwards, records a mute instead —
   * that is the only way to silence a retinue member without touching their
   * court position.
   */
  unfollowAgent(agentRef: string): { success: boolean; agentId?: string; message?: string };
  /** @internal GameView registers the follow write levers here */
  _registerFollowBridge(callbacks: {
    followAgent: (agentRef: string) => { success: boolean; agentId?: string; message?: string };
    unfollowAgent: (agentRef: string) => { success: boolean; agentId?: string; message?: string };
  }): void;

  // ── Strategic action inspection (shipped THR-1292; declared THR-1299) ─────
  /**
   * Decision-board summary for one agent, or the whole board when omitted.
   * Returns null when no game is loaded. Async — `await` it.
   */
  getStrategicDecisionSummary(agentId?: string): Promise<unknown>;
  /** Every live `StrategicProjectRuntime` (undertaking) on the board. Async. */
  getStrategicProjects(): Promise<unknown[]>;
  /**
   * Completed/abandoned undertaking history, narrowed to one actor id when
   * given. Note this filters on an exact `actorId` — unlike most accessors it
   * takes no name or `@hero` alias. Async.
   */
  getStrategicHistory(agentId?: string): Promise<unknown[]>;
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

  /**
   * THR-1019: clear every currently-open narrative interrupt so a browser-verification
   * run can reach the surface behind it. **The sanctioned replacement for the
   * hand-rolled `[role="dialog"]` dismissal loop** (impediments #385, #427, #445, #446,
   * #447, #453, #455).
   *
   * Resolves each surface through its own React handler — and so through the engine's
   * beat state machine (`resolvePendingBeat`) — never by clicking DOM nodes, so it works
   * regardless of which component renders the beat. A `selection` beat is resolved with
   * its first grant, because the engine refuses one that arrives with no choice and the
   * modal would otherwise stay open (see `selectDefaultBeatChoice`).
   *
   * Beats chain, so this drains in passes with a re-render between each, bounded by
   * `DEBUG_DISMISS_BEATS_MAX_PASSES` (12) — hitting the bound returns `exhausted: true`
   * rather than throwing (NFP #4).
   *
   * **Scope, deliberately narrow:** ascendant beats (entered + offer banner), journey
   * vignettes, story beats and premonitions. It does **not** touch the encounter veil,
   * the Meet-The-First flow, choice sets, emergence dilemmas or divine receipts — those
   * are what a verification run is usually there to observe.
   */
  dismissBeats(): Promise<DebugBeatDismissalResult>;
  /**
   * THR-1019: while set, newly-arriving narrative interrupts are resolved silently as
   * they appear, for scripted playthroughs that tick past many beats. Prefer this over
   * repeated `dismissBeats()` when driving `__DEBUG.tick(n)` — a beat that arrives
   * mid-batch is cleared without the run having to notice it.
   *
   * Off by default and dev-only (the whole bridge is tree-shaken in prod). This is a
   * verification lever, **not** a change to interrupt behavior — nothing about how the
   * game presents beats to a player changes.
   *
   * Returns the resulting state. Call `suppressBeats(false)` to restore normal beats.
   */
  suppressBeats(enabled?: boolean): boolean;
  /**
   * THR-1414: stage a premonition on an agent so the Premonition surface can be
   * reached on demand, instead of waiting for the whole gate chain (threaded ·
   * tier ≥ 1 · idle · whisper available · undissolved · has nudge candidates) to
   * coincide with an open display window.
   *
   * `'whisper'` builds the real whisper that agent would receive — the same nudge
   * derivation and prose `phaseDivinePremonition` uses — and queues it **visible
   * immediately**, bypassing `PREMONITION_DISPLAY_DELAY_TICKS`. The modal opens on
   * the next render; no ticking required.
   *
   * `'compulsion'` is composed from the agent's actual scored encounter candidates,
   * which exist only inside the decision phase — so it cannot be built from outside.
   * This arms a one-shot flag that bypasses the court-position and cooldown gates;
   * call `tick(1)` and a real compulsion is emitted at the real scoring moment.
   * `staged` is `'armed'` in that case rather than `'queued'`.
   *
   * Async — it resolves `agentQuery` (`@hero`, an id, an id prefix, or a partial
   * name) the same way the other agent accessors do. Always `await` it.
   */
  forcePremonition(
    agentQuery: string,
    kind?: 'whisper' | 'compulsion',
  ): Promise<ForcePremonitionResult>;
  /** @internal GameView registers its premonition stager here */
  _registerForcePremonition(
    fn: (agentId: string, kind: 'whisper' | 'compulsion') => ForcePremonitionResult,
  ): void;
  /** THR-1019: whether `suppressBeats(true)` is currently in force. */
  isBeatSuppressionActive(): boolean;
  /** @internal GameView registers its one-pass narrative-interrupt dismisser here */
  _registerBeatDismisser(fn: () => DebugBeatDismissalRecord[]): void;
  /** @internal GameView registers its beat-suppression setter here */
  _registerBeatSuppression(fn: (enabled: boolean) => void): void;

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
  /** Mint a companion (THR-1413) onto an agent or the ascendant, and show the row.
   *
   *  `spawnAttachment` cannot do this: it searches artifact/trait **nodes** in the graph,
   *  and `COMPANION_TEMPLATES` are a data array that never becomes nodes. Match ladder:
   *  exact id (`companion.wayfarer`) → id prefix → profession substring. `@hero` and
   *  `@ascendant` both resolve; an ascendant companion renders on `AscendantSheet`.
   *  Repeat mints of the same template on the same bearer walk the tick forward, so the
   *  second call adds a second companion rather than silently no-opping. */
  spawnCompanion: (agentQuery: string, templateQuery: string, options?: DebugSpawnCompanionOptions) => DebugWorldSpawnResult;
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
   *
   *  THR-1032: this threw `getAllNodes is not a function` for EVERY argument until
   *  2026-08-17, so it had no working callers and its shape was changed freely to
   *  match this file's `{ items, error }` convention. An unresolvable selector now
   *  returns `{ error, consequences: [] }` naming the collection searched, rather
   *  than an empty array that reads as "this actor has no consequences".
   *
   *  @param actorRef - `@hero`, an exact actor id, an id prefix, or a partial name
   *  @param last - number of records to return (default 10)
   */
  consequencesFor: (actorRef: string, last?: number) => Promise<{
    /** The resolved actor id — confirms which actor the records belong to. */
    actorId?: string;
    error?: string;
    consequences: Array<{
      tick: unknown;
      templateId: unknown;
      band: unknown;
      qDelta: unknown;
      growthMultiplier: unknown;
      progressCounterDelta: unknown;
      dropIntent: unknown;
      complicationId: unknown;
    }>;
  }>;

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

  /** THR-868 — Where the Meet-The-First flow is, and what its tests resolved to.
   *
   *  The only bridge method that does **not** read `GameState`: the meeting runs before
   *  the candidate exists as a graph node, so `MeetTheFirstFlow` publishes a snapshot to
   *  a module-local store on each beat transition and clears it on unmount.
   *
   *  Resolves `null` when no meeting is on screen. During a meeting,
   *  `usingFormativeTests: false` means every drawn template is unconverted and the
   *  legacy choice scene is showing — a real state during the THR-868 rollout, not a
   *  fault. `convertedCount` is how many of `dilemmaIds` carried a `test`.
   *
   *  *Why* those dilemmas were dealt is a different question, answered elsewhere: the
   *  resonance scoring behind the deal persists as `meetingChoiceRecord.dilemmaSelection`
   *  on the thread edge once the meeting completes (THR-1213 slice 2) — hunger, per-slot
   *  score, pool size, and whether the anti-resonance valve fired. Selection is flow-time,
   *  not tick-loop, so that record is the inspectability channel in place of a trace.
   *
   *  **Async** (`await` it) — the bridge has no static imports, so the store module is
   *  pulled in on call. An unawaited call logs a Promise. */
  getMeetingState: () => Promise<
    | null
    | {
      beat: 'sensing' | 'testing' | 'spark' | 'bond';
      candidateName?: string;
      dilemmaIds: string[];
      convertedCount: number;
      usingFormativeTests: boolean;
      formativeOutcomes: Array<{
        templateId: string;
        band: string;
        writtenPole: 'a' | 'b';
        netLean: 'a' | 'b' | 'none';
        shift: number;
        playedNudgeIds: string[];
      }>;
      bondOutcome?: {
        band: string;
        reception: string;
        playedNudgeIds: string[];
      };
    }
  >;

  /** THR-1030 — What the `?outcome=<band>` review pin actually produced.
   *
   *  Resolves `null` when no pin is armed. `{ ..., status: 'pending' }` means a pin is
   *  armed but the template has not resolved yet.
   *
   *  Read `status` before trusting the ending on screen — this is the field that keeps
   *  the lever from laundering the very defect it exists to find:
   *  - `band_rendered` — the authored band for the requested outcome is on screen.
   *  - `unauthored_band` — the encounter ended where you asked, but **no variant
   *    authors that band**, so the base ending is showing under the band's name.
   *  - `outcome_diverged` — the steps were pinned but the action aggregated to a
   *    different action-level outcome. A pinned `near_miss` always diverges (it has no
   *    `UnifiedActionOutcome` counterpart); a pinned `failure` diverges unless the
   *    step's `failBehavior` is `fail_action`.
   *  - `no_aftermath_config` — the template authors no aftermath at all.
   *
   *  `authoredBands` lists every action outcome any variant of the template authors a
   *  band for — the quickest way to see which bands are worth asking for.
   *
   *  **Async** (`await` it) — the bridge has no static imports, so the pin module is
   *  pulled in on call. An unawaited call logs a Promise, not the verdict. */
  getOutcomePinVerdict: () => Promise<
    | null
    | { readonly templateId: string; readonly band: string; readonly status: 'pending' }
    | {
      readonly templateId: string;
      readonly requestedBand: 'critical_success' | 'success' | 'success_at_cost' | 'near_miss' | 'failure' | 'critical_failure';
      readonly actualOutcome: string;
      readonly status: 'band_rendered' | 'unauthored_band' | 'outcome_diverged' | 'no_aftermath_config';
      readonly authoredBands: readonly string[];
      readonly message: string;
    }
  >;

  /** THR-1300 slice 2 — start an undertaking on an agent for review, through the board's
   *  own candidate helpers and start path. Bypasses exactly three generation gates
   *  (`ambition_profile`, `active_cap`, `motive_gate`), each named on the
   *  `strategic_action_started` trace as `bypassedGates` with `startedBy: 'review_lever'`,
   *  so the census excludes it. Every other refusal (reach floor, apprentice, control,
   *  remote anchor, duplicate window) still applies and comes back in `refusals`.
   *
   *  A destroy prefers a target with an owner; `targetOwned: false` means the start is a
   *  raze of nothing. `belowSpotlight: true` means the actor is not an autonomous decision
   *  actor — the undertaking exists but its checkpoints roll only when the phase visits
   *  them, and a live-proof claim on such a start is a failed claim. `band` arms
   *  `pinUndertakingBand` for the template in the same call. `@first` resolves to the
   *  bonded First. Returns `{ ok: false, reason }` rather than throwing. */
  startUndertaking: (agentRef: string, templateId: string, options?: { target?: string; band?: string }) => {
    readonly ok: boolean;
    readonly reason?: 'unknown_template' | 'unknown_actor' | 'no_target' | 'refused';
    readonly refusals?: readonly string[];
    readonly projectId?: string;
    readonly bypassedGates?: readonly string[];
    readonly belowSpotlight?: boolean;
    readonly targetOwned?: boolean;
    readonly message: string;
  };

  /** THR-1300 slice 2 — pin every checkpoint of `templateId`'s projects to `band` while
   *  set (the `?outcome=` analog for undertakings). Roll, floors and riders still run and
   *  trace; only the band is substituted, so creation effects, halts, forks and moments
   *  fire as a real resolution's would. Pass `null` to clear. Returns whether it armed. */
  pinUndertakingBand: (templateId: string | null, band?: string) => Promise<boolean>;

  /** THR-1300 slice 2 — what the pin has done. `not_reached` until a checkpoint of the
   *  template resolves; `band_landed` when it landed on a band the template authors
   *  `creationEffects` for; `no_effect_on_band` when it landed but the base checkpoint
   *  texture is on screen — do not mistake that for authored content. `null` when no pin.
   *  **Async** (`await` it) — the levers module is pulled in on call. */
  getUndertakingPinVerdict: () => Promise<{
    readonly templateId: string;
    readonly requestedBand: string;
    readonly status: 'band_landed' | 'no_effect_on_band' | 'not_reached';
    readonly landed: number;
    readonly message: string;
  } | null>;

  /** THR-1300 slice 2 — the `?forceencounters` analog for moments: while on, every
   *  followed mortal's `started` moment interrupts instead of badging. Follow scope is
   *  unchanged — an unfollowed mortal stays invisible. Headless twin of `?forcemoments`.
   *  Async — `await` it before the next `tick(n)`. */
  forceMoments: (on: boolean) => Promise<void>;

  /** THR-1212 — every `WorldRef` that resolved to nothing, newest last.
   *
   *  A reference that fails to resolve is *supposed* to fall soft: the surface draws
   *  plain text and no affordance rather than a dead link (NFP #4, Law 21). Correct,
   *  and therefore invisible — which is how THR-1165's two hollow `$cast:` sentinels
   *  survived, type-checking cleanly while naming a caravan never in the world. This
   *  is where that silence becomes readable.
   *
   *  `surface` is `'unknown'` and `tick` is `-1` when the caller resolved without
   *  supplying them — a thin record rather than none.
   *
   *  A ring buffer capped at `WORLDREF_DROP_LOG_MAX` (200), evicting **oldest** first,
   *  so a long session shows the most recent 200 drops rather than the first 200.
   *
   *  **Async** (`await` it) — the bridge has no static imports, so the resolver module
   *  is pulled in on call. An unawaited call reads as a Promise, not an array, and
   *  `.filter` on it throws. */
  getWorldRefDrops: () => Promise<readonly {
    readonly refKind: string;
    readonly id: string;
    readonly surface: string;
    readonly tick: number;
  }[]>;

  /** THR-1212 — empty the `WorldRef` drop log, to start a clean observation window.
   *
   *  Use before a `tick(n)` batch or an encounter you want to measure in isolation;
   *  without it the buffer still holds whatever the session did on the way here.
   *
   *  **Async** (`await` it) — see {@link DebugBridge.getWorldRefDrops}. */
  clearWorldRefDrops: () => Promise<void>;

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
    /**
     * THR-626 — provisioning state from the supply web. `supplyTier` is the read
     * surface every non-debug surface uses; `supply`/`supplyMax` are the raw
     * larder, exposed here because debug is where numbers belong. An army the
     * supply phase has not scanned yet reads `'supplied'` with null scalars —
     * never provisioned is not the same as starving.
     */
    supplyTier: 'supplied' | 'strained' | 'starving';
    supply: number | null;
    supplyMax: number | null;
    /** Location currently provisioning this army; null when the line is cut. */
    supplyHostId: string | null;
    supplyHost: string | null;
    /** Conduit hops to that host; null when cut off. */
    supplyHops: number | null;
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

/** Result of `window.__DEBUG.forcePremonition` (THR-1414). */
export type ForcePremonitionResult =
  | {
      /** `'queued'` — a whisper is on the queue and visible now. `'armed'` — the next tick emits a compulsion. */
      staged: 'queued' | 'armed';
      kind: 'whisper' | 'compulsion';
      agentId: string;
      agentName: string;
      /** Premonition id, for whispers. Null when a compulsion is merely armed — it does not exist yet. */
      id: string | null;
      /** What the caller must do next before the modal can appear. */
      nextStep: string;
    }
  | { error: string };

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}

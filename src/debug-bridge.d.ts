import type { TraceEntry } from './types/trace';
import type { AgentAttachments } from './engine/agentAttachments';
import type { RewardHistoryEntry } from './engine/rewardHistory';
import type { BalanceRunSummary, BalanceTargets, BalanceEvaluationResult } from './types/balanceEval';
import type { TickEvent } from './types/gameState';
import type { DebugSpawnEncounterResult, DebugSpawnEncounterContextResult, DebugSpawnEncounterOptions, DebugSpawnEncounterContextOptions } from './engine/debugEncounterTools';
import type { DebugWorldSpawnResult, DebugSpawnLocationOptions, DebugSpawnSublocationOptions, DebugSpawnNpcOptions, DebugMoveAgentOptions, DebugSpawnAttachmentOptions } from './engine/debugWorldSpawnTools';
import type { PortfolioPinResult } from './engine/portfolioManager';

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

export interface DebugFireResult {
  success: boolean;
  actionId?: string;
  templateName?: string;
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
  /** List action templates available to fire on agents. Pass an agent id/name to filter by that agent's context, or omit to list all actor-targeting templates. */
  listActions: (agentId?: string) => DebugActionInfo[];
  /** Fire an action template on a target agent immediately, bypassing UI animations. agentId and templateId both accept partial matches. */
  fireAction: (agentId: string, templateId: string) => DebugFireResult;
  /** @internal GameView registers action bridge callbacks here */
  _registerActionBridge: (callbacks: { listActions: (agentId?: string) => DebugActionInfo[]; fireAction: (agentId: string, templateId: string) => DebugFireResult }) => void;
  /** List pending aftermath reactions for the agent query (id, id prefix, or partial name). */
  listAftermathReactions: (agentId: string) => DebugAftermathListResult;
  /** Apply a pending aftermath reaction for the agent query. Omitting reactionId picks the first authored reaction. */
  pickAftermathReaction: (agentId: string, reactionId?: string) => DebugAftermathPickResult;
  /** @internal GameView registers aftermath bridge callbacks here */
  _registerAftermathBridge: (callbacks: {
    listAftermathReactions: (agentId: string) => DebugAftermathListResult;
    pickAftermathReaction: (agentId: string, reactionId?: string) => DebugAftermathPickResult;
  }) => void;
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
  /** Returns the last n reward events (draws and empty-pool misses). Default: all retained (up to 200). */
  getRecentRewards: (n?: number) => Promise<readonly RewardHistoryEntry[]>;
  getTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  enableTracing: () => Promise<void>;
  disableTracing: () => Promise<void>;
  isTracingEnabled: () => Promise<boolean>;
  clearTraces: () => Promise<void>;
  getCrashLog: () => Promise<unknown>;
  clearCrashLog: () => Promise<void>;
  getHealthReport: () => Promise<unknown>;
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
  /** Move an agent to a target location or hex. */
  moveAgent: (agentQuery: string, target: { locationQuery?: string; col?: number; row?: number }, options?: DebugMoveAgentOptions) => DebugWorldSpawnResult;
  /** Add an agent to the player's protagonist portfolio. */
  pinAgent: (agentQuery: string) => PortfolioPinResult;
  /** Remove an agent from the player's protagonist portfolio. */
  unpinAgent: (agentQuery: string) => PortfolioPinResult;

  getEncounterLogAll: () => Promise<EncounterLogSummary>;
  exportEncounterLogAll: (agentNames?: Record<string, string>, seed?: string) => Promise<EncounterLogExportResult>;
  /** Returns total encounter cache full-rebuild count for this session (THR-187). */
  getEncounterCacheRebuildCount: () => number;
  /** Returns all encounter_cache_rebuild traces (THR-187). */
  getEncounterCacheRebuildTraces: () => Promise<ReadonlyArray<TraceEntry>>;
  /** Returns all active compositions from the current game state (THR-225). */
  getActiveCompositions: () => import('./types/gameState').ActiveComposition[];
}

declare global {
  interface Window {
    __DEBUG?: DebugBridge;
  }
}

/**
 * Game State — single source of truth for the entire game.
 *
 * All game state lives in one flat TypeScript interface. No classes with
 * hidden state, no manager singletons. Every engine function takes pieces
 * of this state in and returns updated pieces out.
 */
import type { CosmologyProfile, HexTile, SphereName } from './index';
import type { SimulationClock, ActionInProgress } from './temporal';
import type { EssencePool } from './influence';
import type { MandateState, MandateDefinition } from './mandate';
import type { RivalDefinition, RivalState } from './rival';
import type { DoomClockState, DoomClockDefinition, DoomClockArchetype } from './doomClock';
import type { NarrativeEvent, ChronicleEntry } from './narrative';
import type { EncounterProgress } from './encounter';
import type { UnifiedAction, PendingEncounterSeed, HiddenMark, IntelligenceRecord } from './unifiedAction';
import type { ActiveDelve, DelveQueueEntry, PendingEmergenceDecision } from '../engine/ruins/delveTypes';
import type { HexMutation } from './hexMutation';
import type { NotificationDirective } from './notification';
import type { PendingVignette } from './journeyEngine';
import type { ControlEffect } from './controlEffect';
import type { AscendantIdentity } from './remembrance';
import type { HexRevelation } from './unifiedAction';
import type { SpherePressureEvent } from './sphereAffinity';
import type { QuintessenceEvent } from './quintessence';

export type { ChronicleEntry };
import type { WorldSoulState } from './worldSoul';
import type { EchoDefinition, EchoState } from './echo';
import type { GreatChronicle } from './chronicle';
import type { WorldGraph } from '../engine/graph';
import type { VisibilityMap } from './visibility';
import type { FamiliarityMap } from './familiarity';
import type { AgentKnowledge } from './agentKnowledge';
import type { DigestEntry, ThreadTug, QueuedStoryBeat } from './attention';
import type { StrategicRuntimeState } from './strategicAction';
import type { OmenState, EmittedOmen } from './omen';
import type { EncounterNoveltyRecord } from '../engine/encounterScoring';

// ─── Active Composition ─────────────────────────────────────────

/** Runtime ledger entry for a live phased composition. */
export interface ActiveComposition {
  compositionId: string;
  firedAtTick: number;
  activatedPhaseIds: string[];
  phaseActivationTicks: Record<string, number>;
  resolvedNodes: Record<string, string>;
  status: 'active' | 'completed' | 'failed';
  lastEvaluationTick: number;
}
import type { DoomIdentityMatrix } from './doomIdentity';
import { DEFAULT_DOOM_TICKS as CONFIG_DEFAULT_DOOM_TICKS } from '../data/game-config';

// ─── Game Phase ─────────────────────────────────────────────────

export type GamePhase = 'playing' | 'twilight' | 'harvest' | 'transition';

// ─── Tick Event ─────────────────────────────────────────────────

/** A single event produced during a tick, for the UI to display */
export interface TickEvent {
  id: string;
  tick: number;
  type: 'agent_action' | 'agent_action_resolved' | 'doom_escalation' | 'rival_action'
    | 'essence_gain' | 'mandate_progress' | 'narrative' | 'phase_change' | 'stealth_alert' | 'dilemma_resolved' | 'intervention_effect' | 'sublocation_dissolved' | 'agent_movement' | 'agent_encounter'
    | 'ambition_completed' | 'ambition_abandoned' | 'ambition_milestone' | 'ambition_assigned'
    | 'backstory_unlock'
    | 'settlement_tier_change'
    | 'economic_chronicle'
    | 'tier_promotion'
    // Encounter events
    | 'encounter_completed' | 'encounter_step_success' | 'encounter_step_failure'
    // Social fabric events
    | 'faction_founded' | 'faction_dissolved' | 'trust_shattered' | 'trust_deepened'
    | 'bond_formed' | 'social_encounter' | 'faction_rank_changed' | 'dilemma_resolved_social'
    // Journey events
    | 'journey_beat' | 'journey_phase_change'
    // Return events
    | 'return_resolved' | 'ripple_consequence'
    // Control effect events
    | 'control_effect_established' | 'control_effect_lapsed'
  // Revelation events
    | 'domain_revealed'
    | 'survey_completed'   // THR-415 — Survey people-layer prose band
  // Ruins discovery events
    | 'hidden_site_discovered' | 'elder_site_discovered'
  // Anomaly discovery events
    | 'anomaly_discovered'
  // Army/battle events (TB-073)
    | 'army_mobilization' | 'army_disbanded' | 'battle_started' | 'battle_resolved' | 'siege_established' | 'army_attrition'
  // Quintessence events
    | 'dissolution_event'
  // NPC graduation events
    | 'npc_graduated'
  // Divine premonition events
    | 'divine_premonition'
  // Avatar movement events
    | 'avatar_arrival'
  // Player choice resolution events (THR-73)
    | 'choice_set_resolved'
  // Omen agenda events (THR-19)
    | 'omen_started' | 'omen_expired' | 'omen_beat' | 'omen_forced_shift'
  // Complication outcome events (THR-20)
    | 'complication'
  // Intelligence reliability decay events (THR-137)
    | 'intelligence_decay'
  // Ruins quest hook events (THR-156)
    | 'quest_hook_issued';
  message: string;
  /** Optional sphere coloring for UI */
  sphere?: SphereName;
  /** Significance 0-1 for UI prominence */
  significance: number;
  /** Marks this event as the result of a divine intervention */
  isInterventionBeat?: boolean;
  notification?: NotificationDirective;
  /** Hex coordinates where this event occurred — absent for global events */
  hexCoords?: { col: number; row: number };
  /** Agent ID associated with this event — enables click-to-select on notifications */
  actorId?: string;
  /** Encounter ID — populated by encounter phases for notification navigation */
  encounterId?: string;
  /** Faction ID — populated by social fabric phases for notification navigation */
  factionId?: string;
  /** Journey ID — populated by journey phases for notification navigation */
  journeyId?: string;
  /** Agent IDs that also witnessed this event (for chronicle attribution). */
  witnessAgentIds?: readonly string[];
}

export interface ArchetypeDrift {
  agentId: string;
  axisId: string;
  fromPosition: number;
  toPosition: number;
  lastUpdatedTick: number;
}

export interface RegionDetectionState {
  regionId: string;
  pressure: number;
  lastUpdatedTick: number;
}

export interface EncounterSpotlightState {
  agentId: string;
  encounterId?: string;
  beatIndex?: number;
  trigger: 'world_handoff' | 'manual_select' | 'beat_advancement';
  updatedTick: number;
}

// A player-committed encounter choice queued for resolution by phaseChoiceResolution.
export interface PendingChoiceCommit {
  agentId: string;
  encounterId: string;
  beatIndex: number;
  /** The reach category of the choice (determines drift axis). */
  reach: string;
  cost: 'small_breath' | 'fuller_breath' | 'deep_draught';
  moralAxisPole: 'virtue' | 'flaw';
  /** Pre-computed effective probability (base + tilt, clamped 0–1). */
  effectiveProbability: number;
  driftMagnitude: number;
  consumesItemId?: string;
}

// ─── Game State ─────────────────────────────────────────────────

export interface GameState {
  // Meta
  cycle: number;
  tick: number;
  phase: GamePhase;
  seed: number;

  // World
  graph: WorldGraph;
  cosmology: CosmologyProfile;
  tiles: HexTile[];

  // Clock
  clock: SimulationClock;

  // Player
  ascendantId: string;
  ascendantIdentity: AscendantIdentity | null;  // null for legacy archetype-based creation
  essencePool: EssencePool;
  mandateDefinition: MandateDefinition | null;
  mandateState: MandateState | null;

  // Adversarial
  rivalDefinitions: RivalDefinition[];
  rivalStates: RivalState[];
  doomDefinition: DoomClockDefinition;
  doomClock: DoomClockState;
  /** Per-archetype configuration bundle; loaded at game-init from doomDefinition.archetype. */
  doomIdentityMatrix: DoomIdentityMatrix | null;

  // Narrative
  tickEvents: TickEvent[];           // events from the current tick (cleared each tick)
  recentEvents: TickEvent[];         // rolling buffer of last ~100 events for UI
  chronicleEntries: ChronicleEntry[]; // tier-3 events for end-of-cycle chronicle

  // Stealth (simplified for vertical slice)
  stealthExposure: number;           // 0.0 (hidden) to 1.0 (fully detected)

  // Fog of War
  visibilityMap: VisibilityMap;      // hexCol,hexRow -> visibility state and snapshot

  // Knowledge Fog of War
  familiarityMap: FamiliarityMap;    // actor ID -> familiarity score (0.0-1.0)
  culturalInsightMap: Map<string, number>;  // culture ID -> insight score (0.0-1.0)
  /** Per-agent multi-facet knowledge model (additive overlay on familiarityMap) */
  agentKnowledge: Map<string, AgentKnowledge>;

  /** @deprecated Replaced by unifiedActions. Kept for backward compatibility with existing tests. */
  encounterProgress: EncounterProgress[];

  /** @deprecated Replaced by unifiedActions. Kept for backward compatibility with existing tests. */
  actionsInProgress: ActionInProgress[];

  // Unified Actions (replaces actionsInProgress + encounterProgress)
  unifiedActions: UnifiedAction[];
  /** Run-scoped unlocked actions (Starter actions are always available regardless). */
  unlockedActionIds?: readonly string[];

  // Pending hex mutations — accumulated by hex action resolution, consumed by phaseHexState
  pendingHexMutations?: HexMutation[];

  // Pending sphere pressure events — accumulated by action/encounter/doom phases, consumed by phaseSpherePressure
  pendingSpherePressures?: SpherePressureEvent[];

  // Pending quintessence events — accumulated by overchannel/encounter failure phases, consumed by phaseQuintessence
  pendingQuintessenceEvents?: QuintessenceEvent[];

  // Journey vignettes — queued by journey beat phase, consumed by UI
  pendingVignettes?: PendingVignette[];

  // Encounter notifications — queued by encounter visibility phase, consumed by UI
  encounterNotifications?: import('./encounterVisibility').EncounterNotification[];

  /** Silently accumulated encounter outcomes for Read the Threads. Append-only, pruned on read. */
  digestBuffer?: DigestEntry[];
  /** Active thread tugs awaiting player attention. Managed by phaseAttention. */
  activeThreadTugs?: ThreadTug[];
  /** Queued story beats awaiting pacing governor clearance. Max depth: STORY_BEAT_QUEUE_MAX. */
  storyBeatQueue?: QueuedStoryBeat[];

  // Divine premonitions — queued by phaseDivinePremonition + phaseAgentDecision, consumed by UI
  premonitionQueue?: import('./premonition').PremonitionEvent[];

  // Clearance gates — runtime state for checkpoint/scrutiny encounter shells
  clearanceGateStates?: Map<string, import('./contentShells').ClearanceGateRuntimeState>;

  // Flip tables — runtime state for binary/small-N state flip shells (THR-53)
  flipTableStates?: Map<string, import('./contentShells').FlipTableRuntimeState>;

  // Result band history — deterministic band selections across all templates (THR-53)
  resultBandHistory?: Array<import('./contentShells').ResultBandSelectionRecord>;

  // Control effects — sustained divine effects with per-tick costs, ticked by phaseControlEffects
  controlEffects?: ControlEffect[];

  // Generic effect system runtime state — cooldowns, stacks, decay values per attachment.
  // Keyed by attachment identity (node ID for possessions/traits, edge ID for agreements).
  // Ticked by phaseEffectTick.
  effectStates?: Map<string, import('./effects').EffectRuntimeState>;

  // Delve variant state (THR-152 — PR 4 of Ruins Layer)
  activeDelves?: ActiveDelve[];
  delveAdmissionQueue?: DelveQueueEntry[];
  /** Set when a delve reaches beat 5; cleared when the player (or auto-fire) resolves it */
  pendingEmergenceDecision?: PendingEmergenceDecision;

  // Pending encounter seeds — planted by aftermath reactions, consumed by evaluateEncounterSeeds phase
  pendingEncounterSeeds?: PendingEncounterSeed[];

  // Hidden marks — concealed consequences on agents, queryable by future encounters
  hiddenMarks?: HiddenMark[];

  // Intelligence records — structured knowledge held by agents, queryable by future encounters
  intelligenceRecords?: IntelligenceRecord[];

  // Encounter experience scaffolding — Phase A2 foundational state surfaces.
  archetypeDrift: ArchetypeDrift[];
  regionalDetectionPressure: RegionDetectionState[];
  encounterSpotlight?: EncounterSpotlightState;
  /** @deprecated Phase A2 legacy alias. Use regionalDetectionPressure. */
  regionDetection: RegionDetectionState[];
  /** @deprecated Phase A2 legacy alias. Use encounterSpotlight?.agentId. */
  spotlightedAgent?: string;
  // Queued by the UI when the player commits a choice; consumed by phaseChoiceResolution (THR-323).
  pendingChoiceCommits?: PendingChoiceCommit[];

  // Layer revelation — per-hex, per-layer visibility. Key: hexKey(col,row)
  // Land auto-reveals with fog of war. Soul/People/Ruins require Find actions.
  hexRevelation?: Record<string, HexRevelation>;

  // Prosperity shocks — one-time deltas pushed by other phases, consumed by phaseProsperity
  // Cleared each tick. Each shock traces back to a discrete cause (encounter, route loss, etc.)
  prosperityShocks?: ProsperityShock[];

  // Dynamic faction definitions — FactionDefinitions created at runtime by agent initiatives (THR-51)
  // Keyed by definition ID. Merged with static FACTION_DEFINITIONS when looking up a faction.
  dynamicFactionDefinitions?: Record<string, import('./faction').FactionDefinition>;

  // Strategic actions — proactive world-shaping behavior driven by ambitions
  strategicState?: StrategicRuntimeState;

  // Omen agenda — world atmospheric pressure tracks (THR-19)
  omenState?: OmenState;

  // Emitted omens — aftermath-spawned regional/global omen events (THR-115)
  emittedOmens?: EmittedOmen[];

  // Composition DSL runtime state (THR-225)
  /** Live phased compositions being tracked by the phase runner. */
  activeCompositions?: ActiveComposition[];
  /** World flags set by composition effects. Key: flag key, value: arbitrary. */
  worldFlags?: Record<string, unknown>;
  /** IDs of compositions that have fired (mark-composition-fired effect). */
  firedCompositions?: string[];

  // Onboarding — one-shot flags for auto-triggered encounters
  meetTheFirstAutoTriggered?: boolean;

  // Template novelty pressure — global recency/quota tracking to prevent template monopoly (THR-453)
  encounterNoveltyRecord?: EncounterNoveltyRecord;

  // Metaprogression (persists across cycles)
  worldSoul: WorldSoulState;
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  chronicle: GreatChronicle;
}

// ─── Prosperity Shock ───────────────────────────────────────────

/** A one-time prosperity delta pushed by an upstream phase, consumed by phaseProsperity. */
export interface ProsperityShock {
  locationId: string;
  delta: number;
  causeType: 'trade_route_established' | 'trade_route_lost' | 'trade_route_threatened' | 'trade_route_secured'
    | 'encounter_impact' | 'faction_arrival' | 'faction_departure'
    | 'corruption_shock' | 'corruption_cleared' | 'divine_blessing' | 'divine_blessing_lost'
    | 'unrest_shock' | 'unrest_relief'
    | 'agent_economic_action' | 'wealthy_resident_arrival' | 'wealthy_resident_departure'
    | 'doom_card';
  causeId: string;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────

/** Maximum recent events kept in the UI buffer */
export const MAX_RECENT_EVENTS = 100;

/** Stealth exposure decay per tick (natural forgetting) */
export const STEALTH_DECAY_PER_TICK = 0.01;

/** Default doom clock length in ticks. Re-exported from shared game config. */
export const DEFAULT_DOOM_TICKS = CONFIG_DEFAULT_DOOM_TICKS;

/** Doom archetypes available for selection */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];

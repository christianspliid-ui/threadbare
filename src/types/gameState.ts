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
import type { UnifiedAction } from './unifiedAction';
import type { HexMutation } from './hexMutation';
import type { NotificationDirective } from './notification';

export type { ChronicleEntry };
import type { WorldSoulState } from './worldSoul';
import type { EchoDefinition, EchoState } from './echo';
import type { GreatChronicle } from './chronicle';
import type { WorldGraph } from '../engine/graph';
import type { VisibilityMap } from './visibility';
import type { FamiliarityMap } from './familiarity';

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
    | 'bond_formed' | 'social_encounter' | 'faction_rank_changed' | 'dilemma_resolved_social';
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
  essencePool: EssencePool;
  mandateDefinition: MandateDefinition | null;
  mandateState: MandateState | null;

  // Adversarial
  rivalDefinitions: RivalDefinition[];
  rivalStates: RivalState[];
  doomDefinition: DoomClockDefinition;
  doomClock: DoomClockState;

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

  /** @deprecated Replaced by unifiedActions. Kept for backward compatibility with existing tests. */
  encounterProgress: EncounterProgress[];

  /** @deprecated Replaced by unifiedActions. Kept for backward compatibility with existing tests. */
  actionsInProgress: ActionInProgress[];

  // Unified Actions (replaces actionsInProgress + encounterProgress)
  unifiedActions: UnifiedAction[];

  // Pending hex mutations — accumulated by hex action resolution, consumed by phaseHexState
  pendingHexMutations?: HexMutation[];

  // Prosperity shocks — one-time deltas pushed by other phases, consumed by phaseProsperity
  // Cleared each tick. Each shock traces back to a discrete cause (encounter, route loss, etc.)
  prosperityShocks?: ProsperityShock[];

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
    | 'agent_economic_action' | 'wealthy_resident_arrival' | 'wealthy_resident_departure';
  causeId: string;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────

/** Maximum recent events kept in the UI buffer */
export const MAX_RECENT_EVENTS = 100;

/** Stealth exposure decay per tick (natural forgetting) */
export const STEALTH_DECAY_PER_TICK = 0.01;

/** Default doom clock length in ticks (20000 = 100× normal for testing) */
export const DEFAULT_DOOM_TICKS = 20_000;

/** Doom archetypes available for selection */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];

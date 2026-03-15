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
    | 'essence_gain' | 'mandate_progress' | 'narrative' | 'phase_change' | 'stealth_alert' | 'dilemma_resolved' | 'intervention_effect' | 'sublocation_dissolved' | 'agent_movement' | 'agent_encounter';
  message: string;
  /** Optional sphere coloring for UI */
  sphere?: SphereName;
  /** Significance 0-1 for UI prominence */
  significance: number;
  /** Marks this event as the result of a divine intervention */
  isInterventionBeat?: boolean;
  notification?: NotificationDirective;
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

  // Metaprogression (persists across cycles)
  worldSoul: WorldSoulState;
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  chronicle: GreatChronicle;
}

// ─── Constants ──────────────────────────────────────────────────

/** Maximum recent events kept in the UI buffer */
export const MAX_RECENT_EVENTS = 100;

/** Stealth exposure decay per tick (natural forgetting) */
export const STEALTH_DECAY_PER_TICK = 0.01;

/** Default doom clock length in ticks (200 = longer game cycle) */
export const DEFAULT_DOOM_TICKS = 200;

/** Doom archetypes available for selection */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];

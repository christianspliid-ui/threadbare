/**
 * Game State — single source of truth for the entire game.
 *
 * All game state lives in one flat TypeScript interface. No classes with
 * hidden state, no manager singletons. Every engine function takes pieces
 * of this state in and returns updated pieces out.
 */
import type { CosmologyProfile, HexTile, SphereName } from './index';
import type { SimulationClock } from './temporal';
import type { EssencePool } from './influence';
import type { MandateState, MandateDefinition } from './mandate';
import type { RivalDefinition, RivalState } from './rival';
import type { DoomClockState, DoomClockDefinition, DoomClockArchetype } from './doomClock';
import type { NarrativeEvent, ChronicleEntry } from './narrative';

export type { ChronicleEntry };
import type { WorldSoulState } from './worldSoul';
import type { EchoDefinition, EchoState } from './echo';
import type { GreatChronicle } from './chronicle';
import type { WorldGraph } from '../engine/graph';
import type { VisibilityMap } from './visibility';

// ─── Game Phase ─────────────────────────────────────────────────

export type GamePhase = 'playing' | 'twilight' | 'harvest' | 'transition';

// ─── Tick Event ─────────────────────────────────────────────────

/** A single event produced during a tick, for the UI to display */
export interface TickEvent {
  id: string;
  tick: number;
  type: 'agent_action' | 'agent_action_resolved' | 'doom_escalation' | 'rival_action'
    | 'essence_gain' | 'mandate_progress' | 'narrative' | 'phase_change' | 'stealth_alert' | 'dilemma_resolved';
  message: string;
  /** Optional sphere coloring for UI */
  sphere?: SphereName;
  /** Significance 0-1 for UI prominence */
  significance: number;
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

/** Default doom clock length in ticks (360 = ~1 year) */
export const DEFAULT_DOOM_TICKS = 360;

/** Doom archetypes available for selection */
export const DOOM_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning',
];

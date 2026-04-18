import type { SphereName } from './index';
import type { DoomClockArchetype } from './doomClock';

// ── Fundament (Layer 1) ─────────────────────────────────────────

/** The coefficient ledger — numerical world-state that persists across cycles */
export interface FundamentState {
  /** All 12 sphere weights — how much each sphere exists in the cosmos. Sum to ~1.0 */
  sphereWeights: Record<SphereName, number>;
  /** Number of completed cycles */
  cycleCount: number;
}

/** What caused a Fundament shift */
export type ShiftSource =
  | 'resolved_action'
  | 'doom_escalation'
  | 'mandate_outcome'
  | 'rival_action'
  | 'twilight_event';

/** A single nudge to the Fundament */
export interface FundamentShift {
  source: ShiftSource;
  /** Sphere weight deltas — positive increases, negative decreases. Works for all 12 spheres. */
  sphereDeltas?: Partial<Record<SphereName, number>>;
}

// ── Resonance (Layer 2) ─────────────────────────────────────────

export const MAX_RESONANCE_MEMORIES = 10;

/** Categories of memory that inject thematic content */
export type MemoryType =
  | 'sphere_dominance'
  | 'great_conflict'
  | 'divine_intervention'
  | 'doom_scar'
  | 'mandate_triumph'
  | 'betrayal'
  | 'sacrifice';

/** A single curated memory fragment from a previous cycle */
export interface ResonanceMemory {
  id: string;
  /** Which cycle this memory originated from */
  cycleOrigin: number;
  memoryType: MemoryType;
  /** Spheres associated with this memory */
  spheres: SphereName[];
  /** One-sentence narrative summary */
  summary: string;
  /** 0.0–1.0 how significant this event was */
  significance: number;
  /** 0.0–1.0 how degraded (each cycle adds degradation) */
  degradation: number;
  /** Optional reference to the Chronicle entry that spawned this */
  chronicleRef?: string;
}

/** The curated memory layer of the World-Soul */
export interface ResonanceState {
  memories: ResonanceMemory[];
  maxMemories: number;
}

// ── Sphere Aggregate ───────────────────────────────────────────

/**
 * Global sphere aggregate computed each tick by phaseSphereAggregation.
 * Represents the weighted sum of all entity sphere scores in the world.
 */
export interface SphereAggregate {
  /** Weighted sum of all entity sphere scores */
  totalBySphere: Record<SphereName, number>;
  /** Sphere with highest total; null if all are zero */
  dominantSphere: SphereName | null;
  /** Number of entities that contributed to this aggregate */
  entityCount: number;
}

// ── World-Soul Aggregate ────────────────────────────────────────

export interface WorldSoulState {
  fundament: FundamentState;
  resonance: ResonanceState;
  /** Global sphere aggregate computed each tick by phaseSphereAggregation */
  aggregate?: SphereAggregate;
  /**
   * Accumulated sphere pressures from worsening_convergence complications (THR-120).
   * Keyed by sphere name; values are raw pressure magnitudes from `sphere_pressure` effects.
   * Read by phaseOmenAgenda to bias secondary omen selection toward pressured spheres.
   */
  spherePressures?: Partial<Record<string, number>>;
}

// ── The Unmaking / Twilight Phase ───────────────────────────────

export const TWILIGHT_TICK_RANGE = { min: 5, max: 10 } as const;

/** What triggered the Unmaking */
export type UnmakingTrigger =
  | 'doom_expired'
  | 'mandate_complete'
  | 'player_concession';

/** Runtime state of the Twilight Phase */
export interface TwilightState {
  active: boolean;
  trigger: UnmakingTrigger;
  /** Ticks left in the Twilight Phase */
  ticksRemaining: number;
  /** Total ticks this Twilight Phase lasts */
  totalTicks: number;
  /** Probability penalty applied to all divine actions (0.0–1.0 reduces sigmoid output) */
  successPenalty: number;
}

// ── Harvest / Cycle Transition ──────────────────────────────────

export type HarvestType = 'triumphant' | 'somber' | 'bittersweet';

/** How many echoes survive in each harvest type */
export const HARVEST_ECHO_COUNTS: Record<HarvestType, { cosmic: number; divine: number }> = {
  triumphant: { cosmic: 5, divine: 3 },
  somber: { cosmic: 3, divine: 1 },
  bittersweet: { cosmic: 4, divine: 2 },
};

/** Summary of what was harvested at cycle end */
export interface HarvestOutcome {
  harvestType: HarvestType;
  trigger: UnmakingTrigger;
  /** Doom clock archetype that defined this cycle's flavor */
  doomArchetype: DoomClockArchetype;
  /** Fundament shifts applied during this cycle (for display) */
  totalShifts: FundamentShift[];
  /** Resonance memories captured from this cycle */
  capturedMemories: ResonanceMemory[];
  /** IDs of nodes selected as echoes */
  cosmicEchoIds: string[];
  divineEchoIds: string[];
  /** Updated World-Soul state after blending */
  updatedWorldSoul: WorldSoulState;
}

/** Full transition record for saving between cycles */
export interface CycleTransition {
  cycleNumber: number;
  harvest: HarvestOutcome;
  /** The complete World-Soul passed to the next cycle */
  nextWorldSoul: WorldSoulState;
}

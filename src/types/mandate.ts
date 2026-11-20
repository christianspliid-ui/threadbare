import type { SphereName } from './index';

// ─── Mandate Types ───────────────────────────────────────────────

export type MandateCourtType = 'high_house' | 'circle' | 'web' | 'abyss';

/** The four mandate categories */
export type MandateType =
  | 'graph_state'             // achieve specific world configuration
  | 'narrative'               // trigger specific story beats
  | 'sphere_dominance'        // establish cosmic supremacy
  | 'simulation_achievable';  // emergent simulation milestones

/** The universal 3-stage structure */
export type MandateStage = 'setup' | 'escalation' | 'culmination';

/** Runtime mandate model — legacy graph conditions or remembrance-driven sphere growth. */
export type MandateRuntimeKind = 'legacy' | 'sphere_growth';

/** Court-shaped side objective for the remembrance-driven mandate. */
export type MandateSecondaryObjectiveType =
  | 'web_relationships'
  | 'circle_retinue'
  | 'high_house_settlements'
  | 'abyss_anomalies';

export interface MandateCheckpointDefinition {
  index: number;
  doomProgressThreshold: number;
  label: string;
  description: string;
  requiredPrimaryDelta: number;
  requiredSecondaryDelta: number;
}

export interface MandateSecondaryObjectiveDefinition {
  type: MandateSecondaryObjectiveType;
  label: string;
  description: string;
  target: number;
}

/** A single condition that must be met */
export interface MandateCondition {
  type: 'node_count' | 'edge_count' | 'sphere_weight' | 'actor_tier' | 'custom';
  /** Human-readable description */
  description: string;
  /** Query parameters for graph evaluation */
  params: Record<string, unknown>;
  /** Is this condition currently met? (computed at evaluation time) */
  met?: boolean;
}

/** Stage definition within a mandate */
export interface MandateStageDefinition {
  stage: MandateStage;
  description: string;
  conditions: MandateCondition[];
}

/** Full mandate definition */
export interface MandateDefinition {
  id: string;
  type: MandateType;
  name: string;
  description: string;
  stages: [MandateStageDefinition, MandateStageDefinition, MandateStageDefinition];
  /** Which runtime evaluator this mandate expects. */
  runtimeKind?: MandateRuntimeKind;
  /** For sphere_dominance: which sphere must dominate */
  targetSphere?: SphereName;
  /** How many ticks before this mandate expires (optional time pressure) */
  tickLimit?: number;
  /** Remembrance-shaped primary sphere objective. */
  primarySphere?: SphereName;
  /** Supporting remembrance sphere objective. */
  secondarySphere?: SphereName;
  /** Run-start aggregate baseline for the primary sphere. */
  primaryBaseline?: number;
  /** Run-start aggregate baseline for the secondary sphere. */
  secondaryBaseline?: number;
  /** Required percentage increase over the primary baseline. */
  primaryTargetDelta?: number;
  /** Supporting percentage increase over the secondary baseline. */
  secondaryTargetDelta?: number;
  /**
   * Weighted points the god's own hand must raise in the primary sphere (THR-2081).
   * Written at the baseline settle when the god ledger is on; `primaryTargetDelta`
   * and the checkpoints are then rescaled to it so every relative reader stays correct.
   */
  primaryTargetPoints?: number;
  /** The same for the secondary sphere. */
  secondaryTargetPoints?: number;
  /** Optional remembrance court shape that authored this mandate. */
  courtType?: MandateCourtType;
  /** One-line remembrance-derived intent text. */
  mandateDirection?: string;
  /** Doom checkpoints that feed back into future doom beats. */
  checkpoints?: MandateCheckpointDefinition[];
  /** Optional court-shaped side objective. */
  secondaryObjective?: MandateSecondaryObjectiveDefinition;
}

/** Runtime state tracking for an active mandate */
export interface MandateState {
  mandateId: string;
  currentStage: MandateStage;
  progress: number;          // 0.0 - 1.0 overall mandate completion
  completed: boolean;
  failed: boolean;
  /** Tick when the mandate was assigned */
  assignedTick?: number;
  /** Per-stage completion ticks */
  stageCompletedTicks?: Partial<Record<MandateStage, number>>;
  /** Current aggregate totals for remembrance-driven mandates. */
  primaryCurrent?: number;
  secondaryCurrent?: number;
  /** Percentage increase over the stored baseline. */
  primaryDelta?: number;
  secondaryDelta?: number;
  /** Court-shaped side objective progress. */
  secondaryObjectiveCurrent?: number;
  secondaryObjectiveCompleted?: boolean;
  /** Per-checkpoint evaluation results. */
  checkpointResults?: Array<{
    index: number;
    doomProgressThreshold: number;
    passed: boolean;
    exceeded: boolean;
    evaluatedTick: number;
    requiredPrimaryDelta: number;
    observedPrimaryDelta: number;
  }>;
  /** Accumulated rewards and penalties handed to the doom clock. */
  counterOmensEarned?: number;
  doomSeverityPenalties?: number;
  /**
   * Tick the sphere-growth baseline was re-taken from the settled world (THR-2080).
   * Unset until then; progress and checkpoints do not count before it.
   */
  baselineSettledTick?: number;
  /**
   * Weighted points the god's own hand has raised in the two Mandate spheres since the
   * settle, net of rival and doom wear on that same ground, not doom's tide (THR-2081,
   * THR-2090, `mandateLedger.ts`).
   */
  godLedger?: { primary: number; secondary: number };
  /** Points the god holds per `entityId|sphere` — the most opposition wear can take back there. */
  godHeld?: Record<string, number>;
  /**
   * THR-2208 — the ledger's net moves (both spheres) inside the last
   * `MANDATE_TREND_WINDOW_TICKS`, and their sum. The trend word reads the sum: above 0
   * Rising, below 0 Slipping, else Holding (`mandateTrendOf`).
   */
  recentLedgerMoves?: Array<{ tick: number; points: number }>;
  recentLedgerDelta?: number;
  /** THR-2208 — the last few deeds of bound mortals that raised the Mandate, newest first. */
  recentDeeds?: MandateDeedRecord[];
  /**
   * THR-2251 — the race reading: which clock lands first at the last fifteen days' pace
   * (`raceForecast.ts`). Optional; absent reads as `hidden` and starts empty.
   */
  raceWatch?: RaceWatch;
}

/**
 * THR-2251 — how the age ends at this pace. `hidden` until Doom reaches its Signs stage
 * and five daily samples exist; `stalled` when the Mandate has not risen across the
 * window and its trend word is not Rising.
 */
export type RaceState = 'hidden' | 'mandate_first' | 'doom_first' | 'close' | 'stalled';

/** THR-2251 — one daily sample of both clocks' progress (0–1). */
export interface RaceSample {
  tick: number;
  mandate: number;
  doom: number;
}

/** THR-2251 — the race reading kept on the Mandate state (`raceForecast.ts`). */
export interface RaceWatch {
  /** The last `RACE_WINDOW_SAMPLES` daily samples, oldest first. */
  samples: RaceSample[];
  /** The state the surfaces show — it changes only after a new state held two days. */
  shown: RaceState;
  /** True once the race has been shown this age, so a first sight is told once. */
  seen: boolean;
  /** A computed state that differs from `shown`, and the tick it was first computed. */
  pending?: { state: RaceState; since: number };
  /**
   * Debug-only override written by `window.__DEBUG.forceRace` for evidence. The surfaces
   * read `forced ?? shown` (`shownRaceState`); the phase never writes it.
   */
  forced?: RaceState;
}

/** THR-2208 — one bound mortal's chapter that credited the Mandate. */
export interface MandateDeedRecord {
  tick: number;
  actorId: string;
  /** Captured at the credit, so a later rename or death never rewrites the line. */
  actorName?: string;
  /** The Mandate sphere the deed raised most. */
  sphere: SphereName;
  /** Total points the deed added across both spheres. Designer data — never rendered. */
  points: number;
}

/**
 * ControlEffect — sustained divine effects with per-tick costs.
 *
 * Control effects are the god-game signature: you don't just *do* things,
 * you *hold* things. Each effect drains essence every tick and can lapse
 * when you can't afford it, when a threshold fails, or when contested.
 *
 * Two-object lifecycle:
 *   Phase 1 (Establishment): uses existing UnifiedAction pipeline
 *   Phase 2 (Persistence): ControlEffect on GameState.controlEffects[]
 *
 * NFP compliance:
 *   #1 Tunability: all constants named and exported
 *   #2 Inspectability: three trace types defined
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: all failure cases have fallback behavior
 */

import type { SphereName } from './index';
import type { ReachDomain } from './traits';
import type { GraphOp } from './graphOp';
import type { CoLocatedThreadAuraSpec } from './ascendantPrimitives';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Lapse ordering when essence runs out: last-in-first-out (newest first) */
export const CONTROL_EFFECT_LAPSE_ORDER = 'lifo' as const;

/** Payment ordering: oldest effects pay first */
export const CONTROL_EFFECT_PAYMENT_ORDER = 'established_asc' as const;

/** Ticks between threshold evaluations (1 = every tick) */
export const CONTROL_THRESHOLD_CHECK_INTERVAL = 1;

/** Ticks of deficit tolerated before lapse (0 = immediate) */
export const CONTROL_LAPSE_GRACE_TICKS = 0;

// ─── EssenceType ──────────────────────────────────────────────────────────────

/** Elder sphere names — discovered late-game currency. */
export type ElderSphereName = 'chaos' | 'order' | 'light' | 'darkness';

/** Unified essence type covering both creation and elder spheres. */
export type EssenceType = SphereName | ElderSphereName;

// ─── HexMutationSpec ──────────────────────────────────────────────────────────

/**
 * Template-level hex mutation spec — no col/row.
 * Resolved to full HexMutation at tick time using the effect's target hex.
 */
export interface HexMutationSpec {
  /** Which mutable field to modify */
  readonly field: 'divineInfluence' | 'corruption';
  /** Amount to add to the current value per tick */
  readonly delta: number;
  /** Source identifier for tracing */
  readonly source: string;
}

// ─── SustainThreshold ─────────────────────────────────────────────────────────

/** World-state condition that must remain true for a control effect to persist. */
export interface SustainThreshold {
  /** State field to check (e.g. 'corruption', 'divineInfluence', 'magicalSaturation') */
  readonly field: string;
  /** Whether to check the hex tile or a location node */
  readonly target: 'hex' | 'location';
  /** Comparison operator */
  readonly operator: '>=' | '<=' | '>' | '<';
  /** Value to compare against */
  readonly value: number;
}

// ─── ActorPrerequisites ───────────────────────────────────────────────────────

/** Prerequisites for an actor to contest a control effect. */
export interface ActorPrerequisites {
  readonly reach?: { domain: ReachDomain; minTier: number };
  readonly sphere?: { name: SphereName; relation: 'aligned' | 'opposing' };
}

// ─── ControlSpec ──────────────────────────────────────────────────────────────

/**
 * Mint-a-sustaining-relic spec (THR-518). When a `ControlSpec` carries this,
 * `spawnControlEffect` mints a permanent relic artifact at establishment time
 * and sets the spawned effect's `upkeepArtifactId` to the *freshly-minted*
 * artifact's id — the dynamic counterpart to a static `upkeepArtifactId`, which
 * cannot reference a not-yet-created node. While the relic exists, the effect's
 * `perTickCost` is waived (`relic_upkeep_substitute`, THR-509); destroying it
 * lapses the effect (`upkeep_relic_destroyed`), giving rivals a contestation
 * vector. First consumer: consecrate's relic variant (`action.consecrate-relic`).
 */
export interface MintUpkeepRelicSpec {
  /** Display name for the minted relic node (e.g. "Hallowed Reliquary"). */
  readonly relicName: string;
  /** Tags written onto the minted artifact's possesses edge. */
  readonly tags?: readonly string[];
}

/**
 * Specification for a sustained control effect, stored on UnifiedActionTemplate.
 * Copied to ControlEffect at creation time.
 */
export interface ControlSpec {
  /** Per-tick essence cost by sphere. Empty = no drain (threshold-only). */
  readonly perTickCost: Partial<Record<SphereName, number>>;

  /** Per-tick essence income generated. Only for income-producing effects. */
  readonly perTickIncome?: Partial<Record<SphereName, number>>;

  /** World-state condition that must remain true. Undefined = no threshold. */
  readonly sustainThreshold?: SustainThreshold;

  /** Per-tick mutations applied while active (hex state changes). */
  readonly perTickMutations?: readonly HexMutationSpec[];

  /** Per-tick graph operations applied while active (node property changes). */
  readonly perTickGraphOps?: readonly GraphOp[];

  /**
   * Per-tick co-located thread auras (THR-509 `co_located_thread_aura`).
   * Each spec mutates every threaded agent co-located with `targetNodeId`.
   * First consumer: consecrate's faith-spread. Undefined = no aura.
   */
  readonly perTickThreadAuras?: readonly CoLocatedThreadAuraSpec[];

  /**
   * Relic-upkeep substitute (THR-509 `relic_upkeep_substitute`). When set, the
   * effect's `perTickCost` is waived for as long as this artifact node exists;
   * if the artifact is destroyed, the effect lapses (`upkeep_relic_destroyed`).
   */
  readonly upkeepArtifactId?: string;

  /**
   * Mint a permanent relic at establishment and bind it as this effect's
   * upkeep substitute (THR-518). Mutually exclusive in practice with a static
   * `upkeepArtifactId`: when set, `spawnControlEffect` mints the relic and
   * overrides `upkeepArtifactId` with the new node's id. Undefined = no mint.
   */
  readonly mintUpkeepRelic?: MintUpkeepRelicSpec;

  /** Prerequisites for rivals to contest this effect. */
  readonly contestPrerequisites?: {
    readonly usurp?: ActorPrerequisites;
    readonly destroy?: ActorPrerequisites;
  };

  /** Prose shown when the effect is established, active, and lapsed. */
  readonly narrativeTemplates: {
    readonly established: string;
    readonly active: string;
    readonly lapsed: string;
    readonly usurped?: string;
    readonly destroyed?: string;
  };
}

// ─── LapseReason ──────────────────────────────────────────────────────────────

export type LapseReason =
  | 'essence_depleted'
  | 'threshold_failed'
  | 'usurped'
  | 'destroyed'
  | 'voluntarily_released'
  // THR-509: a relic_upkeep_substitute effect's sustaining artifact was destroyed
  | 'upkeep_relic_destroyed';

// ─── ControlEffect ────────────────────────────────────────────────────────────

/**
 * Runtime control effect instance — lives on GameState.controlEffects[].
 * Ticked every turn by phaseControlEffects.
 */
export interface ControlEffect {
  readonly effectId: string;
  readonly templateId: string;
  /** Ascendant who established it */
  readonly ownerId: string;
  readonly targetHexCol: number;
  readonly targetHexRow: number;
  /** Specific location/agent on the hex */
  readonly targetNodeId?: string;

  // ── Establishment ──
  readonly establishedTick: number;
  /** Sunk cost — total essence paid to establish */
  readonly ritualEssenceInvested: number;

  // ── Sustain (copied from ControlSpec at creation, immutable) ──
  readonly perTickCost: Partial<Record<SphereName, number>>;
  readonly perTickIncome?: Partial<Record<SphereName, number>>;
  readonly sustainThreshold?: SustainThreshold;

  // ── Ongoing effects ──
  readonly perTickMutations: readonly HexMutationSpec[];
  readonly perTickGraphOps: readonly GraphOp[];
  /** Per-tick co-located thread auras (THR-509). Undefined = none. */
  readonly perTickThreadAuras?: readonly CoLocatedThreadAuraSpec[];
  /** Sustaining relic that waives `perTickCost` while it exists (THR-509). */
  readonly upkeepArtifactId?: string;

  // ── State ──
  readonly active: boolean;
  readonly ticksActive: number;
  readonly lapseReason?: LapseReason;

  // ── Contestation ──
  /** Spawned encounter node for contestation */
  readonly encounterNodeId?: string;
  readonly contestPrerequisites?: {
    readonly usurp?: ActorPrerequisites;
    readonly destroy?: ActorPrerequisites;
  };

  // ── Narrative ──
  readonly narrativeTemplates: {
    readonly established: string;
    readonly active: string;
    readonly lapsed: string;
    readonly usurped?: string;
    readonly destroyed?: string;
  };
}

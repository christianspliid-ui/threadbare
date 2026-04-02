// src/types/unifiedAction.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { ActorType } from './graph';
import type { ValuePair } from './agent';
import type { GraphOp } from './graphOp';
import type { TargetCategory } from './targetContext';
import type { ControlSpec } from './controlEffect';
import type { RarityTier } from './rarity';

export type ActionScale = 'cosmic' | 'regional' | 'local' | 'personal';
export type ActionSource = 'agent' | 'player' | 'system';

// ─── Layer Revelation ────────────────────────────────────────────────────────

/** The four narrative layers a hex can reveal independently. */
export type NarrativeLayer = 'land' | 'soul' | 'people' | 'ruins';

/** Per-layer revelation state for a single hex. */
export type HexRevelation = Record<NarrativeLayer, boolean>;

/** All narrative layers, for iteration. */
export const NARRATIVE_LAYERS: readonly NarrativeLayer[] = ['land', 'soul', 'people', 'ruins'];

/** Create a default (all unrevealed) HexRevelation. */
export function createDefaultHexRevelation(): HexRevelation {
  return { land: false, soul: false, people: false, ruins: false };
}
export type StepFailBehavior = 'fail_action' | 'continue_weakened';

export interface ActionStep {
  readonly reach: ReachDomain;
  readonly duration: { readonly min: number; readonly max: number };
  readonly difficulty: number; // 0-1
  readonly onSuccess: readonly GraphOp[];
  readonly onFailure: readonly GraphOp[];
  readonly failBehavior: StepFailBehavior;
  readonly narrativeTemplate?: string;
}

export interface UnifiedActionTemplate {
  // Identity
  readonly id: string;
  /** Narrative significance tier. Drives visual treatment and TB-100 unlock system. */
  readonly rarityTier: RarityTier;
  readonly name: string;
  readonly reach: ReachDomain;
  readonly crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  readonly scale: ActionScale;

  // Steps (1 = simple, 2+ = encounter-like)
  readonly steps: readonly ActionStep[];

  // Costs
  readonly apCost: number; // typically 1
  readonly essenceCost?: number; // divine actions only

  // Filtering
  readonly actorAffinities: readonly ActorType[];
  readonly locationSubtypes?: readonly string[];
  readonly sphereAffinity?: SphereName;

  // ── Target filtering ──────────────────────────────────────────────

  /**
   * Which node categories this template can target.
   * Omit or empty → defaults to ['actor'] for backward compatibility.
   */
  readonly targetCategories?: readonly TargetCategory[];

  /**
   * Subtypes of the target node this template applies to.
   * Checked against TargetContext.subtype.
   * Omit or empty → no subtype restriction.
   */
  readonly targetSubtypes?: readonly string[];

  /**
   * Node property key/value pairs that must all be present on the target.
   * Checked against TargetContext.properties (AND logic — all must match).
   * Omit or empty → no property restriction.
   *
   * Example: { locationSubtype: 'settlement' } to target only settlements.
   */
  readonly requiredNodeProperties?: Readonly<Record<string, unknown>>;

  /**
   * Trait IDs that must be present on the target node.
   * All listed traits must be present (AND logic).
   * Omit or empty → no trait restriction.
   */
  readonly requiredTargetTraits?: readonly string[];

  // ── Layer revelation gating ─────────────────────────────────────

  /**
   * Which narrative layer this template belongs to.
   * Used for Gate 7 (revelation gating) in getTargetActionSlots().
   * Templates without this field are not revelation-gated (backward compatible).
   */
  readonly narrativeLayer?: NarrativeLayer;

  /**
   * If true, this template bypasses layer revelation gating. Default: false.
   * Typically true for Create actions — you're bringing something new into existence.
   */
  readonly bypassRevelationGate?: boolean;

  // ── Duration mode ──────────────────────────────────────────────

  /** 'instant' (default) = fire-and-forget. 'sustained' = spawns ControlEffect on success. */
  readonly durationMode?: 'instant' | 'sustained';

  /** Only for durationMode: 'sustained'. Defines the persistent effect. */
  readonly controlSpec?: ControlSpec;

  // ── Revelation action marker ────────────────────────────────────

  /**
   * If present, this action triggers resolveRevelationAction on completion.
   * Values: 'observe' | 'scry' | 'whisper_insight' | 'dream_sending'
   * (extensible — any string routes to revelationEmitter.resolveRevelationAction)
   */
  readonly revelationAction?: string;

  // Contestation
  readonly contestsWith?: readonly string[];

  // Selection
  readonly motivations: readonly ValuePair[];

  // Narrative
  readonly narrativeTemplates: {
    readonly initiation: string;
    readonly success: string;
    readonly failure: string;
    readonly contested?: string;
  };

  /** Evocative spell-like display name (Ars Magica style, max 3 words).
   * Replaces `name` in focused card spell-name zone.
   * Current `name` is kept for engine/debug identification. */
  readonly spellName?: string;

  /** Qualitative game-mechanical description — 2-3 sentences, no numbers.
   * Shown in the focused card description text box.
   * If absent, ActionCard falls back to slot.description (narrativeTemplates.initiation). */
  readonly description?: string;

  /** Optional custom consequence message for toast/feed output.
   * If absent, falls back to narrativeTemplates.success/failure.
   * Hybrid field: allows selective customization without rewriting all templates. */
  readonly consequenceMessage?: {
    readonly success: string;
    readonly failure: string;
  };
}

// Scale priority for tick resolution ordering (lower = resolves first)
export const SCALE_PRIORITY: Record<ActionScale, number> = {
  cosmic: 0,
  regional: 1,
  local: 2,
  personal: 3,
};

// Runtime action instance
export type UnifiedActionOutcome =
  | 'success'
  | 'failure'
  | 'contested_won'
  | 'contested_lost'
  | 'critical_success'
  | 'critical_failure'
  | 'success_at_cost';

/** Phase 3: Check if a step outcome is any form of success (including at cost). */
export function isStepSuccess(outcome: StepOutcome): boolean {
  return outcome === 'critical_success' || outcome === 'success' || outcome === 'success_at_cost';
}

/** Phase 3: Check if a step outcome is any form of failure. */
export function isStepFailure(outcome: StepOutcome): boolean {
  return outcome === 'failure' || outcome === 'critical_failure';
}

/**
 * Step-level outcome from the shared resolution service.
 * Phase 3: expanded from binary success/failure to the full outcome ladder.
 * `success_at_cost` means the step completed but with a penalty attached.
 */
export type StepOutcome = 'critical_success' | 'success' | 'success_at_cost' | 'failure' | 'critical_failure';

export interface UnifiedAction {
  readonly actionId: string;
  readonly actorId: string;
  readonly templateId: string;
  readonly targetId: string;

  // Priority
  readonly scale: ActionScale;
  readonly source: ActionSource;
  readonly startTick: number;

  // Step progression
  readonly currentStep: number; // 0-indexed
  readonly stepProgress: number; // ticks completed on current step
  readonly stepDuration: number; // total ticks for current step

  // Resources (already deducted on creation)
  readonly essencePaid?: number;

  // Contestation
  readonly contestedWith?: string; // actionId of opposing action

  // Resolution
  readonly resolved: boolean;
  readonly outcome?: UnifiedActionOutcome;
  readonly completedAtTick?: number; // tick when resolved became true (set by orchestrator cleanup)
  readonly stepOutcomes: readonly StepOutcome[]; // per-step results
}

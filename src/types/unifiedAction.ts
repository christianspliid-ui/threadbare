// src/types/unifiedAction.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { ActorType } from './graph';
import type { ValuePair } from './agent';
import type { GraphOp } from './graphOp';
import type { TargetCategory } from './targetContext';
import type { ControlSpec } from './controlEffect';
import type { RarityTier } from './rarity';
import type { AttentionTier } from './attention';
import type { RewardPoolRecipe } from './attachments';
import type { EncounterChoiceMemory, EncounterSupportBinding, EncounterSupportBundle } from './encounter';
import type { ClearanceGateConfig } from './contentShells';

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

/**
 * Compatibility payload carried forward from legacy encounter authoring.
 * Phase 5 uses this to preserve reward cadence and promotion hooks while
 * the runtime moves fully onto unified actions.
 */
export interface ActionStepOutcomeMetadata {
  readonly rewardPool?: RewardPoolRecipe;
  readonly tierPromotionEligible?: boolean;
  readonly reputationDelta?: number;
}

// ─── Structured Intelligence ────────────────────────────────────────────────

/** Category of intelligence record held by an agent. */
export type IntelligenceCategory =
  | 'shrine_location'
  | 'agent_network'
  | 'trade_route'
  | 'military_position'
  | 'political_secret'
  | 'cultural_knowledge';

/**
 * A queryable intelligence record held by an agent — structured knowledge
 * gained through encounter aftermath that future encounters can reference.
 *
 * Intelligence records live on GameState.intelligenceRecords (not on graph nodes)
 * so they are queryable without graph traversal.
 */
export interface IntelligenceRecord {
  readonly recordId: string;
  readonly category: IntelligenceCategory;
  /** Human-readable label for what this intelligence represents. */
  readonly label: string;
  /** Narrative description of what is known. */
  readonly detail: string;
  /** Geographic relevance — which region this intelligence is about. */
  readonly targetRegion?: string;
  /** Specific entity this intelligence concerns. */
  readonly targetEntityId?: string;
  readonly sourceEncounterId: string;
  /** Agent who holds this intelligence. */
  readonly agentId: string;
  readonly acquiredTick: number;
  /** Reliability 0-1; how trustworthy this intelligence is. */
  readonly reliability: number;
}

// ─── Hidden Marks ───────────────────────────────────────────────────────────

/** Category of concealed consequence placed on an agent. */
export type HiddenMarkCategory =
  | 'betrayal'
  | 'debt'
  | 'secret_knowledge'
  | 'concealed_action'
  | 'forbidden_contact'
  | 'soul_diminishment'
  | 'mystical_contract';

/**
 * A persistent hidden mark on an agent — a concealed consequence that can be
 * queried by future encounters and revealed through investigation.
 *
 * Marks live on GameState.hiddenMarks (not on graph nodes) so they are
 * queryable without graph traversal.
 */
export interface HiddenMark {
  readonly markId: string;
  readonly category: HiddenMarkCategory;
  /** Severity 0-1; affects reveal likelihood in future encounters. */
  readonly severity: number;
  /** Human-readable description of what the mark represents. */
  readonly label: string;
  readonly sourceEncounterId: string;
  readonly placedTick: number;
  readonly targetAgentId: string;
  /** Encounter families that can trigger reveal checks (prefix-matched). */
  readonly revealFamilies?: readonly string[];
}

export type EncounterAftermathChangeKind =
  | 'growth'
  | 'trait'
  | 'item'
  | 'reputation'
  | 'faction_reputation'
  | 'reputation_tally'
  | 'shell_state'
  | 'future_hook';

export type EncounterAftermathChangePolarity = 'gain' | 'loss' | 'mixed' | 'info';

export interface EncounterAftermathChange {
  readonly id: string;
  readonly kind: EncounterAftermathChangeKind;
  readonly title: string;
  readonly detail: string;
  readonly polarity: EncounterAftermathChangePolarity;
  readonly actorId?: string;
  readonly actorName?: string;
}

export type EncounterAftermathReactionEffect =
  | {
    readonly kind: 'reputation_score';
    readonly actorId?: string;
    readonly delta: number;
  }
  | {
    readonly kind: 'reputation_tally';
    readonly actorId?: string;
    readonly key: string;
    readonly delta: number;
  }
  | {
    readonly kind: 'clearance_gate_tag';
    readonly runtimeId?: string;
    readonly tag: string;
  }
  | {
    readonly kind: 'recent_event';
    readonly eventType?: 'narrative' | 'ripple_consequence';
    readonly message: string;
    readonly significance?: number;
  }
  | {
    readonly kind: 'encounter_seed';
    readonly encounterFamily?: string;
    readonly templateId?: string;
    readonly targetAgentId?: string;
    readonly delayTicks: number;
    readonly priority?: number;
    readonly seedLabel: string;
  }
  | {
    readonly kind: 'hidden_mark';
    readonly category: HiddenMarkCategory;
    readonly severity: number;
    readonly label: string;
    readonly revealFamilies?: readonly string[];
  }
  | {
    readonly kind: 'intelligence';
    readonly category: IntelligenceCategory;
    readonly label: string;
    readonly detail: string;
    readonly targetRegion?: string;
    readonly targetEntityId?: string;
    /** Reliability 0-1; defaults to 0.8 if omitted. */
    readonly reliability?: number;
  };

export interface PendingEncounterSeed {
  readonly seedId: string;
  readonly sourceEncounterId: string;
  readonly sourceReactionId: string;
  readonly encounterFamily?: string;
  readonly templateId?: string;
  readonly targetAgentId: string;
  readonly eligibleAfterTick: number;
  readonly priority: number;
  readonly seedLabel: string;
  readonly plantedTick: number;
}

export interface EncounterAftermathReaction {
  readonly id: string;
  readonly label: string;
  readonly intent?: string;
  readonly effects: readonly EncounterAftermathReactionEffect[];
  readonly closeAfterSelection?: boolean;
}

export interface EncounterAftermathSummary {
  readonly encounterId: string;
  readonly outcome: UnifiedActionOutcome;
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  /**
   * Reserved for future "react to what you learned" follow-up options.
   * Gate Duty does not use them yet, but the ending model can.
   */
  readonly reactionPrompt?: string;
  readonly reactions?: readonly EncounterAftermathReaction[];
}

export interface ActionStep {
  readonly reach: ReachDomain;
  readonly duration: { readonly min: number; readonly max: number };
  readonly difficulty: number; // 0-1
  readonly onSuccess: readonly GraphOp[];
  readonly onFailure: readonly GraphOp[];
  readonly failBehavior: StepFailBehavior;
  readonly narrativeTemplate?: string;
  readonly successMetadata?: ActionStepOutcomeMetadata;
  readonly failureMetadata?: ActionStepOutcomeMetadata;
  /** Narrative afterimage shown in Scene So Far on success (replaces bare "Succeeded"). */
  readonly successAfterimage?: string;
  /** Narrative afterimage shown in Scene So Far on failure (replaces bare "Failed"). */
  readonly failureAfterimage?: string;
}

// ─── Branching step support ────────────────────────────────────

/**
 * A branching step definition — the step to execute depends on
 * which choice the player made at a prior step.
 * Discriminated from ActionStep by the presence of `branchOnStep`.
 */
export interface ActionStepBranch {
  /** Step index (0-based) whose choiceId determines the variant. */
  readonly branchOnStep: number;
  /** Map from choiceId → step definition. */
  readonly variants: Readonly<Record<string, ActionStep>>;
  /** Fallback step if the choice was not recorded (e.g., disregarded). */
  readonly fallback: ActionStep;
}

/**
 * A step in a template is either a concrete ActionStep or a branch point.
 */
export type ActionStepOrBranch = ActionStep | ActionStepBranch;

/** Type guard: distinguish branching steps from concrete steps. */
export function isActionStepBranch(step: ActionStepOrBranch): step is ActionStepBranch {
  return 'branchOnStep' in step;
}

/**
 * Branch-aware aftermath — different summaries per choice path.
 * Resolved at aftermath assembly time by inspecting choice history.
 */
export interface BranchAwareAftermathConfig {
  /** Step index (0-based) whose choiceId determines the aftermath variant. */
  readonly branchOnStep: number;
  /** Map from choiceId → aftermath definition. */
  readonly variants: Readonly<Record<string, AftermathVariant>>;
  /** Fallback aftermath if choice was not recorded. */
  readonly fallback: AftermathVariant;
}

export interface AftermathVariant {
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactionPrompt?: string;
  readonly reactions?: readonly EncounterAftermathReaction[];
}

export interface UnifiedActionTemplate {
  // Identity
  readonly id: string;
  /** Narrative significance tier. Drives visual treatment and TB-100 unlock system. */
  readonly rarityTier: RarityTier;
  /** Attention tier classification — controls how this action surfaces to the player. */
  readonly intrinsicTier: AttentionTier;
  readonly name: string;
  readonly reach: ReachDomain;
  readonly crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  readonly scale: ActionScale;

  // Steps (1 = simple, 2+ = encounter-like)
  readonly steps: readonly ActionStepOrBranch[];

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

  /** Encounter-network support that should be resolved at action start. */
  readonly supportBundle?: EncounterSupportBundle;
  /** Optional scrutiny/proof shell configs migrated from encounter packets. */
  readonly clearanceGates?: readonly ClearanceGateConfig[];
  /** Branch-aware aftermath config. If present, overrides default aftermath assembly. */
  readonly aftermathConfig?: BranchAwareAftermathConfig;

  /**
   * Concept art image URL for the encounter opening scene.
   * Shown above the scene prose at step 0. Relative to public/ root.
   * Example: '/concept-art/encounters/flawed-steel.jpg'
   */
  readonly illustrationUrl?: string;

  /**
   * Alt text for the concept art image (accessibility).
   */
  readonly illustrationAlt?: string;

  /**
   * Authored choice cards per step. When present, these replace the generic
   * "Tip the scales" / "Let it play out" choices with scene-specific
   * approach cards that have prose bodies, cost justification, and risk text.
   *
   * Keys are step indices. Each step maps to an array of authored choices.
   * The choice `id` must match the `ActionStepBranch` variant key so the
   * branch resolution picks up the player's choice correctly.
   */
  readonly authoredChoices?: Readonly<Record<number, readonly AuthoredChoiceCard[]>>;
}

/**
 * An authored choice card with scene-specific prose, cost, target, and risk.
 * Replaces the generic intervention choices when present on a template.
 */
export interface AuthoredChoiceCard {
  /** Must match the ActionStepBranch variant key for branch resolution. */
  readonly id: string;
  /** Scene-specific label: "Forge the Truth" not "Help them". */
  readonly label: string;
  /** Full prose paragraph describing what the intervention feels like. */
  readonly intent: string;
  /** Which entity this choice targets: "Maren Ironhewn". */
  readonly targetLabel?: string;
  /** Essence cost for this choice. */
  readonly essenceCost: number;
  /** Narrative risk: "The guild may never trust her the same way again." */
  readonly likelyBurden?: string;
  /** Maps to interventionType for backend compatibility. */
  readonly interventionType: 'supportive' | 'coercive' | 'withdrawn';
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
  /** Remembered player-facing encounter interventions keyed by step. */
  readonly choiceHistory?: readonly EncounterChoiceMemory[];
  /** Player has chosen to stop interfering; remaining beats resolve on mortal terms. */
  readonly disregardRemaining?: boolean;
  /** Effective attention tier — computed at action creation, may be promoted mid-encounter. */
  readonly effectiveTier?: AttentionTier | 'invisible';
  /** Reuse-first binding of encounter support cast/places resolved at action start. */
  readonly supportBindings?: readonly EncounterSupportBinding[];
  /** Persistent clearance/scrutiny shell instances bound at action start. */
  readonly clearanceGateIds?: readonly string[];
  /** Accumulated world-facing deltas across resolved steps, used to build the final aftermath summary. */
  readonly aftermathChanges?: readonly EncounterAftermathChange[];
  /** World-facing summary of what changed because this encounter resolved. */
  readonly aftermathSummary?: EncounterAftermathSummary;
}

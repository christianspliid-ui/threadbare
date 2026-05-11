// src/types/unifiedAction.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { OmenCategory, EmittedOmenScope } from './omen';
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
import type { EffectPredicate } from './effects';
import type { EncounterForeshadowingDefinition } from './foreshadowing';

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
  | 'mystical_contract'
  | 'reputation_note'
  | 'divine_favor';

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

// ─── World-shaping aftermath supporting types (THR-115) ─────────────────────

export type ArtifactTier = 'common' | 'shaping' | 'legendary';
export type ArtifactCategory = 'weapon' | 'talisman' | 'relic' | 'tome' | 'vessel' | 'key' | 'mundane';

export type FactionMemberSelection =
  | { readonly kind: 'all_matching_trait'; readonly traitId: string }
  | { readonly kind: 'within_radius'; readonly hexCol: number; readonly hexRow: number; readonly radius: number }
  | { readonly kind: 'by_reputation_below'; readonly threshold: number }
  | { readonly kind: 'by_reputation_above'; readonly threshold: number }
  | { readonly kind: 'explicit_ids'; readonly agentIds: readonly string[] }
  | { readonly kind: 'random_sample'; readonly fraction: number };

/**
 * Resolved target for a multi-target aftermath effect.
 * `actor_fallback` means no explicit target was supplied and the action actor was used.
 */
export type AftermathTarget =
  | { readonly kind: 'agent'; readonly id: string }
  | { readonly kind: 'faction'; readonly id: string }
  | { readonly kind: 'sublocation'; readonly id: string }
  | { readonly kind: 'actor_fallback' };

export type EncounterAftermathReactionEffect =
  | {
    readonly kind: 'reputation_score';
    /** @deprecated Use targetAgentId instead. Kept for backward compatibility. */
    readonly actorId?: string;
    readonly delta: number;
    /** Direct the rep change at a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Direct the rep change at a faction node. */
    readonly targetFactionId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false (THR-116). */
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'reputation_tally';
    /** @deprecated Use targetAgentId instead. Kept for backward compatibility. */
    readonly actorId?: string;
    readonly key: string;
    readonly delta: number;
    /** Direct the tally change at a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Direct the tally change at a faction node. */
    readonly targetFactionId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false (THR-116). */
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'clearance_gate_tag';
    readonly runtimeId?: string;
    readonly tag: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'recent_event';
    readonly eventType?: 'narrative' | 'ripple_consequence';
    readonly message: string;
    readonly significance?: number;
    /**
     * Fan-out: record this event in each listed witness's recentEvents as well.
     * The actor always records implicitly; duplicates are de-duped.
     */
    readonly witnessAgentIds?: readonly string[];
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'encounter_seed';
    readonly encounterFamily?: string;
    readonly templateId?: string;
    readonly targetAgentId?: string;
    readonly delayTicks: number;
    readonly priority?: number;
    readonly seedLabel: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'hidden_mark';
    readonly category: HiddenMarkCategory;
    readonly severity: number;
    readonly label: string;
    readonly revealFamilies?: readonly string[];
    /** Place the mark on a specific agent (not the actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
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
    /** Grant intelligence to a specific agent (not the actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * THR-139 — Authored "the intel paid off" chronicle line.
     *
     * Fires when the actor (or `targetAgentId`) holds an intelligence record
     * matching `category` AND the action's encounter context (templateId /
     * locationId / region). The matched record's reliability band picks
     * which prose variant lands on `recentEvents` / `tickEvents` and is
     * surfaced in the chronicle.
     *
     * Closes the consumption loop: scoring, prose enrichment, resolution
     * match, and difficulty modifier all reference records passively. This
     * variant adds an authored, player-visible reference. Records are read,
     * never consumed.
     */
    readonly kind: 'intel_referenced_prose';
    /** Which intelligence category this prose is conditional on. Effect no-ops if the actor has no matching record. */
    readonly category: IntelligenceCategory;
    /**
     * Reliability-tiered prose variants. The matched record's reliability band
     * (`reliable` / `uncertain` / `dubious`) picks which line is appended to
     * `recentEvents` / `tickEvents`. Authors must supply at least `reliable`;
     * `uncertain` and `dubious` are optional and inherit upward when absent
     * (uncertain → reliable; dubious → uncertain → reliable).
     *
     * Use the same enrichment vocabulary as other aftermath prose
     * ({name}, {location}, {intel:category}, etc.) — the message string
     * passes through the standard prose-enrichment path before being
     * stored on the TickEvent.
     */
    readonly prose: {
      readonly reliable: string;
      readonly uncertain?: string;
      readonly dubious?: string;
    };
    /**
     * Optional significance override (0–1). Defaults derived per band:
     *   reliable → INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE  (0.6)
     *   uncertain → INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN (0.45)
     *   dubious → INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS    (0.3)
     */
    readonly significance?: number;
    /** Direct the reference at a specific agent (defaults to actor). */
    readonly targetAgentId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'reputation_set';
    /** Absolute reputation value to assign (clamped to 0..1). */
    readonly value: number;
    /** Target a specific agent (not the actor). */
    readonly targetAgentId?: string;
    /** Target a faction node directly. */
    readonly targetFactionId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'apply_condition';
    /** ID of an existing trait/condition node in the graph. */
    readonly conditionTraitId: string;
    /** How long the condition lasts in ticks. 0 = indefinite (no auto-expiry). */
    readonly durationTicks?: number;
    /** Intensity 0-1. Stored on the has_trait edge. */
    readonly intensity?: number;
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'remove_condition';
    /** ID of the condition trait node to remove. */
    readonly conditionTraitId: string;
    /** Remove all matching edges (default: remove oldest). */
    readonly removeAll?: boolean;
    readonly targetAgentId?: string;
    readonly targetFactionId?: string;
    readonly targetSublocationId?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'condition_attachment';
    /**
     * Condition trait node ID from condition-trait-content (e.g. 'trait.condition.wounded').
     * Unlike apply_condition's conditionTraitId, this surface also:
     *   • looks up the template's default duration from CONDITION_DURATIONS if durationOverride is absent,
     *   • surfaces a woundApplied signal for mid-encounter tier promotion when the template is the wounded condition.
     */
    readonly templateId: string;
    /** Who receives the condition. Defaults to action.actorId (same fallback as other effect kinds). */
    readonly targetAgentId?: string;
    /** Duration override in ticks. If omitted, uses the template's default from CONDITION_DURATIONS. */
    readonly durationOverride?: number;
    /** Number of stacks to apply. Defaults to CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT (1). */
    readonly stackCount?: number;
    readonly when?: EffectPredicate;
  }
  // ─── World-shaping effects (THR-115) ──────────────────────────────────────
  | {
    readonly kind: 'spawn_artifact';
    /** Artifact template id from content catalog. */
    readonly templateId?: string;
    /** Fallback category if templateId not given. */
    readonly category?: ArtifactCategory;
    /** Override template tier. Determines node type and edge kind. */
    readonly tier?: ArtifactTier;
    /** Override display name. */
    readonly nameOverride?: string;
    readonly tags?: readonly string[];
    /** Place artifact in actor inventory (possesses / bonded_to). Symbolic: $actor | $ally | $rival | $witness. */
    readonly targetAgentId?: string;
    /** Place artifact at location (contains). */
    readonly targetLocationId?: string;
    /** Chronicle message override. */
    readonly messageOverride?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'emit_omen';
    readonly category: OmenCategory;
    /** Intensity 0–1; drives encounter bias weight and chronicle significance. */
    readonly intensity: number;
    /** How long the omen stains the scope in ticks. Falls back to EMITTED_OMEN_DEFAULT_DURATION_TICKS when omitted. */
    readonly durationTicks?: number;
    /** Short prose, appears in chronicle + feeds enrichment {omen}. */
    readonly narrativeHook: string;
    readonly scope: EmittedOmenScope;
    /** Optional sphere tint — biases sphere_surge category encounters. */
    readonly sphereAlignment?: SphereName;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_splinter';
    readonly sourceFactionId: string;
    readonly newFactionName: string;
    readonly memberSelection: FactionMemberSelection;
    /** Fraction of parent reputation transferred to splinter members (0–1). */
    readonly inheritReputationShare?: number;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_absorb';
    readonly absorbingFactionId: string;
    readonly absorbedFactionId: string;
    readonly reputationMerge?: 'max' | 'sum_clamped' | 'weighted_avg';
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_dissolve';
    readonly factionId: string;
    readonly memberFallback?: 'independent' | 'drift_to_rival';
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_declare_war';
    readonly factionA: string;
    readonly factionB: string;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'faction_force_peace';
    readonly factionA: string;
    readonly factionB: string;
    /** Sentiment boost applied to both parties. Defaults to FACTION_PEACE_DEFAULT_SENTIMENT_BOOST. */
    readonly sentimentBoost?: number;
    readonly narrativeHook?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Thread mutation effects (THR-116) ────────────────────────────────────
  | {
    readonly kind: 'thread_strengthen';
    readonly ascendantId: string;
    readonly mortalId: string;
    /** Strength delta. Defaults to THREAD_STRENGTHEN_DEFAULT. */
    readonly delta?: number;
    /** Narrative label stored on the thread edge. */
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_weaken';
    readonly ascendantId: string;
    readonly mortalId: string;
    /** Strength delta (positive value applied as subtraction). Defaults to THREAD_WEAKEN_DEFAULT. */
    readonly delta?: number;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_break';
    readonly ascendantId: string;
    readonly mortalId: string;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  | {
    readonly kind: 'thread_branch';
    readonly ascendantId: string;
    /** Existing thread recipient the branch originates from. */
    readonly sourceMortalId: string;
    /** New thread recipient. */
    readonly newMortalId: string;
    /** Starting strength of the new thread edge. Defaults to THREAD_BRANCH_INITIAL_STRENGTH. */
    readonly initialStrength?: number;
    readonly reason?: string;
    readonly when?: EffectPredicate;
  }
  // ─── Archetype drift surface (THR-328) ───────────────────────────────────
  | {
    /**
     * UI surface trigger: register that a drift threshold is currently held
     * on a moral axis after encounter resolution.
     */
    readonly kind: 'archetype_drift_register';
    /** Moral axis the registration applies to (for example: protector_conqueror). */
    readonly axisId: string;
    /** Threshold band that must currently be held on the axis. */
    readonly threshold: 'soft' | 'banner' | 'becoming';
    /** Direct the registration at a specific agent (defaults to actor). */
    readonly targetAgentId?: string;
    /** Optional predicate gate — effect skips if predicate evaluates false. */
    readonly when?: EffectPredicate;
  }
  // ─── Ruins Layer clue effects (THR-150) ──────────────────────────────────
  | {
    /**
     * Spawn a knows_clue_of edge on the actor (or a specified candidate pool).
     * Runs Narrative Gravity to select the recipient.
     */
    readonly kind: 'spawn_clue';
    readonly source: 'library_research' | 'tavern_rumor' | 'treasure_map' | 'spy_debrief' | 'encounter_outcome' | 'faction_dossier';
    /** Precision of the clue. Defaults to 'vague'. */
    readonly precision?: 'vague' | 'narrowed' | 'located';
    /**
     * ID of the ruin this clue points at.
     * Use '$nearest_ruin' to let the runtime pick a ruin near the actor at resolution time.
     */
    readonly targetRuinId: string;
    readonly when?: EffectPredicate;
  }
  // ─── Secrets & Favors effects (THR-30) ────────────────────────────────────
  | {
    /**
     * Attempt secret discovery: run secretGeneration.ts against the encounter target
     * and create a knows_secret_of edge (actor → target) on success.
     * Source is used to pick magnitude modifier and prose.
     */
    readonly kind: 'secret_discovery';
    readonly source: 'confession' | 'observation' | 'spy_debrief' | 'tavern_gossip' | 'encounter_outcome';
    /** Magnitude modifier applied on top of generation roll (0.0–1.0, default 0). */
    readonly magnitudeBonus?: number;
    readonly when?: EffectPredicate;
  }
  | {
    /**
     * Create an owes_favor edge (target → actor) when the encounter succeeds.
     * The favor magnitude is sampled from magnitudeRange using the session RNG.
     */
    readonly kind: 'favor_creation';
    readonly magnitudeRange: [number, number];
    readonly context: string;
    readonly when?: EffectPredicate;
  }
  // ─── Faction standing effects (THR-167) ──────────────────────────────────
  | {
    /**
     * Grow (or reduce) an agent's standing within a specific faction by calling
     * applyFactionReputationGain. This is the type-safe way for content authors
     * to advance rank as an encounter aftermath — preferred over reputation_tally
     * with off-axis keys.
     */
    readonly kind: 'faction_reputation_gain';
    /** The faction node ID (e.g. 'faction.civic-guard'). */
    readonly factionId: string;
    /** Reputation delta. Applied as-is; clamped to [-1.0, +1.0] at runtime. */
    readonly amount: number;
    readonly when?: EffectPredicate;
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
  /** Event node ID of the source encounter that planted this seed (THR-143). */
  readonly sourceEventNodeId?: string;
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
  /** Opt-in for intel-derived difficulty reduction during resolution. */
  readonly difficultyContext?: 'intel_sensitive';
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
  /** Optional authored foreshadowing variants for encounter-pool previews (THR-389). */
  readonly foreshadowing?: EncounterForeshadowingDefinition;

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

  /**
   * When present, triggers secret discovery aftermath on success.
   * Drives secretGeneration.ts — creates `knows_secret_of` edges.
   */
  readonly secretDiscovery?: {
    readonly onSuccess: boolean;
    readonly sourceName: import('./encounter').SecretDiscoverySource;
  };

  /**
   * Explicit reputation polarity override. When set, overrides the heuristic
   * in phaseReputationTraits.ts for templates where the default crudType mapping
   * would produce the wrong sign (e.g. 'threaten' templates that are read/explore).
   */
  readonly reputationPolarity?: 'positive' | 'negative';

  /**
   * Explicit ascendant action tray tier. When present, classifyTrayTier returns
   * this value directly (after the rare override for rarityTier >= 3 / story_beat).
   * Omit on most templates — the fallback inference uses target structure.
   */
  readonly trayTier?: 'core' | 'self' | 'rare';
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
  /**
   * Per-step complication results (parallel to stepOutcomes).
   * Null entries indicate the step had no complication or was a success tier.
   * Used by the UI to display complication prose alongside step narratives. (THR-20)
   * Typed as readonly unknown[] here to avoid a circular type dependency with complication.ts.
   * Cast to ComplicationResult at consumer sites.
   */
  readonly stepComplications?: readonly (StepComplicationSlot | null)[];
  /** Graph event node ID created when this action's first step resolved (THR-143). */
  readonly eventNodeId?: string;
  /** Source event node ID to emit a caused_by edge on first step resolution (THR-143). Cleared after use. */
  readonly pendingCausationSourceEventId?: string;
  /** Seed ID that spawned this action, for causation edge properties (THR-143). */
  readonly spawnedFromSeedId?: string;
  /** Seed label that spawned this action, for causation edge properties (THR-143). */
  readonly spawnedFromSeedLabel?: string;
}

/**
 * Opaque slot for a complication result stored on a UnifiedAction step.
 * Defined here to avoid circular imports between unifiedAction.ts and complication.ts.
 * The actual runtime value is a ComplicationResult from src/types/complication.ts.
 */
export interface StepComplicationSlot {
  readonly templateId: string;
  readonly category: string;
  readonly severity: 'minor' | 'standard' | 'severe';
  readonly prose: string;
  readonly name: string;
  readonly narrativeTag: string;
  readonly significanceBoost: number;
}

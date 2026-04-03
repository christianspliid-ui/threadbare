/**
 * Generic Effect System — type definitions for 32 composable effect primitives.
 *
 * Effects are data, not code. Content creators compose JSON effect arrays
 * on attachment templates. The engine interprets them through a small number
 * of integration points (resolveEffectModifiers, tickEffects, activateSpell).
 *
 * Three tiers of complexity:
 *   Tier 1 (Gear, types 1–14): mundane-to-mythic equipment, conditions, blessings
 *   Tier 2 (Spell, types 15–23): rule benders — teleport, scry, spawn, compel
 *   Tier 3 (God-tier, types 24–29): world-reshaping scope, structures, rules
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 *
 * NFP compliance:
 *   #1 Tunability: constants in src/data/effect-constants.ts
 *   #2 Inspectability: trace interfaces at bottom of file
 *   #3 Determinism: PRNG callout table in design doc
 *   #4 Fail-soft: fail-soft table in design doc
 */

import type { ReachDomain } from './traits';
import type { AttachmentTier } from './attachments';

// ═══════════════════════════════════════════════════════════════════
// Condition Predicates — finite, enumerable set for conditional effects
// ═══════════════════════════════════════════════════════════════════

export type EffectCondition =
  | 'in_combat'
  | 'in_social'
  | 'in_exploration'
  | 'in_mystical'
  | 'at_home_territory'
  | 'in_enemy_territory'
  | 'in_wilderness'
  | 'health_low'
  | 'health_high'
  | 'alone'
  | 'outnumbered'
  | 'near_water';

/** Parameterized predicates — parsed at runtime from string format */
export type ParameterizedCondition =
  | `biome:${string}`
  | `has_trait:${string}`
  | `lacks_trait:${string}`
  | `reach_above:${string}:${string}`
  | `faction_rank:${string}`;

/** Union of all condition types */
export type EffectPredicate = EffectCondition | ParameterizedCondition;

// ═══════════════════════════════════════════════════════════════════
// Scoped Targeting — cross-cutting modifier for region/faction/global reach
// ═══════════════════════════════════════════════════════════════════

export type EffectScope =
  | { scope: 'self' }
  | { scope: 'target' }
  | { scope: 'hex'; target: 'self' | 'target' }
  | { scope: 'radius'; hexes: number }
  | { scope: 'region'; regionId: string | 'self_region' }
  | { scope: 'faction'; faction: string | 'self' | 'enemy' }
  | { scope: 'biome'; biome: string }
  | { scope: 'global' };

// ═══════════════════════════════════════════════════════════════════
// Trigger Types — for stacking, reactive, and transform effects
// ═══════════════════════════════════════════════════════════════════

export type StackTrigger =
  | 'combat_success'
  | 'combat_failure'
  | 'social_success'
  | 'any_encounter'
  | 'per_tick'
  | 'on_damaged'
  | 'on_kill'
  | 'on_heal';

export type ReactiveTrigger =
  | 'attacked'
  | 'damaged'
  | 'healed'
  | 'cursed'
  | 'blessed'
  | 'entered_hex'
  | 'encounter_started'
  | 'ally_damaged';

export type ExpiryEvent =
  | 'enter_combat'
  | 'leave_combat'
  | 'enter_territory'
  | 'leave_territory'
  | 'take_damage'
  | 'rest'
  | 'encounter_complete'
  | 'faction_change'
  | 'dawn_cycle'
  | 'doom_threshold';

export type TestShaperTrigger =
  | 'near_miss'
  | 'failure'
  | 'success'
  | 'any';

export type PreventLossChannel =
  | 'quintessence'
  | 'condition';

// ═══════════════════════════════════════════════════════════════════
// Compel Overrides
// ═══════════════════════════════════════════════════════════════════

export type CompelOverride =
  | 'movement_target'
  | 'faction_loyalty'
  | 'avoid_hex'
  | 'attack_target'
  | 'protect_target'
  | 'flee'
  | 'maslow_weight';

// ═══════════════════════════════════════════════════════════════════
// Rule Overrides
// ═══════════════════════════════════════════════════════════════════

export type RuleOverrideKey =
  | 'encounter_reach_override'
  | 'movement_cost_multiplier'
  | 'death_prevented'
  | 'healing_multiplier'
  | 'spawn_rate_multiplier'
  | 'awareness_range_bonus'
  | 'tier_advancement_cost_multiplier'
  | 'faction_influence_multiplier'
  | 'cooldown_multiplier'
  | 'backlash_severity_multiplier'
  | 'doom_rate_multiplier'
  | 'reward_tier_bonus'
  | 'encounter_difficulty_modifier';

// ═══════════════════════════════════════════════════════════════════
// Named Terrain Overlays
// ═══════════════════════════════════════════════════════════════════

export type TerrainOverlayType =
  | 'sacred_ground'
  | 'blighted'
  | 'fertile_ground'
  | 'frozen'
  | 'volcanic'
  | 'shrouded'
  | 'hallowed'
  | 'cursed_ground'
  | 'wild_magic'
  | 'contested';

// ═══════════════════════════════════════════════════════════════════
// Faction Actions
// ═══════════════════════════════════════════════════════════════════

export type FactionActionType =
  | 'shift_relationship'
  | 'transfer_control'
  | 'splinter'
  | 'absorb'
  | 'declare_war'
  | 'force_peace';

// ═══════════════════════════════════════════════════════════════════
// TIER 1: Gear Effects (types 1–14)
// ═══════════════════════════════════════════════════════════════════

/** Type 1: Always-on bonus or penalty */
export interface PassiveEffect {
  readonly type: 'passive';
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}

/** Type 2: Limited-use charges */
export interface ConsumableChargeEffect {
  readonly type: 'consumable_charge';
  readonly charges: number;
  readonly onUse: { readonly reach: ReachDomain; readonly value: number };
  readonly destroyOnEmpty: boolean;
  readonly scope?: EffectScope;
}

/** Type 3: Temporary buff/debuff with tick countdown */
export interface DurationEffect {
  readonly type: 'duration';
  readonly ticks: number;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly destroyOnExpiry: boolean;
  readonly scope?: EffectScope;
}

/** Type 4: Persists indefinitely, only removed by explicit action */
export interface PermanentEffect {
  readonly type: 'permanent';
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}

/** Type 5: Periodically active — on for X ticks, off for Y ticks */
export interface CooldownEffect {
  readonly type: 'cooldown';
  readonly activeTicks: number;
  readonly cooldownTicks: number;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}

/** Type 6: Bonus/penalty only when predicate is true */
export interface ConditionalEffect {
  readonly type: 'conditional';
  readonly condition: EffectPredicate;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly scope?: EffectScope;
}

/** Type 7: Unlocks a qualitative capability or tag */
export interface TraitGrantEffect {
  readonly type: 'trait_grant';
  readonly grantedTrait: string;
  readonly scope?: EffectScope;
}

/** Type 8: On trigger, attachment replaces itself with another template */
export interface TransformEffect {
  readonly type: 'transform';
  readonly trigger: ExpiryEvent;
  readonly probability: number;
  readonly intoTemplate: string;
  readonly narrativeTemplate: string;
}

/** Type 9: Value accumulates per event, up to cap */
export interface StackingEffect {
  readonly type: 'stacking';
  readonly reach: ReachDomain;
  readonly valuePerStack: number;
  readonly maxStacks: number;
  readonly stackOn: StackTrigger;
  readonly decayPerTick?: number;
  readonly scope?: EffectScope;
}

/** Type 10: Modifier applies to nearby agents */
export interface AuraEffect {
  readonly type: 'aura';
  readonly radius: number;
  readonly target: 'allies' | 'enemies' | 'all';
  readonly reach: ReachDomain;
  readonly value: number;
}

/** Type 11: Fires when something happens TO the agent */
export interface ReactiveEffect {
  readonly type: 'reactive';
  readonly trigger: ReactiveTrigger;
  readonly effect: AttachmentEffect;
  readonly duration?: number;
  readonly cooldown?: number;
}

/** Type 12: Modifier that changes in value each tick */
export interface DecayEffect {
  readonly type: 'decay';
  readonly reach: ReachDomain;
  readonly startValue: number;
  readonly changePerTick: number;
  readonly limitValue: number;
  readonly destroyAtLimit: boolean;
  readonly scope?: EffectScope;
}

/** Type 13: Multi-reach cost/benefit tradeoff */
export interface TradeoffEffect {
  readonly type: 'tradeoff';
  readonly bonus: { readonly reach: ReachDomain; readonly value: number };
  readonly penalty: { readonly reach: ReachDomain; readonly value: number };
  readonly scope?: EffectScope;
}

/** Type 14: Lasts until a specific game event occurs */
export interface UntilEventEffect {
  readonly type: 'until_event';
  readonly event: ExpiryEvent;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly destroyOnEvent: boolean;
  readonly scope?: EffectScope;
}

// ═══════════════════════════════════════════════════════════════════
// TIER 2: Spell Effects (types 15–23)
// ═══════════════════════════════════════════════════════════════════

/** Type 15a: Move self or target to a different hex */
export interface TeleportEffect {
  readonly type: 'teleport';
  readonly target: 'self' | 'other_agent';
  readonly range: number | 'unlimited';
  readonly destination?: 'random' | 'target_hex' | 'home' | 'nearest_ally';
  readonly scope?: EffectScope;
}

/** Type 15b: Push/pull target agent */
export interface ForcedMoveEffect {
  readonly type: 'forced_move';
  readonly target: 'other_agent';
  readonly direction: 'away' | 'toward' | 'random';
  readonly hexes: number;
}

/** Type 16: Bypass normal awareness range */
export interface RevealEffect {
  readonly type: 'reveal';
  readonly target: 'hexes' | 'agent' | 'encounters' | 'attachments';
  readonly range: number | 'all';
  readonly duration?: number;
}

/** Type 17: Bring something into existence */
export interface SpawnEffect {
  readonly type: 'spawn';
  readonly what: 'agent' | 'encounter' | 'attachment' | 'location';
  readonly template: string;
  readonly onHex: 'self' | 'target' | 'random';
  readonly duration?: number;
  readonly maxActive?: number;
  readonly scope?: EffectScope;
}

/** Type 18a: Remove an active attachment/condition */
export interface DispelEffect {
  readonly type: 'dispel';
  readonly target: 'condition' | 'attachment' | 'spell' | 'aura';
  readonly tags?: string[];
  readonly tierMax?: AttachmentTier;
  readonly scope?: EffectScope;
}

/** Type 18b: Temporarily suppress effects */
export interface SuppressEffect {
  readonly type: 'suppress';
  readonly target: 'spell' | 'aura' | 'all_effects';
  readonly scope: EffectScope;
  readonly ticks: number;
}

/** Type 19a: Auto-succeed on an encounter */
export interface AutoSucceedEffect {
  readonly type: 'auto_succeed';
  readonly encounterType?: string;
}

/** Type 19b: Reroll an encounter */
export interface RerollEffect {
  readonly type: 'reroll';
  readonly uses: number;
}

/** Type 19c: Resolve encounter using a different reach */
export interface SwapReachEffect {
  readonly type: 'swap_reach';
  readonly from: ReachDomain;
  readonly to: ReachDomain;
  readonly ticks?: number;
}

/** Type 19d: Shift outcome quality steps */
export interface OutcomeShiftEffect {
  readonly type: 'outcome_shift';
  readonly steps: number;
}

/** Type 19e: Shape how a single resolution result can be rescued or upgraded */
export interface TestShaperEffect {
  readonly type: 'test_shaper';
  readonly reach?: ReachDomain;
  readonly condition?: EffectPredicate;
  readonly trigger: TestShaperTrigger;
  readonly maxMargin?: number;
  readonly steps: number;
  readonly scope?: EffectScope;
}

/** Type 19f: Prevent or soften a specific kind of loss */
export interface PreventLossEffect {
  readonly type: 'prevent_loss';
  readonly channel: PreventLossChannel;
  readonly amount?: number;
  readonly tags?: string[];
  readonly condition?: EffectPredicate;
  readonly consumeOnPrevent?: boolean;
  readonly scope?: EffectScope;
}

/** Type 19g: Immediately grant authored content from a template list */
export interface ContentGrantEffect {
  readonly type: 'content_grant';
  readonly templateIds: readonly string[];
  readonly selection?: 'first' | 'random';
  readonly narrativeTemplate?: string;
}

/** Type 20a: Alter hex terrain properties */
export interface AlterTerrainEffect {
  readonly type: 'alter_terrain';
  readonly target: 'self_hex' | 'target_hex';
  readonly terrainEffect: TerrainOverlayType;
  readonly ticks: number | 'permanent';
  readonly scope?: EffectScope;
}

/** Type 20b: Create movement/awareness barriers */
export interface CreateBarrierEffect {
  readonly type: 'create_barrier';
  readonly between: 'self_hex';
  readonly and: 'adjacent';
  readonly blocks: 'movement' | 'awareness' | 'both';
  readonly ticks: number;
}

/** Type 21: Move effects between targets */
export interface TransferEffect {
  readonly type: 'transfer';
  readonly what: 'condition' | 'modifier' | 'possession' | 'trait';
  readonly from: 'self' | 'target';
  readonly to: 'self' | 'target' | 'nearest_ally';
  readonly tags?: string[];
  readonly tierMax?: AttachmentTier;
}

/** Type 22a: Extra actions for a duration */
export interface HasteEffect {
  readonly type: 'haste';
  readonly target: 'self' | 'other_agent';
  readonly extraActions: number;
  readonly ticks: number;
}

/** Type 22b: Skip or halve actions */
export interface SlowEffect {
  readonly type: 'slow';
  readonly target: 'other_agent';
  readonly skipActions: boolean;
  readonly ticks: number;
}

/** Type 22c: Pause countdown on conditions */
export interface FreezeDurationEffect {
  readonly type: 'freeze_duration';
  readonly target: 'condition' | 'buff' | 'debuff';
  readonly tags?: string[];
  readonly ticks: number;
}

/** Type 23: Override another agent's decisions */
export interface CompelEffect {
  readonly type: 'compel';
  readonly target: 'other_agent' | 'self';
  readonly override: CompelOverride;
  readonly value: string | number;
  readonly ticks: number;
}

// ═══════════════════════════════════════════════════════════════════
// TIER 3: God-Tier Effects (types 24–29)
// ═══════════════════════════════════════════════════════════════════

// Type 24 (Scoped Targeting) is the EffectScope type above —
// it's a cross-cutting modifier, not an effect type itself.

/** Type 25: Permanently create world graph structures */
export interface CreateStructureEffect {
  readonly type: 'create_structure';
  readonly what: 'location' | 'sublocation' | 'landmark' | 'trade_route' | 'barrier';
  readonly subtype?: string;
  readonly onHex: 'self' | 'target';
  readonly permanent: boolean;
  readonly ticks?: number;
  readonly properties?: Record<string, unknown>;
  readonly connectTo?: string;
}

/** Type 26: Raze, collapse, or erase world features */
export interface DestroyStructureEffect {
  readonly type: 'destroy_structure';
  readonly what: 'location' | 'sublocation' | 'all_sublocations' | 'trade_route';
  readonly target: 'target_location' | 'on_hex';
  readonly permanent: boolean;
  readonly ticks?: number;
  readonly leavesBehind?: string;
}

/** Type 27: Change how game systems work within a scope */
export interface ModifyRulesEffect {
  readonly type: 'modify_rules';
  readonly scope: EffectScope;
  readonly rule: RuleOverrideKey;
  readonly value: number | boolean | string | { from: ReachDomain; to: ReachDomain };
  readonly ticks: number | 'permanent';
}

/** Type 28: Directly modify faction dynamics */
export interface FactionManipulateEffect {
  readonly type: 'faction_manipulate';
  readonly action: FactionActionType;
  readonly between?: [string, string];
  readonly amount?: number;
  readonly hex?: 'self' | 'target';
  readonly to?: string | 'self_faction';
  readonly target?: string;
  readonly loyalty?: 'caster' | 'neutral' | 'hostile';
  readonly from?: string;
  readonly into?: string | 'self_faction';
  readonly ticks?: number;
}

/** Type 29: Effect that triggers a sequence of follow-on effects */
export interface CascadeEffect {
  readonly type: 'cascade';
  readonly triggerEffect: AttachmentEffect;
  readonly then: AttachmentEffect[];
  readonly delay?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Discriminated Union — all 29 effect types
// ═══════════════════════════════════════════════════════════════════

export type AttachmentEffect =
  // Tier 1: Gear (1–14)
  | PassiveEffect
  | ConsumableChargeEffect
  | DurationEffect
  | PermanentEffect
  | CooldownEffect
  | ConditionalEffect
  | TraitGrantEffect
  | TransformEffect
  | StackingEffect
  | AuraEffect
  | ReactiveEffect
  | DecayEffect
  | TradeoffEffect
  | UntilEventEffect
  // Tier 2: Spell (15–23)
  | TeleportEffect
  | ForcedMoveEffect
  | RevealEffect
  | SpawnEffect
  | DispelEffect
  | SuppressEffect
  | AutoSucceedEffect
  | RerollEffect
  | SwapReachEffect
  | OutcomeShiftEffect
  | TestShaperEffect
  | PreventLossEffect
  | ContentGrantEffect
  | AlterTerrainEffect
  | CreateBarrierEffect
  | TransferEffect
  | HasteEffect
  | SlowEffect
  | FreezeDurationEffect
  | CompelEffect
  // Tier 3: God-tier (25–29)
  | CreateStructureEffect
  | DestroyStructureEffect
  | ModifyRulesEffect
  | FactionManipulateEffect
  | CascadeEffect;

// ═══════════════════════════════════════════════════════════════════
// Spell Framework
// ═══════════════════════════════════════════════════════════════════

/** What a spell costs to cast */
export type SpellCost =
  | { readonly type: 'reach_drain'; readonly reach: ReachDomain; readonly amount: number }
  | { readonly type: 'attachment_consume'; readonly tag: string }
  | { readonly type: 'condition_inflict'; readonly template: string }
  | { readonly type: 'doom_increase'; readonly amount: number }
  | { readonly type: 'relationship_damage'; readonly target: 'nearest_ally' | 'faction'; readonly amount: number }
  | { readonly type: 'tick_exhaust'; readonly ticks: number }
  | { readonly type: 'health_sacrifice'; readonly amount: number }
  | { readonly type: 'multi'; readonly costs: SpellCost[] };

/** What goes wrong on failure */
export interface BacklashEffect {
  readonly trigger: 'failure' | 'critical_failure' | 'overcost' | 'always';
  readonly probability: number;
  readonly severity: 'minor' | 'major' | 'catastrophic';
  readonly effect: AttachmentEffect;
  readonly narrativeTemplate: string;
}

/** Spell targeting constraints */
export type SpellTargeting =
  | { readonly type: 'self' }
  | { readonly type: 'agent'; readonly range: number; readonly filter?: 'ally' | 'enemy' | 'any' }
  | { readonly type: 'hex'; readonly range: number }
  | { readonly type: 'location'; readonly range: number }
  | { readonly type: 'attachment'; readonly on: 'self' | 'target'; readonly tags?: string[] };

/** Full spell template definition */
export interface SpellTemplate {
  readonly id: string;
  readonly name: string;
  readonly tier: AttachmentTier;
  readonly tags: string[];
  readonly sphereAffinity: string;
  readonly flavorText: string;
  readonly mechanicalSummary: string;

  /** Prerequisites to LEARN the spell */
  readonly prerequisites: {
    readonly minReach?: Partial<Record<ReachDomain, number>>;
    readonly requiredTraits?: string[];
    readonly requiredSphere?: string;
    readonly maxSpellsKnown?: number;
    readonly requiredAttachment?: string;
  };

  /** What it does when cast */
  readonly effects: AttachmentEffect[];

  /** What it costs */
  readonly cost: SpellCost | SpellCost[];

  /** Ticks before it can be cast again */
  readonly cooldownTicks: number;

  /** What goes wrong on failure */
  readonly backlash?: BacklashEffect;

  /** Optional always-on rider effects while spell is known */
  readonly passiveEffects?: AttachmentEffect[];

  /** How the spell picks its target */
  readonly targeting: SpellTargeting;
}

/** Activated ability on an artifact/relic (non-spell activatable) */
export interface ActivatedAbility {
  readonly name: string;
  readonly cooldownTicks: number;
  readonly cost: SpellCost | SpellCost[];
  readonly effects: AttachmentEffect[];
  readonly backlash?: BacklashEffect;
}

// ═══════════════════════════════════════════════════════════════════
// Effect Runtime State — per-attachment bookkeeping
// ═══════════════════════════════════════════════════════════════════

/** Runtime state tracked per attachment for time-based effects */
export interface EffectRuntimeState {
  /** Remaining ticks for duration effects */
  ticksRemaining?: number;
  /** Cooldown cycling: ticks into current cycle */
  cooldownTicksElapsed?: number;
  /** Whether currently in active or dormant phase of cooldown */
  cooldownActive?: boolean;
  /** Current stack count for stacking effects */
  stacks?: number;
  /** Current value for decay/escalate effects (diverges from startValue over time) */
  decayCurrentValue?: number;
  /** Remaining charges for consumable effects */
  chargesRemaining?: number;
  /** Reactive cooldown: tick when last triggered */
  reactiveLastTriggeredTick?: number;
  /** Spell cooldown: tick when last cast */
  spellLastCastTick?: number;
  /** Whether the effect is suppressed */
  suppressed?: boolean;
  /** Suppression end tick */
  suppressedUntilTick?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Predicate Evaluation Context
// ═══════════════════════════════════════════════════════════════════

/** Context passed to conditional predicate evaluation */
export interface PredicateContext {
  /** What type of encounter step is being resolved */
  readonly inCombat: boolean;
  readonly inSocial: boolean;
  readonly inExploration: boolean;
  readonly inMystical: boolean;
  /** Territory status */
  readonly atHomeTerritory: boolean;
  readonly inEnemyTerritory: boolean;
  readonly inWilderness: boolean;
  /** Agent state */
  readonly healthLow: boolean;
  readonly healthHigh: boolean;
  readonly alone: boolean;
  readonly outnumbered: boolean;
  /** Environment */
  readonly nearWater: boolean;
  readonly biome: string;
  /** Agent data for parameterized predicates */
  readonly agentTraits: ReadonlySet<string>;
  readonly reachValues: Partial<Record<ReachDomain, number>>;
  readonly factionRank: number;
}

// ═══════════════════════════════════════════════════════════════════
// Modifier Result — output of resolveEffectModifiers
// ═══════════════════════════════════════════════════════════════════

/** Contribution from a single effect to modifier totals */
export interface EffectModifierContribution {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly effectType: string;
  readonly reach: ReachDomain;
  readonly value: number;
  readonly conditional?: EffectPredicate;
  readonly active: boolean;
}

export interface ResolvedTestShaper {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly trigger: TestShaperTrigger;
  readonly steps: number;
  readonly maxMargin?: number;
}

export interface ActivePreventLoss {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly channel: PreventLossChannel;
  readonly amount?: number;
  readonly tags?: readonly string[];
  readonly consumeOnPrevent: boolean;
}

/** Full result of resolving all effects on an agent */
export interface EffectModifierResult {
  /** Per-reach modifier totals from effects */
  readonly reachModifiers: Partial<Record<ReachDomain, number>>;
  /** Detailed breakdown for tracing */
  readonly contributions: EffectModifierContribution[];
  /** Traits granted by effects */
  readonly grantedTraits: string[];
  /** Tactical resolution shapers available for the current test */
  readonly testShapers: ResolvedTestShaper[];
  /** Active rescue/protection effects keyed to loss channels */
  readonly preventLoss: ActivePreventLoss[];
}

// ═══════════════════════════════════════════════════════════════════
// Active Rule Override — tracked on GameState
// ═══════════════════════════════════════════════════════════════════

export interface ActiveRuleOverride {
  readonly sourceAttachmentId: string;
  readonly sourceAgentId: string;
  readonly rule: RuleOverrideKey;
  readonly value: number | boolean | string | { from: ReachDomain; to: ReachDomain };
  readonly scope: EffectScope;
  readonly expiryTick: number | null; // null = permanent
  readonly establishedTick: number;
}

// ═══════════════════════════════════════════════════════════════════
// Active Terrain Overlay — tracked on GameState
// ═══════════════════════════════════════════════════════════════════

export interface ActiveTerrainOverlay {
  readonly sourceAttachmentId: string;
  readonly sourceAgentId: string;
  readonly terrainEffect: TerrainOverlayType;
  readonly hexCol: number;
  readonly hexRow: number;
  readonly expiryTick: number | null; // null = permanent
  readonly establishedTick: number;
}

// ═══════════════════════════════════════════════════════════════════
// Aura Entry — tracked on GameState
// ═══════════════════════════════════════════════════════════════════

export interface AuraEntry {
  readonly sourceAgentId: string;
  readonly sourceAttachmentId: string;
  readonly radius: number;
  readonly targetFilter: 'allies' | 'enemies' | 'all';
  readonly reach: ReachDomain;
  readonly value: number;
  readonly sourceHexCol: number;
  readonly sourceHexRow: number;
}

// ═══════════════════════════════════════════════════════════════════
// Tracing (NFP #2: Inspectability)
// ═══════════════════════════════════════════════════════════════════

export interface EffectActivationTrace {
  readonly type: 'effect_activation';
  readonly tick: number;
  readonly agentId: string;
  readonly attachmentId: string;
  readonly effectType: string;
  readonly effectDetails: Record<string, unknown>;
  readonly result: 'applied' | 'blocked_cooldown' | 'blocked_prerequisite' | 'backlash';
  readonly modifierContribution?: number;
  readonly costsPaid?: SpellCost[];
  readonly backlashFired?: boolean;
}

export interface EffectTickTrace {
  readonly type: 'effect_tick';
  readonly tick: number;
  readonly agentId: string;
  readonly attachmentId: string;
  readonly action: 'decrement' | 'expire' | 'destroy' | 'stack' | 'decay' | 'cooldown_cycle';
  readonly details: Record<string, unknown>;
}

export interface ScopedEffectTrace {
  readonly type: 'scoped_effect';
  readonly tick: number;
  readonly sourceAgentId: string;
  readonly sourceAttachmentId: string;
  readonly scope: EffectScope;
  readonly affectedCount: number;
  readonly effectType: string;
}

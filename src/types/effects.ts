/**
 * Generic Effect System — type definitions for 39 composable effect primitives.
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
  | `faction_rank:${string}`
  // THR-116: aftermath conditional effect predicates
  | `has_mark:${string}`
  | `has_intel:${string}`
  | `reputation_above:${string}`
  | `reputation_below:${string}`
  | `faction_controls:${string}`;

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

// ─── Content Primitive: resource_delta (TB-104 Phase 1B) ─────────

/** Type 19h: One-shot resource mutation at resolution/reward time */
export interface ResourceDeltaEffect {
  readonly type: 'resource_delta';
  readonly resource: 'essence' | 'quintessence' | 'doom';
  readonly amount: number;
  readonly condition?: EffectPredicate;
  readonly scope?: EffectScope;
}

// ─── Content Primitive: action_trigger (TB-104 Phase 1B) ──────────

export type ActionTriggerEvent =
  | 'encounter_success'
  | 'encounter_failure'
  | 'movement_complete'
  | 'rest'
  | 'spell_cast'
  | 'action_complete';

export type ActionTriggerPayload =
  | { readonly kind: 'resource_delta'; readonly resource: 'essence' | 'quintessence' | 'doom'; readonly amount: number }
  | { readonly kind: 'content_grant'; readonly templateIds: readonly string[]; readonly selection?: 'first' | 'random' }
  | { readonly kind: 'trace_only'; readonly message: string };

/** Type 19i: Fire a payload when the owner performs a specific action */
export interface ActionTriggerEffect {
  readonly type: 'action_trigger';
  readonly on: ActionTriggerEvent;
  readonly payload: ActionTriggerPayload;
  readonly condition?: EffectPredicate;
  readonly maxFires?: number;
  readonly cooldownTicks?: number;
}

// ─── Content Primitive: choice_set (TB-128) ──────────────────────

/** A single selectable option within a choice_set effect */
export interface ChoiceOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Predicate gate — option is hidden/filtered if predicate is false */
  readonly predicate?: EffectPredicate;
  /** Effects that fire when this option is selected */
  readonly consequences: readonly AttachmentEffect[];
}

/** Type 19j: Present a filtered list of options; player or AI picks one at resolution/reward time */
export interface ChoiceSetEffect {
  readonly type: 'choice_set';
  /** All authored options (predicates may reduce the visible set at runtime) */
  readonly options: readonly ChoiceOption[];
  /**
   * player     — pauses sim and surfaces ChoiceSetModal to the player
   * ai_auto    — AI picks the first available option (no weight randomness)
   * weighted_random — AI picks via seeded PRNG weighted by option index
   */
  readonly selectionMode: 'player' | 'ai_auto' | 'weighted_random';
  /** Timeout before auto-resolving (player mode only); falls back to weighted_random if exceeded */
  readonly timeoutMs?: number;
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
// QUERY-LAYER Effects (types 30–38) — read by effectQueries.ts
// These affect agent behavior and capabilities; the query handler
// makes them available to action selection, movement, awareness,
// disposition, and condition application systems.
// ═══════════════════════════════════════════════════════════════════

/** Type 30: Multiplies desire scores for all encounters of a given reach */
export interface BehaviorWeightEffect {
  readonly type: 'behavior_weight';
  /** Which reach domain to amplify or suppress */
  readonly reach: ReachDomain;
  /** Score multiplier — 1.5 = 50% more likely, 0.5 = 50% less likely */
  readonly multiplier: number;
  readonly condition?: EffectPredicate;
}

/** Type 31: Adjusts cooperation disposition toward specific agent categories */
export interface SocialModifierEffect {
  readonly type: 'social_modifier';
  /** Which social context this modifier applies to */
  readonly targetFilter: 'ally' | 'enemy' | 'any' | 'same_faction' | 'different_faction';
  /** Additive shift on cooperation disposition (-1 = always defect, +1 = always cooperate) */
  readonly cooperationBias: number;
  readonly condition?: EffectPredicate;
}

/** Type 32: Hard blocks or unlocks actions in a given reach domain */
export interface ActionGateEffect {
  readonly type: 'action_gate';
  readonly mode: 'block' | 'unlock';
  /** Reach domain whose actions are blocked or unlocked */
  readonly reach: ReachDomain;
  readonly condition?: EffectPredicate;
}

/** Type 33: Slowly drifts an agent's axiological value profile each tick */
export interface AxiologicalDriftEffect {
  readonly type: 'axiological_drift';
  /** Axiological pair key, e.g. 'loyalty_ambition', 'mercy_ruthlessness' */
  readonly axis: string;
  /** Value change per tick — positive = toward the "ambition/progress/ruthlessness" pole */
  readonly ratePerTick: number;
  /** Maximum absolute drift from neutral (0); clamps the running total */
  readonly limitValue: number;
}

/** Type 34: Modifies movement tick cost and/or awareness hex range */
export interface RangeModifierEffect {
  readonly type: 'range_modifier';
  /** Multiplier on total movement tick cost — 0.8 = 20% faster, 1.2 = 20% slower */
  readonly movementCostMultiplier?: number;
  /** Additive bonus to hex hops of awareness range (integer) */
  readonly awarenessRangeBonus?: number;
  readonly condition?: EffectPredicate;
}

/** Type 35: Blocks incoming conditions whose tags match the listed tags */
export interface TagImmunityEffect {
  readonly type: 'tag_immunity';
  /** Condition tags that are blocked — e.g. ['fear', 'poison', 'cold'] */
  readonly tags: readonly string[];
  readonly condition?: EffectPredicate;
}

/** Type 36: Per-tick or one-shot drain/restore of essence or quintessence */
export interface ResourceManipulateEffect {
  readonly type: 'resource_manipulate';
  readonly resource: 'essence' | 'quintessence';
  readonly target: 'self' | 'other_agent';
  /** Amount per application — positive = restore, negative = drain */
  readonly amount: number;
  /** 'per_tick' = every tick, 'one_shot' = fires once then marks consumed */
  readonly mode: 'per_tick' | 'one_shot';
  readonly condition?: EffectPredicate;
}

/** Type 37: Modifies a property on the agent's current hex tile each tick */
export interface HexEffectEffect {
  readonly type: 'hex_effect';
  /** Property key on the HexTile node to modify */
  readonly property: string;
  readonly value: number | string | boolean;
  /** 'set' = overwrite, 'add' = numeric add to existing value */
  readonly mode: 'set' | 'add';
  /** Hex radius to affect (0 = own hex only) */
  readonly radius?: number;
}

/** Type 38: Direct world graph CRUD — add/remove edges or set node properties */
export interface GraphMutationEffect {
  readonly type: 'graph_mutation';
  readonly operation: 'add_edge' | 'remove_edge' | 'set_property' | 'remove_node';
  /** Which node to operate on — 'self', 'target', or explicit node id */
  readonly nodeId: 'self' | 'target' | string;
  readonly edgeType?: string;
  readonly targetNodeId?: string;
  readonly propertyKey?: string;
  readonly propertyValue?: unknown;
  readonly condition?: EffectPredicate;
}

// ═══════════════════════════════════════════════════════════════════
// SLOT SYSTEM Effect (type 39)
// ═══════════════════════════════════════════════════════════════════

/** Type 39: Grants bonus capacity to a specific attachment slot */
export interface SlotBonusEffect {
  readonly type: 'slot_bonus';
  /** Target slot tag to expand (e.g. 'consumable', 'weapon') */
  readonly slotTag: string;
  /** Additional slots granted (positive integer) */
  readonly bonus: number;
}

// ═══════════════════════════════════════════════════════════════════
// Discriminated Union — all 39 effect types
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
  | ResourceDeltaEffect
  | ActionTriggerEffect
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
  | CascadeEffect
  // Query-layer effects (30–38)
  | BehaviorWeightEffect
  | SocialModifierEffect
  | ActionGateEffect
  | AxiologicalDriftEffect
  | RangeModifierEffect
  | TagImmunityEffect
  | ResourceManipulateEffect
  | HexEffectEffect
  | GraphMutationEffect
  // Slot system (39)
  | SlotBonusEffect
  // Interactive (40)
  | ChoiceSetEffect;

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
  /** Action trigger: total fires consumed so far */
  actionTriggerFireCount?: number;
  /** Action trigger: tick when cooldown expires (trigger cannot fire before this tick) */
  actionTriggerCooldownUntil?: number;
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
  readonly allyCount: number;
  readonly enemyCount: number;
  readonly alone: boolean;
  readonly outnumbered: boolean;
  /** Environment */
  readonly nearWater: boolean;
  readonly biome: string;
  /** Agent data for parameterized predicates */
  readonly agentTraits: ReadonlySet<string>;
  readonly reachValues: Partial<Record<ReachDomain, number>>;
  readonly factionRank: number;
  // THR-116: aftermath conditional predicate extensions
  /** Hidden mark categories currently placed on this agent. */
  readonly hiddenMarkCategories: ReadonlySet<string>;
  /** Intelligence categories currently held by this agent. */
  readonly intelCategories: ReadonlySet<string>;
  /** Agent's current reputationScore (0–1). Falls back to DEFAULT_REPUTATION. */
  readonly reputationScore: number;
  /** Location IDs currently controlled by this agent's faction. */
  readonly controlledLocations: ReadonlySet<string>;
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

// ─── Content Primitive Trace Details (TB-104 Phase 1B) ────────────

export interface ResourceDeltaAppliedTraceDetails {
  readonly actorId: string;
  readonly resource: 'essence' | 'quintessence' | 'doom';
  readonly amount: number;
  readonly before: number;
  readonly after: number;
  readonly source: 'encounter' | 'reward' | 'action_trigger';
  readonly sourceAttachmentId?: string;
}

export interface ActionTriggerFiredTraceDetails {
  readonly actorId: string;
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly event: ActionTriggerEvent;
  readonly payloadKind: ActionTriggerPayload['kind'];
  readonly firesRemaining: number | undefined;
  readonly cooldownUntilTick: number;
}

// ─── Content Primitive Trace Details (TB-128 choice_set) ─────────

export interface ChoiceSetResolutionTrace {
  readonly actorId: string;
  /** Attachment or reward source that contained the choice_set effect */
  readonly sourceId: string;
  /** All authored option IDs before predicate filtering */
  readonly availableOptions: readonly string[];
  /** Option IDs that passed predicate evaluation (may equal availableOptions) */
  readonly filteredOptions: readonly string[];
  /** Which option was selected (null when forwarded to player UI) */
  readonly selectedOptionId: string | null;
  readonly selectionMode: 'player' | 'ai_auto' | 'weighted_random';
  /** Set when all options were filtered out and fallback was used */
  readonly usedFallback?: boolean;
  /** Set when selection is deferred to player UI */
  readonly awaitingPlayerChoice?: boolean;
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
  readonly sourceFactionId?: string;
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

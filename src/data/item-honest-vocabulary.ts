/**
 * The honest vocabulary — every effect shape the item generator may emit, and the
 * production reader that makes it true (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Data tables and
 * § Interface impact (`generated-item-honest-vocabulary`). Ported from the THR-1236
 * prototype's `SHAPE_STATUS` and **re-measured at build, 2026-09-27**.
 *
 * The rule the whole generator stands on: **an item never promises what the engine does
 * not do.** `validateGeneratedItem` refuses any shape whose row is `planned` or absent,
 * and the gate test (`engine/itemGenerator/__tests__/itemGenerator.gate.test.ts`) mints
 * every generated item into a test world and calls the named reader for each effect. A
 * row moves to `live` only with a passing read-back case there.
 *
 * - `live`    — a production reader exists and the gate reads it back.
 * - `narrow`  — live, but only on part of the game (the sheet still tells it plainly).
 * - `planned` — shipped or promised elsewhere, but the gate has no read-back case for it
 *               yet, so the generator may not emit it.
 */

import type { AttachmentEffect, ActionTriggerEvent, RuleOverrideKey, EffectCondition } from '../types/effects';
import type { ReachDomain } from '../types/traits';

export type HonestShapeStatus = 'live' | 'narrow' | 'planned';

export interface HonestShapeRow {
  readonly status: HonestShapeStatus;
  /** The production reader that makes the shape true, in words an engineer can grep for. */
  readonly reader: string;
}

export const ITEM_HONEST_VOCABULARY: Readonly<Partial<Record<AttachmentEffect['type'], HonestShapeRow>>> = {
  passive:             { status: 'live', reader: 'roll modifier — effectResolver.resolveEffectModifiers' },
  conditional:         { status: 'live', reader: 'roll modifier when the predicate holds (effectPredicates.buildPredicateContext); in_combat = an Iron step or a fight exchange' },
  stat_contribution:   { status: 'live', reader: 'capability raw score — effectQueries.collectStatContributions → domainCapability.computeRawScore' },
  test_shaper:         { status: 'live', reader: 'band rescue at step resolution — effectResolver.collectTestShapers' },
  prevent_loss:        { status: 'live', reader: 'quintessence channel only — effectResolver.collectPreventLossEffects (phaseQuintessence); the condition channel has no reader (THR-1625)' },
  tag_immunity:        { status: 'live', reader: 'checked at condition infliction — effectQueries.isImmuneToAnyTag (THR-1242)' },
  reveal:              { status: 'live', reader: 'encounters = awareness floor; hexes = fog lifted on arrival — effectQueries.getRevealRanges (THR-1242)' },
  range_modifier:      { status: 'live', reader: 'movement cost + awareness range — effectQueries.getRangeModifiers' },
  modify_rules:        { status: 'live', reader: 'standing rule override read at its owning site — effectQueries.getActiveRuleOverride (THR-1241)' },
  aura:                { status: 'live', reader: 'read at resolution for agents nearby — effectAura.resolveAuraModifiers (THR-1243)' },
  behavior_weight:     { status: 'live', reader: 'encounter desire scoring — effectQueries.getBehaviorWeights' },
  social_modifier:     { status: 'live', reader: 'cooperation disposition — effectQueries.getSocialModifiers' },
  action_gate:         { status: 'live', reader: 'blocks actions of a reach — effectQueries.getActionGates' },
  axiological_drift:   { status: 'live', reader: 'per-tick value drift — effectTick.tickEffects' },
  resource_manipulate: { status: 'live', reader: 'per-tick self drain/restore — effectTick.tickEffects' },
  hex_effect:          { status: 'live', reader: 'per-tick hex delta — effectTick.tickEffects; divineInfluence / corruption / explorationAttraction only' },
  action_trigger:      { status: 'live', reader: 'fires on the step outcome ladder, movement arrival and action completion — actionTrigger.checkAndFireActionTriggers' },
  consumable_charge:   { status: 'live', reader: 'one charge spent per completed step in the charge reach — consumableCharges.spendConsumableCharges (THR-1239)' },
  slot_bonus:          { status: 'live', reader: 'slot cap expansion — attachmentSlotResolver.computeEffectiveSlotCaps' },
  suppress:            { status: 'live', reader: 'resolved once per tick; silences attachments in scope — effectSuppression.applySuppressions (THR-1242)' },
  cooldown:            { status: 'live', reader: 'on/off cycle — effectTick.tickEffects' },
  stacking:            { status: 'narrow', reader: 'on_damaged / on_heal live everywhere — effectEvents.processEffectEvent; combat_success counts legacy encounters only' },
  // Shipped since the prototype (THR-1568 reaction bursts, THR-1542 fight vocabulary),
  // but no core emits them and the gate carries no read-back case for them yet. A core
  // that wants one adds the case first, then flips the row.
  reactive:            { status: 'planned', reader: 'reaction timed boosts (THR-1568) — no gate read-back case yet' },
  until_event:         { status: 'planned', reader: 'take_damage = a harmful condition lands (THR-1244) — no gate read-back case yet' },
};

/** Rule keys with a live reader at their owning site. */
export const ITEM_HONEST_RULE_KEYS: ReadonlySet<RuleOverrideKey> = new Set<RuleOverrideKey>([
  'movement_cost_multiplier', 'awareness_range_bonus', 'death_prevented', 'healing_multiplier',
  'tier_advancement_cost_multiplier', 'faction_influence_multiplier', 'cooldown_multiplier',
  'duration_decay_multiplier', 'reward_tier_bonus', 'encounter_difficulty_modifier',
]);

/**
 * Trigger moments that are actually raised. Measured 2026-09-26/27:
 * `checkAndFireActionTriggers` is called only with `movement_complete`
 * (`phaseMovement.ts`), `action_complete` and the ladder bands
 * (`unifiedActionResolution.ts`), and `encounter_success` / `encounter_failure`
 * (`orchestrator.ts`). **`rest` is never raised** — refused. `spell_cast` is live
 * since THR-1571: `resolveCast` raises it on the caster after every cast, landed or
 * fizzled (read-back: `spellCasting.test.ts` › "raises spell_cast").
 */
export const ITEM_HONEST_TRIGGER_EVENTS: ReadonlySet<ActionTriggerEvent> = new Set<ActionTriggerEvent>([
  'encounter_success', 'encounter_critical_success', 'encounter_at_cost', 'encounter_failure',
  'encounter_critical_failure', 'movement_complete', 'action_complete', 'spell_cast',
]);

/** Hex properties a `hex_effect` can actually write (the other terrain overlays are unread — 2 of 11). */
export const ITEM_HONEST_HEX_PROPERTIES: ReadonlySet<string> = new Set(['divineInfluence', 'corruption', 'explorationAttraction']);

/**
 * Situation conditions a generated `conditional` may name, with the reaches on which it
 * would be a passive in disguise. A conditional on its own situation's reach fires on
 * every step of that reach (26 of the catalog's 41 "when…" bonuses are this), so the
 * validator refuses it — except `in_combat` on Heart, the fight's nerve step.
 */
export const ITEM_HONEST_CONDITION_OWN_REACHES: Readonly<Partial<Record<EffectCondition, readonly ReachDomain[]>>> = {
  in_combat: ['iron'],
  in_social: ['heart', 'gold'],
  in_mystical: ['veil', 'star'],
  in_exploration: ['eye', 'stone'],
};
/** Situational conditions the read-back can switch on and off (the engine's own predicate flags). */
export const ITEM_HONEST_SITUATIONS: Readonly<Partial<Record<EffectCondition, string>>> = {
  in_wilderness: 'inWilderness', alone: 'alone', outnumbered: 'outnumbered',
  near_water: 'nearWater', at_home_territory: 'atHomeTerritory', health_low: 'healthLow',
};

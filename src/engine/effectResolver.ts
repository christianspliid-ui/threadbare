/**
 * Effect Resolver — resolves effect-based modifiers for encounter resolution.
 *
 * Walks all attachments on an agent, evaluates which effects are currently
 * active (checking predicates, cooldown state, duration, stacks), and sums
 * applicable modifiers per reach domain.
 *
 * This is the "new path" for modifier resolution. Attachments with `effects[]`
 * arrays use this; attachments without fall back to the legacy `reachBonus` /
 * `domainContributions` path in resolutionModifiers.ts.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                     | Default | Purpose                                |
 * |--------------------------|---------|----------------------------------------|
 * | EFFECT_MODIFIER_CAP      | 0.30    | Max total modifier from all effects    |
 * | EFFECT_PER_ITEM_CAP      | 0.15    | Max modifier from a single effect      |
 * | CONDITIONAL_EVALUATION_CAP | 3     | Max predicates evaluated per effect    |
 * | HEALTH_LOW_THRESHOLD     | 0.70    | Doom fraction for health_low predicate |
 * | HEALTH_HIGH_THRESHOLD    | 0.30    | Doom fraction for health_high predicate|
 *
 * ─── Tracing ────────────────────────────────────────────────────
 * Returns EffectModifierResult with per-contribution breakdown.
 * Caller (resolutionModifiers.ts) includes in EncounterResolutionTrace.
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                    | Fallback                    |
 * |---------------------------------|-----------------------------|
 * | Unknown effect type             | Skip, emit warning trace    |
 * | Unknown predicate               | Treat as false (inactive)   |
 * | Missing agent node              | Return empty result         |
 * | Effect exceeds per-item cap     | Clamp to cap                |
 * | Total exceeds modifier cap      | Clamp to cap                |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all modifier resolution is deterministic.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type {
  AttachmentEffect,
  EffectPredicate,
  PredicateContext,
  EffectModifierResult,
  EffectModifierContribution,
  EffectRuntimeState,
  ResolvedTestShaper,
  ActivePreventLoss,
} from '../types/effects';
import {
  EFFECT_MODIFIER_CAP,
  EFFECT_PER_ITEM_CAP,
} from '../data/effect-constants';
import { collectAttachmentEffects, hasEffectsFormat as _hasEffectsFormat } from './effects/effectWalker';
import {
  evaluatePredicate as _evaluatePredicate,
  evaluateOptionalCondition as _evaluateOptionalCondition,
  buildPredicateContext as _buildPredicateContext,
} from './effects/effectPredicates';

// ═══════════════════════════════════════════════════════════════════
// Predicate Evaluation
// ═══════════════════════════════════════════════════════════════════

/**
 * Re-export from shared effectPredicates module.
 * Kept here for backward compatibility — existing consumers import from this file.
 */
export const evaluatePredicate = _evaluatePredicate;

// ═══════════════════════════════════════════════════════════════════
// Effect Value Extraction — get modifier value from a single effect
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract the modifier value for a specific reach from a single effect.
 * Returns 0 for effects that don't produce modifiers for the given reach,
 * or for non-modifier effect types (trait_grant, transform, etc.).
 */
export function getEffectModifierValue(
  effect: AttachmentEffect,
  reach: ReachDomain,
  ctx: PredicateContext,
  runtimeState?: EffectRuntimeState,
): number {
  switch (effect.type) {
    case 'passive':
      return effect.reach === reach ? effect.value : 0;

    case 'permanent':
      return effect.reach === reach ? effect.value : 0;

    case 'duration': {
      // Active only if ticks remain (runtime state check)
      if (runtimeState?.ticksRemaining !== undefined && runtimeState.ticksRemaining <= 0) return 0;
      return effect.reach === reach ? effect.value : 0;
    }

    case 'conditional': {
      if (effect.reach !== reach) return 0;
      const active = evaluatePredicate(effect.condition, ctx);
      return active ? effect.value : 0;
    }

    case 'cooldown': {
      // Active only during active phase
      if (runtimeState?.cooldownActive === false) return 0;
      return effect.reach === reach ? effect.value : 0;
    }

    case 'tradeoff': {
      let val = 0;
      if (effect.bonus.reach === reach) val += effect.bonus.value;
      if (effect.penalty.reach === reach) val += effect.penalty.value;
      return val;
    }

    case 'stacking': {
      if (effect.reach !== reach) return 0;
      const stacks = runtimeState?.stacks ?? 0;
      return effect.valuePerStack * stacks;
    }

    case 'decay': {
      if (effect.reach !== reach) return 0;
      return runtimeState?.decayCurrentValue ?? effect.startValue;
    }

    case 'until_event': {
      return effect.reach === reach ? effect.value : 0;
    }

    case 'consumable_charge': {
      // Consumable charges only contribute on use, not passively
      return 0;
    }

    // Non-modifier effect types — return 0
    case 'trait_grant':
    case 'transform':
    case 'aura':
    case 'reactive':
    case 'teleport':
    case 'forced_move':
    case 'reveal':
    case 'spawn':
    case 'dispel':
    case 'suppress':
    case 'auto_succeed':
    case 'reroll':
    case 'swap_reach':
    case 'outcome_shift':
    case 'test_shaper':
    case 'prevent_loss':
    case 'content_grant':
    case 'resource_delta':
    case 'action_trigger':
    case 'alter_terrain':
    case 'create_barrier':
    case 'transfer':
    case 'haste':
    case 'slow':
    case 'freeze_duration':
    case 'compel':
    case 'create_structure':
    case 'destroy_structure':
    case 'modify_rules':
    case 'faction_manipulate':
    case 'cascade':
      return 0;

    default:
      // Unknown effect type — fail-soft: skip
      return 0;
  }
}

/**
 * Check if an effect grants a trait.
 */
function getGrantedTrait(effect: AttachmentEffect): string | null {
  if (effect.type === 'trait_grant') return effect.grantedTrait;
  return null;
}

/**
 * Check if an effect is active based on its runtime state.
 * Handles suppression, duration expiry, and cooldown state.
 */
function isEffectActive(
  effect: AttachmentEffect,
  runtimeState?: EffectRuntimeState,
): boolean {
  // Check suppression
  if (runtimeState?.suppressed) return false;

  // Duration effects: check remaining ticks
  if (effect.type === 'duration' && runtimeState?.ticksRemaining !== undefined) {
    return runtimeState.ticksRemaining > 0;
  }

  // Cooldown effects: check if in active phase
  if (effect.type === 'cooldown') {
    return runtimeState?.cooldownActive !== false; // default true if no state yet
  }

  return true;
}

/** Wrapper that adds the `active` field needed by this resolver. */
interface AttachmentEffectEntry {
  attachmentId: string;
  attachmentName: string;
  effect: AttachmentEffect;
  runtimeState?: EffectRuntimeState;
  active: boolean;
}

function collectActiveEffects(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): AttachmentEffectEntry[] {
  return collectAttachmentEffects(graph, agentId, effectStates).map(entry => ({
    ...entry,
    active: isEffectActive(entry.effect, entry.runtimeState),
  }));
}

const evaluateOptionalCondition = _evaluateOptionalCondition;

export function collectTestShapers(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain,
  ctx: PredicateContext,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): ResolvedTestShaper[] {
  const shapers: ResolvedTestShaper[] = [];

  for (const entry of collectActiveEffects(graph, agentId, effectStates)) {
    if (!entry.active || entry.effect.type !== 'test_shaper') continue;
    if (entry.effect.reach && entry.effect.reach !== reach) continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    shapers.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      trigger: entry.effect.trigger,
      steps: entry.effect.steps,
      maxMargin: entry.effect.maxMargin,
    });
  }

  shapers.sort((a, b) => {
    if (b.steps !== a.steps) return b.steps - a.steps;
    return a.attachmentId.localeCompare(b.attachmentId);
  });

  return shapers;
}

export function collectPreventLossEffects(
  graph: WorldGraph,
  agentId: string,
  channel: ActivePreventLoss['channel'],
  ctx: PredicateContext,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): ActivePreventLoss[] {
  const preventLoss: ActivePreventLoss[] = [];

  for (const entry of collectActiveEffects(graph, agentId, effectStates)) {
    if (!entry.active || entry.effect.type !== 'prevent_loss') continue;
    if (entry.effect.channel !== channel) continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    preventLoss.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      channel: entry.effect.channel,
      amount: entry.effect.amount,
      tags: entry.effect.tags,
      consumeOnPrevent: entry.effect.consumeOnPrevent ?? false,
    });
  }

  preventLoss.sort((a, b) => {
    const aAmount = a.amount ?? Number.POSITIVE_INFINITY;
    const bAmount = b.amount ?? Number.POSITIVE_INFINITY;
    if (bAmount !== aAmount) return bAmount - aAmount;
    return a.attachmentId.localeCompare(b.attachmentId);
  });

  return preventLoss;
}

// ═══════════════════════════════════════════════════════════════════
// Main Resolver
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve all effect-based modifiers for an agent.
 *
 * Walks attachment nodes via possesses/bonded_to/has_trait edges,
 * reads effects[] arrays, evaluates predicates/state, sums modifiers.
 *
 * @param graph - World graph
 * @param agentId - Agent to resolve for
 * @param reach - Which reach domain to compute modifiers for
 * @param ctx - Predicate evaluation context
 * @param effectStates - Per-attachment runtime state (cooldowns, stacks, etc.)
 * @returns Total modifier and breakdown
 */
export function resolveEffectModifiers(
  graph: WorldGraph,
  agentId: string,
  reach: ReachDomain,
  ctx: PredicateContext,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): EffectModifierResult {
  const contributions: EffectModifierContribution[] = [];
  const grantedTraits: string[] = [];
  const testShapers = collectTestShapers(graph, agentId, reach, ctx, effectStates);
  const preventLoss = collectPreventLossEffects(graph, agentId, 'quintessence', ctx, effectStates);
  let total = 0;

  for (const entry of collectActiveEffects(graph, agentId, effectStates)) {
    const { attachmentId, attachmentName, effect, runtimeState, active } = entry;

    const trait = getGrantedTrait(effect);
    if (trait && active) {
      grantedTraits.push(trait);
    }

    const rawValue = active
      ? getEffectModifierValue(effect, reach, ctx, runtimeState)
      : 0;

    if (rawValue === 0 && !trait) continue;

    const cappedValue = rawValue > 0
      ? Math.min(rawValue, EFFECT_PER_ITEM_CAP)
      : Math.max(rawValue, -EFFECT_PER_ITEM_CAP);

    contributions.push({
      attachmentId,
      attachmentName,
      effectType: effect.type,
      reach,
      value: cappedValue,
      conditional: effect.type === 'conditional' ? effect.condition : undefined,
      active,
    });

    total += cappedValue;
  }

  // Cap total modifier
  const cappedTotal = total > 0
    ? Math.min(total, EFFECT_MODIFIER_CAP)
    : Math.max(total, -EFFECT_MODIFIER_CAP);

  const reachModifiers: Partial<Record<ReachDomain, number>> = {};
  if (cappedTotal !== 0) {
    reachModifiers[reach] = cappedTotal;
  }

  return {
    reachModifiers,
    contributions,
    grantedTraits,
    testShapers,
    preventLoss,
  };
}

/**
 * Re-export from shared effectWalker module.
 */
export const hasEffectsFormat = _hasEffectsFormat;

/**
 * Re-export from shared effectPredicates module.
 */
export const buildPredicateContext = _buildPredicateContext;

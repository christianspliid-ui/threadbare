/**
 * Effect Query Handler — read-only queries for capability checks.
 *
 * Provides the answer to "does this agent currently have X?" questions,
 * reading effect data from the attachment graph and optional runtime state.
 * All functions are pure/stateless and can be called from any engine system.
 *
 * Integration points (Phase 3):
 *   - action_gate     → unifiedCandidates.ts (block/unlock by reach)
 *   - behavior_weight → encounterScoring.ts (desire multiplier)
 *   - social_modifier → disposition.ts (cooperation bias)
 *   - range_modifier  → movementCost.ts, encounterAwareness.ts
 *   - tag_immunity    → condition application (block matching tags)
 *   - trait_grant     → hasGrantedTrait (standalone capability check)
 *   - modify_rules    → getActiveRuleOverrides (Phase 5 systems)
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case                  | Fallback                       |
 * |-------------------------------|--------------------------------|
 * | Missing agent node            | Return safe empty/default      |
 * | No effectStates               | Treat all effects as active    |
 * | Suppressed effect             | Skip (isEffectActive = false)  |
 * | Unknown effect type           | Ignore silently                |
 * | No condition context          | Treat conditions as true       |
 *
 * ─── PRNG ───────────────────────────────────────────────────────
 * None — all queries are deterministic.
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

import type { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import type {
  EffectRuntimeState,
  PredicateContext,
} from '../../types/effects';
import { collectAttachmentEffects } from './effectWalker';
import { evaluateOptionalCondition } from './effectPredicates';

// ═══════════════════════════════════════════════════════════════════
// Return Types
// ═══════════════════════════════════════════════════════════════════

/** Resolved behavior weight for a reach domain */
export interface BehaviorWeight {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly reach: ReachDomain;
  readonly multiplier: number;
}

/** Resolved social modifier from a single attachment */
export interface SocialModifier {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly targetFilter: 'ally' | 'enemy' | 'any' | 'same_faction' | 'different_faction';
  readonly cooperationBias: number;
}

/** Resolved action gate entry */
export interface ActionGateEntry {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly mode: 'block' | 'unlock';
  readonly reach: ReachDomain;
}

// ═══════════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an effect is active given its runtime state.
 * Mirrors the check in effectResolver — suppressed or expired = inactive.
 */
function isActive(runtimeState?: EffectRuntimeState): boolean {
  if (runtimeState?.suppressed) return false;
  if (runtimeState?.ticksRemaining !== undefined && runtimeState.ticksRemaining <= 0) return false;
  if (runtimeState?.cooldownActive === false) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// Trait Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Check whether any active effect on this agent grants the named trait.
 */
export function hasGrantedTrait(
  graph: WorldGraph,
  agentId: string,
  traitId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): boolean {
  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type === 'trait_grant' && entry.effect.grantedTrait === traitId) {
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Action Gates
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active action gate effects on this agent.
 *
 * Returns arrays of blocked and unlocked reach domains.
 * Blocked takes priority over unlocked for the same reach.
 */
export function getActionGates(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): { blocked: ReachDomain[]; unlocked: ReachDomain[] } {
  const blocked = new Set<ReachDomain>();
  const unlocked = new Set<ReachDomain>();

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'action_gate') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.mode === 'block') {
      blocked.add(entry.effect.reach);
    } else {
      unlocked.add(entry.effect.reach);
    }
  }

  // Blocked takes priority — remove from unlocked
  for (const reach of blocked) {
    unlocked.delete(reach);
  }

  return {
    blocked: Array.from(blocked),
    unlocked: Array.from(unlocked),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Behavior Weights
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active behavior weight effects on this agent.
 *
 * Each entry represents a multiplier on desire scores for that reach.
 * Multiple weights on the same reach stack multiplicatively (both apply).
 */
export function getBehaviorWeights(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): BehaviorWeight[] {
  const weights: BehaviorWeight[] = [];

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'behavior_weight') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    weights.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      reach: entry.effect.reach,
      multiplier: entry.effect.multiplier,
    });
  }

  return weights;
}

/**
 * Compute the combined behavior weight multiplier for a specific reach.
 * Weights stack multiplicatively. Returns 1.0 (no change) when no weights apply.
 */
export function computeBehaviorWeightMultiplier(
  weights: BehaviorWeight[],
  reach: ReachDomain,
): number {
  let multiplier = 1.0;
  for (const w of weights) {
    if (w.reach === reach) {
      multiplier *= w.multiplier;
    }
  }
  return multiplier;
}

// ═══════════════════════════════════════════════════════════════════
// Social Modifiers
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all active social modifier effects on this agent.
 */
export function getSocialModifiers(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): SocialModifier[] {
  const modifiers: SocialModifier[] = [];

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'social_modifier') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    modifiers.push({
      attachmentId: entry.attachmentId,
      attachmentName: entry.attachmentName,
      targetFilter: entry.effect.targetFilter,
      cooperationBias: entry.effect.cooperationBias,
    });
  }

  return modifiers;
}

/**
 * Compute the net cooperation bias from a list of social modifiers.
 * Filters to modifiers relevant to a given target relationship type,
 * then sums their cooperationBias. Clamped to [-1, +1].
 *
 * @param modifiers - pre-fetched from getSocialModifiers
 * @param targetRelationship - how the target relates to the agent
 */
export function computeSocialCooperationBias(
  modifiers: SocialModifier[],
  targetRelationship: 'ally' | 'enemy' | 'same_faction' | 'different_faction',
): number {
  let total = 0;
  for (const mod of modifiers) {
    if (mod.targetFilter === 'any' || mod.targetFilter === targetRelationship) {
      total += mod.cooperationBias;
    }
  }
  return Math.max(-1, Math.min(1, total));
}

// ═══════════════════════════════════════════════════════════════════
// Tag Immunity
// ═══════════════════════════════════════════════════════════════════

/**
 * Check whether the agent is currently immune to a condition tag.
 *
 * An agent is immune if any active tag_immunity effect covers the tag.
 * Used at condition-application time to block unwanted conditions.
 */
export function isImmuneToTag(
  graph: WorldGraph,
  agentId: string,
  tag: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): boolean {
  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'tag_immunity') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.tags.includes(tag)) {
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Range Modifiers
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the combined range modifier for this agent.
 *
 * - movementCostMultiplier: stacks multiplicatively (all × together), default 1.0
 * - awarenessRangeBonus: stacks additively (sum), default 0
 */
export function getRangeModifiers(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
  ctx?: PredicateContext,
): { movementCostMultiplier: number; awarenessRangeBonus: number } {
  let movementCostMultiplier = 1.0;
  let awarenessRangeBonus = 0;

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'range_modifier') continue;
    if (!evaluateOptionalCondition(entry.effect.condition, ctx)) continue;

    if (entry.effect.movementCostMultiplier !== undefined) {
      movementCostMultiplier *= entry.effect.movementCostMultiplier;
    }
    if (entry.effect.awarenessRangeBonus !== undefined) {
      awarenessRangeBonus += entry.effect.awarenessRangeBonus;
    }
  }

  return { movementCostMultiplier, awarenessRangeBonus };
}

// ═══════════════════════════════════════════════════════════════════
// Rule Override Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the effective rule override value for a given rule key.
 *
 * Scans all active modify_rules effects, sums numeric overrides,
 * ANDs boolean overrides, takes first-wins for string/struct.
 * Returns a numeric summary (0 = no override active).
 *
 * Primarily used in Phase 5 wiring for doom rate, encounter difficulty, etc.
 */
export function getActiveRuleOverride(
  graph: WorldGraph,
  agentId: string,
  rule: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): number {
  let total = 0;

  for (const entry of collectAttachmentEffects(graph, agentId, effectStates)) {
    if (!isActive(entry.runtimeState)) continue;
    if (entry.effect.type !== 'modify_rules') continue;
    if (entry.effect.rule !== rule) continue;

    const val = entry.effect.value;
    if (typeof val === 'number') {
      total += val;
    }
  }

  return total;
}

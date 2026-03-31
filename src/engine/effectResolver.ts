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
} from '../types/effects';
import {
  EFFECT_MODIFIER_CAP,
  EFFECT_PER_ITEM_CAP,
  CONDITIONAL_EVALUATION_CAP,
  HEALTH_LOW_THRESHOLD,
  HEALTH_HIGH_THRESHOLD,
} from '../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Predicate Evaluation
// ═══════════════════════════════════════════════════════════════════

/**
 * Evaluate a single condition predicate against the current context.
 * Returns true if the condition is met, false otherwise.
 * Unknown predicates return false (fail-soft).
 */
export function evaluatePredicate(
  predicate: EffectPredicate,
  ctx: PredicateContext,
): boolean {
  // Simple predicates
  switch (predicate) {
    case 'in_combat': return ctx.inCombat;
    case 'in_social': return ctx.inSocial;
    case 'in_exploration': return ctx.inExploration;
    case 'in_mystical': return ctx.inMystical;
    case 'at_home_territory': return ctx.atHomeTerritory;
    case 'in_enemy_territory': return ctx.inEnemyTerritory;
    case 'in_wilderness': return ctx.inWilderness;
    case 'health_low': return ctx.healthLow;
    case 'health_high': return ctx.healthHigh;
    case 'alone': return ctx.alone;
    case 'outnumbered': return ctx.outnumbered;
    case 'near_water': return ctx.nearWater;
  }

  // Parameterized predicates
  if (predicate.startsWith('biome:')) {
    const biomeType = predicate.slice('biome:'.length);
    return ctx.biome === biomeType;
  }
  if (predicate.startsWith('has_trait:')) {
    const tag = predicate.slice('has_trait:'.length);
    return ctx.agentTraits.has(tag);
  }
  if (predicate.startsWith('lacks_trait:')) {
    const tag = predicate.slice('lacks_trait:'.length);
    return !ctx.agentTraits.has(tag);
  }
  if (predicate.startsWith('reach_above:')) {
    const parts = predicate.slice('reach_above:'.length).split(':');
    if (parts.length < 2) return false;
    const reach = parts[0] as ReachDomain;
    const threshold = parseFloat(parts[1]);
    if (isNaN(threshold)) return false;
    return (ctx.reachValues[reach] ?? 0) > threshold;
  }
  if (predicate.startsWith('faction_rank:')) {
    const minRank = parseInt(predicate.slice('faction_rank:'.length), 10);
    if (isNaN(minRank)) return false;
    return ctx.factionRank >= minRank;
  }

  // Unknown predicate — fail-soft: treat as false
  return false;
}

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
  let total = 0;
  let hasAnyEffects = false;

  // Walk all attachment edges
  const edgeTypes = ['possesses', 'bonded_to', 'has_trait'] as const;

  for (const edgeType of edgeTypes) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      const node = graph.getNode(edge.target);
      if (!node) continue;

      const effects = node.properties.effects as AttachmentEffect[] | undefined;
      if (!effects || !Array.isArray(effects)) continue;

      hasAnyEffects = true;
      const attachmentName = (node.properties.name as string) ?? node.id;
      const runtimeState = effectStates?.get(node.id);

      // Cap number of effects evaluated per attachment
      const effectsToEvaluate = effects.slice(0, CONDITIONAL_EVALUATION_CAP * 2);

      for (const effect of effectsToEvaluate) {
        // Check if effect is active
        const active = isEffectActive(effect, runtimeState);

        // Collect trait grants
        const trait = getGrantedTrait(effect);
        if (trait && active) {
          grantedTraits.push(trait);
        }

        // Get modifier value
        const rawValue = active
          ? getEffectModifierValue(effect, reach, ctx, runtimeState)
          : 0;

        if (rawValue === 0 && !trait) continue;

        // Cap per-item contribution
        const cappedValue = rawValue > 0
          ? Math.min(rawValue, EFFECT_PER_ITEM_CAP)
          : Math.max(rawValue, -EFFECT_PER_ITEM_CAP);

        contributions.push({
          attachmentId: node.id,
          attachmentName,
          effectType: effect.type,
          reach,
          value: cappedValue,
          conditional: effect.type === 'conditional' ? effect.condition : undefined,
          active,
        });

        total += cappedValue;
      }
    }
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
  };
}

/**
 * Check whether an agent has any attachments with the new effects[] format.
 * Used to determine whether to use the new resolver or legacy path.
 */
export function hasEffectsFormat(
  graph: WorldGraph,
  agentId: string,
): boolean {
  const edgeTypes = ['possesses', 'bonded_to', 'has_trait'] as const;

  for (const edgeType of edgeTypes) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      const node = graph.getNode(edge.target);
      if (!node) continue;
      const effects = node.properties.effects;
      if (effects && Array.isArray(effects) && effects.length > 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Build a PredicateContext from graph state for a given agent.
 * Used by encounter resolution to populate the context for predicate evaluation.
 */
export function buildPredicateContext(
  graph: WorldGraph,
  agentId: string,
  stepReach?: ReachDomain,
  encounterType?: string,
): PredicateContext {
  const agentNode = graph.getNode(agentId);

  // Determine encounter type flags
  const inCombat = stepReach === 'iron' || encounterType === 'combat';
  const inSocial = stepReach === 'heart' || stepReach === 'gold' || encounterType === 'social';
  const inExploration = stepReach === 'eye' || stepReach === 'stone' || encounterType === 'exploration';
  const inMystical = stepReach === 'veil' || stepReach === 'star' || encounterType === 'mystical';

  // Resolve agent hex via located_at → parent location → hex
  let hexCol = -1;
  let hexRow = -1;
  let biome = 'unknown';

  const locatedAtEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locatedAtEdges.length > 0) {
    const locationNode = graph.getNode(locatedAtEdges[0].target);
    if (locationNode) {
      hexCol = (locationNode.properties.hexCol as number) ?? -1;
      hexRow = (locationNode.properties.hexRow as number) ?? -1;
      biome = (locationNode.properties.terrain as string) ?? 'unknown';

      // If sublocation, resolve up to parent location
      if (hexCol === -1 && locationNode.properties.parentLocationId) {
        const parentId = locationNode.properties.parentLocationId as string;
        const parentNode = graph.getNode(parentId);
        if (parentNode) {
          hexCol = (parentNode.properties.hexCol as number) ?? -1;
          hexRow = (parentNode.properties.hexRow as number) ?? -1;
          biome = (parentNode.properties.terrain as string) ?? biome;
        }
      }
    }
  }

  // Territory status
  const agentFaction = agentNode?.properties.factionId as string | undefined;
  let atHomeTerritory = false;
  let inEnemyTerritory = false;
  let inWilderness = true;

  if (agentFaction && hexCol >= 0) {
    // Check hex control - look for faction control edges or hex tile properties
    // Simplified: check if any location on this hex is controlled by agent's faction
    const locationEdges = graph.getOutgoingEdges(agentId, 'located_at');
    for (const le of locationEdges) {
      const locNode = graph.getNode(le.target);
      if (!locNode) continue;
      const controllingFaction = locNode.properties.controllingFactionId as string | undefined;
      if (controllingFaction) {
        inWilderness = false;
        if (controllingFaction === agentFaction) {
          atHomeTerritory = true;
        } else {
          // Check if hostile
          inEnemyTerritory = true;
        }
      }
    }
  }

  // Health status
  const doom = (agentNode?.properties.doom as number) ?? 0;
  const maxDoom = (agentNode?.properties.maxDoom as number) ?? 100;
  const doomFraction = maxDoom > 0 ? doom / maxDoom : 0;
  const healthLow = doomFraction >= HEALTH_LOW_THRESHOLD;
  const healthHigh = doomFraction <= HEALTH_HIGH_THRESHOLD;

  // Alone / outnumbered — check co-located agents
  let allyCount = 0;
  let enemyCount = 0;
  // Simplified: would need hex-level agent lookup for full implementation
  const alone = allyCount === 0 && enemyCount === 0;
  const outnumbered = enemyCount > (allyCount + 1);

  // Near water
  const nearWater = biome === 'coastal' || biome === 'river' || biome === 'lake'
    || biome === 'swamp' || biome === 'archipelago';

  // Agent traits
  const agentTraits = new Set<string>();
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const te of traitEdges) {
    const traitNode = graph.getNode(te.target);
    if (!traitNode) continue;
    const tags = traitNode.properties.tags as string[] | undefined;
    if (tags) {
      for (const tag of tags) agentTraits.add(tag);
    }
    const traitName = traitNode.properties.name as string | undefined;
    if (traitName) agentTraits.add(traitName);
  }

  // Reach values
  const reachValues: Partial<Record<ReachDomain, number>> = {};
  const domainCapability = agentNode?.properties.domainCapability as
    Partial<Record<ReachDomain, number>> | undefined;
  if (domainCapability) {
    for (const [key, val] of Object.entries(domainCapability)) {
      reachValues[key as ReachDomain] = val;
    }
  }

  // Faction rank
  const factionRank = (agentNode?.properties.factionRank as number) ?? 0;

  return {
    inCombat,
    inSocial,
    inExploration,
    inMystical,
    atHomeTerritory,
    inEnemyTerritory,
    inWilderness,
    healthLow,
    healthHigh,
    alone,
    outnumbered,
    nearWater,
    biome,
    agentTraits,
    reachValues,
    factionRank,
  };
}

/**
 * The cast channel — where a landed spell's modifier-only effects go (THR-1683).
 *
 * `executeEffect` traces an `aura`, a `conditional`, a `duration` (and the rest of
 * `MODIFIER_ONLY_EFFECT_TYPES`) and writes nothing: they are read by the resolver and
 * the tick off whatever the bearer *carries*. A cast carried nothing, so a landed
 * Pact of the Hollow Crown left no trace in the world beyond one step's odds, and
 * Veilwalk's shadow bonus was never anywhere at all.
 *
 * Now the landed branch of `resolveCast` hands those effects here. They ride one
 * shared condition definition per spell — `trait.condition.cast.<spellId>` — and the
 * caster bears it through the one condition writer (`applyConditionToActor`) for a
 * while. The existing readers do the rest with no new code: `effectAura` walks
 * `has_trait` → `node.effects` for auras, and the effect walker reads conditionals
 * and passives. When `decayConditions` expires the bearing, the effects stop.
 *
 * ─── What rides, and what does not ──────────────────────────────────
 * The definition is shared by every caster of the spell, and runtime state is keyed by
 * attachment, so only **stateless** primitives may ride it — the same rule a carried
 * (fate-woven) spell obeys (`isCarriedEffectStateless`). A `duration` effect is the one
 * conversion: its ticks become the bearing's own countdown and its value a `passive`.
 * Anything stateful (`stacking`, `decay`, charges, cooldowns, non-clock
 * `resource_manipulate`) is skipped and named in the cast trace rather than shared
 * into one world-wide counter.
 *
 * ─── Constants ──────────────────────────────────────────────────────
 * | Name                              | Where                       |
 * |-----------------------------------|-----------------------------|
 * | CAST_CHANNEL_DEFAULT_TICKS_BY_TIER | spell-casting-constants.ts |
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────────
 * | Failure                          | Fallback                                  |
 * |----------------------------------|-------------------------------------------|
 * | No effect can ride               | No channel; the cast lands, odds only     |
 * | Definition node cannot be minted | No channel; `reason` names it in the trace|
 * | Bearer refuses (immunity, ward)  | No channel; `reason` is the applier's     |
 * | Anything throws                  | No channel; `reason: 'error'`             |
 *
 * Plan: the THR-1683 ticket's design section (2026-10-02).
 */

import type { GameState } from '../types/gameState';
import type { AttachmentEffect, SpellTemplate } from '../types/effects';
import { isModifierOnlyEffect } from './effectExecutors';
import { applyConditionToActor } from './effects/conditionApplier';
import { castChannelTicksForTier, isCarriedEffectStateless } from '../data/spell-casting-constants';

/** The id of the shared cast condition for one spell. */
export function castChannelConditionId(spellId: string): string {
  return `trait.condition.cast.${spellId}`;
}

/** A landed spell's effects, split into those `executeEffect` writes and those the channel carries. */
export function splitCastEffects(effects: readonly AttachmentEffect[]): {
  executed: AttachmentEffect[];
  channel: AttachmentEffect[];
} {
  const executed: AttachmentEffect[] = [];
  const channel: AttachmentEffect[] = [];
  for (const effect of effects) (isModifierOnlyEffect(effect) ? channel : executed).push(effect);
  return { executed, channel };
}

/**
 * What the shared definition carries, and for how long a bearing lasts.
 *
 * A `duration` effect becomes a `passive` of the same reach and value, and the
 * longest such `ticks` sets the bearing's countdown; otherwise the tier default does.
 */
export function castChannelPlan(spell: SpellTemplate, channel: readonly AttachmentEffect[]): {
  carried: AttachmentEffect[];
  skipped: AttachmentEffect['type'][];
  durationTicks: number;
} {
  const carried: AttachmentEffect[] = [];
  const skipped: AttachmentEffect['type'][] = [];
  let durationTicks = 0;
  for (const effect of channel) {
    if (effect.type === 'duration') {
      carried.push({ type: 'passive', reach: effect.reach, value: effect.value, ...(effect.scope ? { scope: effect.scope } : {}) });
      durationTicks = Math.max(durationTicks, effect.ticks);
    } else if (isCarriedEffectStateless(effect)) {
      carried.push({ ...effect });
    } else {
      skipped.push(effect.type);
    }
  }
  if (durationTicks <= 0) durationTicks = castChannelTicksForTier(spell.tier);
  return { carried, skipped, durationTicks };
}

export interface CastChannelResult {
  /** The caster now bears the cast condition. */
  readonly applied: boolean;
  readonly conditionId?: string;
  readonly edgeId?: string;
  readonly durationTicks?: number;
  /** Effect types the condition carries. */
  readonly carried: readonly string[];
  /** Modifier-only effect types that could not ride a shared definition (stateful). */
  readonly skipped: readonly string[];
  /** Why there is no channel, when `applied` is false. */
  readonly reason?: string;
}

/**
 * Put a landed spell's modifier-only effects on the caster as a timed condition.
 *
 * Re-casting refreshes rather than stacks: the caster's earlier bearings of the same
 * cast condition are lifted first, so one spell is one bearing.
 */
export function applyCastChannel(
  state: GameState,
  casterId: string,
  spell: SpellTemplate,
  channel: readonly AttachmentEffect[],
  tick: number,
  siteRef: string,
): CastChannelResult {
  try {
    const { carried, skipped, durationTicks } = castChannelPlan(spell, channel);
    const carriedTypes = carried.map(e => e.type);
    if (carried.length === 0) {
      return { applied: false, carried: carriedTypes, skipped, ...(channel.length > 0 ? { reason: 'nothing_rides' } : {}) };
    }

    const graph = state.graph;
    const conditionId = castChannelConditionId(spell.id);
    if (!graph.getNode(conditionId)) {
      graph.addNode({
        id: conditionId,
        type: 'trait',
        name: spell.name,
        properties: {
          subcategory: 'condition',
          tier: spell.tier,
          tags: ['#condition', '#cast'],
          description: `Under ${spell.name}: the working still holds.`,
          mechanicalSummary: spell.mechanicalSummary,
          flavorText: spell.flavorText,
          maxLevel: 1,
          visibility: 'discoverable',
          importance: 0,
          domainContributions: {},
          castSpellId: spell.id,
          effects: carried,
        },
      });
      if (!graph.getNode(conditionId)) {
        return { applied: false, carried: carriedTypes, skipped, reason: 'condition_node_unavailable' };
      }
    }

    for (const edge of graph.getOutgoingEdges(casterId, 'has_trait')) {
      if (edge.target === conditionId) graph.removeEdge(edge.id);
    }

    const result = applyConditionToActor(state, casterId, conditionId, {
      tick,
      durationTicks,
      edgeId: `has_trait_${casterId}_${conditionId}_${tick}_${siteRef}`,
      edgeProperties: { source: 'spell_cast', spellId: spell.id },
    });
    if (!result.applied) return { applied: false, conditionId, carried: carriedTypes, skipped, reason: result.reason };
    return { applied: true, conditionId, edgeId: result.edgeId, durationTicks, carried: carriedTypes, skipped };
  } catch {
    return { applied: false, carried: [], skipped: [], reason: 'error' };
  }
}

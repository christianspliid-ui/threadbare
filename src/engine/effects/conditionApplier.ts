/**
 * The one condition writer (THR-1539, fight-block plan doc §7), in a module of its
 * own (THR-1542).
 *
 * FB3 extracted `applyConditionToActor` from the aftermath's `apply_condition`
 * case. FB6 routes the effect vocabulary's `inflict_condition` through it too, and
 * the effect dispatcher that runs executor results (`applyExecutionResult`) cannot
 * import `encounterAftermath` without dragging that module into the effect
 * engine's import graph. So the writer and its defaults live here, and
 * `encounterAftermath` re-exports them unchanged: every existing importer keeps
 * its import.
 */

import type { GameState } from '../../types/gameState';
import type { ActivePreventLoss } from '../../types/effects';
import { isImmuneToAnyTag, normalizeTag } from './effectQueries';
import { isHarmfulCondition, raiseConditionLanded } from './conditionProxyEvents';
import { buildPredicateContext, collectPreventLossEffects } from '../effectResolver';
import { ATTACHMENT_EDGE_TYPES } from './effectWalker';

/** Default intensity on apply_condition when the effect omits it. */
export const CONDITION_DEFAULT_INTENSITY = 0.5;

/** Default durationTicks on apply_condition when omitted. 0 = indefinite (no auto-expiry). */
export const CONDITION_DEFAULT_DURATION_TICKS = 0;

/** Options for `applyConditionToActor`. */
export interface ApplyConditionOpts {
  readonly tick: number;
  /** Defaults to `CONDITION_DEFAULT_INTENSITY`. */
  readonly intensity?: number;
  /** Defaults to `CONDITION_DEFAULT_DURATION_TICKS` (0 = indefinite). */
  readonly durationTicks?: number;
  /** The new `has_trait` edge's id. Defaults to `has_trait_<target>_<condition>_<tick>`. */
  readonly edgeId?: string;
  /**
   * Merged onto the new `has_trait` edge after the applier's fixed properties
   * (plan doc 1's Scarred passes `inflictedBy` and `scarredTick`; the aftermath
   * passes its encounter and reaction ids).
   */
  readonly edgeProperties?: Record<string, unknown>;
  /** Runs after the edge is written and before the `damaged` proxy is raised. */
  readonly onApplied?: (applied: { edgeId: string; intensity: number; durationTicks: number }) => void;
}

export type ApplyConditionResult =
  | { readonly applied: true; readonly edgeId: string; readonly intensity: number; readonly durationTicks: number }
  | {
    readonly applied: false;
    readonly reason: 'target_node_missing' | 'condition_template_missing' | 'tag_immunity' | 'prevent_loss';
    readonly immuneTag?: string;
    /** `prevent_loss` only (THR-1625): the attachment whose guard refused the condition. */
    readonly guardAttachmentId?: string;
    readonly guardAttachmentName?: string;
    /** `prevent_loss` only: the guard was `consumeOnPrevent` and is now spent. */
    readonly guardConsumed?: boolean;
  };

/**
 * Pick the condition loss-guard that refuses this condition (THR-1625), or null.
 *
 * `prevent_loss` on the `condition` channel had no reader until THR-1625, so every
 * authored ward against conditions (Sap-Blessed's `#wound` guard, The Silent
 * Testament's untagged guard) ran no check at all. Rules:
 *   - Only a **harmful** condition (`#negative`) is guarded. A ward that stopped a
 *     blessing would be a curse.
 *   - A guard with tags matches when any of them is on the condition (compared via
 *     `normalizeTag`, so `'#wound'` and `'wound'` are one tag).
 *   - A guard with no tags guards every harmful condition.
 * Guards arrive sorted by `collectPreventLossEffects` (largest amount, then id), so
 * the choice is deterministic. `amount` has no meaning on this channel: a guard
 * refuses the whole condition or none of it.
 */
function findConditionGuard(
  state: GameState,
  targetId: string,
  conditionTraitId: string,
  conditionTags: readonly string[],
): ActivePreventLoss | null {
  if (!isHarmfulCondition(state.graph, conditionTraitId)) return null;
  const guards = collectPreventLossEffects(
    state.graph, targetId, 'condition', buildPredicateContext(state.graph, targetId), state.effectStates,
  );
  if (guards.length === 0) return null;
  const conditionTagSet = new Set(conditionTags.map(normalizeTag));
  return guards.find(g => !g.tags || g.tags.length === 0 || g.tags.some(t => conditionTagSet.has(normalizeTag(t)))) ?? null;
}

/**
 * Spend a `consumeOnPrevent` condition guard (THR-1625). Mirrors
 * `phaseQuintessence.consumePreventLossAttachment`, with one difference: a trait is
 * a shared definition node that every bearer's `has_trait` edge points at, so a
 * spent trait guard removes only **this bearer's** edges to it — removing the node
 * would strip the power from every bearer in the world. Artifacts and agreement
 * edges are per-bearer and are removed outright. Fail-soft throughout.
 */
function consumeConditionGuard(state: GameState, targetId: string, attachmentId: string): void {
  try {
    const node = state.graph.getNode(attachmentId);
    if (!node) {
      // Edge-backed agreement: the attachment id is the edge id.
      if (state.graph.getEdge(attachmentId)) state.graph.removeEdge(attachmentId);
    } else if (node.type === 'trait') {
      for (const edgeType of ATTACHMENT_EDGE_TYPES) {
        for (const edge of state.graph.getOutgoingEdges(targetId, edgeType)) {
          if (edge.target === attachmentId) state.graph.removeEdge(edge.id);
        }
      }
      return; // the definition's runtime state is shared — leave it
    } else {
      state.graph.removeNode(attachmentId);
    }
  } catch {
    // Fail-soft: an already-removed guard is already spent.
  }
  state.effectStates?.delete(attachmentId);
}

/**
 * The condition loss-guard check as one call (THR-1625): find the guard that
 * refuses this condition on this carrier, spend it if it is `consumeOnPrevent`, and
 * return it — or null when the condition may land. `applyConditionToActor` runs it
 * after tag immunity; the aftermath's `condition_attachment` path, which writes its
 * own edge, runs it at the same point so both infliction sites honour the same wards.
 */
export function refuseByConditionGuard(
  state: GameState,
  targetId: string,
  conditionTraitId: string,
): ActivePreventLoss | null {
  const conditionTags = (state.graph.getNode(conditionTraitId)?.properties.tags as string[] | undefined) ?? [];
  const guard = findConditionGuard(state, targetId, conditionTraitId, conditionTags);
  if (guard?.consumeOnPrevent) consumeConditionGuard(state, targetId, guard.attachmentId);
  return guard;
}

/**
 * The one condition writer (THR-1539, fight-block plan doc §7). Lands a condition
 * trait on a carrier as a `has_trait` edge: refused when the carrier or the
 * condition is missing, when the carrier is immune to one of the condition's
 * tags (THR-1242), or when a `prevent_loss` condition guard refuses it
 * (THR-1625, `reason: 'prevent_loss'`); otherwise written with a live `ticksRemaining` counter
 * (THR-761), then the `damaged` proxy is raised (THR-1244).
 *
 * Extracted from the aftermath's `apply_condition` case, which now delegates to
 * it unchanged. Band conditions (fights), `inflict_condition`, fight
 * complications and Scarred all call this, so tag immunity and the proxy events
 * behave the same everywhere. Traces are the caller's: each path traces in its
 * own vocabulary.
 */
export function applyConditionToActor(
  state: GameState,
  targetId: string,
  conditionTraitId: string,
  opts: ApplyConditionOpts,
): ApplyConditionResult {
  if (!state.graph.getNode(targetId)) return { applied: false, reason: 'target_node_missing' };
  const conditionNode = state.graph.getNode(conditionTraitId);
  if (!conditionNode) return { applied: false, reason: 'condition_template_missing' };
  const conditionTags = (conditionNode.properties.tags as string[] | undefined) ?? [];
  const immuneTag = isImmuneToAnyTag(state.graph, targetId, conditionTags, state.effectStates);
  if (immuneTag !== null) return { applied: false, reason: 'tag_immunity', immuneTag };

  // THR-1625: the `condition` channel of `prevent_loss` — checked after immunity, so
  // a bearer with both is refused by the immunity and keeps a consuming guard.
  const guard = refuseByConditionGuard(state, targetId, conditionTraitId);
  if (guard) {
    return {
      applied: false,
      reason: 'prevent_loss',
      guardAttachmentId: guard.attachmentId,
      guardAttachmentName: guard.attachmentName,
      guardConsumed: guard.consumeOnPrevent,
    };
  }

  const intensity = opts.intensity ?? CONDITION_DEFAULT_INTENSITY;
  const durationTicks = opts.durationTicks ?? CONDITION_DEFAULT_DURATION_TICKS;
  const edgeId = opts.edgeId ?? `has_trait_${targetId}_${conditionTraitId}_${opts.tick}`;
  state.graph.addEdge({
    id: edgeId,
    source: targetId,
    target: conditionTraitId,
    type: 'has_trait',
    properties: {
      appliedAt: opts.tick,
      durationTicks,
      // THR-761: `decayConditions` is the only tick-driven expiry path and it
      // counts down `ticksRemaining`, not `durationTicks`. Writing only the
      // latter made every aftermath condition permanent. `durationTicks` stays
      // as the authored total (provenance + UI progress denominator); this is
      // the live counter. 0 = indefinite, so omit the field and the decay loop
      // skips the edge entirely.
      ...(durationTicks > 0 ? { ticksRemaining: durationTicks } : {}),
      intensity,
      ...(opts.edgeProperties ?? {}),
    },
  });
  opts.onApplied?.({ edgeId, intensity, durationTicks });
  // THR-1244: raised after the edge is written, so a reactive inspecting the
  // bearer sees the condition it is firing on. Self-gating on harm + person
  // carrier — see `conditionProxyEvents`. THR-1624: the landed hook also raises
  // `blessed` / `cursed` for a family-tagged condition.
  raiseConditionLanded(state, targetId, conditionTraitId, intensity);
  return { applied: true, edgeId, intensity, durationTicks };
}

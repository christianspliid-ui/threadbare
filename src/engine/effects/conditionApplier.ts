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
import { isImmuneToAnyTag } from './effectQueries';
import { raiseConditionDamaged } from './conditionProxyEvents';

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
    readonly reason: 'target_node_missing' | 'condition_template_missing' | 'tag_immunity';
    readonly immuneTag?: string;
  };

/**
 * The one condition writer (THR-1539, fight-block plan doc §7). Lands a condition
 * trait on a carrier as a `has_trait` edge: refused when the carrier or the
 * condition is missing, or when the carrier is immune to one of the condition's
 * tags (THR-1242); otherwise written with a live `ticksRemaining` counter
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
  const immuneTag = isImmuneToAnyTag(
    state.graph, targetId,
    (conditionNode.properties.tags as string[] | undefined) ?? [],
    state.effectStates,
  );
  if (immuneTag !== null) return { applied: false, reason: 'tag_immunity', immuneTag };

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
  // carrier — see `conditionProxyEvents`.
  raiseConditionDamaged(state, targetId, conditionTraitId, intensity);
  return { applied: true, edgeId, intensity, durationTicks };
}

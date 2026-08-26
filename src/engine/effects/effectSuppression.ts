/**
 * Effect suppression — the writer for a flag four readers already honoured (THR-1242).
 *
 * Stage 4 of the effect-vocabulary activation program
 * (`Docs/plans/2026-08-25-effect-vocabulary-activation.md`).
 *
 * `EffectRuntimeState.suppressed` has been read in four places since the
 * primitive architecture landed — `effectResolver.isEffectActive`,
 * `effectQueries.isActive`, `consumableCharges`, and `effectEvents` — and set in
 * none. So the `suppress` primitive was the inverse of the usual dead-primitive
 * shape: not a type nobody consumed, but a *consumer with no producer*. Four
 * shipped artifacts promised to silence magic around them and silenced nothing.
 *
 * ─── Why a phase pass rather than an executor ────────────────────────────────
 * `suppress` names a scope, and every scope wider than `self` is a statement
 * about *other agents*. An `ExecutionResult` carries graph mutations and
 * per-hex/per-agent overlays; it has no channel for "reach into another agent's
 * attachment runtime states", and widening it to add one would give every
 * executor a capability only this primitive needs. The effect-tick phase already
 * holds the whole `effectStates` map and runs once per tick, which is exactly the
 * shape this needs.
 *
 * ─── Expiry is computed, not decremented ─────────────────────────────────────
 * A suppression stores `suppressedUntilTick` and is lifted when the tick passes
 * it. That means a suppression re-asserted every tick by a still-worn amulet
 * simply keeps pushing its own expiry out, and one whose source is removed lifts
 * on schedule with no bookkeeping at the removal site — which matters because
 * attachments are destroyed from several places that know nothing about this.
 */

import type { WorldGraph } from '../graph';
import type { AttachmentEffect, EffectRuntimeState, SuppressEffect } from '../../types/effects';
import { emitTrace } from '../traceBuffer';
import { collectAttachmentEffects, ATTACHMENT_EDGE_TYPES } from './effectWalker';
import { resolveAgentHex } from '../relocationIntent';
import { hexDistance } from '../../lib/hexMath';
import { AURA_MAX_RADIUS } from '../../data/effect-constants';

/** One agent's suppression verdict for this tick, before it is written. */
interface PendingSuppression {
  readonly targetAgentId: string;
  readonly untilTick: number;
  readonly target: SuppressEffect['target'];
  readonly sourceAttachmentId: string;
  readonly sourceAgentId: string;
}

/**
 * Does this attachment fall in the class a `suppress` effect names?
 *
 * `all_effects` is everything. `spell` and `aura` are narrower, and both are read
 * off what the attachment *declares* rather than off a subcategory string: an
 * attachment that emits an `aura` effect is an aura source whatever its
 * subcategory says, and the subcategory vocabulary is content-authored while the
 * effect list is typed.
 */
function matchesSuppressTarget(
  target: SuppressEffect['target'],
  effects: readonly AttachmentEffect[],
  nodeSubcategory: string | undefined,
): boolean {
  if (target === 'all_effects') return true;
  if (target === 'aura') return effects.some(e => e.type === 'aura');
  // 'spell'
  return nodeSubcategory === 'spell'
    || effects.some(e => e.type === 'cooldown' || e.type === 'until_event');
}

/**
 * Every agent id inside a `suppress` effect's scope.
 *
 * Bounded by `AURA_MAX_RADIUS` for the same reason auras are: a radius scope
 * walks every agent in the world to test distance, so an unbounded radius from
 * content is an O(agents) scan per bearer per tick. Scopes this function cannot
 * resolve spatially (`region`, `faction`, `biome`, `global`, `target`) fall back
 * to the bearer alone rather than to everyone — an over-broad guess here silences
 * effects across the map, and failing narrow is the fail-soft direction (NFP #4).
 */
function resolveSuppressScope(
  graph: WorldGraph,
  effect: SuppressEffect,
  bearerId: string,
  allAgentIds: readonly string[],
): string[] {
  const scope = effect.scope;

  if (scope.scope === 'self') return [bearerId];

  if (scope.scope === 'hex' || scope.scope === 'radius') {
    const origin = resolveAgentHex(graph, bearerId);
    if (!origin) return [bearerId];

    const radius = scope.scope === 'hex'
      ? 0
      : Math.min(Math.max(0, scope.hexes), AURA_MAX_RADIUS);

    const inScope: string[] = [];
    for (const agentId of allAgentIds) {
      const hex = resolveAgentHex(graph, agentId);
      if (!hex) continue;
      if (hexDistance(origin, hex) <= radius) inScope.push(agentId);
    }
    return inScope.length > 0 ? inScope : [bearerId];
  }

  return [bearerId];
}

export interface SuppressionResult {
  /** A new map — callers replace their `effectStates` with it. */
  readonly states: Map<string, EffectRuntimeState>;
  /** How many attachments are suppressed after this pass. */
  readonly suppressedCount: number;
  /** How many suppressions expired this tick. */
  readonly liftedCount: number;
}

/**
 * Resolve every `suppress` effect in the world and write the flag.
 *
 * Runs once per tick, before the per-agent effect tick, so an attachment
 * suppressed this tick does not also get to act this tick.
 *
 * @param graph — world graph
 * @param effectStates — current runtime states; not mutated
 * @param tick — current tick
 * @param agentIds — the actor ids to consider as both sources and targets. Passed
 *   in rather than derived so the caller's existing agent filter is reused
 *   instead of re-walking `getNodesByType('actor')` a second time per tick.
 */
export function applySuppressions(
  graph: WorldGraph,
  effectStates: ReadonlyMap<string, EffectRuntimeState>,
  tick: number,
  agentIds: readonly string[],
): SuppressionResult {
  const states = new Map(effectStates);

  // ── Pass 1: lift what has run out ──
  //
  // Before collecting new suppressions, so a still-worn source re-asserts in
  // pass 2 and the flag never flickers off for a tick in between.
  let liftedCount = 0;
  for (const [attachmentId, state] of states) {
    if (state.suppressed !== true) continue;
    const until = state.suppressedUntilTick;
    // A suppression with no expiry is left alone — it was set by something other
    // than this pass and is not this function's to lift.
    if (until === undefined) continue;
    if (tick < until) continue;
    const next = { ...state, suppressed: false };
    delete next.suppressedUntilTick;
    states.set(attachmentId, next);
    liftedCount += 1;
  }

  // ── Pass 2: collect this tick's suppressions ──
  const pending: PendingSuppression[] = [];
  for (const bearerId of agentIds) {
    for (const entry of collectAttachmentEffects(graph, bearerId, states)) {
      if (entry.effect.type !== 'suppress') continue;

      // A suppressed suppressor does not suppress. Read off the map we are
      // building, so a source silenced earlier in this same pass stays silent.
      if (states.get(entry.attachmentId)?.suppressed === true) continue;

      const effect = entry.effect;
      const untilTick = tick + Math.max(1, effect.ticks);
      for (const targetAgentId of resolveSuppressScope(graph, effect, bearerId, agentIds)) {
        pending.push({
          targetAgentId,
          untilTick,
          target: effect.target,
          sourceAttachmentId: entry.attachmentId,
          sourceAgentId: bearerId,
        });
      }
    }
  }

  // ── Pass 3: write ──
  let suppressedCount = 0;
  for (const p of pending) {
    for (const edgeType of ATTACHMENT_EDGE_TYPES) {
      for (const edge of graph.getOutgoingEdges(p.targetAgentId, edgeType)) {
        const node = graph.getNode(edge.target);
        if (!node) continue;

        // The source never silences itself — a self-scoped `all_effects` amulet
        // would otherwise switch itself off on its first tick and stay off, which
        // reads in the trace exactly like the primitive not working at all.
        if (node.id === p.sourceAttachmentId) continue;

        const effects = node.properties.effects as AttachmentEffect[] | undefined;
        if (!effects || !Array.isArray(effects)) continue;
        if (!matchesSuppressTarget(p.target, effects, node.properties.subcategory as string | undefined)) continue;

        const prior = states.get(node.id) ?? {};
        // Longest suppression wins — two overlapping shrouds should not let the
        // shorter one's expiry lift the longer one's silence.
        const until = Math.max(prior.suppressedUntilTick ?? 0, p.untilTick);
        if (prior.suppressed === true && prior.suppressedUntilTick === until) continue;

        states.set(node.id, { ...prior, suppressed: true, suppressedUntilTick: until });
        suppressedCount += 1;

        emitTrace({
          category: 'effect.suppressed',
          tick,
          agentId: p.targetAgentId,
          attachmentId: node.id,
          sourceAttachmentId: p.sourceAttachmentId,
          sourceAgentId: p.sourceAgentId,
          untilTick: until,
          summary: `${node.name ?? node.id} suppressed until tick ${until} by ${p.sourceAttachmentId}`,
        });
      }
    }
  }

  return { states, suppressedCount, liftedCount };
}

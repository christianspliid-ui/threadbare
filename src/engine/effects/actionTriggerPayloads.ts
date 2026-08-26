/**
 * Action-trigger payload application — the graph-mutating half of `action_trigger`.
 *
 * `checkAndFireActionTriggers` decides *whether* a trigger fires and returns
 * `ActionTriggerPayloadIntent`s; this module applies the ones that touch the graph.
 * Splitting them keeps the fire-check pure and seed-reproducible (NFP #3) while the
 * mutations live in one shared place all three trigger call sites can use.
 *
 * Payload kinds handled here are exactly the three the authored item catalogs use
 * (THR-719 port): `condition_grant`, `condition_remove`, `self_remove`.
 * `resource_delta` is applied inside the resolver; `content_grant` / `trace_only`
 * mutate nothing.
 *
 * Every branch is fail-soft (NFP #4): a missing node, an already-severed edge, or a
 * duplicate removal skips that payload and leaves the rest to fire.
 *
 * ─── The fourth infliction site (THR-1257) ──────────────────────────
 * THR-1244 wired the `damaged` / `healed` condition proxy at the three *aftermath*
 * sites (`apply_condition`, `condition_attachment`, `remove_condition`). This module
 * writes the **same** `has_trait` edge shape through `condition_grant` /
 * `condition_remove` and is live — a Burned Codex grant fires at t24 of
 * `npm run cli -- --seed 42 --map medium` — so leaving it unwired meant a harmful
 * condition inflicted by an item raised nothing while the stage read as complete.
 *
 * Wiring it is why this function takes `GameState` rather than `WorldGraph`:
 * `raiseEffectEvent` needs the state, not just the graph. The `states` option and the
 * returned `effectStates` exist for the orchestrator, whose call sits inside a
 * `runningEffectStates` threading loop — a raise that wrote `state.effectStates`
 * directly from in there would be discarded by that loop's end-of-tick assignment,
 * which is the whole reason this was deferred out of THR-1244 rather than folded in.
 *
 * **Re-entrancy is not a risk here, and that is a fact about the call graph rather
 * than a guard.** `checkAndFireActionTriggers` has exactly three callers
 * (`orchestrator`, `phaseMovement`, `unifiedActionResolution`), all phase-level, and
 * neither `effectExecutors` nor `effectEvents` calls it — so a raise from this module
 * cannot re-enter the action-trigger path and no depth counter is needed. If a future
 * producer ever calls `checkAndFireActionTriggers` from inside effect execution that
 * stops being true, and this note is where it was checked.
 *
 * THR-719, THR-1257
 */

import type { GameState } from '../../types/gameState';
import type { EffectRuntimeState } from '../../types/effects';
import type { WorldGraph } from '../graph';
import type { TraceEntry } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import type { ActionTriggerPayloadIntent } from './actionTrigger';
import { isHarmfulCondition, raiseConditionDamaged, raiseConditionHealed } from './conditionProxyEvents';

export interface ActionTriggerPayloadApplyResult {
  conditionsGranted: number;
  conditionsRemoved: number;
  /** Possession node ids destroyed by `self_remove` (breakage / consumption). */
  possessionsRemoved: string[];
  /** True when any graph structure changed — caller must `touchStructure()`. */
  touchedStructure: boolean;
  /**
   * Merged effect runtime states — present **only** when the caller passed `states`,
   * i.e. is threading its own map and must not have `state.effectStates` written out
   * from under it. A caller that omits `states` gets its writes applied to
   * `state.effectStates` directly by `raiseEffectEvent`, exactly as every other
   * production site does, and can ignore this field.
   */
  effectStates?: Map<string, EffectRuntimeState>;
}

export interface ActionTriggerPayloadOptions {
  /**
   * Runtime states to read and update, for a caller threading its own map across a
   * loop instead of using `state.effectStates`. The orchestrator's encounter pass
   * does exactly this — see `RaiseEffectEventOptions.states`.
   */
  states?: ReadonlyMap<string, EffectRuntimeState>;
}

/** Does this condition trait node carry any of the requested tags? */
function nodeHasAnyTag(graph: WorldGraph, nodeId: string, tags: readonly string[]): boolean {
  const node = graph.getNode(nodeId);
  if (!node) return false;
  const nodeTags = (node.properties as Record<string, unknown>).tags as string[] | undefined;
  if (!nodeTags) return false;
  return tags.some(t => nodeTags.includes(t));
}

/**
 * Apply the graph-affecting payloads of triggers that fired this resolution.
 *
 * Mirrors the canonical machinery rather than re-implementing it: condition grants
 * use the same `has_trait` edge shape as `apply_condition` in `encounterAftermath`,
 * and `self_remove` uses the same incoming-edges-then-node teardown the effect-tick
 * destruction path uses in `orchestrator.ts`.
 */
export function applyActionTriggerPayloads(
  state: GameState,
  actorId: string,
  intents: readonly ActionTriggerPayloadIntent[],
  tick: number,
  opts?: ActionTriggerPayloadOptions,
): ActionTriggerPayloadApplyResult {
  const graph: WorldGraph = state.graph;
  const result: ActionTriggerPayloadApplyResult = {
    conditionsGranted: 0,
    conditionsRemoved: 0,
    possessionsRemoved: [],
    touchedStructure: false,
  };
  if (intents.length === 0) return result;

  /**
   * Threaded runtime states, chained across every raise in this batch so a second
   * payload sees the first one's cooldown writes. `undefined` means the caller is
   * not threading, and `raiseEffectEvent` owns `state.effectStates` itself.
   *
   * `tick` stays a parameter rather than being read off `state` because the traces
   * below have always used it and the two are equal at all three call sites; the
   * raises use `state.tick`, as every other production site does.
   */
  let running: ReadonlyMap<string, EffectRuntimeState> | undefined = opts?.states;
  const raise = (kind: 'damaged' | 'healed', conditionTraitId: string, amount: number): void => {
    const before = running;
    const fn = kind === 'damaged' ? raiseConditionDamaged : raiseConditionHealed;
    const merged = fn(state, actorId, conditionTraitId, amount, before ? { states: before } : undefined);
    if (before) running = merged;
  };

  for (let i = 0; i < intents.length; i++) {
    const intent = intents[i];
    const payload = intent.payload;

    try {
      switch (payload.kind) {
        case 'condition_grant': {
          // The condition trait node must already exist — authored content references
          // catalog condition nodes by id, exactly as `apply_condition` does.
          if (!graph.getNode(payload.conditionTraitId)) {
            emitTrace({
              tick,
              category: 'effect_reaction',
              event: 'action_trigger_payload_skipped',
              agentId: actorId,
              attachmentId: intent.attachmentId,
              payloadKind: payload.kind,
              reason: 'condition_node_missing',
              conditionTraitId: payload.conditionTraitId,
              summary: `action_trigger condition_grant skipped: condition node not found (${payload.conditionTraitId})`,
            } as unknown as TraceEntry);
            break;
          }
          // `ticksRemaining` is the field `decayConditions` actually counts down —
          // NOT `durationTicks`, which `apply_condition` writes and nothing reads
          // (verified 2026-07-25: zero edge-property readers; the aftermath path's
          // own exposure to this is THR-761). Writing the wrong one would mint
          // conditions that never expire, which is the same silent-death class this
          // ticket exists to close. `null`/omitted = indefinite, so the key is
          // omitted entirely and `decayConditions` skips the edge.
          const ticksRemaining = payload.durationTicks ?? null;
          graph.addEdge({
            id: `has_trait_${actorId}_${payload.conditionTraitId}_${tick}_${i}`,
            source: actorId,
            target: payload.conditionTraitId,
            type: 'has_trait',
            properties: {
              appliedAt: tick,
              ...(ticksRemaining !== null ? { ticksRemaining } : {}),
              intensity: payload.intensity ?? 1,
              sourceAttachmentId: intent.attachmentId,
            },
          });
          result.conditionsGranted++;
          result.touchedStructure = true;
          // THR-1257: raise `damaged` *after* the edge exists, so a reactive that
          // inspects the bearer sees the condition it is reacting to. The gate on
          // harm and on person-carrier lives inside the proxy, so a boon grant and
          // a grant onto an army both fall through silently rather than needing a
          // second copy of the predicate here.
          raise('damaged', payload.conditionTraitId, payload.intensity ?? 1);
          emitTrace({
            tick,
            category: 'condition_applied',
            agentId: actorId,
            targetId: actorId,
            targetKind: 'agent',
            conditionTraitId: payload.conditionTraitId,
            durationTicks: ticksRemaining ?? 0,
            intensity: payload.intensity ?? 1,
            summary: `action_trigger: ${intent.attachmentName} applied ${payload.conditionTraitId} to ${actorId}`,
          } as unknown as TraceEntry);
          break;
        }

        case 'condition_remove': {
          const edges = graph.getOutgoingEdges(actorId, 'has_trait');
          const matching = edges.filter(edge => {
            if (payload.conditionTraitId) return edge.target === payload.conditionTraitId;
            if (payload.tags && payload.tags.length > 0) {
              return nodeHasAnyTag(graph, edge.target, payload.tags);
            }
            return false;
          });
          let removedHere = 0;
          // THR-1257: capture what to raise *before* severing, because the edge's
          // `intensity` is the amount and the edge is about to be gone. The raise
          // itself is deferred until after removal so a reactive re-inspecting the
          // bearer sees them already clear of the condition — the same ordering the
          // three aftermath sites use.
          const lifted: Array<{ conditionTraitId: string; amount: number }> = [];
          for (const edge of matching) {
            const amount = typeof edge.properties?.intensity === 'number' ? edge.properties.intensity : 1;
            const conditionTraitId = edge.target;
            try {
              graph.removeEdge(edge.id);
              removedHere++;
              // Only a *harmful* condition lifted is a heal. Losing `blessed` is not.
              if (isHarmfulCondition(graph, conditionTraitId)) lifted.push({ conditionTraitId, amount });
            } catch { /* already removed — fail-soft */ }
          }
          for (const l of lifted) raise('healed', l.conditionTraitId, l.amount);
          result.conditionsRemoved += removedHere;
          if (removedHere > 0) result.touchedStructure = true;
          emitTrace({
            tick,
            category: 'condition_removed',
            agentId: actorId,
            targetId: actorId,
            targetKind: 'agent',
            conditionTraitId: payload.conditionTraitId ?? (payload.tags ?? []).join(','),
            removedCount: matching.length,
            summary: `action_trigger: ${intent.attachmentName} removed ${matching.length} condition(s) from ${actorId}`,
          } as unknown as TraceEntry);
          break;
        }

        case 'self_remove': {
          // Breakage / consumption: the item is gone, not merely unequipped. Same
          // teardown the effect-tick destruction path uses — sever every edge, then
          // drop the node, so no dangling reference survives.
          const attachId = intent.attachmentId;
          if (!graph.getNode(attachId)) break;
          for (const edge of graph.getIncomingEdges(attachId)) {
            try { graph.removeEdge(edge.id); } catch { /* already removed */ }
          }
          try { graph.removeNode(attachId); } catch { /* already removed */ }
          result.possessionsRemoved.push(attachId);
          result.touchedStructure = true;
          emitTrace({
            tick,
            category: 'effect_reaction',
            event: 'action_trigger_self_remove',
            agentId: actorId,
            attachmentId: attachId,
            attachmentName: intent.attachmentName,
            summary: `action_trigger: ${intent.attachmentName} destroyed (self_remove) for ${actorId}`,
          } as unknown as TraceEntry);
          break;
        }
      }
    } catch (err) {
      // Fail-soft: one bad payload must never break the tick loop (NFP #4).
      emitTrace({
        tick,
        category: 'effect_reaction',
        event: 'action_trigger_payload_error',
        agentId: actorId,
        attachmentId: intent.attachmentId,
        payloadKind: payload.kind,
        summary: `action_trigger payload ${payload.kind} threw: ${err instanceof Error ? err.message : String(err)}`,
      } as unknown as TraceEntry);
    }
  }

  // Present only for a threading caller (see `ActionTriggerPayloadApplyResult`).
  // `running` is reassigned by `raise` only when the caller passed `states`, so a
  // non-threading caller gets `undefined` here and reads `state.effectStates`.
  if (opts?.states && running !== opts.states) {
    result.effectStates = running instanceof Map ? running : new Map(running);
  }

  return result;
}

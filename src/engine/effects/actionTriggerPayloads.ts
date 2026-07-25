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
 * THR-719
 */

import type { WorldGraph } from '../graph';
import type { TraceEntry } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import type { ActionTriggerPayloadIntent } from './actionTrigger';

export interface ActionTriggerPayloadApplyResult {
  conditionsGranted: number;
  conditionsRemoved: number;
  /** Possession node ids destroyed by `self_remove` (breakage / consumption). */
  possessionsRemoved: string[];
  /** True when any graph structure changed — caller must `touchStructure()`. */
  touchedStructure: boolean;
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
  graph: WorldGraph,
  actorId: string,
  intents: readonly ActionTriggerPayloadIntent[],
  tick: number,
): ActionTriggerPayloadApplyResult {
  const result: ActionTriggerPayloadApplyResult = {
    conditionsGranted: 0,
    conditionsRemoved: 0,
    possessionsRemoved: [],
    touchedStructure: false,
  };
  if (intents.length === 0) return result;

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
          for (const edge of matching) {
            try {
              graph.removeEdge(edge.id);
              removedHere++;
            } catch { /* already removed — fail-soft */ }
          }
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

  return result;
}

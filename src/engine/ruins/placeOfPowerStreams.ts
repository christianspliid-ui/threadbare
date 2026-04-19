/**
 * Place of Power — passive essence streams (THR-153, PR 5).
 *
 * Runs once per tick. For every `place_of_power` location with a holder edge:
 *   - If the holder is present on the PoP's hex, credit essencePerTick into the
 *     ascendant essencePool and reset the absence countdown.
 *   - If the holder is absent, decrement the absence countdown; when it hits
 *     zero the holder edge is pruned and the stream dies.
 *   - Corrupt-path marks also credit POP_CORRUPT_SIPHON_FRACTION of the tick's
 *     essence into the marker-god's pool (in addition to the holder's credit).
 *
 * Unclaimed PoPs (no holder edge) emit nothing and are ignored.
 *
 * NFP compliance:
 *   #1 Tunability: rates/windows/siphon live in constants.ts
 *   #2 Inspectability: emits ruins.pop_stream / ruins.pop_stream_decayed /
 *                      ruins.pop_holder_changed
 *   #3 Determinism: pure over state + graph
 *   #4 Fail-soft: wrapped in try/catch; broken holder nodes just skip
 */

import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { SphereName } from '../../types/index';
import type { EssencePool } from '../../types/influence';
import { emitTrace } from '../traceBuffer';
import {
  POP_CORRUPT_SIPHON_FRACTION,
  POP_STREAM_DECAY_WINDOW_TICKS,
} from './constants';

function hexOf(
  graph: GameState['graph'],
  nodeId: string,
): { col: number; row: number } | null {
  const node = graph.getNode(nodeId);
  if (!node) return null;
  const col = node.properties.hexCol as number | undefined;
  const row = node.properties.hexRow as number | undefined;
  if (col !== undefined && row !== undefined) return { col, row };
  const parentId = node.properties.parentLocationId as string | undefined;
  if (parentId) return hexOf(graph, parentId);
  return null;
}

function agentOnHex(
  graph: GameState['graph'],
  agentId: string,
  col: number,
  row: number,
): boolean {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  if (edges.length === 0) return false;
  const hex = hexOf(graph, edges[0].target);
  return !!hex && hex.col === col && hex.row === row;
}

function countdownResetTarget(props: Record<string, unknown>): number {
  const stored = props.popStreamDecayCountdownMax as number | undefined;
  if (typeof stored === 'number' && stored > 0) return stored;
  return POP_STREAM_DECAY_WINDOW_TICKS;
}

export function phasePlaceOfPowerStreams(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const essencePool: EssencePool = { ...state.essencePool };
  let mutated = false;

  try {
    const locations = graph.getNodesByType('location');
    for (const loc of locations) {
      const props = loc.properties as Record<string, unknown>;
      if (props.locationSubtype !== 'place_of_power') continue;

      const candidates: GraphNode[] = graph.getNodesByType('actor');
      let holderNode: GraphNode | null = null;
      let holderEdgeId: string | null = null;
      let holderEdgeProps: Record<string, unknown> | null = null;
      for (const cand of candidates) {
        const outs = graph.getOutgoingEdges(cand.id, 'holds_place_of_power');
        const hit = outs.find(e => e.target === loc.id);
        if (hit) {
          holderNode = cand;
          holderEdgeId = hit.id;
          holderEdgeProps = hit.properties as Record<string, unknown>;
          break;
        }
      }

      if (!holderNode || !holderEdgeId || !holderEdgeProps) continue;

      const popHex = hexOf(graph, loc.id);
      if (!popHex) continue;

      const holderType = (holderEdgeProps.holderType as string | undefined) ?? 'actor';
      const essencePerTick = (props.popEssencePerTick as number | undefined) ?? 0;
      const sphere = (props.popSphere as SphereName | undefined) ?? 'spirit';
      let countdown = (props.popStreamDecayCountdown as number | undefined) ?? POP_STREAM_DECAY_WINDOW_TICKS;

      const actorSubtype = (holderNode.properties.actorType as string | undefined) ?? 'individual';
      let present = false;
      if (holderType === 'god' || actorSubtype === 'god') {
        present = true;
      } else if (actorSubtype === 'faction') {
        const factionId = holderNode.id;
        const members = candidates.filter(a =>
          graph.getOutgoingEdges(a.id, 'member_of').some(e => e.target === factionId),
        );
        present = members.some(m => agentOnHex(graph, m.id, popHex.col, popHex.row));
      } else {
        present = agentOnHex(graph, holderNode.id, popHex.col, popHex.row);
      }

      if (present) {
        essencePool[sphere] = (essencePool[sphere] ?? 0) + essencePerTick;
        let siphonAmount = 0;
        if (holderEdgeProps.corruptMark === true) {
          siphonAmount = Math.floor(essencePerTick * POP_CORRUPT_SIPHON_FRACTION);
          if (siphonAmount > 0) {
            essencePool.darkness = (essencePool.darkness ?? 0) + siphonAmount;
          }
        }
        graph.updateNode(loc.id, {
          properties: {
            ...props,
            popStreamDecayCountdown: countdownResetTarget(props),
            popLastCreditedTick: tick,
          },
        });
        mutated = true;
        emitTrace({
          category: 'ruins.pop_stream',
          tick,
          popId: loc.id,
          holderId: holderNode.id,
          essenceCredited: essencePerTick,
          streamDecayCountdown: countdownResetTarget(props),
          siphonToGodId: siphonAmount > 0 ? 'player-god' : undefined,
          siphonAmount: siphonAmount > 0 ? siphonAmount : undefined,
          summary: `PoP stream credited ${essencePerTick} ${sphere} to ${holderNode.id}`,
        } as any);
      } else {
        countdown -= 1;
        if (countdown > 0) {
          graph.updateNode(loc.id, {
            properties: { ...props, popStreamDecayCountdown: countdown },
          });
          mutated = true;
        } else {
          try { graph.removeEdge(holderEdgeId); } catch { /* fail-soft */ }
          graph.updateNode(loc.id, {
            properties: { ...props, popStreamDecayCountdown: 0, popStreamDead: true },
          });
          mutated = true;

          emitTrace({
            category: 'ruins.pop_stream_decayed',
            tick,
            popId: loc.id,
            lastHolderId: holderNode.id,
            absenceDurationTicks: countdownResetTarget(props),
            summary: `PoP stream decayed: holder ${holderNode.id} absent too long`,
          } as any);
          emitTrace({
            category: 'ruins.pop_holder_changed',
            tick,
            popId: loc.id,
            previousHolderId: holderNode.id,
            newHolderId: null,
            holderType,
            reason: 'holder_absent',
            summary: `PoP holder edge pruned due to absence`,
          } as any);
        }
      }
    }
  } catch {
    // fail-soft — tick loop must not crash from stream bookkeeping
  }

  if (!mutated) return {};
  return { essencePool };
}

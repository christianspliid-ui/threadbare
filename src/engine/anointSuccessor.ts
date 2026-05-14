/**
 * Anoint Successor application helper — THR-432.
 *
 * Called by `unifiedActionResolution.ts` when an `anoint_successor` GraphOp
 * fires. Resolves the target agent's faction from their `member_of` edges
 * (highest reputation wins when multiple), then creates a `will_succeed`
 * edge targeted at the faction with `anointedTick = state.tick`.
 *
 * The thread is silent until the leader exits — there is no immediate world
 * effect. Only the trace and the edge record what the player has done.
 *
 * Fail-soft (NFP #4): returns false on any precondition miss; never throws.
 */
import type { GameState } from '../types/gameState';
import type { GraphEdge } from '../types/graph';
import type { FactionAnointSuccessorTrace } from '../types/factionAction';
import { emitTrace } from './traceBuffer';

/**
 * Resolve the target agent's faction.
 *
 * Returns the faction id the agent should be anointed for, or null if the
 * agent has no faction (verb is not surfaced in that case — defensive).
 * When the agent belongs to multiple factions, picks the one with the highest
 * `member_of` reputation (the faction they are most invested in).
 */
function resolveTargetFaction(
  state: GameState,
  targetAgentId: string,
): { factionId: string; multiResolved: boolean } | null {
  const edges = state.graph.getOutgoingEdges(targetAgentId, 'member_of');
  if (edges.length === 0) return null;

  if (edges.length === 1) {
    return { factionId: edges[0].target, multiResolved: false };
  }

  // Pick by reputation desc; tiebreak by stable edge ordering.
  let best: GraphEdge | null = null;
  let bestRep = Number.NEGATIVE_INFINITY;
  for (const e of edges) {
    const rep = (e.properties.reputation as number | undefined) ?? 0;
    if (rep > bestRep) { bestRep = rep; best = e; }
  }
  if (!best) return null;
  return { factionId: best.target, multiResolved: true };
}

/**
 * Apply the Anoint Successor effect. Returns true on success.
 *
 * Re-anointment is allowed: if the target already has a `will_succeed` edge
 * for this faction, the new edge supersedes by virtue of carrying a more
 * recent `anointedTick` (the succession resolver sorts by anointedTick desc).
 * No edges are removed here — append-only per CLAUDE.md load-bearing decision.
 */
export function applyAnointSuccessor(
  state: GameState,
  targetAgentId: string,
  actorAscendantId: string | undefined,
): boolean {
  const target = state.graph.getNode(targetAgentId);
  if (!target || target.type !== 'actor') return false;
  if (target.properties.armyState != null || target.properties.actorType === 'group') return false;

  const resolved = resolveTargetFaction(state, targetAgentId);
  if (!resolved) return false;

  const faction = state.graph.getNode(resolved.factionId);
  if (!faction || faction.properties.actorType !== 'faction') return false;

  // Re-anointment detection: does this agent already have a will_succeed edge
  // for this faction? If yes, the new one supersedes via recency.
  const existing = state.graph
    .getOutgoingEdges(targetAgentId, 'will_succeed')
    .find(e => e.target === resolved.factionId);

  // Add the new edge — append-only.
  const edgeId = `e_will_succeed_${targetAgentId}_${resolved.factionId}_${state.tick}`;
  state.graph.addEdge({
    id: edgeId,
    source: targetAgentId,
    target: resolved.factionId,
    type: 'will_succeed',
    properties: {
      anointedTick: state.tick,
      anointedBy: actorAscendantId ?? null,
    },
  });

  const trace: FactionAnointSuccessorTrace = {
    tick: state.tick,
    category: 'faction_anoint_successor',
    factionId: resolved.factionId,
    factionName: faction.name,
    successorId: targetAgentId,
    successorName: target.name,
    multiFactionResolved: resolved.multiResolved,
    reAnointment: existing != null,
    anointedTick: state.tick,
    summary:
      `anoint_successor[${resolved.factionId}]: ${target.name} woven as heir`
      + (existing ? ' (re-anointment supersedes prior)' : ''),
  };
  emitTrace(trace);

  return true;
}

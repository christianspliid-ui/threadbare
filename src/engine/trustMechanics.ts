/**
 * Trust Mechanics — edge-level trust tracking on relates_to edges.
 *
 * Trust is a [-1, 1] value stored on relates_to edge properties.
 * Positive = trusting relationship, negative = distrusting.
 * Trust decays toward 0 each tick (agents gradually forget).
 *
 * ─── Constants ────────────────────────────────────────────────
 * | Name                  | Default | Purpose                         |
 * |-----------------------|---------|---------------------------------|
 * | TRUST_COOPERATE_DELTA | +0.03   | Trust gain per cooperative act  |
 * | TRUST_DEFECT_DELTA    | -0.08   | Trust loss per defection        |
 * | TRUST_DECAY_PER_TICK  | 0.002   | Decay toward 0 each tick        |
 *
 * ─── Tracing ─────────────────────────────────────────────────
 * Emits 'trust_change' trace on applyTrustChange.
 *
 * ─── Fail-soft ───────────────────────────────────────────────
 * | Failure case                | Fallback                         |
 * |-----------------------------|----------------------------------|
 * | No relates_to edge exists   | Return oldTrust=0, newTrust=0    |
 * | Missing trust property      | Treat as 0                       |
 * | Edge source/target missing  | Skip edge in decay               |
 *
 * ─── PRNG ────────────────────────────────────────────────────
 * None — trust changes are deterministic deltas.
 */

import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';

// ─── Constants (re-exported from central tuning file) ───────────
export {
  TRUST_COOPERATE_DELTA,
  TRUST_DEFECT_DELTA,
  TRUST_DECAY_PER_TICK,
} from '../data/agent-behavior-constants';

import {
  TRUST_COOPERATE_DELTA,
  TRUST_DEFECT_DELTA,
  TRUST_DECAY_PER_TICK,
} from '../data/agent-behavior-constants';

// ─── Core Functions ──────────────────────────────────────────

/**
 * Get trust between two agents from their relates_to edge.
 * Returns 0 if no edge exists (fail-soft).
 */
export function getTrust(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
): number {
  const edge = findRelatesTo(graph, sourceId, targetId);
  if (!edge) return 0;
  return (edge.properties.trust as number) ?? 0;
}

/**
 * Apply trust change after a cooperative or defective interaction.
 * Finds the relates_to edge between source and target, updates its trust
 * property, and clamps to [-1, 1].
 *
 * If no relates_to edge exists, this is a no-op returning {oldTrust: 0, newTrust: 0}.
 */
export function applyTrustChange(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
  cooperated: boolean,
): { oldTrust: number; newTrust: number } {
  const edge = findRelatesTo(graph, sourceId, targetId);
  if (!edge) return { oldTrust: 0, newTrust: 0 };

  const oldTrust = (edge.properties.trust as number) ?? 0;
  const delta = cooperated ? TRUST_COOPERATE_DELTA : TRUST_DEFECT_DELTA;
  const newTrust = clamp(oldTrust + delta, -1, 1);

  graph.updateEdge(edge.id, {
    properties: { ...edge.properties, trust: newTrust },
  });

  emitTrace({
    tick: 0, // caller should override via trace context
    category: 'trust_change',
    agentId: sourceId,
    targetId,
    summary: `Trust ${sourceId}→${targetId}: ${oldTrust.toFixed(3)} → ${newTrust.toFixed(3)} (${cooperated ? 'cooperate' : 'defect'})`,
    oldTrust,
    newTrust,
    cooperated,
  });

  return { oldTrust, newTrust };
}

/**
 * Decay all trust values toward 0 by TRUST_DECAY_PER_TICK.
 * Walks all relates_to edges. Does not overshoot zero.
 *
 * @returns Count of edges decayed.
 */
export function decayAllTrust(graph: WorldGraph): number {
  const edges = graph.getEdgesByType('relates_to');
  let count = 0;

  for (const edge of edges) {
    const trust = (edge.properties.trust as number) ?? 0;
    if (trust === 0) continue;

    let newTrust: number;
    if (trust > 0) {
      newTrust = Math.max(0, trust - TRUST_DECAY_PER_TICK);
    } else {
      newTrust = Math.min(0, trust + TRUST_DECAY_PER_TICK);
    }

    if (newTrust !== trust) {
      graph.updateEdge(edge.id, {
        properties: { ...edge.properties, trust: newTrust },
      });
      count++;
    }
  }

  return count;
}

// ─── Internal Helpers ────────────────────────────────────────

/**
 * Find relates_to edge between source and target (checking both directions).
 */
function findRelatesTo(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
) {
  // Check outgoing from source to target
  const outgoing = graph.getOutgoingEdges(sourceId, 'relates_to');
  for (const edge of outgoing) {
    if (edge.target === targetId) return edge;
  }

  // Check incoming (target → source, bidirectional relationship)
  const incoming = graph.getIncomingEdges(sourceId, 'relates_to');
  for (const edge of incoming) {
    if (edge.source === targetId) return edge;
  }

  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

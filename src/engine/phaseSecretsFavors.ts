/**
 * Phase 6.653: Secrets & Favors Maintenance (THR-30)
 *
 * Lightweight per-interval phase that handles:
 * 1. Secret decay — minor secrets fade after SECRET_MAX_AGE_TICKS
 * 2. Favor tension — unpaid favors drift sentiment on the relates_to edge
 * 3. Favor expiry — very old favors are forgiven (removed)
 *
 * Runs every SECRET_FAVOR_CHECK_INTERVAL ticks (not every tick).
 * Mutates graph edges in place (standard pattern for engine phases).
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * Errors in any per-edge pass are swallowed; the tick loop must not crash.
 *
 * ─── Determinism ──────────────────────────────────────────────────
 * No PRNG — all operations are deterministic age comparisons.
 */

import type { GameState } from '../types/gameState';
import {
  SECRET_DECAY_THRESHOLD,
  SECRET_MAX_AGE_TICKS,
  SECRET_FAVOR_CHECK_INTERVAL,
  FAVOR_TENSION_THRESHOLD_TICKS,
  FAVOR_TENSION_SENTIMENT_DELTA,
  FAVOR_MAX_AGE_TICKS,
} from '../types/secretsFavors';
import { emitTrace } from './traceBuffer';

export function phaseSecretsFavors(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  // Only run every SECRET_FAVOR_CHECK_INTERVAL ticks
  if (tick % SECRET_FAVOR_CHECK_INTERVAL !== 0) return {};

  try {
    processSecretDecay(graph, tick);
  } catch {
    // fail-soft
  }

  try {
    processFavorTensionAndExpiry(graph, tick);
  } catch {
    // fail-soft
  }

  // Phase mutates graph edges in place — no state fields change
  return {};
}

// ─── Secret Decay ─────────────────────────────────────────────────────────

function processSecretDecay(
  graph: import('./graph').WorldGraph,
  tick: number,
): void {
  const secretEdges = graph.getEdgesByType('knows_secret_of');

  for (const edge of secretEdges) {
    const props = edge.properties;
    const magnitude = (props.magnitude as number) ?? 0;
    const discoveredTick = (props.discoveredTick as number) ?? 0;
    const revealed = (props.revealed as boolean) ?? false;

    if (revealed) continue;

    const age = tick - discoveredTick;
    if (magnitude < SECRET_DECAY_THRESHOLD && age > SECRET_MAX_AGE_TICKS) {
      graph.removeEdge(edge.id);
      emitTrace({
        tick,
        category: 'secret_decayed',
        agentId: edge.source,
        summary: `Minor secret (${props.secretType as string}) about ${edge.target} faded after ${age} ticks`,
      });
    }
  }
}

// ─── Favor Tension + Expiry ────────────────────────────────────────────────

function processFavorTensionAndExpiry(
  graph: import('./graph').WorldGraph,
  tick: number,
): void {
  const favorEdges = graph.getEdgesByType('owes_favor');

  for (const edge of favorEdges) {
    const props = edge.properties;
    const grantedTick = (props.grantedTick as number) ?? 0;
    const redeemed = (props.redeemed as boolean) ?? false;
    const broken = (props.broken as boolean) ?? false;

    if (redeemed || broken) continue;

    const age = tick - grantedTick;
    const debtorId = edge.source;
    const creditorId = edge.target;

    // Favor expiry — forgiven after FAVOR_MAX_AGE_TICKS
    if (age > FAVOR_MAX_AGE_TICKS) {
      graph.removeEdge(edge.id);
      emitTrace({
        tick,
        category: 'favor_tension',
        agentId: debtorId,
        summary: `Favor to ${creditorId} expired after ${age} ticks (forgiven)`,
      });
      continue;
    }

    // Tension drift — unpaid favor past threshold drifts sentiment on relates_to
    if (age > FAVOR_TENSION_THRESHOLD_TICKS) {
      const relatesEdges = graph.getOutgoingEdges(debtorId, 'relates_to')
        .filter(e => e.target === creditorId);
      if (relatesEdges.length > 0) {
        const relatesEdge = relatesEdges[0];
        const currentSentiment = (relatesEdge.properties.sentiment as number) ?? 0;
        const newSentiment = Math.max(-1, currentSentiment + FAVOR_TENSION_SENTIMENT_DELTA);
        graph.updateEdge(relatesEdge.id, {
          properties: { ...relatesEdge.properties, sentiment: newSentiment },
        });
        emitTrace({
          tick,
          category: 'favor_tension',
          agentId: debtorId,
          summary: `Favor tension: ${debtorId} → ${creditorId} sentiment ${currentSentiment.toFixed(2)} → ${newSentiment.toFixed(2)}`,
        });
      }
    }
  }
}

/**
 * Secrets & Favors — Social Consequence Chains (THR-30)
 *
 * Applies trust/sentiment penalties when:
 * - A secret is revealed (via encounter step, divine action, or faction action)
 * - A favor is broken (debtor refuses when called)
 *
 * Both consequence functions are deterministic, graph-only mutations.
 * They emit traces and chronicle-eligible tick events via the caller.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * Missing edges → skipped penalty (no crash). All clamps applied.
 */

import type { WorldGraph } from './graph';
import type { KnowsSecretOfEdgeProperties, OwesFavorEdgeProperties } from '../types/secretsFavors';
import {
  SECRET_REVELATION_TRUST_PENALTY,
  SECRET_CONFESSION_BETRAYAL_PENALTY,
  FAVOR_BREAKING_TRUST_PENALTY,
  FAVOR_BREAKING_SENTIMENT_PENALTY,
} from '../types/secretsFavors';
import { emitTrace } from './traceBuffer';

// ─── Helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function applyTrustDelta(graph: WorldGraph, fromId: string, toId: string, delta: number): void {
  const edges = graph.getOutgoingEdges(fromId, 'relates_to')
    .filter(e => e.target === toId);
  if (edges.length === 0) return;
  const edge = edges[0];
  const current = (edge.properties.trust as number) ?? 0;
  graph.updateEdge(edge.id, {
    properties: { ...edge.properties, trust: clamp(current + delta, -1, 1) },
  });
}

function applySentimentDelta(graph: WorldGraph, fromId: string, toId: string, delta: number): void {
  const edges = graph.getOutgoingEdges(fromId, 'relates_to')
    .filter(e => e.target === toId);
  if (edges.length === 0) return;
  const edge = edges[0];
  const current = (edge.properties.sentiment as number) ?? 0;
  graph.updateEdge(edge.id, {
    properties: { ...edge.properties, sentiment: clamp(current + delta, -1, 1) },
  });
}

// ─── Secret Revelation ────────────────────────────────────────────────────

export interface SecretRevelationResult {
  trustPenalty: number;
  sentimentPenalty: number;
  summary: string;
}

/**
 * Apply social consequences when a secret is revealed.
 *
 * - Subject → revealer: trust penalty (betrayal extra if source was confession)
 * - Subject → revealedTo: sentiment shift (embarrassment/anger)
 * - Marks secret as revealed on the graph edge
 *
 * @param secretEdgeId  The `knows_secret_of` edge ID
 * @param subjectId     The agent whose secret was revealed
 * @param revealerId    The agent who held and used the secret
 * @param revealedToId  The agent who now knows the secret
 * @param tick          Current game tick
 * @param graph         World graph (mutated in place)
 */
export function applySecretRevelationConsequences(
  secretEdgeId: string,
  secret: KnowsSecretOfEdgeProperties,
  subjectId: string,
  revealerId: string,
  revealedToId: string,
  tick: number,
  graph: WorldGraph,
): SecretRevelationResult {
  let trustPenalty = SECRET_REVELATION_TRUST_PENALTY;
  const isConfessionBetrayal = secret.source === 'confession';
  if (isConfessionBetrayal) {
    trustPenalty += SECRET_CONFESSION_BETRAYAL_PENALTY;
  }

  // Mark secret as revealed
  try {
    const edge = graph.getEdge(secretEdgeId);
    if (edge) {
      graph.updateEdge(secretEdgeId, {
        properties: {
          ...edge.properties,
          revealed: true,
          revealedTick: tick,
          revealedTo: revealedToId,
        },
      });
    }
  } catch {
    // fail-soft
  }

  // Subject → revealer: trust penalty
  applyTrustDelta(graph, subjectId, revealerId, trustPenalty);

  // Subject → revealedTo: negative sentiment (embarrassment / anger)
  const sentimentPenalty = -0.25;
  applySentimentDelta(graph, subjectId, revealedToId, sentimentPenalty);

  const summary = `Secret (${secret.secretType}) about ${subjectId} revealed to ${revealedToId} by ${revealerId}. Trust penalty: ${trustPenalty.toFixed(2)}`;

  try {
    emitTrace({
      tick,
      category: 'secret_revealed',
      event: 'secret_revealed',
      revealerId,
      subjectId,
      revealedToId,
      secretType: secret.secretType,
      magnitude: secret.magnitude,
      trustConsequence: trustPenalty,
      sentimentConsequence: sentimentPenalty,
      isConfessionBetrayal,
      summary,
    });
  } catch {
    // trace failure must never block consequences
  }

  return { trustPenalty, sentimentPenalty, summary };
}

// ─── Favor Breaking ────────────────────────────────────────────────────────

export interface FavorBreakingResult {
  trustPenalty: number;
  sentimentPenalty: number;
  summary: string;
}

/**
 * Apply consequences when a debtor breaks a favor (refuses when called).
 *
 * - Creditor → debtor: trust penalty + sentiment penalty
 * - Marks favor as broken on the graph edge
 *
 * @param favorEdgeId  The `owes_favor` edge ID
 * @param favor        The favor edge properties
 * @param debtorId     The agent who broke the favor
 * @param creditorId   The agent who was owed the favor
 * @param tick         Current game tick
 * @param graph        World graph (mutated in place)
 */
export function applyFavorBreakingConsequences(
  favorEdgeId: string,
  favor: OwesFavorEdgeProperties,
  debtorId: string,
  creditorId: string,
  tick: number,
  graph: WorldGraph,
): FavorBreakingResult {
  // Mark favor as broken
  try {
    const edge = graph.getEdge(favorEdgeId);
    if (edge) {
      graph.updateEdge(favorEdgeId, {
        properties: {
          ...edge.properties,
          broken: true,
          brokenTick: tick,
        },
      });
    }
  } catch {
    // fail-soft
  }

  // Creditor → debtor: trust + sentiment penalty
  applyTrustDelta(graph, creditorId, debtorId, FAVOR_BREAKING_TRUST_PENALTY);
  applySentimentDelta(graph, creditorId, debtorId, FAVOR_BREAKING_SENTIMENT_PENALTY);

  const summary = `${debtorId} broke favor to ${creditorId} (context: ${favor.context}). Trust/sentiment penalties applied.`;

  try {
    emitTrace({
      tick,
      category: 'favor_broken',
      event: 'favor_broken',
      debtorId,
      creditorId,
      magnitude: favor.magnitude,
      context: favor.context,
      trustPenalty: FAVOR_BREAKING_TRUST_PENALTY,
      sentimentPenalty: FAVOR_BREAKING_SENTIMENT_PENALTY,
      summary,
    });
  } catch {
    // trace failure must never block consequences
  }

  return {
    trustPenalty: FAVOR_BREAKING_TRUST_PENALTY,
    sentimentPenalty: FAVOR_BREAKING_SENTIMENT_PENALTY,
    summary,
  };
}

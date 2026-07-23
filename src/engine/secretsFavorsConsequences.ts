/**
 * Secrets & Favors — Consequence Functions (THR-30)
 *
 * Applies trust, sentiment, and chronicle consequences when secrets are revealed
 * or favors are broken. Called from encounter aftermath and divine action handlers.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * Missing edges → zero effect, no crash.
 */

import type { WorldGraph } from './graph';
import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import type { KnowsSecretOfEdgeProperties, OwesFavorEdgeProperties } from '../types/secretsFavors';
import {
  SECRET_REVELATION_TRUST_PENALTY,
  SECRET_CONFESSION_BETRAYAL_PENALTY,
  SECRET_EXPOSURE_SENTIMENT_PENALTY,
  FAVOR_BREAKING_TRUST_PENALTY,
  FAVOR_BREAKING_SENTIMENT_PENALTY,
  secretTypeProse,
} from '../types/secretsFavors';
import { emitTrace } from './traceBuffer';
import { pickSecretSubject } from './secretGeneration';
import { mulberry32 } from '../lib/prng';

// ─── Helpers ───────────────────────────────────────────────────────────────

function clampSentiment(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function clampTrust(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function applyRelatesEdgeDelta(
  graph: WorldGraph,
  fromId: string,
  toId: string,
  trustDelta: number,
  sentimentDelta: number,
): void {
  const edges = graph.getOutgoingEdges(fromId, 'relates_to')
    .filter(e => e.target === toId);
  if (edges.length === 0) return;
  const edge = edges[0];
  const oldTrust = (edge.properties.trust as number) ?? 0;
  const oldSentiment = (edge.properties.sentiment as number) ?? 0;
  graph.updateEdge(edge.id, {
    properties: {
      ...edge.properties,
      trust: clampTrust(oldTrust + trustDelta),
      sentiment: clampSentiment(oldSentiment + sentimentDelta),
    },
  });
}

// ─── Secret Revelation Consequences ───────────────────────────────────────

/**
 * Apply trust, sentiment, and chronicle consequences when an agent reveals a secret.
 *
 * @param secret        The secret edge properties being revealed
 * @param edgeId        The knows_secret_of edge ID (to mark as revealed)
 * @param revealerId    Agent who holds and reveals the secret
 * @param subjectId     Agent the secret is about
 * @param revealedToId  Agent the secret is revealed to
 * @param state         Current game state (used for chronicle events + tick)
 * @returns Partial<GameState> patch with any chronicle events
 */
export function applySecretRevelationConsequences(
  secret: KnowsSecretOfEdgeProperties,
  edgeId: string,
  revealerId: string,
  subjectId: string,
  revealedToId: string,
  state: GameState,
): Partial<GameState> {
  const { graph, tick } = state;

  // Mark secret as revealed
  const secretEdges = graph.getOutgoingEdges(revealerId, 'knows_secret_of')
    .filter(e => e.id === edgeId);
  if (secretEdges.length > 0) {
    graph.updateEdge(edgeId, {
      properties: {
        ...secretEdges[0].properties,
        revealed: true,
        revealedTick: tick,
        revealedTo: revealedToId,
      },
    });
  }

  // Trust penalty: subject → revealer. A confessed secret betrayed is the worse
  // wound — the betrayal penalty *stacks on* the base revelation penalty rather
  // than replacing it (migrated from the retired secretsConsequences.ts fork,
  // THR-724; the replacement form made confession the *milder* case at the
  // shipped constants, which inverts the intent).
  const isConfessionBetrayal = secret.source === 'confession';
  const trustPenalty = isConfessionBetrayal
    ? SECRET_REVELATION_TRUST_PENALTY + SECRET_CONFESSION_BETRAYAL_PENALTY
    : SECRET_REVELATION_TRUST_PENALTY;
  applyRelatesEdgeDelta(graph, subjectId, revealerId, trustPenalty, 0);

  // Subject → revealed-to: the subject resents the person who now knows.
  // (Also migrated from the retired fork — the surviving module only moved
  // sentiment in the revealed-to → subject direction.)
  applyRelatesEdgeDelta(graph, subjectId, revealedToId, 0, SECRET_EXPOSURE_SENTIMENT_PENALTY);

  // Sentiment: revealed-to → subject (varies by secret type)
  const revealedToSentimentDelta = secret.magnitude * -0.2;
  applyRelatesEdgeDelta(graph, revealedToId, subjectId, 0, revealedToSentimentDelta);

  emitTrace({
    tick,
    category: 'secret_revealed',
    agentId: revealerId,
    summary: `Secret revealed: ${secret.secretType} (mag ${secret.magnitude.toFixed(2)}, source ${secret.source}) about ${subjectId} → revealed to ${revealedToId} by ${revealerId}${isConfessionBetrayal ? ' [confession betrayed]' : ''} (trust penalty ${trustPenalty.toFixed(2)})`,
  });

  // Chronicle event
  const subjectNode = graph.getNode(subjectId);
  const subjectName = subjectNode?.name ?? subjectId;
  const typeProse = secretTypeProse(secret.secretType);

  const event: TickEvent = {
    id: `secret_revealed_${revealerId}_${subjectId}_${tick}`,
    tick,
    type: 'ripple_consequence',
    message: `The truth about ${subjectName}'s ${typeProse} has come to light.`,
    significance: 0.55,
    actorId: revealerId,
  };

  const nextEvents = [...state.tickEvents, event];
  const nextRecent = [...state.recentEvents, event].slice(-MAX_RECENT_EVENTS);

  return { tickEvents: nextEvents, recentEvents: nextRecent };
}

/**
 * Reveal the heaviest unrevealed secret `revealerId` holds about `subjectId`, and
 * apply its consequences (THR-724).
 *
 * The `reveal_secret` graph op flipped the edge's `revealed` flag and stopped there,
 * so the player's Divine Whisper marked a truth as told without anyone reacting to
 * it. This is the state-aware wrapper the resolution path calls instead: same edge
 * selection, then the real social fallout.
 *
 * @param revealedToId  Explicit audience; defaults to a co-located third party, and
 *                      when the revealer stands alone the subject hears it directly.
 * @returns the chronicle patch, or `{}` when there is no secret to tell (fail-soft)
 */
export function revealBestSecret(
  state: GameState,
  revealerId: string,
  subjectId: string,
  revealedToId?: string,
): Partial<GameState> {
  const { graph } = state;
  const candidates = graph.getOutgoingEdges(revealerId, 'knows_secret_of')
    .filter(e => e.target === subjectId && !(e.properties.revealed as boolean));
  if (candidates.length === 0) return {};

  const best = candidates.reduce((a, b) =>
    ((b.properties.magnitude as number) ?? 0) > ((a.properties.magnitude as number) ?? 0) ? b : a,
  );

  const audienceRng = mulberry32((state.seed ^ state.tick * 101) >>> 0);
  const audienceId = revealedToId
    ?? pickSecretSubject(revealerId, graph, audienceRng)
    ?? subjectId;

  return applySecretRevelationConsequences(
    best.properties as unknown as KnowsSecretOfEdgeProperties,
    best.id,
    revealerId,
    subjectId,
    audienceId,
    state,
  );
}

// ─── Favor Breaking Consequences ──────────────────────────────────────────

/**
 * Apply trust, sentiment, and chronicle consequences when a favor is broken.
 *
 * @param favor       The owes_favor edge properties
 * @param edgeId      The owes_favor edge ID (to mark as broken)
 * @param debtorId    Agent who refused to honor the favor
 * @param creditorId  Agent who was owed the favor
 * @param state       Current game state
 * @returns Partial<GameState> patch with chronicle events
 */
export function applyFavorBreakingConsequences(
  favor: OwesFavorEdgeProperties,
  edgeId: string,
  debtorId: string,
  creditorId: string,
  state: GameState,
): Partial<GameState> {
  const { graph, tick } = state;

  // Mark favor as broken
  const favorEdges = graph.getOutgoingEdges(debtorId, 'owes_favor')
    .filter(e => e.id === edgeId);
  if (favorEdges.length > 0) {
    graph.updateEdge(edgeId, {
      properties: {
        ...favorEdges[0].properties,
        broken: true,
        brokenTick: tick,
      },
    });
  }

  // Trust + sentiment: creditor → debtor
  applyRelatesEdgeDelta(
    graph, creditorId, debtorId,
    FAVOR_BREAKING_TRUST_PENALTY,
    FAVOR_BREAKING_SENTIMENT_PENALTY,
  );

  emitTrace({
    tick,
    category: 'favor_broken',
    agentId: debtorId,
    summary: `Favor broken: ${debtorId} refused ${creditorId}'s debt (magnitude ${favor.magnitude.toFixed(2)}, context: ${favor.context})`,
  });

  const debtorNode = graph.getNode(debtorId);
  const creditorNode = graph.getNode(creditorId);
  const debtorName = debtorNode?.name ?? debtorId;
  const creditorName = creditorNode?.name ?? creditorId;

  const event: TickEvent = {
    id: `favor_broken_${debtorId}_${creditorId}_${tick}`,
    tick,
    type: 'ripple_consequence',
    message: `${debtorName} refused to honor their debt to ${creditorName}. Trust between them has shattered.`,
    significance: 0.60,
    actorId: creditorId,
  };

  const nextEvents = [...state.tickEvents, event];
  const nextRecent = [...state.recentEvents, event].slice(-MAX_RECENT_EVENTS);

  return { tickEvents: nextEvents, recentEvents: nextRecent };
}

// ─── Favor Redemption Consequences ────────────────────────────────────────

/**
 * Mark a favor as redeemed (called when a favor is successfully paid).
 */
export function applyFavorRedemptionConsequences(
  edgeId: string,
  debtorId: string,
  creditorId: string,
  graph: WorldGraph,
  tick: number,
): void {
  const favorEdges = graph.getOutgoingEdges(debtorId, 'owes_favor')
    .filter(e => e.id === edgeId);
  if (favorEdges.length === 0) return;

  graph.updateEdge(edgeId, {
    properties: {
      ...favorEdges[0].properties,
      redeemed: true,
      redeemedTick: tick,
    },
  });

  emitTrace({
    tick,
    category: 'favor_redeemed',
    agentId: debtorId,
    summary: `Favor redeemed: ${debtorId} honored their debt to ${creditorId}`,
  });
}

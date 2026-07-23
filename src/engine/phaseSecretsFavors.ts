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
import type { KnowsSecretOfEdgeProperties } from '../types/secretsFavors';
import {
  SECRET_DECAY_THRESHOLD,
  SECRET_MAX_AGE_TICKS,
  SECRET_FAVOR_CHECK_INTERVAL,
  FAVOR_TENSION_THRESHOLD_TICKS,
  FAVOR_TENSION_SENTIMENT_DELTA,
  FAVOR_MAX_AGE_TICKS,
  SECRET_REVEAL_MIN_MAGNITUDE,
  SECRET_REVEAL_MIN_AGE_TICKS,
  SECRET_REVEAL_CHANCE,
  SECRET_REVEAL_MAX_SENTIMENT,
  MAX_AUTONOMOUS_REVELATIONS_PER_CHECK,
} from '../types/secretsFavors';
import { emitTrace } from './traceBuffer';
import { applySecretRevelationConsequences } from './secretsFavorsConsequences';
import { pickSecretSubject } from './secretGeneration';
import { mulberry32 } from '../lib/prng';

export function phaseSecretsFavors(state: GameState): Partial<GameState> {
  const { graph, tick } = state;

  // Only run every SECRET_FAVOR_CHECK_INTERVAL ticks
  if (tick % SECRET_FAVOR_CHECK_INTERVAL !== 0) return {};

  // Revelation runs BEFORE decay so a secret cannot fade in the same pass that
  // would have told it, and it is the only sub-pass that returns state (chronicle
  // events), so it is applied to the returned patch.
  let patch: Partial<GameState> = {};
  try {
    patch = processAutonomousRevelations(state);
  } catch {
    // fail-soft
  }

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

  return patch;
}

// ─── Autonomous Revelation (THR-724) ──────────────────────────────────────

/**
 * Mortals tell on each other.
 *
 * `applySecretRevelationConsequences` had zero production callers — a secret could
 * be born and then sat on forever, so the whole dark economy was write-only. This
 * is that caller: every check interval, a held secret that is heavy enough, old
 * enough, and pointed at someone the holder does not much like may be told to a
 * third party standing nearby.
 *
 * ─── Determinism ──────────────────────────────────────────────────
 * One seeded stream per (worldSeed, tick), consumed in stable edge order.
 *
 * ─── Fail-soft ────────────────────────────────────────────────────
 * A revelation with no audience, no subject node, or no relates_to edge simply
 * does not happen; the caller swallows anything thrown.
 */
function processAutonomousRevelations(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const rng = mulberry32((state.seed ^ tick * 97) >>> 0);

  let working = state;
  let revealed = 0;
  let events = 0;

  for (const edge of graph.getEdgesByType('knows_secret_of')) {
    if (revealed >= MAX_AUTONOMOUS_REVELATIONS_PER_CHECK) break;

    const props = edge.properties as unknown as KnowsSecretOfEdgeProperties;
    if (props.revealed) continue;
    if ((props.magnitude ?? 0) < SECRET_REVEAL_MIN_MAGNITUDE) continue;
    if (tick - (props.discoveredTick ?? 0) < SECRET_REVEAL_MIN_AGE_TICKS) continue;

    const holderId = edge.source;
    const subjectId = edge.target;

    // Holders keep the secrets of people they are fond of.
    const relates = graph.getOutgoingEdges(holderId, 'relates_to')
      .filter(e => e.target === subjectId)[0];
    const sentiment = (relates?.properties.sentiment as number) ?? 0;
    if (sentiment > SECRET_REVEAL_MAX_SENTIMENT) continue;

    if (rng() > SECRET_REVEAL_CHANCE) continue;

    // The audience is whoever is standing with the holder — and never the subject.
    const audienceId = pickSecretSubject(holderId, graph, rng);
    if (!audienceId || audienceId === subjectId) continue;

    const patch = applySecretRevelationConsequences(
      props, edge.id, holderId, subjectId, audienceId, working,
    );
    working = { ...working, ...patch };
    revealed++;
    events = (patch.tickEvents?.length ?? events);
  }

  if (revealed === 0) return {};

  emitTrace({
    tick,
    category: 'secret_revealed',
    summary: `Autonomous revelation pass: ${revealed} secret(s) told (${events} chronicle events)`,
  });

  return { tickEvents: working.tickEvents, recentEvents: working.recentEvents };
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

/**
 * Relationship Resolver — reads the `relates_to` edge between two actors.
 *
 * The cast tile's "to her: ..." line reads relationship data from this resolver.
 * A relationship is the `relates_to` edge (the Standing kind, THR-1394); the reified
 * `relationship` node this once read first was never minted and retired in THR-1394
 * slice 2, so the edge is the one shape.
 *
 * Design plan: Docs/plans/2026-05-04-encounter-experience-design-plan.md §3.9
 * THR-327 (Phase B5)
 */

import type { WorldGraph } from '../graph';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Result type for relationship lookups.
 * `source` indicates whether data came from a relationship node or a relates_to edge fallback.
 */
export type RelationshipResult =
  | { source: 'edge_sentiment'; arc: 'improving' | 'stable' | 'fraying' | 'severed'; sentiment: number }
  | { source: 'none' };

/**
 * Get relationship data between two actors.
 *
 * Priority:
 *   1. `relates_to` edge between the actors (either direction) — maps sentiment to an arc label.
 *   2. `{ source: 'none' }` when no relationship data exists.
 */
export function getRelationship(
  graph: WorldGraph,
  actorIdA: string,
  actorIdB: string,
): RelationshipResult {
  // 1. The relates_to edge, outgoing first
  const outgoing = graph.getOutgoingEdges(actorIdA, 'relates_to');
  for (const edge of outgoing) {
    if (edge.target !== actorIdB) continue;
    const sentiment = (edge.properties.sentiment as number | undefined) ?? 0;
    return {
      source: 'edge_sentiment',
      arc: sentimentToArc(sentiment),
      sentiment,
    };
  }

  // Check the reverse direction too (relates_to can be directional)
  const incoming = graph.getIncomingEdges(actorIdA, 'relates_to');
  for (const edge of incoming) {
    if (edge.source !== actorIdB) continue;
    const sentiment = (edge.properties.sentiment as number | undefined) ?? 0;
    return {
      source: 'edge_sentiment',
      arc: sentimentToArc(sentiment),
      sentiment,
    };
  }

  return { source: 'none' };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SENTIMENT_FRAYING_THRESHOLD = -0.3;
const SENTIMENT_IMPROVING_THRESHOLD = 0.3;

function sentimentToArc(
  sentiment: number,
): 'improving' | 'stable' | 'fraying' | 'severed' {
  if (sentiment <= -1.0) return 'severed';
  if (sentiment < SENTIMENT_FRAYING_THRESHOLD) return 'fraying';
  if (sentiment > SENTIMENT_IMPROVING_THRESHOLD) return 'improving';
  return 'stable';
}

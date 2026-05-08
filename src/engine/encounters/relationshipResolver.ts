/**
 * Relationship Resolver — reads reified relationship nodes or falls back to edge sentiment.
 *
 * The cast tile's "to her: ..." line reads relationship data from this resolver.
 * When a `relationship` node exists for the actor pair, returns its typed properties.
 * When no node exists, falls back to the `relates_to` edge sentiment between the actors.
 *
 * Design plan: Docs/plans/2026-05-04-encounter-experience-design-plan.md §3.9
 * THR-327 (Phase B5)
 *
 * Mutation note: callers that create or update relationship nodes must call
 * touchWorld(runtime) after the mutation per CLAUDE.md graph mutation discipline.
 */

import type { WorldGraph } from '../graph';
import type { RelationshipNodeProperties } from '../../types/graph';

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Result type for relationship lookups.
 * `source` indicates whether data came from a relationship node or a relates_to edge fallback.
 */
export type RelationshipResult =
  | { source: 'node'; data: RelationshipNodeProperties }
  | { source: 'edge_sentiment'; arc: 'improving' | 'stable' | 'fraying' | 'severed'; sentiment: number }
  | { source: 'none' };

/**
 * Get relationship data between two actors.
 *
 * Priority:
 *   1. `relationship` node where participants includes both actorIdA and actorIdB.
 *   2. `relates_to` edge between the actors — maps sentiment to an arc label.
 *   3. `{ source: 'none' }` when no relationship data exists.
 *
 * Actor order in `participants` is not significant — both orderings are checked.
 */
export function getRelationship(
  graph: WorldGraph,
  actorIdA: string,
  actorIdB: string,
): RelationshipResult {
  // 1. Check for a relationship node covering this pair
  const relationshipNodes = graph.getNodesByType('relationship');
  for (const node of relationshipNodes) {
    const participants = node.properties.participants as [string, string] | undefined;
    if (!participants || participants.length !== 2) continue;
    if (
      (participants[0] === actorIdA && participants[1] === actorIdB) ||
      (participants[0] === actorIdB && participants[1] === actorIdA)
    ) {
      return {
        source: 'node',
        data: node.properties as unknown as RelationshipNodeProperties,
      };
    }
  }

  // 2. Fall back to relates_to edge sentiment
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

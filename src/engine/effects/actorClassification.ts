/**
 * Actor co-location classification for alone/outnumbered predicates.
 *
 * Pure, graph-only, fail-soft. No RNG, no state mutation, no resolver calls.
 */

import type { WorldGraph } from '../graph';
import {
  ALLY_SENTIMENT_THRESHOLD,
  ENEMY_SENTIMENT_THRESHOLD,
} from '../../data/effect-constants';

export type ActorAlignment = 'ally' | 'enemy' | 'neutral';

/**
 * Classify `otherId` relative to `selfId` for the purposes of alone/outnumbered
 * and future alignment-based predicates. Pure, graph-only, fail-soft.
 *
 * Resolution order (first match wins):
 *   1. Direct actor-to-actor `relates_to` edge (either direction). Sentiment
 *      ≥ ALLY_SENTIMENT_THRESHOLD → ally. ≤ ENEMY_SENTIMENT_THRESHOLD → enemy.
 *   2. Shared `factionId` on actor node properties → ally.
 *   3. Faction-to-faction `relates_to` edge between the two factions (either
 *      direction). Same sentiment bands.
 *   4. Otherwise → neutral.
 */
export function classifyCoLocatedActor(
  graph: WorldGraph,
  selfId: string,
  otherId: string,
): ActorAlignment {
  // Step 1: Direct actor-to-actor relates_to (either direction)
  const directSentiment = getSentimentBetween(graph, selfId, otherId);
  if (directSentiment !== null) {
    if (directSentiment >= ALLY_SENTIMENT_THRESHOLD) return 'ally';
    if (directSentiment <= ENEMY_SENTIMENT_THRESHOLD) return 'enemy';
  }

  // Step 2: Shared factionId → ally
  const selfNode = graph.getNode(selfId);
  const otherNode = graph.getNode(otherId);
  const selfFaction = selfNode?.properties.factionId as string | undefined;
  const otherFaction = otherNode?.properties.factionId as string | undefined;

  if (selfFaction && otherFaction && selfFaction === otherFaction) {
    return 'ally';
  }

  // Step 3: Faction-to-faction relates_to (only when factions differ)
  if (selfFaction && otherFaction && selfFaction !== otherFaction) {
    const factionSentiment = getSentimentBetween(graph, selfFaction, otherFaction);
    if (factionSentiment !== null) {
      if (factionSentiment >= ALLY_SENTIMENT_THRESHOLD) return 'ally';
      if (factionSentiment <= ENEMY_SENTIMENT_THRESHOLD) return 'enemy';
    }
  }

  return 'neutral';
}

/**
 * Return the first sentiment value found on a relates_to edge between a and b.
 * Checks outgoing a→b first, then incoming b→a. Returns null if no edge exists
 * or if the found edge has no sentiment property.
 */
function getSentimentBetween(graph: WorldGraph, a: string, b: string): number | null {
  for (const edge of graph.getOutgoingEdges(a, 'relates_to')) {
    if (edge.target === b) {
      const s = edge.properties.sentiment;
      return typeof s === 'number' ? s : null;
    }
  }
  for (const edge of graph.getIncomingEdges(a, 'relates_to')) {
    if (edge.source === b) {
      const s = edge.properties.sentiment;
      return typeof s === 'number' ? s : null;
    }
  }
  return null;
}

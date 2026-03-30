/**
 * Cultural Insight Engine — Knowledge Fog of War for cultures.
 *
 * Tracks how much the player knows about each culture.
 * Parallel system to familiarity engine but with culture-specific gain sources.
 */

import type { KnowledgeLevel } from '../types/familiarity';
import { FAMILIARITY_THRESHOLDS, KNOWLEDGE_LEVELS } from '../types/familiarity';

// Re-use the same threshold table as agent familiarity (same 5-tier scale).
// culturalInsightMap uses the exact same 0.0-1.0 range.

/** Cultural insight gain amounts per source. */
export const CULTURAL_INSIGHT_GAINS = {
  /** Per visible hex in a culture's territory */
  territory_visit: 0.02,
  /** Multiplier × aggregate belongs_to agent familiarities */
  member_familiarity_factor: 0.1,
  /** Per scry action targeting a culture member */
  scry_on_member: 0.15,
  /** Per divine intervention in a culture's territory */
  intervention_in_territory: 0.10,
  /** Per tick per worshipper who belongs to the culture */
  worshipper_per_tick: 0.05,
} as const;

/** Get cultural insight score for a culture. Returns 0 if unknown. */
export function getCulturalInsight(
  map: Map<string, number>,
  cultureId: string,
): number {
  return map.get(cultureId) ?? 0;
}

/** Add cultural insight. Returns new map (immutable). */
export function addCulturalInsight(
  map: Map<string, number>,
  cultureId: string,
  amount: number,
): Map<string, number> {
  const current = map.get(cultureId) ?? 0;
  const newVal = Math.min(1.0, current + amount);
  const newMap = new Map(map);
  newMap.set(cultureId, newVal);
  return newMap;
}

/** Derive knowledge level from cultural insight score. */
export function getCulturalKnowledgeLevel(insight: number): KnowledgeLevel {
  for (let i = KNOWLEDGE_LEVELS.length - 1; i >= 0; i--) {
    if (insight >= FAMILIARITY_THRESHOLDS[KNOWLEDGE_LEVELS[i]]) {
      return KNOWLEDGE_LEVELS[i];
    }
  }
  return 'stranger';
}

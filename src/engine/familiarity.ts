/**
 * Familiarity Engine — Knowledge Fog of War.
 *
 * Tracks how much the player knows about each game object.
 * Pure functions operating on FamiliarityMap (immutable updates).
 */

import {
  KNOWLEDGE_LEVELS,
  FAMILIARITY_THRESHOLDS,
  type KnowledgeLevel,
  type FamiliarityMap,
} from '../types/familiarity';

/** Get familiarity score for an object. Returns 0 if unknown. */
export function getFamiliarity(map: FamiliarityMap, objectId: string): number {
  return map.get(objectId) ?? 0;
}

/**
 * Add familiarity for an object. Returns new map (immutable).
 * @param multiplier Optional sphere multiplier (Eye = 1.5x)
 */
export function addFamiliarity(
  map: FamiliarityMap,
  objectId: string,
  amount: number,
  multiplier: number = 1.0,
): FamiliarityMap {
  const current = map.get(objectId) ?? 0;
  const newVal = Math.min(1.0, current + amount * multiplier);
  const newMap = new Map(map);
  newMap.set(objectId, newVal);
  return newMap;
}

/** Derive knowledge level from familiarity score. */
export function getKnowledgeLevel(familiarity: number): KnowledgeLevel {
  for (let i = KNOWLEDGE_LEVELS.length - 1; i >= 0; i--) {
    if (familiarity >= FAMILIARITY_THRESHOLDS[KNOWLEDGE_LEVELS[i]]) {
      return KNOWLEDGE_LEVELS[i];
    }
  }
  return 'stranger';
}

/**
 * Check if a familiarity change crossed a threshold.
 * Returns the new knowledge level if crossed, null if not.
 */
export function checkThresholdCrossed(
  oldFamiliarity: number,
  newFamiliarity: number,
): KnowledgeLevel | null {
  const oldLevel = getKnowledgeLevel(oldFamiliarity);
  const newLevel = getKnowledgeLevel(newFamiliarity);
  if (oldLevel !== newLevel) return newLevel;
  return null;
}

/**
 * Get effective knowledge level considering sphere bonuses.
 * Sphere bonuses affect specific content categories (traits, bonds),
 * not the overall knowledge level.
 */
export function getEffectiveKnowledgeLevel(
  baseLevel: KnowledgeLevel,
  _primarySphere: string | undefined,
): KnowledgeLevel {
  return baseLevel;
}

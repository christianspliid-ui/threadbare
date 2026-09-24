/**
 * `FIGHT_ENCOUNTER_TEMPLATES` — the standalone fight templates that are not a
 * monster's (THR-1556, duels plan doc § Blast Radius).
 *
 * Spread into `UNIFIED_ACTION_TEMPLATES` and searched by `getAnyEncounterById`, so
 * a duel is archived as a chapter (`isEncounterAction`) and counted as an
 * `encounter_resolved`. **Not** `SOCIAL_ENCOUNTER_TEMPLATES`: `getAnyEncounterById`
 * reaches social templates only through `getSocialEncounterById`, which searches
 * the scene list, so a duel registered there would never be found.
 *
 * Every entry is spawn-only: no `locationSubtypes`, never cache-registered.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { FIGHT_DUEL_GRUDGE } from '../encounters/fight-duel-grudge';

export const FIGHT_ENCOUNTER_TEMPLATES: readonly UnifiedActionTemplate[] = [
  FIGHT_DUEL_GRUDGE,
];

export function getFightEncounterById(id: string): UnifiedActionTemplate | undefined {
  return FIGHT_ENCOUNTER_TEMPLATES.find((t) => t.id === id);
}

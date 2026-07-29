/**
 * Combined faction-definition lookup — regular + monster definitions in one map.
 *
 * Extracted from `HexMapV2/scene/ArmyLayer.ts` (THR-638), which built this map
 * privately. A second consumer arrived with the faction sigil registry
 * (`faction-sigil-assets.ts`), and two independently-built lookups drift the
 * moment a new definition family is added — a faction would render heraldry on
 * the hex map and a blank glyph in its detail modal, or vice versa. One map,
 * one import.
 *
 * NFP #3 (determinism): built once at module eval from static definition
 * tables; no PRNG, no ordering dependence beyond "monster definitions win a
 * key collision", which matches the prior ArmyLayer behaviour exactly.
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_DEFINITIONS } from './faction-definitions';
import { MONSTER_FACTION_DEFINITIONS } from './monster-faction-definitions';

/** Every faction definition (regular + monster), keyed by definition ID. */
export const ALL_FACTION_DEFINITIONS: ReadonlyMap<string, FactionDefinition> = (() => {
  const map = new Map<string, FactionDefinition>(FACTION_DEFINITIONS);
  for (const def of MONSTER_FACTION_DEFINITIONS) map.set(def.id, def);
  return map;
})();

/**
 * Look up a faction definition by its definition ID.
 *
 * NFP #4 (fail-soft): an unknown id returns null rather than throwing — callers
 * render a fallback.
 */
export function getFactionDefinition(
  factionDefId: string | null | undefined,
): FactionDefinition | null {
  if (!factionDefId) return null;
  return ALL_FACTION_DEFINITIONS.get(factionDefId) ?? null;
}

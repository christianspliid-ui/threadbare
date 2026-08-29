/**
 * Combined faction-definition lookup — regular + monster + run-founded, one map.
 *
 * Extracted from `HexMapV2/scene/ArmyLayer.ts` (THR-638), which built this map
 * privately. A second consumer arrived with the faction sigil registry
 * (`faction-sigil-assets.ts`), and two independently-built lookups drift the
 * moment a new definition family is added — a faction would render heraldry on
 * the hex map and a blank glyph in its detail modal, or vice versa. One map,
 * one import.
 *
 * ─── The run-founded overlay (THR-1322) ──────────────────────────────────────
 *
 * `strategic_found_order` charters real factions mid-run and records their
 * definitions in `GameState.dynamicFactionDefinitions` (THR-1309). Every reader
 * in this file's consumer set resolves a definition **from an id with no other
 * context** — `Tooltip` calls `resolveTooltip('faction.<id>')` on its own,
 * `getFactionSigilUrl` is a pure id→URI function, and `ArmyLayer` enumerates the
 * roster inside a Three.js scene build. None of them can be handed a
 * `GameState`, so a parameter alone cannot close the gap: it would reach
 * `FactionSheet` and leave the hex map and every tooltip resolving a founded
 * order to `null`, which renders as a nameless, heraldry-less fallback rather
 * than as an error.
 *
 * So the run's definitions are mirrored here as an overlay, and the map stays
 * the single lookup for both context-free and context-carrying callers.
 *
 * **The overlay is a projection of `GameState`, never an authority.** It is
 * written only where the state field is written (`foundFaction`), rolled back
 * where that write rolls back, republished wholesale at game init
 * (`publishDynamicFactionDefinitions`), and cleared at the session boundary by
 * `resetDecisionCache()` — the same treatment `clearTimelines()` and
 * `clearRewardHistory()` already get. That is what keeps a module-scope store
 * off the wrong side of the "caches are session-owned, never module-global"
 * rule: nothing is *derived* here that state does not already hold, so
 * republishing from state is always a correct repair.
 *
 * NFP #3 (determinism): the static half is built once at module eval from the
 * static definition tables; no PRNG, no ordering dependence beyond "monster
 * definitions win a key collision", which matches the prior ArmyLayer behaviour
 * exactly. The overlay is keyed by the deterministic `founded_<actor>_<tick>`
 * id, and static ids always win a collision so a run can never shadow authored
 * content.
 */

import type { FactionDefinition } from '../types/faction';
import { FACTION_DEFINITIONS } from './faction-definitions';
import { MONSTER_FACTION_DEFINITIONS } from './monster-faction-definitions';

/**
 * Every *authored* faction definition (regular + monster), keyed by definition ID.
 *
 * Deliberately immutable and static: consumers that enumerate the authored
 * roster — the content-eval chip-anchor declarations, the sigil-asset coverage
 * tests — are asking what the game ships with, not what one run happens to have
 * chartered. Run-founded definitions live in the overlay below; use
 * {@link getFactionDefinitionRoster} to enumerate both.
 */
export const ALL_FACTION_DEFINITIONS: ReadonlyMap<string, FactionDefinition> = (() => {
  const map = new Map<string, FactionDefinition>(FACTION_DEFINITIONS);
  for (const def of MONSTER_FACTION_DEFINITIONS) map.set(def.id, def);
  return map;
})();

/**
 * Run-founded definitions mirrored from `GameState.dynamicFactionDefinitions`.
 * Empty in every world that has chartered nothing, which is every world at tick 0.
 */
const dynamicDefinitions = new Map<string, FactionDefinition>();

/** Mirror one run-founded definition. Called where the state field is written. */
export function registerDynamicFactionDefinition(definition: FactionDefinition): void {
  dynamicDefinitions.set(definition.id, definition);
}

/**
 * Drop one run-founded definition. Called where the state write rolls back — a
 * hall-less charter leaves no entry in state, so it must leave none here either.
 */
export function unregisterDynamicFactionDefinition(factionDefId: string): void {
  dynamicDefinitions.delete(factionDefId);
}

/**
 * Replace the overlay with `defs` wholesale — the repair operation.
 *
 * Called at game init so the overlay is a projection of the state that exists
 * at that moment: a fresh world publishes nothing (clearing any previous run's
 * entries), and a state that already carries founded definitions publishes them
 * all without needing to have observed the mints.
 */
export function publishDynamicFactionDefinitions(
  defs: Record<string, FactionDefinition> | undefined,
): void {
  dynamicDefinitions.clear();
  if (!defs) return;
  for (const def of Object.values(defs)) dynamicDefinitions.set(def.id, def);
}

/** Clear the overlay. Session boundary only — see `resetDecisionCache()`. */
export function clearDynamicFactionDefinitions(): void {
  dynamicDefinitions.clear();
}

/** How many run-founded definitions the overlay currently mirrors. */
export function dynamicFactionDefinitionCount(): number {
  return dynamicDefinitions.size;
}

/**
 * Look up a faction definition by its definition ID.
 *
 * Resolution order: an explicitly-passed runtime map (a caller that *does* hold
 * `GameState` should pass `state.dynamicFactionDefinitions` and not depend on
 * the mirror), then the run-founded overlay, then the authored tables.
 *
 * NFP #4 (fail-soft): an unknown id returns null rather than throwing — callers
 * render a fallback.
 */
export function getFactionDefinition(
  factionDefId: string | null | undefined,
  dynamicDefs?: Record<string, FactionDefinition>,
): FactionDefinition | null {
  if (!factionDefId) return null;
  return (
    dynamicDefs?.[factionDefId] ??
    ALL_FACTION_DEFINITIONS.get(factionDefId) ??
    dynamicDefinitions.get(factionDefId) ??
    null
  );
}

/**
 * Every definition a *live run* can resolve — authored plus run-founded.
 *
 * For consumers that enumerate rather than look up (the hex map's coat-of-arms
 * texture pre-warm). Authored definitions win a key collision, matching
 * {@link getFactionDefinition}.
 */
export function getFactionDefinitionRoster(): ReadonlyMap<string, FactionDefinition> {
  if (dynamicDefinitions.size === 0) return ALL_FACTION_DEFINITIONS;
  const map = new Map<string, FactionDefinition>(dynamicDefinitions);
  for (const [id, def] of ALL_FACTION_DEFINITIONS) map.set(id, def);
  return map;
}

/**
 * The holder's natural building — which building a settlement leans toward because of who
 * holds it (THR-1923, `LEAN_BONUS`).
 *
 * The faction purse (THR-1931) landed first, so a guild's lean reads its natural-places
 * table (`GUILD_PLACE_AFFINITY`): the first of the guild type's Place types that a building
 * raises or adopts is its lean. Every other faction leans by its class. One entry per
 * class (UI Law 58).
 *
 * Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md § Data tables.
 */
import type { FactionClass } from './realm-content';
import { GUILD_PLACE_AFFINITY } from './faction-purse-constants';
import { buildingForPlaceType } from './settlement-buildings';

/** Faction class → its natural building id. A class with no lean is absent. */
export const FACTION_CLASS_BUILDING_LEAN: Readonly<Partial<Record<FactionClass, string>>> = {
  realm: 'walls',
  order: 'walls',
  cult: 'shrine',
  guild: 'workshop',
  founded: 'market',
};

/**
 * A guild type's lean where its natural Places name no building: what it works with
 * instead (a miners' guild leans to the mason's yard, builders to walls).
 */
export const GUILD_TYPE_BUILDING_LEAN_FALLBACK: Readonly<Record<string, string>> = {
  miners: 'stoneworks',
  builders: 'walls',
  thieves: 'market',
};

/** The building a guild of this type leans toward, or undefined. */
export function guildTypeBuildingLean(guildType: string): string | undefined {
  const row = GUILD_PLACE_AFFINITY[guildType];
  if (row) {
    for (const t of row.sublocationTypes) {
      const b = buildingForPlaceType(`sublocation-type.${t}`);
      if (b) return b.id;
    }
  }
  return GUILD_TYPE_BUILDING_LEAN_FALLBACK[guildType];
}

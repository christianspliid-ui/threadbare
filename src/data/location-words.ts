/**
 * Location words (THR-1023) — the player-facing name for a `locationSubtype`.
 *
 * The subtype stored on a location node is an internal key (`unexplored_poi`,
 * `master_forge`, `ruined_tower`). UI Law 14 bars an internal key from reaching
 * the player, so any surface that wants to say what a place *is* reads it
 * through here. Mirrors `POSSESSION_SUBCATEGORY_NAMES` in `types/attachments`,
 * which does the same job for artifacts.
 *
 * NFP #1 (tunability): a plain table — rename a place-kind by editing one entry.
 * NFP #4 (fail-soft): {@link locationSubtypeName} returns `null` for an unset or
 *   unrecognised subtype so callers omit the line rather than printing the key.
 *   Live worlds do carry `null` subtypes (verified via CLI, seed 42 medium), so
 *   the absent case is the common one, not a theoretical guard.
 */

import type { LocationSubtype } from '../types';

/**
 * Player-facing name per subtype. Every member of the `LocationSubtype` union
 * has an entry — `Record` (not `Partial`) so adding a subtype to the union
 * fails the typecheck here until it is named, which is the point.
 */
export const LOCATION_SUBTYPE_NAMES: Record<LocationSubtype, string> = {
  // ── Settlements ──
  hamlet: 'Hamlet',
  town: 'Town',
  city: 'City',
  capital: 'Capital',
  camp: 'Camp',
  farmland: 'Farmland',
  // ── Holdings and holy places ──
  castle: 'Castle',
  fort: 'Fort',
  tower: 'Tower',
  shrine: 'Shrine',
  temple: 'Temple',
  mining: 'Mining Camp',
  // ── Ruins (cosmetic layer) ──
  ruins: 'Ruins',
  ruined_tower: 'Ruined Tower',
  ruined_city: 'Ruined City',
  ruined_village: 'Ruined Village',
  battleground: 'Battleground',
  oasis: 'Oasis',
  unexplored_poi: 'Uncharted Place',
  // ── Sphere-resonant wonders ──
  healing_spring: 'Healing Spring',
  master_forge: 'Master Forge',
  living_archive: 'Living Archive',
  fey_crossing: 'Fey Crossing',
  sacrifice_site: 'Sacrifice Site',
  convergence: 'Convergence',
  time_scar: 'Time Scar',
  standing_stones: 'Standing Stones',
  shadow_hollow: 'Shadow Hollow',
  ley_nexus: 'Ley Nexus',
  // ── Wilderness interest ──
  cavern: 'Cavern',
  grove: 'Grove',
  hot_spring: 'Hot Spring',
  shipwreck: 'Shipwreck',
  ancient_road: 'Ancient Road',
  monument: 'Monument',
  // ── Natural anomalies ──
  gem_deposit: 'Gem Deposit',
  golden_grove: 'Golden Grove',
  crystal_cavern: 'Crystal Cavern',
  ancient_vault: 'Ancient Vault',
  sunken_treasury: 'Sunken Treasury',
  herb_garden: 'Herb Garden',
  fossil_bed: 'Fossil Bed',
  iron_seep: 'Iron Seep',
  pearl_shoal: 'Pearl Shoal',
  glowcap_hollow: 'Glowcap Hollow',
  // ── Danger ──
  nest: 'Nest',
  haunted_ground: 'Haunted Ground',
  corruption_zone: 'Corruption Zone',
  wilderness: 'Wilderness',
  lair: 'Lair',
  cleared_lair: 'Cleared Lair',
  // ── Ruins layer (THR-149) ──
  elder_ruin: 'Elder Ruin',
  place_of_power: 'Place of Power',
  // ── Work identities (THR-1308) ──
  // The route's name-bearing face. Players read "Trade Route", never the raw key.
  trade_route: 'Trade Route',
};

/**
 * The player-facing name for a raw subtype value, or `null` when it is unset or
 * not a subtype we name. Never returns the raw key (Law 14).
 */
export function locationSubtypeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return LOCATION_SUBTYPE_NAMES[raw as LocationSubtype] ?? null;
}

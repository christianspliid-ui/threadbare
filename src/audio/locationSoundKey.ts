import type { LocationSubtype } from '../types';

const LOCATION_TO_SOUND_KEY: Partial<Record<LocationSubtype, string>> = {
  city: 'city', capital: 'city',
  hamlet: 'settlement', town: 'settlement',
  castle: 'fortress', fort: 'fortress', tower: 'fortress',
  temple: 'sacred', shrine: 'sacred', healing_spring: 'sacred',
  standing_stones: 'sacred', ley_nexus: 'sacred',
  fey_crossing: 'sacred', living_archive: 'sacred',
  cavern: 'dungeon', ruins: 'dungeon', ruined_tower: 'dungeon',
  ruined_city: 'dungeon', ruined_village: 'dungeon',
  crystal_cavern: 'dungeon', ancient_vault: 'dungeon', shadow_hollow: 'dungeon',
  sacrifice_site: 'danger', haunted_ground: 'danger',
  corruption_zone: 'danger', nest: 'danger',
  lair: 'danger', cleared_lair: 'danger', battleground: 'danger',
};

/**
 * Returns a sound key for the given location subtype,
 * or null if it should fall back to the terrain ambient.
 */
export function locationToSoundKey(subtype: LocationSubtype): string | null {
  return LOCATION_TO_SOUND_KEY[subtype] ?? null;
}

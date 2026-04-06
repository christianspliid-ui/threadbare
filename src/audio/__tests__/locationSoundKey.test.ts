import { describe, it, expect } from 'vitest';
import { locationToSoundKey } from '../locationSoundKey';
import type { LocationSubtype } from '../../types';

const MAPPED_SUBTYPES: Array<[LocationSubtype, string]> = [
  ['city', 'city'], ['capital', 'city'],
  ['hamlet', 'settlement'], ['town', 'settlement'],
  ['castle', 'fortress'], ['fort', 'fortress'], ['tower', 'fortress'],
  ['temple', 'sacred'], ['shrine', 'sacred'], ['healing_spring', 'sacred'],
  ['standing_stones', 'sacred'], ['ley_nexus', 'sacred'],
  ['fey_crossing', 'sacred'], ['living_archive', 'sacred'],
  ['cavern', 'dungeon'], ['ruins', 'dungeon'], ['ruined_tower', 'dungeon'],
  ['ruined_city', 'dungeon'], ['ruined_village', 'dungeon'],
  ['crystal_cavern', 'dungeon'], ['ancient_vault', 'dungeon'], ['shadow_hollow', 'dungeon'],
  ['sacrifice_site', 'danger'], ['haunted_ground', 'danger'],
  ['corruption_zone', 'danger'], ['nest', 'danger'],
  ['lair', 'danger'], ['cleared_lair', 'danger'], ['battleground', 'danger'],
];

const FALLBACK_SUBTYPES: LocationSubtype[] = [
  'mining', 'farmland', 'camp', 'oasis', 'unexplored_poi', 'grove',
  'hot_spring', 'shipwreck', 'ancient_road', 'monument',
  'gem_deposit', 'golden_grove', 'iron_seep', 'pearl_shoal',
  'sunken_treasury', 'herb_garden', 'fossil_bed', 'glowcap_hollow',
  'master_forge', 'convergence', 'time_scar', 'wilderness',
];

describe('locationToSoundKey', () => {
  it.each(MAPPED_SUBTYPES)('maps %s to %s', (subtype, expected) => {
    expect(locationToSoundKey(subtype)).toBe(expected);
  });

  it.each(FALLBACK_SUBTYPES)('returns null for fallback subtype %s', (subtype) => {
    expect(locationToSoundKey(subtype)).toBeNull();
  });
});

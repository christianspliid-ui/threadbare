/**
 * Location concept art registry — maps location subtypes to 16:9 concept art images.
 *
 * Each location subtype gets a dedicated landscape image. Ruined variants
 * fall back to the 'ruins' image. Unknown subtypes fall back to 'camp'.
 */

import type { LocationSubtype } from '../types';

/** Maps location subtypes to concept art filenames in /concept-art/locations/ */
const LOCATION_ART_MAP: Partial<Record<LocationSubtype, string>> = {
  hamlet: 'hamlet.png',
  town: 'town.png',
  city: 'city.png',
  capital: 'capital.png',
  castle: 'castle.png',
  fort: 'fort.png',
  tower: 'tower.png',
  shrine: 'shrine.png',
  temple: 'temple.png',
  mining: 'mining.png',
  farmland: 'farmland.png',
  ruins: 'ruins.png',
  ruined_tower: 'ruins.png',
  ruined_city: 'ruins.png',
  ruined_village: 'ruins.png',
  camp: 'camp.png',
  battleground: 'battleground.png',
  oasis: 'oasis.png',
  unexplored_poi: 'ruins.png',
  // THR-1916: a monster's lair had no art of its own and borrowed the camp.
  lair: 'lair.png',
};

/** Fallback image for unknown location subtypes */
const FALLBACK_IMAGE = 'camp.png';

/**
 * Get the concept art URL for a location subtype.
 * Returns a path like `/concept-art/locations/castle.png`.
 * Fail-soft: unknown subtypes get the camp image.
 */
export function getLocationConceptArtUrl(subtype: string | undefined): string {
  return getOwnLocationConceptArtUrl(subtype) ?? `/concept-art/locations/${FALLBACK_IMAGE}`;
}

/**
 * The subtype's own concept art, or null when it has none (no camp fallback).
 * For callers that fall back to something better than the camp, e.g. the land
 * page's terrain landscape (THR-1916).
 */
export function getOwnLocationConceptArtUrl(subtype: string | undefined): string | null {
  const filename = subtype ? LOCATION_ART_MAP[subtype as LocationSubtype] : undefined;
  return filename ? `/concept-art/locations/${filename}` : null;
}

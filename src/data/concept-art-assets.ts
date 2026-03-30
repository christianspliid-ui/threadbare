/**
 * Concept art landscape registry — maps terrain families to 16:9 concept art images.
 *
 * Each entry has:
 * - `image`: filename in /concept-art/
 * - `terrains`: terrain types this image represents (best match)
 * - `locationBoost`: location subtypes that make this image more fitting
 * - `sphereBoost`: sphere names that thematically align with this landscape
 *
 * The `pickConceptArt` function scores each entry against a hex's properties
 * and returns the best-matching image URL.
 */

import type { TerrainType, SphereName, LocationSubtype } from '../types';
import type { SphereInfluence } from '../engine/hexZoom';
import type { GraphNode } from '../types/graph';

// ── Registry ──────────────────────────────────────────────────────────

export interface ConceptArtEntry {
  id: string;
  image: string;
  terrains: TerrainType[];
  locationBoost: LocationSubtype[];
  sphereBoost: SphereName[];
}

/** Terrain weight when the hex terrain matches an entry's terrain list */
const TERRAIN_MATCH_WEIGHT = 10;
/** Bonus per matching location subtype present in the hex */
const LOCATION_MATCH_WEIGHT = 2;
/** Bonus per matching sphere with influence > 0.3 */
const SPHERE_MATCH_WEIGHT = 1;

export const CONCEPT_ART_REGISTRY: ConceptArtEntry[] = [
  {
    id: 'ocean',
    image: 'ocean.png',
    terrains: ['ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'reef'],
    locationBoost: [],
    sphereBoost: ['entropy', 'time'],
  },
  {
    id: 'grassland',
    image: 'grassland.png',
    terrains: ['grassland', 'savanna', 'steppe', 'farmland', 'floodplain'],
    locationBoost: ['hamlet', 'town', 'farmland', 'camp'],
    sphereBoost: ['life', 'order'],
  },
  {
    id: 'desert',
    image: 'desert.png',
    terrains: ['desert', 'rocky_desert', 'sand_dunes', 'oasis'],
    locationBoost: ['oasis', 'ruins', 'shrine'],
    sphereBoost: ['entropy', 'force', 'time'],
  },
  {
    id: 'temperate-forest',
    image: 'temperate-forest.png',
    terrains: ['temperate_forest', 'light_forest', 'evergreen_forest'],
    locationBoost: ['hamlet', 'shrine', 'tower'],
    sphereBoost: ['life', 'spirit'],
  },
  {
    id: 'dense-forest',
    image: 'dense-forest.png',
    terrains: ['dense_forest', 'great_home_trees', 'dead_forest'],
    locationBoost: ['ruins', 'shrine', 'temple'],
    sphereBoost: ['spirit', 'entropy', 'mind'],
  },
  {
    id: 'boreal-forest',
    image: 'boreal-forest.png',
    terrains: ['boreal_forest'],
    locationBoost: ['camp', 'fort'],
    sphereBoost: ['matter', 'time'],
  },
  {
    id: 'jungle',
    image: 'jungle.png',
    terrains: ['jungle', 'tropical_forest'],
    locationBoost: ['temple', 'ruins'],
    sphereBoost: ['life', 'energy'],
  },
  {
    id: 'swamp',
    image: 'swamp.png',
    terrains: ['swamp', 'marsh', 'moor_bog', 'lake', 'river'],
    locationBoost: ['ruins', 'camp'],
    sphereBoost: ['entropy', 'spirit'],
  },
  {
    id: 'hills',
    image: 'hills.png',
    terrains: ['hills', 'forested_hills', 'plateau', 'mountain_pass'],
    locationBoost: ['fort', 'castle', 'town', 'mining'],
    sphereBoost: ['matter', 'force'],
  },
  {
    id: 'mountains',
    image: 'mountains.png',
    terrains: ['mountains', 'high_mountains', 'volcano', 'glacier'],
    locationBoost: ['castle', 'fort', 'temple', 'mining'],
    sphereBoost: ['force', 'matter', 'energy'],
  },
  {
    id: 'badlands',
    image: 'badlands.png',
    terrains: ['badlands', 'broken_lands'],
    locationBoost: ['ruins', 'battleground', 'camp'],
    sphereBoost: ['entropy', 'force'],
  },
  {
    id: 'tundra',
    image: 'tundra.png',
    terrains: ['tundra', 'arctic', 'snow_fields'],
    locationBoost: ['camp', 'fort'],
    sphereBoost: ['time', 'entropy'],
  },
];

// ── Matching function ────────────────────────────────────────────────

/**
 * Score a concept art entry against hex properties.
 * Higher score = better match.
 */
function scoreEntry(
  entry: ConceptArtEntry,
  terrain: TerrainType,
  locations: GraphNode[],
  sphereInfluence: SphereInfluence | null,
): number {
  let score = 0;

  // Terrain match — primary signal
  if (entry.terrains.includes(terrain)) {
    score += TERRAIN_MATCH_WEIGHT;
  }

  // Location boost — each matching location subtype adds weight
  if (locations.length > 0) {
    const subtypes = new Set(
      locations
        .map((loc) => loc.properties?.subtype as LocationSubtype | undefined)
        .filter(Boolean),
    );
    for (const subtype of subtypes) {
      if (subtype && entry.locationBoost.includes(subtype)) {
        score += LOCATION_MATCH_WEIGHT;
      }
    }
  }

  // Sphere boost — spheres with influence > 0.3 that match entry's affinity
  if (sphereInfluence) {
    for (const sphere of entry.sphereBoost) {
      if ((sphereInfluence[sphere] ?? 0) > 0.3) {
        score += SPHERE_MATCH_WEIGHT;
      }
    }
  }

  return score;
}

/**
 * Pick the best concept art image for a hex based on terrain, locations, and sphere influence.
 *
 * Returns the URL path to the concept art image (e.g. `/concept-art/mountains.png`).
 * Falls back to grassland if no terrain matches at all (fail-soft).
 */
export function pickConceptArt(
  terrain: TerrainType,
  locations: GraphNode[],
  sphereInfluence: SphereInfluence | null,
): string {
  let bestEntry = CONCEPT_ART_REGISTRY[1]; // grassland fallback
  let bestScore = -1;

  for (const entry of CONCEPT_ART_REGISTRY) {
    const s = scoreEntry(entry, terrain, locations, sphereInfluence);
    if (s > bestScore) {
      bestScore = s;
      bestEntry = entry;
    }
  }

  return `/concept-art/${bestEntry.image}`;
}

/**
 * Get the concept art URL for a specific entry ID (useful for testing/overrides).
 */
export function getConceptArtUrl(entryId: string): string | null {
  const entry = CONCEPT_ART_REGISTRY.find((e) => e.id === entryId);
  return entry ? `/concept-art/${entry.image}` : null;
}

import type { GeoParams, TerrainType } from '../types';

// ─── Biome classification thresholds (NFP #1: Tunability) ────────
// Change game feel by adjusting these values — no logic rewrites needed.

/** Elevation band boundaries (normalized 0–1) */
export const ELEV = {
  DEEP_OCEAN: 0.15,     // below → ocean
  SHALLOWS: 0.25,       // below → coastal_shallows
  LAKE_MAX: 0.28,       // below + wet → lake
  LOWLAND: 0.40,        // below → lowland biomes
  MID: 0.60,            // below → mid-elevation biomes
  HIGHLAND: 0.80,       // below → highland biomes, above → mountains
} as const;

/** Temperature band boundaries (normalized 0–1) */
export const TEMP = {
  FROZEN: 0.15,          // below → tundra/glacier
  COLD: 0.30,            // below → cold variants
  COOL: 0.50,            // below → cool variants
  WARM: 0.60,            // above → warm variants
  HOT: 0.65,             // above → hot variants (plateau, badlands)
  SCORCHING: 0.70,       // above → desert, savanna, volcano candidates
} as const;

/** Moisture band boundaries (normalized 0–1) */
export const MOIST = {
  ARID: 0.25,            // below → desert, steppe, broken_lands
  DRY: 0.45,             // below → dry variants
  MODERATE: 0.50,        // moderate moisture
  DAMP: 0.55,            // above → forested mid-elevation
  WET: 0.65,             // above → dense forest, jungle fringe
  LAKE_MIN: 0.70,        // above → lake candidates, wet highlands
  SOAKED: 0.80,          // above → jungle, swamp, marsh
} as const;

/** Volcano spawn chance for high-elevation hot hexes */
export const VOLCANO_CHANCE = 0.05;

/**
 * Classify a biome based on geographic parameters using Whittaker-style lookup.
 * All inputs are normalized 0.0–1.0.
 */
export function classifyBiome(
  elevation: number,
  temperature: number,
  moisture: number
): TerrainType {
  // Frozen terrain override: tundra and glacier for very cold temperatures
  if (temperature < TEMP.FROZEN) {
    return elevation > ELEV.HIGHLAND ? 'glacier' : 'tundra';
  }

  // Water types
  if (elevation < ELEV.DEEP_OCEAN) return 'ocean';
  if (elevation < ELEV.SHALLOWS) return 'coastal_shallows';

  // Check for inland lakes (low elevation, isolated regions)
  if (elevation < ELEV.LAKE_MAX && moisture > MOIST.LAKE_MIN) return 'lake';

  // Lowland biomes
  if (elevation < ELEV.LOWLAND) {
    // Very wet lowlands
    if (moisture > MOIST.SOAKED) {
      return temperature > TEMP.WARM ? 'jungle' : temperature > TEMP.COLD ? 'swamp' : 'marsh';
    }
    if (moisture > MOIST.WET) {
      return temperature > TEMP.WARM ? 'jungle' : temperature > TEMP.COLD ? 'dense_forest' : 'marsh';
    }
    // Moderate moisture lowlands
    if (moisture > MOIST.DRY) {
      if (temperature > TEMP.SCORCHING) return 'savanna';
      if (temperature > TEMP.COOL) return 'grassland';
      if (temperature > TEMP.COLD) return 'temperate_forest';
      return 'boreal_forest';
    }
    // Dry lowlands
    if (moisture > MOIST.ARID) {
      if (temperature > TEMP.SCORCHING) return 'savanna';
      if (temperature > TEMP.COOL) return 'steppe';
      return 'grassland';
    }
    // Very dry lowlands
    if (temperature > TEMP.SCORCHING) return 'desert';
    if (temperature > TEMP.COOL) return 'broken_lands';
    return 'steppe';
  }

  // Mid-elevation biomes
  if (elevation < ELEV.MID) {
    // Very wet mid-elevation → forested hills
    if (moisture > MOIST.LAKE_MIN) {
      if (temperature > TEMP.COLD) return 'forested_hills';
      return 'boreal_forest';
    }
    // Moderate wet mid-elevation → forested hills or deciduous
    if (moisture > MOIST.DAMP) {
      if (temperature > TEMP.COLD) return 'forested_hills';
      return 'boreal_forest';
    }
    // Moderate mid-elevation
    if (moisture > MOIST.DRY) {
      if (temperature > TEMP.COLD) return 'temperate_forest';
      return 'boreal_forest';
    }
    // Drier mid-elevation → hills or badlands
    if (temperature > TEMP.HOT) return 'badlands';
    return 'hills';
  }

  // Highlands
  if (elevation < ELEV.HIGHLAND) {
    // Wet highlands — forested hills
    if (moisture > MOIST.WET) {
      if (temperature > TEMP.COLD) return 'forested_hills';
      return 'boreal_forest';
    }
    if (moisture > MOIST.MODERATE) {
      return temperature > TEMP.COLD ? 'hills' : 'boreal_forest';
    }
    if (temperature > TEMP.HOT) return 'plateau';
    if (temperature < TEMP.FROZEN) return 'glacier';
    return 'hills';
  }

  // High mountains and extremes: > ELEV.HIGHLAND
  if (temperature < TEMP.FROZEN) return 'glacier';
  // Rare volcanic peaks: deterministic hash of inputs replaces Math.random()
  if (temperature > TEMP.SCORCHING) {
    const hash = ((elevation * 7919 + temperature * 6529 + moisture * 4217) % 1);
    if (hash < VOLCANO_CHANCE) return 'volcano';
  }
  return 'mountains';
}

/**
 * Compute secondary properties from geographic parameters.
 * Returns additional descriptive data (currently just passes through geoParams).
 */
export function deriveProperties(params: GeoParams) {
  return params;
}

import type { GeoParams, TerrainType } from '../types';

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
  if (temperature < 0.15) {
    return elevation > 0.8 ? 'glacier' : 'tundra';
  }

  // Water types: elevation < 0.25
  if (elevation < 0.15) return 'ocean';
  if (elevation < 0.25) return 'coastal_shallows';

  // Check for inland lakes (low elevation, isolated regions)
  if (elevation < 0.28 && moisture > 0.7) return 'lake';

  // Lowland biomes: 0.25–0.4 elevation
  if (elevation < 0.40) {
    // Very wet lowlands
    if (moisture > 0.8) {
      return temperature > 0.6 ? 'jungle' : temperature > 0.3 ? 'swamp' : 'marsh';
    }
    if (moisture > 0.65) {
      return temperature > 0.6 ? 'jungle' : temperature > 0.3 ? 'dense_forest' : 'marsh';
    }
    // Moderate moisture lowlands
    if (moisture > 0.45) {
      if (temperature > 0.7) return 'savanna';
      if (temperature > 0.5) return 'grassland';
      if (temperature > 0.3) return 'temperate_forest';
      return 'boreal_forest';
    }
    // Dry lowlands
    if (moisture > 0.25) {
      if (temperature > 0.7) return 'savanna';
      if (temperature > 0.5) return 'steppe';
      return 'grassland';
    }
    // Very dry lowlands
    if (temperature > 0.7) return 'desert';
    if (temperature > 0.5) return 'broken_lands';
    return 'steppe';
  }

  // Mid-elevation biomes: 0.4–0.6 elevation
  if (elevation < 0.60) {
    // Very wet mid-elevation → forested hills
    if (moisture > 0.7) {
      if (temperature > 0.6) return 'forested_hills';
      if (temperature > 0.3) return 'forested_hills';
      return 'boreal_forest';
    }
    // Moderate wet mid-elevation → forested hills or deciduous
    if (moisture > 0.55) {
      if (temperature > 0.6) return 'forested_hills';
      if (temperature > 0.3) return 'forested_hills';
      return 'boreal_forest';
    }
    // Moderate mid-elevation
    if (moisture > 0.45) {
      if (temperature > 0.6) return 'temperate_forest';
      if (temperature > 0.3) return 'temperate_forest';
      return 'boreal_forest';
    }
    // Drier mid-elevation → hills or badlands
    if (temperature > 0.65) return 'badlands';
    return 'hills';
  }

  // Highlands: 0.6–0.8 elevation
  if (elevation < 0.80) {
    // Wet highlands — forested hills
    if (moisture > 0.65) {
      if (temperature > 0.5) return 'forested_hills';
      if (temperature > 0.3) return 'forested_hills';
      return 'boreal_forest';
    }
    if (moisture > 0.5) {
      return temperature > 0.3 ? 'hills' : 'boreal_forest';
    }
    if (temperature > 0.65) return 'plateau';
    if (temperature < 0.15) return 'glacier';
    return 'hills';
  }

  // High mountains and extremes: > 0.8 elevation
  if (temperature < 0.15) return 'glacier';
  if (temperature > 0.7 && Math.random() < 0.05) return 'volcano'; // Rare volcanic peaks
  return 'mountains';
}

/**
 * Compute secondary properties from geographic parameters.
 * Returns additional descriptive data (currently just passes through geoParams).
 */
export function deriveProperties(params: GeoParams) {
  return params;
}

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
  // Water types: elevation < 0.25
  if (elevation < 0.15) return 'ocean';
  if (elevation < 0.25) return 'coastal_shallows';

  // Check for inland lakes (low elevation, isolated regions)
  if (elevation < 0.28 && moisture > 0.7) return 'lake';

  // Lowland biomes: 0.25–0.4 elevation
  if (elevation < 0.40) {
    // Very wet lowlands
    if (moisture > 0.8) {
      return temperature > 0.6 ? 'jungle' : temperature > 0.3 ? 'swamp' : 'bog';
    }
    if (moisture > 0.65) {
      return temperature > 0.6 ? 'jungle' : temperature > 0.3 ? 'dense_forest' : 'bog';
    }
    // Moderate moisture lowlands
    if (moisture > 0.45) {
      if (temperature > 0.7) return 'savanna';
      if (temperature > 0.5) return 'grassland';
      if (temperature > 0.3) return 'deciduous_forest';
      return 'taiga';
    }
    // Dry lowlands
    if (moisture > 0.25) {
      if (temperature > 0.7) return 'savanna';
      if (temperature > 0.5) return 'steppe';
      return 'grassland';
    }
    // Very dry lowlands
    if (temperature > 0.7) return 'desert';
    if (temperature > 0.5) return 'badlands';
    return 'steppe';
  }

  // Mid-elevation biomes: 0.4–0.6 elevation
  if (elevation < 0.60) {
    // Wet mid-elevation
    if (moisture > 0.7) {
      if (temperature > 0.6) return 'jungle';
      if (temperature > 0.3) return 'deciduous_forest';
      return 'taiga';
    }
    // Moderate mid-elevation
    if (moisture > 0.45) {
      if (temperature > 0.6) return 'deciduous_forest';
      if (temperature > 0.3) return 'deciduous_forest';
      return 'taiga';
    }
    // Drier mid-elevation → hills
    if (temperature > 0.65) return 'badlands';
    return 'hills';
  }

  // Highlands: 0.6–0.8 elevation
  if (elevation < 0.80) {
    if (moisture > 0.6) {
      return temperature > 0.3 ? 'hills' : 'taiga';
    }
    if (temperature > 0.65) return 'plateau';
    if (temperature < 0.15) return 'glacier';
    return 'hills';
  }

  // High mountains and extremes: > 0.8 elevation
  if (temperature < 0.15) return 'glacier';
  if (temperature > 0.7 && Math.random() < 0.05) return 'volcanic'; // Rare volcanic peaks
  return 'mountains';
}

/**
 * Compute secondary properties from geographic parameters.
 * Returns additional descriptive data (currently just passes through geoParams).
 */
export function deriveProperties(params: GeoParams) {
  return params;
}

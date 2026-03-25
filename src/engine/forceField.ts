import { createNoise2D } from 'simplex-noise';
import { type CosmologyProfile, type GeoParams } from '../types';
import { mulberry32 } from '../lib/prng';
import { hexKey } from '../lib/hexKey';

// ─── Noise generation parameters (NFP #1: Tunability) ────────
// Change terrain character by adjusting these values — no logic rewrites needed.

/** Elevation noise: large-scale continental shapes */
export const ELEVATION_SCALE = 0.06;
export const ELEVATION_OCTAVES = 4;
export const ELEVATION_PERSISTENCE = 0.5;
export const ELEVATION_LACUNARITY = 2.0;

/** Temperature noise: local climate variation */
export const TEMP_NOISE_SCALE = 0.04;
export const TEMP_OCTAVES = 2;
export const TEMP_PERSISTENCE = 0.5;
export const TEMP_LACUNARITY = 2.0;

/** Moisture noise: rainfall and humidity patterns */
export const MOISTURE_NOISE_SCALE = 0.05;
export const MOISTURE_OCTAVES = 3;
export const MOISTURE_PERSISTENCE = 0.5;
export const MOISTURE_LACUNARITY = 2.0;

function fractalNoise(
  noise2D: (x: number, y: number) => number,
  x: number,
  y: number,
  scale: number,
  octaves: number,
  persistence: number,
  lacunarity: number
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let o = 0; o < octaves; o++) {
    value += noise2D(x * frequency * scale, y * frequency * scale) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxAmplitude;
}

/**
 * Generate geographic parameter field for the world.
 * Returns a Map keyed by "col,row" with GeoParams values.
 */
export function generateGeoField(
  cols: number,
  rows: number,
  seed: number,
  cosmologyBias?: CosmologyProfile
): Map<string, GeoParams> {
  const rng = mulberry32(seed);
  const elevationSeed = Math.floor(rng() * 2147483647);
  const temperatureSeed = Math.floor(rng() * 2147483647);
  const moistureSeed = Math.floor(rng() * 2147483647);

  const elevationNoise = createNoise2D(() => mulberry32(elevationSeed)());
  const temperatureNoise = createNoise2D(() => mulberry32(temperatureSeed)());
  const moistureNoise = createNoise2D(() => mulberry32(moistureSeed)());

  const result = new Map<string, GeoParams>();

  for (let col = 0; col < cols; col++) {
    for (let row = 0; rows && row < rows; row++) {
      // Elevation: multi-octave simplex noise
      const elevationNoise1 = fractalNoise(
        elevationNoise, col, row,
        ELEVATION_SCALE, ELEVATION_OCTAVES, ELEVATION_PERSISTENCE, ELEVATION_LACUNARITY
      );
      let elevation = (elevationNoise1 + 1) / 2; // Normalize to [0, 1]
      elevation = Math.max(0, Math.min(1, elevation));

      // Temperature: latitude gradient + altitude penalty + noise
      // Latitude gradient: hotter at center (row 0), colder at edges
      const centerRow = rows / 2;
      const latitudeGradient = 1 - Math.abs(row - centerRow) / (centerRow + 1);
      const tempNoise = fractalNoise(
        temperatureNoise, col, row,
        TEMP_NOISE_SCALE, TEMP_OCTAVES, TEMP_PERSISTENCE, TEMP_LACUNARITY
      );
      const tempNoiseNorm = (tempNoise + 1) / 2;
      let temperature = latitudeGradient * 0.7 + tempNoiseNorm * 0.3;

      // Altitude penalty: high elevation reduces temperature
      const altitudePenalty = Math.max(0, elevation - 0.5) * 0.4;
      temperature = Math.max(0, Math.min(1, temperature - altitudePenalty));

      // Cosmology bias: Energy → warmer
      if (cosmologyBias && cosmologyBias.energy) {
        temperature += cosmologyBias.energy * 0.08;
      }

      // Moisture: distance-from-ocean + rain shadow + noise
      // Base moisture higher near low elevations (oceans/lakes)
      const oceanDistance = Math.min(col, cols - col, row, rows - row) / Math.max(cols, rows);
      let moisture = Math.max(0.2, 1 - elevation) * 0.5;
      moisture += oceanDistance * 0.2;

      // Noise contribution
      const moistureNoise1 = fractalNoise(
        moistureNoise, col, row,
        MOISTURE_NOISE_SCALE, MOISTURE_OCTAVES, MOISTURE_PERSISTENCE, MOISTURE_LACUNARITY
      );
      const moistureNoiseNorm = (moistureNoise1 + 1) / 2;
      moisture += moistureNoiseNorm * 0.3;

      // Rain shadow: high elevation reduces moisture
      if (elevation > 0.5) {
        moisture -= (elevation - 0.5) * 0.3;
      }

      // Cosmology bias: Life → wetter, Entropy → more variation
      if (cosmologyBias && cosmologyBias.life) {
        moisture += cosmologyBias.life * 0.08;
      }
      if (cosmologyBias && cosmologyBias.entropy) {
        moisture += (rng() - 0.5) * cosmologyBias.entropy * 0.1;
      }

      moisture = Math.max(0, Math.min(1, moisture));

      result.set(hexKey(col, row), { elevation, temperature, moisture });
    }
  }

  return result;
}

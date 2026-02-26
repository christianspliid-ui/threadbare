import { createNoise2D } from 'simplex-noise';
import { FORCE_NAMES, type CosmologyProfile, type ForceVector, type HexCoord, type ForceName } from '../types';
import { FORCE_ALLIES, FORCE_OPPOSITES } from './cosmology';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOISE_SCALE = 0.08;
const NOISE_OCTAVES = 3;
const NOISE_PERSISTENCE = 0.5;
const NOISE_LACUNARITY = 2.0;
const NOISE_AMPLITUDE = 0.3;
const ALLY_BOOST = 0.05;
const OPPOSE_PENALTY = 0.03;

function fractalNoise(
  noise2D: (x: number, y: number) => number,
  x: number,
  y: number,
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let o = 0; o < NOISE_OCTAVES; o++) {
    value += noise2D(x * frequency * NOISE_SCALE, y * frequency * NOISE_SCALE) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= NOISE_PERSISTENCE;
    frequency *= NOISE_LACUNARITY;
  }

  return value / maxAmplitude;
}

export function generateForceField(
  coords: HexCoord[],
  cosmology: CosmologyProfile,
  seed: number,
): ForceVector[] {
  const rng = mulberry32(seed);
  const noisePerForce: Record<string, (x: number, y: number) => number> = {};
  for (const f of FORCE_NAMES) {
    const forceSeed = Math.floor(rng() * 2147483647);
    const forceRng = mulberry32(forceSeed);
    noisePerForce[f] = createNoise2D(() => forceRng());
  }

  return coords.map(coord => {
    const raw: Partial<ForceVector> = {};

    for (const f of FORCE_NAMES) {
      const base = cosmology[f];
      const noise = fractalNoise(noisePerForce[f], coord.col, coord.row) * NOISE_AMPLITUDE;
      raw[f] = base + noise;
    }

    for (const f of FORCE_NAMES) {
      const ally = FORCE_ALLIES[f];
      const opposite = FORCE_OPPOSITES[f];
      if (ally && raw[ally] !== undefined) {
        raw[f]! += raw[ally]! * ALLY_BOOST;
      }
      if (opposite && raw[opposite] !== undefined) {
        raw[f]! -= raw[opposite]! * OPPOSE_PENALTY;
      }
    }

    const clamped: Partial<ForceVector> = {};
    for (const f of FORCE_NAMES) {
      clamped[f] = Math.max(0, raw[f]!);
    }
    const sum = FORCE_NAMES.reduce((s, f) => s + clamped[f]!, 0);
    const normalized: Partial<ForceVector> = {};
    for (const f of FORCE_NAMES) {
      normalized[f] = sum > 0 ? clamped[f]! / sum : 1 / FORCE_NAMES.length;
    }

    return normalized as ForceVector;
  });
}

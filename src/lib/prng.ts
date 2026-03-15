/**
 * Seeded 32-bit PRNG (mulberry32).
 * Returns a function that produces the next pseudo-random number in [0, 1).
 *
 * NFP #3: Determinism — same seed always produces the same sequence.
 * RC-218: Single shared implementation; do not duplicate in engine modules.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple fractal noise using value noise with octaves.
 * Uses deterministic integer hashing — does NOT consume external PRNG state.
 * Purely a function of (x, y, seed, octaves, persistence).
 */
export function fractalNoise(
  x: number,
  y: number,
  seed: number,
  octaves: number = 4,
  persistence: number = 0.5,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < octaves; i++) {
    const ix = Math.floor(x * frequency);
    const iy = Math.floor(y * frequency);
    const fx = x * frequency - ix;
    const fy = y * frequency - iy;

    // Deterministic hash — does NOT consume rng state
    const hash = (px: number, py: number) => {
      let h = (px * 374761393 + py * 668265263 + (seed + i) * 1274126177) | 0;
      h = Math.imul(h ^ (h >>> 13), h | 1);
      h = (h ^ (h >>> 15)) >>> 0;
      return (h / 4294967296) * 2 - 1;
    };

    const n00 = hash(ix, iy);
    const n10 = hash(ix + 1, iy);
    const n01 = hash(ix, iy + 1);
    const n11 = hash(ix + 1, iy + 1);

    // Bilinear interpolation with smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);
    const value = nx0 + sy * (nx1 - nx0);

    total += value * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxAmplitude;
}

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

import { describe, it, expect } from 'vitest';
import { SimplexNoise } from '../simplexNoise';

describe('SimplexNoise', () => {
  it('creates instance with seed', () => {
    const noise = new SimplexNoise(42);
    expect(noise).toBeInstanceOf(SimplexNoise);
  });

  it('noise2D returns values in [-1, 1] range', () => {
    const noise = new SimplexNoise(42);
    for (let i = 0; i < 100; i++) {
      const v = noise.noise2D(i * 0.1, i * 0.13);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic — same seed produces same output', () => {
    const a = new SimplexNoise(42);
    const b = new SimplexNoise(42);
    for (let i = 0; i < 50; i++) {
      expect(a.noise2D(i * 0.3, i * 0.7)).toBe(b.noise2D(i * 0.3, i * 0.7));
    }
  });

  it('different seeds produce different output', () => {
    const a = new SimplexNoise(42);
    const b = new SimplexNoise(99);
    let diffs = 0;
    for (let i = 0; i < 50; i++) {
      if (a.noise2D(i * 0.3, i * 0.7) !== b.noise2D(i * 0.3, i * 0.7)) diffs++;
    }
    expect(diffs).toBeGreaterThan(40);
  });

  it('varies spatially — not constant across coordinates', () => {
    const noise = new SimplexNoise(42);
    const values = new Set<number>();
    for (let i = 0; i < 20; i++) {
      values.add(Math.round(noise.noise2D(i * 2, i * 3) * 1000));
    }
    expect(values.size).toBeGreaterThan(10);
  });
});

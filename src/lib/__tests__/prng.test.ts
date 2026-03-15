import { describe, it, expect } from 'vitest';
import { mulberry32, fractalNoise } from '../prng';

describe('mulberry32', () => {
  it('returns deterministic sequence for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it('returns values in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('fractalNoise', () => {
  it('returns value in roughly [-1, 1] range', () => {
    for (let i = 0; i < 50; i++) {
      const v = fractalNoise(i * 0.1, i * 0.2, 42, 4);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic with same seed', () => {
    expect(fractalNoise(1.5, 2.5, 42, 4)).toBe(fractalNoise(1.5, 2.5, 42, 4));
  });
});

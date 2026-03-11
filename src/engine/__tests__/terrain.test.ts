import { describe, it, expect } from 'vitest';
import { classifyBiome } from '../terrain';

describe('classifyBiome', () => {
  it('returns ocean for very low elevation', () => {
    const biome = classifyBiome(0.1, 0.5, 0.5);
    expect(biome).toBe('ocean');
  });

  it('returns coastal_shallows for low elevation', () => {
    const biome = classifyBiome(0.2, 0.5, 0.5);
    expect(biome).toBe('coastal_shallows');
  });

  it('returns grassland for moderate elevation, moderate moisture, cool-warm temp', () => {
    const biome = classifyBiome(0.35, 0.55, 0.55);
    expect(biome).toBe('grassland');
  });

  it('returns jungle for low elevation, high moisture, hot temperature', () => {
    const biome = classifyBiome(0.3, 0.8, 0.85);
    expect(biome).toBe('jungle');
  });

  it('returns desert for moderate elevation, very low moisture, hot temperature', () => {
    const biome = classifyBiome(0.35, 0.8, 0.1);
    expect(biome).toBe('desert');
  });

  it('returns mountains for high elevation', () => {
    const biome = classifyBiome(0.85, 0.5, 0.5);
    expect(biome).toBe('mountains');
  });

  it('returns glacier for high elevation with cold temperature', () => {
    const biome = classifyBiome(0.85, 0.1, 0.5);
    expect(biome).toBe('glacier');
  });

  it('returns temperate_forest for lowland elevation, moderate moisture, temperate temp', () => {
    // Lowland (0.35) avoids mid-elevation forested hills zone
    const biome = classifyBiome(0.35, 0.35, 0.55);
    expect(biome).toBe('temperate_forest');
  });

  it('returns forested_hills for mid-elevation, moderate moisture, cool temp', () => {
    const biome = classifyBiome(0.45, 0.35, 0.60);
    expect(biome).toBe('forested_hills');
  });

  it('returns forested_hills for mid-elevation, high moisture, hot temp', () => {
    const biome = classifyBiome(0.50, 0.65, 0.75);
    expect(biome).toBe('forested_hills');
  });

  it('returns broken_lands for dry lowland with moderate-hot temp', () => {
    const biome = classifyBiome(0.35, 0.55, 0.15);
    expect(biome).toBe('broken_lands');
  });

  it('returns tundra for any elevation with frozen temperature', () => {
    const biome = classifyBiome(0.3, 0.1, 0.4);
    expect(biome).toBe('tundra');
  });

  it('is deterministic for volcano classification (no Math.random)', () => {
    // Same inputs must always produce the same output
    const results = Array.from({ length: 10 }, () =>
      classifyBiome(0.9, 0.8, 0.5)
    );
    const allSame = results.every(r => r === results[0]);
    expect(allSame).toBe(true);
  });
});

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

  it('returns deciduous_forest for moderate elevation, moderate moisture, temperate temp', () => {
    const biome = classifyBiome(0.45, 0.45, 0.65);
    expect(biome).toBe('deciduous_forest');
  });

  it('returns tundra for any elevation with frozen temperature', () => {
    const biome = classifyBiome(0.3, 0.1, 0.4);
    expect(biome).toBe('tundra');
  });
});

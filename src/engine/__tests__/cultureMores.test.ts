import { describe, it, expect } from 'vitest';
import { composeCultureMores } from '../cultureMores';
import type { CultureIdentity } from '../../types/culture';

/** Minimal identity stub for testing. */
function makeIdentity(overrides: Partial<CultureIdentity> = {}): CultureIdentity {
  return {
    foundationBias: 'chaos',
    veneratedSpheres: ['force'],
    primaryBiome: 'grassland',
    preferredBiomes: ['grassland', 'farmland', 'savanna'],
    toleratedBiomes: ['steppe', 'hills'],
    archetypeLabel: 'The Storm Raiders',
    socialStructure: 'Fluid hierarchy; power earned and contested',
    accountability: 'Personal honor; challenges determine status',
    behavioralKeywords: ['shifting', 'storm-born', 'untamed', 'rebellious'],
    materialVocabulary: ['heavy metals', 'war trophies', 'scarred wood', 'battle standards', 'tempered steel'],
    metaphorPalette: ['the sea of grass', 'winds that carry whispers'],
    formativeTraitSeedIds: [],
    behavioralTraitSeedIds: [],
    reachPreferences: { iron: 0.5, gold: 0.3, shadow: 0.2, veil: 0, heart: 0, eye: 0, star: 0, stone: 0 },
    ...overrides,
  } as CultureIdentity;
}

describe('composeCultureMores', () => {
  it('returns prose for a valid chaos+force identity', () => {
    const prose = composeCultureMores(makeIdentity(), 42);
    expect(prose).toBeTruthy();
    expect(prose!.length).toBeGreaterThan(100);
  });

  it('returns prose for all four foundations', () => {
    for (const foundation of ['chaos', 'order', 'light', 'darkness']) {
      const prose = composeCultureMores(makeIdentity({ foundationBias: foundation }), 42);
      expect(prose, `${foundation} should produce prose`).toBeTruthy();
    }
  });

  it('returns prose for all eight spheres', () => {
    const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'] as const;
    for (const sphere of spheres) {
      const prose = composeCultureMores(makeIdentity({ veneratedSpheres: [sphere] }), 42);
      expect(prose, `${sphere} should produce prose`).toBeTruthy();
    }
  });

  it('is deterministic — same seed = same output', () => {
    const identity = makeIdentity();
    const a = composeCultureMores(identity, 123);
    const b = composeCultureMores(identity, 123);
    expect(a).toBe(b);
  });

  it('different seeds can produce different output', () => {
    const identity = makeIdentity();
    const results = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const prose = composeCultureMores(identity, seed);
      if (prose) results.add(prose);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('fills material slots with actual vocabulary', () => {
    // Force a sphere with material slots (spirit always has them in sentence 1)
    const identity = makeIdentity({
      veneratedSpheres: ['spirit'],
      materialVocabulary: ['incense', 'crystal', 'prayer beads', 'spirit masks'],
    });
    // Try many seeds to find one that uses a material-slot template
    let foundMaterial = false;
    for (let seed = 0; seed < 100; seed++) {
      const prose = composeCultureMores(identity, seed);
      if (prose && (prose.includes('incense') || prose.includes('crystal') || prose.includes('prayer beads') || prose.includes('spirit masks'))) {
        foundMaterial = true;
        break;
      }
    }
    expect(foundMaterial).toBe(true);
  });

  it('returns null for missing foundationBias', () => {
    const prose = composeCultureMores(makeIdentity({ foundationBias: '' }), 42);
    expect(prose).toBeNull();
  });

  it('returns foundation-only prose when sphere is missing', () => {
    const prose = composeCultureMores(makeIdentity({ veneratedSpheres: [] }), 42);
    expect(prose).toBeTruthy();
    // Should be shorter (no sphere sentence appended)
    const full = composeCultureMores(makeIdentity(), 42);
    expect(prose!.length).toBeLessThan(full!.length);
  });

  it('starts with "Here" or "In this"', () => {
    for (const foundation of ['chaos', 'order', 'light', 'darkness']) {
      for (let seed = 0; seed < 10; seed++) {
        const prose = composeCultureMores(makeIdentity({ foundationBias: foundation }), seed);
        expect(
          prose!.startsWith('Here') || prose!.startsWith('In this'),
          `"${prose!.substring(0, 30)}..." should start with "Here" or "In this"`,
        ).toBe(true);
      }
    }
  });
});

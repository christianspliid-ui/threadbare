import { describe, it, expect } from 'vitest';
import {
  culturalGravity,
  CulturalSignature,
  extractCultureSignature,
  extractAmbitionSignature,
  GRAVITY_SPHERE_WEIGHT,
  GRAVITY_REACH_WEIGHT,
  GRAVITY_FOUNDATION_WEIGHT,
} from '../culturalGravity';
import type { CultureIdentity } from '../../types/culture';
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';

function emptyReaches(): Record<ReachDomain, number> {
  return Object.fromEntries(REACH_DOMAINS.map((d) => [d, 0])) as Record<ReachDomain, number>;
}

function makeSignature(
  overrides: Partial<CulturalSignature> = {},
): CulturalSignature {
  return {
    spheres: [],
    reaches: emptyReaches(),
    foundation: undefined,
    ...overrides,
  };
}

describe('culturalGravity', () => {
  it('returns 0 for two empty signatures', () => {
    const a = makeSignature();
    const b = makeSignature();
    expect(culturalGravity(a, b)).toBe(0);
  });

  it('is positive for shared spheres', () => {
    const a = makeSignature({ spheres: ['life', 'force'] });
    const b = makeSignature({ spheres: ['life', 'mind'] });
    expect(culturalGravity(a, b)).toBeGreaterThan(0);
  });

  it('is negative for opposing spheres (life vs entropy)', () => {
    const a = makeSignature({ spheres: ['life'] });
    const b = makeSignature({ spheres: ['entropy'] });
    expect(culturalGravity(a, b)).toBeLessThan(0);
  });

  it('is positive for aligned reach vectors', () => {
    const reaches: Record<ReachDomain, number> = {
      ...emptyReaches(),
      iron: 1,
      gold: 0.5,
    };
    const a = makeSignature({ reaches });
    const b = makeSignature({ reaches });
    expect(culturalGravity(a, b)).toBeGreaterThan(0);
  });

  it('is negative for opposed reach vectors', () => {
    const reachesA: Record<ReachDomain, number> = {
      ...emptyReaches(),
      iron: 1,
      gold: -1,
    };
    const reachesB: Record<ReachDomain, number> = {
      ...emptyReaches(),
      iron: -1,
      gold: 1,
    };
    const a = makeSignature({ reaches: reachesA });
    const b = makeSignature({ reaches: reachesB });
    expect(culturalGravity(a, b)).toBeLessThan(0);
  });

  it('is positive for same foundation', () => {
    const a = makeSignature({ foundation: 'Chaos' });
    const b = makeSignature({ foundation: 'Chaos' });
    expect(culturalGravity(a, b)).toBeGreaterThan(0);
  });

  it('is negative for opposing foundations (chaos vs order)', () => {
    const a = makeSignature({ foundation: 'Chaos' });
    const b = makeSignature({ foundation: 'Order' });
    expect(culturalGravity(a, b)).toBeLessThan(0);
  });

  it('returns 0 for missing foundation on one side', () => {
    const a = makeSignature({ foundation: 'Chaos' });
    const b = makeSignature({ foundation: undefined });
    // Foundation component is 0, others are 0 with empty spheres/reaches
    expect(culturalGravity(a, b)).toBe(0);
  });

  it('result is always in [-1, 1]', () => {
    // Maximally aligned
    const aligned = makeSignature({
      spheres: ['life', 'force', 'matter', 'energy'],
      reaches: { iron: 1, gold: 1, shadow: 1, veil: 1, heart: 1, eye: 1, stone: 1, star: 1 },
      foundation: 'Chaos',
    });
    expect(culturalGravity(aligned, aligned)).toBeGreaterThanOrEqual(-1);
    expect(culturalGravity(aligned, aligned)).toBeLessThanOrEqual(1);

    // Maximally opposed
    const a = makeSignature({
      spheres: ['life', 'force'],
      reaches: { iron: 1, gold: 1, shadow: 1, veil: 1, heart: 1, eye: 1, stone: 1, star: 1 },
      foundation: 'Chaos',
    });
    const b = makeSignature({
      spheres: ['entropy', 'mind'],
      reaches: { iron: -1, gold: -1, shadow: -1, veil: -1, heart: -1, eye: -1, stone: -1, star: -1 },
      foundation: 'Order',
    });
    expect(culturalGravity(a, b)).toBeGreaterThanOrEqual(-1);
    expect(culturalGravity(a, b)).toBeLessThanOrEqual(1);
  });

  it('is symmetric: gravity(a,b) === gravity(b,a)', () => {
    const a = makeSignature({
      spheres: ['life', 'force'],
      reaches: { ...emptyReaches(), iron: 0.8, gold: 0.3 },
      foundation: 'Chaos',
    });
    const b = makeSignature({
      spheres: ['entropy', 'mind'],
      reaches: { ...emptyReaches(), iron: -0.2, shadow: 0.9 },
      foundation: 'Order',
    });
    expect(culturalGravity(a, b)).toBe(culturalGravity(b, a));
  });
});

describe('extractCultureSignature', () => {
  it('correctly maps CultureIdentity fields', () => {
    const identity: CultureIdentity = {
      foundationBias: 'Order',
      veneratedSpheres: ['life', 'spirit'],
      primaryBiome: 'temperate_forest',
      socialStructure: 'tribal',
      accountability: 'collective',
      behavioralKeywords: ['stoic'],
      materialVocabulary: ['bone'],
      metaphorPalette: ['root'],
      formativeTraitSeedIds: [],
      behavioralTraitSeedIds: [],
      reachPreferences: {
        iron: 0.2, gold: 0.5, shadow: 0, veil: 0.1, heart: 0.8,
        eye: 0.3, stone: 0.4, star: 0.6,
      },
    };

    const sig = extractCultureSignature(identity);
    expect(sig.spheres).toEqual(['life', 'spirit']);
    expect(sig.reaches).toEqual(identity.reachPreferences);
    expect(sig.foundation).toBe('Order');
  });
});

describe('extractAmbitionSignature', () => {
  it('fills missing reaches with 0', () => {
    const template = {
      sphereAffinities: ['force', 'matter'] as const,
      reachAffinity: { iron: 0.5, gold: 0.3 } as Partial<Record<ReachDomain, number>>,
    };

    const sig = extractAmbitionSignature(template);
    expect(sig.spheres).toEqual(['force', 'matter']);
    expect(sig.reaches.iron).toBe(0.5);
    expect(sig.reaches.gold).toBe(0.3);
    expect(sig.reaches.shadow).toBe(0);
    expect(sig.reaches.veil).toBe(0);
    expect(sig.foundation).toBeUndefined();
  });
});

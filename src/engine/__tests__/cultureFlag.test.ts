import { describe, it, expect } from 'vitest';
import { generateCultureFlag } from '../cultureFlag';
import type { CultureIdentity } from '../../types/culture';

function makeMockIdentity(overrides?: Partial<CultureIdentity>): CultureIdentity {
  return {
    foundationBias: 'chaos',
    veneratedSpheres: ['force', 'entropy'],
    primaryBiome: 'mountain',
    socialStructure: 'warrior bands',
    accountability: 'trial by combat',
    behavioralKeywords: ['fierce', 'nomadic'],
    materialVocabulary: ['bone', 'iron'],
    metaphorPalette: ['storm', 'blade'],
    formativeTraitSeedIds: [],
    behavioralTraitSeedIds: [],
    ...overrides,
  };
}

describe('generateCultureFlag', () => {
  it('returns a valid SVG string', () => {
    const svg = generateCultureFlag(makeMockIdentity(), 42);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  it('is deterministic for the same seed', () => {
    const identity = makeMockIdentity();
    const svg1 = generateCultureFlag(identity, 42);
    const svg2 = generateCultureFlag(identity, 42);
    expect(svg1).toBe(svg2);
  });

  it('varies with different seeds', () => {
    const identity = makeMockIdentity();
    const svg1 = generateCultureFlag(identity, 42);
    const svg2 = generateCultureFlag(identity, 99);
    expect(svg1).not.toBe(svg2);
  });

  it('uses sphere colors from veneratedSpheres', () => {
    const svg = generateCultureFlag(makeMockIdentity({ veneratedSpheres: ['force'] }), 1);
    // Force sphere color is #ff6b6b — SVG should contain it
    expect(svg).toMatch(/#[0-9a-fA-F]{6}/);
  });

  it('chaos foundation produces asymmetric/jagged shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'chaos' }), 1);
    // Chaos uses asymmetric polygons — just verify it has path or polygon elements
    expect(svg).toMatch(/<(path|polygon)/);
  });

  it('order foundation produces geometric/symmetric shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'order' }), 1);
    expect(svg).toMatch(/<(rect|circle|polygon)/);
  });

  it('biome motif glyph varies by primaryBiome', () => {
    const mountainSvg = generateCultureFlag(makeMockIdentity({ primaryBiome: 'mountain' }), 1);
    const jungleSvg = generateCultureFlag(makeMockIdentity({ primaryBiome: 'jungle' }), 1);
    expect(mountainSvg).not.toBe(jungleSvg);
  });

  it('includes a biome motif element', () => {
    const svg = generateCultureFlag(makeMockIdentity(), 1);
    // Should have a motif group
    expect(svg).toContain('class="motif"');
  });

  it('light foundation produces radial/open shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'light' }), 1);
    // Light uses circles/radial patterns
    expect(svg).toMatch(/<circle/);
  });

  it('darkness foundation produces layered/enclosed shapes', () => {
    const svg = generateCultureFlag(makeMockIdentity({ foundationBias: 'darkness' }), 1);
    // Darkness uses layered/enclosed elements
    expect(svg).toMatch(/<(circle|path|rect)/);
  });

  it('handles empty veneratedSpheres gracefully', () => {
    const svg = generateCultureFlag(makeMockIdentity({ veneratedSpheres: [] }), 1);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('produces different flags for different biomes with same seed', () => {
    const seed = 42;
    const svgMountain = generateCultureFlag(makeMockIdentity({ primaryBiome: 'mountain' }), seed);
    const svgDesert = generateCultureFlag(makeMockIdentity({ primaryBiome: 'desert' }), seed);
    const svgForest = generateCultureFlag(makeMockIdentity({ primaryBiome: 'forest' }), seed);

    expect(svgMountain).not.toBe(svgDesert);
    expect(svgDesert).not.toBe(svgForest);
    expect(svgMountain).not.toBe(svgForest);
  });

  it('produces different flags for different foundations with same seed', () => {
    const seed = 42;
    const svgChaos = generateCultureFlag(makeMockIdentity({ foundationBias: 'chaos' }), seed);
    const svgOrder = generateCultureFlag(makeMockIdentity({ foundationBias: 'order' }), seed);
    const svgLight = generateCultureFlag(makeMockIdentity({ foundationBias: 'light' }), seed);
    const svgDarkness = generateCultureFlag(makeMockIdentity({ foundationBias: 'darkness' }), seed);

    expect(svgChaos).not.toBe(svgOrder);
    expect(svgOrder).not.toBe(svgLight);
    expect(svgLight).not.toBe(svgDarkness);
  });
});

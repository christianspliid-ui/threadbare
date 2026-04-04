import { describe, it, expect } from 'vitest';
import { buildCoatOfArmsConfig, generateCoatOfArmsSvg } from '../CoatOfArms';
import type { CoatOfArmsConfig } from '../CoatOfArms';
import type { FactionDefinition } from '../../../types/faction';
import { SMALL_SIZE_THRESHOLD } from '../constants';

// ─── Minimal mock faction factory ─────────────────────────────────────────────

function mockFaction(overrides: Partial<FactionDefinition> = {}): FactionDefinition {
  return {
    id: 'test_faction',
    nameTemplate: 'The Test Faction',
    description: 'A test faction',
    iconGlyph: '⚔',
    themeColor: '#ff0000',
    factionType: 'military',
    reachWeights: { iron: 0.8, stone: 0.6 },
    locationTypes: [],
    rankTiers: [],
    reputationDecayPerTick: 0.01,
    joinEncounterTemplateId: 'join_military',
    promotionEncounterTemplateId: 'promote_military',
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [],
    ...overrides,
  };
}

// ─── buildCoatOfArmsConfig ────────────────────────────────────────────────────

describe('buildCoatOfArmsConfig', () => {
  it('derives dominant reach from highest reachWeights entry', () => {
    const def = mockFaction({ reachWeights: { iron: 0.9, gold: 0.3, shadow: 0.1 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('iron');
    expect(config.dominantSphere).toBe('force');
    expect(config.foundationSphere).toBe('chaos');
  });

  it('maps sphere and foundation correctly for gold reach', () => {
    const def = mockFaction({ reachWeights: { gold: 1.0 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('gold');
    expect(config.dominantSphere).toBe('life');
    expect(config.foundationSphere).toBe('order');
  });

  it('detects secondary reach when within 20% of dominant', () => {
    // (0.8 - 0.7) / 0.8 = 0.125 <= 0.2 → secondary present
    const def = mockFaction({ reachWeights: { iron: 0.8, stone: 0.7 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('iron');
    expect(config.secondaryReach).toBe('stone');
  });

  it('does not set secondary reach when more than 20% below dominant', () => {
    // (0.8 - 0.5) / 0.8 = 0.375 > 0.2 → no secondary
    const def = mockFaction({ reachWeights: { iron: 0.8, stone: 0.5 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('iron');
    expect(config.secondaryReach).toBeUndefined();
  });

  it('returns null dominantReach when reachWeights is empty', () => {
    const def = mockFaction({ reachWeights: {} });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBeNull();
    expect(config.dominantSphere).toBeNull();
    expect(config.foundationSphere).toBeNull();
  });

  it('uses fallbackGlyph parameter if provided', () => {
    const def = mockFaction({ reachWeights: {} });
    const config = buildCoatOfArmsConfig(def, '★');
    expect(config.fallbackGlyph).toBe('★');
  });

  it('falls back to def.iconGlyph when no explicit fallbackGlyph', () => {
    const def = mockFaction({ reachWeights: {}, iconGlyph: '🏰' });
    const config = buildCoatOfArmsConfig(def);
    expect(config.fallbackGlyph).toBe('🏰');
  });

  it('sets factionType from definition', () => {
    const def = mockFaction({ factionType: 'religious' });
    const config = buildCoatOfArmsConfig(def);
    expect(config.factionType).toBe('religious');
  });

  it('respects prominenceLevel parameter', () => {
    const def = mockFaction();
    const config = buildCoatOfArmsConfig(def, undefined, 'dominant');
    expect(config.prominenceLevel).toBe('dominant');
  });

  it('defaults prominenceLevel to base', () => {
    const def = mockFaction();
    const config = buildCoatOfArmsConfig(def);
    expect(config.prominenceLevel).toBe('base');
  });

  it('exact 20% difference qualifies as secondary', () => {
    // (1.0 - 0.8) / 1.0 = 0.2 exactly → should be included
    const def = mockFaction({ reachWeights: { iron: 1.0, gold: 0.8 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.secondaryReach).toBe('gold');
  });
});

// ─── generateCoatOfArmsSvg ────────────────────────────────────────────────────

function makeConfig(overrides: Partial<CoatOfArmsConfig> = {}): CoatOfArmsConfig {
  return {
    factionType: 'military',
    dominantReach: 'iron',
    secondaryReach: undefined,
    dominantSphere: 'force',
    foundationSphere: 'chaos',
    prominenceLevel: 'base',
    ...overrides,
  };
}

describe('generateCoatOfArmsSvg', () => {
  it('returns a valid SVG string', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('</svg>');
  });

  it('sets width and height attributes from size', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    expect(svg).toContain('width="64"');
    // height = 64 * 150 / 120 = 80
    expect(svg).toContain('height="80"');
  });

  it('uses 0 0 120 150 viewBox', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    expect(svg).toContain('viewBox="0 0 120 150"');
  });

  it('contains shield path', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    // Shield path starts with M10,8
    expect(svg).toContain('M10,8');
  });

  it('contains division rects for military (per_pale)', () => {
    const svg = generateCoatOfArmsSvg(makeConfig({ factionType: 'military' }), 64);
    expect(svg).toContain('<rect');
  });

  it('contains a charge group element', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    expect(svg).toContain('<g transform=');
  });

  it('renders fallback with text glyph when no dominantReach', () => {
    const config = makeConfig({
      dominantReach: null,
      dominantSphere: null,
      foundationSphere: null,
      fallbackGlyph: '?',
      fallbackColor: '#123456',
    });
    const svg = generateCoatOfArmsSvg(config, 64);
    expect(svg).toContain('<text');
    expect(svg).toContain('?');
    expect(svg).toContain('#123456');
  });

  it('omits secondary charge when size is below SMALL_SIZE_THRESHOLD', () => {
    const config = makeConfig({ secondaryReach: 'stone' });
    const size = SMALL_SIZE_THRESHOLD - 1;
    // At small size, only one charge group should appear at the default position
    const svg = generateCoatOfArmsSvg(config, size);
    // Secondary charge is at cy=115; primary at cy=75
    expect(svg).not.toContain('translate(60,115)');
  });

  it('includes secondary charge when size >= SMALL_SIZE_THRESHOLD', () => {
    const config = makeConfig({ secondaryReach: 'stone' });
    const svg = generateCoatOfArmsSvg(config, SMALL_SIZE_THRESHOLD);
    expect(svg).toContain('translate(60,115)');
  });

  it('each factionType produces a different division pattern', () => {
    const types = ['military', 'guild', 'religious', 'political', 'criminal', 'monster'] as const;
    const svgs = types.map(ft => generateCoatOfArmsSvg(makeConfig({ factionType: ft }), 64));
    const unique = new Set(svgs);
    expect(unique.size).toBe(types.length);
  });

  it('different prominenceLevels produce different borders', () => {
    const base = generateCoatOfArmsSvg(makeConfig({ prominenceLevel: 'base' }), 64);
    const established = generateCoatOfArmsSvg(makeConfig({ prominenceLevel: 'established' }), 64);
    const dominant = generateCoatOfArmsSvg(makeConfig({ prominenceLevel: 'dominant' }), 64);
    expect(base).not.toBe(established);
    expect(established).not.toBe(dominant);
  });

  it('contains clipPath defs block', () => {
    const svg = generateCoatOfArmsSvg(makeConfig(), 64);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<clipPath');
  });
});

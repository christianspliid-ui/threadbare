import { describe, it, expect } from 'vitest';
import { buildCoatOfArmsConfig, generateCoatOfArmsSvg } from '../CoatOfArms';
import type { CoatOfArmsConfig } from '../CoatOfArms';
import type { FactionDefinition } from '../../../types/faction';
import { SMALL_SIZE_THRESHOLD, SPHERE_COLORS, REACH_TO_SPHERE } from '../constants';
import { tinctureLuminance } from '../heraldry/tinctures';

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

  it('marks a secondary reach within 20% of dominant as close', () => {
    // (0.8 - 0.7) / 0.8 = 0.125 <= 0.2 → rivals the dominant
    const def = mockFaction({ reachWeights: { iron: 0.8, stone: 0.7 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('iron');
    expect(config.secondaryReach).toBe('stone');
    expect(config.secondaryIsClose).toBe(true);
  });

  it('still carries a secondary reach more than 20% below dominant, marked distant', () => {
    // (0.8 - 0.5) / 0.8 = 0.375 > 0.2. Pre-THR-854 this dropped the second
    // domain entirely; it is now carried and drawn subordinate, because
    // discarding it collapsed the shield to (dominant, factionType) and made
    // identical heraldry inevitable for any two factions sharing those.
    const def = mockFaction({ reachWeights: { iron: 0.8, stone: 0.5 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.dominantReach).toBe('iron');
    expect(config.secondaryReach).toBe('stone');
    expect(config.secondaryIsClose).toBe(false);
  });

  it('carries the third-ranked reach as the bordure charge', () => {
    const def = mockFaction({ reachWeights: { iron: 0.9, stone: 0.6, gold: 0.4, veil: 0.1 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.tertiaryReach).toBe('gold');
  });

  it('leaves tertiary reach undefined for a faction with fewer than three reaches', () => {
    const def = mockFaction({ reachWeights: { iron: 0.9, stone: 0.6 } });
    expect(buildCoatOfArmsConfig(def).tertiaryReach).toBeUndefined();
  });

  it('treats an all-zero reach profile as rivalling rather than NaN-distant', () => {
    // Fail-soft (NFP #4): relDiff would be 0/0 = NaN, and `NaN <= 0.2` is false,
    // which would read as a deliberate "distant" verdict rather than a
    // degenerate profile.
    const def = mockFaction({ reachWeights: { iron: 0, stone: 0 } });
    expect(buildCoatOfArmsConfig(def).secondaryIsClose).toBe(true);
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

  it('exact 20% difference counts as close, not distant', () => {
    // (1.0 - 0.8) / 1.0 = 0.2 exactly → boundary is inclusive
    const def = mockFaction({ reachWeights: { iron: 1.0, gold: 0.8 } });
    const config = buildCoatOfArmsConfig(def);
    expect(config.secondaryReach).toBe('gold');
    expect(config.secondaryIsClose).toBe(true);
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

  // ─── THR-854: the two differencing axes ─────────────────────────────────────

  it('draws a distant secondary charge smaller and dimmer than a close one', () => {
    const close = generateCoatOfArmsSvg(
      makeConfig({ secondaryReach: 'stone', secondaryIsClose: true }),
      64,
    );
    const distant = generateCoatOfArmsSvg(
      makeConfig({ secondaryReach: 'stone', secondaryIsClose: false }),
      64,
    );
    expect(close).not.toBe(distant);
    // Both still NAME the second domain — the distinction is weight, not presence.
    expect(close).toContain('translate(60,115)');
    expect(distant).toContain('translate(60,115)');
    expect(distant).toContain('opacity=');
    expect(close).not.toContain('opacity=');
  });

  it('reads an absent secondaryIsClose as close, preserving pre-THR-854 output', () => {
    // Additive-change guard (NFP #6): a config built by hand before this field
    // existed must render byte-identically to one that opts in explicitly.
    // Both calls must seed the clip id — the default is a module counter, so
    // two unseeded calls differ on that alone and would never compare equal.
    const implicit = generateCoatOfArmsSvg(makeConfig({ secondaryReach: 'stone' }), 64, 'seed');
    const explicit = generateCoatOfArmsSvg(
      makeConfig({ secondaryReach: 'stone', secondaryIsClose: true }),
      64,
      'seed',
    );
    expect(implicit).toBe(explicit);
  });

  it('colours the bordure from the tertiary reach when there is one', () => {
    const without = generateCoatOfArmsSvg(makeConfig(), 64);
    const withTertiary = generateCoatOfArmsSvg(makeConfig({ tertiaryReach: 'gold' }), 64);
    expect(without).not.toBe(withTertiary);
    // gold → life sphere. Its colour must reach the border stroke.
    expect(withTertiary).toContain(`stroke="${SPHERE_COLORS[REACH_TO_SPHERE.gold]}"`);
  });

  it('falls back to the dominant charge colour when there is no tertiary reach', () => {
    const svg = generateCoatOfArmsSvg(makeConfig({ tertiaryReach: undefined }), 64);
    // iron → force sphere, used for both the primary charge and the border.
    expect(svg).toContain(`stroke="${SPHERE_COLORS[REACH_TO_SPHERE.iron]}"`);
  });

  it('keeps the bordure luminous whichever reach colours it', () => {
    // THR-638 crushed the shield field into the world's dark value range, so a
    // dim border would lose the silhouette against a dark surface. Moving the
    // border onto the tertiary reach must not reintroduce that risk — assert
    // the property for EVERY reach rather than trusting that the palette is
    // uniformly bright, since this is the constraint the change puts at stake
    // and it cannot be eyeballed in an unattended run.
    const FIELD_LUMINANCE_CEILING = tinctureLuminance('#3e3925'); // brightest crushed field
    for (const reach of Object.keys(REACH_TO_SPHERE) as (keyof typeof REACH_TO_SPHERE)[]) {
      const borderColor = SPHERE_COLORS[REACH_TO_SPHERE[reach]];
      expect(
        tinctureLuminance(borderColor),
        `${reach} bordure must out-shine the field`,
      ).toBeGreaterThan(FIELD_LUMINANCE_CEILING);
    }
  });
});

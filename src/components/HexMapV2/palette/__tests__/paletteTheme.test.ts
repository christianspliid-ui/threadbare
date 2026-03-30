import { describe, it, expect } from 'vitest';
import {
  GOLDEN_HOUR,
  DARK_PARCHMENT,
  PALETTE_THEMES,
  DEFAULT_PALETTE_THEME_ID,
  resolvePaletteThemeId,
  type PaletteTheme,
} from '../paletteTheme';

describe('paletteTheme', () => {
  it('golden-hour is the default theme', () => {
    expect(DEFAULT_PALETTE_THEME_ID).toBe('golden-hour');
  });

  it('both themes exist in PALETTE_THEMES registry', () => {
    expect(PALETTE_THEMES['golden-hour']).toBe(GOLDEN_HOUR);
    expect(PALETTE_THEMES['dark-parchment']).toBe(DARK_PARCHMENT);
  });

  it('each theme has a valid id matching its registry key', () => {
    for (const [key, theme] of Object.entries(PALETTE_THEMES)) {
      expect(theme.id).toBe(key);
    }
  });

  it('each theme has all required color fields', () => {
    const requiredFields: (keyof PaletteTheme)[] = [
      'id', 'displayName',
      'sceneBackground', 'roadMajor', 'roadTrail',
      'borderColor', 'capitalColor', 'capitalRingColor',
      'gridLineColor', 'elevationTickColor', 'fogUnexploredColor',
      'labelLandColor', 'labelRiverColor', 'labelLocationColor',
      'labelHaloColor', 'labelHaloOpacity', 'labelHaloOpacityOuter',
    ];

    for (const theme of Object.values(PALETTE_THEMES)) {
      for (const field of requiredFields) {
        expect(theme[field], `${theme.id}.${field}`).toBeDefined();
      }
    }
  });

  it('hex color strings match #RRGGBB format', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const theme of Object.values(PALETTE_THEMES)) {
      expect(theme.roadMajor, `${theme.id}.roadMajor`).toMatch(hexPattern);
      expect(theme.roadTrail, `${theme.id}.roadTrail`).toMatch(hexPattern);
      expect(theme.capitalRingColor, `${theme.id}.capitalRingColor`).toMatch(hexPattern);
      expect(theme.fogUnexploredColor, `${theme.id}.fogUnexploredColor`).toMatch(hexPattern);
    }
  });

  it('opacity values are in [0, 1]', () => {
    for (const theme of Object.values(PALETTE_THEMES)) {
      expect(theme.labelHaloOpacity).toBeGreaterThanOrEqual(0);
      expect(theme.labelHaloOpacity).toBeLessThanOrEqual(1);
      expect(theme.labelHaloOpacityOuter).toBeGreaterThanOrEqual(0);
      expect(theme.labelHaloOpacityOuter).toBeLessThanOrEqual(1);
    }
  });

  it('themes are visually distinct (scene backgrounds differ)', () => {
    expect(GOLDEN_HOUR.sceneBackground).not.toBe(DARK_PARCHMENT.sceneBackground);
  });

  it('dark-parchment has terrain overrides for all base terrain types', () => {
    const overrides = DARK_PARCHMENT.terrainOverrides;
    // Should have at least 20 terrain type overrides for a visible difference
    expect(Object.keys(overrides).length).toBeGreaterThanOrEqual(20);
  });

  it('dark-parchment has water overrides for all water types', () => {
    const overrides = DARK_PARCHMENT.waterOverrides;
    expect(overrides['ocean']).toBeDefined();
    expect(overrides['deep_ocean']).toBeDefined();
    expect(overrides['shallows']).toBeDefined();
    expect(overrides['lake']).toBeDefined();
    expect(overrides['river']).toBeDefined();
  });

  it('golden-hour has empty overrides (uses base palettes)', () => {
    expect(Object.keys(GOLDEN_HOUR.terrainOverrides).length).toBe(0);
    expect(Object.keys(GOLDEN_HOUR.waterOverrides).length).toBe(0);
  });
});

describe('resolvePaletteThemeId', () => {
  it('resolves valid theme IDs', () => {
    expect(resolvePaletteThemeId('golden-hour')).toBe('golden-hour');
    expect(resolvePaletteThemeId('dark-parchment')).toBe('dark-parchment');
  });

  it('falls back to default for null/undefined', () => {
    expect(resolvePaletteThemeId(null)).toBe('golden-hour');
    expect(resolvePaletteThemeId(undefined)).toBe('golden-hour');
  });

  it('falls back to default for unknown IDs (NFP #4: fail-soft)', () => {
    expect(resolvePaletteThemeId('neon-pink')).toBe('golden-hour');
    expect(resolvePaletteThemeId('')).toBe('golden-hour');
  });
});

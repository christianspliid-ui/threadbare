import { describe, it, expect } from 'vitest';
import {
  ZOOM_TIER_THRESHOLDS,
  ZOOM_VISIBILITY_MATRIX,
  getZoomTier,
  getFadeAlpha,
  FADE_RANGE,
} from '../ZoomVisibilityMatrix';
import type { ZoomTier } from '../ZoomVisibilityMatrix';

describe('ZOOM_TIER_THRESHOLDS', () => {
  it('has the expected threshold values', () => {
    expect(ZOOM_TIER_THRESHOLDS.HERO_LOCAL).toBe(15);
    expect(ZOOM_TIER_THRESHOLDS.REGIONAL).toBe(5);
    expect(ZOOM_TIER_THRESHOLDS.CONTINENTAL).toBe(1.5);
    expect(ZOOM_TIER_THRESHOLDS.FULL_WORLD).toBe(0);
  });
});

describe('getZoomTier', () => {
  it('returns hero-local at k=15 (at boundary)', () => {
    expect(getZoomTier(15)).toBe('hero-local');
  });

  it('returns regional at k=14.9 (just below hero-local)', () => {
    expect(getZoomTier(14.9)).toBe('regional');
  });

  it('returns regional at k=5 (at boundary)', () => {
    expect(getZoomTier(5)).toBe('regional');
  });

  it('returns continental at k=4.9 (just below regional)', () => {
    expect(getZoomTier(4.9)).toBe('continental');
  });

  it('returns continental at k=1.5 (at boundary)', () => {
    expect(getZoomTier(1.5)).toBe('continental');
  });

  it('returns full-world at k=1.4 (just below continental)', () => {
    expect(getZoomTier(1.4)).toBe('full-world');
  });

  it('returns full-world at k=0.5 (well below continental)', () => {
    expect(getZoomTier(0.5)).toBe('full-world');
  });

  it('returns hero-local at very high k', () => {
    expect(getZoomTier(100)).toBe('hero-local');
  });
});

describe('ZOOM_VISIBILITY_MATRIX — signifiers', () => {
  it('signifiers is true at all tiers', () => {
    const tiers: ZoomTier[] = ['hero-local', 'regional', 'continental', 'full-world'];
    for (const tier of tiers) {
      expect(ZOOM_VISIBILITY_MATRIX.signifiers[tier]).toBe(true);
    }
  });
});

describe('ZOOM_VISIBILITY_MATRIX — agents', () => {
  it('agents_portrait is true at hero-local only (V1 token zoom)', () => {
    expect(ZOOM_VISIBILITY_MATRIX.agents_portrait['hero-local']).toBe(true);
    expect(ZOOM_VISIBILITY_MATRIX.agents_portrait['regional']).toBe(false);
    expect(ZOOM_VISIBILITY_MATRIX.agents_portrait['continental']).toBe(false);
    expect(ZOOM_VISIBILITY_MATRIX.agents_portrait['full-world']).toBe(false);
  });

  it('agents_dot is true at regional and continental (V1 dot behavior)', () => {
    expect(ZOOM_VISIBILITY_MATRIX.agents_dot['regional']).toBe(true);
    expect(ZOOM_VISIBILITY_MATRIX.agents_dot['continental']).toBe(true);
    expect(ZOOM_VISIBILITY_MATRIX.agents_dot['hero-local']).toBe(false);
    expect(ZOOM_VISIBILITY_MATRIX.agents_dot['full-world']).toBe(false);
  });

  it('agents_retinue is true at continental only', () => {
    expect(ZOOM_VISIBILITY_MATRIX.agents_retinue['continental']).toBe(true);
    expect(ZOOM_VISIBILITY_MATRIX.agents_retinue['hero-local']).toBe(false);
    expect(ZOOM_VISIBILITY_MATRIX.agents_retinue['regional']).toBe(false);
    expect(ZOOM_VISIBILITY_MATRIX.agents_retinue['full-world']).toBe(false);
  });
});

describe('ZOOM_VISIBILITY_MATRIX — borders', () => {
  it('borders_domain is true at full-world', () => {
    expect(ZOOM_VISIBILITY_MATRIX.borders_domain['full-world']).toBe(true);
  });

  it('borders_domain is true at all tiers', () => {
    const tiers: ZoomTier[] = ['hero-local', 'regional', 'continental', 'full-world'];
    for (const tier of tiers) {
      expect(ZOOM_VISIBILITY_MATRIX.borders_domain[tier]).toBe(true);
    }
  });
});

describe('ZOOM_VISIBILITY_MATRIX — rivers', () => {
  it('rivers is true at continental', () => {
    expect(ZOOM_VISIBILITY_MATRIX.rivers['continental']).toBe(true);
  });

  it('rivers is false at full-world', () => {
    expect(ZOOM_VISIBILITY_MATRIX.rivers['full-world']).toBe(false);
  });

  it('rivers is true at regional and hero-local', () => {
    expect(ZOOM_VISIBILITY_MATRIX.rivers['regional']).toBe(true);
    expect(ZOOM_VISIBILITY_MATRIX.rivers['hero-local']).toBe(true);
  });
});

describe('ZOOM_VISIBILITY_MATRIX — grid lines', () => {
  it('grid_lines is true at continental', () => {
    expect(ZOOM_VISIBILITY_MATRIX.grid_lines['continental']).toBe(true);
  });

  it('grid_lines is true at regional', () => {
    expect(ZOOM_VISIBILITY_MATRIX.grid_lines['regional']).toBe(true);
  });

  it('grid_lines is true at hero-local', () => {
    expect(ZOOM_VISIBILITY_MATRIX.grid_lines['hero-local']).toBe(true);
  });

  it('grid_lines is true at full-world', () => {
    expect(ZOOM_VISIBILITY_MATRIX.grid_lines['full-world']).toBe(true);
  });
});

describe('ZOOM_VISIBILITY_MATRIX — events', () => {
  it('events is true at hero-local', () => {
    expect(ZOOM_VISIBILITY_MATRIX.events['hero-local']).toBe(true);
  });

  it('events is false at regional', () => {
    expect(ZOOM_VISIBILITY_MATRIX.events['regional']).toBe(false);
  });

  it('events is false at continental', () => {
    expect(ZOOM_VISIBILITY_MATRIX.events['continental']).toBe(false);
  });

  it('events is false at full-world', () => {
    expect(ZOOM_VISIBILITY_MATRIX.events['full-world']).toBe(false);
  });
});

describe('ZOOM_VISIBILITY_MATRIX — completeness', () => {
  const TIERS: ZoomTier[] = ['hero-local', 'regional', 'continental', 'full-world'];

  it('has at least 12 layer keys', () => {
    const keys = Object.keys(ZOOM_VISIBILITY_MATRIX);
    expect(keys.length).toBeGreaterThanOrEqual(12);
  });

  it('every layer key has all 4 tier entries', () => {
    for (const [layer, tierMap] of Object.entries(ZOOM_VISIBILITY_MATRIX)) {
      for (const tier of TIERS) {
        expect(
          typeof tierMap[tier],
          `Layer "${layer}" missing entry for tier "${tier}"`,
        ).toBe('boolean');
      }
    }
  });
});

describe('getFadeAlpha', () => {
  it('returns value between 0 and 1 in the overlap zone (k=4.5, threshold=5, fadeRange=1.0)', () => {
    const alpha = getFadeAlpha(4.5, 5, 1.0);
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);
  });

  it('returns 1.0 when k is above threshold+range (k=6, threshold=5, fadeRange=1.0)', () => {
    expect(getFadeAlpha(6, 5, 1.0)).toBe(1.0);
  });

  it('returns 0.0 when k is below threshold-range (k=3, threshold=5, fadeRange=1.0)', () => {
    expect(getFadeAlpha(3, 5, 1.0)).toBe(0.0);
  });

  it('returns 0.5 at exactly the threshold (midpoint of fade zone)', () => {
    const alpha = getFadeAlpha(5, 5, 1.0);
    expect(alpha).toBeCloseTo(0.5, 5);
  });

  it('returns 0.0 at exactly threshold-range boundary', () => {
    expect(getFadeAlpha(4, 5, 1.0)).toBe(0.0);
  });

  it('returns 1.0 at exactly threshold+range boundary', () => {
    expect(getFadeAlpha(6, 5, 1.0)).toBe(1.0);
  });

  it('clamps to 0 for very low k values', () => {
    expect(getFadeAlpha(0, 5, 1.0)).toBe(0.0);
  });

  it('clamps to 1 for very high k values', () => {
    expect(getFadeAlpha(100, 5, 1.0)).toBe(1.0);
  });
});

describe('FADE_RANGE', () => {
  it('is a positive number', () => {
    expect(typeof FADE_RANGE).toBe('number');
    expect(FADE_RANGE).toBeGreaterThan(0);
  });

  it('equals 0.2', () => {
    expect(FADE_RANGE).toBe(0.2);
  });
});

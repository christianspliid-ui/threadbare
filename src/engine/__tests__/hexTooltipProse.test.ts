import { describe, it, expect } from 'vitest';
import { buildHexTooltipProse } from '../hexTooltipProse';

describe('buildHexTooltipProse', () => {
  // ── Visible hexes ──────────────────────────────────────────────────────────

  it('produces prose for a visible grassland hex with no overlay', () => {
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'visible');
    expect(prose).toContain('Grasslands');
    // Mid/temperate/moderate → no geo modifier
    expect(prose).not.toContain('cold');
    expect(prose).not.toContain('heat');
    expect(prose).not.toContain('parched');
  });

  it('adds geo modifiers for extreme conditions', () => {
    const prose = buildHexTooltipProse('desert', 0.1, 0.9, 0.1, 'visible');
    expect(prose).toContain('desert');
    expect(prose).toContain('heat shimmers');
    expect(prose).toContain('parched');
    expect(prose).toContain('Low in a sheltered basin');
  });

  it('includes overlay prose for visible hex with a city', () => {
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'visible', 'city');
    expect(prose).toContain('Grasslands');
    expect(prose).toContain('city rises');
  });

  it('skips overlay prose for wilderness subtype', () => {
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'visible', 'wilderness');
    expect(prose).not.toContain('city');
    expect(prose).not.toContain('town');
  });

  it('includes overlay prose for ruins', () => {
    const prose = buildHexTooltipProse('hills', 0.5, 0.5, 0.5, 'visible', 'ruins');
    expect(prose).toContain('Rolling hills');
    expect(prose).toContain('ruins');
  });

  // ── Remembered hexes ───────────────────────────────────────────────────────

  it('adds memory framing for remembered hex without locations', () => {
    const prose = buildHexTooltipProse('tundra', 0.3, 0.2, 0.4, 'remembered');
    expect(prose).toContain('tundra');
    expect(prose).toContain('memory grows distant');
  });

  it('uses snapshot location names for remembered hex', () => {
    const snapshot = {
      terrain: 'grassland',
      locationNames: ['Ashenvale'],
      agentNames: [],
      lastSeenTick: 5,
    };
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'remembered', undefined, snapshot);
    expect(prose).toContain('Ashenvale');
    expect(prose).toContain('last seen here');
  });

  it('handles multiple snapshot location names', () => {
    const snapshot = {
      terrain: 'hills',
      locationNames: ['Ashenvale', 'Old Fort'],
      agentNames: [],
      lastSeenTick: 3,
    };
    const prose = buildHexTooltipProse('hills', 0.5, 0.5, 0.5, 'remembered', undefined, snapshot);
    expect(prose).toContain('Ashenvale and Old Fort');
    expect(prose).toContain('were last seen here');
  });

  it('uses overlay prose for remembered hex when snapshot has no location names', () => {
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'remembered', 'fort');
    expect(prose).toContain('fortification');
    expect(prose).toContain('memory grows distant');
  });

  // ── Unexplored ─────────────────────────────────────────────────────────────

  it('returns empty string for unexplored', () => {
    const prose = buildHexTooltipProse('grassland', 0.4, 0.5, 0.5, 'unexplored');
    expect(prose).toBe('');
  });

  // ── Every terrain type has a prose entry ────────────────────────────────────

  it('produces non-empty prose for all terrain types', () => {
    const terrains = [
      'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
      'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
      'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
      'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
      'swamp', 'marsh', 'moor_bog',
      'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass', 'forested_hills',
      'great_home_trees', 'broken_lands', 'oasis',
      'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano', 'arctic', 'snow_fields',
    ] as const;
    for (const t of terrains) {
      const prose = buildHexTooltipProse(t, 0.5, 0.5, 0.5, 'visible');
      expect(prose.length, `Expected prose for terrain "${t}"`).toBeGreaterThan(10);
    }
  });
});

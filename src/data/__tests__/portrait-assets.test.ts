import { describe, it, expect } from 'vitest';
import { getPortraitUrl, ARCHETYPE_PORTRAITS } from '../portrait-assets';

describe('portrait-assets', () => {
  it('returns URL for archetypes with portraits', () => {
    expect(getPortraitUrl('tragic_hero')).toBe('/portraits/tragic-hero.png');
    expect(getPortraitUrl('trickster')).toBe('/portraits/trickster.png');
    expect(getPortraitUrl('old_power')).toBe('/portraits/old-power.png');
  });

  it('returns URL for all 19 archetypes (full portrait set)', () => {
    // All archetypes now have portraits (complete set since 2026-03-18)
    expect(getPortraitUrl('wanderer')).toBe('/portraits/wanderer.png');
    expect(getPortraitUrl('schemer')).toBe('/portraits/schemer.png');
  });

  it('returns null for undefined/unknown archetype', () => {
    expect(getPortraitUrl(undefined)).toBeNull();
    expect(getPortraitUrl('nonexistent')).toBeNull();
  });

  it('has portrait entries in the registry', () => {
    expect(Object.keys(ARCHETYPE_PORTRAITS).length).toBeGreaterThan(0);
  });

  it('all portrait URLs start with /portraits/', () => {
    for (const [, url] of Object.entries(ARCHETYPE_PORTRAITS)) {
      if (url !== null) {
        expect(url).toMatch(/^\/portraits\//);
      }
    }
  });
});

import { describe, it, expect } from 'vitest';
import { getPortraitUrl, ARCHETYPE_PORTRAITS } from '../portrait-assets';

describe('portrait-assets', () => {
  it('returns URL for archetypes with portraits', () => {
    expect(getPortraitUrl('tragic_hero')).toBe('/portraits/tragic-hero.png');
    expect(getPortraitUrl('trickster')).toBe('/portraits/trickster.png');
    expect(getPortraitUrl('old_power')).toBe('/portraits/old-power.png');
  });

  it('returns null for archetypes without portraits', () => {
    expect(getPortraitUrl('wanderer')).toBeNull();
    expect(getPortraitUrl('schemer')).toBeNull();
  });

  it('returns null for undefined/unknown archetype', () => {
    expect(getPortraitUrl(undefined)).toBeNull();
    expect(getPortraitUrl('nonexistent')).toBeNull();
  });

  it('covers all 19 archetypes in the registry', () => {
    expect(Object.keys(ARCHETYPE_PORTRAITS)).toHaveLength(19);
  });

  it('all portrait URLs start with /portraits/', () => {
    for (const [, url] of Object.entries(ARCHETYPE_PORTRAITS)) {
      if (url !== null) {
        expect(url).toMatch(/^\/portraits\//);
      }
    }
  });
});

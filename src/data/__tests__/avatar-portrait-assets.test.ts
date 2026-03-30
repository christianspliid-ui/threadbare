import { describe, it, expect } from 'vitest';
import { getAvatarPortraitUrl, AVATAR_PORTRAITS } from '../avatar-portrait-assets';
import { CREATION_SPHERE_NAMES as SPHERE_NAMES } from '../../types';

describe('avatar-portrait-assets', () => {
  it('returns correct URL for each sphere', () => {
    expect(getAvatarPortraitUrl('force')).toBe('/portraits/avatar-force.png');
    expect(getAvatarPortraitUrl('mind')).toBe('/portraits/avatar-mind.png');
    expect(getAvatarPortraitUrl('entropy')).toBe('/portraits/avatar-entropy.png');
  });

  it('covers all 8 creation spheres', () => {
    expect(Object.keys(AVATAR_PORTRAITS)).toHaveLength(8);
    for (const sphere of SPHERE_NAMES) {
      expect(AVATAR_PORTRAITS[sphere]).toBeDefined();
      expect(AVATAR_PORTRAITS[sphere]).toMatch(/^\/portraits\/avatar-/);
    }
  });

  it('all portrait URLs follow naming convention', () => {
    for (const [sphere, url] of Object.entries(AVATAR_PORTRAITS)) {
      expect(url).toBe(`/portraits/avatar-${sphere}.png`);
    }
  });
});

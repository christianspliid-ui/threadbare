import { describe, it, expect } from 'vitest';
import { getOverlayIconUrl, isFullSizeOverlay, OVERLAY_ICON_MAP } from '../hex-tile-assets';
import type { LocationSubtype } from '../../types';

describe('OVERLAY_ICON_MAP', () => {
  it('has entries for all standard location subtypes', () => {
    const expected: LocationSubtype[] = [
      'hamlet', 'town', 'city', 'capital', 'camp', 'farmland',
      'castle', 'fort', 'tower', 'shrine', 'temple', 'mining',
      'ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
      'battleground', 'oasis', 'unexplored_poi',
    ];
    for (const subtype of expected) {
      expect(OVERLAY_ICON_MAP[subtype], `Missing overlay for ${subtype}`).toBeDefined();
    }
  });

  it('all filenames follow overlay-{subtype}.png pattern', () => {
    for (const filename of Object.values(OVERLAY_ICON_MAP)) {
      expect(filename).toMatch(/^overlay-[\w-]+\.png$/);
    }
  });
});

describe('getOverlayIconUrl', () => {
  it('returns correct URL for a location subtype', () => {
    expect(getOverlayIconUrl('hamlet')).toBe('/hex-tiles/overlay-hamlet.png');
  });

  it('returns null for wilderness (no overlay)', () => {
    expect(getOverlayIconUrl('wilderness')).toBeNull();
  });
});

describe('isFullSizeOverlay', () => {
  it('returns true for settlement types', () => {
    expect(isFullSizeOverlay('hamlet')).toBe(true);
    expect(isFullSizeOverlay('town')).toBe(true);
    expect(isFullSizeOverlay('city')).toBe(true);
    expect(isFullSizeOverlay('capital')).toBe(true);
    expect(isFullSizeOverlay('farmland')).toBe(true);
  });

  it('returns false for structure types', () => {
    expect(isFullSizeOverlay('castle')).toBe(false);
    expect(isFullSizeOverlay('tower')).toBe(false);
    expect(isFullSizeOverlay('shrine')).toBe(false);
  });
});

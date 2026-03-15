import { describe, it, expect } from 'vitest';
import {
  REGION_NAME_FRAGMENTS,
  CLAIMED_NAME_PATTERNS,
  UNCLAIMED_NAME_PATTERNS,
} from '../region-name-content';
import type { RegionFeatureType } from '../../engine/regionDetection';

const FEATURE_TYPES: RegionFeatureType[] = [
  'mountain_range', 'hill_country', 'forest', 'plains',
  'desert', 'wetland', 'tundra', 'river', 'lake',
];

describe('region name content', () => {
  it('has fragments for every nameable feature type', () => {
    for (const ft of FEATURE_TYPES) {
      const frags = REGION_NAME_FRAGMENTS[ft];
      expect(frags, `Missing fragments for ${ft}`).toBeDefined();
      expect(frags.nouns.length, `No nouns for ${ft}`).toBeGreaterThanOrEqual(3);
      expect(frags.suffixes.length, `No suffixes for ${ft}`).toBeGreaterThanOrEqual(2);
      expect(frags.adjectives.length, `No adjectives for ${ft}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('has claimed and unclaimed name patterns', () => {
    expect(CLAIMED_NAME_PATTERNS.length).toBeGreaterThanOrEqual(4);
    expect(UNCLAIMED_NAME_PATTERNS.length).toBeGreaterThanOrEqual(2);
  });
});

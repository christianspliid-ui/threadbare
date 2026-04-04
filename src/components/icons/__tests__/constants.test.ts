import { describe, it, expect } from 'vitest';
import {
  SPHERE_COLORS,
  REACH_TO_SPHERE,
  SPHERE_TO_FOUNDATION,
  DIVISION_BY_FACTION_TYPE,
  BORDER_THRESHOLDS,
  SMALL_SIZE_THRESHOLD,
} from '../constants';
import { SPHERE_NAMES, CREATION_SPHERE_NAMES, FOUNDATION_SPHERE_NAMES } from '../../../types/index';
import { REACH_DOMAINS } from '../../../types/traits';

const FACTION_TYPES = ['guild', 'military', 'religious', 'political', 'criminal', 'monster'] as const;

describe('SPHERE_COLORS', () => {
  it('covers all 12 spheres', () => {
    for (const sphere of SPHERE_NAMES) {
      expect(SPHERE_COLORS).toHaveProperty(sphere);
    }
    expect(Object.keys(SPHERE_COLORS)).toHaveLength(12);
  });

  it('all values are valid hex color strings', () => {
    for (const [sphere, color] of Object.entries(SPHERE_COLORS)) {
      expect(color, `${sphere} color`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('REACH_TO_SPHERE', () => {
  it('covers all 8 reaches', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_TO_SPHERE).toHaveProperty(reach);
    }
    expect(Object.keys(REACH_TO_SPHERE)).toHaveLength(8);
  });

  it('all values are valid creation sphere names', () => {
    for (const [reach, sphere] of Object.entries(REACH_TO_SPHERE)) {
      expect(CREATION_SPHERE_NAMES as readonly string[], `${reach} maps to valid creation sphere`)
        .toContain(sphere);
    }
  });
});

describe('SPHERE_TO_FOUNDATION', () => {
  it('covers all 8 creation spheres', () => {
    for (const sphere of CREATION_SPHERE_NAMES) {
      expect(SPHERE_TO_FOUNDATION).toHaveProperty(sphere);
    }
    expect(Object.keys(SPHERE_TO_FOUNDATION)).toHaveLength(8);
  });

  it('all values are valid foundation sphere names', () => {
    for (const [sphere, foundation] of Object.entries(SPHERE_TO_FOUNDATION)) {
      expect(FOUNDATION_SPHERE_NAMES as readonly string[], `${sphere} maps to valid foundation`)
        .toContain(foundation);
    }
  });

  it('each foundation sphere governs exactly 2 creation spheres', () => {
    const counts: Record<string, number> = {};
    for (const foundation of Object.values(SPHERE_TO_FOUNDATION)) {
      counts[foundation] = (counts[foundation] ?? 0) + 1;
    }
    for (const [foundation, count] of Object.entries(counts)) {
      expect(count, `${foundation} should govern exactly 2 spheres`).toBe(2);
    }
    // Also confirm all 4 foundations are represented
    for (const foundation of FOUNDATION_SPHERE_NAMES) {
      expect(counts).toHaveProperty(foundation);
    }
  });
});

describe('DIVISION_BY_FACTION_TYPE', () => {
  it('covers all 6 faction types', () => {
    for (const factionType of FACTION_TYPES) {
      expect(DIVISION_BY_FACTION_TYPE).toHaveProperty(factionType);
    }
    expect(Object.keys(DIVISION_BY_FACTION_TYPE)).toHaveLength(6);
  });

  it('all values are valid division types', () => {
    const validDivisions = ['per_pale', 'per_fess', 'per_chevron', 'quarterly', 'per_bend_sinister', 'plain'];
    for (const [faction, division] of Object.entries(DIVISION_BY_FACTION_TYPE)) {
      expect(validDivisions, `${faction} has valid division`).toContain(division);
    }
  });
});

describe('BORDER_THRESHOLDS', () => {
  it('has established and dominant thresholds', () => {
    expect(BORDER_THRESHOLDS.established.members).toBeGreaterThan(0);
    expect(BORDER_THRESHOLDS.established.territories).toBeGreaterThan(0);
    expect(BORDER_THRESHOLDS.dominant.members).toBeGreaterThan(BORDER_THRESHOLDS.established.members);
    expect(BORDER_THRESHOLDS.dominant.territories).toBeGreaterThan(BORDER_THRESHOLDS.established.territories);
  });
});

describe('SMALL_SIZE_THRESHOLD', () => {
  it('is 32', () => {
    expect(SMALL_SIZE_THRESHOLD).toBe(32);
  });
});

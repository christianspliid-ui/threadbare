import { describe, it, expect } from 'vitest';
import {
  filterOriginFragments,
  filterDriveFragments,
  filterHungers,
  selectHungerProse,
  deriveCosmologyFromIdentity,
  generateDivineName,
  buildPersonalitySeed,
} from '../remembrance';
import { SPHERE_NAMES } from '../../types/index';
import { STIRRING_IMAGES } from '../../data/stirring-images';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';

describe('filterOriginFragments', () => {
  it('returns fragments matching the stirring image clusters', () => {
    const darkWater = STIRRING_IMAGES.find(s => s.id === 'stirring.dark-water')!;
    const results = filterOriginFragments(darkWater, ORIGIN_FRAGMENTS, 42);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.length).toBeLessThanOrEqual(4);
    expect(results.some(f => f.id === 'origin.ancient-scholar')).toBe(true);
  });

  it('returns at most 3 fragments, all with positive cluster overlap', () => {
    const tangledLight = STIRRING_IMAGES.find(s => s.id === 'stirring.tangled-light')!;
    const results = filterOriginFragments(tangledLight, ORIGIN_FRAGMENTS, 42);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeLessThanOrEqual(3);
    // Every returned fragment should have at least one cluster in common
    for (const fragment of results) {
      const overlap = fragment.stirringClusters.filter(c => tangledLight.fragmentClusters.includes(c));
      expect(overlap.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic with the same seed', () => {
    const image = STIRRING_IMAGES[0];
    const a = filterOriginFragments(image, ORIGIN_FRAGMENTS, 99);
    const b = filterOriginFragments(image, ORIGIN_FRAGMENTS, 99);
    expect(a.map(f => f.id)).toEqual(b.map(f => f.id));
  });
});

describe('filterDriveFragments', () => {
  it('returns fragments compatible with the chosen origin', () => {
    const scholar = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const results = filterDriveFragments(scholar, DRIVE_FRAGMENTS, 42);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.some(f => f.id === 'drive.unanswered-question')).toBe(true);
  });

  it('only returns fragments with positive compatibility scores', () => {
    const shepherd = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.recent-shepherd')!;
    const results = filterDriveFragments(shepherd, DRIVE_FRAGMENTS, 42);
    // Shepherd has tags: caretaker, rural, humble, life — should match undying-love and dying-light
    // but NOT stolen-legacy (requires leader/ruler/military) or unanswered-question (requires scholar)
    for (const drive of results) {
      const hasTagOverlap = (drive.requiredOriginTags ?? []).some(t => shepherd.tags.includes(t));
      const hasClusterOverlap = drive.stirringClusters.some(c => shepherd.stirringClusters.includes(c));
      expect(hasTagOverlap || hasClusterOverlap).toBe(true);
    }
  });
});

describe('filterHungers', () => {
  it('returns hungers with positive combined weights', () => {
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.unanswered-question')!;
    const results = filterHungers(origin, drive, HUNGER_CATALOG, 42);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0].id).toBe('hunger.witness');
    // Every returned hunger should have positive weight from at least one fragment
    for (const hunger of results) {
      const originWeight = origin.hungerWeights[hunger.id] ?? 0;
      const driveWeight = drive.hungerWeights[hunger.id] ?? 0;
      expect(originWeight + driveWeight).toBeGreaterThan(0);
    }
  });

  it('does not return hungers with zero combined weight', () => {
    const shepherd = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.recent-shepherd')!;
    const love = DRIVE_FRAGMENTS.find(f => f.id === 'drive.undying-love')!;
    const results = filterHungers(shepherd, love, HUNGER_CATALOG, 42);
    // reclaim and reshape have 0 weight for shepherd+love path
    expect(results.every(h => h.id !== 'hunger.reclaim' || (shepherd.hungerWeights[h.id] ?? 0) + (love.hungerWeights[h.id] ?? 0) > 0)).toBe(true);
  });
});

describe('selectHungerProse', () => {
  it('selects the prose variant matching the drive tags', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.unanswered-question')!;
    const prose = selectHungerProse(hunger, drive);
    expect(prose).toContain('question became a hunger');
  });

  it('falls back to first variant if no tag match', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.stolen-legacy')!;
    const prose = selectHungerProse(hunger, drive);
    expect(prose.length).toBeGreaterThan(0);
  });
});

describe('buildPersonalitySeed', () => {
  it('returns an AxiologicalProfile with 9 value pairs', () => {
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.recent-shepherd')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.undying-love')!;
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.gather')!;
    const profile = buildPersonalitySeed(origin, drive, hunger, 42);
    const keys = Object.keys(profile);
    expect(keys).toHaveLength(9);
    keys.forEach(k => {
      const val = profile[k as keyof typeof profile];
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  it('is deterministic with the same seed', () => {
    const origin = ORIGIN_FRAGMENTS[0];
    const drive = DRIVE_FRAGMENTS[0];
    const hunger = HUNGER_CATALOG[0];
    const a = buildPersonalitySeed(origin, drive, hunger, 42);
    const b = buildPersonalitySeed(origin, drive, hunger, 42);
    expect(a).toEqual(b);
  });

  it('produces different profiles for different hungers', () => {
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.unanswered-question')!;
    const gather = HUNGER_CATALOG.find(h => h.id === 'hunger.gather')!;
    const witness = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const profileA = buildPersonalitySeed(origin, drive, gather, 42);
    const profileB = buildPersonalitySeed(origin, drive, witness, 42);
    // Same origin + drive but different hunger should yield different profiles
    const keysA = Object.keys(profileA) as (keyof typeof profileA)[];
    const hasDifference = keysA.some(k => Math.abs(profileA[k] - profileB[k]) > 0.01);
    expect(hasDifference).toBe(true);
  });
});

describe('generateDivineName', () => {
  it('returns a title-format name', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const name = generateDivineName(hunger, origin, 42);
    expect(name).toMatch(/^The /);
    expect(name.length).toBeGreaterThan(5);
  });

  it('is deterministic with the same seed', () => {
    const hunger = HUNGER_CATALOG[0];
    const origin = ORIGIN_FRAGMENTS[0];
    const a = generateDivineName(hunger, origin, 42);
    const b = generateDivineName(hunger, origin, 42);
    expect(a).toBe(b);
  });
});

describe('deriveCosmologyFromIdentity', () => {
  it('returns a CosmologyProfile that sums to 1.0', () => {
    const identity = {
      sphereAlignment: { primary: 'mind' as const, secondary: 'spirit' as const },
      mortalTags: ['ancient', 'scholar'],
      hungerId: 'hunger.witness',
    };
    const profile = deriveCosmologyFromIdentity(identity);
    const sum = Object.values(profile).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('weights primary sphere highest', () => {
    const identity = {
      sphereAlignment: { primary: 'force' as const, secondary: 'time' as const },
      mortalTags: ['ancient', 'ruler'],
      hungerId: 'hunger.reclaim',
    };
    const profile = deriveCosmologyFromIdentity(identity);
    expect(profile.force).toBeGreaterThan(profile.time);
    expect(profile.time).toBeGreaterThan(profile.life);
  });

  it('produces different distributions for different mortal tags', () => {
    const base = { primary: 'mind' as const, secondary: 'spirit' as const };
    const scholarProfile = deriveCosmologyFromIdentity({
      sphereAlignment: base,
      mortalTags: ['ancient', 'scholar'],
      hungerId: 'hunger.witness',
    });
    const warriorProfile = deriveCosmologyFromIdentity({
      sphereAlignment: base,
      mortalTags: ['recent', 'leader', 'military'],
      hungerId: 'hunger.witness',
    });
    // Same sphere alignment but different tags should yield different non-primary weights
    const otherSpheres = SPHERE_NAMES.filter(s => s !== 'mind' && s !== 'spirit');
    const hasDifference = otherSpheres.some(
      s => Math.abs(scholarProfile[s] - warriorProfile[s]) > 0.001
    );
    expect(hasDifference).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import {
  FOUNDATION_MODIFIERS,
  CREATION_SPHERE_MODIFIERS,
  BIOME_MODIFIERS,
  FORMATIVE_TRAIT_SEEDS,
  BEHAVIORAL_TRAIT_SEEDS,
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  type FoundationModifier,
  type CreationSphereModifier,
  type BiomeModifier,
  type FormativeTraitSeed,
  type BehavioralTraitSeed,
} from '../culture-content';
import { SPHERE_NAMES } from '../../types/index';
import { REACH_DOMAINS } from '../../types/traits';

const ALL_TERRAIN_TYPES = [
  'ocean', 'coastal_shallows', 'lake', 'river',
  'grassland', 'farmland', 'savanna', 'steppe',
  'deciduous_forest', 'dense_forest', 'taiga', 'jungle',
  'swamp', 'bog',
  'hills', 'mountains', 'plateau', 'badlands',
  'desert', 'tundra', 'glacier', 'volcanic',
];

describe('culture-content', () => {
  // ─── Foundation Modifiers Tests ───────────────────────────────────

  describe('FOUNDATION_MODIFIERS', () => {
    it('exports exactly 4 foundation modifiers', () => {
      expect(FOUNDATION_MODIFIERS).toHaveLength(4);
    });

    it('covers all required foundation types (chaos, order, light, darkness)', () => {
      const ids = FOUNDATION_MODIFIERS.map(m => m.id);
      expect(ids).toContain('chaos');
      expect(ids).toContain('order');
      expect(ids).toContain('light');
      expect(ids).toContain('darkness');
    });

    it('each foundation modifier has required fields', () => {
      for (const mod of FOUNDATION_MODIFIERS) {
        expect(mod.id).toBeTruthy();
        expect(typeof mod.id).toBe('string');
        expect(mod.socialStructure).toBeTruthy();
        expect(typeof mod.socialStructure).toBe('string');
        expect(mod.accountability).toBeTruthy();
        expect(typeof mod.accountability).toBe('string');
        expect(Array.isArray(mod.behavioralKeywords)).toBe(true);
        expect(mod.behavioralKeywords.length).toBeGreaterThanOrEqual(3);
        expect(Array.isArray(mod.metaphorSeeds)).toBe(true);
        expect(mod.metaphorSeeds.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('all foundation ids are unique', () => {
      const ids = FOUNDATION_MODIFIERS.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('getFoundationModifier retrieves by id', () => {
      const chaos = getFoundationModifier('chaos');
      expect(chaos).toBeDefined();
      expect(chaos!.id).toBe('chaos');
    });

    it('getFoundationModifier returns undefined for unknown id', () => {
      expect(getFoundationModifier('unknown')).toBeUndefined();
    });
  });

  // ─── Creation Sphere Modifiers Tests ──────────────────────────────

  describe('CREATION_SPHERE_MODIFIERS', () => {
    it('exports exactly 8 creation sphere modifiers', () => {
      expect(CREATION_SPHERE_MODIFIERS).toHaveLength(8);
    });

    it('covers all 8 creation spheres', () => {
      const spheres = CREATION_SPHERE_MODIFIERS.map(m => m.sphere);
      for (const sphere of SPHERE_NAMES) {
        expect(spheres).toContain(sphere);
      }
    });

    it('each sphere appears exactly once', () => {
      const spheres = CREATION_SPHERE_MODIFIERS.map(m => m.sphere);
      for (const sphere of SPHERE_NAMES) {
        expect(spheres.filter(s => s === sphere).length).toBe(1);
      }
    });

    it('each creation sphere modifier has required fields', () => {
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        expect(mod.sphere).toBeTruthy();
        expect(SPHERE_NAMES).toContain(mod.sphere);
        expect(mod.behavioralColoring).toBeTruthy();
        expect(typeof mod.behavioralColoring).toBe('string');
        expect(Array.isArray(mod.behavioralKeywords)).toBe(true);
        expect(mod.behavioralKeywords.length).toBeGreaterThanOrEqual(4);
        expect(Array.isArray(mod.materialVocabulary)).toBe(true);
        expect(mod.materialVocabulary.length).toBeGreaterThanOrEqual(4);
        expect(Array.isArray(mod.formativeTraitSeeds)).toBe(true);
        expect(mod.formativeTraitSeeds.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(mod.behavioralTraitSeeds)).toBe(true);
        expect(mod.behavioralTraitSeeds.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('getCreationSphereModifier retrieves by sphere name', () => {
      const force = getCreationSphereModifier('force');
      expect(force).toBeDefined();
      expect(force!.sphere).toBe('force');
    });

    it('getCreationSphereModifier returns undefined for unknown sphere', () => {
      expect(getCreationSphereModifier('fake_sphere' as any)).toBeUndefined();
    });

    it('behavioral keywords are non-empty strings', () => {
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        for (const keyword of mod.behavioralKeywords) {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        }
      }
    });

    it('material vocabulary items are non-empty strings', () => {
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        for (const material of mod.materialVocabulary) {
          expect(typeof material).toBe('string');
          expect(material.length).toBeGreaterThan(0);
        }
      }
    });

    it('trait seeds are non-empty strings', () => {
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        for (const seed of mod.formativeTraitSeeds) {
          expect(typeof seed).toBe('string');
          expect(seed.length).toBeGreaterThan(0);
        }
        for (const seed of mod.behavioralTraitSeeds) {
          expect(typeof seed).toBe('string');
          expect(seed.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─── Biome Modifiers Tests ────────────────────────────────────────

  describe('BIOME_MODIFIERS', () => {
    it('exports exactly 22 biome modifiers', () => {
      expect(BIOME_MODIFIERS).toHaveLength(22);
    });

    it('covers all 22 terrain types', () => {
      const terrains = BIOME_MODIFIERS.map(m => m.terrain);
      for (const terrain of ALL_TERRAIN_TYPES) {
        expect(terrains).toContain(terrain);
      }
    });

    it('each terrain type appears exactly once', () => {
      const terrains = BIOME_MODIFIERS.map(m => m.terrain);
      for (const terrain of ALL_TERRAIN_TYPES) {
        expect(terrains.filter(t => t === terrain).length).toBe(1);
      }
    });

    it('each biome modifier has required fields', () => {
      for (const mod of BIOME_MODIFIERS) {
        expect(mod.terrain).toBeTruthy();
        expect(typeof mod.terrain).toBe('string');
        expect(ALL_TERRAIN_TYPES).toContain(mod.terrain);
        expect(Array.isArray(mod.survivalTraitKeywords)).toBe(true);
        expect(mod.survivalTraitKeywords.length).toBeGreaterThanOrEqual(3);
        expect(Array.isArray(mod.materialCulture)).toBe(true);
        expect(mod.materialCulture.length).toBeGreaterThanOrEqual(4);
        expect(Array.isArray(mod.metaphorPalette)).toBe(true);
        expect(mod.metaphorPalette.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('getBiomeModifier retrieves by terrain type', () => {
      const ocean = getBiomeModifier('ocean');
      expect(ocean).toBeDefined();
      expect(ocean!.terrain).toBe('ocean');
    });

    it('getBiomeModifier returns undefined for unknown terrain', () => {
      expect(getBiomeModifier('unknown_terrain' as any)).toBeUndefined();
    });

    it('survival trait keywords are non-empty strings', () => {
      for (const mod of BIOME_MODIFIERS) {
        for (const keyword of mod.survivalTraitKeywords) {
          expect(typeof keyword).toBe('string');
          expect(keyword.length).toBeGreaterThan(0);
        }
      }
    });

    it('material culture items are non-empty strings', () => {
      for (const mod of BIOME_MODIFIERS) {
        for (const material of mod.materialCulture) {
          expect(typeof material).toBe('string');
          expect(material.length).toBeGreaterThan(0);
        }
      }
    });

    it('metaphor palette items are non-empty strings', () => {
      for (const mod of BIOME_MODIFIERS) {
        for (const metaphor of mod.metaphorPalette) {
          expect(typeof metaphor).toBe('string');
          expect(metaphor.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─── Formative Trait Seeds Tests ───────────────────────────────────

  describe('FORMATIVE_TRAIT_SEEDS', () => {
    it('exports at least 30 formative trait seeds', () => {
      expect(FORMATIVE_TRAIT_SEEDS.length).toBeGreaterThanOrEqual(30);
    });

    it('each seed has required fields', () => {
      for (const seed of FORMATIVE_TRAIT_SEEDS) {
        expect(seed.id).toBeTruthy();
        expect(typeof seed.id).toBe('string');
        expect(seed.name).toBeTruthy();
        expect(typeof seed.name).toBe('string');
        expect(seed.description).toBeTruthy();
        expect(typeof seed.description).toBe('string');
        expect(Array.isArray(seed.sourceTags)).toBe(true);
        expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
        expect(typeof seed.domainContributions).toBe('object');
        expect(Object.keys(seed.domainContributions).length).toBeGreaterThanOrEqual(1);
        for (const domain of Object.keys(seed.domainContributions)) {
          expect((REACH_DOMAINS as string[]).includes(domain)).toBe(true);
          expect(typeof seed.domainContributions[domain as any]).toBe('number');
        }
        expect(Array.isArray(seed.tags)).toBe(true);
      }
    });

    it('all seed ids are unique', () => {
      const ids = FORMATIVE_TRAIT_SEEDS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every creation sphere modifier formative seed is represented', () => {
      const seedIds = new Set(FORMATIVE_TRAIT_SEEDS.map(s => s.id));
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        for (const seedRef of mod.formativeTraitSeeds) {
          expect(seedIds.has(seedRef)).toBe(true);
        }
      }
    });

    it('sourceTags are non-empty strings', () => {
      for (const seed of FORMATIVE_TRAIT_SEEDS) {
        for (const tag of seed.sourceTags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });

    it('tags are non-empty strings', () => {
      for (const seed of FORMATIVE_TRAIT_SEEDS) {
        for (const tag of seed.tags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });

    it('domain contributions are numeric and reasonable', () => {
      for (const seed of FORMATIVE_TRAIT_SEEDS) {
        for (const [_domain, value] of Object.entries(seed.domainContributions)) {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(-2);
          expect(value).toBeLessThanOrEqual(3);
        }
      }
    });
  });

  // ─── Behavioral Trait Seeds Tests ──────────────────────────────────

  describe('BEHAVIORAL_TRAIT_SEEDS', () => {
    it('exports at least 40 behavioral trait seeds', () => {
      expect(BEHAVIORAL_TRAIT_SEEDS.length).toBeGreaterThanOrEqual(40);
    });

    it('each seed has required fields', () => {
      const VALID_STRENGTH_RANGES = ['fanatical', 'strong', 'fading', 'silent'];
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        expect(seed.id).toBeTruthy();
        expect(typeof seed.id).toBe('string');
        expect(seed.name).toBeTruthy();
        expect(typeof seed.name).toBe('string');
        expect(seed.description).toBeTruthy();
        expect(typeof seed.description).toBe('string');
        expect(Array.isArray(seed.sourceTags)).toBe(true);
        expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
        expect(typeof seed.strengthThresholds).toBe('object');
        expect(Object.keys(seed.strengthThresholds).length).toBeGreaterThanOrEqual(2);
        for (const range of Object.keys(seed.strengthThresholds)) {
          expect(VALID_STRENGTH_RANGES).toContain(range);
          const value = seed.strengthThresholds[range as any];
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
        expect(typeof seed.domainContributions).toBe('object');
        expect(Array.isArray(seed.tags)).toBe(true);
      }
    });

    it('all seed ids are unique', () => {
      const ids = BEHAVIORAL_TRAIT_SEEDS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every creation sphere modifier behavioral seed is represented', () => {
      const seedIds = new Set(BEHAVIORAL_TRAIT_SEEDS.map(s => s.id));
      for (const mod of CREATION_SPHERE_MODIFIERS) {
        for (const seedRef of mod.behavioralTraitSeeds) {
          expect(seedIds.has(seedRef)).toBe(true);
        }
      }
    });

    it('fanatical threshold always differs from strong (when both present)', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        if (seed.strengthThresholds.fanatical && seed.strengthThresholds.strong) {
          expect(seed.strengthThresholds.fanatical).not.toBe(seed.strengthThresholds.strong);
        }
      }
    });

    it('strength threshold descriptions are non-empty strings', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        for (const [_range, desc] of Object.entries(seed.strengthThresholds)) {
          expect(typeof desc).toBe('string');
          expect(desc.length).toBeGreaterThan(0);
        }
      }
    });

    it('sourceTags are non-empty strings', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        for (const tag of seed.sourceTags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });

    it('tags are non-empty strings', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        for (const tag of seed.tags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });

    it('domain contributions are numeric and reasonable', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        for (const [_domain, value] of Object.entries(seed.domainContributions)) {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(-2);
          expect(value).toBeLessThanOrEqual(3);
        }
      }
    });
  });
});

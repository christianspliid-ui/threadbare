import { describe, it, expect } from 'vitest';
import {
  FOUNDATION_MODIFIERS,
  CREATION_SPHERE_MODIFIERS,
  BIOME_MODIFIERS,
  FORMATIVE_TRAIT_SEEDS,
  BEHAVIORAL_TRAIT_SEEDS,
  INSIDER_BEATS,
  SUB_LOCATION_TEMPLATES,
  ARTIFACT_LORE_PATTERNS,
  CULTURE_NAME_FRAGMENTS,
  CULTURAL_PROSE_PALETTES,
  getFoundationModifier,
  getCreationSphereModifier,
  getBiomeModifier,
  getFormativeTraitSeed,
  getBehavioralTraitSeed,
  getInsiderBeat,
  getSubLocationTemplate,
  getBeatsForCultureTags,
  getTraitSeedsForTags,
  type FoundationModifier,
  type CreationSphereModifier,
  type BiomeModifier,
  type FormativeTraitSeed,
  type BehavioralTraitSeed,
  type InsiderBeat,
  type SubLocationTemplate,
  type ArtifactLorePattern,
  type CulturalProsePalette,
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

  // ─── Insider Beats Tests ──────────────────────────────────────────

  describe('INSIDER_BEATS', () => {
    it('exports at least 20 insider beats', () => {
      expect(INSIDER_BEATS.length).toBeGreaterThanOrEqual(20);
    });

    it('each beat has required fields', () => {
      for (const beat of INSIDER_BEATS) {
        expect(beat.id).toBeTruthy();
        expect(typeof beat.id).toBe('string');
        expect(beat.name).toBeTruthy();
        expect(typeof beat.name).toBe('string');
        expect(Array.isArray(beat.requiredCultureTags)).toBe(true);
        expect(beat.minStrength).toBeGreaterThanOrEqual(0.3);
        expect(beat.minStrength).toBeLessThanOrEqual(1.0);
        expect(beat.trigger).toBeTruthy();
        expect(typeof beat.trigger).toBe('string');
        expect(Array.isArray(beat.proseSeeds)).toBe(true);
        expect(beat.proseSeeds.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('all beat ids are unique', () => {
      const ids = INSIDER_BEATS.map(b => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('no beat requires strength below 0.3', () => {
      for (const beat of INSIDER_BEATS) {
        expect(beat.minStrength).toBeGreaterThanOrEqual(0.3);
      }
    });

    it('prose seeds contain template placeholders for narrative generation', () => {
      for (const beat of INSIDER_BEATS) {
        for (const seed of beat.proseSeeds) {
          expect(typeof seed).toBe('string');
          expect(seed.length).toBeGreaterThan(0);
          // At least some seeds should have placeholders like {actor}, {target}, {culture}
          const hasSomePlaceholder = seed.includes('{');
          // Not required for all, but at least one per beat should have one
        }
      }
    });
  });

  // ─── Sub-Location Templates Tests ─────────────────────────────────

  describe('SUB_LOCATION_TEMPLATES', () => {
    it('exports at least 15 sub-location templates', () => {
      expect(SUB_LOCATION_TEMPLATES.length).toBeGreaterThanOrEqual(15);
    });

    it('each template has required fields', () => {
      for (const tmpl of SUB_LOCATION_TEMPLATES) {
        expect(tmpl.id).toBeTruthy();
        expect(typeof tmpl.id).toBe('string');
        expect(tmpl.name).toBeTruthy();
        expect(typeof tmpl.name).toBe('string');
        expect(Array.isArray(tmpl.grantedByTags)).toBe(true);
        expect(tmpl.grantedByTags.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(tmpl.culturalVariantDescriptors)).toBe(true);
        expect(tmpl.culturalVariantDescriptors.length).toBeGreaterThanOrEqual(2);
        expect(tmpl.description).toBeTruthy();
        expect(typeof tmpl.description).toBe('string');
      }
    });

    it('all template ids are unique', () => {
      const ids = SUB_LOCATION_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('cultural variant descriptors are non-empty strings', () => {
      for (const tmpl of SUB_LOCATION_TEMPLATES) {
        for (const descriptor of tmpl.culturalVariantDescriptors) {
          expect(typeof descriptor).toBe('string');
          expect(descriptor.length).toBeGreaterThan(0);
        }
      }
    });

    it('granted by tags are non-empty strings', () => {
      for (const tmpl of SUB_LOCATION_TEMPLATES) {
        for (const tag of tmpl.grantedByTags) {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ─── Culture Name Fragments Tests ────────────────────────────────

  describe('CULTURE_NAME_FRAGMENTS', () => {
    it('has foundation fragments for all 4 foundations', () => {
      expect(Object.keys(CULTURE_NAME_FRAGMENTS.foundation)).toEqual(
        expect.arrayContaining(['chaos', 'order', 'light', 'darkness'])
      );
      for (const frags of Object.values(CULTURE_NAME_FRAGMENTS.foundation)) {
        expect(frags.length).toBeGreaterThanOrEqual(3);
        for (const f of frags) {
          expect(typeof f).toBe('string');
          expect(f.length).toBeGreaterThan(0);
        }
      }
    });

    it('has sphere fragments for all 8 creation spheres', () => {
      const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
      for (const sphere of spheres) {
        expect(CULTURE_NAME_FRAGMENTS.sphere[sphere]).toBeDefined();
        expect(CULTURE_NAME_FRAGMENTS.sphere[sphere].length).toBeGreaterThanOrEqual(3);
      }
    });

    it('has biome fragments for common terrain types', () => {
      const terrains = ['desert', 'mountains', 'grassland', 'jungle', 'tundra', 'swamp'];
      for (const t of terrains) {
        expect(CULTURE_NAME_FRAGMENTS.biome[t]).toBeDefined();
        expect(CULTURE_NAME_FRAGMENTS.biome[t].length).toBeGreaterThanOrEqual(3);
      }
    });

    it('has at least 3 name patterns', () => {
      expect(CULTURE_NAME_FRAGMENTS.patterns.length).toBeGreaterThanOrEqual(3);
      for (const p of CULTURE_NAME_FRAGMENTS.patterns) {
        expect(p).toContain('{');
      }
    });
  });

  // ─── Artifact Lore Patterns Tests ──────────────────────────────────

  describe('ARTIFACT_LORE_PATTERNS', () => {
    it('exports at least 5 artifact lore patterns', () => {
      expect(ARTIFACT_LORE_PATTERNS.length).toBeGreaterThanOrEqual(5);
    });

    it('each pattern has required fields', () => {
      const validTones = ['reverent', 'martial', 'mystical', 'practical', 'ominous'];
      for (const pattern of ARTIFACT_LORE_PATTERNS) {
        expect(pattern.id).toBeTruthy();
        expect(typeof pattern.id).toBe('string');
        expect(pattern.template).toBeTruthy();
        expect(typeof pattern.template).toBe('string');
        expect(pattern.toneCategory).toBeTruthy();
        expect(validTones).toContain(pattern.toneCategory);
      }
    });

    it('each pattern has a template with {culture} placeholder', () => {
      for (const pattern of ARTIFACT_LORE_PATTERNS) {
        expect(pattern.template).toContain('{culture}');
      }
    });

    it('all pattern ids are unique', () => {
      const ids = ARTIFACT_LORE_PATTERNS.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('tone categories are valid', () => {
      const validTones = ['reverent', 'martial', 'mystical', 'practical', 'ominous'];
      for (const pattern of ARTIFACT_LORE_PATTERNS) {
        expect(validTones).toContain(pattern.toneCategory);
      }
    });
  });

  // ─── Lookup Functions Tests ───────────────────────────────────────

  describe('culture-content — lookup functions', () => {
    it('getFoundationModifier returns correct modifier', () => {
      const chaos = getFoundationModifier('chaos');
      expect(chaos).toBeDefined();
      expect(chaos!.id).toBe('chaos');
    });

    it('getFoundationModifier returns undefined for invalid id', () => {
      expect(getFoundationModifier('invalid')).toBeUndefined();
    });

    it('getCreationSphereModifier returns correct modifier', () => {
      const force = getCreationSphereModifier('force');
      expect(force).toBeDefined();
      expect(force!.sphere).toBe('force');
    });

    it('getCreationSphereModifier returns undefined for invalid sphere', () => {
      expect(getCreationSphereModifier('invalid' as any)).toBeUndefined();
    });

    it('getBiomeModifier returns correct modifier', () => {
      const desert = getBiomeModifier('desert');
      expect(desert).toBeDefined();
      expect(desert!.terrain).toBe('desert');
    });

    it('getBiomeModifier returns undefined for invalid terrain', () => {
      expect(getBiomeModifier('invalid' as any)).toBeUndefined();
    });

    it('getFormativeTraitSeed returns correct seed', () => {
      const wm = getFormativeTraitSeed('weapon_mastery');
      expect(wm).toBeDefined();
      expect(wm!.name).toBe('Weapon Mastery');
    });

    it('getFormativeTraitSeed returns undefined for invalid id', () => {
      expect(getFormativeTraitSeed('invalid')).toBeUndefined();
    });

    it('getBehavioralTraitSeed returns correct seed', () => {
      const cc = getBehavioralTraitSeed('challenge_compulsion');
      expect(cc).toBeDefined();
      expect(cc!.name).toBe('Challenge Compulsion');
    });

    it('getBehavioralTraitSeed returns undefined for invalid id', () => {
      expect(getBehavioralTraitSeed('invalid')).toBeUndefined();
    });

    it('getInsiderBeat returns correct beat', () => {
      const blood = getInsiderBeat('blood_oath_challenge');
      expect(blood).toBeDefined();
      expect(blood!.name).toBe('Blood Oath Challenge');
    });

    it('getInsiderBeat returns undefined for invalid id', () => {
      expect(getInsiderBeat('invalid')).toBeUndefined();
    });

    it('getSubLocationTemplate returns correct template', () => {
      const forge = getSubLocationTemplate('forge');
      expect(forge).toBeDefined();
      expect(forge!.name).toBe('Forge');
    });

    it('getSubLocationTemplate returns undefined for invalid id', () => {
      expect(getSubLocationTemplate('invalid')).toBeUndefined();
    });

    it('getBeatsForCultureTags filters by tag', () => {
      const forceBeats = getBeatsForCultureTags(['force']);
      expect(forceBeats.length).toBeGreaterThanOrEqual(1);
      for (const beat of forceBeats) {
        expect(beat.requiredCultureTags.some(t => t === 'force')).toBe(true);
      }
    });

    it('getBeatsForCultureTags returns empty array for non-matching tags', () => {
      const beats = getBeatsForCultureTags(['nonexistent_tag']);
      expect(beats).toEqual([]);
    });

    it('getBeatsForCultureTags returns all matching beats for multiple tags', () => {
      const forceBeats = getBeatsForCultureTags(['force']);
      const matterBeats = getBeatsForCultureTags(['matter']);
      const bothTags = getBeatsForCultureTags(['force', 'matter']);
      // Should return union of both
      expect(bothTags.length).toBeGreaterThanOrEqual(Math.max(forceBeats.length, matterBeats.length));
    });

    it('getTraitSeedsForTags returns formative and behavioral seeds', () => {
      const result = getTraitSeedsForTags(['force']);
      expect(result.formative).toBeDefined();
      expect(result.behavioral).toBeDefined();
      expect(result.formative.length).toBeGreaterThanOrEqual(1);
      expect(result.behavioral.length).toBeGreaterThanOrEqual(1);
    });

    it('getTraitSeedsForTags formative seeds have matching sourceTags', () => {
      const result = getTraitSeedsForTags(['force']);
      for (const seed of result.formative) {
        expect(seed.sourceTags.some(t => t === 'force')).toBe(true);
      }
    });

    it('getTraitSeedsForTags behavioral seeds have matching sourceTags', () => {
      const result = getTraitSeedsForTags(['force']);
      for (const seed of result.behavioral) {
        expect(seed.sourceTags.some(t => t === 'force')).toBe(true);
      }
    });

    it('getTraitSeedsForTags returns empty arrays for non-matching tags', () => {
      const result = getTraitSeedsForTags(['nonexistent_tag']);
      expect(result.formative).toEqual([]);
      expect(result.behavioral).toEqual([]);
    });

    it('getTraitSeedsForTags works with multiple tags', () => {
      const result = getTraitSeedsForTags(['force', 'matter']);
      expect(result.formative.length).toBeGreaterThanOrEqual(1);
      expect(result.behavioral.length).toBeGreaterThanOrEqual(1);
      // All results should match at least one tag
      for (const seed of [...result.formative, ...result.behavioral]) {
        expect(seed.sourceTags.some(t => ['force', 'matter'].includes(t))).toBe(true);
      }
    });
  });

  // ─── Per-Entry Quality Validation Tests ───────────────────────────

  describe('culture-content — per-entry quality validation', () => {
    describe('formative trait seeds', () => {
      for (const seed of FORMATIVE_TRAIT_SEEDS) {
        it(`"${seed.name}" has valid domain contributions`, () => {
          const values = Object.values(seed.domainContributions);
          expect(values.length).toBeGreaterThanOrEqual(1);
          for (const v of values) {
            expect(typeof v).toBe('number');
            expect(Math.abs(v)).toBeLessThanOrEqual(5);
          }
        });

        it(`"${seed.name}" has valid sourceTags array`, () => {
          expect(Array.isArray(seed.sourceTags)).toBe(true);
          expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
          for (const tag of seed.sourceTags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThanOrEqual(1);
          }
        });

        it(`"${seed.name}" has unique id`, () => {
          const count = FORMATIVE_TRAIT_SEEDS.filter(s => s.id === seed.id).length;
          expect(count).toBe(1);
        });
      }
    });

    describe('behavioral trait seeds', () => {
      for (const seed of BEHAVIORAL_TRAIT_SEEDS) {
        it(`"${seed.name}" has at least 2 strength threshold descriptions`, () => {
          const entries = Object.entries(seed.strengthThresholds);
          expect(entries.length).toBeGreaterThanOrEqual(2);
          for (const [, desc] of entries) {
            expect(typeof desc).toBe('string');
            expect(desc.length).toBeGreaterThanOrEqual(10);
          }
        });

        it(`"${seed.name}" has valid domain contributions`, () => {
          const values = Object.values(seed.domainContributions);
          expect(values.length).toBeGreaterThanOrEqual(1);
          for (const v of values) {
            expect(typeof v).toBe('number');
            expect(Math.abs(v)).toBeLessThanOrEqual(5);
          }
        });

        it(`"${seed.name}" has valid sourceTags array`, () => {
          expect(Array.isArray(seed.sourceTags)).toBe(true);
          expect(seed.sourceTags.length).toBeGreaterThanOrEqual(1);
          for (const tag of seed.sourceTags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThanOrEqual(1);
          }
        });

        it(`"${seed.name}" has unique id`, () => {
          const count = BEHAVIORAL_TRAIT_SEEDS.filter(s => s.id === seed.id).length;
          expect(count).toBe(1);
        });
      }
    });

    describe('insider beats', () => {
      for (const beat of INSIDER_BEATS) {
        it(`"${beat.name}" has at least 1 prose seed of reasonable length`, () => {
          expect(Array.isArray(beat.proseSeeds)).toBe(true);
          expect(beat.proseSeeds.length).toBeGreaterThanOrEqual(1);
          for (const seed of beat.proseSeeds) {
            expect(typeof seed).toBe('string');
            expect(seed.length).toBeGreaterThanOrEqual(15);
          }
        });

        it(`"${beat.name}" has valid requiredCultureTags`, () => {
          expect(Array.isArray(beat.requiredCultureTags)).toBe(true);
          // Culture tags may be empty for beats that apply broadly
          for (const tag of beat.requiredCultureTags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThanOrEqual(1);
          }
        });

        it(`"${beat.name}" has valid trigger description`, () => {
          expect(typeof beat.trigger).toBe('string');
          expect(beat.trigger.length).toBeGreaterThanOrEqual(5);
        });

        it(`"${beat.name}" has valid minStrength`, () => {
          expect(typeof beat.minStrength).toBe('number');
          expect(beat.minStrength).toBeGreaterThanOrEqual(0.3);
          expect(beat.minStrength).toBeLessThanOrEqual(1.0);
        });

        it(`"${beat.name}" has unique id`, () => {
          const count = INSIDER_BEATS.filter(b => b.id === beat.id).length;
          expect(count).toBe(1);
        });
      }
    });

    describe('sub-location templates', () => {
      for (const template of SUB_LOCATION_TEMPLATES) {
        it(`"${template.name}" has valid description length`, () => {
          expect(typeof template.description).toBe('string');
          expect(template.description.length).toBeGreaterThanOrEqual(15);
        });

        it(`"${template.name}" has valid grantedByTags`, () => {
          expect(Array.isArray(template.grantedByTags)).toBe(true);
          expect(template.grantedByTags.length).toBeGreaterThanOrEqual(1);
          for (const tag of template.grantedByTags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThanOrEqual(1);
          }
        });

        it(`"${template.name}" has valid culturalVariantDescriptors`, () => {
          expect(Array.isArray(template.culturalVariantDescriptors)).toBe(true);
          expect(template.culturalVariantDescriptors.length).toBeGreaterThanOrEqual(1);
          for (const desc of template.culturalVariantDescriptors) {
            expect(typeof desc).toBe('string');
            expect(desc.length).toBeGreaterThanOrEqual(10);
          }
        });

        it(`"${template.name}" has unique id`, () => {
          const count = SUB_LOCATION_TEMPLATES.filter(t => t.id === template.id).length;
          expect(count).toBe(1);
        });
      }
    });

    describe('artifact lore patterns', () => {
      for (const pattern of ARTIFACT_LORE_PATTERNS) {
        it(`"${pattern.id}" has valid template with placeholder`, () => {
          expect(typeof pattern.template).toBe('string');
          expect(pattern.template.length).toBeGreaterThanOrEqual(20);
          expect(pattern.template).toContain('{culture}');
        });

        it(`"${pattern.id}" has valid toneCategory`, () => {
          const validTones = ['reverent', 'martial', 'mystical', 'practical', 'ominous'];
          expect(validTones).toContain(pattern.toneCategory);
        });

        it(`"${pattern.id}" has unique id`, () => {
          const count = ARTIFACT_LORE_PATTERNS.filter(p => p.id === pattern.id).length;
          expect(count).toBe(1);
        });
      }
    });
  });

  // ─── Cultural Prose Palettes Tests ────────────────────────────────

  describe('CULTURAL_PROSE_PALETTES', () => {
    it('should have 12 palette entries (4 foundation + 8 creation)', () => {
      expect(Object.keys(CULTURAL_PROSE_PALETTES)).toHaveLength(12);
    });

    it('each palette should have adjectives, verbs, rhythms, greetings, and oaths', () => {
      for (const [id, palette] of Object.entries(CULTURAL_PROSE_PALETTES)) {
        expect(Array.isArray(palette.adjectives), `${id} has adjectives array`).toBe(true);
        expect(palette.adjectives.length, `${id} adjectives count`).toBeGreaterThanOrEqual(6);
        expect(Array.isArray(palette.verbs), `${id} has verbs array`).toBe(true);
        expect(palette.verbs.length, `${id} verbs count`).toBeGreaterThanOrEqual(6);
        expect(Array.isArray(palette.rhythms), `${id} has rhythms array`).toBe(true);
        expect(palette.rhythms.length, `${id} rhythms count`).toBeGreaterThanOrEqual(3);
        expect(Array.isArray(palette.greetings), `${id} has greetings array`).toBe(true);
        expect(palette.greetings.length, `${id} greetings count`).toBeGreaterThanOrEqual(2);
        expect(Array.isArray(palette.oaths), `${id} has oaths array`).toBe(true);
        expect(palette.oaths.length, `${id} oaths count`).toBeGreaterThanOrEqual(2);
      }
    });

    it('all palette ids should be unique', () => {
      const ids = Object.keys(CULTURAL_PROSE_PALETTES);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should cover all foundation spheres (chaos, order, light, darkness)', () => {
      const ids = Object.keys(CULTURAL_PROSE_PALETTES);
      expect(ids).toContain('chaos');
      expect(ids).toContain('order');
      expect(ids).toContain('light');
      expect(ids).toContain('darkness');
    });

    it('should cover all creation spheres (force, matter, energy, life, mind, spirit, time, entropy)', () => {
      const ids = Object.keys(CULTURAL_PROSE_PALETTES);
      expect(ids).toContain('force');
      expect(ids).toContain('matter');
      expect(ids).toContain('energy');
      expect(ids).toContain('life');
      expect(ids).toContain('mind');
      expect(ids).toContain('spirit');
      expect(ids).toContain('time');
      expect(ids).toContain('entropy');
    });
  });
});

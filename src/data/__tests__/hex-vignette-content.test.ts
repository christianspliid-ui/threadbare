import { describe, it, expect } from 'vitest';
import {
  TERRAIN_OPENINGS,
  CLIMATE_MATRIX,
  POPULATION_PHRASES,
  LOCATION_TEMPLATES,
  CULTURE_PHRASES,
  SPHERE_AURA_PHRASES,
  FACTION_PHRASES,
  ENCOUNTER_PHRASES,
  COMPASS_WORDS,
  VISIBILITY_WRAPPERS,
  SUBTYPE_DISPLAY_NAMES,
} from '../hex-vignette-content';

const ALL_TERRAINS = [
  'ocean','coastal_shallows','lake','river',
  'grassland','farmland','savanna','steppe',
  'temperate_forest','dense_forest','boreal_forest','jungle',
  'swamp','marsh',
  'hills','mountains','plateau','badlands',
  'forested_hills',
  'great_home_trees','broken_lands',
  'desert','tundra','glacier','volcano',
] as const;

const TEMP_BANDS = ['frigid','cold','temperate','warm','scorching'] as const;
const MOISTURE_BANDS = ['arid','dry','moderate','damp','saturated'] as const;
const POP_BANDS = ['empty','sparse','moderate','bustling'] as const;
const COMPASS_DIRS = ['north','northeast','east','southeast','south','southwest','west','northwest'] as const;

describe('hex-vignette-content', () => {
  describe('TERRAIN_OPENINGS', () => {
    it('has entries for all 25 terrain types', () => {
      for (const t of ALL_TERRAINS) {
        expect(TERRAIN_OPENINGS[t], `missing terrain: ${t}`).toBeDefined();
        expect(TERRAIN_OPENINGS[t].length).toBeGreaterThanOrEqual(2);
      }
    });

    it('all entries are non-empty strings', () => {
      for (const variants of Object.values(TERRAIN_OPENINGS)) {
        for (const s of variants) {
          expect(typeof s).toBe('string');
          expect(s.length).toBeGreaterThan(10);
        }
      }
    });
  });

  describe('CLIMATE_MATRIX', () => {
    it('covers all 25 temperature×moisture combinations', () => {
      for (const t of TEMP_BANDS) {
        for (const m of MOISTURE_BANDS) {
          expect(CLIMATE_MATRIX[t][m], `missing ${t}×${m}`).toBeDefined();
          expect(CLIMATE_MATRIX[t][m].length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('all entries are non-empty strings', () => {
      for (const tempMap of Object.values(CLIMATE_MATRIX)) {
        for (const variants of Object.values(tempMap)) {
          for (const s of variants) {
            expect(typeof s).toBe('string');
            expect(s.length).toBeGreaterThan(10);
          }
        }
      }
    });
  });

  describe('POPULATION_PHRASES', () => {
    it('covers all 4 bands', () => {
      for (const b of POP_BANDS) {
        expect(POPULATION_PHRASES[b], `missing band: ${b}`).toBeDefined();
        expect(POPULATION_PHRASES[b].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('LOCATION_TEMPLATES', () => {
    it('has at least 3 templates', () => {
      expect(LOCATION_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it('all templates contain required slots', () => {
      for (const t of LOCATION_TEMPLATES) {
        expect(t).toContain('{name}');
        expect(t).toContain('{subtype}');
      }
    });
  });

  describe('CULTURE_PHRASES', () => {
    it('has at least 3 variants', () => {
      expect(CULTURE_PHRASES.length).toBeGreaterThanOrEqual(3);
    });

    it('all contain {cultureName} slot', () => {
      for (const p of CULTURE_PHRASES) {
        expect(p).toContain('{cultureName}');
      }
    });
  });

  describe('SPHERE_AURA_PHRASES', () => {
    it('has entries for all 12 spheres', () => {
      const expected = ['force','matter','energy','life','mind','spirit','time','entropy','chaos','order','light','darkness'];
      for (const s of expected) {
        expect(SPHERE_AURA_PHRASES[s as keyof typeof SPHERE_AURA_PHRASES], `missing sphere: ${s}`).toBeDefined();
        expect(SPHERE_AURA_PHRASES[s as keyof typeof SPHERE_AURA_PHRASES].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('FACTION_PHRASES', () => {
    it('has at least 3 variants with {factionName} slot', () => {
      expect(FACTION_PHRASES.length).toBeGreaterThanOrEqual(3);
      for (const p of FACTION_PHRASES) {
        expect(p).toContain('{factionName}');
      }
    });
  });

  describe('ENCOUNTER_PHRASES', () => {
    it('has at least 2 variants with required slots', () => {
      expect(ENCOUNTER_PHRASES.length).toBeGreaterThanOrEqual(2);
      for (const p of ENCOUNTER_PHRASES) {
        expect(p).toContain('{encounterType}');
        expect(p).toContain('{locationName}');
      }
    });
  });

  describe('COMPASS_WORDS', () => {
    it('covers all 8 directions', () => {
      for (const d of COMPASS_DIRS) {
        expect(COMPASS_WORDS[d], `missing direction: ${d}`).toBeDefined();
        expect(COMPASS_WORDS[d].length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('VISIBILITY_WRAPPERS', () => {
    it('visible wrapper is identity', () => {
      const w = VISIBILITY_WRAPPERS.visible;
      expect(w.wrapTier1('Test.')).toBe('Test.');
      expect(w.wrapTier2('Test.')).toBe('Test.');
      expect(w.wrapTier3('Test.')).toBe('Test.');
    });

    it('remembered wrapper transforms to memory voice', () => {
      const w = VISIBILITY_WRAPPERS.remembered;
      const result = w.wrapTier1('Dense forest covers the land.');
      expect(result).toContain('recall');
    });
  });

  describe('SUBTYPE_DISPLAY_NAMES', () => {
    it('has entries for all 20 location subtypes', () => {
      const subtypes = [
        'hamlet','town','city','capital','camp','farmland',
        'castle','fort','tower','shrine','temple','mining',
        'ruins','ruined_tower','ruined_city','ruined_village',
        'battleground','oasis','unexplored_poi','wilderness',
      ];
      for (const s of subtypes) {
        expect(SUBTYPE_DISPLAY_NAMES[s as keyof typeof SUBTYPE_DISPLAY_NAMES], `missing subtype: ${s}`).toBeDefined();
      }
    });
  });
});

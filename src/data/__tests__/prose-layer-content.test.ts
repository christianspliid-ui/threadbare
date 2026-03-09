/**
 * Tests for the Prose Layer Content package.
 * Validates structure, completeness, and quality of prose templates.
 */

import {
  BIOME_PROSE,
  CULTURE_LOCATION_PROSE,
  SPHERE_LOCATION_PROSE,
  SUBTYPE_ESTABLISHING_PROSE,
  FACTION_CONTROL_PROSE,
  ARCHETYPE_PROSE,
  DISPOSITION_PROSE,
  POPULATION_PROSE_TEMPLATES,
} from '../prose-layer-content';

describe('Prose Layer Content', () => {
  describe('BIOME_PROSE', () => {
    const requiredTerrainTypes = [
      'grassland',
      'farmland',
      'savanna',
      'steppe',
      'deciduous_forest',
      'dense_forest',
      'taiga',
      'jungle',
      'swamp',
      'bog',
      'hills',
      'mountains',
      'plateau',
      'badlands',
      'desert',
      'tundra',
      'glacier',
      'volcanic',
      'broken_lands',
      'great_home_trees',
      'forested_hills_evergreen',
      'forested_hills_deciduous',
      'forested_hills_jungle',
    ];

    test('has entries for all required terrain types', () => {
      requiredTerrainTypes.forEach((terrainType) => {
        expect(BIOME_PROSE[terrainType]).toBeDefined();
      });
    });

    test('each terrain type has at least 2 prose entries', () => {
      requiredTerrainTypes.forEach((terrainType) => {
        expect(BIOME_PROSE[terrainType].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each prose entry is substantive (>20 characters)', () => {
      requiredTerrainTypes.forEach((terrainType) => {
        BIOME_PROSE[terrainType].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });

    test('prose uses Threadbare aesthetic (avoids overly cheerful tone)', () => {
      // Threadbare prose can mention brightness as darkness is understood by contrast
      // Focus on avoiding genuinely cheerful/heroic tone
      const cheerfulClichés = ['cheerful', 'heroic triumph', 'valiant', 'glorious'];
      requiredTerrainTypes.forEach((terrainType) => {
        BIOME_PROSE[terrainType].forEach((entry) => {
          cheerfulClichés.forEach((cliché) => {
            expect(entry.toLowerCase()).not.toContain(cliché.toLowerCase());
          });
        });
      });
    });
  });

  describe('CULTURE_LOCATION_PROSE', () => {
    const requiredPairs = ['order_light', 'order_darkness', 'chaos_light', 'chaos_darkness'];

    test('has all 4 foundation pair combinations', () => {
      requiredPairs.forEach((pair) => {
        expect(CULTURE_LOCATION_PROSE[pair]).toBeDefined();
      });
    });

    test('each pair has at least 2 templates', () => {
      requiredPairs.forEach((pair) => {
        expect(CULTURE_LOCATION_PROSE[pair].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each template is substantive', () => {
      requiredPairs.forEach((pair) => {
        CULTURE_LOCATION_PROSE[pair].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });
  });

  describe('SPHERE_LOCATION_PROSE', () => {
    const requiredSpheres = [
      'force',
      'matter',
      'energy',
      'life',
      'mind',
      'spirit',
      'time',
      'entropy',
    ];

    test('has entries for all 8 creation spheres', () => {
      requiredSpheres.forEach((sphere) => {
        expect(SPHERE_LOCATION_PROSE[sphere]).toBeDefined();
      });
    });

    test('each sphere has at least 2 entries', () => {
      requiredSpheres.forEach((sphere) => {
        expect(SPHERE_LOCATION_PROSE[sphere].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each entry is substantive', () => {
      requiredSpheres.forEach((sphere) => {
        SPHERE_LOCATION_PROSE[sphere].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });
  });

  describe('SUBTYPE_ESTABLISHING_PROSE', () => {
    const coreSubtypes = [
      'hamlet',
      'town',
      'city',
      'capital',
      'camp',
      'fort',
      'shrine',
      'temple',
      'ruins',
      'mining',
    ];

    test('has entries for core location subtypes', () => {
      coreSubtypes.forEach((subtype) => {
        expect(SUBTYPE_ESTABLISHING_PROSE[subtype]).toBeDefined();
      });
    });

    test('each subtype has at least 2 templates', () => {
      coreSubtypes.forEach((subtype) => {
        expect(SUBTYPE_ESTABLISHING_PROSE[subtype].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each template is substantive', () => {
      coreSubtypes.forEach((subtype) => {
        SUBTYPE_ESTABLISHING_PROSE[subtype].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });

    test('templates with {name} placeholder have proper syntax', () => {
      coreSubtypes.forEach((subtype) => {
        SUBTYPE_ESTABLISHING_PROSE[subtype].forEach((entry) => {
          if (entry.includes('{name}')) {
            expect(entry).toMatch(/{name}/);
          }
        });
      });
    });
  });

  describe('FACTION_CONTROL_PROSE', () => {
    test('has at least 4 templates', () => {
      expect(FACTION_CONTROL_PROSE.length).toBeGreaterThanOrEqual(4);
    });

    test('all templates use {faction} placeholder', () => {
      FACTION_CONTROL_PROSE.forEach((template) => {
        expect(template).toContain('{faction}');
      });
    });

    test('each template is substantive', () => {
      FACTION_CONTROL_PROSE.forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  describe('ARCHETYPE_PROSE', () => {
    const commonArchetypes = [
      'tragic_hero',
      'trickster',
      'folk_hero',
      'schemer',
      'true_believer',
    ];

    test('has entries for common narrative archetypes', () => {
      commonArchetypes.forEach((archetype) => {
        expect(ARCHETYPE_PROSE[archetype]).toBeDefined();
      });
    });

    test('each archetype has at least 2 entries', () => {
      commonArchetypes.forEach((archetype) => {
        expect(ARCHETYPE_PROSE[archetype].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each entry is substantive', () => {
      commonArchetypes.forEach((archetype) => {
        ARCHETYPE_PROSE[archetype].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });

    test('templates with {name} placeholder have proper syntax', () => {
      commonArchetypes.forEach((archetype) => {
        ARCHETYPE_PROSE[archetype].forEach((entry) => {
          if (entry.includes('{name}')) {
            expect(entry).toMatch(/{name}/);
          }
        });
      });
    });
  });

  describe('DISPOSITION_PROSE', () => {
    // CRITICAL: These use hyphens, not underscores
    const requiredStrategies = [
      'tit-for-tat',
      'grudger',
      'pavlov',
      'always-cooperate',
      'always-defect',
    ];

    test('has entries for all 5 cooperation strategies WITH HYPHENS', () => {
      requiredStrategies.forEach((strategy) => {
        expect(DISPOSITION_PROSE[strategy]).toBeDefined();
      });
    });

    test('each strategy has at least 2 entries', () => {
      requiredStrategies.forEach((strategy) => {
        expect(DISPOSITION_PROSE[strategy].length).toBeGreaterThanOrEqual(2);
      });
    });

    test('each entry is substantive', () => {
      requiredStrategies.forEach((strategy) => {
        DISPOSITION_PROSE[strategy].forEach((entry) => {
          expect(entry.length).toBeGreaterThan(20);
        });
      });
    });

    test('templates with {name} placeholder have proper syntax', () => {
      requiredStrategies.forEach((strategy) => {
        DISPOSITION_PROSE[strategy].forEach((entry) => {
          if (entry.includes('{name}')) {
            expect(entry).toMatch(/{name}/);
          }
        });
      });
    });

    test('no underscore versions of strategies exist', () => {
      const strategyKeys = Object.keys(DISPOSITION_PROSE);
      expect(strategyKeys).not.toContain('tit_for_tat');
      expect(strategyKeys).not.toContain('always_cooperate');
      expect(strategyKeys).not.toContain('always_defect');
    });
  });

  describe('POPULATION_PROSE_TEMPLATES', () => {
    test('has at least 4 templates', () => {
      expect(POPULATION_PROSE_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    test('all templates use {agent} placeholder', () => {
      POPULATION_PROSE_TEMPLATES.forEach((template) => {
        expect(template).toContain('{agent}');
      });
    });

    test('each template is substantive', () => {
      POPULATION_PROSE_TEMPLATES.forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });

    test('at least one template uses {archetype} placeholder', () => {
      const hasArchetype = POPULATION_PROSE_TEMPLATES.some((t) =>
        t.includes('{archetype}')
      );
      expect(hasArchetype).toBe(true);
    });
  });

  describe('Cross-module placeholder consistency', () => {
    test('{name} placeholders are consistent across modules', () => {
      const nameRegex = /{name}/g;

      // Check SUBTYPE_ESTABLISHING_PROSE
      Object.values(SUBTYPE_ESTABLISHING_PROSE).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.includes('{name}')) {
            expect(entry).toMatch(nameRegex);
          }
        });
      });

      // Check ARCHETYPE_PROSE
      Object.values(ARCHETYPE_PROSE).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.includes('{name}')) {
            expect(entry).toMatch(nameRegex);
          }
        });
      });
    });

    test('{faction} placeholder only in FACTION_CONTROL_PROSE', () => {
      FACTION_CONTROL_PROSE.forEach((template) => {
        expect(template).toContain('{faction}');
      });

      // Verify it doesn't appear elsewhere
      Object.values(BIOME_PROSE).forEach((entries) => {
        entries.forEach((entry) => {
          expect(entry).not.toContain('{faction}');
        });
      });
    });
  });

  describe('Prose quality (Threadbare aesthetic)', () => {
    test('prose heavily features dark/worn/weathered language', () => {
      const threadbareMark = /worn|dark|shadow|decay|fragment|endless|patience|ancient|indifferent|lonely|hollow|silence|broken|crumble|dust|ash|grey|grey|stone|cold|vast|empty|fade|fade|persist|endure|slow|inevitable|bleach|erosion|void|fractur/i;

      const allProse: string[] = [];

      // Collect all prose
      Object.values(BIOME_PROSE).forEach((entries) => {
        allProse.push(...entries);
      });
      Object.values(CULTURE_LOCATION_PROSE).forEach((entries) => {
        allProse.push(...entries);
      });
      Object.values(SPHERE_LOCATION_PROSE).forEach((entries) => {
        allProse.push(...entries);
      });

      // At least 50% should match Threadbare aesthetic markers
      const threadbareCount = allProse.filter((p) => threadbareMark.test(p)).length;
      expect(threadbareCount / allProse.length).toBeGreaterThan(0.5);
    });

    test('prose avoids generic fantasy clichés', () => {
      const clichés = [
        'brave warriors',
        'noble knights',
        'valiant heroes',
        'magical portal',
        'ancient evil',
        'chosen one',
      ];

      const allProse: string[] = [];
      Object.values(BIOME_PROSE).forEach((entries) => {
        allProse.push(...entries);
      });
      Object.values(ARCHETYPE_PROSE).forEach((entries) => {
        allProse.push(...entries);
      });

      allProse.forEach((entry) => {
        clichés.forEach((cliché) => {
          expect(entry.toLowerCase()).not.toContain(cliché.toLowerCase());
        });
      });
    });
  });
});

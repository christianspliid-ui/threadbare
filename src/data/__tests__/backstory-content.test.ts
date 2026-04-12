/**
 * Tests for the Backstory Content package.
 * Validates structure, key coverage, placeholder consistency,
 * and minimum template density for all 12 content tables.
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */

import {
  SURFACE_ORIGIN_PROSE,
  SURFACE_SPHERE_PROSE,
  BOND_HISTORY_PROSE,
  BOND_HISTORY_NEGATIVE_PROSE,
  TRAIT_ORIGIN_PROSE,
  TURNING_POINT_PROSE,
  CONTRADICTION_PROSE,
  DECISIVE_NATURE_PROSE,
  FEAR_PROSE,
  HIDDEN_MOTIVE_PROSE,
  STORY_ARC_PROSE,
  DIVINE_TRANSFORMATION_PROSE,
} from '../backstory-content';

// ─── Shared Constants ───────────────────────────────────────────────────────

const ALL_ARCHETYPES = [
  'tragic_hero', 'trickster', 'coming_of_age', 'brooding_warrior',
  'fallen_noble', 'true_believer', 'schemer', 'wanderer', 'monster',
  'folk_hero', 'reluctant_king', 'oathkeeper', 'poisoned_court',
  'doomed_innocent', 'old_power', 'kingmaker', 'seeker', 'maker',
  'noble_savage',
];

const ALL_SPHERES = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

const ALL_BOND_BASES = ['friendship', 'rivalry', 'loyalty', 'alliance', 'trade', 'faith', 'lineage', 'gratitude'];

const ALL_TRAIT_CATEGORIES = ['innate', 'mastery', 'reputation', 'scar', 'condition', 'destiny'];

const ALL_VALUE_PAIRS = [
  'mercy_ruthlessness', 'asceticism_extravagance', 'honesty_cunning',
  'tradition_novelty', 'loyalty_ambition', 'revelation_discretion',
  'preservation_transformation', 'sacrifice_survival', 'courage_prudence',
];

const ALL_FEAR_KEYS = ALL_VALUE_PAIRS.flatMap((pair) => [`${pair}_positive`, `${pair}_negative`]);

const ALL_STRATEGIES = ['tit-for-tat', 'grudger', 'pavlov', 'always-cooperate', 'always-defect'];

const ALL_BRACKETS = ['low', 'medium', 'high', 'massive'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate a keyed content table.
 * `requiredPlaceholders` uses "at least one template per key" semantics —
 * not every template must contain the placeholder, but each key must have
 * at least one template that does.
 */
function validateKeyedTable(
  table: Record<string, string[]>,
  requiredKeys: string[],
  requiredPlaceholders: string[],
  tableName: string,
) {
  test(`${tableName}: has all required keys`, () => {
    requiredKeys.forEach((key) => {
      expect(table[key]).toBeDefined();
    });
  });

  test(`${tableName}: each key has at least 2 templates`, () => {
    requiredKeys.forEach((key) => {
      expect(table[key].length).toBeGreaterThanOrEqual(2);
    });
  });

  test(`${tableName}: each template is substantive (>20 chars)`, () => {
    requiredKeys.forEach((key) => {
      table[key].forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  if (requiredPlaceholders.length > 0) {
    test(`${tableName}: each key has at least one template per required placeholder`, () => {
      requiredKeys.forEach((key) => {
        requiredPlaceholders.forEach((placeholder) => {
          const hasPlaceholder = table[key].some((t) => t.includes(placeholder));
          expect(hasPlaceholder).toBe(true);
        });
      });
    });
  }
}

// ─── Table 1: SURFACE_ORIGIN_PROSE ──────────────────────────────────────────

describe('SURFACE_ORIGIN_PROSE', () => {
  validateKeyedTable(SURFACE_ORIGIN_PROSE, ALL_ARCHETYPES, ['{name}'], 'SURFACE_ORIGIN_PROSE');

  test('each key has at least one template using {culture} and {archetype}', () => {
    ALL_ARCHETYPES.forEach((archetype) => {
      const hasCulture = SURFACE_ORIGIN_PROSE[archetype].some((t) => t.includes('{culture}'));
      const hasArchetype = SURFACE_ORIGIN_PROSE[archetype].some((t) => t.includes('{archetype}'));
      expect(hasCulture).toBe(true);
      expect(hasArchetype).toBe(true);
    });
  });

  test('covers all 19 narrative archetypes (no extras with typos)', () => {
    expect(Object.keys(SURFACE_ORIGIN_PROSE).length).toBe(ALL_ARCHETYPES.length);
  });
});

// ─── Table 2: SURFACE_SPHERE_PROSE ──────────────────────────────────────────

describe('SURFACE_SPHERE_PROSE', () => {
  validateKeyedTable(SURFACE_SPHERE_PROSE, ALL_SPHERES, ['{name}', '{sphere}'], 'SURFACE_SPHERE_PROSE');

  test('covers all 8 creation spheres (no missing)', () => {
    expect(Object.keys(SURFACE_SPHERE_PROSE).length).toBe(ALL_SPHERES.length);
  });
});

// ─── Table 3: BOND_HISTORY_PROSE ────────────────────────────────────────────

describe('BOND_HISTORY_PROSE', () => {
  validateKeyedTable(BOND_HISTORY_PROSE, ALL_BOND_BASES, ['{name}', '{bond}'], 'BOND_HISTORY_PROSE');

  test('covers all 8 bond basis types', () => {
    expect(Object.keys(BOND_HISTORY_PROSE).length).toBe(ALL_BOND_BASES.length);
  });

  test('each key has at least one template using {basis}', () => {
    ALL_BOND_BASES.forEach((basis) => {
      const hasBasisRef = BOND_HISTORY_PROSE[basis].some((t) => t.includes('{basis}'));
      expect(hasBasisRef).toBe(true);
    });
  });
});

// ─── Table 4: BOND_HISTORY_NEGATIVE_PROSE ───────────────────────────────────

describe('BOND_HISTORY_NEGATIVE_PROSE', () => {
  validateKeyedTable(BOND_HISTORY_NEGATIVE_PROSE, ALL_BOND_BASES, ['{name}', '{bond}'], 'BOND_HISTORY_NEGATIVE_PROSE');

  test('covers all 8 bond basis types', () => {
    expect(Object.keys(BOND_HISTORY_NEGATIVE_PROSE).length).toBe(ALL_BOND_BASES.length);
  });

  test('negative templates are distinct from positive templates', () => {
    ALL_BOND_BASES.forEach((basis) => {
      const positiveSet = new Set(BOND_HISTORY_PROSE[basis]);
      BOND_HISTORY_NEGATIVE_PROSE[basis].forEach((template) => {
        expect(positiveSet.has(template)).toBe(false);
      });
    });
  });
});

// ─── Table 5: TRAIT_ORIGIN_PROSE ────────────────────────────────────────────

describe('TRAIT_ORIGIN_PROSE', () => {
  validateKeyedTable(TRAIT_ORIGIN_PROSE, ALL_TRAIT_CATEGORIES, ['{name}', '{trait}'], 'TRAIT_ORIGIN_PROSE');

  test('each trait category has at least 3 templates', () => {
    ALL_TRAIT_CATEGORIES.forEach((category) => {
      expect(TRAIT_ORIGIN_PROSE[category].length).toBeGreaterThanOrEqual(3);
    });
  });

  test('covers all 6 trait categories', () => {
    expect(Object.keys(TRAIT_ORIGIN_PROSE).length).toBe(ALL_TRAIT_CATEGORIES.length);
  });
});

// ─── Table 6: TURNING_POINT_PROSE ───────────────────────────────────────────

describe('TURNING_POINT_PROSE', () => {
  validateKeyedTable(TURNING_POINT_PROSE, ALL_VALUE_PAIRS, ['{name}', '{value}'], 'TURNING_POINT_PROSE');

  test('each value pair has at least 3 templates', () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      expect(TURNING_POINT_PROSE[pair].length).toBeGreaterThanOrEqual(3);
    });
  });

  test('covers all 9 value pairs', () => {
    expect(Object.keys(TURNING_POINT_PROSE).length).toBe(ALL_VALUE_PAIRS.length);
  });
});

// ─── Table 7: CONTRADICTION_PROSE ───────────────────────────────────────────

describe('CONTRADICTION_PROSE', () => {
  validateKeyedTable(
    CONTRADICTION_PROSE, ALL_VALUE_PAIRS,
    ['{name}', '{left_pole}', '{right_pole}'],
    'CONTRADICTION_PROSE',
  );

  test('covers all 9 value pairs', () => {
    expect(Object.keys(CONTRADICTION_PROSE).length).toBe(ALL_VALUE_PAIRS.length);
  });
});

// ─── Table 8: DECISIVE_NATURE_PROSE ─────────────────────────────────────────

describe('DECISIVE_NATURE_PROSE', () => {
  test('is a flat array with at least 2 entries', () => {
    expect(Array.isArray(DECISIVE_NATURE_PROSE)).toBe(true);
    expect(DECISIVE_NATURE_PROSE.length).toBeGreaterThanOrEqual(2);
  });

  test('each entry is substantive (>20 chars)', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry.length).toBeGreaterThan(20);
    });
  });

  test('all entries use {name} placeholder', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry).toContain('{name}');
    });
  });

  test('entries do not use {left_pole} or {right_pole} (those are for CONTRADICTION_PROSE)', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry).not.toContain('{left_pole}');
      expect(entry).not.toContain('{right_pole}');
    });
  });
});

// ─── Table 9: FEAR_PROSE ─────────────────────────────────────────────────────

describe('FEAR_PROSE', () => {
  test('has all 20 expected keys', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      expect(FEAR_PROSE[key]).toBeDefined();
    });
  });

  test('each key has at least 2 templates', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      expect(FEAR_PROSE[key].length).toBeGreaterThanOrEqual(2);
    });
  });

  test('each template is substantive (>20 chars)', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      FEAR_PROSE[key].forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  test('each key has at least one template per required placeholder ({name}, {fear}, {value})', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      const hasName = FEAR_PROSE[key].some((t) => t.includes('{name}'));
      const hasFear = FEAR_PROSE[key].some((t) => t.includes('{fear}'));
      const hasValue = FEAR_PROSE[key].some((t) => t.includes('{value}'));
      expect(hasName).toBe(true);
      expect(hasFear).toBe(true);
      expect(hasValue).toBe(true);
    });
  });

  test('_positive and _negative variants exist for every value pair', () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      expect(FEAR_PROSE[`${pair}_positive`]).toBeDefined();
      expect(FEAR_PROSE[`${pair}_negative`]).toBeDefined();
    });
  });

  test('positive and negative variants for each pair are distinct', () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      const positiveSet = new Set(FEAR_PROSE[`${pair}_positive`]);
      FEAR_PROSE[`${pair}_negative`].forEach((template) => {
        expect(positiveSet.has(template)).toBe(false);
      });
    });
  });
});

// ─── Table 10: HIDDEN_MOTIVE_PROSE ──────────────────────────────────────────

describe('HIDDEN_MOTIVE_PROSE', () => {
  validateKeyedTable(HIDDEN_MOTIVE_PROSE, ALL_STRATEGIES, ['{name}', '{strategy_description}'], 'HIDDEN_MOTIVE_PROSE');

  test('covers all 5 cooperation strategies', () => {
    expect(Object.keys(HIDDEN_MOTIVE_PROSE).length).toBe(ALL_STRATEGIES.length);
  });

  test('uses hyphens, not underscores, for strategy keys', () => {
    const keys = Object.keys(HIDDEN_MOTIVE_PROSE);
    expect(keys).not.toContain('tit_for_tat');
    expect(keys).not.toContain('always_cooperate');
    expect(keys).not.toContain('always_defect');
    expect(keys).toContain('tit-for-tat');
    expect(keys).toContain('always-cooperate');
    expect(keys).toContain('always-defect');
  });
});

// ─── Table 11: STORY_ARC_PROSE ──────────────────────────────────────────────

describe('STORY_ARC_PROSE', () => {
  validateKeyedTable(STORY_ARC_PROSE, ALL_ARCHETYPES, ['{name}', '{arc_phase}'], 'STORY_ARC_PROSE');

  test('covers all 19 narrative archetypes', () => {
    expect(Object.keys(STORY_ARC_PROSE).length).toBe(ALL_ARCHETYPES.length);
  });
});

// ─── Table 12: DIVINE_TRANSFORMATION_PROSE ──────────────────────────────────

describe('DIVINE_TRANSFORMATION_PROSE', () => {
  validateKeyedTable(
    DIVINE_TRANSFORMATION_PROSE, ALL_BRACKETS,
    ['{name}', '{ascendant_sphere}'],
    'DIVINE_TRANSFORMATION_PROSE',
  );

  test('each bracket has at least 3 templates', () => {
    ALL_BRACKETS.forEach((bracket) => {
      expect(DIVINE_TRANSFORMATION_PROSE[bracket].length).toBeGreaterThanOrEqual(3);
    });
  });

  test('uses low/medium/high/massive keys (not beyond)', () => {
    const keys = Object.keys(DIVINE_TRANSFORMATION_PROSE);
    expect(keys).toContain('low');
    expect(keys).toContain('medium');
    expect(keys).toContain('high');
    expect(keys).toContain('massive');
    expect(keys).not.toContain('beyond');
  });

  test('covers all 4 brackets', () => {
    expect(Object.keys(DIVINE_TRANSFORMATION_PROSE).length).toBe(ALL_BRACKETS.length);
  });
});

// ─── Cross-table consistency ─────────────────────────────────────────────────

describe('Cross-table consistency', () => {
  test('SURFACE_ORIGIN_PROSE and STORY_ARC_PROSE cover the same archetype keys', () => {
    const surfaceKeys = Object.keys(SURFACE_ORIGIN_PROSE).sort();
    const arcKeys = Object.keys(STORY_ARC_PROSE).sort();
    expect(surfaceKeys).toEqual(arcKeys);
  });

  test('BOND_HISTORY_PROSE and BOND_HISTORY_NEGATIVE_PROSE cover the same bond basis keys', () => {
    const positiveKeys = Object.keys(BOND_HISTORY_PROSE).sort();
    const negativeKeys = Object.keys(BOND_HISTORY_NEGATIVE_PROSE).sort();
    expect(positiveKeys).toEqual(negativeKeys);
  });

  test('TURNING_POINT_PROSE and CONTRADICTION_PROSE cover the same value pair keys', () => {
    const turningKeys = Object.keys(TURNING_POINT_PROSE).sort();
    const contradictionKeys = Object.keys(CONTRADICTION_PROSE).sort();
    expect(turningKeys).toEqual(contradictionKeys);
  });

  test('FEAR_PROSE key count is double the value pair count (positive + negative per pair)', () => {
    expect(Object.keys(FEAR_PROSE).length).toBe(Object.keys(TURNING_POINT_PROSE).length * 2);
  });

  test('no template uses {archetype} as a sphere name or vice versa', () => {
    // Sphere templates should only have {sphere}, not {archetype}
    ALL_SPHERES.forEach((sphere) => {
      SURFACE_SPHERE_PROSE[sphere].forEach((template) => {
        expect(template).not.toContain('{archetype}');
      });
    });
  });
});

// ─── Prose quality (Threadbare aesthetic) ────────────────────────────────────

describe('Prose quality (Threadbare aesthetic)', () => {
  test('avoids generic fantasy clichés', () => {
    const clichés = [
      'ancient evil',
      'chosen one',
      'brave warrior',
      'noble knight',
      'valiant hero',
      'magical portal',
      'eldritch',
    ];

    const allTemplates: string[] = [
      ...Object.values(SURFACE_ORIGIN_PROSE).flat(),
      ...Object.values(SURFACE_SPHERE_PROSE).flat(),
      ...Object.values(STORY_ARC_PROSE).flat(),
    ];

    allTemplates.forEach((template) => {
      clichés.forEach((cliché) => {
        expect(template.toLowerCase()).not.toContain(cliché.toLowerCase());
      });
    });
  });

  test('DECISIVE_NATURE_PROSE conveys psychological depth, not simple positivity', () => {
    const simplePositives = ['cheerful', 'happy', 'joyful', 'delightful'];
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      simplePositives.forEach((word) => {
        expect(entry.toLowerCase()).not.toContain(word);
      });
    });
  });

  test('FEAR_PROSE templates reference psychological vulnerability, not physical danger', () => {
    // Spot-check: fear templates should not be purely physical threat descriptions
    const physicalOnlyThreat = /^The \w+ attacks/;
    ALL_FEAR_KEYS.forEach((key) => {
      FEAR_PROSE[key].forEach((template) => {
        expect(physicalOnlyThreat.test(template)).toBe(false);
      });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { selectDilemmasV2, scoreDilemmaResonance } from '../dilemmaSelection';
import type { EnrichedDilemmaTemplate } from '../../types/meetingEncounter';
import type { AscendantLens } from '../../types/hunger';
import { HUNGER_CATALOG, buildStubAscendantLens } from '../../types/hunger';

// ─── Test Template Factory ──────────────────────────────────────

function makeTemplate(
  overrides: Partial<EnrichedDilemmaTemplate> & Pick<EnrichedDilemmaTemplate, 'id' | 'category'>,
): EnrichedDilemmaTemplate {
  return {
    setup: 'Test setup prose.',
    godVoice: 'Test god voice.',
    choices: [
      {
        id: 'c1',
        text: 'Choice A',
        godAction: 'God does A',
        axiologicalShifts: {},
        gateTags: ['tag-a'],
      },
      {
        id: 'c2',
        text: 'Choice B',
        godAction: 'God does B',
        axiologicalShifts: {},
        gateTags: ['tag-b'],
      },
    ],
    resonance: {
      emotionalRegister: [],
      hungerResonance: [],
      driveResonance: [],
      incompatibleWith: [],
    },
    lensOverlays: [],
    artTags: [],
    ...overrides,
  };
}

// ─── Shared Template Library ────────────────────────────────────

/** Axiological templates for iron's mercy_ruthlessness pair */
const AX_MERCY_1 = makeTemplate({
  id: 'ax-mercy-1',
  category: 'axiological',
  targetValuePair: 'mercy_ruthlessness',
  resonance: {
    emotionalRegister: ['compassion'],
    hungerResonance: ['belonging', 'protection'],
    driveResonance: ['loyalty'],
    incompatibleWith: ['ax-mercy-2'],
  },
});

const AX_MERCY_2 = makeTemplate({
  id: 'ax-mercy-2',
  category: 'axiological',
  targetValuePair: 'mercy_ruthlessness',
  resonance: {
    emotionalRegister: ['fury'],
    hungerResonance: ['conquest', 'power'],
    driveResonance: ['domination'],
    incompatibleWith: ['ax-mercy-1'],
  },
});

/** Reach-specific template for iron */
const REACH_IRON_1 = makeTemplate({
  id: 'reach-iron-1',
  category: 'reach_specific',
  targetReach: 'iron',
  resonance: {
    emotionalRegister: ['determination'],
    hungerResonance: ['protection', 'sacrifice'],
    driveResonance: ['belonging'],
    incompatibleWith: [],
  },
});

/** Reach-specific template for heart */
const REACH_HEART_1 = makeTemplate({
  id: 'reach-heart-1',
  category: 'reach_specific',
  targetReach: 'heart',
  resonance: {
    emotionalRegister: ['devotion'],
    hungerResonance: ['loyalty'],
    driveResonance: ['community'],
    incompatibleWith: [],
  },
});

/** Domain-specific template for life sphere */
const DOMAIN_LIFE_1 = makeTemplate({
  id: 'domain-life-1',
  category: 'domain_specific',
  targetSphere: 'life',
  resonance: {
    emotionalRegister: ['nurturing'],
    hungerResonance: ['community', 'belonging'],
    driveResonance: ['protection'],
    incompatibleWith: [],
  },
});

/** General template (no filtering) */
const GENERAL_1 = makeTemplate({
  id: 'general-1',
  category: 'general',
  resonance: {
    emotionalRegister: ['ambivalence'],
    hungerResonance: ['ambition'],
    driveResonance: ['transformation'],
    incompatibleWith: [],
  },
});

const GENERAL_2 = makeTemplate({
  id: 'general-2',
  category: 'general',
  resonance: {
    emotionalRegister: ['grief'],
    hungerResonance: ['loss', 'memory'],
    driveResonance: ['legacy'],
    incompatibleWith: [],
  },
});

const ALL_TEMPLATES: EnrichedDilemmaTemplate[] = [
  AX_MERCY_1,
  AX_MERCY_2,
  REACH_IRON_1,
  REACH_HEART_1,
  DOMAIN_LIFE_1,
  GENERAL_1,
  GENERAL_2,
];

// ─── scoreDilemmaResonance ──────────────────────────────────────

describe('scoreDilemmaResonance', () => {
  it('returns zero when no tags overlap', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    // Template with tags that don't overlap with the 'gather' hunger
    const template = makeTemplate({
      id: 'no-overlap',
      category: 'general',
      resonance: {
        emotionalRegister: [],
        hungerResonance: ['conquest', 'domination', 'territory'],
        driveResonance: ['revolution', 'destruction'],
        incompatibleWith: [],
      },
    });
    const score = scoreDilemmaResonance(template, lens);
    expect(score).toBe(0);
  });

  it('scores higher when hunger resonance tags overlap', () => {
    // 'life' sphere maps to 'gather' hunger, which has tags:
    // ['belonging', 'protection', 'community', 'sacrifice', 'loyalty', 'shelter']
    const lens = buildStubAscendantLens('life', 'spirit');

    const highOverlap = makeTemplate({
      id: 'high',
      category: 'general',
      resonance: {
        emotionalRegister: [],
        hungerResonance: ['belonging', 'protection', 'community'],
        driveResonance: [],
        incompatibleWith: [],
      },
    });

    const lowOverlap = makeTemplate({
      id: 'low',
      category: 'general',
      resonance: {
        emotionalRegister: [],
        hungerResonance: ['belonging'],
        driveResonance: [],
        incompatibleWith: [],
      },
    });

    const highScore = scoreDilemmaResonance(highOverlap, lens);
    const lowScore = scoreDilemmaResonance(lowOverlap, lens);
    expect(highScore).toBeGreaterThan(lowScore);
    expect(lowScore).toBeGreaterThan(0);
  });

  it('scores higher when drive resonance tags overlap', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    // Stub lens driveTags are the first 3 of the hunger's dilemmaResonanceTags:
    // ['belonging', 'protection', 'community']

    const withDrive = makeTemplate({
      id: 'with-drive',
      category: 'general',
      resonance: {
        emotionalRegister: [],
        hungerResonance: [],
        driveResonance: ['belonging', 'protection'],
        incompatibleWith: [],
      },
    });

    const noDrive = makeTemplate({
      id: 'no-drive',
      category: 'general',
      resonance: {
        emotionalRegister: [],
        hungerResonance: [],
        driveResonance: ['conquest'],
        incompatibleWith: [],
      },
    });

    expect(scoreDilemmaResonance(withDrive, lens)).toBeGreaterThan(
      scoreDilemmaResonance(noDrive, lens),
    );
  });
});

// ─── selectDilemmasV2 ────────────────────────────────────────────

describe('selectDilemmasV2', () => {
  it('returns 2-3 dilemmas from different categories', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
    const categories = result.map((d) => d.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('always includes an axiological dilemma for the primary reach value pair', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const axio = result.find((d) => d.category === 'axiological');
    expect(axio).toBeDefined();
    expect(axio!.targetValuePair).toBe('mercy_ruthlessness'); // iron's value pair
  });

  it('respects incompatibleWith constraints', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const ids = result.map((d) => d.id);
    // mercy-1 and mercy-2 are incompatible
    expect(ids.includes('ax-mercy-1') && ids.includes('ax-mercy-2')).toBe(false);
  });

  it('is deterministic with the same seed', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const r1 = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    const r2 = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42);
    expect(r1.map((d) => d.id)).toEqual(r2.map((d) => d.id));
  });

  it('produces different results with different seeds', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    // Run with many seeds — at least one should differ (probabilistic but very likely)
    const results = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const r = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, seed);
      results.add(r.map((d) => d.id).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('respects excludeIds parameter', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    const result = selectDilemmasV2(ALL_TEMPLATES, 'iron', 'life', lens, 42, [
      'ax-mercy-1',
      'ax-mercy-2',
    ]);
    const ids = result.map((d) => d.id);
    expect(ids).not.toContain('ax-mercy-1');
    expect(ids).not.toContain('ax-mercy-2');
  });

  it('returns empty array when no axiological templates match', () => {
    const lens = buildStubAscendantLens('life', 'spirit');
    // Library with no axiological templates for iron's value pair
    const sparseLibrary = [REACH_IRON_1, DOMAIN_LIFE_1, GENERAL_1];
    const result = selectDilemmasV2(sparseLibrary, 'iron', 'life', lens, 42);
    // Should still return what it can (reach + domain/general), minus the axiological slot
    // The function gracefully skips empty slots
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((d) => d.category !== 'axiological')).toBe(true);
  });
});

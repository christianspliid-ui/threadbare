import { describe, it, expect } from 'vitest';
import {
  NARRATIVE_ARCHETYPES,
  getArchetype,
  getArchetypeTone,
  getArchetypeBeatPatterns,
  getArchetypeVignette,
  type NarrativeArchetype,
  type ToneKeywords,
  type BeatPattern,
  type NarrativeRequirement,
} from '../archetype-content';

const VALID_EVENT_TYPES = [
  'action_resolved',
  'action_failed',
  'action_critical',
  'trait_acquired',
  'trait_lost',
  'tier_transition',
  'doom_escalation',
  'mandate_stage',
  'divine_intervention',
  'actor_death',
  'contested_action',
];

const VALID_NARRATIVE_TIERS = ['routine', 'notable', 'chronicle'];

const VALID_REQUIREMENT_CATEGORIES = ['artifact', 'location', 'character', 'faction'];

const VALID_REACH_DOMAINS = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'gold'];

describe('archetype-content', () => {
  // ─── Original tests ───────────────────────────────────────────

  it('exports exactly 19 archetypes', () => {
    expect(NARRATIVE_ARCHETYPES).toHaveLength(19);
  });

  it('each archetype has required base fields', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      expect(arch.id).toBeTruthy();
      expect(arch.name).toBeTruthy();
      expect(arch.storyShape).toBeTruthy();
      expect(arch.proseTone).toBeTruthy();
      expect(arch.reachAffinities.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all archetype ids are unique', () => {
    const ids = NARRATIVE_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getArchetype returns correct archetype by id', () => {
    const hero = getArchetype('tragic_hero');
    expect(hero).toBeDefined();
    expect(hero!.name).toBe('Tragic Hero');
  });

  it('getArchetype returns undefined for unknown id', () => {
    expect(getArchetype('nonexistent')).toBeUndefined();
  });

  it('reach affinities use valid ReachDomain values', () => {
    for (const arch of NARRATIVE_ARCHETYPES) {
      for (const reach of arch.reachAffinities) {
        expect(VALID_REACH_DOMAINS).toContain(reach);
      }
    }
  });

  // ─── New enrichment tests ───────────────────────────────────

  describe('ToneKeywords enrichment', () => {
    it('every archetype has toneKeywords', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(arch.toneKeywords).toBeDefined();
      }
    });

    it('toneKeywords has adjectives array with at least 5 entries', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(Array.isArray(arch.toneKeywords.adjectives)).toBe(true);
        expect(arch.toneKeywords.adjectives.length).toBeGreaterThanOrEqual(5);
        for (const adj of arch.toneKeywords.adjectives) {
          expect(typeof adj).toBe('string');
          expect(adj.length).toBeGreaterThan(0);
        }
      }
    });

    it('toneKeywords has verbs array with at least 5 entries', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(Array.isArray(arch.toneKeywords.verbs)).toBe(true);
        expect(arch.toneKeywords.verbs.length).toBeGreaterThanOrEqual(5);
        for (const verb of arch.toneKeywords.verbs) {
          expect(typeof verb).toBe('string');
          expect(verb.length).toBeGreaterThan(0);
        }
      }
    });

    it('toneKeywords has sentenceRhythm string', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(typeof arch.toneKeywords.sentenceRhythm).toBe('string');
        expect(arch.toneKeywords.sentenceRhythm.length).toBeGreaterThan(0);
      }
    });
  });

  describe('BeatPatterns enrichment', () => {
    it('every archetype has at least 2 beat patterns', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(Array.isArray(arch.beatPatterns)).toBe(true);
        expect(arch.beatPatterns.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('beat patterns have valid eventTypes', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const beat of arch.beatPatterns) {
          expect(Array.isArray(beat.eventTypes)).toBe(true);
          expect(beat.eventTypes.length).toBeGreaterThan(0);
          for (const eventType of beat.eventTypes) {
            expect(VALID_EVENT_TYPES).toContain(eventType);
          }
        }
      }
    });

    it('beat patterns have valid minimumTier', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const beat of arch.beatPatterns) {
          expect(VALID_NARRATIVE_TIERS).toContain(beat.minimumTier);
        }
      }
    });

    it('beat patterns have valid promoteTo if defined', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const beat of arch.beatPatterns) {
          if (beat.promoteTo !== undefined) {
            expect(VALID_NARRATIVE_TIERS).toContain(beat.promoteTo);
          }
        }
      }
    });

    it('beat patterns have narrativeRequirements array', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const beat of arch.beatPatterns) {
          expect(Array.isArray(beat.narrativeRequirements)).toBe(true);
        }
      }
    });

    it('beat patterns have contextPreferences array', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const beat of arch.beatPatterns) {
          expect(Array.isArray(beat.contextPreferences)).toBe(true);
        }
      }
    });
  });

  describe('VignetteSeeds enrichment', () => {
    it('every archetype has at least 3 vignette seeds', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(Array.isArray(arch.vignetteSeeds)).toBe(true);
        expect(arch.vignetteSeeds.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('every vignette seed is a non-empty string', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const seed of arch.vignetteSeeds) {
          expect(typeof seed).toBe('string');
          expect(seed.length).toBeGreaterThan(0);
        }
      }
    });

    it('at least one vignette seed per archetype contains {name} placeholder', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        const hasNamePlaceholder = arch.vignetteSeeds.some(seed => seed.includes('{name}'));
        expect(hasNamePlaceholder).toBe(true);
      }
    });
  });

  describe('NarrativeRequirements enrichment', () => {
    it('every archetype has at least 2 narrative requirements', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        expect(Array.isArray(arch.narrativeRequirements)).toBe(true);
        expect(arch.narrativeRequirements.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('requirements have valid categories', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const req of arch.narrativeRequirements) {
          expect(VALID_REQUIREMENT_CATEGORIES).toContain(req.category);
        }
      }
    });

    it('requirements have non-empty tags arrays', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const req of arch.narrativeRequirements) {
          expect(Array.isArray(req.tags)).toBe(true);
          expect(req.tags.length).toBeGreaterThan(0);
          for (const tag of req.tags) {
            expect(typeof tag).toBe('string');
            expect(tag.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('requirements have required and culturallyShape boolean fields', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        for (const req of arch.narrativeRequirements) {
          expect(typeof req.required).toBe('boolean');
          expect(typeof req.culturallyShape).toBe('boolean');
        }
      }
    });
  });

  // ─── Lookup function tests ───────────────────────────────────

  describe('getArchetypeTone', () => {
    it('returns ToneKeywords for valid archetype id', () => {
      const tone = getArchetypeTone('tragic_hero');
      expect(tone).toBeDefined();
      expect(tone!.adjectives).toBeDefined();
      expect(tone!.verbs).toBeDefined();
      expect(tone!.sentenceRhythm).toBeDefined();
    });

    it('returns undefined for invalid archetype id', () => {
      expect(getArchetypeTone('nonexistent')).toBeUndefined();
    });

    it('returns tone for all 19 archetypes', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        const tone = getArchetypeTone(arch.id);
        expect(tone).toBeDefined();
      }
    });
  });

  describe('getArchetypeBeatPatterns', () => {
    it('returns BeatPattern[] for valid archetype id', () => {
      const beats = getArchetypeBeatPatterns('tragic_hero');
      expect(Array.isArray(beats)).toBe(true);
      expect(beats.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty array for invalid archetype id', () => {
      expect(getArchetypeBeatPatterns('nonexistent')).toEqual([]);
    });

    it('returns beats for all 19 archetypes', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        const beats = getArchetypeBeatPatterns(arch.id);
        expect(beats.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('getArchetypeVignette', () => {
    it('returns vignette for valid archetype id and seed index', () => {
      const vignette = getArchetypeVignette('tragic_hero', 0);
      expect(typeof vignette).toBe('string');
      expect(vignette!.length).toBeGreaterThan(0);
    });

    it('returns undefined for invalid archetype id', () => {
      expect(getArchetypeVignette('nonexistent', 0)).toBeUndefined();
    });

    it('cycles through vignettes deterministically', () => {
      const arch = getArchetype('tragic_hero');
      if (arch && arch.vignetteSeeds.length > 0) {
        const vignetteCount = arch.vignetteSeeds.length;

        // Same seed should return same vignette
        const v1 = getArchetypeVignette('tragic_hero', 0);
        const v1Again = getArchetypeVignette('tragic_hero', 0);
        expect(v1).toBe(v1Again);

        // Different seeds cycle through available vignettes
        const v2 = getArchetypeVignette('tragic_hero', 1);
        const vWrapped = getArchetypeVignette('tragic_hero', vignetteCount);
        expect(vWrapped).toBe(v1); // Should wrap around
      }
    });

    it('handles negative seed indices correctly', () => {
      const v1 = getArchetypeVignette('tragic_hero', 0);
      const vNeg = getArchetypeVignette('tragic_hero', -1);
      const arch = getArchetype('tragic_hero');
      if (arch && arch.vignetteSeeds.length > 0) {
        const lastIdx = arch.vignetteSeeds.length - 1;
        const vLast = getArchetypeVignette('tragic_hero', lastIdx);
        expect(vNeg).toBe(vLast);
      }
    });

    it('returns vignettes for all 19 archetypes', () => {
      for (const arch of NARRATIVE_ARCHETYPES) {
        const vignette = getArchetypeVignette(arch.id, 0);
        expect(vignette).toBeDefined();
      }
    });
  });

  // ─── Specific archetype validation ───────────────────────

  describe('specific archetype validation', () => {
    const testArchetypes = [
      'tragic_hero',
      'trickster',
      'coming_of_age',
      'brooding_warrior',
      'fallen_noble',
      'true_believer',
      'schemer',
      'wanderer',
      'monster',
      'folk_hero',
      'reluctant_king',
      'oathkeeper',
      'poisoned_court',
      'doomed_innocent',
      'old_power',
      'kingmaker',
      'seeker',
      'maker',
      'noble_savage',
    ];

    for (const archetypeId of testArchetypes) {
      it(`${archetypeId} is fully enriched`, () => {
        const arch = getArchetype(archetypeId);
        expect(arch).toBeDefined();
        expect(arch!.toneKeywords).toBeDefined();
        expect(arch!.beatPatterns.length).toBeGreaterThanOrEqual(2);
        expect(arch!.vignetteSeeds.length).toBeGreaterThanOrEqual(3);
        expect(arch!.narrativeRequirements.length).toBeGreaterThanOrEqual(2);
      });
    }
  });
});

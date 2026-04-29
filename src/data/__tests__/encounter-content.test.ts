import { describe, it, expect } from 'vitest';
import {
  ENCOUNTER_TEMPLATES,
  CULTURAL_ENCOUNTER_OVERLAYS,
  ENCOUNTER_INSPECTION_VIGNETTES,
  ENCOUNTER_DIFFICULTY_TIERS,
  ENCOUNTER_SYSTEM_CONNECTIONS,
  getEncountersByLocationType,
  getEncounterById,
} from '../encounter-content';
import { assertNoDuplicateIds, assertValidUnifiedTemplate } from '../../testing/contentInvariants';
import { isActionStepBranch } from '../../types/unifiedAction';

describe('encounter-content', () => {
  describe('ENCOUNTER_TEMPLATES', () => {
    it('every template should have a unique id', () => {
      const ids = ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('passes shared structural invariants', () => {
      assertNoDuplicateIds(ENCOUNTER_TEMPLATES);
      ENCOUNTER_TEMPLATES.forEach(assertValidUnifiedTemplate);
    });

    it('every template should have 2-4 steps', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(template.steps.length).toBeGreaterThanOrEqual(2);
        expect(template.steps.length).toBeLessThanOrEqual(4);
      }
    });

    it('every template should have success and failure prose', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(template.narrativeTemplates.success.length).toBeGreaterThan(10);
        expect(template.narrativeTemplates.failure.length).toBeGreaterThan(10);
      }
    });

    it('every template should have a valid reach', () => {
      const validReaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(validReaches).toContain(template.reach);
      }
    });

    it('every template should have at least 1 locationSubtypes entry', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        expect((template.locationSubtypes?.length ?? 0)).toBeGreaterThanOrEqual(1);
      }
    });

    it('first template should be encounter.deep_descent with name The Deep Descent', () => {
      const deepDescent = ENCOUNTER_TEMPLATES[0];
      expect(deepDescent.id).toBe('encounter.deep_descent');
      expect(deepDescent.name).toBe('The Deep Descent');
    });

    it('every LocationSubtype has at least 3 encounter templates', () => {
      const allSubtypes = [
        'hamlet', 'town', 'city', 'capital', 'camp', 'farmland', 'castle', 'fort',
        'tower', 'shrine', 'temple', 'mining', 'ruins', 'ruined_tower', 'ruined_city',
        'ruined_village', 'battleground', 'oasis', 'unexplored_poi', 'wilderness'
      ];
      for (const st of allSubtypes) {
        const matches = ENCOUNTER_TEMPLATES.filter(t => t.locationSubtypes?.includes(st as never));
        expect(matches.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('each crudType has at least 4 templates', () => {
      const counts: Record<string, number> = {};
      for (const t of ENCOUNTER_TEMPLATES) {
        counts[t.crudType] = (counts[t.crudType] ?? 0) + 1;
      }
      for (const [type, count] of Object.entries(counts)) {
        expect(count, `crudType ${type} has only ${count} templates`).toBeGreaterThanOrEqual(4);
      }
    });

    it('all templates have valid crudType', () => {
      const validTypes = ['create', 'read', 'update', 'delete'];
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(validTypes).toContain(t.crudType);
      }
    });

    it('all templates have rarityTier 1', () => {
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(t.rarityTier).toBe(1);
      }
    });

    it('all templates have valid motivations', () => {
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(t.motivations.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('all templates have 2-4 steps with escalating difficulty', () => {
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(t.steps.length).toBeGreaterThanOrEqual(2);
        expect(t.steps.length).toBeLessThanOrEqual(4);
        for (let i = 1; i < t.steps.length; i++) {
          const prev = t.steps[i - 1];
          const curr = t.steps[i];
          const prevDiff = isActionStepBranch(prev) ? prev.fallback.difficulty : prev.difficulty;
          const currDiff = isActionStepBranch(curr) ? curr.fallback.difficulty : curr.difficulty;
          expect(currDiff).toBeGreaterThan(prevDiff);
        }
      }
    });
  });

  describe('CULTURAL_ENCOUNTER_OVERLAYS', () => {
    it('each overlay should have adjectives, verbs, and atmosphere', () => {
      for (const [, overlay] of Object.entries(CULTURAL_ENCOUNTER_OVERLAYS)) {
        expect(overlay.adjectives.length).toBeGreaterThanOrEqual(3);
        expect(overlay.verbs.length).toBeGreaterThanOrEqual(3);
        expect(overlay.atmosphere.length).toBeGreaterThan(0);
      }
    });
  });

  describe('lookup functions', () => {
    it('getEncountersByLocationType should filter correctly', () => {
      const ruinsEncounters = getEncountersByLocationType('ruins');
      expect(ruinsEncounters.length).toBeGreaterThan(0);
      for (const o of ruinsEncounters) {
        expect(o.locationSubtypes).toContain('ruins');
      }
    });

    it('getEncounterById should return correct encounter', () => {
      const encounter = getEncounterById('encounter.deep_descent');
      expect(encounter).toBeDefined();
      expect(encounter!.name).toBe('The Deep Descent');
    });

    it('getEncounterById should return undefined for unknown id', () => {
      expect(getEncounterById('encounter.nonexistent')).toBeUndefined();
    });
  });

  describe('encounter inspection vignettes', () => {
    it('all vignettes should be non-empty strings', () => {
      const all = [
        ...ENCOUNTER_INSPECTION_VIGNETTES.inProgress,
        ...ENCOUNTER_INSPECTION_VIGNETTES.completed,
        ...ENCOUNTER_INSPECTION_VIGNETTES.failed,
      ];
      for (const v of all) {
        expect(v.length).toBeGreaterThan(20);
      }
    });
  });

  describe('encounter difficulty tiers', () => {
    it('each tier should have difficultyMultiplier and toneAdjectives', () => {
      for (const tier of Object.values(ENCOUNTER_DIFFICULTY_TIERS)) {
        expect(tier.difficultyMultiplier).toBeGreaterThan(0);
        expect(tier.toneAdjectives.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have early, mid, and late tiers', () => {
      expect(ENCOUNTER_DIFFICULTY_TIERS).toHaveProperty('early');
      expect(ENCOUNTER_DIFFICULTY_TIERS).toHaveProperty('mid');
      expect(ENCOUNTER_DIFFICULTY_TIERS).toHaveProperty('late');
    });

    it('difficulty multipliers should increase from early to mid to late', () => {
      const early = ENCOUNTER_DIFFICULTY_TIERS.early.difficultyMultiplier;
      const mid = ENCOUNTER_DIFFICULTY_TIERS.mid.difficultyMultiplier;
      const late = ENCOUNTER_DIFFICULTY_TIERS.late.difficultyMultiplier;
      expect(early).toBeLessThan(mid);
      expect(mid).toBeLessThan(late);
    });

    it('all tone adjectives should be non-empty strings', () => {
      for (const tier of Object.values(ENCOUNTER_DIFFICULTY_TIERS)) {
        for (const adj of tier.toneAdjectives) {
          expect(typeof adj).toBe('string');
          expect(adj.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('encounter system connections', () => {
    it('each connection template should have id, trigger, and prose', () => {
      const allConnections = [
        ...ENCOUNTER_SYSTEM_CONNECTIONS.doom,
        ...ENCOUNTER_SYSTEM_CONNECTIONS.culture,
        ...ENCOUNTER_SYSTEM_CONNECTIONS.rival,
      ];
      for (const conn of allConnections) {
        expect(conn.id).toBeTruthy();
        expect(conn.trigger).toBeTruthy();
        expect(conn.prose).toBeTruthy();
        expect(conn.prose.length).toBeGreaterThan(20);
      }
    });

    it('all connection ids should be unique', () => {
      const allConnections = [
        ...ENCOUNTER_SYSTEM_CONNECTIONS.doom,
        ...ENCOUNTER_SYSTEM_CONNECTIONS.culture,
        ...ENCOUNTER_SYSTEM_CONNECTIONS.rival,
      ];
      const ids = allConnections.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('doom connections should have relevant trigger descriptions', () => {
      for (const conn of ENCOUNTER_SYSTEM_CONNECTIONS.doom) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });

    it('culture connections should have relevant trigger descriptions', () => {
      for (const conn of ENCOUNTER_SYSTEM_CONNECTIONS.culture) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });

    it('rival connections should have relevant trigger descriptions', () => {
      for (const conn of ENCOUNTER_SYSTEM_CONNECTIONS.rival) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });
  });
});

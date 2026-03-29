import { describe, it, expect } from 'vitest';
import type { EncounterType } from '../../types/encounter';
import {
  ENCOUNTER_TEMPLATES,
  CULTURAL_ENCOUNTER_OVERLAYS,
  ENCOUNTER_INSPECTION_VIGNETTES,
  ENCOUNTER_DIFFICULTY_TIERS,
  ENCOUNTER_SYSTEM_CONNECTIONS,
  getEncountersByLocationType,
  getEncounterById,
} from '../encounter-content';

describe('encounter-content', () => {
  describe('ENCOUNTER_TEMPLATES', () => {
    it('should have exactly 94 encounter templates', () => {
      expect(ENCOUNTER_TEMPLATES).toHaveLength(94);
    });

    it('every template should have a unique id', () => {
      const ids = ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every template should have 2-4 encounters', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(template.steps.length).toBeGreaterThanOrEqual(2);
        expect(template.steps.length).toBeLessThanOrEqual(4);
      }
    });

    it('every encounter should have success and failure prose', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        for (const enc of template.steps) {
          expect(enc.onSuccess.narrative.length).toBeGreaterThan(10);
          expect(enc.onFailure.narrative.length).toBeGreaterThan(10);
        }
      }
    });

    it('every template should have valid reachPrimary and reachSecondary', () => {
      const validReaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(validReaches).toContain(template.reachPrimary);
        expect(validReaches).toContain(template.reachSecondary);
      }
    });

    it('every template should have at least 1 locationTypes entry', () => {
      for (const template of ENCOUNTER_TEMPLATES) {
        expect(template.locationTypes.length).toBeGreaterThanOrEqual(1);
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
        const matches = ENCOUNTER_TEMPLATES.filter(t => t.locationTypes.includes(st));
        expect(matches.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('every EncounterType has at least 4 templates', () => {
      const allTypes: EncounterType[] = ['explore', 'acquire', 'create', 'hire', 'duel', 'steal', 'trade', 'assist', 'build', 'lead'];
      for (const et of allTypes) {
        const matches = ENCOUNTER_TEMPLATES.filter(t => t.encounterType === et);
        expect(matches.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('all templates have valid encounterType', () => {
      const validTypes: EncounterType[] = ['explore', 'acquire', 'create', 'hire', 'duel', 'steal', 'trade', 'assist', 'build', 'lead'];
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(validTypes).toContain(t.encounterType);
      }
    });

    it('all templates have valid threatRating', () => {
      const validRatings = ['trivial', 'easy', 'moderate', 'hard', 'deadly'];
      for (const t of ENCOUNTER_TEMPLATES) {
        expect(validRatings).toContain(t.threatRating);
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
          expect(t.steps[i].difficulty).toBeGreaterThan(t.steps[i-1].difficulty);
        }
      }
    });

    it('all step IDs are unique within their template', () => {
      for (const t of ENCOUNTER_TEMPLATES) {
        const stepIds = t.steps.map(s => s.id);
        expect(new Set(stepIds).size).toBe(stepIds.length);
      }
    });

    it('threat rating distribution is balanced (not all moderate)', () => {
      const distribution: Record<string, number> = {};
      for (const t of ENCOUNTER_TEMPLATES) {
        distribution[t.threatRating] = (distribution[t.threatRating] || 0) + 1;
      }
      // At least 3 different threat ratings used
      expect(Object.keys(distribution).length).toBeGreaterThanOrEqual(3);
      // No single rating has more than 50% of templates
      for (const count of Object.values(distribution)) {
        expect(count).toBeLessThanOrEqual(ENCOUNTER_TEMPLATES.length * 0.5);
      }
    });
  });

  describe('CULTURAL_ENCOUNTER_OVERLAYS', () => {
    it('should have 6 overlay sets', () => {
      expect(Object.keys(CULTURAL_ENCOUNTER_OVERLAYS)).toHaveLength(6);
    });

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
        expect(o.locationTypes).toContain('ruins');
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
    it('should have 10 in-progress vignettes', () => {
      expect(ENCOUNTER_INSPECTION_VIGNETTES.inProgress).toHaveLength(10);
    });

    it('should have 5 completed vignettes', () => {
      expect(ENCOUNTER_INSPECTION_VIGNETTES.completed).toHaveLength(5);
    });

    it('should have 3 failed vignettes', () => {
      expect(ENCOUNTER_INSPECTION_VIGNETTES.failed).toHaveLength(3);
    });

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
    it('should have 3 difficulty tiers', () => {
      expect(Object.keys(ENCOUNTER_DIFFICULTY_TIERS)).toHaveLength(3);
    });

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
    it('should have 9 encounter system connection templates (3 doom + 3 culture + 3 rival)', () => {
      expect(ENCOUNTER_SYSTEM_CONNECTIONS.doom).toHaveLength(3);
      expect(ENCOUNTER_SYSTEM_CONNECTIONS.culture).toHaveLength(3);
      expect(ENCOUNTER_SYSTEM_CONNECTIONS.rival).toHaveLength(3);
    });

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

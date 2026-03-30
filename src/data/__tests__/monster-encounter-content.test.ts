/**
 * Monster Encounter Content Tests — TDD RED phase
 *
 * Tests for monster encounter templates, encounter pool registration,
 * and Adventuring Guild quest wiring.
 */

import { describe, it, expect } from 'vitest';
import {
  MONSTER_ENCOUNTER_TEMPLATES,
  getMonsterEncounterById,
} from '../monster-encounter-content';
import { getAnyEncounterById } from '../encounter-content';
import { ADVENTURING_GUILD_DEFINITION } from '../faction-definitions';

describe('monster-encounter-content', () => {
  describe('MONSTER_ENCOUNTER_TEMPLATES', () => {
    it('has at least 4 entries', () => {
      expect(MONSTER_ENCOUNTER_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('every template has a valid EncounterTemplate shape (id, locationTypes, steps)', () => {
      for (const template of MONSTER_ENCOUNTER_TEMPLATES) {
        expect(typeof template.id).toBe('string');
        expect(template.id.length).toBeGreaterThan(0);
        expect(Array.isArray(template.locationTypes)).toBe(true);
        expect(template.locationTypes.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(template.steps)).toBe(true);
        expect(template.steps.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every template has required fields: reachPrimary, reachSecondary, encounterType, threatRating, motivations', () => {
      const validReaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
      for (const template of MONSTER_ENCOUNTER_TEMPLATES) {
        expect(validReaches).toContain(template.reachPrimary);
        expect(validReaches).toContain(template.reachSecondary);
        expect(typeof template.encounterType).toBe('string');
        expect(typeof template.threatRating).toBe('string');
        expect(Array.isArray(template.motivations)).toBe(true);
      }
    });

    it('every step has success and failure outcomes', () => {
      for (const template of MONSTER_ENCOUNTER_TEMPLATES) {
        for (const step of template.steps) {
          expect(step.onSuccess.narrative.length).toBeGreaterThan(10);
          expect(step.onFailure.narrative.length).toBeGreaterThan(10);
        }
      }
    });

    it('template ids are unique', () => {
      const ids = MONSTER_ENCOUNTER_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getMonsterEncounterById', () => {
    it('returns the minor hunt template for monster.hunt.minor', () => {
      const template = getMonsterEncounterById('monster.hunt.minor');
      expect(template).toBeDefined();
      expect(template?.id).toBe('monster.hunt.minor');
    });

    it('returns undefined for unknown id', () => {
      expect(getMonsterEncounterById('nonexistent.template')).toBeUndefined();
    });

    it('template monster.hunt.minor has locationTypes containing lair', () => {
      const template = getMonsterEncounterById('monster.hunt.minor');
      expect(template?.locationTypes).toContain('lair');
    });

    it('template monster.encounter.ambush has locationTypes containing wilderness', () => {
      const template = getMonsterEncounterById('monster.encounter.ambush');
      expect(template?.locationTypes).toContain('wilderness');
    });
  });

  describe('getAnyEncounterById — pool registration', () => {
    it('returns monster template for monster.hunt.minor (pool registration works)', () => {
      const template = getAnyEncounterById('monster.hunt.minor');
      expect(template).toBeDefined();
      expect(template?.id).toBe('monster.hunt.minor');
    });

    it('returns monster template for monster.hunt.named_elite', () => {
      const template = getAnyEncounterById('monster.hunt.named_elite');
      expect(template).toBeDefined();
      expect(template?.id).toBe('monster.hunt.named_elite');
    });

    it('returns monster template for monster.encounter.ambush', () => {
      const template = getAnyEncounterById('monster.encounter.ambush');
      expect(template).toBeDefined();
      expect(template?.id).toBe('monster.encounter.ambush');
    });
  });

  describe('Adventuring Guild quest wiring', () => {
    it('Adventuring Guild questTemplateIds contains monster.hunt.minor', () => {
      expect(ADVENTURING_GUILD_DEFINITION.questTemplateIds).toContain('monster.hunt.minor');
    });

    it('Adventuring Guild questTemplateIds contains monster.hunt.named_elite', () => {
      expect(ADVENTURING_GUILD_DEFINITION.questTemplateIds).toContain('monster.hunt.named_elite');
    });
  });
});

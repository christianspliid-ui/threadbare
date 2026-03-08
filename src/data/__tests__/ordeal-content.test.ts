import { describe, it, expect } from 'vitest';
import {
  ORDEAL_TEMPLATES,
  CULTURAL_ORDEAL_OVERLAYS,
  getOrdealsByLocationType,
  getOrdealById,
} from '../ordeal-content';

describe('ordeal-content', () => {
  describe('ORDEAL_TEMPLATES', () => {
    it('should have exactly 10 ordeal templates', () => {
      expect(ORDEAL_TEMPLATES).toHaveLength(10);
    });

    it('every template should have a unique id', () => {
      const ids = ORDEAL_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every template should have 2-4 encounters', () => {
      for (const template of ORDEAL_TEMPLATES) {
        expect(template.encounters.length).toBeGreaterThanOrEqual(2);
        expect(template.encounters.length).toBeLessThanOrEqual(4);
      }
    });

    it('every encounter should have success and failure prose', () => {
      for (const template of ORDEAL_TEMPLATES) {
        for (const enc of template.encounters) {
          expect(enc.onSuccess.narrative.length).toBeGreaterThan(10);
          expect(enc.onFailure.narrative.length).toBeGreaterThan(10);
        }
      }
    });

    it('every template should have valid reachPrimary and reachSecondary', () => {
      const validReaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
      for (const template of ORDEAL_TEMPLATES) {
        expect(validReaches).toContain(template.reachPrimary);
        expect(validReaches).toContain(template.reachSecondary);
      }
    });

    it('every template should have at least 1 locationTypes entry', () => {
      for (const template of ORDEAL_TEMPLATES) {
        expect(template.locationTypes.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('first template should be ordeal.deep_descent with name The Deep Descent', () => {
      const deepDescent = ORDEAL_TEMPLATES[0];
      expect(deepDescent.id).toBe('ordeal.deep_descent');
      expect(deepDescent.name).toBe('The Deep Descent');
    });
  });

  describe('CULTURAL_ORDEAL_OVERLAYS', () => {
    it('should have 6 overlay sets', () => {
      expect(Object.keys(CULTURAL_ORDEAL_OVERLAYS)).toHaveLength(6);
    });

    it('each overlay should have adjectives, verbs, and atmosphere', () => {
      for (const [, overlay] of Object.entries(CULTURAL_ORDEAL_OVERLAYS)) {
        expect(overlay.adjectives.length).toBeGreaterThanOrEqual(3);
        expect(overlay.verbs.length).toBeGreaterThanOrEqual(3);
        expect(overlay.atmosphere.length).toBeGreaterThan(0);
      }
    });
  });

  describe('lookup functions', () => {
    it('getOrdealsByLocationType should filter correctly', () => {
      const dungeonOrdeals = getOrdealsByLocationType('dungeon');
      expect(dungeonOrdeals.length).toBeGreaterThan(0);
      for (const o of dungeonOrdeals) {
        expect(o.locationTypes).toContain('dungeon');
      }
    });

    it('getOrdealById should return correct ordeal', () => {
      const ordeal = getOrdealById('ordeal.deep_descent');
      expect(ordeal).toBeDefined();
      expect(ordeal!.name).toBe('The Deep Descent');
    });

    it('getOrdealById should return undefined for unknown id', () => {
      expect(getOrdealById('ordeal.nonexistent')).toBeUndefined();
    });
  });
});

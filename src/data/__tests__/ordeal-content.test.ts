import { describe, it, expect } from 'vitest';
import {
  ORDEAL_TEMPLATES,
  CULTURAL_ORDEAL_OVERLAYS,
  ORDEAL_INSPECTION_VIGNETTES,
  ORDEAL_DIFFICULTY_TIERS,
  ORDEAL_SYSTEM_CONNECTIONS,
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

  describe('ordeal inspection vignettes', () => {
    it('should have 10 in-progress vignettes', () => {
      expect(ORDEAL_INSPECTION_VIGNETTES.inProgress).toHaveLength(10);
    });

    it('should have 5 completed vignettes', () => {
      expect(ORDEAL_INSPECTION_VIGNETTES.completed).toHaveLength(5);
    });

    it('should have 3 failed vignettes', () => {
      expect(ORDEAL_INSPECTION_VIGNETTES.failed).toHaveLength(3);
    });

    it('all vignettes should be non-empty strings', () => {
      const all = [
        ...ORDEAL_INSPECTION_VIGNETTES.inProgress,
        ...ORDEAL_INSPECTION_VIGNETTES.completed,
        ...ORDEAL_INSPECTION_VIGNETTES.failed,
      ];
      for (const v of all) {
        expect(v.length).toBeGreaterThan(20);
      }
    });
  });

  describe('ordeal difficulty tiers', () => {
    it('should have 3 difficulty tiers', () => {
      expect(Object.keys(ORDEAL_DIFFICULTY_TIERS)).toHaveLength(3);
    });

    it('each tier should have difficultyMultiplier and toneAdjectives', () => {
      for (const tier of Object.values(ORDEAL_DIFFICULTY_TIERS)) {
        expect(tier.difficultyMultiplier).toBeGreaterThan(0);
        expect(tier.toneAdjectives.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have early, mid, and late tiers', () => {
      expect(ORDEAL_DIFFICULTY_TIERS).toHaveProperty('early');
      expect(ORDEAL_DIFFICULTY_TIERS).toHaveProperty('mid');
      expect(ORDEAL_DIFFICULTY_TIERS).toHaveProperty('late');
    });

    it('difficulty multipliers should increase from early to mid to late', () => {
      const early = ORDEAL_DIFFICULTY_TIERS.early.difficultyMultiplier;
      const mid = ORDEAL_DIFFICULTY_TIERS.mid.difficultyMultiplier;
      const late = ORDEAL_DIFFICULTY_TIERS.late.difficultyMultiplier;
      expect(early).toBeLessThan(mid);
      expect(mid).toBeLessThan(late);
    });

    it('all tone adjectives should be non-empty strings', () => {
      for (const tier of Object.values(ORDEAL_DIFFICULTY_TIERS)) {
        for (const adj of tier.toneAdjectives) {
          expect(typeof adj).toBe('string');
          expect(adj.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('ordeal system connections', () => {
    it('should have 9 ordeal system connection templates (3 doom + 3 culture + 3 rival)', () => {
      expect(ORDEAL_SYSTEM_CONNECTIONS.doom).toHaveLength(3);
      expect(ORDEAL_SYSTEM_CONNECTIONS.culture).toHaveLength(3);
      expect(ORDEAL_SYSTEM_CONNECTIONS.rival).toHaveLength(3);
    });

    it('each connection template should have id, trigger, and prose', () => {
      const allConnections = [
        ...ORDEAL_SYSTEM_CONNECTIONS.doom,
        ...ORDEAL_SYSTEM_CONNECTIONS.culture,
        ...ORDEAL_SYSTEM_CONNECTIONS.rival,
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
        ...ORDEAL_SYSTEM_CONNECTIONS.doom,
        ...ORDEAL_SYSTEM_CONNECTIONS.culture,
        ...ORDEAL_SYSTEM_CONNECTIONS.rival,
      ];
      const ids = allConnections.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('doom connections should have relevant trigger descriptions', () => {
      for (const conn of ORDEAL_SYSTEM_CONNECTIONS.doom) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });

    it('culture connections should have relevant trigger descriptions', () => {
      for (const conn of ORDEAL_SYSTEM_CONNECTIONS.culture) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });

    it('rival connections should have relevant trigger descriptions', () => {
      for (const conn of ORDEAL_SYSTEM_CONNECTIONS.rival) {
        expect(conn.trigger.length).toBeGreaterThan(10);
      }
    });
  });
});

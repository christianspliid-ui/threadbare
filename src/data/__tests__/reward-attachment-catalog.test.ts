import { describe, it, expect } from 'vitest';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../reward-attachment-catalog';
import { POSSESSION_SUBCATEGORIES } from '../../types/attachments';

describe('reward-attachment-catalog', () => {
  describe('REWARD_POSSESSIONS', () => {
    it('has ~50 entries', () => {
      expect(REWARD_POSSESSIONS.length).toBeGreaterThanOrEqual(45);
      expect(REWARD_POSSESSIONS.length).toBeLessThanOrEqual(55);
    });

    it('all entries have type artifact', () => {
      for (const node of REWARD_POSSESSIONS) {
        expect(node.type).toBe('artifact');
      }
    });

    it('all IDs start with reward_', () => {
      for (const node of REWARD_POSSESSIONS) {
        expect(node.id).toMatch(/^reward_/);
      }
    });

    it('all IDs are unique', () => {
      const ids = REWARD_POSSESSIONS.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers all 7 possession subcategories', () => {
      const subcats = new Set(REWARD_POSSESSIONS.map(n => n.properties.subcategory as string));
      for (const sub of POSSESSION_SUBCATEGORIES) {
        expect(subcats.has(sub)).toBe(true);
      }
    });

    it('has entries at tiers 1-4', () => {
      const tiers = new Set(REWARD_POSSESSIONS.map(n => n.properties.tier as number));
      expect(tiers.has(1)).toBe(true);
      expect(tiers.has(2)).toBe(true);
      expect(tiers.has(3)).toBe(true);
      expect(tiers.has(4)).toBe(true);
    });

    it('all entries have required properties', () => {
      for (const node of REWARD_POSSESSIONS) {
        expect(node.name).toBeTruthy();
        expect(node.properties.subcategory).toBeTruthy();
        expect(node.properties.tier).toBeGreaterThanOrEqual(1);
        expect(node.properties.tier).toBeLessThanOrEqual(4);
        expect(Array.isArray(node.properties.tags)).toBe(true);
        expect(node.properties.mechanicalSummary).toBeTruthy();
        expect(node.properties.lossCondition).toBeTruthy();
      }
    });
  });

  describe('REWARD_CONDITIONS', () => {
    it('has ~26 entries', () => {
      expect(REWARD_CONDITIONS.length).toBeGreaterThanOrEqual(22);
      expect(REWARD_CONDITIONS.length).toBeLessThanOrEqual(30);
    });

    it('all entries have type trait and subcategory condition', () => {
      for (const node of REWARD_CONDITIONS) {
        expect(node.type).toBe('trait');
        expect(node.properties.subcategory).toBe('condition');
      }
    });

    it('all IDs are unique', () => {
      const ids = REWARD_CONDITIONS.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers wound, blessing, curse, disease, and supernatural categories via tags', () => {
      const allTags = REWARD_CONDITIONS.flatMap(n => n.properties.tags as string[]);
      expect(allTags.some(t => t === '#wound')).toBe(true);
      expect(allTags.some(t => t === '#blessing')).toBe(true);
      expect(allTags.some(t => t === '#curse')).toBe(true);
      expect(allTags.some(t => t === '#disease')).toBe(true);
      expect(allTags.some(t => t === '#supernatural')).toBe(true);
    });
  });

  describe('REWARD_BESTOWED_POWERS', () => {
    it('has 10 entries', () => {
      expect(REWARD_BESTOWED_POWERS.length).toBe(10);
    });

    it('all entries have type trait and subcategory bestowed', () => {
      for (const node of REWARD_BESTOWED_POWERS) {
        expect(node.type).toBe('trait');
        expect(node.properties.subcategory).toBe('bestowed');
      }
    });

    it('all IDs are unique', () => {
      const ids = REWARD_BESTOWED_POWERS.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('cross-catalog uniqueness', () => {
    it('no duplicate IDs across all three arrays', () => {
      const allIds = [
        ...REWARD_POSSESSIONS.map(n => n.id),
        ...REWARD_CONDITIONS.map(n => n.id),
        ...REWARD_BESTOWED_POWERS.map(n => n.id),
      ];
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });

  describe('grand total', () => {
    it('has ~86 total templates', () => {
      const total = REWARD_POSSESSIONS.length + REWARD_CONDITIONS.length + REWARD_BESTOWED_POWERS.length;
      expect(total).toBeGreaterThanOrEqual(80);
      expect(total).toBeLessThanOrEqual(92);
    });
  });
});

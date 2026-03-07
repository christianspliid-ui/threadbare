import { describe, it, expect } from 'vitest';
import {
  FOUNDATION_OPPOSITION_MATRIX,
  CREATION_SPHERE_TENSIONS,
  ARCHETYPE_FRICTION_PAIRS,
  PROXIMITY_SCORES,
  INVOLVEMENT_SCORES,
  HARVEST_LIMITS,
  SELECTION_LIMITS,
  CATEGORY_CAP,
  getFoundationOpposition,
  getCreationSphereTension,
  getArchetypeFriction,
} from '../opposition-content';

describe('opposition-content', () => {
  describe('FOUNDATION_OPPOSITION_MATRIX', () => {
    it('has 4 foundation spheres', () => {
      expect(Object.keys(FOUNDATION_OPPOSITION_MATRIX)).toHaveLength(4);
    });

    it('chaos↔order scores 5', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.order).toBe(5);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.chaos).toBe(5);
    });

    it('light↔darkness scores 5', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.light.darkness).toBe(5);
      expect(FOUNDATION_OPPOSITION_MATRIX.darkness.light).toBe(5);
    });

    it('non-opposed pairs score 2', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.light).toBe(2);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.darkness).toBe(2);
    });

    it('self-opposition scores 0', () => {
      expect(FOUNDATION_OPPOSITION_MATRIX.chaos.chaos).toBe(0);
      expect(FOUNDATION_OPPOSITION_MATRIX.order.order).toBe(0);
    });
  });

  describe('CREATION_SPHERE_TENSIONS', () => {
    it('contains at least 4 tension pairs', () => {
      expect(CREATION_SPHERE_TENSIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('life↔entropy has highest tension (4)', () => {
      const lifeEntropy = CREATION_SPHERE_TENSIONS.find(
        t => (t.sphereA === 'life' && t.sphereB === 'entropy') ||
             (t.sphereA === 'entropy' && t.sphereB === 'life')
      );
      expect(lifeEntropy).toBeDefined();
      expect(lifeEntropy!.score).toBe(4);
    });

    it('each entry has two valid sphere names and a score', () => {
      for (const t of CREATION_SPHERE_TENSIONS) {
        expect(typeof t.sphereA).toBe('string');
        expect(typeof t.sphereB).toBe('string');
        expect(t.score).toBeGreaterThan(0);
        expect(t.score).toBeLessThanOrEqual(5);
        expect(typeof t.narrativeReason).toBe('string');
        expect(t.narrativeReason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ARCHETYPE_FRICTION_PAIRS', () => {
    it('contains at least 9 pairs', () => {
      expect(ARCHETYPE_FRICTION_PAIRS.length).toBeGreaterThanOrEqual(9);
    });

    it('true_believer↔trickster scores 5', () => {
      const pair = ARCHETYPE_FRICTION_PAIRS.find(
        p => (p.archetypeA === 'true_believer' && p.archetypeB === 'trickster') ||
             (p.archetypeA === 'trickster' && p.archetypeB === 'true_believer')
      );
      expect(pair).toBeDefined();
      expect(pair!.score).toBe(5);
    });

    it('each entry has valid scores 1-5', () => {
      for (const p of ARCHETYPE_FRICTION_PAIRS) {
        expect(p.score).toBeGreaterThan(0);
        expect(p.score).toBeLessThanOrEqual(5);
        expect(typeof p.narrativeReason).toBe('string');
        expect(p.narrativeReason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('scoring constants', () => {
    it('PROXIMITY_SCORES has 4 levels', () => {
      expect(PROXIMITY_SCORES.same_location).toBe(3);
      expect(PROXIMITY_SCORES.adjacent).toBe(2);
      expect(PROXIMITY_SCORES.same_region).toBe(1);
      expect(PROXIMITY_SCORES.graph_connected).toBe(0.5);
    });

    it('INVOLVEMENT_SCORES has 4 levels', () => {
      expect(INVOLVEMENT_SCORES.direct_participant).toBe(5);
      expect(INVOLVEMENT_SCORES.causal).toBe(3);
      expect(INVOLVEMENT_SCORES.owner_creator).toBe(2);
      expect(INVOLVEMENT_SCORES.atmospheric).toBe(1);
    });

    it('HARVEST_LIMITS are tier-dependent', () => {
      expect(HARVEST_LIMITS.notable).toBe(1);
      expect(HARVEST_LIMITS.chronicle).toBe(2);
    });

    it('SELECTION_LIMITS are tier-dependent', () => {
      expect(SELECTION_LIMITS.notable).toEqual({ min: 2, max: 3 });
      expect(SELECTION_LIMITS.chronicle).toEqual({ min: 4, max: 5 });
    });

    it('CATEGORY_CAP is 2', () => {
      expect(CATEGORY_CAP).toBe(2);
    });
  });

  describe('lookup functions', () => {
    it('getFoundationOpposition returns correct score', () => {
      expect(getFoundationOpposition('chaos', 'order')).toBe(5);
      expect(getFoundationOpposition('light', 'light')).toBe(0);
    });

    it('getFoundationOpposition returns 0 for unknown', () => {
      expect(getFoundationOpposition('chaos', 'unknown')).toBe(0);
    });

    it('getCreationSphereTension returns score for known pair', () => {
      expect(getCreationSphereTension('life', 'entropy')).toBe(4);
      expect(getCreationSphereTension('entropy', 'life')).toBe(4);
    });

    it('getCreationSphereTension returns 0 for non-tensioned pair', () => {
      expect(getCreationSphereTension('force', 'life')).toBe(0);
    });

    it('getArchetypeFriction returns score for known pair', () => {
      expect(getArchetypeFriction('true_believer', 'trickster')).toBe(5);
      expect(getArchetypeFriction('trickster', 'true_believer')).toBe(5);
    });

    it('getArchetypeFriction returns 0 for non-friction pair', () => {
      expect(getArchetypeFriction('tragic_hero', 'tragic_hero')).toBe(0);
    });
  });
});

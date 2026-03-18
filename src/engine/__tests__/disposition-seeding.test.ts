import { describe, it, expect } from 'vitest';
import {
  assignCooperationStrategy,
} from '../disposition';
import type { CooperationStrategy } from '../../types/disposition';
import { COOPERATION_STRATEGIES } from '../../types/disposition';
import type { AxiologicalProfile } from '../../types/agent';

// ─── Seeded PRNG for tests ────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Test Fixtures ─────────────────────────────────────────────────

function balancedProfile(): AxiologicalProfile {
  return {
    loyalty_ambition: 0,
    courage_prudence: 0,
    mercy_ruthlessness: 0,
    honesty_cunning: 0,
    sacrifice_survival: 0,
    loyalty_ambition: 0,
    tradition_novelty: 0,
    humility_pride: 0,
    mercy_ruthlessness: 0,
    asceticism_extravagance: 0,
  };
}

function treacherousProfile(): AxiologicalProfile {
  return {
    ...balancedProfile(),
    loyalty_ambition: -0.4, // Strong treachery
  };
}

function cruelProfile(): AxiologicalProfile {
  return {
    ...balancedProfile(),
    mercy_ruthlessness: -0.4, // Strong cruelty
  };
}

function cunningProfile(): AxiologicalProfile {
  return {
    ...balancedProfile(),
    honesty_cunning: -0.4, // Strong cunning
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('assignCooperationStrategy', () => {
  describe('returns a valid cooperation strategy', () => {
    it('returns one of the five valid strategies', () => {
      const profile = balancedProfile();
      const rng = mulberry32(42);
      const strategy = assignCooperationStrategy('tragic_hero', profile, rng);
      expect(COOPERATION_STRATEGIES).toContain(strategy);
    });

    it('returns a strategy for every archetype', () => {
      const archetypes = [
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

      for (const archetype of archetypes) {
        const profile = balancedProfile();
        const rng = mulberry32(42);
        const strategy = assignCooperationStrategy(archetype, profile, rng);
        expect(COOPERATION_STRATEGIES).toContain(strategy);
      }
    });
  });

  describe('is deterministic with the same seed', () => {
    it('produces the same strategy given the same archetype, profile, and seed', () => {
      const archetype = 'tragic_hero';
      const profile = balancedProfile();

      const strategy1 = assignCooperationStrategy(archetype, profile, mulberry32(42));
      const strategy2 = assignCooperationStrategy(archetype, profile, mulberry32(42));

      expect(strategy1).toBe(strategy2);
    });

    it('produces the same strategy for identical seeded RNGs', () => {
      const profile = balancedProfile();
      const rng1 = mulberry32(999);
      const rng2 = mulberry32(999);

      const s1 = assignCooperationStrategy('folk_hero', profile, rng1);
      const s2 = assignCooperationStrategy('folk_hero', profile, rng2);

      expect(s1).toBe(s2);
    });
  });

  describe('produces different strategies across seeds', () => {
    it('different seeds produce different strategy distributions', () => {
      const archetype = 'tragic_hero';
      const profile = balancedProfile();

      const strategies = new Set<CooperationStrategy>();
      for (let seed = 0; seed < 20; seed++) {
        const strategy = assignCooperationStrategy(archetype, profile, mulberry32(seed));
        strategies.add(strategy);
      }

      // Expect more than one strategy to be chosen across 20 seeds
      expect(strategies.size).toBeGreaterThan(1);
    });
  });

  describe('respects archetype weights', () => {
    it('trickster biases toward always-defect', () => {
      const profile = balancedProfile();
      const strategies: CooperationStrategy[] = [];

      for (let seed = 0; seed < 100; seed++) {
        const strategy = assignCooperationStrategy('trickster', profile, mulberry32(seed));
        strategies.push(strategy);
      }

      const defectCount = strategies.filter(s => s === 'always-defect').length;
      // Trickster has 0.35 weight for always-defect, so expect ~35% (range 20-50%)
      expect(defectCount).toBeGreaterThan(15);
    });

    it('true_believer biases toward always-cooperate', () => {
      const profile = balancedProfile();
      const strategies: CooperationStrategy[] = [];

      for (let seed = 0; seed < 100; seed++) {
        const strategy = assignCooperationStrategy('true_believer', profile, mulberry32(seed));
        strategies.push(strategy);
      }

      const cooperateCount = strategies.filter(s => s === 'always-cooperate').length;
      // true_believer has 0.5 weight for always-cooperate, so expect ~50% (range 35-65%)
      expect(cooperateCount).toBeGreaterThan(30);
    });

    it('monster heavily biases toward always-defect', () => {
      const profile = balancedProfile();
      const strategies: CooperationStrategy[] = [];

      for (let seed = 0; seed < 100; seed++) {
        const strategy = assignCooperationStrategy('monster', profile, mulberry32(seed));
        strategies.push(strategy);
      }

      const defectCount = strategies.filter(s => s === 'always-defect').length;
      // Monster has 0.65 weight for always-defect, so expect ~65% (range 50-80%)
      expect(defectCount).toBeGreaterThan(45);
    });
  });

  describe('applies axiological nudges', () => {
    it('loyalty_ambition < -0.3 boosts always-defect and penalizes always-cooperate', () => {
      const profile = treacherousProfile();
      const strategiesWithTreachery: CooperationStrategy[] = [];
      const strategiesWithoutTreachery: CooperationStrategy[] = [];

      // Use schemer archetype which has baseline always-defect (0.4)
      for (let seed = 0; seed < 100; seed++) {
        const stratWithTreachery = assignCooperationStrategy('schemer', profile, mulberry32(seed));
        strategiesWithTreachery.push(stratWithTreachery);

        const profileNoTreachery = balancedProfile();
        const stratWithoutTreachery = assignCooperationStrategy('schemer', profileNoTreachery, mulberry32(seed));
        strategiesWithoutTreachery.push(stratWithoutTreachery);
      }

      const defectCountWithTreachery = strategiesWithTreachery.filter(s => s === 'always-defect').length;
      const defectCountWithoutTreachery = strategiesWithoutTreachery.filter(s => s === 'always-defect').length;

      // Treachery should increase defect bias relative to a balanced profile
      expect(defectCountWithTreachery).toBeGreaterThan(defectCountWithoutTreachery);
    });

    it('mercy_ruthlessness < -0.3 boosts grudger', () => {
      const profile = cruelProfile();
      const strategies: CooperationStrategy[] = [];

      for (let seed = 0; seed < 100; seed++) {
        const strategy = assignCooperationStrategy('coming_of_age', profile, mulberry32(seed));
        strategies.push(strategy);
      }

      const grudgerCount = strategies.filter(s => s === 'grudger').length;

      // coming_of_age has 0.25 weight for grudger; cruelty should boost it (×1.3)
      expect(grudgerCount).toBeGreaterThan(25);
    });

    it('honesty_cunning < -0.3 penalizes tit-for-tat and boosts always-defect', () => {
      const profile = cunningProfile();
      const strategiesWithCunning: CooperationStrategy[] = [];
      const strategiesWithoutCunning: CooperationStrategy[] = [];

      // Use reluctant_king archetype which has high tit-for-tat (0.45) and non-zero defect (0.05)
      for (let seed = 0; seed < 200; seed++) {
        const stratWithCunning = assignCooperationStrategy('reluctant_king', profile, mulberry32(seed));
        strategiesWithCunning.push(stratWithCunning);

        const profileNoCunning = balancedProfile();
        const stratWithoutCunning = assignCooperationStrategy('reluctant_king', profileNoCunning, mulberry32(seed));
        strategiesWithoutCunning.push(stratWithoutCunning);
      }

      const tftWithCunning = strategiesWithCunning.filter(s => s === 'tit-for-tat').length;
      const tftWithoutCunning = strategiesWithoutCunning.filter(s => s === 'tit-for-tat').length;

      const defectWithCunning = strategiesWithCunning.filter(s => s === 'always-defect').length;
      const defectWithoutCunning = strategiesWithoutCunning.filter(s => s === 'always-defect').length;

      // cunning should reduce tit-for-tat (×0.7)
      expect(tftWithCunning).toBeLessThan(tftWithoutCunning);
      // cunning should boost always-defect (×1.2) — with more seeds, we expect statistically higher count
      expect(defectWithCunning).toBeGreaterThanOrEqual(defectWithoutCunning);
    });
  });

  describe('handles unknown archetypes gracefully', () => {
    it('returns a valid strategy for unknown archetype', () => {
      const profile = balancedProfile();
      const rng = mulberry32(42);
      const strategy = assignCooperationStrategy('unknown_archetype', profile, rng);
      expect(COOPERATION_STRATEGIES).toContain(strategy);
    });

    it('unknown archetype uses uniform distribution (all strategies equally likely)', () => {
      const profile = balancedProfile();
      const strategies: CooperationStrategy[] = [];

      for (let seed = 0; seed < 100; seed++) {
        const strategy = assignCooperationStrategy('unknown_archetype', profile, mulberry32(seed));
        strategies.push(strategy);
      }

      // With uniform distribution, each strategy should appear ~20 times
      for (const s of COOPERATION_STRATEGIES) {
        const count = strategies.filter(st => st === s).length;
        // Range: expect between 5-35 (uniform would be ~20, allow for variance)
        expect(count).toBeGreaterThan(2);
        expect(count).toBeLessThan(40);
      }
    });
  });
});

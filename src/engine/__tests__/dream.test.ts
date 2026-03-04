import { describe, it, expect } from 'vitest';
import type {
  DreamManipulation,
  ManipulationType,
  InterventionType,
  InterventionDefinition,
  AlignmentFactor,
  TierModifier,
  InterventionCost,
  InterventionResult,
  DivineInfluence,
} from '../../types/dream';
import {
  MANIPULATION_DEFINITIONS,
  INTERVENTION_DEFINITIONS,
  TIER_MODIFIERS,
} from '../../types/dream';

describe('Dream & Toolkit type definitions', () => {
  it('exports all 6 manipulation types with correct properties', () => {
    const types: ManipulationType[] = [
      'whisper', 'inspire', 'suppress', 'reshape', 'implant', 'command',
    ];
    for (const t of types) {
      const def = MANIPULATION_DEFINITIONS[t];
      expect(def).toBeDefined();
      expect(def.minTier).toBeGreaterThanOrEqual(1);
      expect(def.minTier).toBeLessThanOrEqual(4);
      expect(def.baseCost).toBeGreaterThan(0);
      expect(typeof def.probabilityEffect).toBe('string');
    }
  });

  it('exports all 8 intervention types with sphere affinities', () => {
    const types: InterventionType[] = [
      'dream', 'persuade', 'deceive', 'intimidate',
      'inspire_intervention', 'coincidence', 'omen', 'afflict_bless',
    ];
    for (const t of types) {
      const def = INTERVENTION_DEFINITIONS[t];
      expect(def).toBeDefined();
      expect(def.sphereAffinities.length).toBeGreaterThan(0);
      expect(def.detectionRisk).toBeGreaterThanOrEqual(0);
      expect(def.detectionRisk).toBeLessThanOrEqual(1);
    }
  });

  it('exports tier modifiers for all actor types', () => {
    expect(TIER_MODIFIERS.individual).toBe(1.0);
    expect(TIER_MODIFIERS.group).toBe(1.5);
    expect(TIER_MODIFIERS.faction).toBe(2.0);
    expect(TIER_MODIFIERS.culture).toBe(3.0);
    expect(TIER_MODIFIERS.god).toBe(10.0);
  });

  it('DivineInfluence interface has correct shape', () => {
    const influence: DivineInfluence = {
      manipulations: [],
      interventionHistory: [],
    };
    expect(influence.manipulations).toEqual([]);
  });
});

import {
  computeAlignmentFactor,
  computeInterventionCost,
} from '../dream';
import type { AxiologicalProfile } from '../../types/agent';
import type { EssencePool } from '../../types/influence';
import { createEmptyEssencePool } from '../influence';

describe('computeAlignmentFactor', () => {
  const profile: AxiologicalProfile = {
    ambition_contentment: 0.8,
    courage_prudence: 0.6,
    cruelty_compassion: -0.5,
    cunning_honesty: -0.3,
    devotion_independence: 0.2,
    loyalty_treachery: 0.4,
    tradition_innovation: -0.1,
    dominance_humility: 0.3,
    wrath_patience: -0.2,
    greed_generosity: -0.4,
  };

  it('returns aligned (1.0) when action motivations match actor values', () => {
    const factor = computeAlignmentFactor(
      profile,
      ['ambition_contentment', 'courage_prudence'],
    );
    expect(factor.label).toBe('aligned');
    expect(factor.value).toBeCloseTo(1.0, 1);
  });

  it('returns neutral (2.0) when motivations are weakly held', () => {
    const factor = computeAlignmentFactor(
      profile,
      ['tradition_innovation'],
    );
    expect(factor.label).toBe('neutral');
    expect(factor.value).toBeCloseTo(2.0, 0);
  });

  it('returns against (3.0-5.0) when action opposes actor values', () => {
    const factor = computeAlignmentFactor(
      profile,
      ['greed_generosity', 'cruelty_compassion'],
    );
    expect(factor.label).toBe('against');
    expect(factor.value).toBeGreaterThanOrEqual(3.0);
    expect(factor.value).toBeLessThanOrEqual(5.0);
  });
});

describe('computeInterventionCost', () => {
  it('computes final cost as baseCost × alignment × tierModifier', () => {
    const pool: EssencePool = {
      ...createEmptyEssencePool(),
      force: 50,
    };
    const cost = computeInterventionCost({
      baseCost: 2,
      sphere: 'force',
      alignmentFactor: 1.5,
      actorType: 'faction',
      pool,
    });
    expect(cost.finalCost).toBeCloseTo(6.0);
    expect(cost.affordable).toBe(true);
  });

  it('marks as unaffordable when pool is insufficient', () => {
    const pool: EssencePool = {
      ...createEmptyEssencePool(),
      mind: 2,
    };
    const cost = computeInterventionCost({
      baseCost: 3,
      sphere: 'mind',
      alignmentFactor: 2.0,
      actorType: 'individual',
      pool,
    });
    expect(cost.finalCost).toBeCloseTo(6.0);
    expect(cost.affordable).toBe(false);
  });
});

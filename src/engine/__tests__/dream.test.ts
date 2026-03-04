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

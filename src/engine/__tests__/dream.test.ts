import { describe, it, expect } from 'vitest';
import type {
  DreamManipulation,
  ManipulationType,
  InterventionType,
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
  applyDreamManipulations,
  validateManipulation,
  executeIntervention,
  computeDetection,
} from '../dream';
import type { AxiologicalProfile, ActionCandidate } from '../../types/agent';
import type { EssencePool } from '../../types/influence';
import type { DreamManipulation, ManipulationType, InterventionType } from '../../types/dream';
import type { InfluenceTier } from '../../types/influence';
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

describe('validateManipulation', () => {
  it('rejects manipulation when actor tier is below minimum', () => {
    const result = validateManipulation('inspire', 1 as InfluenceTier);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('tier');
  });

  it('accepts manipulation when actor tier meets minimum', () => {
    const result = validateManipulation('inspire', 2 as InfluenceTier);
    expect(result.valid).toBe(true);
  });

  it('accepts whisper at tier 1', () => {
    const result = validateManipulation('whisper', 1 as InfluenceTier);
    expect(result.valid).toBe(true);
  });

  it('requires tier 4 for command', () => {
    expect(validateManipulation('command', 3 as InfluenceTier).valid).toBe(false);
    expect(validateManipulation('command', 4 as InfluenceTier).valid).toBe(true);
  });
});

describe('applyDreamManipulations', () => {
  function makeCandidates(): ActionCandidate[] {
    return [
      { templateId: 'march', targetId: 'loc_1', domain: 'iron', score: 10, motivations: ['ambition_contentment', 'courage_prudence'], probability: 0.60 },
      { templateId: 'ally', targetId: 'actor_2', domain: 'heart', score: 5, motivations: ['loyalty_treachery'], probability: 0.25 },
      { templateId: 'train', targetId: 'loc_1', domain: 'iron', score: 3, motivations: ['tradition_innovation'], probability: 0.15 },
    ];
  }

  it('whisper boosts target probability by 0.10-0.15 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'whisper',
      targetCandidateIndex: 1,
      sphereCost: 'spirit',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[1].probability!).toBeGreaterThan(0.25);
  });

  it('suppress reduces target probability by 0.20 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'suppress',
      targetCandidateIndex: 0,
      sphereCost: 'force',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[0].probability!).toBeLessThan(0.60);
  });

  it('inspire boosts target probability by 0.25-0.30 and renormalizes', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'inspire',
      targetCandidateIndex: 2,
      sphereCost: 'force',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    expect(result[2].probability!).toBeGreaterThan(0.15);
  });

  it('command overrides target to 1.0 and zeros others', () => {
    const candidates = makeCandidates();
    const manipulation: DreamManipulation = {
      type: 'command',
      targetCandidateIndex: 1,
      sphereCost: 'spirit',
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result[1].probability).toBeCloseTo(1.0, 2);
    expect(result[0].probability).toBeCloseTo(0.0, 2);
    expect(result[2].probability).toBeCloseTo(0.0, 2);
  });

  it('implant injects a new candidate and renormalizes', () => {
    const candidates = makeCandidates();
    const newCandidate: ActionCandidate = {
      templateId: 'pray', targetId: 'loc_1', domain: 'veil',
      score: 0, motivations: ['devotion_independence'], probability: 0,
    };
    const manipulation: DreamManipulation = {
      type: 'implant',
      targetCandidateIndex: -1,
      sphereCost: 'spirit',
      implantCandidate: newCandidate,
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result.length).toBe(4);
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
    const implanted = result.find(c => c.templateId === 'pray');
    expect(implanted).toBeDefined();
    expect(implanted!.probability!).toBeGreaterThan(0);
  });

  it('reshape replaces the target candidate with a variant', () => {
    const candidates = makeCandidates();
    const variant: ActionCandidate = {
      templateId: 'march_negotiate', targetId: 'loc_1', domain: 'heart',
      score: 10, motivations: ['ambition_contentment', 'cunning_honesty'], probability: 0,
    };
    const manipulation: DreamManipulation = {
      type: 'reshape',
      targetCandidateIndex: 0,
      sphereCost: 'mind',
      reshapeTo: variant,
    };
    const result = applyDreamManipulations(candidates, [manipulation]);
    expect(result.length).toBe(3);
    expect(result[0].templateId).toBe('march_negotiate');
    const total = result.reduce((s, c) => s + (c.probability ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 2);
  });
});

describe('computeDetection', () => {
  it('returns detected=false when roll exceeds detection risk', () => {
    const result = computeDetection('dream', 0, 0.5);
    expect(result.detected).toBe(false);
    expect(result.detectedBy).toBe('none');
  });

  it('returns mortal detection when roll is below base risk', () => {
    const result = computeDetection('coincidence', 0, 0.1);
    expect(result.detected).toBe(true);
    expect(result.detectedBy).toBe('mortal');
  });

  it('increases detection risk with frequency bonus', () => {
    const result = computeDetection('dream', 5, 0.3);
    expect(result.detected).toBe(true);
  });

  it('caps detection probability at 0.95', () => {
    const result = computeDetection('dream', 100, 0.96);
    expect(result.detected).toBe(false);
  });
});

describe('executeIntervention', () => {
  it('spends essence and returns success when affordable', () => {
    const pool = { ...createEmptyEssencePool(), mind: 20 };
    const result = executeIntervention({
      interventionType: 'dream',
      sphere: 'mind',
      baseCost: 1,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      detectionRoll: 0.99,
    });
    expect(result.success).toBe(true);
    expect(result.essenceSpent.mind).toBeCloseTo(1.0);
    expect(result.detected).toBe(false);
  });

  it('fails without spending essence when unaffordable', () => {
    const pool = { ...createEmptyEssencePool(), force: 0.5 };
    const result = executeIntervention({
      interventionType: 'intimidate',
      sphere: 'force',
      baseCost: 2,
      alignmentFactor: 2.0,
      actorType: 'faction',
      pool,
      detectionRoll: 0.5,
    });
    expect(result.success).toBe(false);
    expect(result.essenceSpent.force).toBe(0);
  });

  it('generates narrativeHook matching intervention type', () => {
    const pool = { ...createEmptyEssencePool(), spirit: 50 };
    const result = executeIntervention({
      interventionType: 'omen',
      sphere: 'spirit',
      baseCost: 2,
      alignmentFactor: 1.0,
      actorType: 'individual',
      pool,
      detectionRoll: 0.99,
    });
    expect(result.success).toBe(true);
    expect(result.narrativeHook).toContain('omen');
  });
});

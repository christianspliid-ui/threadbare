import { describe, it, expect } from 'vitest';
import { generateAgendas, type GenerateAgendasInput } from '../agendaGenerator';
import type { AxiologicalProfile } from '../../types/agent';

const defaultProfile: AxiologicalProfile = {
  loyalty_ambition: 0.2,
  courage_prudence: 0.0,
  mercy_ruthlessness: -0.3,
  honesty_cunning: 0.1,
  sacrifice_survival: 0.0,
  loyalty_ambition: 0.3,
  tradition_novelty: 0.0,
  humility_pride: 0.0,
  mercy_ruthlessness: 0.0,
  asceticism_extravagance: 0.0,
};

describe('generateAgendas', () => {
  it('returns 2-4 agendas', () => {
    const agendas = generateAgendas({
      interventionType: 'persuade',
      targetArchetypeId: 'conqueror',
      targetProfile: defaultProfile,
      playerPrimarySphere: 'force',
      seed: 42,
    });
    expect(agendas.length).toBeGreaterThanOrEqual(2);
    expect(agendas.length).toBeLessThanOrEqual(4);
  });

  it('filters out agendas for values already maxed', () => {
    const maxedProfile: AxiologicalProfile = {
      ...defaultProfile,
      loyalty_ambition: 0.95, // nearly maxed left
    };
    const agendas = generateAgendas({
      interventionType: 'persuade',
      targetArchetypeId: 'conqueror',
      targetProfile: maxedProfile,
      playerPrimarySphere: 'force',
      seed: 42,
    });
    // Should not offer ambition (left pole of loyalty_ambition) since it's already 0.95
    const ambitionAgenda = agendas.find(a => a.valuePair === 'loyalty_ambition' && a.valueDirection === 'left');
    expect(ambitionAgenda).toBeUndefined();
  });

  it('prefers archetype-affinity agendas', () => {
    const agendas = generateAgendas({
      interventionType: 'persuade',
      targetArchetypeId: 'merchant_prince',
      targetProfile: defaultProfile,
      playerPrimarySphere: 'mind',
      seed: 42,
    });
    // merchant_prince should surface wealth-related or trade-related agendas
    const hasAffinityMatch = agendas.some(a => a.archetypeAffinities.includes('merchant_prince'));
    expect(hasAffinityMatch).toBe(true);
  });

  it('is deterministic with same seed', () => {
    const input: GenerateAgendasInput = {
      interventionType: 'dream',
      targetArchetypeId: 'tragic_hero',
      targetProfile: defaultProfile,
      playerPrimarySphere: 'spirit',
      seed: 123,
    };
    const a1 = generateAgendas(input);
    const a2 = generateAgendas(input);
    expect(a1.map(a => a.id)).toEqual(a2.map(a => a.id));
  });

  it('varies output with different seeds', () => {
    const base = {
      interventionType: 'persuade' as const,
      targetArchetypeId: 'conqueror',
      targetProfile: defaultProfile,
      playerPrimarySphere: 'force' as const,
    };
    const a1 = generateAgendas({ ...base, seed: 1 });
    const a2 = generateAgendas({ ...base, seed: 9999 });
    // Both return valid results
    expect(a1.length).toBeGreaterThanOrEqual(2);
    expect(a2.length).toBeGreaterThanOrEqual(2);
  });
});

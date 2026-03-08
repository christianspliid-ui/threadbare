import { describe, it, expect } from 'vitest';
import type { DivineInfluenceEntry } from '../dream';
import type { InterventionEffectTrace, TraceEntry } from '../trace';
import { TRACE_CATEGORIES } from '../trace';

describe('DivineInfluenceEntry type', () => {
  it('can create a value-drift influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_001',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 10,
      ticksRemaining: 3,
      valueDrifts: { courage_prudence: 0.12 },
    };
    expect(influence.ticksRemaining).toBe(3);
    expect(influence.valueDrifts?.courage_prudence).toBe(0.12);
  });

  it('can create a strategy-override influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_002',
      interventionType: 'intimidate',
      sphere: 'force',
      tickApplied: 5,
      ticksRemaining: 10,
      strategyOverride: 'grudger',
      valueDrifts: { courage_prudence: -0.30 },
    };
    expect(influence.strategyOverride).toBe('grudger');
  });

  it('can create a personality-boost influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_003',
      interventionType: 'inspire_intervention',
      sphere: 'spirit',
      tickApplied: 8,
      ticksRemaining: 6,
      personalityBoost: 0.30,
      traitId: 'condition_divinely_inspired',
    };
    expect(influence.personalityBoost).toBe(0.30);
  });
});

describe('InterventionEffectTrace', () => {
  it('is included in TRACE_CATEGORIES', () => {
    expect(TRACE_CATEGORIES).toContain('intervention_effect');
  });

  it('can be assigned to TraceEntry', () => {
    const trace: TraceEntry = {
      id: 1,
      tick: 5,
      timestamp: 1000,
      category: 'intervention_effect',
      summary: 'Dream on Kael via mind',
      interventionType: 'dream',
      targetAgentId: 'actor.kael',
      targetAgentName: 'Kael',
      sphere: 'mind',
      effects: ['courage_prudence +0.12 for 3 ticks'],
      consequenceMessage: 'Kael will be drawn toward courage.',
      ticksRemaining: 3,
    };
    expect(trace.category).toBe('intervention_effect');
  });
});

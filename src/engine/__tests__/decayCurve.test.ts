import { describe, it, expect } from 'vitest';
import { getCurrentStrength, DECAY_CONSTANTS } from '../decayCurve';
import { buildValueOverlay } from '../interventionEffects';
import type { AxiologicalProfile } from '../../types/agent';
import type { DivineInfluenceEntry } from '../../types/dream';

describe('getCurrentStrength', () => {
  it('returns initialStrength at tick 0', () => {
    const strength = getCurrentStrength({
      initialStrength: 0.70,
      decayRate: 0.10,
      minimumStrength: 0.05,
      maxDuration: 30,
      tickApplied: 0,
    }, 0);
    expect(strength).toBeCloseTo(0.70);
  });

  it('decays exponentially over time', () => {
    const s0 = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 0,
    }, 0);
    const s5 = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 0,
    }, 5);
    const s10 = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 0,
    }, 10);
    expect(s5).toBeLessThan(s0);
    expect(s10).toBeLessThan(s5);
    expect(s5).toBeCloseTo(0.70 * Math.exp(-0.10 * 5), 2);
  });

  it('never drops below minimumStrength before maxDuration', () => {
    const strength = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 0,
    }, 25);
    expect(strength).toBeGreaterThanOrEqual(0.05);
  });

  it('returns 0 after maxDuration', () => {
    const strength = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 0,
    }, 31);
    expect(strength).toBe(0);
  });

  it('handles tickApplied offset correctly', () => {
    const strength = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 100,
    }, 105);
    expect(strength).toBeCloseTo(0.70 * Math.exp(-0.10 * 5), 2);
  });

  it('returns initialStrength when currentTick < tickApplied (negative elapsed)', () => {
    const strength = getCurrentStrength({
      initialStrength: 0.70, decayRate: 0.10, minimumStrength: 0.05, maxDuration: 30, tickApplied: 10,
    }, 5);
    expect(strength).toBeCloseTo(0.70);
  });
});

describe('DECAY_CONSTANTS', () => {
  it('has entries for all 8 intervention types', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'] as const;
    for (const t of types) {
      expect(DECAY_CONSTANTS[t]).toBeDefined();
      expect(DECAY_CONSTANTS[t].initialStrength).toBeGreaterThan(0);
      expect(DECAY_CONSTANTS[t].decayRate).toBeGreaterThan(0);
      expect(DECAY_CONSTANTS[t].minimumStrength).toBeGreaterThan(0);
      expect(DECAY_CONSTANTS[t].maxDuration).toBeGreaterThan(0);
    }
  });
});

describe('buildValueOverlay with decay', () => {
  const baseProfile: AxiologicalProfile = {
    loyalty_ambition: 0.0,
    courage_prudence: 0.0,
    mercy_ruthlessness: 0.0,
    honesty_cunning: 0.0,
    sacrifice_survival: 0.0,
    loyalty_ambition: 0.0,
    tradition_novelty: 0.0,
    preservation_transformation: 0.0,
    mercy_ruthlessness: 0.0,
    asceticism_extravagance: 0.0,
  };

  it('applies full drift at tick 0', () => {
    const influence: DivineInfluenceEntry = {
      id: 'test',
      interventionType: 'persuade',
      sphere: 'mind',
      tickApplied: 0,
      initialStrength: 0.70,
      decayRate: 0.10,
      minimumStrength: 0.05,
      maxDuration: 30,
      valueDrifts: { asceticism_extravagance: 0.20 },
    };
    const overlay = buildValueOverlay(baseProfile, [influence], 0);
    // At tick 0: strength = 0.70, drift = 0.20 * 0.70 = 0.14
    expect(overlay.asceticism_extravagance).toBeCloseTo(0.14, 2);
  });

  it('applies decayed drift at later ticks', () => {
    const influence: DivineInfluenceEntry = {
      id: 'test',
      interventionType: 'persuade',
      sphere: 'mind',
      tickApplied: 0,
      initialStrength: 0.70,
      decayRate: 0.10,
      minimumStrength: 0.05,
      maxDuration: 30,
      valueDrifts: { asceticism_extravagance: 0.20 },
    };
    const overlay0 = buildValueOverlay(baseProfile, [influence], 0);
    const overlay10 = buildValueOverlay(baseProfile, [influence], 10);
    expect(overlay10.asceticism_extravagance).toBeLessThan(overlay0.asceticism_extravagance);
    expect(overlay10.asceticism_extravagance).toBeGreaterThan(0);
  });

  it('returns 0 drift after maxDuration (expired)', () => {
    const influence: DivineInfluenceEntry = {
      id: 'test',
      interventionType: 'persuade',
      sphere: 'mind',
      tickApplied: 0,
      initialStrength: 0.70,
      decayRate: 0.10,
      minimumStrength: 0.05,
      maxDuration: 30,
      valueDrifts: { asceticism_extravagance: 0.20 },
    };
    const overlay = buildValueOverlay(baseProfile, [influence], 31);
    expect(overlay.asceticism_extravagance).toBe(0);
  });
});

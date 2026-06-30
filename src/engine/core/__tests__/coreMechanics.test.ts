import { describe, it, expect } from 'vitest';
import {
  seedCoreProfile,
  colourReachExpression,
  coreBendContributions,
  coreEmergentSignal,
  coreValue,
} from '../coreMechanics';
import { CORE_CONTINUUM_IDS, CORE_NEUTRAL } from '../../../types/coreRegistry';
import {
  CORE_BEND_QUINTESSENCE_THRESHOLD,
  CORE_EMERGENCE_VIRTUE_THRESHOLD,
  CORE_EMERGENCE_VICE_THRESHOLD,
} from '../coreConstants';

// Simple deterministic PRNG matching the engine's mulberry32.
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('seedCoreProfile', () => {
  it('produces a value per continuum, all within [0,1]', () => {
    const p = seedCoreProfile(mulberry32(42));
    expect(Object.keys(p).sort()).toEqual([...CORE_CONTINUUM_IDS].sort());
    for (const id of CORE_CONTINUUM_IDS) {
      const v = p[id]!;
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for the same seed', () => {
    expect(seedCoreProfile(mulberry32(7))).toEqual(seedCoreProfile(mulberry32(7)));
  });

  it('differs across seeds and clusters near neutral (central-limit)', () => {
    const a = seedCoreProfile(mulberry32(1));
    const b = seedCoreProfile(mulberry32(999));
    expect(a).not.toEqual(b);
    // Over many draws the mean baseline should sit near 0.5.
    let sum = 0;
    let n = 0;
    for (let seed = 0; seed < 200; seed++) {
      const p = seedCoreProfile(mulberry32(seed));
      for (const id of CORE_CONTINUUM_IDS) { sum += p[id]!; n++; }
    }
    expect(Math.abs(sum / n - CORE_NEUTRAL)).toBeLessThan(0.05);
  });
});

describe('coreValue', () => {
  it('reads stored values and treats absent/invalid as neutral', () => {
    expect(coreValue({ core_warmth: 0.9 }, 'core_warmth')).toBe(0.9);
    expect(coreValue({}, 'core_warmth')).toBe(CORE_NEUTRAL);
    expect(coreValue(undefined, 'core_integrity')).toBe(CORE_NEUTRAL);
  });

  it('clamps stored values into [0,1]', () => {
    expect(coreValue({ core_warmth: 1.7 }, 'core_warmth')).toBe(1);
    expect(coreValue({ core_warmth: -0.3 }, 'core_warmth')).toBe(0);
  });
});

describe('colourReachExpression', () => {
  it('reads sincere on a True + Humble self', () => {
    const c = colourReachExpression({ core_integrity: 0.9, core_humility: 0.8 }, 'Brave');
    expect(c).toEqual({ word: 'Brave', tone: 'sincere' });
  });

  it('reads performative on a Proud self regardless of integrity', () => {
    const c = colourReachExpression({ core_integrity: 0.9, core_humility: 0.2 }, 'Brave');
    expect(c.tone).toBe('performative');
  });

  it('reads performative on a False self', () => {
    const c = colourReachExpression({ core_integrity: 0.2, core_humility: 0.7 }, 'Generous');
    expect(c.tone).toBe('performative');
  });

  it('reads plain when neither sincere nor performative thresholds are met', () => {
    const c = colourReachExpression({ core_integrity: CORE_NEUTRAL, core_humility: 0.7 }, 'Fair');
    expect(c.tone).toBe('plain');
  });

  it('passes the reach word through unchanged (colour never changes competence)', () => {
    expect(colourReachExpression(undefined, 'Loyal').word).toBe('Loyal');
  });
});

describe('coreBendContributions', () => {
  it('returns nothing at/above the Quintessence threshold (agent holds their self)', () => {
    const core = { core_warmth: 0.1 }; // strongly Cold
    expect(coreBendContributions(core, CORE_BEND_QUINTESSENCE_THRESHOLD)).toEqual([]);
    expect(coreBendContributions(core, 1.0)).toEqual([]);
  });

  it('bends coupled reach axes under low Quintessence, signed by the lean', () => {
    // Warm (virtue) couples gold +1, heart +1 → positive nudges toward virtue.
    const warm = coreBendContributions({ core_warmth: 0.95 }, 0.0);
    const golds = warm.filter((c) => c.reach === 'gold');
    expect(golds).toHaveLength(1);
    expect(golds[0]!.nudge).toBeGreaterThan(0);
    // Cold (vice) leans the other way → negative nudge on the same coupling.
    const cold = coreBendContributions({ core_warmth: 0.05 }, 0.0);
    const goldCold = cold.find((c) => c.reach === 'gold')!;
    expect(goldCold.nudge).toBeLessThan(0);
  });

  it('scales nudge with depth below the threshold (more bent = bigger nudge)', () => {
    const shallow = coreBendContributions({ core_warmth: 0.95 }, CORE_BEND_QUINTESSENCE_THRESHOLD * 0.9);
    const deep = coreBendContributions({ core_warmth: 0.95 }, 0.0);
    const sg = shallow.find((c) => c.reach === 'gold')!.nudge;
    const dg = deep.find((c) => c.reach === 'gold')!.nudge;
    expect(dg).toBeGreaterThan(sg);
  });

  it('emits nothing from continuums with no couplings or at neutral', () => {
    // core_hope has no couplings even at an extreme.
    const hope = coreBendContributions({ core_hope: 0.99 }, 0.0);
    expect(hope.every((c) => c.continuumId !== 'core_hope')).toBe(true);
    // A neutral coupled continuum contributes nothing.
    const neutral = coreBendContributions({ core_warmth: CORE_NEUTRAL }, 0.0);
    expect(neutral.every((c) => c.continuumId !== 'core_warmth')).toBe(true);
  });
});

describe('coreEmergentSignal', () => {
  it('flags a continuum past the virtue threshold', () => {
    const sig = coreEmergentSignal({ core_warmth: CORE_EMERGENCE_VIRTUE_THRESHOLD });
    expect(sig).toContainEqual(
      expect.objectContaining({ continuumId: 'core_warmth', side: 'virtue', word: 'Warm' }),
    );
  });

  it('flags a continuum past the vice threshold', () => {
    const sig = coreEmergentSignal({ core_integrity: CORE_EMERGENCE_VICE_THRESHOLD });
    expect(sig).toContainEqual(
      expect.objectContaining({ continuumId: 'core_integrity', side: 'vice', word: 'False' }),
    );
  });

  it('flags nothing for a neutral profile', () => {
    expect(coreEmergentSignal({})).toEqual([]);
    expect(coreEmergentSignal(undefined)).toEqual([]);
  });
});

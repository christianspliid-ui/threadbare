import { describe, it, expect } from 'vitest';
import { deriveArchetypeEpithet, ARCHETYPE_DOMAIN_WORDS, ARCHETYPE_THRESHOLD } from '../archetypeEpithet';
import type { AxiologicalProfile } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';

/** Build a blank axiological profile (all zeros) */
function blankProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as AxiologicalProfile;
}

describe('deriveArchetypeEpithet', () => {
  it('returns null when all values are 0 (no lean)', () => {
    const profile = blankProfile();
    expect(deriveArchetypeEpithet(profile)).toBeNull();
  });

  it('returns null when lean is exactly at threshold (not exceeding)', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = ARCHETYPE_THRESHOLD; // exactly 0.6 — not > 0.6
    expect(deriveArchetypeEpithet(profile)).toBeNull();
  });

  it('returns null when lean is below threshold (0.5)', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = 0.5;
    expect(deriveArchetypeEpithet(profile)).toBeNull();
  });

  it('returns "The Protector of Storms" for mercy_ruthlessness at +0.8 (positive pole)', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = 0.8;
    expect(deriveArchetypeEpithet(profile)).toBe('The Protector of Storms');
  });

  it('returns "The Conqueror of Ruin" for mercy_ruthlessness at -0.8 (negative pole)', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = -0.8;
    expect(deriveArchetypeEpithet(profile)).toBe('The Conqueror of Ruin');
  });

  it('returns null when only courage_prudence (meta-axis) exceeds threshold', () => {
    const profile = blankProfile();
    profile.courage_prudence = 0.9;
    expect(deriveArchetypeEpithet(profile)).toBeNull();
  });

  it('returns null when courage_prudence is -0.9 (meta-axis, negative pole)', () => {
    const profile = blankProfile();
    profile.courage_prudence = -0.9;
    expect(deriveArchetypeEpithet(profile)).toBeNull();
  });

  it('picks the strongest lean when multiple pairs exceed threshold', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = 0.7;     // iron — Protector
    profile.loyalty_ambition = 0.9;       // heart — Sworn (stronger)
    const result = deriveArchetypeEpithet(profile);
    expect(result).toBe('The Sworn of Bonds');
  });

  it('returns a deterministic result (first in VALUE_PAIRS order) when two pairs tie', () => {
    const profile = blankProfile();
    profile.mercy_ruthlessness = 0.8;     // iron — first in VALUE_PAIRS
    profile.loyalty_ambition = 0.8;       // heart — later in VALUE_PAIRS
    // mercy_ruthlessness comes first in VALUE_PAIRS so it wins the tie
    const result = deriveArchetypeEpithet(profile);
    expect(result).toBe('The Protector of Storms');
  });

  it('works for all 8 reach pairs (each produces non-null result with strong lean)', () => {
    const pairToExpected: Array<{ pair: keyof AxiologicalProfile; lean: number; expected: string }> = [
      { pair: 'mercy_ruthlessness',          lean: 0.8,  expected: 'The Protector of Storms' },
      { pair: 'asceticism_extravagance',     lean: 0.8,  expected: 'The Mender of Harvests' },
      { pair: 'honesty_cunning',             lean: -0.8, expected: 'The Puppeteer of Whispers' },
      { pair: 'tradition_novelty',           lean: 0.8,  expected: 'The Archivist of Mysteries' },
      { pair: 'loyalty_ambition',            lean: -0.8, expected: 'The Renegade of Flames' },
      { pair: 'revelation_discretion',       lean: 0.8,  expected: 'The Seeker of Truths' },
      { pair: 'preservation_transformation', lean: -0.8, expected: 'The Shaper of Forms' },
      { pair: 'sacrifice_survival',          lean: 0.8,  expected: 'The Martyr of Fates' },
    ];

    for (const { pair, lean, expected } of pairToExpected) {
      const profile = blankProfile();
      profile[pair] = lean;
      expect(deriveArchetypeEpithet(profile)).toBe(expected);
    }
  });
});

describe('ARCHETYPE_DOMAIN_WORDS', () => {
  it('has entries for all 8 reaches', () => {
    const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
    for (const reach of reaches) {
      expect(ARCHETYPE_DOMAIN_WORDS).toHaveProperty(reach);
      expect(ARCHETYPE_DOMAIN_WORDS[reach as keyof typeof ARCHETYPE_DOMAIN_WORDS].positive).toBeTruthy();
      expect(ARCHETYPE_DOMAIN_WORDS[reach as keyof typeof ARCHETYPE_DOMAIN_WORDS].negative).toBeTruthy();
    }
  });

  it('does not have a flesh entry', () => {
    expect(ARCHETYPE_DOMAIN_WORDS).not.toHaveProperty('flesh');
  });
});

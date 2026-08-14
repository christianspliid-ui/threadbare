import { describe, it, expect } from 'vitest';
import {
  DOMAIN_WORD_SCALES,
  getDomainWord,
  VALUE_WORD_MAP,
  getValueWord,
  REPUTATION_WORDS,
  getReputationWord,
  BOND_STRENGTH_WORDS,
  getBondStrengthWord,
  DURATION_WORDS,
  DURATION_BAND_MAX_TICKS,
  getDurationWord,
} from '../domain-words';
import { RETINUE_VIGNETTE_TIMEOUT } from '../../types/encounterVisibility';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import type { ValuePair } from '../../types/agent';

describe('DOMAIN_WORD_SCALES', () => {
  it('exports scales for all defined reaches', () => {
    expect(Object.keys(DOMAIN_WORD_SCALES).length).toBeGreaterThan(0);
    for (const domain of REACH_DOMAINS) {
      expect(DOMAIN_WORD_SCALES).toHaveProperty(domain);
    }
  });

  it('each reach has exactly 5 tiers', () => {
    for (const [domain, tiers] of Object.entries(DOMAIN_WORD_SCALES)) {
      expect(tiers).toHaveLength(5);
      expect(Array.isArray(tiers)).toBe(true);
      for (let i = 0; i < 5; i++) {
        expect(typeof tiers[i]).toBe('string');
        expect(tiers[i].length).toBeGreaterThan(0);
      }
    }
  });

  it('each reach has unique tier words', () => {
    for (const [domain, tiers] of Object.entries(DOMAIN_WORD_SCALES)) {
      const unique = new Set(tiers);
      expect(unique.size).toBe(tiers.length);
    }
  });

  it('has correct words for iron (Meek → Legendary)', () => {
    expect(DOMAIN_WORD_SCALES.iron).toEqual([
      'Meek', 'Trained', 'Formidable', 'Fearsome', 'Legendary',
    ]);
  });

  it('has correct words for gold (Naive → Magnate)', () => {
    expect(DOMAIN_WORD_SCALES.gold).toEqual([
      'Naive', 'Bartering', 'Shrewd', 'Masterful', 'Magnate',
    ]);
  });

  it('has correct words for shadow (Exposed → Phantom)', () => {
    expect(DOMAIN_WORD_SCALES.shadow).toEqual([
      'Exposed', 'Cautious', 'Subtle', 'Unseen', 'Phantom',
    ]);
  });

  it('has correct words for veil (Blind → Transcendent)', () => {
    expect(DOMAIN_WORD_SCALES.veil).toEqual([
      'Blind', 'Sensitive', 'Attuned', 'Channeler', 'Transcendent',
    ]);
  });

  it('has correct words for heart (Shunned → Revered)', () => {
    expect(DOMAIN_WORD_SCALES.heart).toEqual([
      'Shunned', 'Tolerated', 'Liked', 'Beloved', 'Revered',
    ]);
  });

  it('has correct words for eye (Oblivious → Oracle)', () => {
    expect(DOMAIN_WORD_SCALES.eye).toEqual([
      'Oblivious', 'Observant', 'Perceptive', 'Seer', 'Oracle',
    ]);
  });

  it('has correct words for stone (Clumsy → Monumental)', () => {
    expect(DOMAIN_WORD_SCALES.stone).toEqual([
      'Clumsy', 'Handy', 'Skilled', 'Masterwork', 'Monumental',
    ]);
  });

  it('has correct words for star (Lost → Cosmic)', () => {
    expect(DOMAIN_WORD_SCALES.star).toEqual([
      'Lost', 'Guided', 'Fated', 'Destined', 'Cosmic',
    ]);
  });

  // flesh reach removed in TB-075 Phase 1 — no flesh scale test needed
});

describe('getDomainWord', () => {
  it('returns tier 0 for value 0', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 0)).toBe(DOMAIN_WORD_SCALES[domain][0]);
    }
  });

  it('returns tier 0 for value 1.5 (floor(1.5 / 2) = 0)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 1.5)).toBe(DOMAIN_WORD_SCALES[domain][0]);
    }
  });

  it('returns tier 1 for value 3 (floor(3 / 2) = 1)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 3)).toBe(DOMAIN_WORD_SCALES[domain][1]);
    }
  });

  it('returns tier 2 for value 5 (floor(5 / 2) = 2)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 5)).toBe(DOMAIN_WORD_SCALES[domain][2]);
    }
  });

  it('returns tier 3 for value 7 (floor(7 / 2) = 3)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 7)).toBe(DOMAIN_WORD_SCALES[domain][3]);
    }
  });

  it('returns tier 4 for value 9 (floor(9 / 2) = 4)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 9)).toBe(DOMAIN_WORD_SCALES[domain][4]);
    }
  });

  it('clamps value 10 to tier 4 (min(4, floor(10 / 2)) = 4)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 10)).toBe(DOMAIN_WORD_SCALES[domain][4]);
    }
  });

  it('clamps value > 10 to tier 4', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, 100)).toBe(DOMAIN_WORD_SCALES[domain][4]);
    }
  });

  it('returns tier 0 for negative values (clamped to 0)', () => {
    for (const domain of REACH_DOMAINS) {
      expect(getDomainWord(domain, -5)).toBe(DOMAIN_WORD_SCALES[domain][0]);
    }
  });

  it('works for all 8 domains', () => {
    const value = 6;
    expect(getDomainWord('iron', value)).toBe(DOMAIN_WORD_SCALES.iron[3]);
    expect(getDomainWord('gold', value)).toBe(DOMAIN_WORD_SCALES.gold[3]);
    expect(getDomainWord('shadow', value)).toBe(DOMAIN_WORD_SCALES.shadow[3]);
    expect(getDomainWord('veil', value)).toBe(DOMAIN_WORD_SCALES.veil[3]);
    expect(getDomainWord('heart', value)).toBe(DOMAIN_WORD_SCALES.heart[3]);
    expect(getDomainWord('eye', value)).toBe(DOMAIN_WORD_SCALES.eye[3]);
    expect(getDomainWord('stone', value)).toBe(DOMAIN_WORD_SCALES.stone[3]);
    expect(getDomainWord('star', value)).toBe(DOMAIN_WORD_SCALES.star[3]);
  });
});

describe('VALUE_WORD_MAP', () => {
  it('exports value pairs', () => {
    expect(Object.keys(VALUE_WORD_MAP).length).toBeGreaterThan(0);
  });

  it('each value pair has [left, right] labels', () => {
    for (const [pair, labels] of Object.entries(VALUE_WORD_MAP)) {
      expect(Array.isArray(labels)).toBe(true);
      expect(labels).toHaveLength(2);
      expect(typeof labels[0]).toBe('string');
      expect(typeof labels[1]).toBe('string');
      expect(labels[0].length).toBeGreaterThan(0);
      expect(labels[1].length).toBeGreaterThan(0);
    }
  });

  it('has correct labels for loyalty_ambition', () => {
    expect(VALUE_WORD_MAP.loyalty_ambition).toEqual(['Loyal', 'Ambitious']);
  });

  it('has correct labels for all 9 pairs', () => {
    expect(VALUE_WORD_MAP.courage_prudence).toEqual(['Courageous', 'Prudent']);
    expect(VALUE_WORD_MAP.mercy_ruthlessness).toEqual(['Merciful', 'Ruthless']);
    expect(VALUE_WORD_MAP.honesty_cunning).toEqual(['Honest', 'Cunning']);
    expect(VALUE_WORD_MAP.sacrifice_survival).toEqual(['Self-Sacrificing', 'Self-Preserving']);
    expect(VALUE_WORD_MAP.loyalty_ambition).toEqual(['Loyal', 'Ambitious']);
    expect(VALUE_WORD_MAP.tradition_novelty).toEqual(['Traditional', 'Innovative']);
    expect(VALUE_WORD_MAP.preservation_transformation).toEqual(['Preserving', 'Transforming']);
    expect(VALUE_WORD_MAP.asceticism_extravagance).toEqual(['Ascetic', 'Extravagant']);
    expect(VALUE_WORD_MAP.revelation_discretion).toEqual(['Revealing', 'Discreet']);
  });
});

describe('getValueWord', () => {
  it('returns left label with "Deeply " prefix for value >= 0.8', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0.8);
      expect(word).toBe(`Deeply ${VALUE_WORD_MAP[pair][0]}`);
    }
    // Also test 1.0
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 1.0);
      expect(word).toBe(`Deeply ${VALUE_WORD_MAP[pair][0]}`);
    }
  });

  it('returns left label without prefix for 0.5 <= value < 0.8', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0.5);
      expect(word).toBe(VALUE_WORD_MAP[pair][0]);
    }
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0.75);
      expect(word).toBe(VALUE_WORD_MAP[pair][0]);
    }
  });

  it('returns left label with "Somewhat " prefix for 0 <= value < 0.5', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0);
      expect(word).toBe(`Somewhat ${VALUE_WORD_MAP[pair][0]}`);
    }
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0.25);
      expect(word).toBe(`Somewhat ${VALUE_WORD_MAP[pair][0]}`);
    }
  });

  it('returns right label with "Deeply " prefix for value <= -0.8', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -0.8);
      expect(word).toBe(`Deeply ${VALUE_WORD_MAP[pair][1]}`);
    }
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -1.0);
      expect(word).toBe(`Deeply ${VALUE_WORD_MAP[pair][1]}`);
    }
  });

  it('returns right label without prefix for -0.8 < value <= -0.5', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -0.5);
      expect(word).toBe(VALUE_WORD_MAP[pair][1]);
    }
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -0.75);
      expect(word).toBe(VALUE_WORD_MAP[pair][1]);
    }
  });

  it('returns right label with "Somewhat " prefix for -0.5 < value < 0', () => {
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -0.25);
      expect(word).toBe(`Somewhat ${VALUE_WORD_MAP[pair][1]}`);
    }
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, -0.49);
      expect(word).toBe(`Somewhat ${VALUE_WORD_MAP[pair][1]}`);
    }
  });

  it('handles edge case 0 as left (positive) side', () => {
    // 0 is >= 0, so positive side
    for (const pair of Object.keys(VALUE_WORD_MAP) as ValuePair[]) {
      const word = getValueWord(pair, 0);
      expect(word).toBe(`Somewhat ${VALUE_WORD_MAP[pair][0]}`);
    }
  });
});

describe('REPUTATION_WORDS', () => {
  it('exports reputation tier words', () => {
    expect(REPUTATION_WORDS.length).toBeGreaterThan(0);
  });

  it('has correct tier order', () => {
    expect(REPUTATION_WORDS).toEqual([
      'Distrusted', 'Unknown', 'Accepted', 'Respected', 'Revered',
    ]);
  });

  it('all words are non-empty strings', () => {
    for (const word of REPUTATION_WORDS) {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });
});

describe('getReputationWord', () => {
  it('returns tier 0 for value 0.0', () => {
    expect(getReputationWord(0.0)).toBe(REPUTATION_WORDS[0]);
  });

  it('returns tier 0 for value 0.1', () => {
    expect(getReputationWord(0.1)).toBe(REPUTATION_WORDS[0]);
  });

  it('returns tier 1 for value 0.25', () => {
    expect(getReputationWord(0.25)).toBe(REPUTATION_WORDS[1]);
  });

  it('returns tier 2 for value 0.5', () => {
    expect(getReputationWord(0.5)).toBe(REPUTATION_WORDS[2]);
  });

  it('returns tier 3 for value 0.75', () => {
    expect(getReputationWord(0.75)).toBe(REPUTATION_WORDS[3]);
  });

  it('returns tier 4 for value 1.0', () => {
    expect(getReputationWord(1.0)).toBe(REPUTATION_WORDS[4]);
  });

  it('clamps negative values to tier 0', () => {
    expect(getReputationWord(-0.5)).toBe(REPUTATION_WORDS[0]);
  });

  it('clamps values > 1.0 to tier 4', () => {
    expect(getReputationWord(1.5)).toBe(REPUTATION_WORDS[4]);
  });

  it('maps value ranges correctly across all tiers', () => {
    expect(getReputationWord(0.0)).toBe(REPUTATION_WORDS[0]); // tier 0
    expect(getReputationWord(0.2)).toBe(REPUTATION_WORDS[1]); // tier 1
    expect(getReputationWord(0.4)).toBe(REPUTATION_WORDS[2]); // tier 2
    expect(getReputationWord(0.6)).toBe(REPUTATION_WORDS[3]); // tier 3
    expect(getReputationWord(0.8)).toBe(REPUTATION_WORDS[4]); // tier 4
  });
});

describe('BOND_STRENGTH_WORDS', () => {
  it('exports bond strength tier words', () => {
    expect(BOND_STRENGTH_WORDS.length).toBeGreaterThan(0);
  });

  it('has correct tier order', () => {
    expect(BOND_STRENGTH_WORDS).toEqual([
      'Fragile', 'Growing', 'Strong', 'Deep', 'Unbreakable',
    ]);
  });

  it('all words are non-empty strings', () => {
    for (const word of BOND_STRENGTH_WORDS) {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });
});

describe('getBondStrengthWord', () => {
  it('returns tier 0 for value 0.0', () => {
    expect(getBondStrengthWord(0.0)).toBe(BOND_STRENGTH_WORDS[0]);
  });

  it('returns tier 0 for value 0.1', () => {
    expect(getBondStrengthWord(0.1)).toBe(BOND_STRENGTH_WORDS[0]);
  });

  it('returns tier 1 for value 0.25', () => {
    expect(getBondStrengthWord(0.25)).toBe(BOND_STRENGTH_WORDS[1]);
  });

  it('returns tier 2 for value 0.5', () => {
    expect(getBondStrengthWord(0.5)).toBe(BOND_STRENGTH_WORDS[2]);
  });

  it('returns tier 3 for value 0.75', () => {
    expect(getBondStrengthWord(0.75)).toBe(BOND_STRENGTH_WORDS[3]);
  });

  it('returns tier 4 for value 1.0', () => {
    expect(getBondStrengthWord(1.0)).toBe(BOND_STRENGTH_WORDS[4]);
  });

  it('clamps negative values to tier 0', () => {
    expect(getBondStrengthWord(-0.5)).toBe(BOND_STRENGTH_WORDS[0]);
  });

  it('clamps values > 1.0 to tier 4', () => {
    expect(getBondStrengthWord(1.5)).toBe(BOND_STRENGTH_WORDS[4]);
  });

  it('maps value ranges correctly across all tiers', () => {
    expect(getBondStrengthWord(0.0)).toBe(BOND_STRENGTH_WORDS[0]); // tier 0
    expect(getBondStrengthWord(0.2)).toBe(BOND_STRENGTH_WORDS[1]); // tier 1
    expect(getBondStrengthWord(0.4)).toBe(BOND_STRENGTH_WORDS[2]); // tier 2
    expect(getBondStrengthWord(0.6)).toBe(BOND_STRENGTH_WORDS[3]); // tier 3
    expect(getBondStrengthWord(0.8)).toBe(BOND_STRENGTH_WORDS[4]); // tier 4
  });
});

/**
 * THR-1070 — the duration scale that replaced the light-tier tick numeral.
 *
 * The band words are prose and may be retuned freely; what these pin is the
 * structure, because the failure this scale exists to prevent is a numeral
 * reaching a mortal-facing surface (Law 13), not a particular adjective.
 */
describe('getDurationWord', () => {
  it('bands the live range without ever yielding a numeral', () => {
    for (let ticks = 1; ticks <= RETINUE_VIGNETTE_TIMEOUT; ticks++) {
      const word = getDurationWord(ticks);
      expect(DURATION_WORDS).toContain(word);
      expect(word).not.toMatch(/\d/);
    }
  });

  it('maps each band at its boundaries', () => {
    expect(getDurationWord(1)).toBe(DURATION_WORDS[0]);
    expect(getDurationWord(2)).toBe(DURATION_WORDS[0]);
    expect(getDurationWord(3)).toBe(DURATION_WORDS[1]);
    expect(getDurationWord(5)).toBe(DURATION_WORDS[1]);
    expect(getDurationWord(6)).toBe(DURATION_WORDS[2]);
    expect(getDurationWord(RETINUE_VIGNETTE_TIMEOUT)).toBe(DURATION_WORDS[2]);
  });

  it('is open-ended above the timeout rather than falling off the scale', () => {
    expect(getDurationWord(RETINUE_VIGNETTE_TIMEOUT * 10)).toBe(
      DURATION_WORDS[DURATION_WORDS.length - 1],
    );
  });

  /**
   * The caller owns the zero case ("auto-resolving now" — THR-1068), so zero
   * and below are out of contract. Fail-soft per NFP #4: the nearest band, not
   * a throw and never `undefined` rendering as a blank strip.
   */
  it('fail-softs at and below zero instead of throwing', () => {
    expect(getDurationWord(0)).toBe(DURATION_WORDS[0]);
    expect(getDurationWord(-37)).toBe(DURATION_WORDS[0]);
  });

  it('keeps one threshold per band boundary so no word is unreachable', () => {
    expect(DURATION_BAND_MAX_TICKS.length).toBe(DURATION_WORDS.length - 1);
    const ascending = [...DURATION_BAND_MAX_TICKS].every(
      (max, i) => i === 0 || max > DURATION_BAND_MAX_TICKS[i - 1],
    );
    expect(ascending).toBe(true);
    // Every band is actually reachable from some tick in the live range.
    const reached = new Set(
      Array.from({ length: RETINUE_VIGNETTE_TIMEOUT }, (_, i) => getDurationWord(i + 1)),
    );
    expect(reached.size).toBe(DURATION_WORDS.length);
  });
});
